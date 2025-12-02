/**
 * Dashboard页面 - 重构版本
 * 遵循Clean Architecture原则：模块化、可扩展、职责分离
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { HeroSection } from '@/components/dashboard/HeroSection'

const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  // 导航处理
  const handleNavigate = (href: string) => {
    navigate(href)
  }
  
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
      {/* Hero区块 */}
      <HeroSection onNavigate={handleNavigate} />
      
      {/* 平滑过渡区 */}
      <div className="h-20 bg-gradient-to-b from-slate-900/0 via-slate-900/60 to-slate-900" />
      
      {/* 快速链接区块 - 科技风格 */}
      <section className="py-12 relative bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('dashboard.quickLinks.title')}
            </h2>
            <p className="text-lg text-gray-100">
              {t('dashboard.quickLinks.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { key: 'search', href: '/knowledge?tab=search', icon: '🔍' },
              { key: 'contact', href: '/contact', icon: '📞' },
              { key: 'download', href: '/software', icon: '⬇️' },
              { key: 'forum', href: '/forum', icon: '💬' }
            ].map((link) => (
              <button
                key={link.key}
                onClick={() => handleNavigate(link.href)}
                className="group relative p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-teal-300/60 shadow-xl hover:shadow-2xl hover:shadow-teal-400/30 transition-all duration-300 text-center hover:-translate-y-2 overflow-hidden"
              >
                {/* 悬浮光效 */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400/0 to-emerald-400/0 group-hover:from-teal-400/20 group-hover:to-emerald-400/20 transition-all duration-300" />
                
                {/* 内容 */}
                <div className="relative z-10">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {link.icon}
                  </div>
                  <div className="text-lg font-semibold text-white group-hover:text-teal-100 transition-colors duration-300">
                    {t(`dashboard.quickLinks.${link.key}`)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard