/**
 * 产品图片 API 路由
 *
 * 路由结构:
 *   POST   /api/product-images/:productId/upload    - 上传图片 (multipart/form-data)
 *   GET    /api/product-images/:productId            - 获取产品所有图片
 *   PUT    /api/product-images/:imageId/primary       - 设置主图 (自动生成缩略图)
 *   PUT    /api/product-images/:imageId/sort          - 更新排序
 *   DELETE /api/product-images/:imageId               - 删除图片
 */

import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { successResponse } from '../utils/response';
import {
  productImageUpload,
  generateThumbnail,
  getRelativePath,
  deleteUploadedFile,
} from '../utils/upload';

const router = Router();

/** 从请求头获取用户 ID */
function getUserId(req: Request): string {
  const raw = req.headers['x-user-id'];
  if (Array.isArray(raw)) return raw[0] || 'system';
  return (raw as string) || 'system';
}

/**
 * POST /api/product-images/:productId/upload
 *
 * 上传产品图片 (支持多文件)
 * Content-Type: multipart/form-data
 * 字段名: images
 */
router.post('/:productId/upload', (req: Request, res: Response, next: NextFunction) => {
  productImageUpload(req, res, async (err: any) => {
    try {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ success: false, message: '文件大小不能超过 10MB' });
          return;
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          res.status(400).json({ success: false, message: '一次最多上传 20 张图片' });
          return;
        }
        res.status(400).json({ success: false, message: err.message || '上传失败' });
        return;
      }

      const productId = String(req.params.productId);
      const userId = getUserId(req);
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: '请选择要上传的图片' });
        return;
      }

      // 验证产品存在
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!product) {
        res.status(404).json({ success: false, message: '产品不存在' });
        return;
      }

      // 获取当前最大排序号
      const maxSort = await prisma.productImage.aggregate({
        where: { productId, deletedAt: null },
        _max: { sortOrder: true },
      });
      let nextSort = (maxSort._max.sortOrder || 0) + 1;

      // 检查是否已有图片 (如果没有，第一张自动设为主图)
      const existingCount = await prisma.productImage.count({
        where: { productId, deletedAt: null },
      });

      const createdImages = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = getRelativePath(file.path);
        const isPrimary = existingCount === 0 && i === 0;

        let thumbnailPath: string | null = null;
        if (isPrimary) {
          // 第一张图自动设为主图，生成缩略图
          thumbnailPath = await generateThumbnail(file.path);
        }

        const image = await prisma.productImage.create({
          data: {
            productId,
            originalName: file.originalname,
            filePath: relativePath,
            thumbnailPath,
            isPrimary,
            sortOrder: nextSort++,
            fileSize: file.size,
            mimeType: file.mimetype,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        createdImages.push(image);
      }

      res.status(201).json(successResponse(createdImages, `成功上传 ${createdImages.length} 张图片`));
    } catch (error) {
      next(error);
    }
  });
});

/**
 * GET /api/product-images/:productId
 *
 * 获取产品所有图片
 */
router.get('/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId;

    const images = await prisma.productImage.findMany({
      where: { productId, deletedAt: null },
      orderBy: [
        { isPrimary: 'desc' },
        { sortOrder: 'asc' },
      ],
    });

    res.json(successResponse(images));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/product-images/:imageId/primary
 *
 * 设置指定图片为主图，同时取消同产品其他图片的主图标记
 * 自动为新主图生成缩略图
 */
router.put('/:imageId/primary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const imageId = req.params.imageId;
    const userId = getUserId(req);

    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.deletedAt) {
      res.status(404).json({ success: false, message: '图片不存在' });
      return;
    }

    // 事务: 取消原主图 → 设置新主图 → 生成缩略图
    await prisma.$transaction(async (tx) => {
      // 取消同产品所有主图标记
      await tx.productImage.updateMany({
        where: { productId: image.productId, isPrimary: true },
        data: { isPrimary: false, updatedBy: userId },
      });

      // 设置新主图
      await tx.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true, updatedBy: userId },
      });
    });

    // 生成缩略图 (事务外执行，避免 I/O 阻塞事务)
    const { UPLOAD_ROOT } = await import('../utils/upload');
    const path = await import('path');
    const sourcePath = path.join(UPLOAD_ROOT, image.filePath);
    const thumbnailPath = await generateThumbnail(sourcePath);

    // 更新缩略图路径
    const updated = await prisma.productImage.update({
      where: { id: imageId },
      data: { thumbnailPath },
    });

    res.json(successResponse(updated, '主图设置成功'));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/product-images/:imageId/sort
 *
 * 更新图片排序
 * Body: { sortOrder: number }
 */
router.put('/:imageId/sort', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const imageId = req.params.imageId;
    const userId = getUserId(req);
    const { sortOrder } = req.body;

    if (typeof sortOrder !== 'number') {
      res.status(400).json({ success: false, message: 'sortOrder 必须为数字' });
      return;
    }

    const image = await prisma.productImage.update({
      where: { id: imageId },
      data: { sortOrder, updatedBy: userId },
    });

    res.json(successResponse(image, '排序更新成功'));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/product-images/:imageId
 *
 * 删除图片 (物理删除文件 + 数据库软删除)
 */
router.delete('/:imageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const imageId = req.params.imageId;
    const userId = getUserId(req);

    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.deletedAt) {
      res.status(404).json({ success: false, message: '图片不存在' });
      return;
    }

    // 软删除数据库记录
    await prisma.productImage.update({
      where: { id: imageId },
      data: { deletedAt: new Date(), updatedBy: userId },
    });

    // 物理删除文件
    try {
      deleteUploadedFile(image.filePath);
      if (image.thumbnailPath) {
        deleteUploadedFile(image.thumbnailPath);
      }
    } catch {
      // 文件删除失败不影响接口响应
      console.warn(`删除图片文件失败: ${image.filePath}`);
    }

    // 如果删除的是主图，自动将下一张设为主图
    if (image.isPrimary) {
      const nextImage = await prisma.productImage.findFirst({
        where: { productId: image.productId, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      });
      if (nextImage) {
        const { UPLOAD_ROOT } = await import('../utils/upload');
        const path = await import('path');
        const sourcePath = path.join(UPLOAD_ROOT, nextImage.filePath);
        const thumbnailPath = await generateThumbnail(sourcePath);

        await prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true, thumbnailPath, updatedBy: userId },
        });
      }
    }

    res.json(successResponse(null, '图片删除成功'));
  } catch (error) {
    next(error);
  }
});

export default router;
