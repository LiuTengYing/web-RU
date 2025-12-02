/**
 * 数据库迁移运行器
 * 遵循Clean Code原则：单一职责，专门负责迁移管理
 */

import mongoose from 'mongoose';
import { Schema, model, Document } from 'mongoose';
import fs from 'fs';
import path from 'path';

/**
 * 迁移记录接口
 */
interface IMigrationRecord extends Document {
  version: string;
  name: string;
  description: string;
  executedAt: Date;
  executionTime: number; // 毫秒
  status: 'completed' | 'failed' | 'rolled_back';
  error?: string;
}

/**
 * 迁移记录Schema
 */
const MigrationRecordSchema = new Schema<IMigrationRecord>({
  version: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  executedAt: { type: Date, default: Date.now },
  executionTime: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['completed', 'failed', 'rolled_back'], 
    required: true 
  },
  error: { type: String }
}, {
  collection: 'migration_records'
});

const MigrationRecord = model<IMigrationRecord>('MigrationRecord', MigrationRecordSchema);

/**
 * 迁移接口
 */
interface IMigration {
  up(): Promise<void>;
  down(): Promise<void>;
  validate?(): Promise<boolean>;
  migrationInfo: {
    version: string;
    name: string;
    description: string;
    author: string;
    createdAt: string;
    estimatedTime: string;
  };
}

/**
 * 迁移运行器类
 */
export class MigrationRunner {
  private migrationsPath: string;
  
  constructor(migrationsPath: string = path.join(__dirname, 'migrations')) {
    this.migrationsPath = migrationsPath;
  }
  
  /**
   * 获取所有迁移文件
   */
  private async getMigrationFiles(): Promise<string[]> {
    if (!fs.existsSync(this.migrationsPath)) {
      console.log('迁移目录不存在，创建目录：', this.migrationsPath);
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      return [];
    }
    
    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
      .sort();
    
    return files;
  }
  
  /**
   * 加载迁移模块
   */
  private async loadMigration(filename: string): Promise<IMigration> {
    const filePath = path.join(this.migrationsPath, filename);
    const migration = await import(filePath);
    
    if (!migration.up || !migration.down || !migration.migrationInfo) {
      throw new Error(`迁移文件 ${filename} 格式不正确，必须包含 up、down 和 migrationInfo`);
    }
    
    return migration;
  }
  
  /**
   * 获取已执行的迁移记录
   */
  private async getExecutedMigrations(): Promise<string[]> {
    const records = await MigrationRecord.find({ status: 'completed' })
      .sort({ version: 1 })
      .select('version');
    
    return records.map(record => record.version);
  }
  
  /**
   * 记录迁移执行结果
   */
  private async recordMigration(
    migration: IMigration, 
    status: 'completed' | 'failed' | 'rolled_back',
    executionTime: number,
    error?: string
  ): Promise<void> {
    const record = new MigrationRecord({
      version: migration.migrationInfo.version,
      name: migration.migrationInfo.name,
      description: migration.migrationInfo.description,
      executionTime,
      status,
      error
    });
    
    await record.save();
  }
  
  /**
   * 执行单个迁移
   */
  private async executeMigration(migration: IMigration, direction: 'up' | 'down' = 'up'): Promise<void> {
    const startTime = Date.now();
    const { version, name, description } = migration.migrationInfo;
    
    console.log(`\n执行迁移 ${version}: ${name}`);
    console.log(`描述: ${description}`);
    console.log(`方向: ${direction}`);
    
    try {
      if (direction === 'up') {
        await migration.up();
        
        // 验证迁移结果（如果提供了验证函数）
        if (migration.validate) {
          const isValid = await migration.validate();
          if (!isValid) {
            throw new Error('迁移验证失败');
          }
        }
      } else {
        await migration.down();
      }
      
      const executionTime = Date.now() - startTime;
      const status = direction === 'up' ? 'completed' : 'rolled_back';
      
      await this.recordMigration(migration, status, executionTime);
      
      console.log(`✅ 迁移 ${version} 执行成功 (耗时: ${executionTime}ms)`);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      await this.recordMigration(migration, 'failed', executionTime, errorMessage);
      
      console.error(`❌ 迁移 ${version} 执行失败: ${errorMessage}`);
      throw error;
    }
  }
  
