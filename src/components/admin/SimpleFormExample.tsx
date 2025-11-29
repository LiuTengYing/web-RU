/**
 * 简单表单示例 - 演示重构后的Hook使用
 * 这个组件展示了如何使用新的表单验证Hook和管理Hook
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormValidation, validationRules } from '@/hooks/useFormValidation';
import { useSettingsManager } from '@/hooks/useAdminManager';
import { siteSettingsService, SiteSettings } from '@/services/siteSettingsService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Settings, Save, RotateCcw } from 'lucide-react';

/**
 * 网站设置表单组件
 * 使用新的Hook系统，代码量大幅减少
 */
const SimpleFormExample: React.FC = () => {
  const { t } = useTranslation();

  // 使用设置管理Hook - 自动处理加载、保存、错误处理
  const [settingsState, settingsActions] = useSettingsManager(siteSettingsService, {
    onSuccess: (action, data) => {
      console.log(`Settings ${action} success:`, data);
    },
    onError: (action, error) => {
      console.error(`Settings ${action} error:`, error);
    },
  });

  // 使用表单验证Hook - 自动处理验证、错误显示
  const [formState, formActions] = useFormValidation<Partial<SiteSettings>>(
    {
      siteName: settingsState.settings?.siteName || '',
      siteSubtitle: settingsState.settings?.siteSubtitle || '',
      logoText: settingsState.settings?.logoText || '',
      heroTitle: settingsState.settings?.heroTitle || '',
      heroSubtitle: settingsState.settings?.heroSubtitle || '',
    },
    {
      siteName: {
        rules: {
          ...validationRules.required('网站名称'),
          ...validationRules.minLength(2, '网站名称至少2个字符'),
          ...validationRules.maxLength(100, '网站名称不能超过100个字符'),
        },
      },
      siteSubtitle: {
        rules: {
          ...validationRules.maxLength(200, '网站副标题不能超过200个字符'),
        },
      },
      logoText: {
        rules: {
          ...validationRules.maxLength(50, 'Logo文字不能超过50个字符'),
        },
      },
      heroTitle: {
        rules: {
          ...validationRules.maxLength(200, '主标题不能超过200个字符'),
        },
      },
      heroSubtitle: {
        rules: {
          ...validationRules.maxLength(300, '副标题不能超过300个字符'),
        },
      },
    }
  );

  // 当设置加载完成时，更新表单数据
  React.useEffect(() => {
    if (settingsState.settings) {
      formActions.setValues({
        siteName: settingsState.settings.siteName,
        siteSubtitle: settingsState.settings.siteSubtitle,
        logoText: settingsState.settings.logoText,
        heroTitle: settingsState.settings.heroTitle,
        heroSubtitle: settingsState.settings.heroSubtitle,
      });
    }
  }, [settingsState.settings, formActions]);

  // 处理表单提交
  const handleSubmit = formActions.handleSubmit(async (data) => {
    await settingsActions.updateSettings(data);
  });

  // 重置表单
  const handleReset = () => {
    if (settingsState.settings) {
      formActions.reset({
        siteName: settingsState.settings.siteName,
        siteSubtitle: settingsState.settings.siteSubtitle,
        logoText: settingsState.settings.logoText,
        heroTitle: settingsState.settings.heroTitle,
        heroSubtitle: settingsState.settings.heroSubtitle,
      });
    }
  };

  if (settingsState.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-400">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6" />
            网站设置示例
          </h2>
          <p className="text-gray-400 mt-1">
            演示重构后的表单验证和设置管理功能
          </p>
        </div>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">基本设置</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="网站名称"
                value={formState.data.siteName || ''}
                onChange={(e) => formActions.setValue('siteName', e.target.value)}
                onBlur={() => formActions.setTouched('siteName')}
                error={formState.touched.siteName ? formState.errors.siteName : undefined}
                disabled={formState.isSubmitting}
                placeholder="请输入网站名称"
              />

              <Input
                label="网站副标题"
                value={formState.data.siteSubtitle || ''}
                onChange={(e) => formActions.setValue('siteSubtitle', e.target.value)}
                onBlur={() => formActions.setTouched('siteSubtitle')}
                error={formState.touched.siteSubtitle ? formState.errors.siteSubtitle : undefined}
                disabled={formState.isSubmitting}
                placeholder="请输入网站副标题"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Logo文字"
                value={formState.data.logoText || ''}
                onChange={(e) => formActions.setValue('logoText', e.target.value)}
                onBlur={() => formActions.setTouched('logoText')}
                error={formState.touched.logoText ? formState.errors.logoText : undefined}
                disabled={formState.isSubmitting}
                placeholder="请输入Logo文字"
              />

              <Input
                label="主标题"
                value={formState.data.heroTitle || ''}
                onChange={(e) => formActions.setValue('heroTitle', e.target.value)}
                onBlur={() => formActions.setTouched('heroTitle')}
                error={formState.touched.heroTitle ? formState.errors.heroTitle : undefined}
                disabled={formState.isSubmitting}
                placeholder="请输入主标题"
              />
            </div>

            <Input
              label="副标题"
              value={formState.data.heroSubtitle || ''}
              onChange={(e) => formActions.setValue('heroSubtitle', e.target.value)}
              onBlur={() => formActions.setTouched('heroSubtitle')}
              error={formState.touched.heroSubtitle ? formState.errors.heroSubtitle : undefined}
              disabled={formState.isSubmitting}
              placeholder="请输入副标题"
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={!formState.isValid || formState.isSubmitting || settingsState.submitting}
                className="flex items-center gap-2"
              >
                {formState.isSubmitting || settingsState.submitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t('common.save')}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={formState.isSubmitting || settingsState.submitting || !formState.isDirty}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t('common.reset')}
              </Button>
            </div>

            {/* 表单状态显示 */}
            <div className="mt-4 p-4 bg-gray-700/30 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">表单状态（调试信息）:</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>验证状态: {formState.isValid ? '✅ 有效' : '❌ 无效'}</div>
                <div>是否修改: {formState.isDirty ? '✅ 已修改' : '⭕ 未修改'}</div>
                <div>提交中: {formState.isSubmitting ? '✅ 是' : '⭕ 否'}</div>
                <div>错误数量: {Object.keys(formState.errors).length}</div>
                {Object.keys(formState.errors).length > 0 && (
                  <div className="text-red-400">
                    错误: {Object.values(formState.errors).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleFormExample;
