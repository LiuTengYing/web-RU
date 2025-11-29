import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Car, Lock, Video, FileText, ArrowRight, ChevronRight, BookOpen, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import VehicleSelector from '@/components/VehicleSelector'
import PasswordProtection from '@/components/PasswordProtection'
import StructuredDocumentViewer from '@/components/StructuredDocumentViewer'
import GeneralDocumentViewer from '@/components/GeneralDocumentViewer'
import VideoPlayer from '@/components/VideoPlayer'
import CategoryBrowser from '@/components/CategoryBrowser'
import { getDocuments, getDocument, recordDocumentView } from '@/services/documentApi'
import { getPersistentFingerprint, getSessionId } from '@/utils/fingerprint'
import { findVehicleByBrandModelYear } from '@/services/vehicleService'

type ContentSection = 'vehicle-research' | 'video-tutorials' | 'general-documents'

// convertVehiclesToSelectorFormat 已移除，车型数据现在直接从API获取并格式化

/**
 * 知识库页面组件
 * 包含三个板块：车辆研究（需要选择车型和密码）、视频教程、通用文档
 */
const KnowledgeBase: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [activeSection, setActiveSection] = useState<ContentSection>('vehicle-research')
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [vehicleData, setVehicleData] = useState<any>({})
  const [vehicleDocuments, setVehicleDocuments] = useState<any[]>([])
  const [showPasswordProtection, setShowPasswordProtection] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  // const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<any>(null)
  const [isLoadingDirectDocument, setIsLoadingDirectDocument] = useState(false)

  // 处理URL参数 - 直接显示文档
  useEffect(() => {
    const docId = searchParams.get('doc')
    if (docId) {
      const loadDirectDocument = async () => {
        setIsLoadingDirectDocument(true)
        try {
          // 尝试不同的文档类型来获取文档
          let document = null
          let documentType = null
          
          // 首先尝试通用文档
          try {
            document = await getDocument(docId, 'general')
            documentType = 'general'
          } catch (error) {
            // 如果通用文档失败，尝试视频文档
            try {
              document = await getDocument(docId, 'video')
              documentType = 'video'
            } catch (error) {
              // 如果视频文档失败，尝试结构化文档
              try {
                document = await getDocument(docId, 'structured')
                documentType = 'structured'
              } catch (error) {
                // 最后尝试不指定类型
                document = await getDocument(docId)
                documentType = document.documentType || (document as any).type || 'general'
              }
            }
          }
          
          if (document) {
            // 确保文档有正确的类型信息
            document.documentType = document.documentType || (document as any).type || documentType
            
            // 根据文档类型设置活动板块
            if (documentType === 'video') {
              setActiveSection('video-tutorials')
            } else if (documentType === 'structured') {
              setActiveSection('vehicle-research')
            } else {
              setActiveSection('general-documents')
            }
            
            // 记录浏览（异步，不阻塞显示）
            try {
              const fingerprint = getPersistentFingerprint()
              const sessionId = getSessionId()
              recordDocumentView(docId, documentType as 'general' | 'video' | 'structured', fingerprint, sessionId)
                .then(result => {
                  console.log('📊 浏览记录成功:', result)
                })
                .catch(err => console.error('记录浏览失败:', err))
            } catch (error) {
              console.error('生成指纹失败:', error)
            }
            
            // 直接显示文档
            setViewingDocument(document)
          } else {
            console.error('Document not found:', docId)
          }
        } catch (error) {
          console.error('Failed to load document:', error)
        } finally {
          setIsLoadingDirectDocument(false)
        }
      }
      
      loadDirectDocument()
    }
  }, [searchParams])

  // 加载车型数据（从后端API获取）
  useEffect(() => {
    const loadVehicleData = async () => {
      try {
        const { getVehicles } = await import('@/services/vehicleService')
        const vehicles = await getVehicles()
        
        // 构建车型数据结构（用于VehicleSelector组件）
        const vehicleData: any = {}
        vehicles.forEach((vehicle: any) => {
          if (!vehicleData[vehicle.brand]) {
            vehicleData[vehicle.brand] = {}
          }
          if (!vehicleData[vehicle.brand][vehicle.model]) {
            vehicleData[vehicle.brand][vehicle.model] = {}
          }
          vehicleData[vehicle.brand][vehicle.model][vehicle.year] = { 
            password: vehicle.password 
          }
        })
        setVehicleData(vehicleData)
      } catch (error) {
        console.error('Failed to load vehicles:', error)
        // 如果API失败，尝试从结构化文档中提取（降级方案）
        try {
          const result = await getDocuments({ documentType: 'structured', status: 'published', limit: 1000 })
          const vehicleData: any = {}
          result.documents.forEach((doc: any) => {
            // 从basicInfo字段获取车辆信息
            const brand = doc.basicInfo?.brand || doc.brand
            const model = doc.basicInfo?.model || doc.model  
            const yearRange = doc.basicInfo?.yearRange || doc.yearRange
            
            if (brand && model && yearRange) {
              if (!vehicleData[brand]) {
                vehicleData[brand] = {}
              }
              if (!vehicleData[brand][model]) {
                vehicleData[brand][model] = {}
              }
              const years = yearRange.split('-').map((y: string) => y.trim())
              years.forEach((year: string) => {
                if (year && !vehicleData[brand][model][year]) {
                  vehicleData[brand][model][year] = { password: '' }
                }
              })
            }
          })
          setVehicleData(vehicleData)
        } catch (fallbackError) {
          console.error('Fallback via structured documents failed:', fallbackError)
        }
      }
    }
    loadVehicleData()
  }, [])

  // 处理车型选择
  const handleVehicleSelect = async (brand: string, model: string, year: string) => {
    setSelectedVehicle({ brand, model, year })
    
    try {
      // 从API加载结构化文档
      const result = await getDocuments({ 
        documentType: 'structured', 
        status: 'published',
        brand, 
        model, 
        limit: 1000 
      })
      
      const selectedYear = parseInt(year)
      
      // 过滤文档：匹配品牌、型号和年份范围
      const filteredDocuments = result.documents.filter((doc: any) => {
        // 从basicInfo字段获取车辆信息
        const docBrand = doc.basicInfo?.brand || doc.brand
        const docModel = doc.basicInfo?.model || doc.model
        const docYearRange = doc.basicInfo?.yearRange || doc.yearRange
        
        // 检查品牌和型号是否匹配
        if (docBrand !== brand || docModel !== model) {
          return false
        }
        
        // 检查年份是否在范围内
        if (docYearRange) {
          const yearRangeMatch = docYearRange.match(/(\d{4})(?:-(\d{4}))?/)
          if (yearRangeMatch) {
            const startYear = parseInt(yearRangeMatch[1])
            const endYear = yearRangeMatch[2] ? parseInt(yearRangeMatch[2]) : startYear
            return selectedYear >= startYear && selectedYear <= endYear
          }
        }
        
        return false
      })
      
      setVehicleDocuments(filteredDocuments)
    } catch (error) {
      console.error('Failed to load structured documents for selected vehicle:', error)
      setVehicleDocuments([])
    }
  }

  // 处理文档查看
  const handleViewDocument = async (document: any) => {
    // 记录浏览（异步，不阻塞显示）
    const docType = document.documentType || document.type
    const docId = document._id || document.id
    if (docId && docType) {
      try {
        const fingerprint = getPersistentFingerprint()
        const sessionId = getSessionId()
        recordDocumentView(docId, docType as 'general' | 'video' | 'structured', fingerprint, sessionId)
          .then(result => console.log('📊 浏览记录成功:', result))
          .catch(err => console.error('记录浏览失败:', err))
      } catch (error) {
        console.error('生成指纹失败:', error)
      }
    }
    
    // 视频教程和通用文档不需要密码保护，直接查看
    if (docType === 'video' || docType === 'general' || docType === 'article' || docType === 'file') {
      setViewingDocument(document)
      return
    }
    
    // 只有结构化文档需要检查密码保护
    if (!selectedVehicle) {
      // 如果没有选择车型，应该先选择车型
      setViewingDocument(document)
      return
    }
    
    try {
      // 从文档获取品牌和型号
      const docBrand = document.brand || document.basicInfo?.brand
      const docModel = document.model || document.basicInfo?.model
      const docYearRange = document.yearRange || document.basicInfo?.yearRange
      const selectedYear = selectedVehicle.year
      
      // 检查品牌和型号是否匹配
      if (docBrand !== selectedVehicle.brand || docModel !== selectedVehicle.model) {
        // 不匹配，直接显示（不应该发生，但以防万一）
        setViewingDocument(document)
        return
      }
      
      // 检查年份是否在文档的年份范围内
      let yearInRange = true
      if (docYearRange) {
        const yearRangeMatch = docYearRange.match(/(\d{4})(?:-(\d{4}))?/)
        if (yearRangeMatch) {
          const startYear = parseInt(yearRangeMatch[1])
          const endYear = yearRangeMatch[2] ? parseInt(yearRangeMatch[2]) : startYear
          const yearNum = parseInt(selectedYear)
          yearInRange = yearNum >= startYear && yearNum <= endYear
        }
      }
      
      if (!yearInRange) {
        // 年份不在范围内，直接显示
        setViewingDocument(document)
        return
      }
      
      // 根据品牌、型号、年份查找车型
      const vehicle = await findVehicleByBrandModelYear(
        selectedVehicle.brand,
        selectedVehicle.model,
        selectedVehicle.year
      )
      
      // 如果车型存在且有密码，需要密码验证
      if (vehicle && vehicle.password) {
        setSelectedDocument(document)
        setShowPasswordProtection(true)
      } else {
        // 如果车型没有密码或没找到车型，直接显示文档
        setViewingDocument(document)
      }
    } catch (error) {
      console.error('Password protection check failed:', error)
      // 出错时直接显示文档
      setViewingDocument(document)
    }
  }

  // 处理密码验证（根据文档的brand/model/yearRange匹配车型密码）
  const handlePasswordSubmit = async (password: string): Promise<boolean> => {
    console.log('Password verification for document:', selectedDocument)
    
    if (!selectedDocument || !selectedVehicle) {
      return false
    }
    
    try {
      // 从文档获取品牌和型号
      const docBrand = selectedDocument.brand || selectedDocument.basicInfo?.brand
      const docModel = selectedDocument.model || selectedDocument.basicInfo?.model
      const docYearRange = selectedDocument.yearRange || selectedDocument.basicInfo?.yearRange
      
      // 从选择的车型获取具体年份
      const selectedYear = selectedVehicle.year
      
      // 检查品牌和型号是否匹配
      if (docBrand !== selectedVehicle.brand || docModel !== selectedVehicle.model) {
        console.log('Brand or model mismatch')
        return false
      }
      
      // 检查年份是否在文档的年份范围内
      if (docYearRange) {
        const yearRangeMatch = docYearRange.match(/(\d{4})(?:-(\d{4}))?/)
        if (yearRangeMatch) {
          const startYear = parseInt(yearRangeMatch[1])
          const endYear = yearRangeMatch[2] ? parseInt(yearRangeMatch[2]) : startYear
          const yearNum = parseInt(selectedYear)
          
          if (yearNum < startYear || yearNum > endYear) {
            console.log('Year out of range')
            return false
          }
        }
      }
      
      // 根据品牌、型号、年份查找车型密码
      const vehicle = await findVehicleByBrandModelYear(
        selectedVehicle.brand,
        selectedVehicle.model,
        selectedVehicle.year
      )
      
      // 如果找到车型且车型有密码，验证密码
      if (vehicle && vehicle.password) {
        if (vehicle.password === password) {
          console.log('Vehicle password matched')
          setShowPasswordProtection(false)
          setViewingDocument(selectedDocument)
          return true
        } else {
          console.log('Password mismatch')
          return false
        }
      } else {
        // 如果车型没有密码或没找到车型，不需要密码验证（直接通过）
        console.log('No password required for this vehicle')
        setShowPasswordProtection(false)
        setViewingDocument(selectedDocument)
        return true
      }
    } catch (error) {
      console.error('密码验证失败:', error)
      return false
    }
  }

  // 关闭密码保护弹窗
  const handleClosePasswordProtection = () => {
    setShowPasswordProtection(false)
    setSelectedDocument(null)
  }

  // 返回文档列表
  const handleBackToDocuments = () => {
    setViewingDocument(null)
    // setIsAuthenticated(false)
  }

    // 如果正在加载直接访问的文档，显示加载状态
  if (isLoadingDirectDocument) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
        {/* 页面标题 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-white text-sm font-medium mb-6 shadow-lg">
              <BookOpen className="h-5 w-5 mr-2" />
              {t('knowledge.title')}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {t('knowledge.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('knowledge.selectVehicle')}
            </p>
          </div>


          {/* 板块切换器 */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/50 rounded-2xl shadow-xl backdrop-blur-sm mb-8">
                         <nav className="flex space-x-2 p-2" aria-label={t('knowledge.contentSections')}>
              <button
                onClick={() => {
                  setActiveSection('vehicle-research')
                  setViewingDocument(null) // 清除当前查看的文档
                }}
                className={`flex-1 inline-flex items-center justify-center py-4 px-6 text-base font-medium rounded-xl transition-all duration-300 ${
                  activeSection === 'vehicle-research'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-blue-400 hover:bg-gray-700/50 hover:scale-105'
                }`}
              >
                <Car className={`mr-3 h-6 w-6 ${
                  activeSection === 'vehicle-research' ? 'text-white' : 'text-gray-400'
                }`} />
                <span>{t('knowledge.sections.vehicleResearch')}</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveSection('video-tutorials')
                  setViewingDocument(null) // 清除当前查看的文档
                }}
                className={`flex-1 inline-flex items-center justify-center py-4 px-6 text-base font-medium rounded-xl transition-all duration-300 ${
                  activeSection === 'video-tutorials'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-green-400 hover:bg-gray-700/50 hover:scale-105'
                }`}
              >
                <Video className={`mr-3 h-6 w-6 ${
                  activeSection === 'video-tutorials' ? 'text-white' : 'text-gray-400'
                }`} />
                <span>{t('knowledge.sections.videoTutorials')}</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveSection('general-documents')
                  setViewingDocument(null) // 清除当前查看的文档
                }}
                className={`flex-1 inline-flex items-center justify-center py-4 px-6 text-base font-medium rounded-xl transition-all duration-300 ${
                  activeSection === 'general-documents'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-purple-400 hover:bg-gray-700/50 hover:scale-105'
                }`}
              >
                <FileText className={`mr-3 h-6 w-6 ${
                  activeSection === 'general-documents' ? 'text-white' : 'text-gray-400'
                }`} />
                <span>{t('knowledge.sections.generalDocuments')}</span>
              </button>
            </nav>
        </div>

          {/* 板块内容 */}
          <div className="mt-8">
            {/* 车辆研究板块 */}
            {activeSection === 'vehicle-research' && (
              <div className="space-y-8">
                {!selectedVehicle ? (
                  <>
                    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardHeader className="pb-6">
                        <CardTitle className="flex items-center text-white text-2xl">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                            <Car className="h-6 w-6 text-white" />
                          </div>
              {t('knowledge.selectVehicleTitle')}
            </CardTitle>
                        <CardDescription className="text-gray-300 text-lg leading-relaxed">
              {t('knowledge.selectVehicleDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleSelector 
              vehicleData={vehicleData}
              onSelect={handleVehicleSelect}
            />
          </CardContent>
        </Card>

                    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardContent className="p-8">
            <div className="text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Lock className="h-10 w-10 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-4">
                {t('knowledge.passwordProtection')}
              </h3>
                          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
                {t('knowledge.passwordProtectionDesc')}
              </p>
            </div>
          </CardContent>
        </Card>
                  </>
                ) : (
                  <div className="space-y-8">
                    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                              <Car className="h-8 w-8 text-white" />
      </div>
        <div>
                              <h3 className="text-2xl font-bold text-white">
                                {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
                              </h3>
                              <p className="text-gray-300 text-lg">
                                {t('knowledge.vehicleResearch.title')}
          </p>
        </div>
                          </div>
            <Button 
              variant="outline" 
                            onClick={() => {
                              setSelectedVehicle(null)
                              setVehicleDocuments([])
                            }}
                            size="lg"
                            className="border-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-all duration-300"
                          >
                            <span className="mr-2">{t('knowledge.backToSelect')}</span>
                            <ArrowRight className="h-5 w-5" />
            </Button>
                        </div>
          </CardContent>
        </Card>

                                         {/* 文档查看界面 */}
                     {viewingDocument ? (
                       viewingDocument.type === 'structured' ? (
                         <StructuredDocumentViewer 
                           document={viewingDocument}
                           onBack={handleBackToDocuments}
                         />
                       ) : (
                         <GeneralDocumentViewer 
                           document={viewingDocument}
                           onBack={handleBackToDocuments}
                         />
                       )
                     ) : (
                      /* 文档列表 */
                      vehicleDocuments.length > 0 ? (
                        <div className="grid gap-6">
                          {vehicleDocuments.map((doc) => (
                            <Card key={doc.id} className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-[1.02]">
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                      <h4 className="text-xl font-bold text-white">{doc.title}</h4>
                                                                           <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                       doc.type === 'structured' 
                                         ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                         : doc.type === 'article' 
                                         ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                                         : 'bg-green-600/20 text-green-300 border border-green-500/30'
                                     }`}>
                                       {doc.type === 'structured' 
                                         ? t('knowledge.structuredArticle')
                                         : doc.type === 'article' 
                                         ? t('knowledge.article') 
                                         : t('knowledge.file')
                                       }
                                     </span>
                                    </div>
                                    <p className="text-gray-300 mb-2">{doc.summary || t('knowledge.noSummary')}</p>
                                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                                      <span>{t('knowledge.author')}: {doc.author || t('knowledge.technicalTeam')}</span>
                                      <span>•</span>
                                      <span>{t('knowledge.uploadTime')}: {doc.uploadDate}</span>
                                      <span>•</span>
                                      <span>{t('knowledge.viewCount')}: {doc.views || 0}</span>
                                    </div>
      </div>
        <Button 
                                    size="lg"
                                    onClick={() => handleViewDocument(doc)}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg group-hover:scale-105 transition-all duration-300"
                                  >
                                    <span className="mr-2">{t('knowledge.view')}</span>
                                    <ChevronRight className="h-5 w-5" />
        </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm shadow-xl">
                          <CardContent className="p-12 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                              <Shield className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                              {t('knowledge.noResearchData')}
                            </h3>
                            <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
                              {t('knowledge.noResearchDataDesc')}
                            </p>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 视频教程板块 */}
            {activeSection === 'video-tutorials' && (
              <VideoTutorialsSection 
                viewingDocument={viewingDocument}
                onViewDocument={handleViewDocument}
                onBack={handleBackToDocuments}
              />
            )}

            {/* 通用文档板块 */}
            {activeSection === 'general-documents' && (
              <GeneralDocumentsSection
                viewingDocument={viewingDocument}
                onViewDocument={handleViewDocument}
                onBack={handleBackToDocuments}
              />
            )}
          </div>
        </div>
      </div>

      {/* 密码保护弹窗 */}
      {showPasswordProtection && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <PasswordProtection
              onSubmit={handlePasswordSubmit}
              onClose={handleClosePasswordProtection}
              vehicleInfo={selectedVehicle ? 
                `${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.year} - ${selectedDocument.title}` :
                selectedDocument.title
              }
              showRequestPasswordLink={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 视频教程板块组件
const VideoTutorialsSection: React.FC<{
  viewingDocument: any
  onViewDocument: (doc: any) => void
  onBack: () => void
}> = ({ viewingDocument, onViewDocument, onBack }) => {
  // const { t } = useTranslation() // 暂时不需要

  if (viewingDocument) {
    // 判断是否为视频教程：优先检查documentType，其次检查type
    const isVideoDoc = viewingDocument.documentType === 'video' || viewingDocument.type === 'video'
    return isVideoDoc ? (
      <VideoPlayer document={viewingDocument} onBack={onBack} />
    ) : (
      <GeneralDocumentViewer document={viewingDocument} onBack={onBack} />
    )
  }

  return (
    <CategoryBrowser
      documentType="video"
      onViewDocument={onViewDocument}
      className="space-y-6"
    />
  )
}

// 通用文档板块组件
const GeneralDocumentsSection: React.FC<{
  viewingDocument: any
  onViewDocument: (doc: any) => void
  onBack: () => void
}> = ({ viewingDocument, onViewDocument, onBack }) => {
  // const { t } = useTranslation() // 暂时不需要

  if (viewingDocument) {
    return <GeneralDocumentViewer document={viewingDocument} onBack={onBack} />
  }

  return (
    <CategoryBrowser
      documentType="general"
      onViewDocument={onViewDocument}
      className="space-y-6"
    />
  )
}

export default KnowledgeBase 