/**
 * 迁移脚本运行器
 * 使用方法: node migrate.js
 */

require('dotenv').config();
require('ts-node/register');

const { runMigration } = require('./src/scripts/migrateTagsToCategories.ts');

console.log('🚀 启动标签到分类的数据迁移...');
console.log('数据库连接:', process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-base');

runMigration();
