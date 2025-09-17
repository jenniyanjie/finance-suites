/**
 * 金融计算器通用类型定义
 */
export interface FVInput {
    /** 本金 */
    P: number;
    /** 年收益率 (百分比形式，如10表示10%) */
    r: number;
    /** 年限 */
    n: number;
    /** 计算模式 */
    mode: 'simple' | 'compound';
}
export interface FVResult {
    /** 终值 */
    FV: number;
    /** 纯利润 */
    profit: number;
}
export interface CAGRInput {
    /** 买入价 */
    buy: number;
    /** 卖出价 */
    sell: number;
    /** 持有年限 */
    years: number;
}
export interface CAGRResult {
    /** 总收益率 */
    total: number;
    /** 年化收益率 (CAGR) */
    cagr: number;
}
export interface ExpectancyInput {
    /** 胜率 (0-1) */
    p: number;
    /** 盈亏比 (平均盈利/平均亏损) */
    R: number;
    /** 每笔风险金额 */
    risk: number;
    /** 笔数 (可选) */
    N?: number;
}
export interface ExpectancyResult {
    /** 单笔期望收益 */
    expectancy: number;
    /** 系统期望收益 (当N提供时) */
    systemExpectancy?: number;
}
export interface PositionInput {
    /** 胜率 (0-1) */
    p: number;
    /** 盈利倍数 */
    b: number;
    /** 风险承受上限 (可选) */
    maxDrawdown?: number;
}
export interface PositionResult {
    /** Kelly最优仓位 */
    kellyPosition: number;
    /** 是否高风险警告 (f* > 0.25) */
    isHighRisk: boolean;
    /** 建议仓位区间 (当提供maxDrawdown时) */
    suggestedRange?: {
        min: number;
        max: number;
    };
}
export interface OptionInput {
    /** 期权类型 */
    type: 'call' | 'put';
    /** 标的价格 */
    S: number;
    /** 行权价 */
    K: number;
    /** 权利金 */
    premium: number;
    /** 张数 */
    lots: number;
    /** 合约乘数 (默认100) */
    multiplier?: number;
}
export interface OptionResult {
    /** 到期盈亏 */
    PL: number;
    /** 盈亏平衡价 */
    breakEvenPrice: number;
}
export interface PEInput {
    /** 每股收益 */
    EPS: number;
    /** 目标PE区间 */
    targetPE: {
        pessimistic: number;
        neutral: number;
        optimistic: number;
    };
    /** 安全边际百分比 */
    safetyMargin: number;
}
export interface PEResult {
    /** 目标价区间 */
    targetPriceRange: {
        pessimistic: number;
        neutral: number;
        optimistic: number;
    };
    /** 建议买入价 */
    suggestedBuyPrice: number;
}
export interface DCFInput {
    /** 自由现金流 */
    FCF0: number;
    /** 增长率 */
    g: number;
    /** 折现率 */
    r: number;
    /** 预测年限 */
    n: number;
    /** 终值倍数或使用戈登模型 */
    terminalValue: {
        type: 'multiple' | 'gordon';
        value: number;
    };
}
export interface DCFResult {
    /** 估值结果 */
    valuation: number;
    /** 每年现金流明细 */
    cashFlowDetails: Array<{
        year: number;
        cashFlow: number;
        presentValue: number;
    }>;
    /** 终值 */
    terminalValue: number;
}
export interface MortgageInput {
    /** 贷款额 */
    L: number;
    /** 年利率 (百分比) */
    r: number;
    /** 年限 */
    n: number;
    /** 还款方式 */
    method: 'annuity' | 'equal_principal';
}
export interface MortgageResult {
    /** 月供 (等额本息) 或首月月供 (等额本金) */
    monthlyPayment: number;
    /** 总支付金额 */
    totalPayment: number;
    /** 总利息 */
    totalInterest: number;
    /** 摊还明细 */
    amortizationSchedule: Array<{
        month: number;
        payment: number;
        principal: number;
        interest: number;
        balance: number;
    }>;
}
export interface CalculationError {
    code: string;
    message: string;
    field?: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: CalculationError;
}
export interface RealEstateInput {
    /** 房屋总价 (万元) */
    propertyPrice: number;
    /** 杠杆比例 (贷款/总价，0-1) */
    leverageRatio: number;
    /** 房贷利率 (百分比) */
    loanRate: number;
    /** 租售比 (百分比) */
    rentYield: number;
    /** 房价年涨幅 (百分比) */
    priceGrowth: number;
}
export interface RealEstateResult {
    /** 自有资金 (万元) */
    equity: number;
    /** 贷款金额 (万元) */
    loan: number;
    /** 年租金收入 (万元) */
    rent: number;
    /** 年利息支出 (万元) */
    interest: number;
    /** 年净租金收益 (万元) */
    netRent: number;
    /** 房价上涨收益 (万元) */
    appreciation: number;
    /** 年总收益 (万元) */
    totalProfit: number;
    /** 年回报率 ROE (百分比) */
    roe: number;
}
export interface CalculatorConfig {
    /** 精度 (小数位数) */
    precision: number;
    /** 语言 */
    locale: 'zh-CN' | 'en-US';
    /** 货币符号 */
    currency: string;
}
