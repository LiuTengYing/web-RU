import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { Menu, X, Search, Globe, Grid, BookOpen, User, Music, Download, MapPin, MessageSquare, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import SearchBar from '@/components/SearchBar'
import EmbeddedMap from '@/components/EmbeddedMap'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import { cn } from '@/utils/cn'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { getContactInfo, ContactInfo } from '@/services/contactService'
import { getAnnouncement, isAnnouncementClosed, Announcement } from '@/services/announcementService'

const Layout: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { siteSettings } = useSiteSettings()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mapCoords] = useState({ lat: 23.1945, lng: 113.2718 })
  const languageRef = useRef<HTMLDivElement>(null)
  
  // 公告状态
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [showAnnouncement, setShowAnnouncement] = useState(false)

  // Navigation menu items - 在渲染时动态获取翻译
  const navigation = [
    { name: t('navigation.dashboard'), href: '/', icon: Grid },
    { name: t('navigation.knowledge'), href: '/knowledge', icon: BookOpen },
    { name: t('navigation.forum'), href: '/forum', icon: MessageSquare },
    { name: t('navigation.softwareDownloads'), href: '/software-downloads', icon: Download },
    { name: t('navigation.audioEqualizer'), href: '/audio-equalizer', icon: Music },
    { name: t('navigation.contact'), href: '/contact', icon: User },
  ]

  // 处理导航
  const handleNavigation = (href: string) => {
    navigate(href)
    setSidebarOpen(false)
  }

  // 切换语言
  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh'
    i18n.changeLanguage(newLang)
    setLanguageOpen(false)
  }

  // 点击外部区域关闭语言选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setLanguageOpen(false)
      }
    }

    if (languageOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [languageOpen])

  // 路由变化时自动滚动到页面顶部
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // 加载公告
  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        const data = await getAnnouncement()
        if (data && data.enabled && !isAnnouncementClosed()) {
          setAnnouncement(data)
          setShowAnnouncement(true)
        }
      } catch (error) {
        console.error('加载公告失败:', error)
      }
    }
    loadAnnouncement()
  }, [])

  // 加载联系信息
  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const info = await getContactInfo()
        setContactInfo(info.filter(item => item.isActive))
        
        // 提取地址信息获取坐标（如果有地理位置）
        const addressInfo = info.find(item => item.type === 'address')
        if (addressInfo) {
          // 这里可以根据地址获取坐标，现在保持默认值
          // 如果需要，可以添加地理编码功能
        }
      } catch (error) {
        console.error('Failed to load contact info:', error)
      }
    }
    loadContactInfo()
  }, [])

  // 监听滚动事件，显示/隐藏"回到顶部"按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 回到顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }



  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* 公告横幅 */}
      {showAnnouncement && announcement && (
        <AnnouncementBanner
          announcement={announcement}
          onClose={() => setShowAnnouncement(false)}
        />
      )}
      
      {/* 顶部导航栏 */}
      <header className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700/50 sticky top-0 z-50">
        <div className="w-full max-w-full px-4 sm:px-6 md:px-8">
          {/* Logo和导航行 */}
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <div className="logo-container">
                <div className="logo-rainbow-border"></div>
                <div className="logo-glass">
                  {siteSettings.logoText || t('layout.logo')}
                </div>
              </div>
            </div>

            {/* 桌面端导航菜单 */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* 右侧工具区 */}
            <div className="flex items-center space-x-4">
              {/* 搜索栏 */}
              <div className="hidden md:block w-64">
                <SearchBar 
                  onResultClick={(result) => {
                    navigate(result.href)
                  }}
                />
              </div>

              {/* 移动端搜索按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden text-gray-400 hover:text-white hover:bg-gray-700"
                title={t('search.placeholder')}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* 语言切换 */}
              <div className="relative z-50" ref={languageRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLanguageOpen(!languageOpen)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 transition-colors px-3 py-2 flex items-center"
                  title={t('layout.languageSwitch')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium hidden sm:inline">{i18n.language === 'zh' ? t('languages.zh') : t('languages.en')}</span>
                </Button>
                
                {languageOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-gray-800 rounded-md shadow-lg border border-gray-700 py-1 z-50">
                    <button
                      onClick={toggleLanguage}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-sm"
                    >
                      {i18n.language === 'zh' ? t('languages.en') : t('languages.zh')}
                    </button>
                  </div>
                )}
              </div>

              {/* 移动端菜单按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* 移动端搜索栏 */}
          {mobileSearchOpen && (
            <div className="md:hidden pb-4">
              <SearchBar 
                onResultClick={(result) => {
                  navigate(result.href)
                  setMobileSearchOpen(false)
                }}
              />
            </div>
          )}
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 bg-gray-900 relative">
        <Outlet />
        
        {/* 页脚 - 包含地图和公司信息 */}
        <footer className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border-t border-gray-700/50 mt-12">
          {/* 主要页脚内容 */}
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              {/* 公司信息 - 从API动态加载 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  {t('layout.footer.contactInfo')}
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div>
                    <span className="font-medium text-white">{siteSettings.logoText || t('layout.logo')}</span>
                  </div>
                  
                  {/* 动态显示联系信息 */}
                  {contactInfo.length > 0 ? (
                    <div className="space-y-2">
                      {contactInfo.map((info) => (
                        <div key={info.id} className="flex items-start gap-2">
                          {info.type === 'address' && <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                          {info.type === 'phone' && <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                          {info.type === 'email' && <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                          {info.type === 'whatsapp' && <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                          {info.type === 'online' && <Globe className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                          <span>{info.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{t('layout.footer.address')}</span>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <span className="text-xs text-gray-500">{t('layout.footer.taglineBottom')}</span>
                  </div>
                </div>
              </div>

              {/* 快速链接 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('layout.footer.quickLinks')}</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => navigate('/knowledge')}
                    className="block text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {t('navigation.knowledge')}
                  </button>
                  <button 
                    onClick={() => navigate('/software-downloads')}
                    className="block text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {t('navigation.softwareDownloads')}
                  </button>
                  <button 
                    onClick={() => navigate('/audio-equalizer')}
                    className="block text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {t('navigation.audioEqualizer')}
                  </button>
                  <button 
                    onClick={() => navigate('/contact')}
                    className="block text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {t('navigation.contact')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 地图 - 全宽铺满页脚底部 */}
          <div className="w-full">
            <EmbeddedMap
              lat={mapCoords.lat}
              lng={mapCoords.lng}
              zoom={15}
              height="300px"
              companyName={siteSettings.logoText || t('layout.logo')}
              address={contactInfo.find(c => c.type === 'address')?.value || t('layout.footer.address')}
              className="w-full"
            />
          </div>

          {/* 底部容器 */}
          <div className="container mx-auto px-4">

            {/* 底部版权和法律链接 */}
            <div className="border-t border-gray-700/50 pt-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-400">
                  {t('layout.footer.copyright', { siteName: siteSettings.logoText || t('layout.logo') })} • {new Date().getFullYear()}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{t('layout.footer.tagline')}</span>
                  <button 
                    onClick={() => navigate('/privacy')}
                    className="hover:text-gray-300 transition-colors"
                  >
                    {t('layout.footer.privacy')}
                  </button>
                  <span>•</span>
                  <button 
                    onClick={() => navigate('/terms')}
                    className="hover:text-gray-300 transition-colors"
                  >
                    {t('layout.footer.terms')}
                  </button>
                  <span>•</span>
                  <button 
                    onClick={() => navigate('/disclaimer')}
                    className="hover:text-gray-300 transition-colors"
                  >
                    {t('layout.footer.disclaimer')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* 回到顶部浮动按钮 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-110"
          title={t('layout.scrollToTop')}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* 移动端侧边栏菜单 */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out',
        'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900',
        'backdrop-blur-xl border-r border-gray-700/50',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full p-6">
          {/* 关闭按钮 */}
          <div className="flex items-center justify-between mb-6">
            <div className="logo-container">
              <div className="logo-rainbow-border"></div>
              <div className="logo-glass">
                {siteSettings.logoText || t('layout.logo')}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* 移动端导航菜单 */}
          <nav className="flex-1">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'group flex w-full items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout 