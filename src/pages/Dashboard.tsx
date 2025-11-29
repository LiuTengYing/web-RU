import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronRight, 
  Wrench, 
  Shield, 
  Car, 
  ArrowRight,
  Star,
  Users,
  ChevronDown,
  BookOpen,
  FileText,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { imageService, HomepageImage } from '@/services/imageService'
import { getDocuments } from '@/services/documentApi'
import { getVehicles } from '@/services/vehicleService'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

// 默认图片配置 - 使用本地图片资源（放在组件内以获取翻译）
const createDefaultImages = (t: (k: string) => string): HomepageImage[] => [
  {
    id: 'hero-bg',
    name: 'Hero Background',
    url: '/images/hero.png',
    alt: t('dashboard.images.heroAlt'),
    type: 'hero',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'installation-scene',
    name: 'Installation Scene',
    url: '/images/install.png',
    alt: t('dashboard.images.installationAlt'),
    type: 'installation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// 图片错误处理组件
const ImageErrorFallback: React.FC<{ 
  type: 'hero' | 'installation' | 'vehicle'
  vehicleName?: string 
}> = ({ type, vehicleName }) => {
  const { t } = useTranslation()
  const getFallbackContent = () => {
    switch (type) {
      case 'hero':
        return (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-600">
                <div className="text-sm">{t('dashboard.images.heroNotLoaded')}</div>
                <div className="text-xs">{t('dashboard.images.checkImageSettings')}</div>
              </div>
            </div>
          </div>
        )
      case 'installation':
        return (
          <div className="w-full h-[500px] bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <p className="text-gray-400 text-lg font-medium">{t('dashboard.images.installationTitle')}</p>
            </div>
          </div>
        )
      case 'vehicle':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <div className="text-center">
              <Car className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">{vehicleName || t('dashboard.images.vehicle')}</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return getFallbackContent()
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const { siteSettings } = useSiteSettings()
  const navigate = useNavigate()
  
  // 图片状态管理
  const [heroImage, setHeroImage] = useState<HomepageImage | undefined>()
  const [installationImage, setInstallationImage] = useState<HomepageImage | undefined>()
  const [vehicleImages, setVehicleImages] = useState<Array<{ id: string; url: string; title: string; vehicle: string }>>([])
  
  // 注：统计数据已移除 - 只显示卡片，不显示数字

  // 加载图片数据
  const loadImages = useCallback(async () => {
    try {
      // 加载Hero和Installation图片（使用本地资源）
      const images = await imageService.getImages()
      const hero = images.find(img => img.id === 'hero-bg')
      const installation = images.find(img => img.id === 'installation-scene')
      
      const defaults = createDefaultImages(t)
      setHeroImage(hero || defaults.find(img => img.id === 'hero-bg'))
      setInstallationImage(installation || defaults.find(img => img.id === 'installation-scene'))
      
      // 从结构化文章中获取车辆外观图
      try {
        // 获取更多文档以便排序和筛选
        const response = await getDocuments({ documentType: 'structured', status: 'published', limit: 100 })
        const structuredArticles = response.documents.filter((doc: any) => 
          doc.documentType === 'structured' && (doc.basicInfo?.vehicleImage || doc.vehicleImage)
        )
        
        // 智能排序策略：优先按浏览量（最热门），然后按更新时间（最新的）
        structuredArticles.sort((a: any, b: any) => {
          // 首先按浏览量排序（降序）
          const aViews = a.views || 0
          const bViews = b.views || 0
          if (bViews !== aViews) {
            return bViews - aViews // 浏览量高的在前
          }
          
          // 浏览量相同则按更新时间排序（最新的在前）
          const aTime = new Date(a.updatedAt || a.createdAt || a.publishedAt || 0).getTime()
          const bTime = new Date(b.updatedAt || b.createdAt || b.publishedAt || 0).getTime()
          return bTime - aTime
        })
        
        // 提取车辆外观图，限制最多显示6个（最热门的6个）
        const vehicleImgs = structuredArticles.slice(0, 6).map((doc: any) => ({
          id: doc._id || doc.id,
          url: doc.basicInfo?.vehicleImage || doc.vehicleImage || '',
          title: doc.title || '',
          vehicle: doc.basicInfo ? 
            `${doc.basicInfo.brand} ${doc.basicInfo.model} ${doc.basicInfo.yearRange}` :
            (doc.category || `${doc.brand || ''} ${doc.model || ''} ${doc.yearRange || ''}`.trim() || 'Unknown Vehicle')
        }))
        
        setVehicleImages(vehicleImgs)
      } catch (docError) {
        console.error('Failed to load vehicle images from API:', docError)
        setVehicleImages([])
      }
    } catch (error) {
      console.error('Failed to load images:', error)
      // 使用默认图片作为fallback
      const defaults = createDefaultImages(t)
      setHeroImage(defaults.find(img => img.id === 'hero-bg'))
      setInstallationImage(defaults.find(img => img.id === 'installation-scene'))
      setVehicleImages([])
    }
  }, [])

  // 组件挂载时加载图片
  useEffect(() => {
    loadImages()
  }, [loadImages])

  // 监听图片更新事件，重新加载图片
  useEffect(() => {
    const handleImagesUpdated = () => {
      loadImages()
    }

    // 监听图片更新事件
    window.addEventListener('homepageImagesUpdated', handleImagesUpdated)

    return () => {
      window.removeEventListener('homepageImagesUpdated', handleImagesUpdated)
    }
  }, [loadImages])

  return (
    <div className="w-full h-full">
      {/* 区块 1：专业Hero Section */}
      <section 
        className="relative w-full min-h-screen overflow-hidden"
        style={heroImage ? {
          backgroundImage: `url(${heroImage.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        } : undefined}
      >
        {/* Hero背景图 - 铺满并完整显示 */}
        {!heroImage && <ImageErrorFallback type="hero" />}
        
        {/* 移除动态背景元素，避免遮挡hero背景图 */}
        
        {/* 标题和副标题 - 增强版 */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
          <div className="text-center space-y-8 animate-fade-in">
            {/* 闪亮徽章 - 透明边框样式 */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-white/50 text-white text-sm font-medium backdrop-blur-md shadow-lg hover:bg-white/10 transition-all duration-300 animate-bounce-slow">
              <Sparkles className="h-4 w-4" />
              <span>{t('dashboard.badges.professional')}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white drop-shadow-2xl">
              {siteSettings.heroTitle || t('layout.logo')}
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-white/90 drop-shadow-lg">
              {siteSettings.heroSubtitle || t('dashboard.subtitle')}
            </p>
            
            {/* CTA按钮组 - 统一透明边框样式 */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white/50 text-white backdrop-blur-md hover:bg-white/10 px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
                onClick={() => navigate('/knowledge')}
              >
                <BookOpen className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                <span>{t('dashboard.cta.exploreNow')}</span>
                <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white/50 text-white backdrop-blur-md hover:bg-white/10 px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                onClick={() => navigate('/contact')}
              >
                <span>{t('dashboard.cta.contactUs')}</span>
              </Button>
            </div>
          </div>
          
          {/* 滚动提示动画 */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer"
              onClick={() => document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="text-sm font-medium">{t('dashboard.scrollToExplore')}</span>
              <ChevronDown className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        {/* 底部渐变过渡 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900 pointer-events-none z-20"></div>
      </section>

      {/* 数据统计区块 - 新增 */}
      <section id="stats-section" className="py-20 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 车型 */}
            <div className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Car className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-lg font-medium">{t('dashboard.stats.vehicleModels')}</p>
                <p className="text-gray-500 text-sm mt-2">{t('dashboard.stats.coveringMajorBrands')}</p>
              </div>
            </div>

            {/* 文档 */}
            <div className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 hover:border-green-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-lg font-medium">{t('dashboard.stats.technicalDocuments')}</p>
                <p className="text-gray-500 text-sm mt-2">{t('dashboard.stats.continuouslyUpdating')}</p>
              </div>
            </div>

            {/* 专业用户 */}
            <div className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-lg font-medium">{t('dashboard.stats.professionalUsers')}</p>
                <p className="text-gray-500 text-sm mt-2">{t('dashboard.stats.trustedChoice')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 区块 2：建立初衷 / 核心价值 - 左右布局 */}
      <section id="why-establish" className="py-24 bg-gradient-to-b from-gray-800 via-gray-900 to-gray-900 relative">
        {/* 顶部渐变过渡 */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-gray-900 to-transparent pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6">
          {/* 左右布局：图片在左，内容在右 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* 左侧：安装场景图 */}
            {installationImage && (
              <div className="relative group">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl group-hover:shadow-3xl transition-all duration-500">
                  <img 
                    src={installationImage.url} 
                    alt={installationImage.alt}
                    className="w-full h-full min-h-[500px] object-cover rounded-2xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                  {/* 图片遮罩效果 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            )}

            {/* 右侧：文字和透明卡片 */}
            <div className="space-y-8">
              {/* 标题区域 */}
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-blue-100 leading-tight mb-6">
                  {t('dashboard.whyEstablish.title')}
                </h2>
                <p className="text-xl text-blue-200 leading-relaxed mb-8">
                  {t('dashboard.whyEstablish.intro')}
                </p>
              </div>

              {/* 核心功能卡片 */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="group flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Wrench className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-blue-200 font-medium text-center text-sm">{t('dashboard.features.professionalInstallation')}</p>
                </div>
                <div className="group flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm hover:border-green-500/50 transition-all duration-300 hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-blue-200 font-medium text-center text-sm">{t('dashboard.features.reliableSupport')}</p>
                </div>
                <div className="group flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Car className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-blue-200 font-medium text-center text-sm">{t('dashboard.features.wideCoverage')}</p>
                </div>
              </div>

              {/* 常见问题 */}
              <div>
                <h3 className="text-2xl font-semibold text-white mb-6">{t('dashboard.whyEstablish.problems.title')}</h3>
                <div className="space-y-4 mb-6">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-800/50 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300 leading-relaxed text-sm">{t('dashboard.whyEstablish.problems.scattered')}</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-800/50 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300 leading-relaxed text-sm">{t('dashboard.whyEstablish.problems.compatibility')}</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-800/50 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300 leading-relaxed text-sm">{t('dashboard.whyEstablish.problems.differences')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 解决方案 */}
              <div>
                <p className="text-lg text-blue-200 leading-relaxed">
                  {t('dashboard.whyEstablish.solution')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 区块 3：车型展示 / 知识库引导 - 只在有车辆图片时显示 */}
      {vehicleImages.length > 0 && (
        <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                {t('dashboard.contentPreview.title')}
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                {t('dashboard.exploreLibrary')}
              </p>
            </div>

            {/* 车型展示卡片 */}
            <div className="grid md:grid-cols-3 gap-8 mb-20">
              {vehicleImages.map((vehicle) => (
                <div key={vehicle.id} className="group bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-600/50 backdrop-blur-sm cursor-pointer"
                  onClick={() => navigate(`/knowledge?vehicle=${encodeURIComponent(vehicle.vehicle)}`)}>
                  <div className="h-56 bg-gray-700 overflow-hidden relative">
                    <img 
                      src={vehicle.url} 
                      alt={vehicle.title || vehicle.vehicle}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    {/* 图片遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {/* 车型标签 */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-blue-600/90 text-white text-sm font-medium rounded-full backdrop-blur-sm">
                        {vehicle.vehicle || t('dashboard.images.vehicle')}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-white mb-3">{vehicle.title || vehicle.vehicle}</h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">{vehicle.vehicle || t('dashboard.viewDetails')}</p>
                    
                    {/* 车型特点 */}
                    <div className="flex items-center space-x-4 mb-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        <span>{t('dashboard.badges.professionalFit')}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{t('dashboard.badges.userRecommended')}</span>
                      </div>
                    </div>
                    
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="w-full border-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 group-hover:border-blue-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/knowledge?vehicle=${encodeURIComponent(vehicle.vehicle)}`)
                      }}
                    >
                      <span className="mr-2">{t('dashboard.viewDetails')}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* 查看全部按钮 */}
            <div className="text-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-5 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/knowledge')}
            >
              <span className="mr-3">{t('dashboard.contentPreview.viewAll')}</span>
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </section>
      )}

    </div>
  )
}

export default Dashboard 