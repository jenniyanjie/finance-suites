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
import { MortgageInput, MortgageResult, ApiResponse } from '../types';
/**
 * 计算房贷还款方案
 */
export declare const calculateMortgage: (input: MortgageInput) => ApiResponse<MortgageResult>;
