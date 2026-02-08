/**
 * 统一单据 API —— 服务端类型注册表
 *
 * 管理所有 DocumentTypeAdapter，供通用 Service/Controller 使用。
 */

import type { DocumentTypeAdapter } from './types';

class DocumentTypeRegistry {
  private adapters = new Map<string, DocumentTypeAdapter>();

  /** 注册一个单据类型适配器 */
  register(adapter: DocumentTypeAdapter): void {
    if (this.adapters.has(adapter.typeId)) {
      console.warn(
        `[DocumentTypeRegistry] Adapter "${adapter.typeId}" already registered, overwriting.`
      );
    }
    this.adapters.set(adapter.typeId, adapter);
  }

  /** 获取适配器 */
  get(typeId: string): DocumentTypeAdapter | undefined {
    return this.adapters.get(typeId);
  }

  /** 获取适配器 (不存在则抛错) */
  getOrThrow(typeId: string): DocumentTypeAdapter {
    const adapter = this.adapters.get(typeId);
    if (!adapter) {
      throw new Error(`未注册的单据类型: ${typeId}`);
    }
    return adapter;
  }

  /** 获取所有已注册的适配器 */
  getAll(): DocumentTypeAdapter[] {
    return Array.from(this.adapters.values());
  }

  /** 获取所有已注册的类型 ID */
  getAllTypeIds(): string[] {
    return Array.from(this.adapters.keys());
  }
}

/** 全局单例 */
export const documentTypeRegistry = new DocumentTypeRegistry();
