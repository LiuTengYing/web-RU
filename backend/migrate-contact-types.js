/**
 * 迁移脚本: 更新ContactInfo枚举类型
 * 将数据库中的旧类型值迁移到新的枚举值
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-base';

async function migrateContactTypes() {
  try {
    console.log('连接到数据库...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 数据库连接成功');

    const db = mongoose.connection.db;
    const collection = db.collection('contactinfos');

    // 获取所有联系信息
    const contacts = await collection.find({}).toArray();
    console.log(`\n找到 ${contacts.length} 条联系信息记录`);

    // 检查是否有不在新枚举中的类型
    const validTypes = ['email', 'phone', 'whatsapp', 'telegram', 'vk', 'youtube'];
    const invalidContacts = contacts.filter(c => !validTypes.includes(c.type));

    if (invalidContacts.length > 0) {
      console.log('\n⚠️  发现以下无效类型的联系信息:');
      invalidContacts.forEach(c => {
        console.log(`  - ID: ${c._id}, Type: ${c.type}, Label: ${c.label}`);
      });

      // 删除无效类型的联系信息
      const invalidIds = invalidContacts.map(c => c._id);
      const deleteResult = await collection.deleteMany({ _id: { $in: invalidIds } });
      console.log(`\n✅ 已删除 ${deleteResult.deletedCount} 条无效类型的联系信息`);
    } else {
      console.log('\n✅ 所有联系信息类型都有效');
    }

    // 显示当前有效的联系信息
    const validContacts = await collection.find({ type: { $in: validTypes } }).toArray();
    console.log(`\n当前有效联系信息 (${validContacts.length} 条):`);
    validContacts.forEach(c => {
      console.log(`  - ${c.type}: ${c.label} (${c.value})`);
    });

    console.log('\n✅ 迁移完成!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 运行迁移
migrateContactTypes();
