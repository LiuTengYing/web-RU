/**
 * 分类管理组件 - 管理后台分类管理界面
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Tag, FileText, Video, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
// Textarea 组件暂时使用 HTML textarea 元素
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import {
  getActiveCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  type Category,
  type CategoryStats
} from '@/services/categoryService';

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  documentTypes: string[];
}

const CategoryManager: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#3B82F6',
    documentTypes: ['general', 'video']
  });

  // 加载分类列表
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getActiveCategories();
      setCategories(data);
    } catch (error) {
      console.error('加载分类失败:', error);
      showToast({
        type: 'error',
        title: '错误',
        description: '加载分类列表失败'
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const data = await getCategoryStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  useEffect(() => {
    loadCategories();
    loadStats();
  }, []);

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      documentTypes: ['general', 'video']
    });
    setEditingCategory(null);
  };

  // 处理提交
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast({
        type: 'error',
        title: '错误',
        description: '请输入分类名称'
      });
      return;
    }

    try {
      setLoading(true);
      
      if (editingCategory) {
        // 更新分类
        await updateCategory(editingCategory._id, formData);
        showToast({
          type: 'success',
          title: '成功',
          description: t('category.categoryUpdated')
        });
      } else {
        // 创建分类
        await createCategory(formData);
        showToast({
          type: 'success',
          title: '成功',
          description: t('category.categoryCreated')
        });
      }
      
      setShowCreateModal(false);
      resetForm();
      loadCategories();
      loadStats();
    } catch (error) {
      console.error('保存分类失败:', error);
      showToast({
        type: 'error',
        title: '错误',
        description: error instanceof Error ? error.message : '保存分类失败'
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
      documentTypes: category.documentTypes || ['general', 'video']
    });
    setShowCreateModal(true);
  };

  // 处理删除
  const handleDelete = async (category: Category) => {
    if (!confirm(`${t('category.confirmDelete')}「${category.name}」${t('category.deleteConfirmMessage')}`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteCategory(category._id);
      showToast({
        type: 'success',
        title: '成功',
        description: t('category.categoryDeleted')
      });
      loadCategories();
      loadStats();
    } catch (error) {
      console.error('删除分类失败:', error);
      showToast({
        type: 'error',
        title: '错误',
        description: error instanceof Error ? error.message : '删除分类失败'
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理文档类型变化
  const handleDocumentTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      documentTypes: checked
        ? [...prev.documentTypes, type]
        : prev.documentTypes.filter(t => t !== type)
    }));
  };

  return (
    <div className="space-y-6">
      {/* 统计信息 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{t('category.totalCategories')}</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.totalCategories}</p>
                </div>
                <Tag className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{t('category.totalPublishedDocuments')}</p>
                  <p className="text-2xl font-bold text-green-400">{stats.totalDocuments}</p>
                  <p className="text-xs text-gray-500 mt-1">({t('category.publishedOnly')})</p>
                </div>
                <FileText className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{t('category.avgDocuments')}</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {Math.round(stats.avgDocumentsPerCategory)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 分类管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">{t('category.management')}</CardTitle>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('category.createCategory')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {categories.map((category) => (
              <div
                key={category._id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || '#3B82F6' }}
                  />
                  <div>
                    <h3 className="font-medium text-white">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-400">{category.description}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {category.documentCount} {t('category.publishedDocumentsCount')}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <div className="flex space-x-1">
                        {category.documentTypes.includes('general') && (
                          <FileText className="h-3 w-3 text-gray-500" title={t('category.generalTutorials')} />
                        )}
                        {category.documentTypes.includes('video') && (
                          <Video className="h-3 w-3 text-gray-500" title={t('category.videoTutorials')} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t('category.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('category.delete')}
                  </Button>
                </div>
              </div>
            ))}
            
            {categories.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                {t('category.noCategoriesMessage')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 创建/编辑分类模态框 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title={editingCategory ? t('category.editCategory') : t('category.createCategory')}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('category.categoryName')} *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('category.categoryName')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('category.categoryDescription')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('category.categoryDescription')}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('category.categoryColor')}
            </label>
            <Input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="w-20 h-10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('category.applicableDocumentTypes')}
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.documentTypes.includes('general')}
                  onChange={(e) => handleDocumentTypeChange('general', e.target.checked)}
                  className="mr-2"
                />
                <FileText className="h-4 w-4 mr-1" />
                <span className="ml-2">{t('category.generalTutorials')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.documentTypes.includes('video')}
                  onChange={(e) => handleDocumentTypeChange('video', e.target.checked)}
                  className="mr-2"
                />
                <Video className="h-4 w-4 mr-1" />
                <span className="ml-2">{t('category.videoTutorials')}</span>
              </label>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading 
                ? (editingCategory ? '更新中...' : '创建中...') 
                : (editingCategory ? t('category.update') : t('category.create'))
              }
            </Button>
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}>
              {t('category.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManager;