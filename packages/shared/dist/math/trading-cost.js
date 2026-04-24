/**
 * 模块9: 港股交易费用计算
 * 基于 IBKR 港股交易费率计算买卖费用和净收益
 */
import { validateNumber, ValidationError, toCalculationError, checkOverflow } from '../utils/validation';
/**
 * 计算单边交易费用
 * @param amount 交易金额
 * @param rates 费率配置
 * @returns 费用明细
 */
function calculateSideFees(amount, rates) {
    const { commissionRate, minCommission, stampDuty, exchangeFee, clearingFee, sfcFee, frcFee } = rates;
    // 佣金计算: max(金额×佣金率, 最低佣金)
    const commission = Math.max(amount * (commissionRate / 100), minCommission);
    // 印花税: ceil(金额×税率) - 向上取整至 1 HKD
    const stamp = Math.ceil(amount * (stampDuty / 100));
    // 交易所费用: 金额×费率
    const exFee = amount * (exchangeFee / 100);
    // 清算费用: max(金额×费率, 2) - 最低 2 HKD
    const clearFee = Math.max(amount * (clearingFee / 100), 2);
    // SFC 征费: 金额×费率
    const sfc = amount * (sfcFee / 100);
    // FRC 征费: 金额×费率
    const frc = amount * (frcFee / 100);
    const totalFees = commission + stamp + exFee + clearFee + sfc + frc;
    return {
        amount,
        commission: Math.round(commission * 100) / 100,
        stamp: Math.round(stamp * 100) / 100,
        exchangeFee: Math.round(exFee * 100) / 100,
        clearingFee: Math.round(clearFee * 100) / 100,
        sfcFee: Math.round(sfc * 100) / 100,
        frcFee: Math.round(frc * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100
    };
}
/**
 * 计算港股交易费用和净收益
 * @param input 交易参数
 * @returns 计算结果
 */
export const calculateTradingCost = (input) => {
    try {
        // 输入验证
        validateNumber(input.buyPrice, '买入价', { min: 0.0001 });
        validateNumber(input.sellPrice, '卖出价', { min: 0.0001 });
        validateNumber(input.shares, '股数', { min: 1 });
        validateNumber(input.commissionRate, '佣金率', { min: 0, max: 100 });
        validateNumber(input.minCommission, '最低佣金', { min: 0 });
        validateNumber(input.stampDuty, '印花税', { min: 0, max: 100 });
        validateNumber(input.exchangeFee, '交易所费用', { min: 0, max: 100 });
        validateNumber(input.clearingFee, '清算费用', { min: 0, max: 100 });
        validateNumber(input.sfcFee, 'SFC 征费', { min: 0, max: 100 });
        validateNumber(input.frcFee, 'FRC 征费', { min: 0, max: 100 });
        // 确保股数为整数
        const shares = Math.floor(input.shares);
        // 计算交易金额
        const buyAmount = input.buyPrice * shares;
        const sellAmount = input.sellPrice * shares;
        // 准备费率配置
        const rates = {
            commissionRate: input.commissionRate,
            minCommission: input.minCommission,
            stampDuty: input.stampDuty,
            exchangeFee: input.exchangeFee,
            clearingFee: input.clearingFee,
            sfcFee: input.sfcFee,
            frcFee: input.frcFee
        };
        // 计算买入和卖出费用
        const buyBreakdown = calculateSideFees(buyAmount, rates);
        const sellBreakdown = calculateSideFees(sellAmount, rates);
        // 计算总成本和总收入
        const totalCost = buyAmount + buyBreakdown.totalFees;
        const totalRevenue = sellAmount - sellBreakdown.totalFees;
        // 计算净收益和投资回报率
        const netProfit = totalRevenue - totalCost;
        const roi = totalCost > 0 ? (netProfit / totalCost * 100) : 0;
        // 检查溢出
        if (checkOverflow(totalCost) || checkOverflow(totalRevenue)) {
            throw new ValidationError('结果', '计算结果过大，建议调整参数');
        }
        const result = {
            buyBreakdown,
            sellBreakdown,
            totalCost: Math.round(totalCost * 100) / 100,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            netProfit: Math.round(netProfit * 100) / 100,
            roi: Math.round(roi * 100) / 100
        };
        return {
            success: true,
            data: result
        };
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return {
                success: false,
                error: toCalculationError(error)
            };
        }
        return {
            success: false,
            error: {
                code: 'CALCULATION_ERROR',
                message: '交易费用计算过程中发生错误'
            }
        };
    }
};
/**
 * 获取 IBKR 港股交易的默认费率设置
 * @returns 默认费率配置
 */
export const getDefaultTradingRates = () => {
    return {
        commissionRate: 0.05, // Tiered 常用 0.05%
        minCommission: 18, // 单边最低佣金 18 HKD
        stampDuty: 0.1, // 印花税 0.1%
        exchangeFee: 0.00565, // 交易所费用 0.00565%
        clearingFee: 0.002, // 清算费用 0.002%，最低 2 HKD
        sfcFee: 0.0027, // SFC 交易征费 0.0027%
        frcFee: 0.00015 // FRC 征费 0.00015%
    };
};
