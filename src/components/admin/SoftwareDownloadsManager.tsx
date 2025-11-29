/**
 * 软件下载管理器 - 重构版本
 * 使用新的Hook系统，大幅减少重复代码
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAdminManager } from '@/hooks/useAdminManager';
import { softwareCategoryService, softwareService, SoftwareCategory, Software } from '@/services/softwareService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  FolderOpen,
  X,
  Save,
  AlertTriangle
} from 'lucide-react';

const SoftwareDownloadsManager: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'categories' | 'software'>('categories');

  // 使用新的管理Hook - 分类管理
  const [categoryState, categoryActions] = useAdminManager({
    service: softwareCategoryService,
    autoLoad: true,
    enablePagination: false
  });

  // 使用新的管理Hook - 软件管理
  const [softwareState, softwareActions] = useAdminManager({
    service: softwareService,
    autoLoad: true,
    enablePagination: false
  });

  // 表单状态
  const [categoryForm, setCategoryForm] = useState({ name: '', order: 0 });
  const [softwareForm, setSoftwareForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    downloadUrl: '',
    importantNote: ''
  });

  // 分类管理
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryForm.name.trim()) {
      showToast({ title: t('admin.softwareDownloads.categoryNameRequired'), type: 'error' });
      return;
    }

    if (categoryState.editingItem) {
      await categoryActions.updateItem(categoryState.editingItem._id, categoryForm);
    } else {
      await categoryActions.createItem(categoryForm);
    }
    
    setCategoryForm({ name: '', order: 0 });
    categoryActions.closeForm();
  };

  const handleEditCategory = (category: SoftwareCategory) => {
    setCategoryForm({ name: category.name, order: category.order });
    categoryActions.openEditForm(category);
  };

  // 软件管理
  const handleSoftwareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!softwareForm.name.trim() || !softwareForm.categoryId || !softwareForm.description.trim() || !softwareForm.downloadUrl.trim()) {
      showToast({ title: t('admin.softwareDownloads.completeInfoRequired'), type: 'error' });
      return;
    }

    if (softwareState.editingItem) {
      await softwareActions.updateItem(softwareState.editingItem._id, softwareForm);
    } else {
      await softwareActions.createItem(softwareForm);
    }
    
    setSoftwareForm({
      name: '',
      categoryId: '',
      description: '',
      downloadUrl: '',
      importantNote: ''
    });
    softwareActions.closeForm();
  };

  const handleEditSoftware = (software: Software) => {
    setSoftwareForm({
      name: software.name,
      categoryId: software.categoryId,
      description: software.description,
      downloadUrl: software.downloadUrl,
      importantNote: software.importantNote
    });
    softwareActions.openEditForm(software);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categoryState.items.find(c => c._id === categoryId);
    return category?.name || t('admin.softwareDownloads.unknownCategory');
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('admin.softwareDownloads.title')}
        </h2>
        <p className="text-gray-400">
          {t('admin.softwareDownloads.description')}
        </p>
      </div>

      {/* 标签页 */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <FolderOpen className="h-4 w-4 inline mr-2" />
          {t('admin.softwareDownloads.categories')}
        </button>
        <button
          onClick={() => setActiveTab('software')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'software'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Download className="h-4 w-4 inline mr-2" />
          {t('admin.softwareDownloads.software')}
        </button>
      </div>

      {/* 分类管理 */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              {t('admin.softwareDownloads.categories')}
            </h3>
            <Button
              onClick={() => {
                setCategoryForm({ name: '', order: 0 });
                categoryActions.openCreateForm();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.softwareDownloads.addCategory')}
            </Button>
          </div>

          {categoryState.loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              <p className="text-gray-400 mt-4">{t('common.loading')}</p>
            </div>
          ) : categoryState.items.length > 0 ? (
            <div className="grid gap-4">
              {categoryState.items.map((category) => (
                <Card key={category._id} className="bg-gray-800 border-gray-700">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-white">{category.name}</h4>
                      <p className="text-gray-400 text-sm">{t('admin.softwareDownloads.order')}: {category.order}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => categoryActions.deleteItem(category._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{t('admin.softwareDownloads.noCategoriesFound')}</p>
            </div>
          )}
        </div>
      )}

      {/* 软件管理 */}
      {activeTab === 'software' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">
              {t('admin.softwareDownloads.software')}
            </h3>
            <Button
              onClick={() => {
                setSoftwareForm({
                  name: '',
                  categoryId: '',
                  description: '',
                  downloadUrl: '',
                  importantNote: ''
                });
                softwareActions.openCreateForm();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.softwareDownloads.addSoftware')}
            </Button>
          </div>

          {softwareState.loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              <p className="text-gray-400 mt-4">{t('common.loading')}</p>
            </div>
          ) : softwareState.items.length > 0 ? (
            <div className="grid gap-4">
              {softwareState.items.map((item) => (
                <Card key={item._id} className="bg-gray-800 border-gray-700">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-medium text-white">{item.name}</h4>
                        <p className="text-gray-400 text-sm">
                          {t('admin.softwareDownloads.category')}: {getCategoryName(item.categoryId)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSoftware(item)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => softwareActions.deleteItem(item._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{item.description}</p>
                    {item.importantNote && (
                      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <p className="text-yellow-200 text-sm">{item.importantNote}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        {item.downloadUrl}
                      </a>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Download className="h-4 w-4 mr-1" />
                        {t('common.download')}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Download className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{t('admin.softwareDownloads.noSoftwareFound')}</p>
            </div>
          )}
        </div>
      )}

      {/* 分类表单弹窗 */}
      {categoryState.showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full">
            <form onSubmit={handleCategorySubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {categoryState.editingItem ? t('admin.softwareDownloads.editCategory') : t('admin.softwareDownloads.addCategory')}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => categoryActions.closeForm()}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('admin.softwareDownloads.categoryName')} *
                  </label>
                  <Input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder={t('admin.softwareDownloads.categoryNamePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('admin.softwareDownloads.order')}
                  </label>
                  <Input
                    type="number"
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) || 0 })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => categoryActions.closeForm()}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={categoryState.submitting}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {categoryState.submitting ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 软件表单弹窗 */}
      {softwareState.showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSoftwareSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {softwareState.editingItem ? t('admin.softwareDownloads.editSoftware') : t('admin.softwareDownloads.addSoftware')}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => softwareActions.closeForm()}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('admin.softwareDownloads.softwareName')} *
                  </label>
                  <Input
                    type="text"
                    value={softwareForm.name}
                    onChange={(e) => setSoftwareForm({ ...softwareForm, name: e.target.value })}
                    placeholder={t('admin.softwareDownloads.softwareNamePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('admin.softwareDownloads.category')} *
                  </label>
                  <select
                    value={softwareForm.categoryId}
                    onChange={(e) => setSoftwareForm({ ...softwareForm, categoryId: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('admin.softwareDownloads.selectCategory')}</option>
                    {categoryState.items.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('admin.softwareDownloads.description')} *
                  </label>
                  <textarea
                    value={softwareForm.description}
                    onChange={(e) => setSoftwareForm({ ...softwareForm, description: e.target.value })}
                    placeholder={t('admin.softwareDownloads.descriptionPlaceholder')}
                    required
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('admin.softwareDownloads.downloadLink')} *
                  </label>
                  <Input
                    type="url"
                    value={softwareForm.downloadUrl}
                    onChange={(e) => setSoftwareForm({ ...softwareForm, downloadUrl: e.target.value })}
                    placeholder={t('admin.softwareDownloads.downloadLinkPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('admin.softwareDownloads.importantNote')}
                  </label>
                  <textarea
                    value={softwareForm.importantNote}
                    onChange={(e) => setSoftwareForm({ ...softwareForm, importantNote: e.target.value })}
                    placeholder={t('admin.softwareDownloads.importantNotePlaceholder')}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => softwareActions.closeForm()}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={softwareState.submitting}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {softwareState.submitting ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoftwareDownloadsManager;