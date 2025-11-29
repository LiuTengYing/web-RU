/**
 * 修复数据库中硬编码的"作者"字段
 * 将所有文档的 author 字段从"作者"改为空字符串或默认值
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './config.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-base';

async function fixAuthorField() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // 更新 GeneralDocument 集合
    const generalResult = await db.collection('generaldocuments').updateMany(
      { author: '作者' },
      { $set: { author: '' } }
    );
    console.log(`✅ Updated ${generalResult.modifiedCount} general documents`);
    
    // 更新 VideoTutorial 集合
    const videoResult = await db.collection('videotutorials').updateMany(
      { author: '作者' },
      { $set: { author: '' } }
    );
    console.log(`✅ Updated ${videoResult.modifiedCount} video tutorials`);
    
    // 更新 StructuredArticle 集合
    const structuredResult = await db.collection('structuredarticles').updateMany(
      { author: '作者' },
      { $set: { author: '' } }
    );
    console.log(`✅ Updated ${structuredResult.modifiedCount} structured articles`);
    
    console.log('\n✅ 所有硬编码的"作者"字段已清理完成！');
    console.log('现在系统会显示"技术团队"（中文）或"Technical Team"（英文）');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixAuthorField();

