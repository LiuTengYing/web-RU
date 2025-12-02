/**
 * 迁移执行脚本
 * 用于手动执行数据库迁移
 */

import mongoose from 'mongoose';
import { migrationRunner } from './migrationRunner';

/**
 * 数据库连接配置
 */
const connectToDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-base';
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

/**
 * 主执行函数
 */
async function main() {
  console.log('🚀 开始执行数据库迁移...\n');
  
  try {
    // 连接数据库
    await connectToDatabase();
    
    // 获取命令行参数
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
      case 'run':
        // 运行所有待执行的迁移
        await migrationRunner.runPendingMigrations();
        break;
        
      case 'rollback':
        // 回滚指定版本的迁移
        const version = args[1];
        if (!version) {
          console.error('❌ 请指定要回滚的迁移版本');
          process.exit(1);
        }
        await migrationRunner.rollbackMigration(version);
        break;
        
      case 'status':
        // 显示迁移状态
        await migrationRunner.getMigrationStatus();
        break;
        
      case 'create':
        // 创建新的迁移文件
        const name = args[1];
        if (!name) {
          console.error('❌ 请指定迁移名称');
          process.exit(1);
        }
        await migrationRunner.createMigration(name);
        break;
        
      default:
        console.log('📖 使用方法:');
        console.log('  npm run migration run           - 运行所有待执行的迁移');
        console.log('  npm run migration rollback <版本> - 回滚指定版本的迁移');
        console.log('  npm run migration status        - 显示迁移状态');
        console.log('  npm run migration create <名称>  - 创建新的迁移文件');
        break;
    }
    
  } catch (error) {
    console.error('💥 迁移执行失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
  }
}

// 执行主函数
main().catch(error => {
  console.error('💥 程序执行失败:', error);
  process.exit(1);
});
