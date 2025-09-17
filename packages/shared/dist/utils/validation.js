/**
 * 输入验证工具函数
 */
export class ValidationError extends Error {
    constructor(field, message) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}
/**
 * 验证数字是否有效
 */
export const validateNumber = (value, fieldName, options) => {
    if (isNaN(value) || !isFinite(value)) {
        throw new ValidationError(fieldName, `${fieldName}必须是有效数字`);
    }
    if (options?.min !== undefined && value < options.min) {
        throw new ValidationError(fieldName, `${fieldName}不能小于${options.min}`);
    }
    if (options?.max !== undefined && value > options.max) {
        throw new ValidationError(fieldName, `${fieldName}不能大于${options.max}`);
    }
    if (options?.allowZero === false && value === 0) {
        throw new ValidationError(fieldName, `${fieldName}不能为零`);
    }
};
/**
 * 验证百分比是否在合理范围内 (0-100)
 */
export const validatePercentage = (value, fieldName) => {
    validateNumber(value, fieldName, { min: -100, max: 1000 });
};
/**
 * 验证概率是否在 [0, 1] 范围内
 */
export const validateProbability = (value, fieldName) => {
    validateNumber(value, fieldName, { min: 0, max: 1, allowZero: true });
};
/**
 * 检查是否溢出 (超过 1e15)
 */
export const checkOverflow = (value) => {
    return Math.abs(value) > 1e15;
};
/**
 * 格式化大数为科学计数法
 */
export const formatLargeNumber = (value, precision = 2) => {
    if (checkOverflow(value)) {
        return value.toExponential(precision);
    }
    return value.toFixed(precision);
};
/**
 * 将验证错误转换为计算错误
 */
export const toCalculationError = (error) => {
    return {
        code: 'VALIDATION_ERROR',
        message: error.message,
        field: error.field,
    };
};
