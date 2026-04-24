"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Calculator, BarChart3, Share2, TrendingUp, DollarSign, Activity } from "lucide-react";
import { calculateTradingCost, getDefaultTradingRates } from "@finance-suites/shared";
import type { TradingCostInput, TradingCostResult } from "@finance-suites/shared";
import { useCalculationHistory } from "@/lib/useCalculationHistory";
import HistoryPanel from "@/components/ui/HistoryPanel";

// 表单验证模式
const formSchema = z.object({
  buyPrice: z.number().min(0.0001, "买入价必须大于0"),
  sellPrice: z.number().min(0.0001, "卖出价必须大于0"),
  shares: z.number().min(1, "股数必须大于0"),
  commissionRate: z.number().min(0, "佣金率不能为负").max(100, "佣金率不能超过100%"),
  minCommission: z.number().min(0, "最低佣金不能为负"),
  stampDuty: z.number().min(0, "印花税不能为负").max(100, "印花税不能超过100%"),
  exchangeFee: z.number().min(0, "交易所费用不能为负").max(100, "交易所费用不能超过100%"),
  clearingFee: z.number().min(0, "清算费用不能为负").max(100, "清算费用不能超过100%"),
  sfcFee: z.number().min(0, "SFC征费不能为负").max(100, "SFC征费不能超过100%"),
  frcFee: z.number().min(0, "FRC征费不能为负").max(100, "FRC征费不能超过100%")
});

type FormData = z.infer<typeof formSchema>;

