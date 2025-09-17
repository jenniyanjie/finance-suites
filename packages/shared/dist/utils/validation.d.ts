/**
 * 输入验证工具函数
 */
import { CalculationError } from '../types';
export declare class ValidationError extends Error {
    field: string;
    constructor(field: string, message: string);
}
/**
 * 验证数字是否有效
 */
export declare const validateNumber: (value: number, fieldName: string, options?: {
    min?: number;
    max?: number;
    allowZero?: boolean;
}) => void;
/**
 * 验证百分比是否在合理范围内 (0-100)
 */
export declare const validatePercentage: (value: number, fieldName: string) => void;
/**
 * 验证概率是否在 [0, 1] 范围内
 */
export declare const validateProbability: (value: number, fieldName: string) => void;
/**
 * 检查是否溢出 (超过 1e15)
 */
export declare const checkOverflow: (value: number) => boolean;
/**
 * 格式化大数为科学计数法
 */
export declare const formatLargeNumber: (value: number, precision?: number) => string;
/**
 * 将验证错误转换为计算错误
 */
export declare const toCalculationError: (error: ValidationError) => CalculationError;
