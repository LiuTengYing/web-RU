/**
 * 企业服务展示组件
 * 专业的服务卡片布局 - 参考阿里云、AWS服务页设计
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Briefcase, 
  ArrowRight, 
  CheckCircle, 
  Zap,
  Shield,
  Headphones,
  Settings,
  Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/services/apiClient';

interface ServiceItem {
  _id: string;
  title: string;
  summary: string;
  thumbnail?: string;
  category: string;
  status: string;
  tags?: string[];
  createdAt: string;
}

// 服务图标映射
const SERVICE_ICONS: Record<string, any> = {
  '技术支持': Headphones,
  '定制开发': Settings,
  '售后服务': Shield,
  '培训服务': Users,
  '咨询服务': Briefcase,
  '默认': Zap
};

const EnterpriseServiceDisplay: React.FC = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/content/service', {
        params: {
          status: 'published',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          limit: 100
        }
      });

      if (response.data?.success) {
        setServices(response.data.data || []);
      }
    } catch (error) {
      console.error('加载服务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (serviceId: string) => {
    window.location.href = `/services/${serviceId}`;
  };

  const getServiceIcon = (category: string) => {
    return SERVICE_ICONS[category] || SERVICE_ICONS['默认'];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero 区域 */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6">
          <Briefcase className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('pages.services')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t('pages.servicesDescription')}
        </p>
      </div>

      {/* 服务网格 - 大卡片布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {services.map((service) => {
          const IconComponent = getServiceIcon(service.category);
          
          return (
            <Card
              key={service._id}
              className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500"
              onClick={() => handleServiceClick(service._id)}
            >
              <CardContent className="p-8">
                {/* 服务图标 */}
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* 分类标签 */}
                <Badge variant="secondary" className="mb-4">
                  {service.category}
                </Badge>

                {/* 服务标题 */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>

                {/* 服务描述 */}
                <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-4 leading-relaxed">
                  {service.summary}
                </p>

                {/* 特点列表（如果有标签） */}
                {service.tags && service.tags.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {service.tags.slice(0, 3).map((tag, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{tag}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 了解更多按钮 */}
                <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                  <span>了解更多</span>
                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA 区域 */}
      {services.length > 0 && (
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">需要定制化服务？</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            我们的专业团队随时为您提供量身定制的解决方案
          </p>
          <Button
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
            onClick={() => window.location.href = '/contact'}
          >
            联系我们
          </Button>
        </div>
      )}

      {/* 空状态 */}
      {services.length === 0 && (
        <div className="text-center py-20">
          <Briefcase className="w-20 h-20 mx-auto mb-4 text-gray-400 opacity-50" />
          <p className="text-xl text-gray-600 dark:text-gray-400">{t('pages.noServices')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('pages.stayTunedServices')}</p>
        </div>
      )}
    </div>
  );
};

export default EnterpriseServiceDisplay;
