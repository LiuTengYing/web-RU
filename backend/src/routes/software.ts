import express from 'express';
import { softwareService } from '../services/softwareService';

const router = express.Router();

// 获取所有软件分类
router.get('/categories', async (req, res) => {
  try {
    const categories = await softwareService.getAllCategories();
    res.json({ success: true, data: { items: categories, total: categories.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取软件分类失败' });
  }
});

// 创建软件分类
router.post('/categories', async (req, res) => {
  try {
    const { name, order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: '分类名称不能为空' });
    }
    
    const category = await softwareService.createCategory({ name, order });
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建软件分类失败' });
  }
});

// 更新软件分类
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order } = req.body;
    
    const category = await softwareService.updateCategory(id, { name, order });
    if (!category) {
      return res.status(404).json({ success: false, error: '软件分类不存在' });
    }
    
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新软件分类失败' });
  }
});

// 删除软件分类
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await softwareService.deleteCategory(id);
    
    if (!success) {
      return res.status(404).json({ success: false, error: '软件分类不存在' });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Cannot delete category with existing software') {
      return res.status(400).json({ success: false, error: '无法删除包含软件的分类' });
    }
    res.status(500).json({ success: false, error: '删除软件分类失败' });
  }
});

// 获取所有软件
router.get('/', async (req, res) => {
  try {
    const { categoryId } = req.query;
    let software;
    
    if (categoryId) {
      software = await softwareService.getSoftwareByCategory(categoryId as string);
    } else {
      software = await softwareService.getAllSoftware();
    }
    
    res.json({ success: true, data: { items: software, total: software.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取软件列表失败' });
  }
});

// 获取单个软件
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const software = await softwareService.getSoftwareById(id);
    
    if (!software) {
      return res.status(404).json({ success: false, error: '软件不存在' });
    }
    
    res.json({ success: true, software });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取软件详情失败' });
  }
});

// 创建软件
router.post('/', async (req, res) => {
  try {
    const { name, categoryId, description, downloadUrl, importantNote } = req.body;
    
    if (!name || !categoryId || !description || !downloadUrl) {
      return res.status(400).json({ success: false, error: '请填写完整的软件信息' });
    }
    
    const software = await softwareService.createSoftware({
      name,
      categoryId,
      description,
      downloadUrl,
      importantNote
    });
    
    res.json({ success: true, software });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建软件失败' });
  }
});

// 更新软件
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, description, downloadUrl, importantNote } = req.body;
    
    const software = await softwareService.updateSoftware(id, {
      name,
      categoryId,
      description,
      downloadUrl,
      importantNote
    });
    
    if (!software) {
      return res.status(404).json({ success: false, error: '软件不存在' });
    }
    
    res.json({ success: true, software });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新软件失败' });
  }
});

// 删除软件
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await softwareService.deleteSoftware(id);
    
    if (!success) {
      return res.status(404).json({ success: false, error: '软件不存在' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除软件失败' });
  }
});

export default router;
