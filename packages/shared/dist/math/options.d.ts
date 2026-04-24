/**
 * 模块5: 期权盈亏计算
 *
 * 支持买入/卖出 Call/Put 四个方向的到期盈亏计算，
 * 以及 P&L 剖面数据（payoff curve）。
 *
 * 到期时：
 *   Long Call:  P&L = max(S - K, 0) - premium       per share
 *   Long Put:   P&L = max(K - S, 0) - premium       per share
 *   Short Call: P&L = premium - max(S - K, 0)       per share
 *   Short Put:  P&L = premium - max(K - S, 0)       per share
 *
 * 总 P&L = P&L per share × lots × multiplier
 */
import { OptionInput, OptionResult, ApiResponse } from '../types';
/**
 * 计算期权到期盈亏与损益平衡价
 *
 * input.type: 'call' | 'put'      — 期权类型
 * input.S:    当前标的价格（用来作为参考，计算当前持仓P&L）
 * input.K:    行权价
 * input.premium: 权利金（每股/单位）
 * input.lots:    张数
 * input.multiplier: 合约乘数（默认100）
 */
export declare const calculateOptionPL: (input: OptionInput) => ApiResponse<OptionResult>;
/**
 * 生成期权到期盈亏剖面数据（用于绘图）
 *
 * @param type       期权方向类型：'call' | 'put' | 'short_call' | 'short_put'
 * @param K          行权价
 * @param premium    权利金（每股）
 * @param lots       张数
 * @param multiplier 合约乘数（默认100）
 * @param points     剖面点数（默认50）
 * @returns          Array<{ price: number; pl: number }>
 */
export declare const generateOptionPayoffCurve: (type: string, K: number, premium: number, lots: number, multiplier?: number, points?: number) => Array<{
    price: number;
    pl: number;
}>;
