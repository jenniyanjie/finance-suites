/**
 * 模块10: DCA定投模拟（Dollar-Cost Averaging）
 *
 * 核心逻辑：
 *   每期以固定金额按当期价格买入，价格由模式生成：
 *   - linear:   价格从 initialPrice 线性过渡到 finalPrice
 *   - volatile: 在线性趋势上叠加正态分布随机波动（使用确定性伪随机，保证可复现）
 *
 * 对比指标：
 *   一次性投入 (Lump Sum)：以相同总金额在第一期全部买入，同样以 finalPrice 估值
 */
import { validateNumber, ValidationError, toCalculationError } from '../utils/validation';
const round4 = (v) => Math.round(v * 10000) / 10000;
const round2 = (v) => Math.round(v * 100) / 100;
/**
 * 确定性伪随机（Box-Muller 变换 + 线性同余种子），保证同参数结果可复现
 */
const seededRandom = (seed) => {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
};
const gaussianRandom = (rand) => {
    // Box-Muller 变换
    const u1 = Math.max(rand(), 1e-10);
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};
/**
 * 生成各期价格序列
 */
const generatePrices = (initialPrice, finalPrice, periods, mode, volatility) => {
    const prices = [];
    const rand = seededRandom(Math.round(initialPrice * 100 + periods * 7));
    for (let i = 0; i < periods; i++) {
        // 线性基准价格
        const t = periods === 1 ? 0 : i / (periods - 1);
        const basePrie = initialPrice + (finalPrice - initialPrice) * t;
        if (mode === 'linear') {
            prices.push(round2(basePrie));
        }
        else {
            // 在线性基准上叠加月度随机扰动
            // 月度波动率 = 年化波动率 / sqrt(12)
            const monthlyVol = (volatility / 100) / Math.sqrt(12);
            const shock = gaussianRandom(rand) * monthlyVol;
            const price = round2(Math.max(basePrie * (1 + shock), 0.01));
            prices.push(price);
        }
    }
    // 强制最后一期等于 finalPrice（方便对比分析）
    prices[periods - 1] = finalPrice;
    return prices;
};
/**
 * 计算DCA定投模拟
 */
export const calculateDCA = (input) => {
    try {
        validateNumber(input.monthlyAmount, '每期投入金额', { min: 0.01 });
        validateNumber(input.initialPrice, '初始价格', { min: 0.01 });
        validateNumber(input.finalPrice, '终止价格', { min: 0.01 });
        validateNumber(input.periods, '投资期数', { min: 1, max: 600 });
        if (input.volatility !== undefined) {
            validateNumber(input.volatility, '年化波动率', { min: 0, max: 500 });
        }
        const volatility = input.volatility ?? 20;
        const prices = generatePrices(input.initialPrice, input.finalPrice, input.periods, input.priceMode, volatility);
        // ── 逐期模拟 ──────────────────────────────────────────────────────────────
        let totalShares = 0;
        let totalInvested = 0;
        const periodDetails = [];
        for (let i = 0; i < input.periods; i++) {
            const price = prices[i];
            const sharesBought = round4(input.monthlyAmount / price);
            totalShares = round4(totalShares + sharesBought);
            totalInvested = round2(totalInvested + input.monthlyAmount);
            const avgCost = round2(totalInvested / totalShares);
            const portfolioValue = round2(totalShares * price);
            const unrealizedPL = round2(portfolioValue - totalInvested);
            periodDetails.push({
                period: i + 1,
                price,
                sharesBought,
                totalShares,
                totalInvested,
                portfolioValue,
                unrealizedPL,
                avgCost,
            });
        }
        const finalPrice = prices[prices.length - 1];
        const finalValue = round2(totalShares * finalPrice);
        const profit = round2(finalValue - totalInvested);
        const totalReturn = round2((profit / totalInvested) * 100);
        const avgCost = round2(totalInvested / totalShares);
        // ── 一次性投入对比 ────────────────────────────────────────────────────────
        const lumpSumShares = round4(totalInvested / input.initialPrice);
        const lumpSumFinalValue = round2(lumpSumShares * finalPrice);
        const lumpSumProfit = round2(lumpSumFinalValue - totalInvested);
        const lumpSumReturn = round2((lumpSumProfit / totalInvested) * 100);
        return {
            success: true,
            data: {
                totalInvested,
                finalValue,
                profit,
                totalReturn,
                avgCost,
                totalShares,
                lumpSum: {
                    shares: lumpSumShares,
                    finalValue: lumpSumFinalValue,
                    profit: lumpSumProfit,
                    totalReturn: lumpSumReturn,
                },
                periodDetails,
            },
        };
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return { success: false, error: toCalculationError(error) };
        }
        return {
            success: false,
            error: { code: 'CALCULATION_ERROR', message: 'DCA定投计算过程中发生错误' },
        };
    }
};
