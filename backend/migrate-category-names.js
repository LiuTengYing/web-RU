const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// 分类映射关系
const categoryMapping = {
  '主机安装': 'Radio Installation',
  '产品规格': 'Troubleshooting',
  '兼容性说明': 'Compatibility Notes',
  '倒车影像': 'Troubleshooting' // 倒车影像也映射到Troubleshooting，或者您可以指定其他分类
};

async function migrateCategories() {
  try {
    console.log('开始迁移文档分类名称...\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge-base');
    console.log('✓ 数据库连接成功\n');
    
    const db = mongoose.connection.db;
    const collection = db.collection('documents');
    
    // 统计每个旧分类的文档数量
    for (const [oldName, newName] of Object.entries(categoryMapping)) {
      const count = await collection.countDocuments({ category: oldName });
      console.log(`发现 ${count} 个文档使用分类 "${oldName}"`);
      
      if (count > 0) {
        const result = await collection.updateMany(
          { category: oldName },
          { $set: { category: newName } }
        );
        console.log(`✓ 已更新 ${result.modifiedCount} 个文档："${oldName}" → "${newName}"\n`);
      }
    }
    
    // 显示迁移后的统计
    console.log('\n迁移后的分类统计:');
    const newCategories = await collection.distinct('category');
    for (const category of newCategories) {
      const count = await collection.countDocuments({ category });
      console.log(`- ${category}: ${count} 个文档`);
    }
    
    // 更新分类表中的文档计数
    console.log('\n更新分类表中的文档计数...');
    const categoriesCollection = db.collection('categories');
    
    for (const categoryName of Object.values(categoryMapping)) {
      const generalCount = await collection.countDocuments({ 
        category: categoryName, 
        documentType: 'general',
        status: 'published'
      });
      const videoCount = await collection.countDocuments({ 
        category: categoryName, 
        documentType: 'video',
        status: 'published'
      });
      const totalCount = generalCount + videoCount;
      
      await categoriesCollection.updateOne(
        { name: categoryName },
        { $set: { documentCount: totalCount } }
      );
      
      console.log(`✓ 更新分类 "${categoryName}" 文档数: ${totalCount} (图文: ${generalCount}, 视频: ${videoCount})`);
    }
    
    console.log('\n✓ 分类迁移和计数更新完成！');
    process.exit(0);
  } catch (error) {
    console.error('✗ 迁移失败:', error);
    process.exit(1);
  }
}

migrateCategories();

