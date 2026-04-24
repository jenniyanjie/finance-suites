/**
 * 模块7: 房贷计算器
 *
 * 两种还款方式：
 * 1. 等额本息 (annuity): 每月还款额固定
 *    M = L * [r*(1+r)^n] / [(1+r)^n - 1]
 *    L = 贷款额, r = 月利率, n = 还款月数
 *
 * 2. 等额本金 (equal_principal): 每月归还相同本金，利息逐月递减
 *    每月还款 = L/n + (L - 已还本金) * r
 */
import { validateNumber, ValidationError, toCalculationError } from '../utils/validation';
/**
 * 计算房贷还款方案
 */
export const calculateMortgage = (input) => {
    try {
        validateNumber(input.L, '贷款额', { min: 0.01 });
        validateNumber(input.r, '年利率', { min: 0.01, max: 100 });
        validateNumber(input.n, '贷款年限', { min: 1, max: 50 });
        if (!['annuity', 'equal_principal'].includes(input.method)) {
            throw new ValidationError('还款方式', '还款方式必须是 annuity 或 equal_principal');
        }
        const monthlyRate = input.r / 100 / 12; // 月利率
        const totalMonths = Math.round(input.n * 12); // 总月数
        if (input.method === 'annuity') {
            return calculateAnnuity(input.L, monthlyRate, totalMonths);
        }
        else {
            return calculateEqualPrincipal(input.L, monthlyRate, totalMonths);
        }
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return { success: false, error: toCalculationError(error) };
        }
        return {
            success: false,
            error: { code: 'CALCULATION_ERROR', message: '房贷计算过程中发生错误' },
        };
    }
};
/**
 * 等额本息: M = L * [r*(1+r)^n] / [(1+r)^n - 1]
 */
const calculateAnnuity = (L, monthlyRate, totalMonths) => {
    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const monthlyPayment = (L * monthlyRate * pow) / (pow - 1);
    const amortizationSchedule = [];
    let balance = L;
    for (let month = 1; month <= totalMonths; month++) {
        const interest = round2(balance * monthlyRate);
        const principal = round2(monthlyPayment - interest);
        balance = round2(balance - principal);
        // Handle floating-point drift in the last month
        if (month === totalMonths) {
            const finalBalance = Math.max(0, balance);
            amortizationSchedule.push({
                month,
                payment: round2(monthlyPayment + finalBalance),
                principal: round2(principal + finalBalance),
                interest,
                balance: 0,
            });
        }
        else {
            amortizationSchedule.push({
                month,
                payment: round2(monthlyPayment),
                principal,
                interest,
                balance: Math.max(0, balance),
            });
        }
    }
    const totalPayment = round2(amortizationSchedule.reduce((sum, row) => sum + row.payment, 0));
    const totalInterest = round2(totalPayment - L);
    return {
        success: true,
        data: {
            monthlyPayment: round2(monthlyPayment),
            totalPayment,
            totalInterest,
            amortizationSchedule,
        },
    };
};
/**
 * 等额本金: 每月本金 = L/n，利息递减
 */
const calculateEqualPrincipal = (L, monthlyRate, totalMonths) => {
    const principalPerMonth = L / totalMonths;
    const amortizationSchedule = [];
    let balance = L;
    let totalPayment = 0;
    for (let month = 1; month <= totalMonths; month++) {
        const interest = round2(balance * monthlyRate);
        const principal = round2(principalPerMonth);
        const payment = round2(principal + interest);
        balance = round2(balance - principal);
        totalPayment += payment;
        amortizationSchedule.push({
            month,
            payment,
            principal,
            interest,
            balance: Math.max(0, balance),
        });
    }
    totalPayment = round2(totalPayment);
    const totalInterest = round2(totalPayment - L);
    return {
        success: true,
        data: {
            monthlyPayment: round2(amortizationSchedule[0].payment), // 首月月供
            totalPayment,
            totalInterest,
            amortizationSchedule,
        },
    };
};
/** 四舍五入到2位小数 */
const round2 = (value) => Math.round(value * 100) / 100;