  /**
   * 运行所有待执行的迁移
   */
  async runPendingMigrations(): Promise<void> {
    console.log('🚀 开始运行数据库迁移...');
    
    try {
      const migrationFiles = await this.getMigrationFiles();
      const executedVersions = await this.getExecutedMigrations();
      
      console.log(`发现 ${migrationFiles.length} 个迁移文件`);
      console.log(`已执行 ${executedVersions.length} 个迁移`);
      
      const pendingMigrations: IMigration[] = [];
      
      for (const filename of migrationFiles) {
        const migration = await this.loadMigration(filename);
        
        if (!executedVersions.includes(migration.migrationInfo.version)) {
          pendingMigrations.push(migration);
        }
      }
      
      if (pendingMigrations.length === 0) {
        console.log('✅ 没有待执行的迁移');
        return;
      }
      
      console.log(`发现 ${pendingMigrations.length} 个待执行的迁移`);
      
      // 按版本号排序
      pendingMigrations.sort((a, b) => a.migrationInfo.version.localeCompare(b.migrationInfo.version));
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration, 'up');
      }
      
      console.log('\n🎉 所有迁移执行完成！');
    } catch (error) {
      console.error('\n💥 迁移执行过程中出现错误：', error);
      throw error;
    }
  }
  
  /**
   * 回滚指定版本的迁移
   */
  async rollbackMigration(version: string): Promise<void> {
    console.log(`🔄 开始回滚迁移版本: ${version}`);
    
    try {
      const migrationFiles = await this.getMigrationFiles();
      const targetFile = migrationFiles.find(file => file.includes(version));
      
      if (!targetFile) {
        throw new Error(`未找到版本 ${version} 的迁移文件`);
      }
      
      const migration = await this.loadMigration(targetFile);
      await this.executeMigration(migration, 'down');
      
      console.log(`✅ 迁移版本 ${version} 回滚成功`);
    } catch (error) {
      console.error(`❌ 迁移版本 ${version} 回滚失败:`, error);
      throw error;
    }
  }
  
  /**
   * 获取迁移状态
   */
  async getMigrationStatus(): Promise<void> {
    console.log('\n📊 迁移状态报告');
    console.log('='.repeat(50));
    
    const migrationFiles = await this.getMigrationFiles();
    const records = await MigrationRecord.find().sort({ version: 1 });
    
    console.log(`总迁移文件数: ${migrationFiles.length}`);
    console.log(`已执行迁移数: ${records.filter(r => r.status === 'completed').length}`);
    console.log(`失败迁移数: ${records.filter(r => r.status === 'failed').length}`);
    console.log(`已回滚迁移数: ${records.filter(r => r.status === 'rolled_back').length}`);
    
    if (records.length > 0) {
      console.log('\n迁移历史:');
      for (const record of records) {
        const statusIcon = record.status === 'completed' ? '✅' : 
                          record.status === 'failed' ? '❌' : '🔄';
        console.log(`${statusIcon} ${record.version}: ${record.name} (${record.status})`);
        if (record.error) {
          console.log(`   错误: ${record.error}`);
        }
      }
    }
  }
  
  /**
   * 创建新的迁移文件模板
   */
  async createMigration(name: string): Promise<void> {
    const version = new Date().toISOString().slice(0, 10).replace(/-/g, '') + 
                   Date.now().toString().slice(-3);
    const filename = `${version}-${name.replace(/\s+/g, '-').toLowerCase()}.ts`;
    const filepath = path.join(this.migrationsPath, filename);
    
    const template = `/**
 * 数据库迁移脚本：${name}
 * 迁移版本：${version}
 * 创建时间：${new Date().toISOString().slice(0, 10)}
 */

import mongoose from 'mongoose';

/**
 * 迁移执行函数
 */
export async function up(): Promise<void> {
  console.log('开始执行迁移：${name}...');
  
  try {
    // TODO: 在这里添加迁移逻辑
    
    console.log('迁移执行成功！');
  } catch (error) {
    console.error('迁移执行失败：', error);
    throw error;
  }
}

/**
 * 回滚函数
 */
export async function down(): Promise<void> {
  console.log('开始回滚迁移：${name}...');
  
  try {
    // TODO: 在这里添加回滚逻辑
    
    console.log('迁移回滚成功！');
  } catch (error) {
    console.error('迁移回滚失败：', error);
    throw error;
  }
}

/**
 * 验证迁移结果（可选）
 */
export async function validate(): Promise<boolean> {
  console.log('验证迁移结果...');
  
  try {
    // TODO: 在这里添加验证逻辑
    
    console.log('迁移验证通过');
    return true;
  } catch (error) {
    console.error('迁移验证失败：', error);
    return false;
  }
}

/**
 * 迁移信息
 */
export const migrationInfo = {
  version: '${version}',
  name: '${name.replace(/'/g, "\\'")}',
  description: '${name}的详细描述',
  author: 'developer',
  createdAt: '${new Date().toISOString().slice(0, 10)}',
  estimatedTime: '1-2分钟'
};
`;
    
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
    }
    
    fs.writeFileSync(filepath, template);
    console.log(`✅ 迁移文件已创建: ${filepath}`);
  }
}

/**
 * 导出默认实例
 */
export const migrationRunner = new MigrationRunner();
