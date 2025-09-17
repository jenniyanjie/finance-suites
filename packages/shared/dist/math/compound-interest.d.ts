/**
 * 模块1: 复利计算 (单利/复利)
 */
import { FVInput, FVResult, ApiResponse } from '../types';
/**
 * 计算复利终值
 * 公式：
 * - 单利：FV = P * (1 + r * n)
 * - 复利：FV = P * (1 + r) ^ n
 */
export declare const calculateFutureValue: (input: FVInput) => ApiResponse<FVResult>;
/**
 * 反向计算：给定终值和其他参数，计算本金
 */
export declare const calculatePrincipal: (FV: number, r: number, n: number, mode: "simple" | "compound") => ApiResponse<{
    P: number;
}>;
/**
 * 反向计算：给定终值、本金和年限，计算年收益率
 */
export declare const calculateInterestRate: (FV: number, P: number, n: number, mode: "simple" | "compound") => ApiResponse<{
    r: number;
}>;
