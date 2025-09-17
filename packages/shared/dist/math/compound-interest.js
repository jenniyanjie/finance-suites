/**
 * 模块1: 复利计算 (单利/复利)
 */
import { validateNumber, validatePercentage, ValidationError, toCalculationError, checkOverflow } from '../utils/validation';
/**
 * 计算复利终值
 * 公式：
 * - 单利：FV = P * (1 + r * n)
 * - 复利：FV = P * (1 + r) ^ n
 */
export const calculateFutureValue = (input) => {
    try {
        // 输入验证
        validateNumber(input.P, '本金', { min: 0.01 });
        validatePercentage(input.r, '年收益率');
        validateNumber(input.n, '年限', { min: 0.01 });
        if (!['simple', 'compound'].includes(input.mode)) {
            throw new ValidationError('mode', '计算模式必须是 simple 或 compound');
        }
        // 转换百分比为小数
        const rate = input.r / 100;
        let FV;
        if (input.mode === 'simple') {
            // 单利计算
            FV = input.P * (1 + rate * input.n);
        }
        else {
            // 复利计算
            // 处理负收益率边界情况
            if (rate <= -1) {
                throw new ValidationError('r', '复利计算中，年收益率不能小于等于-100%');
            }
            FV = input.P * Math.pow(1 + rate, input.n);
        }
        // 检查溢出
        if (checkOverflow(FV)) {
            throw new ValidationError('结果', '计算结果过大，建议调整参数');
        }
        const profit = FV - input.P;
        return {
            success: true,
            data: {
                FV: Math.round(FV * 100) / 100, // 保留2位小数
                profit: Math.round(profit * 100) / 100,
            },
        };
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return {
                success: false,
                error: toCalculationError(error),
            };
        }
        return {
            success: false,
            error: {
                code: 'CALCULATION_ERROR',
                message: '计算过程中发生错误',
            },
        };
    }
};
/**
 * 反向计算：给定终值和其他参数，计算本金
 */
export const calculatePrincipal = (FV, r, n, mode) => {
    try {
        validateNumber(FV, '终值', { min: 0.01 });
        validatePercentage(r, '年收益率');
        validateNumber(n, '年限', { min: 0.01 });
        const rate = r / 100;
        let P;
        if (mode === 'simple') {
            if (1 + rate * n <= 0) {
                throw new ValidationError('参数', '单利计算中，(1 + r * n) 必须大于0');
            }
            P = FV / (1 + rate * n);
        }
        else {
            if (rate <= -1) {
                throw new ValidationError('r', '复利计算中，年收益率不能小于等于-100%');
            }
            P = FV / Math.pow(1 + rate, n);
        }
        if (checkOverflow(P)) {
            throw new ValidationError('结果', '计算结果过大，建议调整参数');
        }
        return {
            success: true,
            data: {
                P: Math.round(P * 100) / 100,
            },
        };
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return {
                success: false,
                error: toCalculationError(error),
            };
        }
        return {
            success: false,
            error: {
                code: 'CALCULATION_ERROR',
                message: '反向计算过程中发生错误',
            },
        };
    }
};
/**
 * 反向计算：给定终值、本金和年限，计算年收益率
 */
export const calculateInterestRate = (FV, P, n, mode) => {
    try {
        validateNumber(FV, '终值', { min: 0.01 });
        validateNumber(P, '本金', { min: 0.01 });
        validateNumber(n, '年限', { min: 0.01 });
        let rate;
        if (mode === 'simple') {
            // 单利：r = (FV/P - 1) / n
            rate = (FV / P - 1) / n;
        }
        else {
            // 复利：r = (FV/P)^(1/n) - 1
            if (FV / P <= 0) {
                throw new ValidationError('参数', '终值与本金的比值必须大于0');
            }
            rate = Math.pow(FV / P, 1 / n) - 1;
        }
        const rPercent = rate * 100;
        return {
            success: true,
            data: {
                r: Math.round(rPercent * 10000) / 10000, // 保留4位小数
            },
        };
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return {
                success: false,
                error: toCalculationError(error),
            };
        }
        return {
            success: false,
            error: {
                code: 'CALCULATION_ERROR',
                message: '利率计算过程中发生错误',
            },
        };
    }
};
