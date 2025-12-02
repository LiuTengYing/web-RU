import express, { Request, Response } from 'express';
import { 
  getAdminSettings, 
  updateAdminSettings, 
  verifyAdminPassword 
} from '../services/adminSettingsService';
import User from '../models/User';
import DocumentView from '../models/DocumentView';

const router = express.Router();

// 获取管理员设置
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await getAdminSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('获取管理员设置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取设置失败' 
    });
  }
});

// 创建/更新管理员设置
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await updateAdminSettings(req.body);
    res.json({ success: true, data: settings, message: '设置已保存' });
  } catch (error) {
    console.error('保存管理员设置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '保存设置失败' 
    });
  }
});

// 更新管理员设置
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await updateAdminSettings(req.body);
    res.json({ success: true, data: settings, message: '设置已更新' });
  } catch (error) {
    console.error('更新管理员设置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '更新设置失败' 
    });
  }
});

// 验证管理员密码
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const isValid = await verifyAdminPassword(password);
    
    if (isValid) {
      res.json({ success: true, message: '密码验证成功' });
    } else {
      res.status(401).json({ success: false, error: '密码错误' });
    }
  } catch (error) {
    console.error('验证管理员密码失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '验证失败' 
    });
  }
});

// 获取用户统计
router.get('/users/stats', async (req: Request, res: Response) => {
  try {
    const total = await User.countDocuments();
    res.json({ success: true, data: { total } });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取统计失败' 
    });
  }
});

// 获取访问统计
router.get('/analytics/views', async (req: Request, res: Response) => {
  try {
    const total = await DocumentView.countDocuments();
    res.json({ success: true, data: { total } });
  } catch (error) {
    console.error('获取访问统计失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取统计失败' 
    });
  }
});

export default router;
