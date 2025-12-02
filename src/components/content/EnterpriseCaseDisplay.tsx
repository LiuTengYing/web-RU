/**
 * 企业案例展示组件
 * 专业的案例展示布局 - 参考SAP、Oracle案例页设计
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, ArrowRight, TrendingUp, Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/services/apiClient';

interface CaseItem {
  _id: string;
  title: string;
  summary: string;
  thumbnail?: string;
  category: string;
  status: string;
  tags?: string[];
  createdAt: string;
}

interface EnterpriseCaseDisplayProps {
  limit?: number;
  showPagination?: boolean;
}

const EnterpriseCaseDisplay: React.FC<EnterpriseCaseDisplayProps> = ({
  limit = 9,
  showPagination = true
}) => {
  const { t } = useTranslation();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadCases();
  }, [currentPage, selectedCategory]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        status: 'published',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const response = await apiClient.get('/v1/content/case', { params });

      if (response.data?.success) {
        setCases(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        
        // 提取分类
        const allCategories = response.data.data.map((c: CaseItem) => c.category).filter((c: string) => c);
        setCategories(['all', ...Array.from(new Set(allCategories)) as string[]]);
      }
    } catch (error) {
      console.error('加载案例失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseClick = (caseId: string) => {
    window.location.href = `/cases/${caseId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 焦点案例（第一个）
  const featuredCase = cases[0];
  const regularCases = cases.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl mb-6">
          <Award className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('pages.cases')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('pages.casesDescription')}
        </p>
      </div>

      {/* 行业筛选 */}
      {categories.length > 1 && (
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setCurrentPage(1);
              }}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category === 'all' ? '全部行业' : category}
            </button>
          ))}
        </div>
      )}

      {/* 焦点案例 - 大横幅 */}
      {featuredCase && (
        <Card 
          className="mb-12 overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300"
          onClick={() => handleCaseClick(featuredCase._id)}
        >
          <div className="flex flex-col lg:flex-row">
            {/* 案例大图 */}
            <div className="lg:w-1/2 relative h-96 lg:h-auto overflow-hidden">
              {featuredCase.thumbnail ? (
                <>
                  <img
                    src={featuredCase.thumbnail}
                    alt={featuredCase.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600/30 to-transparent" />
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-orange-600 text-white text-sm px-4 py-2">
                      焦点案例
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Award className="w-32 h-32 text-white opacity-50" />
                </div>
              )}
            </div>

            {/* 案例内容 */}
            <CardContent className="lg:w-1/2 p-10">
              <Badge variant="secondary" className="mb-4">
                {featuredCase.category}
              </Badge>

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-orange-600 transition-colors">
                {featuredCase.title}
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed line-clamp-4">
                {featuredCase.summary}
              </p>

              {/* 关键指标 */}
              {featuredCase.tags && featuredCase.tags.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {featuredCase.tags.slice(0, 4).map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{tag}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center text-orange-600 font-medium group-hover:text-orange-700 text-lg">
                <span>查看完整案例</span>
                <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" />
              </div>
            </CardContent>
          </div>
        </Card>
      )}

      {/* 常规案例网格 */}
      {regularCases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {regularCases.map((caseItem) => (
            <Card
              key={caseItem._id}
              className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => handleCaseClick(caseItem._id)}
            >
              {/* 案例图片 */}
              <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden">
                {caseItem.thumbnail ? (
                  <>
                    <img
                      src={caseItem.thumbnail}
                      alt={caseItem.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="w-20 h-20 text-gray-400" />
                  </div>
                )}

                {/* 行业标签 */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-orange-600 text-white">
                    {caseItem.category}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                {/* 案例标题 */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
                  {caseItem.title}
                </h3>

                {/* 案例描述 */}
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 text-sm">
                  {caseItem.summary}
                </p>

                {/* 关键成果 */}
                {caseItem.tags && caseItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {caseItem.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded"
                      >
                        <TrendingUp className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 查看详情 */}
                <div className="flex items-center text-orange-600 font-medium group-hover:text-orange-700">
                  <span className="text-sm">查看详情</span>
                  <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
      {showPagination && totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-medium ${
                  currentPage === page
                    ? 'bg-orange-600 text-white'
                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* 空状态 */}
      {cases.length === 0 && (
        <div className="text-center py-20">
          <Award className="w-20 h-20 mx-auto mb-4 text-gray-400 opacity-50" />
          <p className="text-xl text-gray-600 dark:text-gray-400">{t('pages.noCases')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('pages.stayTunedCases')}</p>
        </div>
      )}
    </div>
  );
};

export default EnterpriseCaseDisplay;
