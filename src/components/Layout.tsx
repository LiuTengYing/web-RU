import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { Menu, X, Search, Globe, Grid, BookOpen, User, Music, Download, MapPin, MessageSquare, ArrowUp, FileText, Settings, Send, Share2, Video } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import SearchBar from '@/components/SearchBar'
import EmbeddedMap from '@/components/EmbeddedMap'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import { cn } from '@/utils/cn'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { getContactInfo, ContactInfo } from '@/services/contactService'
import { getAnnouncement, isAnnouncementClosed, Announcement } from '@/services/announcementService'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigation } from '@/hooks/useNavigation'

const Layout: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { siteSettings } = useSiteSettings()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mapCoords] = useState({ lat: 22.8110, lng: 114.1072 })
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const languageRef = useRef<HTMLDivElement>(null)
  
  // 使用 useMemo 缓存 userRoles 数组,避免每次都创建新数组导致无限循环
  const userRoles = useMemo(() => user?.roles || [], [user?.roles])
  const { navigation: navigationItems, loading: navLoading } = useNavigation(userRoles)
  
  // 公告状态
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [showAnnouncement, setShowAnnouncement] = useState(false)



  // 处理导航
  const handleNavigation = (href: string) => {
    // 忽略 # 锚点链接
    if (href === '#' || href === '') {
      return
    }
    
    // 如果已经在目标页面,先导航到根路径再返回(强制刷新)
    if (location.pathname === href) {
      navigate('/')
      setTimeout(() => {
        navigate(href)
      }, 10)
      return
    }
    
    navigate(href, { replace: false })
    setSidebarOpen(false)
    setOpenDropdown(null)
    
    // 强制滚动到顶部
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  // 切换语言
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    setLanguageOpen(false)
  }

  // 获取当前语言显示名称
  const getCurrentLanguageName = () => {
    const langMap: { [key: string]: string } = {
      'ru': 'Русский',
      'zh': '中文',
      'en': 'English'
    }
    return langMap[i18n.language] || langMap['ru']
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
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* 公告横幅 */}
      {showAnnouncement && announcement && (
        <AnnouncementBanner
          announcement={announcement}
          onClose={() => setShowAnnouncement(false)}
        />
      )}
      
      {/* 顶部导航栏 */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-50 shadow-lg shadow-black/20">
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
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href
                const hasChildren = item.children && item.children.length > 0
                
                // 如果有子菜单，渲染下拉菜单
                if (hasChildren) {
                  return (
                    <div 
                      key={item.name}
                      className="relative group/dropdown"
                      onMouseEnter={() => setOpenDropdown(item.name)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        onClick={() => {
                          // 点击父菜单时导航到第一个子菜单项
                          if (item.children && item.children.length > 0) {
                            handleNavigation(item.children[0].href)
                          }
                        }}
                        className={cn(
                          'group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative',
                          'text-gray-200 hover:bg-white/10 hover:text-white backdrop-blur-sm'
                        )}
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        <span>{t(item.translationKey)}</span>
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* 下拉菜单 - 添加 pt-2 使下拉菜单与按钮之间没有间隙 */}
                      {openDropdown === item.name && (
                        <div className="absolute left-0 pt-2 z-50">
                          <div className="w-48 bg-slate-800/95 backdrop-blur-xl rounded-lg shadow-2xl border border-teal-600/40 py-2">
                            {item.children!.map((child) => {
                              const childIsActive = location.pathname === child.href
                              return (
                                <button
                                  key={child.name}
                                  onClick={() => {
                                    handleNavigation(child.href)
                                    setOpenDropdown(null)
                                  }}
                                  className={cn(
                                    'w-full flex items-center px-4 py-2 text-sm transition-colors',
                                    childIsActive
                                      ? 'bg-teal-600 text-white'
                                      : 'text-gray-100 hover:bg-white/10 hover:text-white'
                                  )}
                                >
                                  <child.icon className="h-4 w-4 mr-3" />
                                  <span>{t(child.translationKey)}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }
                
                // 没有子菜单的普通导航项
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative',
                      isActive
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                        : 'text-gray-200 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    <span>{t(item.translationKey)}</span>
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
                  <span className="text-sm font-medium hidden sm:inline">{getCurrentLanguageName()}</span>
                </Button>
                
                {languageOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-slate-900 rounded-md shadow-lg border border-teal-700/40 py-1 z-50">
                    {i18n.language !== 'ru' && (
                      <button
                        onClick={() => changeLanguage('ru')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        🇷🇺 Русский
                      </button>
                    )}
                    {i18n.language !== 'zh' && (
                      <button
                        onClick={() => changeLanguage('zh')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        🇨🇳 中文
                      </button>
                    )}
                    {i18n.language !== 'en' && (
                      <button
                        onClick={() => changeLanguage('en')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        🇬🇧 English
                      </button>
                    )}
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
      <main className="flex-1 bg-slate-950 relative">
        <Outlet />
        
        {/* 页脚 - 包含地图和公司信息 */}
        <footer className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border-t border-gray-700/50 mt-12">
          {/* 地图 - 全宽铺满页脚顶部 */}
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

          {/* 快速导航和版权信息 */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
              {/* 快速链接 */}
              <div className="flex flex-wrap gap-4 text-sm">
                <button 
                  onClick={() => navigate('/knowledge')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t('navigation.knowledge')}
                </button>
                <button 
                  onClick={() => navigate('/software-downloads')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t('navigation.softwareDownloads')}
                </button>
                <button 
                  onClick={() => navigate('/audio-equalizer')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t('navigation.audioEqualizer')}
                </button>
                <button 
                  onClick={() => navigate('/contact')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t('navigation.contact')}
                </button>
              </div>
            </div>

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
          className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-teal-500 to-teal-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl hover:from-teal-400 hover:to-teal-500 transition-all duration-300 transform hover:scale-110"
          title={t('layout.scrollToTop')}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* 移动端侧边栏菜单 */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out',
        'bg-slate-900/98 backdrop-blur-xl border-r border-teal-700/40 shadow-2xl',
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
          <nav className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href
                const hasChildren = item.children && item.children.length > 0
                
                // 如果有子菜单
                if (hasChildren) {
                  return (
                    <div key={item.name} className="space-y-1">
                      {/* 父级菜单项 */}
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {t(item.translationKey)}
                      </div>
                      {/* 子菜单项 */}
                      {item.children!.map((child) => {
                        const childIsActive = location.pathname === child.href
                        return (
                          <button
                            key={child.name}
                            onClick={() => handleNavigation(child.href)}
                            className={cn(
                              'group flex w-full items-center px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                              childIsActive
                                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                                : 'text-gray-300 hover:bg-slate-800/60 hover:text-white'
                            )}
                          >
                            <child.icon className="h-4 w-4 mr-3" />
                            <span>{t(child.translationKey)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )
                }
                
                // 没有子菜单的普通项
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'group flex w-full items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                        : 'text-gray-300 hover:bg-slate-800/60 hover:text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    <span>{t(item.translationKey)}</span>
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