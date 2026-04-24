"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, TrendingUp, BarChart3 } from "lucide-react";
import { calculateOptionPL, generateOptionPayoffCurve } from "@finance-suites/shared";
import type { OptionResult } from "@finance-suites/shared";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const formSchema = z.object({
  type: z.enum(["call", "put", "short_call", "short_put"]),
  S: z.number().min(0.01, "标的价格必须大于0"),
  K: z.number().min(0.01, "行权价必须大于0"),
  premium: z.number().min(0, "权利金不能为负"),
  lots: z.number().min(1, "张数至少为1"),
  multiplier: z.number().min(1, "合约乘数至少为1"),
});

type FormData = z.infer<typeof formSchema>;

const TYPE_LABELS: Record<string, string> = {
  call: "买入 Call（Long Call）",
  put: "买入 Put（Long Put）",
  short_call: "卖出 Call（Short Call）",
  short_put: "卖出 Put（Short Put）",
};

const fmt2 = (v: number) =>
  v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OptionsCalculator() {
  const [result, setResult] = useState<OptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [curveData, setCurveData] = useState<Array<{ price: number; pl: number }>>([]);

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "call",
      S: 105,
      K: 100,
      premium: 5,
      lots: 1,
      multiplier: 100,
    },
  });

  const type = watch("type");
  const S = watch("S");
  const K = watch("K");
  const premium = watch("premium");
  const lots = watch("lots");
  const multiplier = watch("multiplier");

  // 实时计算
  useEffect(() => {
    if (!S || !K || premium === undefined || !lots || !multiplier) return;

    const res = calculateOptionPL({
      type: type as any,
      S,
      K,
      premium,
      lots,
      multiplier,
    });

    if (res.success && res.data) {
      setResult(res.data);
      setError(null);
    } else {
      setError(res.error?.message || "计算错误");
      setResult(null);
    }

    // 生成盈亏剖面
    const curve = generateOptionPayoffCurve(type, K, premium, lots, multiplier, 60);
    setCurveData(curve);
  }, [type, S, K, premium, lots, multiplier]);

  const isProfit = result && result.PL > 0;
  const isLong = type === "call" || type === "put";

  // 计算最大盈利/亏损（用于概要显示）
  const maxLoss = isLong
    ? -(premium * lots * multiplier)
    : null; // Long: 最大亏损为权利金
  const maxGain =
    type === "put" || type === "short_put"
      ? null // Put理论上最大盈利有限
      : null; // Call理论上最大盈利无限

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 参数输入 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              期权参数
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>期权方向与类型</Label>
              <Select
                defaultValue="call"
                onValueChange={(v) => setValue("type", v as FormData["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">买入 Call（Long Call）— 看涨</SelectItem>
                  <SelectItem value="put">买入 Put（Long Put）— 看跌</SelectItem>
                  <SelectItem value="short_call">卖出 Call（Short Call）— 看平/跌</SelectItem>
                  <SelectItem value="short_put">卖出 Put（Short Put）— 看平/涨</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>标的当前价格</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("S", { valueAsNumber: true })}
                  className={errors.S ? "border-red-500" : ""}
                />
                {errors.S && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{errors.S.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>行权价 K</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("K", { valueAsNumber: true })}
                  className={errors.K ? "border-red-500" : ""}
                />
                {errors.K && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{errors.K.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>权利金（每股/每单位）</Label>
              <Input
                type="number"
                step="0.01"
                {...register("premium", { valueAsNumber: true })}
                className={errors.premium ? "border-red-500" : ""}
              />
              {errors.premium && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.premium.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>张数</Label>
                <Input
                  type="number"
                  step="1"
                  {...register("lots", { valueAsNumber: true })}
                  className={errors.lots ? "border-red-500" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>合约乘数</Label>
                <Input
                  type="number"
                  step="1"
                  {...register("multiplier", { valueAsNumber: true })}
                  className={errors.multiplier ? "border-red-500" : ""}
                />
                <p className="text-xs text-gray-400">股票期权默认 100</p>
              </div>
            </div>

            {/* 期权特征说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
              {type === "call" && (
                <>
                  <p>📈 <strong>Long Call</strong>：付出权利金，获得以行权价买入的权利</p>
                  <p>最大亏损：权利金总额 | 最大盈利：理论无限</p>
                </>
              )}
              {type === "put" && (
                <>
                  <p>📉 <strong>Long Put</strong>：付出权利金，获得以行权价卖出的权利</p>
                  <p>最大亏损：权利金总额 | 最大盈利：K × lots × multiplier</p>
                </>
              )}
              {type === "short_call" && (
                <>
                  <p>🔻 <strong>Short Call</strong>：收取权利金，承担以行权价卖出的义务</p>
                  <p>最大盈利：权利金总额 | 最大亏损：理论无限</p>
                </>
              )}
              {type === "short_put" && (
                <>
                  <p>🔺 <strong>Short Put</strong>：收取权利金，承担以行权价买入的义务</p>
                  <p>最大盈利：权利金总额 | 最大亏损：K × lots × multiplier - 权利金</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 计算结果 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              到期损益
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
                {/* 主要结果 */}
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`border rounded-lg p-4 ${
                      isProfit
                        ? "bg-green-50 border-green-200"
                        : result.PL < 0
                        ? "bg-red-50 border-red-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${
                        isProfit ? "text-green-800" : result.PL < 0 ? "text-red-800" : "text-gray-800"
                      }`}
                    >
                      到期盈亏
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        isProfit ? "text-green-900" : result.PL < 0 ? "text-red-900" : "text-gray-900"
                      }`}
                    >
                      {result.PL >= 0 ? "+" : ""}
                      {fmt2(result.PL)}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-amber-800 text-sm font-medium">损益平衡价</div>
                    <div className="text-amber-900 text-2xl font-bold">
                      {fmt2(result.breakEvenPrice)}
                    </div>
                  </div>
                </div>

                {/* 参数汇总 */}
                <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-600 space-y-1">
                  <div>策略：{TYPE_LABELS[type]}</div>
                  <div>标的价格：{S} | 行权价：{K}</div>
                  <div>权利金：{premium} × {lots}张 × {multiplier}（乘数）</div>
                  <div>
                    权利金总额：
                    <span className={isLong ? "text-red-600" : "text-green-600"}>
                      {isLong ? "-" : "+"}{fmt2(premium * lots * multiplier)}
                    </span>
                  </div>
                  <div>
                    标的状态：
                    {type === "call" || type === "short_call"
                      ? S > K
                        ? "实值（ITM）"
                        : S === K
                        ? "平值（ATM）"
                        : "虚值（OTM）"
                      : S < K
                      ? "实值（ITM）"
                      : S === K
                      ? "平值（ATM）"
                      : "虚值（OTM）"}
                  </div>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="text-center text-gray-500 py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>请输入参数计算期权损益</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 到期盈亏剖面图 */}
      {curveData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              到期盈亏剖面（Payoff Curve）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={curveData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="price"
                  tickFormatter={(v) => v.toFixed(0)}
                  tick={{ fontSize: 11 }}
                  label={{ value: "标的价格", position: "insideBottomRight", offset: -10, fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 1000 || v <= -1000
                      ? `${(v / 1000).toFixed(1)}K`
                      : v.toFixed(0)
                  }
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value >= 0 ? "+" : ""}${fmt2(value)}`,
                    "盈亏",
                  ]}
                  labelFormatter={(label) => `标的价格: ${Number(label).toFixed(2)}`}
                />
                <Legend />
                {/* 零线 */}
                <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
                {/* 当前标的价格 */}
                {S && (
                  <ReferenceLine
                    x={S}
                    stroke="#3b82f6"
                    strokeDasharray="4 4"
                    label={{ value: "当前价", position: "top", fontSize: 11, fill: "#3b82f6" }}
                  />
                )}
                {/* 行权价 */}
                {K && (
                  <ReferenceLine
                    x={K}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: "行权价", position: "top", fontSize: 11, fill: "#f59e0b" }}
                  />
                )}
                {/* 损益平衡价 */}
                {result && (
                  <ReferenceLine
                    x={result.breakEvenPrice}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: "盈亏平衡", position: "insideTopRight", fontSize: 11, fill: "#10b981" }}
                  />
                )}
                <Line
                  type="linear"
                  dataKey="pl"
                  name="到期盈亏"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