// 格式化港币显示
const formatHKD = (amount: number): string => {
  return `HK$${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function TradingCostCalculator() {
  const [result, setResult] = useState<TradingCostResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { history, addRecord, removeRecord, clearHistory } = useCalculationHistory<TradingCostResult>('trading');

  // 获取默认费率并设置默认值
  const defaultRates = getDefaultTradingRates();
  const defaultValues: FormData = {
    buyPrice: 9.52,
    sellPrice: 9.70,
    shares: 20000,
    ...defaultRates
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const buyPrice = watch("buyPrice");
  const sellPrice = watch("sellPrice");
  const shares = watch("shares");
  const commissionRate = watch("commissionRate");
  const minCommission = watch("minCommission");
  const stampDuty = watch("stampDuty");
  const exchangeFee = watch("exchangeFee");
  const clearingFee = watch("clearingFee");
  const sfcFee = watch("sfcFee");
  const frcFee = watch("frcFee");

  // 实时计算功能
  useEffect(() => {
    if (buyPrice > 0 && sellPrice > 0 && shares > 0) {
      const inputData: TradingCostInput = {
        buyPrice,
        sellPrice,
        shares,
        commissionRate,
        minCommission,
        stampDuty,
        exchangeFee,
        clearingFee,
        sfcFee,
        frcFee
      };

      const calcResult = calculateTradingCost(inputData);
      if (calcResult.success && calcResult.data) {
        setResult(calcResult.data);
        setError(null);
      } else {
        setError(calcResult.error?.message || "计算错误");
        setResult(null);
      }
    }
  }, [buyPrice, sellPrice, shares, commissionRate, minCommission, stampDuty, exchangeFee, clearingFee, sfcFee, frcFee]);

  // 防抖保存历史
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => {
      addRecord({
        inputSummary: `买入HK$${buyPrice} → 卖出HK$${sellPrice}，${shares}股`,
        resultSummary: `净收益 ${result.netProfit >= 0 ? "+" : ""}${formatHKD(result.netProfit)}，ROI ${result.roi >= 0 ? "+" : ""}${result.roi.toFixed(2)}%`,
        inputs: { buyPrice, sellPrice, shares, commissionRate, minCommission, stampDuty, exchangeFee, clearingFee, sfcFee, frcFee },
        result,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [buyPrice, sellPrice, shares, result]);

  const handleSelectHistory = (record: import("@/lib/useCalculationHistory").HistoryRecord<TradingCostResult>) => {
    const i = record.inputs as { buyPrice: number; sellPrice: number; shares: number; commissionRate: number; minCommission: number; stampDuty: number; exchangeFee: number; clearingFee: number; sfcFee: number; frcFee: number };
    setValue("buyPrice", i.buyPrice);
    setValue("sellPrice", i.sellPrice);
    setValue("shares", i.shares);
    setValue("commissionRate", i.commissionRate);
    setValue("minCommission", i.minCommission);
    setValue("stampDuty", i.stampDuty);
    setValue("exchangeFee", i.exchangeFee);
    setValue("clearingFee", i.clearingFee);
    setValue("sfcFee", i.sfcFee);
    setValue("frcFee", i.frcFee);
  };

  const onSubmit = (data: FormData) => {
    setError(null);
    
    const calcResult = calculateTradingCost(data);
    if (calcResult.success && calcResult.data) {
      setResult(calcResult.data);
    } else {
      setError(calcResult.error?.message || "计算错误");
      setResult(null);
    }
  };

  const loadExample = () => {
    setValue("buyPrice", 9.52);
    setValue("sellPrice", 9.70);
    setValue("shares", 20000);
    Object.entries(defaultRates).forEach(([key, value]) => {
      setValue(key as keyof FormData, value);
    });
  };

  const resetForm = () => {
    reset(defaultValues);
    setResult(null);
    setError(null);
  };

  const shareResults = () => {
    if (result) {
      const url = new URL(window.location.href);
      const currentValues = { buyPrice, sellPrice, shares, commissionRate, minCommission, stampDuty, exchangeFee, clearingFee, sfcFee, frcFee };
      Object.entries(currentValues).forEach(([key, value]) => {
        url.searchParams.set(key, value.toString());
      });

      navigator.clipboard.writeText(url.toString());
      alert("链接已复制到剪贴板！");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 输入表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              交易参数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* 交易基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyPrice">买入价 (HKD/股)</Label>
                  <Input
                    id="buyPrice"
                    type="number"
                    step="0.0001"
                    {...register("buyPrice", { valueAsNumber: true })}
                    className={errors.buyPrice ? "border-red-500" : ""}
                  />
                  {errors.buyPrice && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.buyPrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellPrice">卖出价 (HKD/股)</Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    step="0.0001"
                    {...register("sellPrice", { valueAsNumber: true })}
                    className={errors.sellPrice ? "border-red-500" : ""}
                  />
                  {errors.sellPrice && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.sellPrice.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shares">股数</Label>
                <Input
                  id="shares"
                  type="number"
                  step="1"
                  {...register("shares", { valueAsNumber: true })}
                  className={errors.shares ? "border-red-500" : ""}
                />
                {errors.shares && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.shares.message}
                  </p>
                )}
              </div>

              {/* 费率设置 */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 text-gray-700">费率设置 <span className="text-sm text-gray-500">(可调整)</span></h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">佣金率 (每边，%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.001"
                      {...register("commissionRate", { valueAsNumber: true })}
                      className={errors.commissionRate ? "border-red-500" : ""}
                    />
                    <p className="text-xs text-gray-500">Tiered 常用 0.05%</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minCommission">最低佣金 (HKD)</Label>
                    <Input
                      id="minCommission"
                      type="number"
                      step="0.01"
                      {...register("minCommission", { valueAsNumber: true })}
                      className={errors.minCommission ? "border-red-500" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stampDuty">印花税 (%)</Label>
                    <Input
                      id="stampDuty"
                      type="number"
                      step="0.01"
                      {...register("stampDuty", { valueAsNumber: true })}
                      className={errors.stampDuty ? "border-red-500" : ""}
                    />
                    <p className="text-xs text-gray-500">向上取整至1HKD</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exchangeFee">交易所费用 (%)</Label>
                    <Input
                      id="exchangeFee"
                      type="number"
                      step="0.0001"
                      {...register("exchangeFee", { valueAsNumber: true })}
                      className={errors.exchangeFee ? "border-red-500" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clearingFee">清算费用 (%)</Label>
                    <Input
                      id="clearingFee"
                      type="number"
                      step="0.0001"
                      {...register("clearingFee", { valueAsNumber: true })}
                      className={errors.clearingFee ? "border-red-500" : ""}
                    />
                    <p className="text-xs text-gray-500">最低2HKD/边</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sfcFee">SFC征费 (%)</Label>
                    <Input
                      id="sfcFee"
                      type="number"
                      step="0.0001"
                      {...register("sfcFee", { valueAsNumber: true })}
                      className={errors.sfcFee ? "border-red-500" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frcFee">FRC征费 (%)</Label>
                    <Input
                      id="frcFee"
                      type="number"
                      step="0.00001"
                      {...register("frcFee", { valueAsNumber: true })}
                      className={errors.frcFee ? "border-red-500" : ""}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  <Calculator className="h-4 w-4 mr-2" />
                  计算
                </Button>
                <Button type="button" variant="outline" onClick={loadExample}>
                  示例
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  重置
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 计算结果 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              计算结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">计算错误</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            {result && !error && (
              <div className="space-y-4">
                {/* KPI 指标 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-800 text-sm font-medium">买入总成本（含费）</div>
                    <div className="text-blue-900 text-xl font-bold">
                      {formatHKD(result.totalCost)}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 text-sm font-medium">卖出总收入（扣费）</div>
                    <div className="text-green-900 text-xl font-bold">
                      {formatHKD(result.totalRevenue)}
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-purple-800 text-sm font-medium">净收益</div>
                    <div className={`text-xl font-bold ${result.netProfit >= 0 ? "text-green-900" : "text-red-900"}`}>
                      {result.netProfit >= 0 ? "+" : ""}{formatHKD(result.netProfit)}
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-orange-800 text-sm font-medium">投资回报率 (ROI)</div>
                    <div className={`text-xl font-bold ${result.roi >= 0 ? "text-green-900" : "text-red-900"}`}>
                      {result.roi >= 0 ? "+" : ""}{result.roi.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* 费用明细表格 */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">费用拆分（买入）</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">费用项</th>
                            <th className="text-right py-2">金额 (HKD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-dashed">
                            <td className="py-2">交易金额</td>
                            <td className="text-right">{formatHKD(result.buyBreakdown.amount)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">佣金</td>
                            <td className="text-right">{formatHKD(result.buyBreakdown.commission)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">印花税</td>
                            <td className="text-right">{formatHKD(result.buyBreakdown.stamp)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">交易所费用</td>
                            <td className="text-right">{formatHKD(result.buyBreakdown.exchangeFee)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">清算费用</td>
                            <td className="text-right">{formatHKD(result.buyBreakdown.clearingFee)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">SFC征费</td>
                            <td className="text-right">{formatHKD(result.buyBreakdown.sfcFee)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">FRC征费</td>
                            <td className="text-right">{formatHKD(result.buyBreakdown.frcFee)}</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="font-bold">
                            <td className="py-2">费用合计</td>
                            <td className="text-right">{formatHKD(result.buyBreakdown.totalFees)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">费用拆分（卖出）</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">费用项</th>
                            <th className="text-right py-2">金额 (HKD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-dashed">
                            <td className="py-2">交易金额</td>
                            <td className="text-right">{formatHKD(result.sellBreakdown.amount)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">佣金</td>
                            <td className="text-right">{formatHKD(result.sellBreakdown.commission)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">印花税</td>
                            <td className="text-right">{formatHKD(result.sellBreakdown.stamp)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">交易所费用</td>
                            <td className="text-right">{formatHKD(result.sellBreakdown.exchangeFee)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">清算费用</td>
                            <td className="text-right">{formatHKD(result.sellBreakdown.clearingFee)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">SFC征费</td>
                            <td className="text-right">{formatHKD(result.sellBreakdown.sfcFee)}</td>
                          </tr>
                          <tr className="border-b border-dashed">
                            <td className="py-2">FRC征费</td>
                            <td className="text-right">{formatHKD(result.sellBreakdown.frcFee)}</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="font-bold">
                            <td className="py-2">费用合计</td>
                            <td className="text-right">{formatHKD(result.sellBreakdown.totalFees)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">交易概览</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>买入: {buyPrice} × {Math.floor(shares)} 股 = {formatHKD(buyPrice * Math.floor(shares))}</div>
                    <div>卖出: {sellPrice} × {Math.floor(shares)} 股 = {formatHKD(sellPrice * Math.floor(shares))}</div>
                    <div>总费用: {formatHKD(result.buyBreakdown.totalFees + result.sellBreakdown.totalFees)}</div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">重要提示</h4>
                  <p className="text-sm text-amber-700">
                    费率会随时间调整，实际以IBKR与港交所/监管机构最新公布为准。本工具仅供估算与学习用途。
                  </p>
                </div>

                <Button onClick={shareResults} variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  分享计算结果
                </Button>
              </div>
            )}

            {!result && !error && (
              <div className="text-center text-gray-500 py-8">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>请输入交易参数进行计算</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 计算历史 */}
      <HistoryPanel
        history={history}
        onClear={clearHistory}
        onRemove={removeRecord}
        onSelect={handleSelectHistory}
        title="港股交易历史"
      />
    </div>
  );
}


