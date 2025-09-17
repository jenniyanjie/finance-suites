/**
 * @finance-suites/shared
 * 金融计算器共享库
 */

// 导出所有类型定义
export * from './types';

// 导出数学计算函数
export * from './math/compound-interest';
export * from './math/cagr';
export * from './math/real-estate';

// 导出工具函数
export * from './utils/validation';

// 版本信息
export const VERSION = '1.0.0';
