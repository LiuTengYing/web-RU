/**
 * 网站图片配置服务
 * 提供获取和更新网站 Hero 图片和 Install 图片的前端接口
 */

export interface SiteImagesConfig {
  heroImage: string;
  installImage: string;
  updatedAt?: string;
}

/**
 * 获取网站图片配置
 */
export async function getSiteImages(): Promise<SiteImagesConfig> {
  try {
    const response = await fetch('/api/site-images');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || '获取网站图片配置失败');
    }

    return data.data;
  } catch (error) {
    console.error('获取网站图片配置失败:', error);
    throw error;
  }
}

/**
 * 更新网站图片配置
 */
export async function updateSiteImages(
  updates: { heroImage?: string; installImage?: string }
): Promise<SiteImagesConfig> {
  try {
    const response = await fetch('/api/site-images', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || '更新网站图片配置失败');
    }

    return data.data;
  } catch (error) {
    console.error('更新网站图片配置失败:', error);
    throw error;
  }
}

/**
 * 重置网站图片配置为默认值
 */
export async function resetSiteImages(): Promise<SiteImagesConfig> {
  try {
    const response = await fetch('/api/site-images/reset', {
      method: 'POST',
      credentials: 'include'
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || '重置网站图片配置失败');
    }

    return data.data;
  } catch (error) {
    console.error('重置网站图片配置失败:', error);
    throw error;
  }
}

