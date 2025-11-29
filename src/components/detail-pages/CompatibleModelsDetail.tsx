import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronRight, ChevronDown, Car, Image, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface CompatibleModelsDetailProps {
  document: any
  onBack: () => void
  onImageClick?: (imageUrl: string, altText: string) => void
}

const CompatibleModelsDetail: React.FC<CompatibleModelsDetailProps> = ({
  document,
  onBack,
  onImageClick
}) => {
  const [expandedModels, setExpandedModels] = React.useState<Set<number>>(new Set())
  const { t } = useTranslation()

  const compatibleModels = document.compatibleModels || []

  const toggleModel = (index: number) => {
    const newExpanded = new Set(expandedModels)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedModels(newExpanded)
  }

  const expandAll = () => {
    setExpandedModels(new Set(compatibleModels.map((_: any, index: number) => index)))
  }

  const collapseAll = () => {
    setExpandedModels(new Set())
  }

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

        {/* 页面标题和操作 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('knowledge.cardSections.compatibleModels')}
            </h1>
            <p className="text-gray-300">
              {t('knowledge.cardSections.compatibleModelsDesc')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={expandAll}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {t('knowledge.expandAll')}
            </Button>
            <Button
              onClick={collapseAll}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {t('knowledge.collapseAll')}
            </Button>
          </div>
        </div>

        {compatibleModels.length > 0 ? (
          <div className="space-y-4">
            {compatibleModels.map((model: any, index: number) => {
              const isExpanded = expandedModels.has(index)
              return (
                <Card 
                  key={index} 
                  className="bg-white/10 border-white/20 backdrop-blur-sm overflow-hidden"
                >
                  {/* 模型头部 */}
                  <button
                    onClick={() => toggleModel(index)}
                    className="w-full p-6 text-left hover:bg-white/5 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                          <Car className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {t('knowledge.compatibleModel')} {index + 1}: {model.modelName || model.name}
                          </h3>
                          {model.description && (
                            <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                              {model.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">
                          {isExpanded ? t('knowledge.collapseDetails') : t('knowledge.viewDetails')}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* 模型详情 */}
                  {isExpanded && (
                    <CardContent className="px-6 pb-6">
                      <div className="grid gap-6 lg:grid-cols-2">
                        {/* 基本信息 */}
                        <div className="space-y-4">
                          {/* 仪表板图片 */}
                          {model.dashboardImage && (
                            <div>
                              <h4 className="text-white font-medium mb-2 flex items-center">
                                <Image className="h-4 w-4 mr-2" />
                                {t('knowledge.dashboardInteriorView')}
                              </h4>
                              <img 
                                src={model.dashboardImage} 
                                alt={`${model.modelName || model.name} ${t('knowledge.dashboardInteriorView')}`}
                                className="w-full rounded-lg shadow-md border border-white/20 cursor-pointer hover:scale-[1.02] transition-transform"
                                onClick={() => onImageClick?.(model.dashboardImage, t('knowledge.dashboardInteriorView'))}
                              />
                            </div>
                          )}

                          {/* 描述信息 */}
                          {model.description && (
                            <div>
                              <h4 className="text-white font-medium mb-2 flex items-center">
                                <Info className="h-4 w-4 mr-2" />
                                {t('knowledge.description')}
                              </h4>
                              <p className="text-gray-300 bg-white/5 p-3 rounded-lg">
                                {model.description}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 原车主机信息 */}
                        {model.originalHost && (
                          <div>
                            <h4 className="text-white font-medium mb-4">
                              {t('knowledge.originalHost')}
                            </h4>
                            <div className="space-y-4">
                              {/* 主机图片 */}
                              <div className="grid grid-cols-2 gap-4">
                                {model.originalHost.frontImage && (
                                  <div>
                                    <h5 className="text-gray-300 text-sm mb-2">
                                      {t('knowledge.hostFrontImage')}
                                    </h5>
                                    <img 
                                      src={model.originalHost.frontImage}
                                      alt="Host Front"
                                      className="w-full rounded border border-white/20 cursor-pointer hover:scale-[1.02] transition-transform"
                                      onClick={() => onImageClick?.(model.originalHost.frontImage, t('knowledge.hostFrontImage'))}
                                    />
                                  </div>
                                )}
                                {model.originalHost.backImage && (
                                  <div>
                                    <h5 className="text-gray-300 text-sm mb-2">
                                      {t('knowledge.hostBackImage')}
                                    </h5>
                                    <img 
                                      src={model.originalHost.backImage}
                                      alt="Host Back"
                                      className="w-full rounded border border-white/20 cursor-pointer hover:scale-[1.02] transition-transform"
                                      onClick={() => onImageClick?.(model.originalHost.backImage, t('knowledge.hostBackImage'))}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* 针脚定义图 */}
                              {model.originalHost.pinDefinitionImage && (
                                <div>
                                  <h5 className="text-gray-300 text-sm mb-2">
                                    {t('knowledge.pinDefinitionImage')}
                                  </h5>
                                  <img 
                                    src={model.originalHost.pinDefinitionImage}
                                    alt="Pin Definition"
                                    className="w-full rounded border border-white/20 cursor-pointer hover:scale-[1.02] transition-transform"
                                    onClick={() => onImageClick?.(model.originalHost.pinDefinitionImage, t('knowledge.pinDefinitionImage'))}
                                  />
                                </div>
                              )}

                              {/* 零件号 */}
                              {model.originalHost.partNumber && (
                                <div>
                                  <h5 className="text-gray-300 text-sm mb-2">
                                    {t('knowledge.partNumber')}
                                  </h5>
                                  <p className="text-white font-mono bg-white/5 p-2 rounded">
                                    {model.originalHost.partNumber}
                                  </p>
                                </div>
                              )}

                              {/* 描述 */}
                              {model.originalHost.description && (
                                <div>
                                  <h5 className="text-gray-300 text-sm mb-2">
                                    {t('knowledge.hostDescription')}
                                  </h5>
                                  <p className="text-gray-300 bg-white/5 p-3 rounded">
                                    {model.originalHost.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 可选模块 - 只在有内容时显示 */}
                      {model.optionalModules && (
                        (model.optionalModules.airConditioningPanel?.image || model.optionalModules.airConditioningPanel?.description ||
                         model.optionalModules.displayBackPanel?.image || model.optionalModules.displayBackPanel?.description ||
                         model.optionalModules.dashboardPanel?.image || model.optionalModules.dashboardPanel?.description)
                      ) && (
                        <div className="mt-6">
                          <h4 className="text-white font-medium mb-4">
                            {t('knowledge.optionalModules')}
                          </h4>
                          <div className="grid gap-4 lg:grid-cols-3">
                            {/* 空调面板 */}
                            {(model.optionalModules.airConditioningPanel?.image || model.optionalModules.airConditioningPanel?.description) && (
                              <div className="bg-white/5 p-4 rounded-lg">
                                <h5 className="text-gray-300 text-sm mb-2">
                                  {t('knowledge.airConditioningPanel')}
                                </h5>
                                {model.optionalModules.airConditioningPanel.image && (
                                  <img 
                                    src={model.optionalModules.airConditioningPanel.image}
                                    alt="Air Conditioning Panel"
                                    className="w-full rounded border border-white/20 mb-2 cursor-pointer hover:scale-[1.02] transition-transform"
                                    onClick={() => onImageClick?.(model.optionalModules.airConditioningPanel.image, t('knowledge.airConditioningPanel'))}
                                  />
                                )}
                                {model.optionalModules.airConditioningPanel.description && (
                                  <p className="text-gray-400 text-sm">
                                    {model.optionalModules.airConditioningPanel.description}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* 显示屏背面 */}
                            {(model.optionalModules.displayBackPanel?.image || model.optionalModules.displayBackPanel?.description) && (
                              <div className="bg-white/5 p-4 rounded-lg">
                                <h5 className="text-gray-300 text-sm mb-2">
                                  {t('knowledge.displayBackPanel')}
                                </h5>
                                {model.optionalModules.displayBackPanel.image && (
                                  <img 
                                    src={model.optionalModules.displayBackPanel.image}
                                    alt="Display Back Panel"
                                    className="w-full rounded border border-white/20 mb-2 cursor-pointer hover:scale-[1.02] transition-transform"
                                    onClick={() => onImageClick?.(model.optionalModules.displayBackPanel.image, t('knowledge.displayBackPanel'))}
                                  />
                                )}
                                {model.optionalModules.displayBackPanel.description && (
                                  <p className="text-gray-400 text-sm">
                                    {model.optionalModules.displayBackPanel.description}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* 仪表板面板 */}
                            {(model.optionalModules.dashboardPanel?.image || model.optionalModules.dashboardPanel?.description) && (
                              <div className="bg-white/5 p-4 rounded-lg">
                                <h5 className="text-gray-300 text-sm mb-2">
                                  {t('knowledge.dashboardPanel')}
                                </h5>
                                {model.optionalModules.dashboardPanel.image && (
                                  <img 
                                    src={model.optionalModules.dashboardPanel.image}
                                    alt="Dashboard Panel"
                                    className="w-full rounded border border-white/20 mb-2 cursor-pointer hover:scale-[1.02] transition-transform"
                                    onClick={() => onImageClick?.(model.optionalModules.dashboardPanel.image, t('knowledge.dashboardPanel'))}
                                  />
                                )}
                                {model.optionalModules.dashboardPanel.description && (
                                  <p className="text-gray-400 text-sm">
                                    {model.optionalModules.dashboardPanel.description}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                {t('knowledge.noCompatibleModels')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default CompatibleModelsDetail
