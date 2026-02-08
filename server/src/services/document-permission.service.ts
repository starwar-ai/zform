/**
 * DocumentPermissionService
 *
 * 文档级权限管理服务。
 * 管理单据实例级别的用户读/写权限。
 */

import prisma from '../config/database';
import { documentTypeRegistry } from '../documents/registry';

/** 权限类型 */
export type DocPermissionLevel = 'read' | 'write';

/** 文档权限记录 */
export interface DocPermissionRecord {
  id: string;
  docType: string;
  docId: string;
  userId: string;
  userName: string;
  permission: DocPermissionLevel;
  createdAt: Date;
  updatedAt: Date;
}

export class DocumentPermissionService {
  /**
   * 查询文档的所有权限记录
   */
  async list(docType: string, docId: string): Promise<DocPermissionRecord[]> {
    const records = await prisma.documentPermission.findMany({
      where: { docType, docId },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((r) => ({
      id: r.id,
      docType: r.docType,
      docId: r.docId,
      userId: r.userId,
      userName: r.userName,
      permission: r.permission as DocPermissionLevel,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  /**
   * 新增或更新权限（upsert on unique constraint）
   */
  async upsert(
    docType: string,
    docId: string,
    userId: string,
    userName: string,
    permission: DocPermissionLevel
  ): Promise<DocPermissionRecord> {
    const record = await prisma.documentPermission.upsert({
      where: {
        docType_docId_userId: { docType, docId, userId },
      },
      create: {
        docType,
        docId,
        userId,
        userName,
        permission,
      },
      update: {
        permission,
        userName, // 同步更新姓名
      },
    });

    return {
      id: record.id,
      docType: record.docType,
      docId: record.docId,
      userId: record.userId,
      userName: record.userName,
      permission: record.permission as DocPermissionLevel,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * 删除某用户在某文档上的权限
   */
  async remove(docType: string, docId: string, userId: string): Promise<void> {
    await prisma.documentPermission.delete({
      where: {
        docType_docId_userId: { docType, docId, userId },
      },
    });
  }

  /**
   * 校验当前用户是否为文档所有者
   * 通过 documentTypeRegistry 获取 adapter，然后查 createdBy
   */
  async checkOwnership(
    docType: string,
    docId: string,
    currentUserId: string
  ): Promise<boolean> {
    const adapter = documentTypeRegistry.getOrThrow(docType);
    const model = (prisma as any)[adapter.prismaModel];
    if (!model) {
      throw new Error(`Prisma model "${adapter.prismaModel}" not found`);
    }

    const doc = await model.findUnique({
      where: { id: docId },
      select: { createdBy: true },
    });

    if (!doc) {
      throw new Error(`文档不存在: ${docType}/${docId}`);
    }

    return doc.createdBy === currentUserId;
  }
}
