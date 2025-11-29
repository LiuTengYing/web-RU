/**
 * 临时文件 - 用于解决IDE缓存问题
 * 标签系统已被分类系统替代，此文件将在下次清理时删除
 */

// 导出一个空的路由对象以避免编译错误
import { Router } from 'express';

const router = Router();

// 这个路由不会被使用，因为在 index.ts 中已经被注释掉了
router.get('/deprecated', (req, res) => {
  res.status(410).json({
    success: false,
    message: '标签系统已被分类系统替代'
  });
});

export default router;
