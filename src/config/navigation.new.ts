/**
 * 导航配置 - 企业官网专业版 v2.0
 * 遵循扁平化、分类清晰的设计原则
 * 参考华为、Apple等企业官网最佳实践
 */

import { 
  Home,
  Building2,
  Wrench,
  HelpCircle,
  BookOpen, 
  MessageSquare, 
  Download, 
  Music, 
  PhoneCall,
  Layers,
  Package,
  Award,
  Newspaper,
  Settings as SettingsIcon,
  Info
} from 'lucide-react';

/**
 * 导航项接口
 */
export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  translationKey: string;
  enabled: boolean;
  order: number;
  requiresAuth?: boolean;
  roles?: string[];
  category: 'primary' | 'secondary';
  children?: NavigationItem[]; // 支持二级菜单（下拉）
}

/**
 * 重新设计的导航配置
 * 
 * 结构：
 * 1. 首页
 * 2. 解决方案（产品、服务、案例）
 * 3. 资源中心（知识库、论坛、下载）
 * 4. 工具（音频均衡器等）
 * 5. 新闻动态
 * 6. 联系我们
 */
export const DEFAULT_NAVIGATION: NavigationItem[] = [
  // ==================== 一级导航：首页 ====================
  {
    name: 'home',
    href: '/',
    icon: Home,
    translationKey: 'navigation.home',
    enabled: true,
    order: 1,
    category: 'primary'
  },
  
  // ==================== 一级导航：解决方案（企业核心）====================
  {
    name: 'solutions',
    href: '#', // 不可直接访问，必须选择子菜单
    icon: Building2,
    translationKey: 'navigation.solutions',
    enabled: true,
    order: 2,
    category: 'primary',
    children: [
      {
        name: 'products',
        href: '/solutions/products',
        icon: Package,
        translationKey: 'navigation.products',
        enabled: true,
        order: 1,
        category: 'secondary'
      },
      {
        name: 'services',
        href: '/solutions/services',
        icon: SettingsIcon,
        translationKey: 'navigation.services',
        enabled: true,
        order: 2,
        category: 'secondary'
      },
      {
        name: 'cases',
        href: '/solutions/cases',
        icon: Award,
        translationKey: 'navigation.cases',
        enabled: true,
        order: 3,
        category: 'secondary'
      }
    ]
  },
  
  // ==================== 一级导航：资源中心（整合知识内容）====================
  {
    name: 'resources',
    href: '#',
    icon: Layers,
    translationKey: 'navigation.resources',
    enabled: true,
    order: 3,
    category: 'primary',
    children: [
      {
        name: 'knowledge',
        href: '/resources/knowledge',
        icon: BookOpen,
        translationKey: 'navigation.knowledgeBase',
        enabled: true,
        order: 1,
        category: 'secondary'
      },
      {
        name: 'forum',
        href: '/resources/forum',
        icon: MessageSquare,
        translationKey: 'navigation.community',
        enabled: true,
        order: 2,
        category: 'secondary'
      },
      {
        name: 'downloads',
        href: '/resources/downloads',
        icon: Download,
        translationKey: 'navigation.downloads',
        enabled: true,
        order: 3,
        category: 'secondary'
      }
    ]
  },
  
  // ==================== 一级导航：工具（功能集合）====================
  {
    name: 'tools',
    href: '#',
    icon: Wrench,
    translationKey: 'navigation.tools',
    enabled: true,
    order: 4,
    category: 'primary',
    children: [
      {
        name: 'audioEqualizer',
        href: '/tools/audio-equalizer',
        icon: Music,
        translationKey: 'navigation.audioEqualizer',
        enabled: true,
        order: 1,
        category: 'secondary'
      }
      // 将来可以添加更多工具
    ]
  },
  
  // ==================== 一级导航：新闻动态 ====================
  {
    name: 'news',
    href: '/news',
    icon: Newspaper,
    translationKey: 'navigation.news',
    enabled: true,
    order: 5,
    category: 'primary'
  },
  
  // ==================== 一级导航：关于我们 ====================
  {
    name: 'about',
    href: '/about',
    icon: Info,
    translationKey: 'navigation.about',
    enabled: true,
    order: 6,
    category: 'primary'
  },
  
  // ==================== 一级导航：联系我们 ====================
  {
    name: 'contact',
    href: '/contact',
    icon: PhoneCall,
    translationKey: 'navigation.contact',
    enabled: true,
    order: 7,
    category: 'primary'
  },
  
  // ==================== 一级导航：支持中心 ====================
  {
    name: 'support',
    href: '/support',
    icon: HelpCircle,
    translationKey: 'navigation.support',
    enabled: true,
    order: 8,
    category: 'primary',
    children: [
      {
        name: 'helpCenter',
        href: '/support/help',
        icon: HelpCircle,
        translationKey: 'navigation.helpCenter',
        enabled: true,
        order: 1,
        category: 'secondary'
      },
      {
        name: 'feedback',
        href: '/support/feedback',
        icon: MessageSquare,
        translationKey: 'navigation.feedback',
        enabled: true,
        order: 2,
        category: 'secondary'
      }
    ]
  }
];

