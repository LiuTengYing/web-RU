import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, Globe, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

interface TimeZone {
  name: string
  timezone: string
  flag: string
  businessHours: { start: number, end: number } // 24小时制
}

const timeZones: TimeZone[] = [
  {
    name: 'China',
    timezone: 'Asia/Shanghai',
    flag: '🇨🇳',
    businessHours: { start: 9, end: 18 }
  },
  {
    name: 'US Eastern',
    timezone: 'America/New_York',
    flag: '🇺🇸',
    businessHours: { start: 9, end: 17 }
  },
  {
    name: 'US Pacific',
    timezone: 'America/Los_Angeles', 
    flag: '🇺🇸',
    businessHours: { start: 9, end: 17 }
  }
]

interface WorldTimeDisplayProps {
  className?: string
  showBusinessHours?: boolean
}

const WorldTimeDisplay: React.FC<WorldTimeDisplayProps> = ({ 
  className = '',
  showBusinessHours = true 
}) => {
  const { t } = useTranslation()
  const [currentTimes, setCurrentTimes] = useState<Map<string, Date>>(new Map())

  // 更新所有时区的时间
  const updateTimes = () => {
    const newTimes = new Map<string, Date>()
    timeZones.forEach(tz => {
      const now = new Date()
      newTimes.set(tz.timezone, now)
    })
    setCurrentTimes(newTimes)
  }

  // 格式化时间
  const formatTime = (date: Date, timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date)
  }

  // 格式化日期
  const formatDate = (date: Date, timezone: string, locale: string = 'zh-CN') => {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    }).format(date)
  }

  // 检查是否在中国工作时间内（所有时区统一以中国时间为准）
  const isBusinessHours = (date: Date) => {
    // 获取中国时间的小时数
    const chinaHour = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })).getHours()
    // 中国工作时间 09:00-18:00
    return chinaHour >= 9 && chinaHour < 18
  }

  // 获取工作状态（统一以中国时间为准）
  const getBusinessStatus = (date: Date) => {
    const isOpen = isBusinessHours(date)
    return {
      isOpen,
      text: isOpen ? t('contact.time.online') : t('contact.time.offline'),
      color: isOpen ? 'text-green-400' : 'text-gray-400'
    }
  }

  useEffect(() => {
    // 立即更新一次
    updateTimes()
    
    // 每秒更新时间
    const interval = setInterval(updateTimes, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className={`bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {t('contact.time.worldTime')}
            </h3>
            <p className="text-sm text-gray-400">
              {t('contact.time.currentTime')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {timeZones.map((tz) => {
            const currentTime = currentTimes.get(tz.timezone)
            if (!currentTime) return null

            const timeString = formatTime(currentTime, tz.timezone)
            const dateString = formatDate(currentTime, tz.timezone, 
              tz.timezone === 'Asia/Shanghai' ? 'zh-CN' : 'en-US'
            )
            const status = showBusinessHours ? getBusinessStatus(currentTime) : null

            return (
              <div 
                key={tz.timezone}
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-gray-700/30 to-gray-600/30 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{tz.flag}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">
                        {t(`contact.time.zones.${tz.name.toLowerCase().replace(' ', '')}`)}
                      </span>
                      {status && showBusinessHours && (
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                          <span className={`text-xs ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{dateString}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-xl font-mono text-white">{timeString}</span>
                  </div>
                  {status && showBusinessHours && (
                    <p className="text-xs text-gray-400 mt-1">
                      {t('contact.time.businessHours', { 
                        start: String(tz.businessHours.start).padStart(2, '0') + ':00',
                        end: String(tz.businessHours.end).padStart(2, '0') + ':00'
                      })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 客服状态总览 */}
        {showBusinessHours && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-blue-400" />
              <div>
                <h4 className="text-white font-medium">{t('contact.time.customerService')}</h4>
                <p className="text-sm text-gray-300">
                  {t('contact.time.serviceDescription')}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WorldTimeDisplay
