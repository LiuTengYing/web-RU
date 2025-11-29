import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ImageUpload from '@/components/ImageUpload'
import LazyRichTextEditor from '@/components/LazyRichTextEditor'
import { Plus, Trash2 } from 'lucide-react'
import type { CompatibleModel } from '@/types/structured-article'

interface Props {
  models: CompatibleModel[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, fieldPath: string, value: any) => void
}

const CompatibleModelsSection: React.FC<Props> = ({ models, onAdd, onRemove, onUpdate }) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          {t('admin.structuredArticle.compatibleModels')}
        </h3>
      </div>

      {models.map((model, index) => (
        <Card key={model.id} className="p-4">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-medium">
              {t('admin.structuredArticle.compatibleModel')} {index + 1}
            </h4>
            <Button variant="outline" size="sm" onClick={() => onRemove(model.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.structuredArticle.modelName')}
              </label>
              <Input
                value={model.name || ''}
                onChange={(e) => onUpdate(model.id, 'name', e.target.value)}
                placeholder={t('admin.structuredArticle.modelNamePlaceholder')}
                className="bg-gray-800 border-gray-600 text-gray-100 focus:border-blue-400 focus:ring-blue-400/20 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.structuredArticle.dashboardImage')}
              </label>
              <ImageUpload
                value={model.dashboardImage}
                onChange={(val) => onUpdate(model.id, 'dashboardImage', val)}
                placeholder={t('admin.structuredArticle.uploadDashboardImage')}
                imageType="structured-article"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.structuredArticle.modelDescription')}
            </label>
            <LazyRichTextEditor
              value={model.description}
              onChange={(val) => onUpdate(model.id, 'description', val)}
              placeholder={t('admin.structuredArticle.modelDescriptionPlaceholder')}
            />
          </div>

          <div className="border-t pt-4 mb-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">
              {t('admin.structuredArticle.originalHost')}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  {t('admin.structuredArticle.frontImage')}
                </label>
                <ImageUpload
                  value={model.originalHost.frontImage}
                  onChange={(val) => onUpdate(model.id, 'originalHost.frontImage', val)}
                  placeholder={t('admin.structuredArticle.uploadFrontImage')}
                  imageType="structured-article"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  {t('admin.structuredArticle.backImage')}
                </label>
                <ImageUpload
                  value={model.originalHost.backImage}
                  onChange={(val) => onUpdate(model.id, 'originalHost.backImage', val)}
                  placeholder={t('admin.structuredArticle.uploadBackImage')}
                  imageType="structured-article"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  {t('admin.structuredArticle.pinDefinitionImage')}
                </label>
                <ImageUpload
                  value={model.originalHost.pinDefinitionImage}
                  onChange={(val) => onUpdate(model.id, 'originalHost.pinDefinitionImage', val)}
                  placeholder={t('admin.structuredArticle.uploadPinDefinitionImage')}
                  imageType="structured-article"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  {t('admin.structuredArticle.partNumber')}
                </label>
                <Input
                  value={model.originalHost.partNumber || ''}
                  onChange={(e) => onUpdate(model.id, 'originalHost.partNumber', e.target.value)}
                  placeholder={t('admin.structuredArticle.partNumberPlaceholder')}
                  className="bg-gray-800 border-gray-600 text-gray-100 focus:border-blue-400 focus:ring-blue-400/20 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs text-gray-600 mb-1">
                {t('admin.structuredArticle.hostDescription')}
              </label>
              <LazyRichTextEditor
                value={model.originalHost.description}
                onChange={(val) => onUpdate(model.id, 'originalHost.description', val)}
                placeholder={t('admin.structuredArticle.hostDescriptionPlaceholder')}
              />
            </div>
            <div className="mt-4">
              <label className="block text-xs text-gray-600 mb-1">
                {t('admin.structuredArticle.wiringDiagram')}
              </label>
              <ImageUpload
                value={model.originalHost.wiringDiagram || ''}
                onChange={(val) => onUpdate(model.id, 'originalHost.wiringDiagram', val)}
                placeholder={t('admin.structuredArticle.uploadWiringDiagram')}
                imageType="structured-article"
              />
            </div>
          </div>
        </Card>
      ))}

      {/* 添加按钮在底部 */}
      {models.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="mb-4">{t('admin.structuredArticle.noCompatibleModels')}</p>
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.structuredArticle.addCompatibleModel')}
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.structuredArticle.addCompatibleModel')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default CompatibleModelsSection
