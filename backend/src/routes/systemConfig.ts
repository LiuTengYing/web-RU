/**
 * 系统配置路由
 * 管理钉钉机器人、阿里云OSS等第三方服务配置
 */

import express, { Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import systemConfigService from '../services/systemConfigService';

const router = express.Router();

// 配置状态概览
router.get('/status', authenticateUser, async (req: Request, res: Response) => {
  try {
    const status = await systemConfigService.getConfigStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('获取配置状态失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取配置状态失败' 
    });
  }
});

// 获取钉钉机器人配置
router.get('/dingtalk', authenticateUser, async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.getDingtalkConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('获取钉钉配置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取配置失败' 
    });
  }
});

// 获取钉钉配置（编辑用）
router.get('/dingtalk/edit', authenticateUser, async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.getDingtalkConfigForEdit();
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('获取钉钉编辑配置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取配置失败' 
    });
  }
});

// 更新钉钉机器人配置
router.put('/dingtalk', authenticateUser, async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.updateDingtalkConfig(req.body);
    res.json({ success: true, data: config, message: '钉钉配置已更新' });
  } catch (error) {
    console.error('更新钉钉配置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '更新配置失败' 
    });
  }
});

// 测试钉钉机器人配置
router.post('/dingtalk/test', authenticateUser, async (req: Request, res: Response) => {
  try {
    const result = await systemConfigService.testDingtalkConfig(req.body);
    res.json(result);
  } catch (error) {
    console.error('测试钉钉配置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '测试配置失败' 
    });
  }
});

// 获取阿里云OSS配置
router.get('/oss', authenticateUser, async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.getOSSConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('获取OSS配置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取配置失败' 
    });
  }
});

// 获取OSS配置（编辑用）
router.get('/oss/edit', authenticateUser, async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.getOSSConfigForEdit();
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('获取OSS编辑配置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取配置失败' 
    });
  }
});

// 更新阿里云OSS配置
router.put('/oss', authenticateUser, async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.updateOSSConfig(req.body);
    res.json({ success: true, data: config, message: 'OSS配置已更新' });
  } catch (error) {
    console.error('更新OSS配置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '更新配置失败' 
    });
  }
});

// 测试阿里云OSS配置
router.post('/oss/test', authenticateUser, async (req: Request, res: Response) => {
  try {
    const result = await systemConfigService.testOSSConfig(req.body);
    res.json(result);
  } catch (error) {
    console.error('测试OSS配置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '测试配置失败' 
    });
  }
});

// 获取OSS存储详情
router.get('/oss/storage-details', authenticateUser, async (req: Request, res: Response) => {
  try {
    const result = await systemConfigService.getOSSStorageDetails();
    res.json(result);
  } catch (error) {
    console.error('获取OSS存储详情失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '获取存储详情失败' 
    });
  }
});

export default router;
