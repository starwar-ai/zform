/**
 * 统一单据 API —— 模块入口
 */

export { documentTypeRegistry } from './registry';
export { DocumentService } from './document.service';
export { documentController } from './document.controller';
export { default as documentRoutes } from './document.routes';
export { registerAllAdapters } from './adapters';
export type {
  DocumentTypeAdapter,
  ActionHandler,
  AggregateFieldDef,
  DocumentListParams,
  DocumentListResult,
  AggregateResult,
} from './types';
