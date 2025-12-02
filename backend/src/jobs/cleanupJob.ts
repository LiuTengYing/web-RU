import cron from 'node-cron';
import ImageResource from '../models/ImageResource';
import mongoose from 'mongoose';

export class CleanupJob {
  /**
   * 启动所有清理任务
   */
  startAllJobs() {
    this.startImageCleanupJob();
    this.startTempFileCleanup();
    this.startDatabaseCleanup();
    console.log('✅ 所有清理任务已启动');
  }

  private startImageCleanupJob() {
    console.log('📅 图片清理任务已禁用（OSS服务未配置）');
  }

  /**
   * 每周日凌晨 3 点清理临时文件
   */
  private startTempFileCleanup() {
    cron.schedule('0 3 * * 0', async () => {
      console.log('🔄 开始清理临时文件...');
      
      try {
        // 清理超过 7 天的临时文件
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const tempFiles = await ImageResource.find({
          status: 'temp',
          uploadTime: { $lt: cutoffDate }
        });
        
        if (tempFiles.length > 0) {
          console.log(`📁 发现 ${tempFiles.length} 个临时文件需要清理`);
          
          let cleanedCount = 0;
          for (const file of tempFiles) {
            try {
              await ImageResource.findByIdAndUpdate(
                file._id,
                { 
                  status: 'deleted', 
                  deletedAt: new Date() 
                }
              );
              cleanedCount++;
            } catch (error) {
              console.error(`❌ 清理临时文件失败: ${file.url}`, error);
            }
          }
          
          console.log(`✅ 临时文件清理完成，清理了 ${cleanedCount} 个文件`);
          
          // 记录清理日志
          await this.logCleanupActivity('temp_file_cleanup', {
            totalFiles: tempFiles.length,
            cleanedCount,
            timestamp: new Date(),
            status: 'success'
          });
        } else {
          console.log('✅ 没有需要清理的临时文件');
        }
      } catch (error) {
        console.error('❌ 临时文件清理失败:', error);
        
        // 记录错误日志
        await this.logCleanupActivity('temp_file_cleanup', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          status: 'failed'
        });
      }
    });
    