/**
 * 导航管理类
 */
export class NavigationManager {
  private static instance: NavigationManager;
  private navigation: NavigationItem[] = [...DEFAULT_NAVIGATION];
  private moduleConfig: any = null;
  
  static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }
  
  /**
   * 更新模块配置
   */
  updateModuleConfig(config: any) {
    this.moduleConfig = config;
    this.updateNavigationFromConfig();
  }
  
  /**
   * 根据模块配置更新导航
   */
  private updateNavigationFromConfig() {
    if (!this.moduleConfig) return;
    
    this.navigation = this.navigation.map(item => {
      const moduleConfig = this.moduleConfig[item.name];
      if (moduleConfig) {
        const updatedItem = {
          ...item,
          enabled: moduleConfig.enabled,
          order: moduleConfig.displayOrder || item.order
        };
        
        // 递归更新子菜单
        if (item.children) {
          updatedItem.children = item.children.map(child => {
            const childConfig = this.moduleConfig[child.name];
            if (childConfig) {
              return {
                ...child,
                enabled: childConfig.enabled,
                order: childConfig.displayOrder || child.order
              };
            }
            return child;
          });
        }
        
        return updatedItem;
      }
      return item;
    });
  }
  
  /**
   * 获取启用的导航项
   */
  getEnabledNavigation(): NavigationItem[] {
    return this.navigation
      .filter(item => item.enabled)
      .map(item => {
        // 如果有子菜单，过滤启用的子项
        if (item.children) {
          return {
            ...item,
            children: item.children
              .filter(child => child.enabled)
              .sort((a, b) => a.order - b.order)
          };
        }
        return item;
      })
      .sort((a, b) => a.order - b.order);
  }
  
  /**
   * 按分类获取导航项
   */
  getNavigationByCategory(category: 'primary' | 'secondary'): NavigationItem[] {
    return this.navigation
      .filter(item => item.enabled && item.category === category)
      .sort((a, b) => a.order - b.order);
  }
  
  /**
   * 检查用户权限
   */
  filterByPermissions(items: NavigationItem[], userRoles: string[] = []): NavigationItem[] {
    return items.filter(item => {
      if (!item.requiresAuth) return true;
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.some(role => userRoles.includes(role));
    }).map(item => {
      // 递归过滤子菜单权限
      if (item.children) {
        return {
          ...item,
          children: this.filterByPermissions(item.children, userRoles)
        };
      }
      return item;
    });
  }
  
  /**
   * 添加自定义导航项
   */
  addNavigationItem(item: NavigationItem) {
    const existingIndex = this.navigation.findIndex(nav => nav.name === item.name);
    if (existingIndex >= 0) {
      this.navigation[existingIndex] = item;
    } else {
      this.navigation.push(item);
    }
  }
  
  /**
   * 移除导航项
   */
  removeNavigationItem(name: string) {
    this.navigation = this.navigation.filter(item => item.name !== name);
  }
  
  /**
   * 重置为默认配置
   */
  reset() {
    this.navigation = [...DEFAULT_NAVIGATION];
    this.moduleConfig = null;
  }
}

// 导出单例实例
export const navigationManager = NavigationManager.getInstance();
