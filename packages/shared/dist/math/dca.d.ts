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
import { DCAInput, DCAResult, ApiResponse } from '../types';
/**
 * 计算DCA定投模拟
 */
export declare const calculateDCA: (input: DCAInput) => ApiResponse<DCAResult>;
