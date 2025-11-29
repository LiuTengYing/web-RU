import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, XCircle, Image, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface IncompatibleModelsDetailProps {
  document: any
  onBack: () => void
  onImageClick?: (imageUrl: string, altText: string) => void
}

const IncompatibleModelsDetail: React.FC<IncompatibleModelsDetailProps> = ({
  document,
  onBack,
  onImageClick
}) => {
  const { t } = useTranslation()

  const incompatibleModels = document.incompatibleModels || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 返回按钮 */}
        <Button
          onClick={onBack}
          variant="outline"
          className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('knowledge.cardSections.backToOverview')}
        </Button>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('knowledge.cardSections.incompatibleModels')}
          </h1>
          <p className="text-gray-300">
            {t('knowledge.cardSections.incompatibleModelsDesc')}
          </p>
        </div>

        {/* 警告提示 */}
        <Card className="mb-6 bg-red-900/20 border-red-800/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200">
                {t('knowledge.incompatibleWarning')}
              </p>
            </div>
          </CardContent>
        </Card>

        {incompatibleModels.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {incompatibleModels.map((model: any, index: number) => (
              <Card 
                key={index} 
                className="bg-red-900/20 border-red-800/50 backdrop-blur-sm hover:bg-red-900/30 transition-colors duration-200"
              >
                <CardHeader>
                  <CardTitle className="text-red-100 flex items-center">
                    <XCircle className="h-5 w-5 mr-2 text-red-400" />
                    {t('knowledge.incompatibleModel')} {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 型号名称 */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-red-100 mb-2">
                      {model.modelName || model.name}
                    </h3>
                  </div>

                  {/* 仪表板图片 */}
                  {model.dashboardImage && (
                    <div className="mb-4">
                      <h4 className="text-red-200 text-sm font-medium mb-2 flex items-center">
                        <Image className="h-4 w-4 mr-2" />
                        {t('knowledge.dashboardInteriorView')}
                      </h4>
                      <img 
                        src={model.dashboardImage} 
                        alt={`${model.modelName || model.name} ${t('knowledge.dashboardInteriorView')}`}
                        className="w-full rounded-lg shadow-md border border-red-800/50 cursor-pointer hover:scale-[1.02] transition-transform"
                        onClick={() => onImageClick?.(model.dashboardImage, t('knowledge.dashboardInteriorView'))}
                      />
                    </div>
                  )}

                  {/* 描述信息 */}
                  {model.description && (
                    <div>
                      <h4 className="text-red-200 text-sm font-medium mb-2">
                        {t('knowledge.description')}
                      </h4>
                      <p className="text-red-200 bg-red-900/20 p-3 rounded-lg text-sm border border-red-800/30">
                        {model.description}
                      </p>
                    </div>
                  )}

                  {/* 不兼容原因 */}
                  {model.reason && (
                    <div className="mt-4">
                      <h4 className="text-red-200 text-sm font-medium mb-2">
                        不兼容原因
                      </h4>
                      <p className="text-red-300 bg-red-900/30 p-3 rounded-lg text-sm border border-red-800/50">
                        {model.reason}
                      </p>
                    </div>
                  )}

                  {/* 替代建议 */}
                  {model.alternative && (
                    <div className="mt-4">
                      <h4 className="text-red-200 text-sm font-medium mb-2">
                        替代建议
                      </h4>
                      <p className="text-red-200 bg-green-900/20 p-3 rounded-lg text-sm border border-green-800/50">
                        {model.alternative}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                {t('knowledge.noIncompatibleModels')}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {t('knowledge.noIncompatibleModelsMessage')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 统计信息 */}
        {incompatibleModels.length > 0 && (
          <Card className="mt-8 bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">{t('knowledge.incompatibleStatistics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 rounded-lg bg-red-900/20 border border-red-800/50">
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {incompatibleModels.length}
                </div>
                <div className="text-red-200 text-sm">
                  {t('knowledge.incompatibleModelsUnit')}
                </div>
                <div className="text-red-300 text-xs mt-2">
                  {t('knowledge.incompatibleWarningText')}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default IncompatibleModelsDetail
