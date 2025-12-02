/**
 * 主页最新动态组件
 * 展示3条最新新闻
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/apiClient';

interface News {
  _id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  createdAt: string;
}

export const LatestNews: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await apiClient.get('/v1/content/news');
        // 只取前3个
        setNews(response.data.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading || news.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* 标题 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-4">
            <Newspaper className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">
              {t('dashboard.latestNews.badge')}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('dashboard.latestNews.title')}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t('dashboard.latestNews.subtitle')}
          </p>
        </div>

        {/* 新闻网格 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {news.map((item) => (
            <div
              key={item._id}
              className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 cursor-pointer hover:-translate-y-1"
              onClick={() => navigate('/news')}
            >
              {/* 新闻图片 */}
              <div className="relative h-48 bg-gradient-to-br from-green-500/20 to-blue-500/20 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Newspaper className="w-16 h-16 text-green-400/30" />
                  </div>
                )}
                {/* 渐变蒙层 */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              </div>

              {/* 新闻信息 */}
              <div className="p-6">
                {/* 日期 */}
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>

                {/* 标题 */}
                <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-green-300 transition-colors">
                  {item.title}
                </h3>

                {/* 摘要 */}
                {item.summary && (
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                    {item.summary}
                  </p>
                )}

                {/* 查看更多 */}
                <div className="flex items-center text-green-400 text-sm font-medium group-hover:gap-2 transition-all">
                  <span>{t('dashboard.latestNews.readMore')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 查看全部按钮 */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/news')}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 group"
          >
            <span>{t('dashboard.latestNews.viewAll')}</span>
            <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
