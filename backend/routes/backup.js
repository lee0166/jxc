const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { Parser } = require('json2csv');
const authMiddleware = require('../middleware/auth');

// 模型
const Product = require('../models/Product');
const Inbound = require('../models/Inbound');
const Sales = require('../models/Sales');
const Inventory = require('../models/Inventory');

// 备份目录
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 将数据转换为CSV（带UTF-8 BOM，解决中文乱码）
const convertToCSV = (data, fields) => {
  if (!data || data.length === 0) {
    return '\uFEFF';
  }
  
  const parser = new Parser({ fields });
  const csv = parser.parse(data);
  // 添加 UTF-8 BOM，让 Excel 正确识别中文
  return '\uFEFF' + csv;
};

// 获取字段列表（带中文标签）
const getFields = (modelName) => {
  switch (modelName) {
    case 'Product':
      return [
        { value: '_id', label: 'ID' },
        { value: 'name', label: '商品名称' },
        { value: 'color', label: '颜色' },
        { value: 'size', label: '尺码' },
        { value: 'price', label: '售价' },
        { value: 'costPrice', label: '成本价' },
        { value: 'stock', label: '库存' },
        { value: 'supplier', label: '供应商' },
        { value: 'description', label: '描述' },
        { value: 'createdAt', label: '创建时间' }
      ];
    case 'Inbound':
      return [
        { value: '_id', label: 'ID' },
        { value: 'productId', label: '商品ID' },
        { value: 'quantity', label: '数量' },
        { value: 'supplier', label: '供应商' },
        { value: 'batchNumber', label: '批次号' },
        { value: 'totalCost', label: '总成本' },
        { value: 'notes', label: '备注' },
        { value: 'operator', label: '操作员' },
        { value: 'createdAt', label: '创建时间' }
      ];
    case 'Sales':
      return [
        { value: '_id', label: 'ID' },
        { value: 'productId', label: '商品ID' },
        { value: 'quantity', label: '数量' },
        { value: 'unitPrice', label: '单价' },
        { value: 'totalAmount', label: '总金额' },
        { value: 'customerName', label: '客户名' },
        { value: 'paymentMethod', label: '支付方式' },
        { value: 'notes', label: '备注' },
        { value: 'operator', label: '操作员' },
        { value: 'createdAt', label: '创建时间' }
      ];
    case 'Inventory':
      return [
        { value: '_id', label: 'ID' },
        { value: 'productId', label: '商品ID' },
        { value: 'quantity', label: '数量' },
        { value: 'type', label: '类型' },
        { value: 'remark', label: '备注' },
        { value: 'createdAt', label: '创建时间' }
      ];
    default:
      return [
        { value: '_id', label: 'ID' },
        { value: 'createdAt', label: '创建时间' }
      ];
  }
};

// 创建备份
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 检查是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: '只有管理员可以创建备份' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFilename = `backup-${timestamp}.zip`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    // 获取所有数据
    const [products, inbounds, sales, inventories] = await Promise.all([
      Product.find().lean(),
      Inbound.find().lean(),
      Sales.find().lean(),
      Inventory.find().lean()
    ]);

    // 创建ZIP文件
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    // 添加CSV文件到ZIP
    const productsCSV = convertToCSV(products, getFields('Product'));
    archive.append(productsCSV || 'No data', { name: 'products.csv' });

    const inboundsCSV = convertToCSV(inbounds, getFields('Inbound'));
    archive.append(inboundsCSV || 'No data', { name: 'inbounds.csv' });

    const salesCSV = convertToCSV(sales, getFields('Sales'));
    archive.append(salesCSV || 'No data', { name: 'sales.csv' });

    const inventoriesCSV = convertToCSV(inventories, getFields('Inventory'));
    archive.append(inventoriesCSV || 'No data', { name: 'inventories.csv' });

    // 添加备份信息文件
    const backupInfo = {
      backupDate: new Date().toISOString(),
      createdBy: req.user.username,
      collections: {
        products: products.length,
        inbounds: inbounds.length,
        sales: sales.length,
        inventories: inventories.length
      }
    };
    archive.append(JSON.stringify(backupInfo, null, 2), { name: 'backup-info.json' });

    await archive.finalize();

    // 等待文件写入完成
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      output.on('error', reject);
    });

    // 获取文件大小
    const stats = fs.statSync(backupPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    res.json({
      status: 'success',
      message: '备份创建成功',
      data: {
        filename: backupFilename,
        size: `${sizeInMB} MB`,
        createdAt: new Date().toISOString(),
        recordCount: {
          products: products.length,
          inbounds: inbounds.length,
          sales: sales.length,
          inventories: inventories.length
        }
      }
    });
  } catch (error) {
    console.error('创建备份失败:', error);
    res.status(500).json({ status: 'error', message: '创建备份失败: ' + error.message });
  }
});

// 获取备份列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    // 检查是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: '只有管理员可以查看备份' });
    }

    // 读取备份目录
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.endsWith('.zip'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        return {
          filename: file,
          size: `${sizeInMB} MB`,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      status: 'success',
      data: backups
    });
  } catch (error) {
    console.error('获取备份列表失败:', error);
    res.status(500).json({ status: 'error', message: '获取备份列表失败: ' + error.message });
  }
});

// 下载备份
router.get('/:filename/download', authMiddleware, async (req, res) => {
  try {
    // 检查是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: '只有管理员可以下载备份' });
    }

    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, filename);

    // 安全检查：确保文件在备份目录内
    if (!filePath.startsWith(BACKUP_DIR)) {
      return res.status(400).json({ status: 'error', message: '无效的文件名' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: 'error', message: '备份文件不存在' });
    }

    // 设置下载头
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // 发送文件
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('下载备份失败:', error);
    res.status(500).json({ status: 'error', message: '下载备份失败: ' + error.message });
  }
});

// 删除备份
router.delete('/:filename', authMiddleware, async (req, res) => {
  try {
    // 检查是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: '只有管理员可以删除备份' });
    }

    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, filename);

    // 安全检查：确保文件在备份目录内
    if (!filePath.startsWith(BACKUP_DIR)) {
      return res.status(400).json({ status: 'error', message: '无效的文件名' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: 'error', message: '备份文件不存在' });
    }

    // 删除文件
    fs.unlinkSync(filePath);

    res.json({
      status: 'success',
      message: '备份删除成功'
    });
  } catch (error) {
    console.error('删除备份失败:', error);
    res.status(500).json({ status: 'error', message: '删除备份失败: ' + error.message });
  }
});

module.exports = router;
