/**
 * 模块6: 估值工具
 *
 * PE估值:
 *   目标价 = EPS × PE倍数
 *   建议买入价 = 目标价 × (1 - 安全边际%)
 *
 * DCF两阶段折现现金流:
 *   - 第一阶段 (1~n年): FCF * (1+g1)^t，折现回当前
 *   - 第二阶段 (终值): 使用戈登模型或退出倍数
 *   内在价值 = Σ PV(FCFt) + PV(终值)
 */
import { validateNumber, ValidationError, toCalculationError } from '../utils/validation';
/**
 * PE估值计算
 */
export const calculatePEValuation = (input) => {
    try {
        validateNumber(input.EPS, 'EPS', { min: 0.01 });
        validateNumber(input.targetPE.pessimistic, '悲观PE', { min: 0.01 });
        validateNumber(input.targetPE.neutral, '中性PE', { min: 0.01 });
        validateNumber(input.targetPE.optimistic, '乐观PE', { min: 0.01 });
        validateNumber(input.safetyMargin, '安全边际', { min: 0, max: 99 });
        if (input.targetPE.pessimistic > input.targetPE.neutral) {
            throw new ValidationError('悲观PE', '悲观PE不能大于中性PE');
        }
        if (input.targetPE.neutral > input.targetPE.optimistic) {
            throw new ValidationError('中性PE', '中性PE不能大于乐观PE');
        }
        const safetyFactor = 1 - input.safetyMargin / 100;
        const targetPriceRange = {
            pessimistic: round2(input.EPS * input.targetPE.pessimistic),
            neutral: round2(input.EPS * input.targetPE.neutral),
            optimistic: round2(input.EPS * input.targetPE.optimistic),
        };
        const suggestedBuyPrice = round2(targetPriceRange.neutral * safetyFactor);
        return {
            success: true,
            data: {
                targetPriceRange,
                suggestedBuyPrice,
            },
        };
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return { success: false, error: toCalculationError(error) };
        }
        return {
            success: false,
            error: { code: 'CALCULATION_ERROR', message: 'PE估值计算过程中发生错误' },
        };
    }
};
/**
 * DCF两阶段折现现金流估值
 */
export const calculateDCF = (input) => {
    try {
        validateNumber(input.FCF0, '自由现金流(FCF0)', { min: 0.01 });
        validateNumber(input.g, '增长率(g)', { min: -50, max: 200 });
        validateNumber(input.r, '折现率(r)', { min: 0.01, max: 99 });
        validateNumber(input.n, '预测年限(n)', { min: 1, max: 30 });
        if (input.terminalValue.type === 'gordon') {
            const gPerpetual = input.terminalValue.value;
            validateNumber(gPerpetual, '永续增长率', { min: -20, max: 20 });
            if (gPerpetual >= input.r) {
                throw new ValidationError('永续增长率', `永续增长率 (${gPerpetual}%) 必须小于折现率 (${input.r}%)`);
            }
        }
        else {
            validateNumber(input.terminalValue.value, '退出倍数', { min: 0.01 });
        }
        const gDecimal = input.g / 100;
        const rDecimal = input.r / 100;
        // 第一阶段：逐年现金流折现
        const cashFlowDetails = [];
        let pvSum = 0;
        for (let t = 1; t <= input.n; t++) {
            const cashFlow = round2(input.FCF0 * Math.pow(1 + gDecimal, t));
            const presentValue = round4(cashFlow / Math.pow(1 + rDecimal, t));
            pvSum += presentValue;
            cashFlowDetails.push({ year: t, cashFlow, presentValue });
        }
        // 终值计算
        const lastFCF = input.FCF0 * Math.pow(1 + gDecimal, input.n);
        let terminalValueAmount;
        if (input.terminalValue.type === 'gordon') {
            // 戈登增长模型: TV = FCF_n+1 / (r - g_perpetual)
            const gPerpetual = input.terminalValue.value / 100;
            const fcfNext = lastFCF * (1 + gPerpetual);
            terminalValueAmount = round2(fcfNext / (rDecimal - gPerpetual));
        }
        else {
            // 退出倍数: TV = FCF_n × 倍数
            terminalValueAmount = round2(lastFCF * input.terminalValue.value);
        }
        // 终值折现至当前
        const pvTerminal = round4(terminalValueAmount / Math.pow(1 + rDecimal, input.n));
        const valuation = round2(pvSum + pvTerminal);
        return {
            success: true,
            data: {
                valuation,
                cashFlowDetails,
                terminalValue: round2(terminalValueAmount),
            },
        };
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return { success: false, error: toCalculationError(error) };
        }
        return {
            success: false,
            error: { code: 'CALCULATION_ERROR', message: 'DCF估值计算过程中发生错误' },
        };
    }
};
const round2 = (v) => Math.round(v * 100) / 100;
const round4 = (v) => Math.round(v * 10000) / 10000;
