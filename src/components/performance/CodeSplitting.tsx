/**
 * 代码分割和懒加载工具组件
 * 提供统一的代码分割和错误边界处理
 */

import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/**
 * 懒加载组件属性
 */
interface LazyComponentProps {
  children: LazyExoticComponent<ComponentType<any>>;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

/**
 * 默认加载中组件
 */
const DefaultLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="lg" />
  </div>
);

/**
 * 默认错误组件
 */
const DefaultErrorFallback: React.FC<{
  error: Error;
  resetErrorBoundary: () => void;
}> = ({ error, resetErrorBoundary }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
      <svg
        className="w-8 h-8 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
      组件加载失败
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      {error.message || '组件加载时发生错误'}
    </p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      重试
    </button>
  </div>
);

/**
 * 懒加载组件包装器
 */
export const LazyComponent: React.FC<LazyComponentProps> = ({
  children: LazyComponentToRender,
  fallback = <DefaultLoadingFallback />,
  errorFallback = DefaultErrorFallback,
  onError
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={errorFallback}
      onError={onError}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={fallback}>
        <LazyComponentToRender />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * 创建懒加载组件的工厂函数
 */
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    fallback?: React.ReactNode;
    errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
    onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  }
) => {
  const LazyComponentInstance = React.lazy(importFn);
  
  return (props: React.ComponentProps<T>) => (
    <LazyComponent
      fallback={options?.fallback}
      errorFallback={options?.errorFallback}
      onError={options?.onError}
    >
      <LazyComponentInstance {...props} />
    </LazyComponent>
  );
};

/**
 * 预加载组件
 */
export const preloadComponent = (importFn: () => Promise<any>) => {
  // 在空闲时间预加载
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().catch(() => {
        // 静默处理预加载错误
      });
    });
  } else {
    // 降级到setTimeout
    setTimeout(() => {
      importFn().catch(() => {
        // 静默处理预加载错误
      });
    }, 0);
  }
};

/**
 * 路由级别的懒加载组件
 */
export const LazyRoute: React.FC<{
  component: LazyExoticComponent<ComponentType<any>>;
}> = ({ component: Component }) => (
  <LazyComponent>
    <Component />
  </LazyComponent>
);

export default LazyComponent;
