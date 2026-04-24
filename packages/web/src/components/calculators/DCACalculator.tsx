"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, TrendingUp, BarChart3, RefreshCw } from "lucide-react";
import { calculateDCA } from "@finance-suites/shared";
import type { DCAResult } from "@finance-suites/shared";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const formSchema = z.object({
  monthlyAmount: z.number().min(0.01, "每期金额必须大于0"),
  initialPrice: z.number().min(0.01, "初始价格必须大于0"),
  finalPrice: z.number().min(0.01, "终止价格必须大于0"),
  periods: z.number().min(1, "至少1期").max(600, "最多600期"),
  priceMode: z.enum(["linear", "volatile"]),
  volatility: z.number().min(0).max(500),
});

type FormData = z.infer<typeof formSchema>;

const fmt2 = (v: number) =>
  v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (v: number) =>
  `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

export default function DCACalculator() {
  const [result, setResult] = useState<DCAResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullTable, setShowFullTable] = useState(false);

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monthlyAmount: 1000,
      initialPrice: 10,
      finalPrice: 15,
      periods: 24,
      priceMode: "linear",
      volatility: 20,
    },
  });

  const monthlyAmount = watch("monthlyAmount");
  const initialPrice = watch("initialPrice");
  const finalPrice = watch("finalPrice");
  const periods = watch("periods");
  const priceMode = watch("priceMode");
  const volatility = watch("volatility");

  useEffect(() => {
    if (!monthlyAmount || !initialPrice || !finalPrice || !periods || !priceMode) return;

    const res = calculateDCA({
      monthlyAmount,
      initialPrice,
      finalPrice,
      periods,
      priceMode,
      volatility: volatility ?? 20,
    });

    if (res.success && res.data) {
      setResult(res.data);
      setError(null);
    } else {
      setError(res.error?.message || "计算错误");
      setResult(null);
    }
  }, [monthlyAmount, initialPrice, finalPrice, periods, priceMode, volatility]);

  // 图表数据：每期市值 vs 总投入 + 价格线
  const chartData = result?.periodDetails.map((d) => ({
    period: d.period,
    持仓市值: d.portfolioValue,
    累计投入: d.totalInvested,
    买入价: d.price,
    平均成本: d.avgCost,
  })) ?? [];

  const displayRows = showFullTable
    ? result?.periodDetails ?? []
    : result?.periodDetails.slice(0, 12) ?? [];

  const dcaBetter = result && result.profit >= result.lumpSum.profit;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 参数输入 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              定投参数
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>每期投入金额</Label>
                <Input
                  type="number"
                  step="100"
                  {...register("monthlyAmount", { valueAsNumber: true })}
                  className={errors.monthlyAmount ? "border-red-500" : ""}
                />
                {errors.monthlyAmount && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{errors.monthlyAmount.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>投资期数（期）</Label>
                <Input
                  type="number"
                  step="1"
                  {...register("periods", { valueAsNumber: true })}
                  className={errors.periods ? "border-red-500" : ""}
                />
                {errors.periods && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{errors.periods.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>初始价格（第1期）</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("initialPrice", { valueAsNumber: true })}
                  className={errors.initialPrice ? "border-red-500" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>终止价格（末期）</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("finalPrice", { valueAsNumber: true })}
                  className={errors.finalPrice ? "border-red-500" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>价格走势模式</Label>
              <Select
                defaultValue="linear"
                onValueChange={(v) => setValue("priceMode", v as "linear" | "volatile")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">线性增长（平滑过渡）</SelectItem>
                  <SelectItem value="volatile">模拟波动（叠加随机扰动）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {priceMode === "volatile" && (
              <div className="space-y-2">
                <Label>年化波动率 (%)</Label>
                <Input
                  type="number"
                  step="1"
                  {...register("volatility", { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-400">参考：低波动 10-20%，中波动 20-40%，高波动 40%+</p>
              </div>
            )}

            {result && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 space-y-1">
                <div>总投入：¥{fmt2(result.totalInvested)}</div>
                <div>持仓均摊成本：¥{fmt2(result.avgCost)}</div>
                <div>总持仓：{result.totalShares.toFixed(4)} 份</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 结果概要 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              收益对比
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
                {/* 定投 vs 一次性 主卡 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`border rounded-lg p-4 ${dcaBetter ? "bg-green-50 border-green-300" : "bg-blue-50 border-blue-200"}`}>
                    <div className={`text-xs font-semibold mb-2 ${dcaBetter ? "text-green-700" : "text-blue-700"}`}>
                      📅 定投 DCA {dcaBetter ? "✓ 更优" : ""}
                    </div>
                    <div className={`text-2xl font-bold ${result.profit >= 0 ? "text-green-900" : "text-red-900"}`}>
                      {result.profit >= 0 ? "+" : ""}¥{fmt2(result.profit)}
                    </div>
                    <div className={`text-sm font-medium mt-1 ${result.totalReturn >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {fmtPct(result.totalReturn)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">终值 ¥{fmt2(result.finalValue)}</div>
                  </div>

                  <div className={`border rounded-lg p-4 ${!dcaBetter ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"}`}>
                    <div className={`text-xs font-semibold mb-2 ${!dcaBetter ? "text-green-700" : "text-gray-500"}`}>
                      💰 一次性投入 {!dcaBetter ? "✓ 更优" : ""}
                    </div>
                    <div className={`text-2xl font-bold ${result.lumpSum.profit >= 0 ? "text-green-900" : "text-red-900"}`}>
                      {result.lumpSum.profit >= 0 ? "+" : ""}¥{fmt2(result.lumpSum.profit)}
                    </div>
                    <div className={`text-sm font-medium mt-1 ${result.lumpSum.totalReturn >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {fmtPct(result.lumpSum.totalReturn)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">终值 ¥{fmt2(result.lumpSum.finalValue)}</div>
                  </div>
                </div>

                {/* 差额 */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <span className="text-amber-800 font-medium">定投 vs 一次性：</span>
                  <span className={`font-bold ml-1 ${result.profit >= result.lumpSum.profit ? "text-green-700" : "text-red-700"}`}>
                    {result.profit >= result.lumpSum.profit ? "+" : ""}
                    ¥{fmt2(result.profit - result.lumpSum.profit)}
                  </span>
                  <span className="text-amber-700 ml-1">
                    ({result.profit >= result.lumpSum.profit ? "定投领先" : "一次性领先"})
                  </span>
                </div>

                {/* 详细数据 */}
                <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-600 space-y-1">
                  <div>总投入：¥{fmt2(result.totalInvested)}</div>
                  <div>
                    定投均摊成本：¥{fmt2(result.avgCost)}
                    {" "}（一次性：¥{fmt2(initialPrice)}）
                  </div>
                  <div>价格涨跌：¥{fmt2(initialPrice)} → ¥{fmt2(finalPrice)}
                    {" "}({fmtPct((finalPrice / initialPrice - 1) * 100)})
                  </div>
                  <div>投资期数：{periods} 期</div>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="text-center text-gray-500 py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>请输入参数开始模拟</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 走势图 */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              资产增长与价格走势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="period"
                  tickFormatter={(v) => `${v}期`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  yAxisId="value"
                  tickFormatter={(v) =>
                    v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v.toFixed(0)
                  }
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  yAxisId="price"
                  orientation="right"
                  tickFormatter={(v) => v.toFixed(1)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "买入价" || name === "平均成本") {
                      return [`¥${value.toFixed(2)}`, name];
                    }
                    return [`¥${fmt2(value)}`, name];
                  }}
                  labelFormatter={(label) => `第 ${label} 期`}
                />
                <Legend />
                {/* 参考线：均摊成本 */}
                {result && (
                  <ReferenceLine
                    yAxisId="price"
                    y={result.avgCost}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: "均摊成本", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }}
                  />
                )}
                <Bar yAxisId="value" dataKey="累计投入" fill="#e0e7ff" name="累计投入" />
                <Line
                  yAxisId="value"
                  type="monotone"
                  dataKey="持仓市值"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="持仓市值"
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="买入价"
                  stroke="#8b5cf6"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                  name="买入价"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 明细表 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>每期明细</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-2 font-medium text-gray-700">期数</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">买入价</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">本期份数</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">累计投入</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">持仓市值</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">浮动盈亏</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">均摊成本</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => (
                    <tr key={row.period} className="border-b border-dashed hover:bg-gray-50 transition-colors">
                      <td className="py-1.5 px-2 text-gray-500">第 {row.period} 期</td>
                      <td className="py-1.5 px-2 text-right">¥{row.price.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right text-blue-700">{row.sharesBought.toFixed(4)}</td>
                      <td className="py-1.5 px-2 text-right">¥{fmt2(row.totalInvested)}</td>
                      <td className="py-1.5 px-2 text-right font-medium">¥{fmt2(row.portfolioValue)}</td>
                      <td className={`py-1.5 px-2 text-right font-medium ${row.unrealizedPL >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {row.unrealizedPL >= 0 ? "+" : ""}¥{fmt2(row.unrealizedPL)}
                      </td>
                      <td className="py-1.5 px-2 text-right text-amber-700">¥{fmt2(row.avgCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.periodDetails.length > 12 && (
              <button
                onClick={() => setShowFullTable(!showFullTable)}
                className="mt-4 w-full text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {showFullTable
                  ? "收起"
                  : `展开全部 ${result.periodDetails.length} 期明细`}
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
