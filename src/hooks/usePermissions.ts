/**
 * 权限管理Hook
 * 遵循SRP原则：专门处理权限逻辑
 */

import { useMemo } from 'react';

/**
 * 用户角色枚举
 */
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

/**
 * 权限枚举
 */
export enum Permission {
  // 内容权限
  READ_CONTENT = 'read_content',
  CREATE_CONTENT = 'create_content',
  EDIT_CONTENT = 'edit_content',
  DELETE_CONTENT = 'delete_content',
  PUBLISH_CONTENT = 'publish_content',
  
  // 用户权限
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  
  // 系统权限
  VIEW_ADMIN = 'view_admin',
  MANAGE_SYSTEM = 'manage_system',
  MANAGE_CONFIG = 'manage_config',
  
  // 模块权限
  ACCESS_FORUM = 'access_forum',
  MODERATE_FORUM = 'moderate_forum',
  ACCESS_ANALYTICS = 'access_analytics',
  
  // 文件权限
  UPLOAD_FILES = 'upload_files',
  MANAGE_FILES = 'manage_files'
}

/**
 * 角色权限映射
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    Permission.READ_CONTENT
  ],
  
  [UserRole.USER]: [
    Permission.READ_CONTENT,
    Permission.ACCESS_FORUM,
    Permission.UPLOAD_FILES
  ],
  
  [UserRole.MODERATOR]: [
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.ACCESS_FORUM,
    Permission.MODERATE_FORUM,
    Permission.UPLOAD_FILES,
    Permission.VIEW_USERS
  ],
  
  [UserRole.ADMIN]: [
    Permission.READ_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.ACCESS_FORUM,
    Permission.MODERATE_FORUM,
    Permission.VIEW_ADMIN,
    Permission.MANAGE_SYSTEM,
    Permission.MANAGE_CONFIG,
    Permission.ACCESS_ANALYTICS,
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS,
    Permission.UPLOAD_FILES,
    Permission.MANAGE_FILES
  ],
  
  [UserRole.SUPER_ADMIN]: Object.values(Permission)
};

/**
 * 用户接口
 */
export interface User {
  id: string;
  username: string;
  email: string;
  roles: UserRole[];
  isActive: boolean;
}

/**
 * 权限管理Hook
 */
export const usePermissions = (user?: User | null) => {
  // 获取用户所有权限
  const userPermissions = useMemo(() => {
    if (!user || !user.isActive) {
      return ROLE_PERMISSIONS[UserRole.GUEST];
    }
    
    const permissions = new Set<Permission>();
    
    // 合并所有角色的权限
    user.roles.forEach(role => {
      ROLE_PERMISSIONS[role]?.forEach(permission => {
        permissions.add(permission);
      });
    });
    
    return Array.from(permissions);
  }, [user]);
  
  // 检查是否有特定权限
  const hasPermission = (permission: Permission): boolean => {
    return userPermissions.includes(permission);
  };
  
  // 检查是否有任一权限
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };
  
  // 检查是否有所有权限
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };
  
  // 检查是否有特定角色
  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) || false;
  };
  
  // 检查是否有任一角色
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };
  
  // 检查是否是管理员
  const isAdmin = (): boolean => {
    return hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  };
  
  // 检查是否是超级管理员
  const isSuperAdmin = (): boolean => {
    return hasRole(UserRole.SUPER_ADMIN);
  };
  
  // 检查是否可以访问管理面板
  const canAccessAdmin = (): boolean => {
    return hasPermission(Permission.VIEW_ADMIN);
  };
  
  // 检查是否可以管理特定内容类型
  const canManageContentType = (contentType: string): boolean => {
    // 基础权限检查
    if (!hasPermission(Permission.EDIT_CONTENT)) {
      return false;
    }
    
    // 特殊内容类型的额外权限检查
    switch (contentType) {
      case 'system':
        return hasPermission(Permission.MANAGE_SYSTEM);
      case 'config':
        return hasPermission(Permission.MANAGE_CONFIG);
      default:
        return true;
    }
  };
  
  // 获取可访问的模块列表（与后台模块设置结合）
  const getAccessibleModules = async () => {
    try {
      // 导入模块设置服务（动态导入避免循环依赖）
      const { default: moduleSettingsService } = await import('@/services/moduleSettingsService');
      
      const userRoles = user?.roles || ['guest'];
      return await moduleSettingsService.getAccessibleModules(userRoles);
    } catch (error) {
      console.error('获取可访问模块失败:', error);
      
      // 回退到本地权限检查
      const modules = [];
      
      if (hasPermission(Permission.READ_CONTENT)) {
        modules.push('knowledgeBase', 'products', 'cases', 'news', 'services');
      }
      
      if (hasPermission(Permission.ACCESS_FORUM)) {
        modules.push('forum');
      }
      
      if (hasPermission(Permission.VIEW_ADMIN)) {
        modules.push('admin');
      }
      
      if (hasPermission(Permission.ACCESS_ANALYTICS)) {
        modules.push('analytics');
      }
      
      return modules;
    }
  };
  
  return {
    user,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    canAccessAdmin,
    canManageContentType,
    getAccessibleModules
  };
};

export default usePermissions;
