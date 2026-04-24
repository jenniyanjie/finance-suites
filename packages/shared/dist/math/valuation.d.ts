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
import { PEInput, PEResult, DCFInput, DCFResult, ApiResponse } from '../types';
/**
 * PE估值计算
 */
export declare const calculatePEValuation: (input: PEInput) => ApiResponse<PEResult>;
/**
 * DCF两阶段折现现金流估值
 */
export declare const calculateDCF: (input: DCFInput) => ApiResponse<DCFResult>;
