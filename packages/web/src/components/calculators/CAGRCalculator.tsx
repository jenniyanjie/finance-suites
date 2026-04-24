"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingUp, BarChart3, Share2, Target, Clock } from "lucide-react";
import { calculateCAGR, calculateTargetPrice, calculateRequiredTime } from "@finance-suites/shared";
import type { CAGRInput, CAGRResult } from "@finance-suites/shared";
import { useCalculationHistory } from "@/lib/useCalculationHistory";
import HistoryPanel from "@/components/ui/HistoryPanel";
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

// 表单验证模式
const cagrSchema = z.object({
  buy: z.number().min(0.01, "买入价必须大于0"),
  sell: z.number().min(0.01, "卖出价必须大于0"),
  years: z.number().min(0.001, "持有年限必须大于0")
});

const targetPriceSchema = z.object({
  currentPrice: z.number().min(0.01, "当前价格必须大于0"),
  targetCAGR: z.number().min(-99.99, "目标CAGR不能小于-99.99%").max(1000, "目标CAGR不能大于1000%"),
  years: z.number().min(0.001, "投资年限必须大于0")
});

const timeSchema = z.object({
  buyPrice: z.number().min(0.01, "买入价必须大于0"),
  sellPrice: z.number().min(0.01, "卖出价必须大于0"),
  targetCAGR: z.number().min(-99.99, "目标CAGR不能小于-99.99%").max(1000, "目标CAGR不能大于1000%")
});

type CAGRFormData = z.infer<typeof cagrSchema>;
type TargetPriceFormData = z.infer<typeof targetPriceSchema>;
type TimeFormData = z.infer<typeof timeSchema>;

