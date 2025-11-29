import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Car, XCircle, FileText, HelpCircle, Settings, LayoutGrid, List } from 'lucide-react'
import FeatureCard from '@/components/ui/FeatureCard'
import { AccordionItem } from '@/components/ui/Accordion'
import SupportedFeaturesDetail from '@/components/detail-pages/SupportedFeaturesDetail'
import CompatibleModelsDetail from '@/components/detail-pages/CompatibleModelsDetail'
import IncompatibleModelsDetail from '@/components/detail-pages/IncompatibleModelsDetail'
import FAQDetail from '@/components/detail-pages/FAQDetail'
import { Card, CardContent } from '@/components/ui/Card'
import ImageGallery, { GalleryImage } from '@/components/ImageGallery'
import DocumentFeedback from '@/components/DocumentFeedback'

interface StructuredDocumentViewerProps {
  document: any
  onBack: () => void
}

const StructuredDocumentViewer: React.FC<StructuredDocumentViewerProps> = ({ document, onBack }) => {
  const { t } = useTranslation()
  const [currentView, setCurrentView] = useState<'overview' | 'features' | 'compatible' | 'incompatible' | 'faqs'>('overview')
  const [viewMode, setViewMode] = useState<'card' | 'detailed'>('card') // 新增：卡片模式 vs 详细模式
  
  // 当视图切换时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentView, viewMode])
  
  // 图片画廊状态
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [initialImageIndex, setInitialImageIndex] = useState(0)

  // 打开图片画廊
  const openGallery = (imageUrl: string, altText: string) => {
    setGalleryImages([{
      url: imageUrl,
      alt: altText,
      title: document.title
    }])
    setInitialImageIndex(0)
    setGalleryOpen(true)
  }

  // 根据文档类型决定显示内容
  const isStructuredDocument = document.type === 'structured'
  const isArticleDocument = document.type === 'article'

  // 计算各模块的数量
  const supportedFeaturesCount = (document.supportedFeatures?.length || document.features?.supported?.length) || 0
  const unsupportedFeaturesCount = (document.unsupportedFeatures?.length || document.features?.unsupported?.length) || 0
  const compatibleModelsCount = document.compatibleModels?.length || 0
  const incompatibleModelsCount = document.incompatibleModels?.length || 0
  const faqsCount = document.faqs?.length || 0

  // 视图切换函数
  const handleViewChange = (view: 'overview' | 'features' | 'compatible' | 'incompatible' | 'faqs') => {
    setCurrentView(view)
  }

  const handleBackToOverview = () => {
    setCurrentView('overview')
  }

  // 根据当前视图渲染不同内容
  if (currentView === 'features') {
    return <SupportedFeaturesDetail document={document} onBack={handleBackToOverview} />
  }
  
  if (currentView === 'compatible') {
    return (
      <>
        <CompatibleModelsDetail document={document} onBack={handleBackToOverview} onImageClick={openGallery} />
        <ImageGallery
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          images={galleryImages}
          initialIndex={initialImageIndex}
        />
      </>
    )
  }
  
  if (currentView === 'incompatible') {
    return (
      <>
        <IncompatibleModelsDetail document={document} onBack={handleBackToOverview} onImageClick={openGallery} />
        <ImageGallery
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          images={galleryImages}
          initialIndex={initialImageIndex}
        />
      </>
    )
  }
  
  if (currentView === 'faqs') {
    return (
      <>
        <FAQDetail document={document} onBack={handleBackToOverview} onImageClick={openGallery} />
        <ImageGallery
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          images={galleryImages}
          initialIndex={initialImageIndex}
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* 文档头部信息 */}
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {document.title}
                </h3>
                <p className="text-gray-300 text-lg">
                  {isStructuredDocument 
                    ? `${document.brand} ${document.model} ${document.yearRange}`
                    : t('knowledge.vehicleResearch.title')
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 border-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 rounded-lg"
            >
              ← {t('knowledge.backToSelect')}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 视图模式切换（仅结构化文档显示） */}
      {isStructuredDocument && currentView === 'overview' && (
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-600/50 bg-gray-800/50 p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`px-6 py-2 rounded-md flex items-center space-x-2 transition-all duration-200 ${
                viewMode === 'card'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>{t('knowledge.viewMode.card')}</span>
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-6 py-2 rounded-md flex items-center space-x-2 transition-all duration-200 ${
                viewMode === 'detailed'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <List className="h-4 w-4" />
              <span>{t('knowledge.viewMode.detailed')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 文档信息 */}
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* 文档信息 */}
            <div className="flex items-center space-x-4 text-sm text-gray-400 border-b border-gray-600 pb-4">
              <span>{t('knowledge.author')}: {document.authorId?.username || document.author || t('knowledge.technicalTeam')}</span>
              <span>•</span>
              <span>{t('knowledge.uploadTime')}: {document.publishedAt ? new Date(document.publishedAt).toLocaleDateString('zh-CN') : document.createdAt ? new Date(document.createdAt).toLocaleDateString('zh-CN') : 'N/A'}</span>
              <span>•</span>
              <span>{t('knowledge.viewCount')}: {document.views || 0}</span>
              <span>•</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                isStructuredDocument 
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : isArticleDocument 
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                  : 'bg-green-600/20 text-green-300 border border-green-500/30'
              }`}>
                {isStructuredDocument 
                  ? t('knowledge.structuredDocument') 
                  : isArticleDocument 
                  ? t('knowledge.article') 
                  : t('knowledge.file')
                }
              </span>
            </div>

            {/* 文档摘要 */}
            {document.summary && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">{t('knowledge.summary')}</h4>
                <p className="text-gray-300 leading-relaxed">{document.summary}</p>
              </div>
            )}

            {/* 根据文档类型显示不同内容 */}
            {isStructuredDocument ? (
              // 结构化文档内容 - 基本信息
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">{t('knowledge.vehicleResearch.basicInfo')}</h4>
                
                {/* 基本信息 */}
                <div className="space-y-6 mb-6">
                  {/* 车辆外观图 */}
                  {(document.basicInfo?.vehicleImage || document.vehicleImage) && (
                    <div>
                      <h5 className="text-white text-sm font-medium mb-3">{t('knowledge.vehicleExteriorView')}</h5>
                      <div className="relative group">
                        <img 
                          src={document.basicInfo?.vehicleImage || document.vehicleImage} 
                          alt={t('knowledge.vehicleExteriorView')}
                          className="w-full max-w-3xl mx-auto rounded-xl shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform border border-white/10"
                          loading="lazy"
                          decoding="async"
                          onClick={() => openGallery(document.basicInfo?.vehicleImage || document.vehicleImage, t('knowledge.vehicleExteriorView'))}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
                      </div>
                      <p className="text-center text-gray-400 text-sm mt-3">
                        {t('knowledge.clickToViewFullImage')}
                      </p>
                    </div>
                  )}
                  
                  {/* 简介 */}
                  {(document.basicInfo?.introduction || document.introduction) && (
                    <div>
                      <h5 className="text-white text-sm font-medium mb-3">{t('knowledge.introduction')}</h5>
                      <div 
                        className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-strong:text-white"
                        dangerouslySetInnerHTML={{ __html: document.basicInfo?.introduction || document.introduction }}
                      />
                    </div>
                  )}
                  
                  {/* 重要提示 */}
                  {(document.basicInfo?.importantNotes || document.importantNotes) && (
                    <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-800/50 backdrop-blur-sm shadow-lg rounded-xl p-6">
                      <h5 className="text-red-300 text-sm font-medium mb-3 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {t('admin.structuredArticle.importantNotes')}
                      </h5>
                      <div 
                        className="prose prose-invert max-w-none prose-p:text-red-200 prose-headings:text-red-300 prose-strong:text-red-100"
                        dangerouslySetInnerHTML={{ __html: document.basicInfo?.importantNotes || document.importantNotes }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : isArticleDocument ? (
              // 富文本文档内容
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">{t('knowledge.documentContent')}</h4>
                <div 
                  className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: document.content || t('knowledge.noContent') }}
                />
              </div>
            ) : (
              // 文件文档内容
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t('knowledge.fileDocument')}
                </h3>
                <p className="text-gray-300">
                  {t('knowledge.fileDocumentDesc')}
                </p>
                <button 
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-300"
                >
                  {t('common.downloadFile')}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 功能模块 - 根据模式显示 */}
      {isStructuredDocument && (
        <div className="my-12">
          {viewMode === 'card' ? (
            /* 卡片模式 */
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 支持功能卡片 */}
            <FeatureCard
              title={t('knowledge.cardSections.supportedFeatures')}
              description={t('knowledge.cardSections.supportedFeaturesDesc')}
              count={supportedFeaturesCount + unsupportedFeaturesCount}
              countKey="knowledge.cardSections.supportedFeaturesCount"
              icon={<Settings className="h-6 w-6" />}
              onClick={() => handleViewChange('features')}
            />

            {/* 适配型号卡片 */}
            <FeatureCard
              title={t('knowledge.cardSections.compatibleModels')}
              description={t('knowledge.cardSections.compatibleModelsDesc')}
              count={compatibleModelsCount}
              countKey="knowledge.cardSections.compatibleModelsCount"
              icon={<Car className="h-6 w-6" />}
              onClick={() => handleViewChange('compatible')}
            />

            {/* 不适配型号卡片 */}
            <FeatureCard
              title={t('knowledge.cardSections.incompatibleModels')}
              description={t('knowledge.cardSections.incompatibleModelsDesc')}
              count={incompatibleModelsCount}
              countKey="knowledge.cardSections.incompatibleModelsCount"
              icon={<XCircle className="h-6 w-6" />}
              onClick={() => handleViewChange('incompatible')}
            />

            {/* 常见问题卡片 */}
            <FeatureCard
              title={t('knowledge.cardSections.faqs')}
              description={t('knowledge.cardSections.faqsDesc')}
              count={faqsCount}
              countKey="knowledge.cardSections.faqsCount"
              icon={<HelpCircle className="h-6 w-6" />}
              onClick={() => handleViewChange('faqs')}
            />
          </div>
          ) : (
            /* 详细模式 - 手风琴 */
            <div className="space-y-4">
              {/* 功能支持 */}
              <AccordionItem
                title={t('knowledge.cardSections.supportedFeatures')}
                icon={<Settings className="h-6 w-6" />}
                badge={`${supportedFeaturesCount + unsupportedFeaturesCount} ${t('common.items')}`}
                defaultOpen={false}
              >
                <div className="[&>div>button]:hidden">
                  <SupportedFeaturesDetail document={document} onBack={() => {}} />
                </div>
              </AccordionItem>

              {/* 适配型号 */}
              <AccordionItem
                title={t('knowledge.cardSections.compatibleModels')}
                icon={<Car className="h-6 w-6" />}
                badge={`${compatibleModelsCount} ${t('common.items')}`}
                defaultOpen={false}
              >
                <div className="[&>div>div>button]:hidden">
                  <CompatibleModelsDetail document={document} onBack={() => {}} onImageClick={openGallery} />
                </div>
              </AccordionItem>

              {/* 不适配型号 */}
              <AccordionItem
                title={t('knowledge.cardSections.incompatibleModels')}
                icon={<XCircle className="h-6 w-6" />}
                badge={`${incompatibleModelsCount} ${t('common.items')}`}
                defaultOpen={false}
              >
                <div className="[&>div>div>button]:hidden">
                  <IncompatibleModelsDetail document={document} onBack={() => {}} onImageClick={openGallery} />
                </div>
              </AccordionItem>

              {/* 常见问题 */}
              <AccordionItem
                title={t('knowledge.cardSections.faqs')}
                icon={<HelpCircle className="h-6 w-6" />}
                badge={`${faqsCount} ${t('common.items')}`}
                defaultOpen={false}
              >
                <div className="[&>div>div>button]:hidden">
                  <FAQDetail document={document} onBack={() => {}} onImageClick={openGallery} />
                </div>
              </AccordionItem>
            </div>
          )}
        </div>
      )}

      {/* 用户留言 */}
      {isStructuredDocument && (
        <DocumentFeedback 
          documentId={document._id || document.id} 
          documentType="structured"
          className="mt-6"
        />
      )}

      {/* 图片画廊 */}
      <ImageGallery
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={galleryImages}
        initialIndex={initialImageIndex}
      />
    </div>
  )
}

export default StructuredDocumentViewer
