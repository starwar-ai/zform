/**
 * 文件上传工具
 *
 * 基于 multer 实现文件上传，基于 sharp 实现缩略图生成。
 * - 上传文件保存到 uploads/products/ 目录
 * - 文件名使用 时间戳-随机字符串 格式，避免冲突
 * - 缩略图保存到 uploads/products/thumbnails/ 目录
 */

import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// 上传根目录 (相对于 server/)
const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');
const PRODUCT_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'products');
const THUMBNAIL_DIR = path.join(PRODUCT_UPLOAD_DIR, 'thumbnails');

// 缩略图尺寸
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

// 允许的图片 MIME 类型
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
];

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** 确保目录存在 */
function ensureDirExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** 生成安全的存储文件名: 时间戳-随机串.ext */
function generateSafeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomStr}${ext}`;
}

// 确保上传目录存在
ensureDirExists(PRODUCT_UPLOAD_DIR);
ensureDirExists(THUMBNAIL_DIR);

/** multer 磁盘存储配置 */
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, PRODUCT_UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const safeName = generateSafeFilename(file.originalname);
    cb(null, safeName);
  },
});

/** 文件过滤器：仅允许图片 */
function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}。仅支持 JPEG、PNG、GIF、WebP、BMP 格式`));
  }
}

/** 产品图片上传中间件 (支持多文件, 字段名: images, 最多 20 张) */
export const productImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 20,
  },
}).array('images', 20);

/**
 * 为指定图片生成缩略图
 *
 * @param sourcePath 原图完整路径
 * @returns 缩略图相对路径 (相对于 uploads 目录)
 */
export async function generateThumbnail(sourcePath: string): Promise<string> {
  const filename = path.basename(sourcePath);
  const thumbFilename = `thumb_${filename}`;
  const thumbPath = path.join(THUMBNAIL_DIR, thumbFilename);

  await sharp(sourcePath)
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .toFile(thumbPath);

  // 返回相对于 uploads 目录的路径
  return `products/thumbnails/${thumbFilename}`;
}

/**
 * 获取文件相对于 uploads 目录的路径
 */
export function getRelativePath(absolutePath: string): string {
  return path.relative(UPLOAD_ROOT, absolutePath).replace(/\\/g, '/');
}

/**
 * 删除上传的文件 (物理删除)
 */
export function deleteUploadedFile(relativePath: string): void {
  const fullPath = path.join(UPLOAD_ROOT, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/** 上传根目录 (用于静态文件服务) */
export { UPLOAD_ROOT };