export default function CAGRCalculator() {
  const [cagrResult, setCAGRResult] = useState<CAGRResult | null>(null);
  const [targetPriceResult, setTargetPriceResult] = useState<number | null>(null);
  const [timeResult, setTimeResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculationMode, setCalculationMode] = useState<"cagr" | "target" | "time">("cagr");

  const { history, addRecord, removeRecord, clearHistory } = useCalculationHistory<CAGRResult>('cagr');

  const cagrForm = useForm<CAGRFormData>({
    resolver: zodResolver(cagrSchema),
    defaultValues: {
      buy: 100,
      sell: 150,
      years: 3
    }
  });

  const targetForm = useForm<TargetPriceFormData>({
    resolver: zodResolver(targetPriceSchema),
    defaultValues: {
      currentPrice: 100,
      targetCAGR: 15,
      years: 5
    }
  });

  const timeForm = useForm<TimeFormData>({
    resolver: zodResolver(timeSchema),
    defaultValues: {
      buyPrice: 100,
      sellPrice: 200,
      targetCAGR: 15
    }
  });

  // CAGR表单字段
  const cagrBuy = cagrForm.watch("buy");
  const cagrSell = cagrForm.watch("sell");
  const cagrYears = cagrForm.watch("years");

  // 生成CAGR价格轨迹图表数据（仅在 CAGR 模式且数据有效时）
  const cagrChartData = (() => {
    if (!cagrBuy || !cagrSell || !cagrYears || cagrYears <= 0 || !cagrResult) return [];
    const cagr = cagrResult.cagr / 100;
    const totalYears = Math.min(Math.ceil(cagrYears * 1.5), 30); // 延伸至1.5倍以显示趋势
    return Array.from({ length: totalYears + 1 }, (_, i) => ({
      year: i,
      价格: Math.round(cagrBuy * Math.pow(1 + cagr, i) * 100) / 100,
    }));
  })();

  // 目标价格表单字段
  const targetCurrentPrice = targetForm.watch("currentPrice");
  const targetCAGR = targetForm.watch("targetCAGR");
  const targetYears = targetForm.watch("years");

  // 时间计算表单字段
  const timeBuyPrice = timeForm.watch("buyPrice");
  const timeSellPrice = timeForm.watch("sellPrice");
  const timeTargetCAGR = timeForm.watch("targetCAGR");

  // 实时计算CAGR
  useEffect(() => {
    if (calculationMode === "cagr" && cagrBuy && cagrSell && cagrYears) {
      const calcResult = calculateCAGR({
        buy: cagrBuy,
        sell: cagrSell,
        years: cagrYears
      });
      if (calcResult.success && calcResult.data) {
        setCAGRResult(calcResult.data);
        setError(null);
      } else {
        setError(calcResult.error?.message || "计算错误");
        setCAGRResult(null);
      }
    }
  }, [cagrBuy, cagrSell, cagrYears, calculationMode]);

  // 防抖保存历史（用户停止输入1秒后才记录）
  useEffect(() => {
    if (calculationMode !== "cagr" || !cagrResult) return;
    const timer = setTimeout(() => {
      addRecord({
        inputSummary: `买入¥${cagrBuy} → 卖出¥${cagrSell}，持有${cagrYears}年`,
        resultSummary: `CAGR ${cagrResult.cagr.toFixed(2)}%，总收益 ${cagrResult.total >= 0 ? "+" : ""}${cagrResult.total.toFixed(2)}%`,
        inputs: { buy: cagrBuy, sell: cagrSell, years: cagrYears },
        result: cagrResult,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [cagrBuy, cagrSell, cagrYears, cagrResult, calculationMode]);

  // 实时计算目标价格
  useEffect(() => {
    if (calculationMode === "target" && targetCurrentPrice && targetCAGR !== undefined && targetYears) {
      const calcResult = calculateTargetPrice(targetCurrentPrice, targetCAGR, targetYears);
      if (calcResult.success && calcResult.data) {
        setTargetPriceResult(calcResult.data.targetPrice);
        setError(null);
      } else {
        setError(calcResult.error?.message || "计算错误");
        setTargetPriceResult(null);
      }
    }
  }, [targetCurrentPrice, targetCAGR, targetYears, calculationMode]);

  // 实时计算所需时间
  useEffect(() => {
    if (calculationMode === "time" && timeBuyPrice && timeSellPrice && timeTargetCAGR !== undefined) {
      const calcResult = calculateRequiredTime(timeBuyPrice, timeSellPrice, timeTargetCAGR);
      if (calcResult.success && calcResult.data) {
        setTimeResult(calcResult.data.requiredYears);
        setError(null);
      } else {
        setError(calcResult.error?.message || "计算错误");
        setTimeResult(null);
      }
    }
  }, [timeBuyPrice, timeSellPrice, timeTargetCAGR, calculationMode]);

  const shareResults = () => {
    const url = new URL(window.location.href);
    if (calculationMode === "cagr" && cagrResult) {
      url.searchParams.set("tab", "cagr");
      url.searchParams.set("buy", cagrBuy.toString());
      url.searchParams.set("sell", cagrSell.toString());
      url.searchParams.set("years", cagrYears.toString());
    }

    navigator.clipboard.writeText(url.toString());
    alert("链接已复制到剪贴板！");
  };

  const handleSelectHistory = (record: import("@/lib/useCalculationHistory").HistoryRecord<CAGRResult>) => {
    const inputs = record.inputs as { buy: number; sell: number; years: number };
    cagrForm.setValue("buy", inputs.buy);
    cagrForm.setValue("sell", inputs.sell);
    cagrForm.setValue("years", inputs.years);
    setCalculationMode("cagr");
  };

  return (
    <div className="space-y-6">
      <Tabs value={calculationMode} onValueChange={(value: any) => setCalculationMode(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cagr">计算CAGR</TabsTrigger>
          <TabsTrigger value="target">目标价格</TabsTrigger>
          <TabsTrigger value="time">所需时间</TabsTrigger>
        </TabsList>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <TabsContent value="cagr" className="col-span-2">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* CAGR计算输入 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    CAGR计算
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="buy">买入价 (元)</Label>
                      <Input
                        id="buy"
                        type="number"
                        step="0.01"
                        {...cagrForm.register("buy", { valueAsNumber: true })}
                        className={cagrForm.formState.errors.buy ? "border-red-500" : ""}
                      />
                      {cagrForm.formState.errors.buy && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {cagrForm.formState.errors.buy.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sell">卖出价 (元)</Label>
                      <Input
                        id="sell"
                        type="number"
                        step="0.01"
                        {...cagrForm.register("sell", { valueAsNumber: true })}
                        className={cagrForm.formState.errors.sell ? "border-red-500" : ""}
                      />
                      {cagrForm.formState.errors.sell && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {cagrForm.formState.errors.sell.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="years">持有年限</Label>
                      <Input
                        id="years"
                        type="number"
                        step="0.001"
                        {...cagrForm.register("years", { valueAsNumber: true })}
                        className={cagrForm.formState.errors.years ? "border-red-500" : ""}
                      />
                      {cagrForm.formState.errors.years && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {cagrForm.formState.errors.years.message}
                        </p>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* CAGR结果 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    计算结果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {error && calculationMode === "cagr" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">计算错误</span>
                      </div>
                      <p className="text-red-700 mt-1">{error}</p>
                    </div>
                  )}

                  {cagrResult && !error && calculationMode === "cagr" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="text-blue-800 text-sm font-medium">总收益率</div>
                          <div className={`text-2xl font-bold ${cagrResult.total >= 0 ? "text-green-900" : "text-red-900"}`}>
                            {cagrResult.total >= 0 ? "+" : ""}{cagrResult.total.toFixed(2)}%
                          </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="text-green-800 text-sm font-medium">年化收益率 (CAGR)</div>
                          <div className={`text-2xl font-bold ${cagrResult.cagr >= 0 ? "text-green-900" : "text-red-900"}`}>
                            {cagrResult.cagr >= 0 ? "+" : ""}{cagrResult.cagr.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">投资详情</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>买入价: ¥{cagrBuy?.toLocaleString("zh-CN")}</div>
                          <div>卖出价: ¥{cagrSell?.toLocaleString("zh-CN")}</div>
                          <div>持有时间: {cagrYears}年</div>
                          <div>投资倍数: {cagrBuy ? (cagrSell / cagrBuy).toFixed(2) : '–'}倍</div>
                        </div>
                      </div>

                      <Button onClick={shareResults} variant="outline" className="w-full">
                        <Share2 className="h-4 w-4 mr-2" />
                        分享计算结果
                      </Button>
                    </div>
                  )}

                  {!cagrResult && !error && calculationMode === "cagr" && (
                    <div className="text-center text-gray-500 py-8">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>请输入参数进行计算</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="target" className="col-span-2">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 目标价格输入 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    目标价格计算
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPrice">当前价格 (元)</Label>
                      <Input
                        id="currentPrice"
                        type="number"
                        step="0.01"
                        {...targetForm.register("currentPrice", { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetCAGR">目标年化收益率 (%)</Label>
                      <Input
                        id="targetCAGR"
                        type="number"
                        step="0.01"
                        {...targetForm.register("targetCAGR", { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetYears">投资年限</Label>
                      <Input
                        id="targetYears"
                        type="number"
                        step="0.01"
                        {...targetForm.register("years", { valueAsNumber: true })}
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* 目标价格结果 */}
              <Card>
                <CardHeader>
                  <CardTitle>目标价格</CardTitle>
                </CardHeader>
                <CardContent>
                  {targetPriceResult && !error && calculationMode === "target" && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <div className="text-green-800 text-sm font-medium">目标价格</div>
                        <div className="text-green-900 text-3xl font-bold">
                          ¥{targetPriceResult.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">计算参数</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>当前价格: ¥{targetCurrentPrice?.toLocaleString("zh-CN")}</div>
                          <div>目标年化收益率: {targetCAGR}%</div>
                          <div>投资年限: {targetYears}年</div>
                          <div>预期涨幅: {targetCurrentPrice ? ((targetPriceResult / targetCurrentPrice - 1) * 100).toFixed(2) : '–'}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="time" className="col-span-2">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 时间计算输入 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    所需时间计算
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyPrice">买入价 (元)</Label>
                      <Input
                        id="buyPrice"
                        type="number"
                        step="0.01"
                        {...timeForm.register("buyPrice", { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sellPrice">目标价格 (元)</Label>
                      <Input
                        id="sellPrice"
                        type="number"
                        step="0.01"
                        {...timeForm.register("sellPrice", { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeTargetCAGR">期望年化收益率 (%)</Label>
                      <Input
                        id="timeTargetCAGR"
                        type="number"
                        step="0.01"
                        {...timeForm.register("targetCAGR", { valueAsNumber: true })}
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* 时间结果 */}
              <Card>
                <CardHeader>
                  <CardTitle>所需时间</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeResult && !error && calculationMode === "time" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <div className="text-blue-800 text-sm font-medium">达成目标所需时间</div>
                        <div className="text-blue-900 text-3xl font-bold">
                          {timeResult.toFixed(2)}年
                        </div>
                        <div className="text-blue-700 text-sm mt-1">
                          约{Math.round(timeResult * 12)}个月
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">计算参数</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>买入价: ¥{timeBuyPrice?.toLocaleString("zh-CN")}</div>
                          <div>目标价格: ¥{timeSellPrice?.toLocaleString("zh-CN")}</div>
                          <div>期望年化收益率: {timeTargetCAGR}%</div>
                          <div>总涨幅: {timeBuyPrice ? ((timeSellPrice / timeBuyPrice - 1) * 100).toFixed(2) : '–'}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>

        {/* CAGR 价格轨迹图 */}
        {calculationMode === "cagr" && cagrChartData.length > 1 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                CAGR 价格增长轨迹
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={cagrChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" tickFormatter={(v) => `${v}年`} tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0)
                    }
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`,
                      "价格",
                    ]}
                    labelFormatter={(label) => `第 ${label} 年`}
                  />
                  <Legend />
                  {/* 标记持有结束点 */}
                  <ReferenceLine
                    x={Math.round(cagrYears)}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{ value: "卖出", position: "top", fontSize: 11, fill: "#ef4444" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="价格"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </Tabs>

      {/* 计算历史 */}
      <HistoryPanel
        history={history}
        onClear={clearHistory}
        onRemove={removeRecord}
        onSelect={handleSelectHistory}
        title="CAGR 计算历史"
      />
    </div>
  );
}
