import React from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Info, AlertTriangle, CheckCircle, Download, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface AnnouncementManagerProps {
  announcementContent: string
  setAnnouncementContent: (content: string) => void
  announcementEnabled: boolean
  announcementType: 'info' | 'warning' | 'danger' | 'success'
  setAnnouncementType: (type: 'info' | 'warning' | 'danger' | 'success') => void
  announcementFontSize: 'sm' | 'md' | 'lg'
  setAnnouncementFontSize: (size: 'sm' | 'md' | 'lg') => void
  announcementFontWeight: 'normal' | 'bold'
  setAnnouncementFontWeight: (weight: 'normal' | 'bold') => void
  announcementFontStyle: 'normal' | 'italic'
  setAnnouncementFontStyle: (style: 'normal' | 'italic') => void
  announcementTextColor: string
  setAnnouncementTextColor: (color: string) => void
  announcementScrolling: boolean
  setAnnouncementScrolling: (scrolling: boolean) => void
  announcementCloseable: boolean
  setAnnouncementCloseable: (closeable: boolean) => void
  announcementRememberDays: number
  setAnnouncementRememberDays: (days: number) => void
  handleToggleAnnouncement: () => void
  handleSaveAnnouncement: () => void
}

const AnnouncementManager: React.FC<AnnouncementManagerProps> = ({
  announcementContent,
  setAnnouncementContent,
  announcementEnabled,
  announcementType,
  setAnnouncementType,
  announcementFontSize,
  setAnnouncementFontSize,
  announcementFontWeight,
  setAnnouncementFontWeight,
  announcementFontStyle,
  setAnnouncementFontStyle,
  announcementTextColor,
  setAnnouncementTextColor,
  announcementScrolling,
  setAnnouncementScrolling,
  announcementCloseable,
  setAnnouncementCloseable,
  announcementRememberDays,
  setAnnouncementRememberDays,
  handleToggleAnnouncement,
  handleSaveAnnouncement
}) => {
  const { t } = useTranslation()
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('admin.announcement.title')}</h2>
          <p className="text-gray-400 mt-1">{t('admin.announcement.description')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">{t('admin.announcement.enableLabel')}:</span>
          <button
            onClick={handleToggleAnnouncement}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              announcementEnabled ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                announcementEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${announcementEnabled ? 'text-green-400' : 'text-gray-400'}`}>
            {announcementEnabled ? t('admin.announcement.enabled') : t('admin.announcement.disabled')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：配置区 */}
        <div className="space-y-6">
          {/* 横幅样式 */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">{t('admin.announcement.styleTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 主题选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">{t('admin.announcement.theme')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'info' as const, label: t('admin.announcement.themeInfo'), icon: Info, color: 'blue' },
                    { type: 'warning' as const, label: t('admin.announcement.themeWarning'), icon: AlertTriangle, color: 'orange' },
                    { type: 'danger' as const, label: t('admin.announcement.themeDanger'), icon: Bell, color: 'red' },
                    { type: 'success' as const, label: t('admin.announcement.themeSuccess'), icon: CheckCircle, color: 'green' }
                  ].map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      onClick={() => setAnnouncementType(type)}
                      className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        announcementType === type
                          ? `bg-${color}-600 border-${color}-500 text-white shadow-lg`
                          : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 文字格式 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.announcement.fontSize')}</label>
                  <select
                    value={announcementFontSize}
                    onChange={(e) => setAnnouncementFontSize(e.target.value as 'sm' | 'md' | 'lg')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="sm">{t('admin.announcement.fontSizeSmall')}</option>
                    <option value="md">{t('admin.announcement.fontSizeMedium')}</option>
                    <option value="lg">{t('admin.announcement.fontSizeLarge')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.announcement.fontWeight')}</label>
                  <select
                    value={announcementFontWeight}
                    onChange={(e) => setAnnouncementFontWeight(e.target.value as 'normal' | 'bold')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="normal">{t('admin.announcement.fontWeightNormal')}</option>
                    <option value="bold">{t('admin.announcement.fontWeightBold')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.announcement.fontStyle')}</label>
                  <select
                    value={announcementFontStyle}
                    onChange={(e) => setAnnouncementFontStyle(e.target.value as 'normal' | 'italic')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="normal">{t('admin.announcement.fontStyleNormal')}</option>
                    <option value="italic">{t('admin.announcement.fontStyleItalic')}</option>
                  </select>
                </div>
              </div>

              {/* 自定义颜色 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.announcement.customColor')}</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={announcementTextColor || '#ffffff'}
                    onChange={(e) => setAnnouncementTextColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={announcementTextColor}
                    onChange={(e) => setAnnouncementTextColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                  {announcementTextColor && (
                    <Button
                      variant="outline"
                      onClick={() => setAnnouncementTextColor('')}
                      className="border-gray-600"
                    >
                      {t('common.clear')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 行为设置 */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">{t('admin.announcement.behaviorTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">{t('admin.announcement.scrolling')}</label>
                  <p className="text-xs text-gray-500 mt-1">{t('admin.announcement.scrollingDesc')}</p>
                </div>
                <button
                  onClick={() => setAnnouncementScrolling(!announcementScrolling)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    announcementScrolling ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      announcementScrolling ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">{t('admin.announcement.closeable')}</label>
                  <p className="text-xs text-gray-500 mt-1">{t('admin.announcement.closeableDesc')}</p>
                </div>
                <button
                  onClick={() => setAnnouncementCloseable(!announcementCloseable)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    announcementCloseable ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      announcementCloseable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {announcementCloseable && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.announcement.rememberDays')}</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={announcementRememberDays}
                    onChange={(e) => setAnnouncementRememberDays(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('admin.announcement.rememberDaysDesc')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 内容编辑 */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">{t('admin.announcement.contentTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder={t('admin.announcement.contentPlaceholder')}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">{announcementContent.length} / 500 {t('admin.announcement.characters')}</p>
              </div>
            </CardContent>
          </Card>

          {/* 保存按钮 */}
          <Button
            onClick={handleSaveAnnouncement}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!announcementContent.trim()}
          >
            <Download className="h-4 w-4 mr-2" />
            {t('common.save')}
          </Button>
        </div>

        {/* 右侧：预览区 */}
        <div className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700 sticky top-6">
            <CardHeader>
              <CardTitle className="text-white">{t('admin.announcement.preview')}</CardTitle>
              <CardDescription className="text-gray-400">{t('admin.announcement.previewDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 预览横幅 */}
              {announcementContent && (
                <div className="rounded-lg overflow-hidden border-2 border-gray-600">
                  <div className={`bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-b-2 ${
                    announcementType === 'info' ? 'border-blue-500' :
                    announcementType === 'warning' ? 'border-orange-500' :
                    announcementType === 'danger' ? 'border-red-500' :
                    'border-green-500'
                  } py-3 px-4`}>
                    <div className="flex items-center space-x-3">
                      <div className={`${
                        announcementType === 'info' ? 'text-blue-500' :
                        announcementType === 'warning' ? 'text-orange-500' :
                        announcementType === 'danger' ? 'text-red-500' :
                        'text-green-500'
                      }`}>
                        {announcementType === 'info' && <Info className="h-4 w-4" />}
                        {announcementType === 'warning' && <AlertTriangle className="h-4 w-4" />}
                        {announcementType === 'danger' && <Bell className="h-4 w-4" />}
                        {announcementType === 'success' && <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p 
                          className={`${
                            announcementType === 'info' ? 'text-blue-400' :
                            announcementType === 'warning' ? 'text-orange-400' :
                            announcementType === 'danger' ? 'text-red-400' :
                            'text-green-400'
                          } ${
                            announcementFontSize === 'sm' ? 'text-sm' :
                            announcementFontSize === 'lg' ? 'text-lg' :
                            'text-base'
                          } ${
                            announcementFontWeight === 'bold' ? 'font-bold' : 'font-normal'
                          } ${
                            announcementFontStyle === 'italic' ? 'italic' : 'not-italic'
                          } ${announcementScrolling ? 'truncate' : 'line-clamp-2'}`}
                          style={announcementTextColor ? { color: announcementTextColor } : undefined}
                        >
                          {announcementContent}
                        </p>
                      </div>
                      {announcementCloseable && (
                        <button className={`p-1 hover:bg-gray-700/50 rounded-full ${
                          announcementType === 'info' ? 'text-blue-400' :
                          announcementType === 'warning' ? 'text-orange-400' :
                          announcementType === 'danger' ? 'text-red-400' :
                          'text-green-400'
                        }`}>
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!announcementContent && (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('admin.announcement.noContent')}</p>
                </div>
              )}

              {/* 说明 */}
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-200 space-y-2">
                    <p className="font-medium">{t('admin.announcement.tips')}:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                      <li>{t('admin.announcement.tip1')}</li>
                      <li>{t('admin.announcement.tip2')}</li>
                      <li>{t('admin.announcement.tip3')}</li>
                      <li>{t('admin.announcement.tip4')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementManager

