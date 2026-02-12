/**
 * 其他配置相关类型定义
 */

// ==================== 验证规则 ====================

export interface ValidationRule {
  required?: boolean;
  // 数字类型
  min?: number;
  max?: number;
  integer?: boolean;
  // 日期类型
  minDate?: string;
  maxDate?: string;
  // 文本类型
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  // 数组类型
  minItems?: number;
  maxItems?: number;
  elementValidation?: ValidationRule;
}

// ==================== 配置参数 ====================

export interface ConfigParameter {
  id: string;
  configId: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'array';
  elementType?: 'text' | 'number' | 'date' | null;
  value: string | null;
  validation?: string | null; // JSON string
  orderNum: number;
}

export interface ConfigParameterWithParsed extends ConfigParameter {
  parsedValue: string | string[];
  parsedValidation?: ValidationRule;
}

// ==================== 其他配置 ====================

export interface OtherConfig {
  id: string;
  name: string;
  description: string | null;
  orderNum: number;
  createdBy: string | null;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
  parameters?: ConfigParameter[];
}

export interface OtherConfigWithParameters extends OtherConfig {
  parameters: ConfigParameter[];
}

// ==================== API 输入类型 ====================

export interface UpdateParameterInput {
  id: string;
  value: string;
}

export interface UpdateParametersInput {
  parameters: UpdateParameterInput[];
}
