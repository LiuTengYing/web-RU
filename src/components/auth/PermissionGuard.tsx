/**
 * 权限保护组件
 * 遵循SRP原则：专门处理权限控制
 */

import React from 'react';
import { usePermissions, Permission, UserRole } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 权限保护组件属性
 */
interface PermissionGuardProps {
  children: React.ReactNode;
  
  // 权限要求（任选其一）
  permissions?: Permission[];
  roles?: UserRole[];
  
  // 权限检查模式
  requireAll?: boolean; // true: 需要所有权限, false: 需要任一权限
  
  // 无权限时的回退内容
  fallback?: React.ReactNode;
  
  // 自定义权限检查函数
  customCheck?: (permissions: ReturnType<typeof usePermissions>) => boolean;
}

/**
 * 默认无权限提示组件
 */
const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8 text-center">
    <div className="max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a2 2 0 00-2-2H8a2 2 0 00-2 2v2m8 0V9a2 2 0 00-2-2H8a2 2 0 00-2 2v2m8 0H6"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        访问受限
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        您没有权限访问此内容，请联系管理员获取相应权限。
      </p>
    </div>
  </div>
);

/**
 * 权限保护组件
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback = <DefaultFallback />,
  customCheck
}) => {
  const { user } = useAuth();
  const permissionUtils = usePermissions(user);
  
  // 执行权限检查
  const hasAccess = React.useMemo(() => {
    // 自定义检查优先
    if (customCheck) {
      return customCheck(permissionUtils);
    }
    
    // 权限检查
    if (permissions.length > 0) {
      return requireAll
        ? permissionUtils.hasAllPermissions(permissions)
        : permissionUtils.hasAnyPermission(permissions);
    }
    
    // 角色检查
    if (roles.length > 0) {
      return requireAll
        ? roles.every(role => permissionUtils.hasRole(role))
        : permissionUtils.hasAnyRole(roles);
    }
    
    // 没有指定权限要求，默认允许访问
    return true;
  }, [permissions, roles, requireAll, customCheck, permissionUtils]);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * 管理员权限保护组件
 */
export const AdminGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGuard
    permissions={[Permission.VIEW_ADMIN]}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * 内容管理权限保护组件
 */
export const ContentManageGuard: React.FC<{
  children: React.ReactNode;
  contentType?: string;
  fallback?: React.ReactNode;
}> = ({ children, contentType, fallback }) => (
  <PermissionGuard
    customCheck={(perms) => perms.canManageContentType(contentType || 'default')}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * 论坛权限保护组件
 */
export const ForumGuard: React.FC<{
  children: React.ReactNode;
  requireModeration?: boolean;
  fallback?: React.ReactNode;
}> = ({ children, requireModeration = false, fallback }) => (
  <PermissionGuard
    permissions={requireModeration ? [Permission.MODERATE_FORUM] : [Permission.ACCESS_FORUM]}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export default PermissionGuard;
