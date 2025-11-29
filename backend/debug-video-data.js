/**
 * 调试视频数据结构，查看实际的字段名
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './config.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-base';

async function debugVideoData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // 查看所有集合
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Available collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // 查看documents集合中的视频教程
    console.log('\n🎥 Video documents in documents collection:');
    const videoDocs = await db.collection('documents').find({ 
      $or: [
        { documentType: 'video' },
        { type: 'video' }
      ]
    }).limit(2).toArray();
    
    if (videoDocs.length > 0) {
      videoDocs.forEach((doc, i) => {
        console.log(`\n--- Video Document ${i + 1} ---`);
        console.log(`Title: ${doc.title}`);
        console.log(`Author: "${doc.author}"`);
        console.log(`DocumentType: ${doc.documentType || doc.type}`);
        console.log(`VideoUrl: ${doc.videoUrl}`);
        console.log(`Videos array:`, doc.videos ? JSON.stringify(doc.videos, null, 2) : 'undefined');
        console.log(`Category: ${doc.category}`);
      });
    } else {
      console.log('No video documents found in documents collection');
    }
    
    // 查看所有文档的author字段
    console.log('\n👤 Documents with author field:');
    const authorDocs = await db.collection('documents').find({ 
      author: { $exists: true, $ne: null, $ne: '' }
    }).limit(5).toArray();
    
    if (authorDocs.length > 0) {
      authorDocs.forEach((doc, i) => {
        console.log(`Document ${i + 1}: author="${doc.author}", type=${doc.documentType || doc.type}, title="${doc.title}"`);
      });
    } else {
      console.log('No documents with author field found');
    }
    
    // 统计各种author值
    console.log('\n📊 Author field statistics:');
    const authorStats = await db.collection('documents').aggregate([
      { $group: { _id: '$author', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    authorStats.forEach(stat => {
      console.log(`Author: "${stat._id}" - Count: ${stat.count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugVideoData();
