/**
 * 分类浏览组件 - 用户界面按分类浏览文档
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, FileText, Video, ChevronRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getActiveCategories, type Category } from '@/services/categoryService';
import { getDocuments } from '@/services/documentApi';

interface CategoryBrowserProps {
  documentType: 'video' | 'general';
  onViewDocument: (doc: any) => void;
  className?: string;
}

const CategoryBrowser: React.FC<CategoryBrowserProps> = ({
  documentType,
  onViewDocument,
  className = ''
}) => {
  const { t } = useTranslation();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // 加载分类列表
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const allCategories = await getActiveCategories();
        // 过滤适用于当前文档类型的分类
        const filteredCategories = allCategories.filter(category => 
          category.documentTypes.includes(documentType)
        );
        setCategories(filteredCategories);
      } catch (error) {
        console.error('加载分类失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [documentType]);

  // 加载分类下的文档
  const loadCategoryDocuments = async (category: Category) => {
    try {
      setDocumentsLoading(true);
      setSelectedCategory(category);
      
      // 获取该分类下的已发布文档
      const result = await getDocuments({
        documentType,
        category: category.name,
        status: 'published',
        limit: 1000
      });
      
      setDocuments(result.documents);
    } catch (error) {
      console.error('加载分类文档失败:', error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // 返回分类列表
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setDocuments([]);
  };

  if (loading) {
    return (
      <div className={`text-center text-gray-400 py-12 ${className}`}>
        {t('common.loading')}
      </div>
    );
  }

  // 显示分类下的文档列表
  if (selectedCategory) {
    return (
      <div className={className}>
        {/* 返回按钮和分类标题 */}
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={handleBackToCategories}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('category.backToCategories')}
          </Button>
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-3"
              style={{ backgroundColor: selectedCategory.color }}
            />
            <h2 className="text-xl font-bold text-white">{selectedCategory.name}</h2>
            {selectedCategory.description && (
              <span className="ml-3 text-gray-400">- {selectedCategory.description}</span>
            )}
          </div>
        </div>

        {/* 文档列表 */}
        {documentsLoading ? (
          <div className="text-center text-gray-400 py-12">
            {t('common.loading')}
          </div>
        ) : documents.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                {documentType === 'video' ? (
                  <Video className="h-8 w-8 text-gray-400" />
                ) : (
                  <FileText className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <p className="text-gray-400">
                {documentType === 'video' 
                  ? t('category.noVideosInCategory') 
                  : t('category.noDocumentsInCategory')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Card
                key={doc._id}
                className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => onViewDocument(doc)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {documentType === 'video' ? (
                        <Video className="h-5 w-5 text-green-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-purple-400" />
                      )}
                      <span className="text-xs text-gray-400 uppercase tracking-wide">
                        {documentType === 'video' ? t('knowledge.videoTutorial') : t('knowledge.generalDocument')}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  </div>
                  <CardTitle className="text-white text-lg leading-tight group-hover:text-blue-300 transition-colors">
                    {doc.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {doc.summary && (
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                      {doc.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{doc.authorId?.username || doc.author || t('knowledge.technicalTeam')}</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 显示分类列表
  return (
    <div className={className}>
      {categories.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Tag className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{t('category.noCategories')}</h3>
            <p className="text-gray-300 text-lg">
              {documentType === 'video' 
                ? t('category.videoCategoriesComingSoon') 
                : t('category.documentCategoriesComingSoon')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-6">
            {documentType === 'video' 
              ? t('category.selectVideoCategory') 
              : t('category.selectDocumentCategory')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card
                key={category._id}
                className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => loadCategoryDocuments(category)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <CardTitle className="text-white text-lg group-hover:text-blue-300 transition-colors">
                        {category.name}
                      </CardTitle>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {category.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {documentType === 'video' 
                        ? (category.videoCount || 0)
                        : (category.generalCount || 0)
                      } {t('category.documents')}
                    </span>
                    <div className="flex items-center space-x-1">
                      {category.documentTypes.includes('general') && (
                        <FileText className="h-3 w-3 text-gray-500" />
                      )}
                      {category.documentTypes.includes('video') && (
                        <Video className="h-3 w-3 text-gray-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryBrowser;