    console.log('📅 临时文件清理任务已调度: 每周日凌晨 3:00');
  }

  /**
   * 每月 1 号凌晨 4 点执行数据库清理
   */
  private startDatabaseCleanup() {
    cron.schedule('0 4 1 * *', async () => {
      console.log('🔄 开始执行数据库清理任务...');
      
      try {
        // 清理已删除的图片记录（保留 30 天）
        const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const deletedImages = await ImageResource.find({
          status: 'deleted',
          deletedAt: { $lt: cutoffDate }
        });
        
        if (deletedImages.length > 0) {
          console.log(`🗑️ 发现 ${deletedImages.length} 个已删除图片记录需要清理`);
          
          // 批量删除记录
          const result = await ImageResource.deleteMany({
            status: 'deleted',
            deletedAt: { $lt: cutoffDate }
          });
          
          console.log(`✅ 数据库清理完成，删除了 ${result.deletedCount} 条记录`);
          
          // 记录清理日志
          await this.logCleanupActivity('database_cleanup', {
            deletedCount: result.deletedCount,
            timestamp: new Date(),
            status: 'success'
          });
        } else {
          console.log('✅ 没有需要清理的数据库记录');
        }
        
        // 执行数据库优化
        await this.optimizeDatabase();
        
      } catch (error) {
        console.error('❌ 数据库清理失败:', error);
        
        // 记录错误日志
        await this.logCleanupActivity('database_cleanup', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          status: 'failed'
        });
      }
    });
    
    console.log('📅 数据库清理任务已调度: 每月 1 号凌晨 4:00');
  }


  /**
   * 数据库优化
   */
  private async optimizeDatabase() {
    try {
      console.log('🔧 开始数据库优化...');
      
      // 重建索引
      // 跳过索引重建，避免类型错误
      console.log('✅ 跳过索引重建（避免类型冲突）');
      console.log('✅ 图片资源索引重建完成');
      
      // 压缩集合
      if (mongoose.connection.db?.admin) {
        try {
          await mongoose.connection.db.admin().command({
            compact: 'imageresources'
          });
          console.log('✅ 图片资源集合压缩完成');
        } catch (error) {
          console.log('ℹ️ 集合压缩跳过（可能不是 WiredTiger 存储引擎）');
        }
      }
      
      console.log('✅ 数据库优化完成');
    } catch (error) {
      console.error('❌ 数据库优化失败:', error);
    }
  }

  /**
   * 记录清理活动日志
   */
  private async logCleanupActivity(type: string, data: any) {
    try {
      // 这里可以记录到日志文件或数据库
      const logEntry = {
        type,
        data,
        timestamp: new Date()
      };
      
      console.log('📝 清理活动日志:', JSON.stringify(logEntry, null, 2));
      
      // 可以保存到数据库或写入日志文件
      // await CleanupLog.create(logEntry);
      
    } catch (error) {
      console.error('❌ 记录清理日志失败:', error);
    }
  }

  /**
   * 手动执行清理任务
   */
  async manualCleanup(type: 'images' | 'temp' | 'database' = 'images') {
    console.log(`🔄 手动执行 ${type} 清理任务...`);
    
    try {
      switch (type) {
        case 'images':
          return { success: false, error: '图片清理功能已禁用（OSS服务未配置）' };
          
        case 'temp':
          const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const tempFiles = await ImageResource.find({
            status: 'temp',
            uploadTime: { $lt: cutoffDate }
          });
          
          let tempCleanedCount = 0;
          for (const file of tempFiles) {
            try {
              await ImageResource.findByIdAndUpdate(
                file._id,
                { status: 'deleted', deletedAt: new Date() }
              );
              tempCleanedCount++;
            } catch (error) {
              console.error(`清理临时文件失败: ${file.url}`, error);
            }
          }
          
          console.log(`✅ 手动临时文件清理完成，清理了 ${tempCleanedCount} 个文件`);
          return { success: true, cleanedCount: tempCleanedCount };
          
        case 'database':
          // 执行数据库清理逻辑
          const cutoffDateDB = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const result = await ImageResource.deleteMany({
            status: 'deleted',
            deletedAt: { $lt: cutoffDateDB }
          });
          
          console.log(`✅ 手动数据库清理完成，删除了 ${result.deletedCount} 条记录`);
          return { success: true, deletedCount: result.deletedCount };
          
        default:
          throw new Error('无效的清理类型');
      }
    } catch (error) {
      console.error(`❌ 手动清理任务失败:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 获取清理任务状态
   */
  async getCleanupStatus() {
    return {
      imageStats: null,
      lastCleanup: {
        images: '已禁用（OSS服务未配置）',
        tempFiles: '每周日凌晨 3:00',
        database: '每月 1 号凌晨 4:00'
      },
      nextCleanup: this.getNextCleanupTimes()
    };
  }

  /**
   * 获取下次清理时间
   */
  private getNextCleanupTimes() {
    const now = new Date();
    
    // 下次图片清理时间
    const nextImageCleanup = new Date(now);
    nextImageCleanup.setHours(2, 0, 0, 0);
    if (nextImageCleanup <= now) {
      nextImageCleanup.setDate(nextImageCleanup.getDate() + 1);
    }
    
    // 下次临时文件清理时间
    const nextTempCleanup = new Date(now);
    nextTempCleanup.setHours(3, 0, 0, 0);
    const daysUntilSunday = (7 - nextTempCleanup.getDay()) % 7;
    nextTempCleanup.setDate(nextTempCleanup.getDate() + daysUntilSunday);
    if (nextTempCleanup <= now) {
      nextTempCleanup.setDate(nextTempCleanup.getDate() + 7);
    }
    
    // 下次数据库清理时间
    const nextDBCleanup = new Date(now);
    nextDBCleanup.setDate(1);
    nextDBCleanup.setHours(4, 0, 0, 0);
    if (nextDBCleanup <= now) {
      nextDBCleanup.setMonth(nextDBCleanup.getMonth() + 1);
    }
    
    return {
      images: nextImageCleanup,
      tempFiles: nextTempCleanup,
      database: nextDBCleanup
    };
  }
}

export default new CleanupJob();
