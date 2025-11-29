import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Upload, RefreshCw, Save, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

interface SiteImagesConfig {
  heroImage: string;
  installImage: string;
  updatedAt?: string;
}

const SiteImagesManager: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'hero' | 'install' | null>(null);
  const [config, setConfig] = useState<SiteImagesConfig>({
    heroImage: '',
    installImage: ''
  });
  const [originalConfig, setOriginalConfig] = useState<SiteImagesConfig>({
    heroImage: '',
    installImage: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const installFileInputRef = useRef<HTMLInputElement>(null);

  // 加载配置
  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/site-images');
      const data = await response.json();

      if (data.success) {
        setConfig(data.data);
        setOriginalConfig(data.data);
        setHasChanges(false);
      } else {
        throw new Error(data.message || t('admin.siteImages.loadFailed'));
      }
    } catch (error) {
      console.error('加载网站图片配置失败:', error);
      showMessage('error', error instanceof Error ? error.message : t('admin.siteImages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/site-images', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          heroImage: config.heroImage,
          installImage: config.installImage
        })
      });

      const data = await response.json();

      if (data.success) {
        setOriginalConfig(data.data);
        setHasChanges(false);
        showMessage('success', t('admin.siteImages.saveSuccess'));
      } else {
        throw new Error(data.message || t('admin.siteImages.saveFailed'));
      }
    } catch (error) {
      console.error('保存网站图片配置失败:', error);
      showMessage('error', error instanceof Error ? error.message : t('admin.siteImages.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // 重置配置
  const resetConfig = async () => {
    if (!confirm(t('admin.siteImages.resetConfirm'))) return;

    try {
      setSaving(true);
      const response = await fetch('/api/site-images/reset', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.data);
        setOriginalConfig(data.data);
        setHasChanges(false);
        showMessage('success', t('admin.siteImages.resetSuccess'));
      } else {
        throw new Error(data.message || t('admin.siteImages.resetFailed'));
      }
    } catch (error) {
      console.error('重置网站图片配置失败:', error);
      showMessage('error', error instanceof Error ? error.message : t('admin.siteImages.resetFailed'));
    } finally {
      setSaving(false);
    }
  };

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // 上传图片到OSS
  const handleUploadImage = async (imageType: 'hero' | 'install', file: File) => {
    try {
      setUploading(imageType);
      
      // 创建 FormData
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'site-images'); // 存储在 site-images 文件夹

      // 上传到OSS
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // 更新对应的图片URL
        const imageUrl = data.url;
        if (imageType === 'hero') {
          setConfig({ ...config, heroImage: imageUrl });
        } else {
          setConfig({ ...config, installImage: imageUrl });
        }
        showMessage('success', t('admin.siteImages.uploadSuccess'));
      } else {
        throw new Error(data.error || t('admin.siteImages.uploadFailed'));
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      showMessage('error', error instanceof Error ? error.message : t('admin.siteImages.uploadFailed'));
    } finally {
      setUploading(null);
    }
  };

  // 触发文件选择
  const handleSelectFile = (imageType: 'hero' | 'install') => {
    if (imageType === 'hero') {
      heroFileInputRef.current?.click();
    } else {
      installFileInputRef.current?.click();
    }
  };

  // 处理文件选择
  const handleFileChange = (imageType: 'hero' | 'install', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        showMessage('error', t('admin.siteImages.invalidFileType'));
        return;
      }
      // 验证文件大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', t('admin.siteImages.fileTooLarge'));
        return;
      }
      handleUploadImage(imageType, file);
    }
    // 重置input，允许重复选择同一文件
    event.target.value = '';
  };

  // 检测变更
  useEffect(() => {
    const changed = 
      config.heroImage !== originalConfig.heroImage ||
      config.installImage !== originalConfig.installImage;
    setHasChanges(changed);
  }, [config, originalConfig]);

  // 初始加载
  useEffect(() => {
    loadConfig();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20"></div>
          </div>
          <p className="text-gray-300 mt-6 text-lg">{t('admin.siteImages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl p-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30">
            <Image className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{t('admin.siteImages.title')}</h1>
            <p className="text-gray-400 text-lg mt-1">{t('admin.siteImages.description')}</p>
          </div>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`rounded-xl p-4 flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-900/30 border border-green-500/50 text-green-300' 
            : 'bg-red-900/30 border border-red-500/50 text-red-300'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Hero 图片配置 */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
          <h2 className="text-xl font-semibold text-white">{t('admin.siteImages.heroImage')}</h2>
        </div>

        <div className="space-y-4">
          {/* 隐藏的文件输入 */}
          <input
            ref={heroFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange('hero', e)}
            className="hidden"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('admin.siteImages.imageUrl')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.heroImage}
                onChange={(e) => setConfig({ ...config, heroImage: e.target.value })}
                placeholder={t('admin.siteImages.imageUrlPlaceholder')}
                className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 text-gray-200 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              />
              <button
                onClick={() => handleSelectFile('hero')}
                disabled={uploading === 'hero'}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading === 'hero' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {t('admin.siteImages.uploading')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t('admin.siteImages.uploadImage')}
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">{t('admin.siteImages.heroImageDesc')}</p>
          </div>

          {/* 图片预览 */}
          {config.heroImage && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('admin.siteImages.preview')}
              </label>
              <div className="relative rounded-xl overflow-hidden border border-gray-600/50 bg-gray-800/50">
                <img
                  src={config.heroImage}
                  alt="Hero Preview"
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzM3NDE1MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBMb2FkIEZhaWxlZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Install 图片配置 */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
          <h2 className="text-xl font-semibold text-white">{t('admin.siteImages.installImage')}</h2>
        </div>

        <div className="space-y-4">
          {/* 隐藏的文件输入 */}
          <input
            ref={installFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange('install', e)}
            className="hidden"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('admin.siteImages.imageUrl')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.installImage}
                onChange={(e) => setConfig({ ...config, installImage: e.target.value })}
                placeholder={t('admin.siteImages.imageUrlPlaceholder')}
                className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 text-gray-200 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
              />
              <button
                onClick={() => handleSelectFile('install')}
                disabled={uploading === 'install'}
                className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading === 'install' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {t('admin.siteImages.uploading')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t('admin.siteImages.uploadImage')}
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">{t('admin.siteImages.installImageDesc')}</p>
          </div>

          {/* 图片预览 */}
          {config.installImage && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('admin.siteImages.preview')}
              </label>
              <div className="relative rounded-xl overflow-hidden border border-gray-600/50 bg-gray-800/50">
                <img
                  src={config.installImage}
                  alt="Install Preview"
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzM3NDE1MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBMb2FkIEZhaWxlZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-400">
            {config.updatedAt && (
              <span>{t('admin.siteImages.lastUpdate')}: {new Date(config.updatedAt).toLocaleString()}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadConfig}
              disabled={saving}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl flex items-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.refresh')}
            </button>

            <button
              onClick={resetConfig}
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              {t('admin.siteImages.reset')}
            </button>

            <button
              onClick={saveConfig}
              disabled={saving || !hasChanges}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {t('admin.siteImages.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('admin.siteImages.save')}
                </>
              )}
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="mt-4 px-4 py-2 bg-yellow-900/30 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm">
            {t('admin.siteImages.unsavedChanges')}
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur-sm rounded-2xl border border-blue-700/50 p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-4">{t('admin.siteImages.usageTips')}</h3>
        <ul className="space-y-2 text-sm text-blue-200">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>{t('admin.siteImages.tip1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>{t('admin.siteImages.tip2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>{t('admin.siteImages.tip3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>{t('admin.siteImages.tip4')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SiteImagesManager;

