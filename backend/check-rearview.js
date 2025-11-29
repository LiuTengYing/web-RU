const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/knowledge-base').then(async () => {
  console.log('连接到数据库成功');
  
  const { VideoTutorial } = require('./dist/models/Document');
  
  const videos = await VideoTutorial.find({
    $or: [
      { title: { $regex: '后视', $options: 'i' } },
      { title: { $regex: 'rearview', $options: 'i' } },
      { description: { $regex: '后视', $options: 'i' } },
      { description: { $regex: 'rearview', $options: 'i' } }
    ]
  }).select('title description category status');
  
  console.log('找到的后视相关视频:', videos.length);
  videos.forEach(v => {
    console.log('- 标题:', v.title);
    console.log('  描述:', v.description);
    console.log('  状态:', v.status);
    console.log('  分类:', v.category);
    console.log('---');
  });
  
  process.exit(0);
}).catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
