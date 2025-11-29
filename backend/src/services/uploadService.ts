import { Request } from 'express';
import { getOSSClient, uploadPaths } from '../config/oss';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

export interface UploadOptions {
  folder?: 'homepage' | 'vehicles' | 'documents' | 'uploads' | 'temp';
  customPath?: string;
  fileName?: string;
}

/**
 * 上传图片到OSS
 */
export const uploadImageToOSS = async (
  file: Express.Multer.File,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    // 验证文件类型
    if (!file.mimetype.startsWith('image/')) {
      return {
        success: false,
        error: '只支持图片文件上传'
      };
    }

    // 验证文件大小 (限制为5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log(`文件过大: ${file.originalname}, 大小: ${file.size} bytes (${(file.size/1024/1024).toFixed(2)}MB)`);
      return {
        success: false,
        error: `文件大小不能超过5MB，当前文件大小: ${(file.size/1024/1024).toFixed(2)}MB`
      };
    }

    // 确定上传路径
    const folder = options.folder || 'uploads';
    const basePath = uploadPaths[folder];
    
    if (!basePath) {
      console.error(`无效的上传文件夹: ${folder}, 可用的文件夹:`, Object.keys(uploadPaths));
      return {
        success: false,
        error: `无效的上传文件夹: ${folder}`
      };
    }
    
    console.log(`使用上传路径: ${folder} -> ${basePath}`);
    
    // 生成文件名
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = originalName.split('.').pop();
    const fileName = options.fileName || `${timestamp}-${originalName}`;
    
    // 完整路径
    const ossPath = `${basePath}${fileName}`;

    console.log(`开始上传图片到OSS: ${ossPath}`);
    console.log(`文件信息: 大小=${file.size}字节, 类型=${file.mimetype}`);

    // 上传到OSS
    const ossClient = getOSSClient();
    const result = await ossClient.put(ossPath, file.buffer, {
      mime: file.mimetype,
      headers: {
        'Cache-Control': 'max-age=31536000', // 1年缓存
      }
    });

    console.log(`✅ 图片上传成功: ${result.url}`);

    return {
      success: true,
      url: result.url,
      fileName: fileName
    };

  } catch (error) {
    console.error('❌ 图片上传失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败'
    };
  }
};

/**
 * 删除OSS中的图片
 */
export const deleteImageFromOSS = async (imageUrl: string): Promise<boolean> => {
  try {
    // 从URL中提取对象名称
    const url = new URL(imageUrl);
    const objectName = url.pathname.substring(1); // 移除开头的斜杠

    console.log(`开始删除OSS图片: ${objectName}`);

    const ossClient = getOSSClient();
    await ossClient.delete(objectName);

    console.log(`✅ 图片删除成功: ${objectName}`);
    return true;

  } catch (error) {
    console.error('❌ 图片删除失败:', error);
    return false;
  }
};

/**
 * 获取图片信息
 */
export const getImageInfo = async (imageUrl: string) => {
  try {
    const url = new URL(imageUrl);
    const objectName = url.pathname.substring(1);

    const ossClient = getOSSClient();
    const result = await ossClient.head(objectName);
    return {
      success: true,
      size: result.res.size,
      lastModified: (result.res.headers as any)['last-modified'],
      contentType: (result.res.headers as any)['content-type']
    };

  } catch (error) {
    console.error('获取图片信息失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    };
  }
};

/**
 * 获取已上传的图片列表
 */
export const getUploadedImages = async () => {
  try {
    const images: any[] = [];
    
    // 遍历所有上传文件夹
    for (const [folderName, folderPath] of Object.entries(uploadPaths)) {
      try {
        const ossClient = getOSSClient();
        const result = await ossClient.list({
          prefix: folderPath,
          'max-keys': 1000
        });

        if (result.objects) {
          for (const obj of result.objects) {
            // 跳过文件夹本身
            if (obj.name.endsWith('/')) continue;
            
            // 构建完整URL
            const url = `https://${ossClient.options.bucket}.${ossClient.options.region}.aliyuncs.com/${obj.name}`;
            
            // 提取文件名
            const fileName = obj.name.split('/').pop() || obj.name;
            
            images.push({
              id: obj.name, // 使用OSS对象名作为ID
              url: url,
              name: fileName,
              size: obj.size || 0,
              uploadDate: obj.lastModified || new Date().toISOString(),
              folder: folderName
            });
          }
        }
      } catch (folderError) {
        console.warn(`获取文件夹 ${folderName} 的图片失败:`, folderError);
      }
    }

    // 按上传时间倒序排列
    images.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    
    return images;

  } catch (error) {
    console.error('获取图片列表失败:', error);
    throw error;
  }
};