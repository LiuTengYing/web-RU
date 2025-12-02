/**
 * SEO头部组件
 * 遵循SEO最佳实践，提供统一的meta标签管理
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

/**
 * SEO配置接口
 */
interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
}

/**
 * SEO头部组件
 */
export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  noIndex = false,
  noFollow = false,
  canonical
}) => {
  const { t, i18n } = useTranslation();
  const { siteSettings } = useSiteSettings();
  
  useEffect(() => {
    // 构建完整标题
    const fullTitle = title 
      ? `${title} - ${siteSettings?.siteName || t('layout.logo')}`
      : siteSettings?.siteName || t('layout.logo');
    
    // 构建描述
    const metaDescription = description || siteSettings?.siteSubtitle || t('dashboard.subtitle');
    
    // 构建关键词
    const metaKeywords = [
      ...keywords,
      '汽车防盗系统',
      '车辆安全',
      '防盗器',
      '汽车电子',
      '技术支持'
    ].join(', ');
    
    // 构建图片URL
    const metaImage = image || '/images/og-default.jpg';
    const fullImageUrl = metaImage.startsWith('http') 
      ? metaImage 
      : `${window.location.origin}${metaImage}`;
    
    // 构建页面URL
    const pageUrl = url || window.location.href;
    const canonicalUrl = canonical || pageUrl;
    
    // 构建robots指令
    const robotsContent = [
      noIndex ? 'noindex' : 'index',
      noFollow ? 'nofollow' : 'follow'
    ].join(', ');
    
    // 更新或创建meta标签的辅助函数
    const setMetaTag = (property: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };
    
    // 设置title
    document.title = fullTitle;
    
    // 基础meta标签
    setMetaTag('description', metaDescription);
    setMetaTag('keywords', metaKeywords);
    setMetaTag('author', author || siteSettings?.siteName || '');
    setMetaTag('robots', robotsContent);
    setMetaTag('language', i18n.language);
    
    // 设置canonical链接
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);
    
    // Open Graph标签
    setMetaTag('og:type', type, true);
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', metaDescription, true);
    setMetaTag('og:image', fullImageUrl, true);
    setMetaTag('og:url', pageUrl, true);
    setMetaTag('og:site_name', siteSettings?.siteName || '', true);
    setMetaTag('og:locale', i18n.language === 'zh' ? 'zh_CN' : 'en_US', true);
    
    // Twitter Card标签
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', metaDescription);
    setMetaTag('twitter:image', fullImageUrl);
    
    // 文章特定标签
    if (type === 'article') {
      if (publishedTime) {
        setMetaTag('article:published_time', publishedTime, true);
      }
      if (modifiedTime) {
        setMetaTag('article:modified_time', modifiedTime, true);
      }
      if (author) {
        setMetaTag('article:author', author, true);
      }
      if (section) {
        setMetaTag('article:section', section, true);
      }
      tags.forEach((tag) => {
        setMetaTag(`article:tag`, tag, true);
      });
    }
    
    // 移动端优化
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
    
    setMetaTag('theme-color', '#1f2937');
    setMetaTag('msapplication-TileColor', '#1f2937');
    
    // 结构化数据
    const structuredData = {
      "@context": "https://schema.org",
      "@type": type === 'article' ? 'Article' : 'WebSite',
      "name": fullTitle,
      "description": metaDescription,
      "url": pageUrl,
      "image": fullImageUrl,
      "author": {
        "@type": "Organization",
        "name": siteSettings?.siteName || ''
      },
      "publisher": {
        "@type": "Organization",
        "name": siteSettings?.siteName || '',
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/images/logo.png`
        }
      },
      ...(publishedTime && { "datePublished": publishedTime }),
      ...(modifiedTime && { "dateModified": modifiedTime })
    };
    
    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData);
    
  }, [title, description, keywords, image, url, type, publishedTime, modifiedTime, author, section, tags, noIndex, noFollow, canonical, t, i18n.language, siteSettings]);
  
  return null;
};

export default SEOHead;