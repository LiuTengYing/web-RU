#!/usr/bin/env node

/**
 * 数据库优化脚本
 * 创建索引、优化查询性能
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: './config.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-base';

async function optimizeDatabase() {
  try {
    console.log('🔗 连接数据库...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 数据库连接成功');

    const db = mongoose.connection.db;

    console.log('\n📊 开始数据库优化...');

    // 1. 文档集合索引优化
    console.log('\n🔍 优化文档集合索引...');
    
    // 文本搜索索引
    await db.collection('documents').createIndex(
      { 
        title: 'text', 
        content: 'text',
        summary: 'text'
      },
      { 
        name: 'text_search_index',
        weights: { title: 10, summary: 5, content: 1 },
        default_language: 'none' // 支持中文搜索
      }
    );
    console.log('✅ 创建全文搜索索引');

    // 分类和状态索引
    await db.collection('documents').createIndex(
      { category: 1, status: 1, publishedAt: -1 },
      { name: 'category_status_published_index' }
    );
    console.log('✅ 创建分类状态索引');

    // 标签索引
    await db.collection('documents').createIndex(
      { tags: 1 },
      { name: 'tags_index' }
    );
    console.log('✅ 创建标签索引');

    // 作者索引
    await db.collection('documents').createIndex(
      { authorId: 1, createdAt: -1 },
      { name: 'author_created_index' }
    );
    console.log('✅ 创建作者索引');

    // 文档类型索引
    await db.collection('documents').createIndex(
      { documentType: 1, status: 1 },
      { name: 'document_type_status_index' }
    );
    console.log('✅ 创建文档类型索引');

    // 2. 图片资源集合索引优化
    console.log('\n🖼️ 优化图片资源索引...');
    
    // 状态和创建时间索引（用于清理任务）
    await db.collection('imageresources').createIndex(
      { status: 1, createdAt: 1 },
      { name: 'status_created_index' }
    );
    console.log('✅ 创建图片状态索引');

    // URL索引（用于快速查找）
    await db.collection('imageresources').createIndex(
      { url: 1 },
      { name: 'url_index', unique: true }
    );
    console.log('✅ 创建图片URL索引');

    // 引用文档索引
    await db.collection('imageresources').createIndex(
      { 'references.documentId': 1 },
      { name: 'references_document_index' }
    );
    console.log('✅ 创建图片引用索引');

    // 3. 用户集合索引优化
    console.log('\n👤 优化用户集合索引...');
    
    // 用户名索引
    await db.collection('users').createIndex(
      { username: 1 },
      { name: 'username_index', unique: true }
    );
    console.log('✅ 创建用户名索引');

    // 邮箱索引
    await db.collection('users').createIndex(
      { email: 1 },
      { name: 'email_index', unique: true, sparse: true }
    );
    console.log('✅ 创建邮箱索引');

    // 角色索引
    await db.collection('users').createIndex(
      { role: 1, isActive: 1 },
      { name: 'role_active_index' }
    );
    console.log('✅ 创建角色索引');

    // 4. 复合索引优化
    console.log('\n🔗 创建复合索引...');
    
    // 文档查询优化索引
    await db.collection('documents').createIndex(
      { status: 1, category: 1, publishedAt: -1 },
      { name: 'status_category_published_compound_index' }
    );
    console.log('✅ 创建文档查询复合索引');

    // 分页查询优化索引
    await db.collection('documents').createIndex(
      { createdAt: -1, _id: 1 },
      { name: 'pagination_index' }
    );
    console.log('✅ 创建分页查询索引');

    // 5. 查看索引统计
    console.log('\n📈 索引统计信息:');
    
    const collections = ['documents', 'imageresources', 'users'];
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const indexes = await collection.listIndexes().toArray();
      console.log(`\n${collectionName} 集合索引 (${indexes.length}个):`);
      indexes.forEach(index => {
        const keys = Object.keys(index.key).join(', ');
        const size = index.storageSize ? `${Math.round(index.storageSize / 1024)}KB` : 'N/A';
        console.log(`  - ${index.name}: {${keys}} [${size}]`);
      });
    }

    // 6. 数据库统计
    console.log('\n📊 数据库统计:');
    const stats = await db.stats();
    console.log(`  - 数据库大小: ${Math.round(stats.dataSize / 1024 / 1024 * 100) / 100}MB`);
    console.log(`  - 索引大小: ${Math.round(stats.indexSize / 1024 / 1024 * 100) / 100}MB`);
    console.log(`  - 集合数量: ${stats.collections}`);
    console.log(`  - 文档数量: ${stats.objects}`);

    console.log('\n🎉 数据库优化完成!');
    
  } catch (error) {
    console.error('❌ 数据库优化失败:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
  }
}

// 执行优化
if (require.main === module) {
  optimizeDatabase();
}

module.exports = { optimizeDatabase };
