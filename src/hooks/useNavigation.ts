/**
 * 导航管理Hook
 * 遵循DRY原则：统一管理导航逻辑
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { navigationManager, NavigationItem } from '@/config/navigation';
import { apiClient } from '@/services/apiClient';

/**
 * 导航Hook返回类型
 */
interface UseNavigationReturn {
  navigation: NavigationItem[];
  mainNavigation: NavigationItem[];
  enterpriseNavigation: NavigationItem[];
  toolsNavigation: NavigationItem[];
  loading: boolean;
  error: string | null;
  refreshNavigation: () => Promise<void>;
}

/**
 * 导航管理Hook
 */
export const useNavigation = (userRoles: string[] = []): UseNavigationReturn => {
  const { t } = useTranslation();
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 加载模块配置并更新导航
   */
  const loadModuleConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/v1/config/modules/enabled');
      
      if (response.success && response.data) {
        // 转换为配置格式
        const moduleConfig: any = {};
        response.data.forEach((module: any) => {
          moduleConfig[module.name] = module.config;
        });
        
        // 更新导航管理器
        navigationManager.updateModuleConfig(moduleConfig);
        
        // 获取启用的导航项
        const enabledNavigation = navigationManager.getEnabledNavigation();
        
        // 过滤权限
        const filteredNavigation = navigationManager.filterByPermissions(enabledNavigation, userRoles);
        
        setNavigation(filteredNavigation);
      } else {
        // 如果API失败，使用默认导航
        const defaultNavigation = navigationManager.getEnabledNavigation();
        const filteredNavigation = navigationManager.filterByPermissions(defaultNavigation, userRoles);
        setNavigation(filteredNavigation);
      }
    } catch (err) {
      console.error('加载导航配置失败:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // 使用默认导航作为后备
      const defaultNavigation = navigationManager.getEnabledNavigation();
      const filteredNavigation = navigationManager.filterByPermissions(defaultNavigation, userRoles);
      setNavigation(filteredNavigation);
    } finally {
      setLoading(false);
    }
  }, [userRoles]); // 添加 userRoles 作为依赖
  
  /**
   * 刷新导航
   */
  const refreshNavigation = async () => {
    await loadModuleConfig();
  };
  
  // 初始加载
  useEffect(() => {
    loadModuleConfig();
  }, [loadModuleConfig]); // 添加 loadModuleConfig 作为依赖
  
  // 按分类分组导航 - 使用 useMemo 避免每次都重新计算
  const mainNavigation = useMemo(() => 
    navigation.filter(item => item.category === 'main')
  , [navigation]);
  
  const enterpriseNavigation = useMemo(() => 
    navigation.filter(item => item.category === 'enterprise')
  , [navigation]);
  
  const toolsNavigation = useMemo(() => 
    navigation.filter(item => item.category === 'tools')
  , [navigation]);
  
  return {
    navigation,
    mainNavigation,
    enterpriseNavigation,
    toolsNavigation,
    loading,
    error,
    refreshNavigation
  };
};
