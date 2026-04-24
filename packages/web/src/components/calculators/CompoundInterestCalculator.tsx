"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Calculator, BarChart3, Share2 } from "lucide-react";
import { calculateFutureValue, calculatePrincipal, calculateInterestRate } from "@finance-suites/shared";
import type { FVInput, FVResult } from "@finance-suites/shared";
import { useCalculationHistory } from "@/lib/useCalculationHistory";
import HistoryPanel from "@/components/ui/HistoryPanel";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 表单验证模式
const formSchema = z.object({
  P: z.number().min(0.01, "本金必须大于0"),
  r: z.number().min(-99.99, "年收益率不能小于-99.99%").max(1000, "年收益率不能大于1000%"),
  n: z.number().min(0.01, "年限必须大于0"),
  mode: z.enum(["simple", "compound"])
});

type FormData = z.infer<typeof formSchema>;

export default function CompoundInterestCalculator() {
  const [result, setResult] = useState<FVResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculationMode, setCalculationMode] = useState<"fv" | "principal" | "rate">("fv");

  const { history, addRecord, removeRecord, clearHistory } = useCalculationHistory<FVResult>('compound');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      P: 10000,
      r: 10,
      n: 5,
      mode: "compound"
    }
  });

  const P = watch("P");
  const r = watch("r");
  const n = watch("n");
  const mode = watch("mode");

  // 生成逐年增长图表数据
  const chartData = (() => {
    if (!P || r === undefined || !n) return [];
    const years = Math.min(Math.ceil(n), 50);
    const rDecimal = r / 100;
    return Array.from({ length: years + 1 }, (_, i) => {
      const compound = P * Math.pow(1 + rDecimal, i);
      const simple = P * (1 + rDecimal * i);
      return {
        year: i,
        复利: Math.round(compound * 100) / 100,
        单利: Math.round(simple * 100) / 100,
        本金: P,
      };
    });
  })();

  // 实时计算功能
  useEffect(() => {
    if (P && r !== undefined && n && mode) {
      const inputData: FVInput = {
        P,
        r,
        n,
        mode
      };

      if (calculationMode === "fv") {
        const calcResult = calculateFutureValue(inputData);
        if (calcResult.success && calcResult.data) {
          setResult(calcResult.data);
          setError(null);
        } else {
          setError(calcResult.error?.message || "计算错误");
          setResult(null);
        }
      }
    }
  }, [P, r, n, mode, calculationMode]);

  // 防抖保存历史（用户停止输入1秒后才记录）
  useEffect(() => {
    if (calculationMode !== "fv" || !result) return;
    const timer = setTimeout(() => {
      addRecord({
        inputSummary: `本金¥${P}，年化${r}%，${n}年（${mode === "compound" ? "复利" : "单利"}）`,
        resultSummary: `终值 ¥${result.FV.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}，利润 ¥${result.profit.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`,
        inputs: { P, r, n, mode },
        result,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [P, r, n, mode, result, calculationMode]);

  const onSubmit = (data: FormData) => {
    setError(null);
    
    if (calculationMode === "fv") {
      const calcResult = calculateFutureValue(data);
      if (calcResult.success && calcResult.data) {
        setResult(calcResult.data);
      } else {
        setError(calcResult.error?.message || "计算错误");
        setResult(null);
      }
    } else if (calculationMode === "principal") {
      // 反向计算本金需要用户提供终值
      const FV = prompt("请输入目标终值：");
      if (FV) {
        const calcResult = calculatePrincipal(parseFloat(FV), data.r, data.n, data.mode);
        if (calcResult.success && calcResult.data) {
          setValue("P", calcResult.data.P);
        } else {
          setError(calcResult.error?.message || "计算错误");
        }
      }
    } else if (calculationMode === "rate") {
      // 反向计算利率需要用户提供终值
      const FV = prompt("请输入终值：");
      if (FV) {
        const calcResult = calculateInterestRate(parseFloat(FV), data.P, data.n, data.mode);
        if (calcResult.success && calcResult.data) {
          setValue("r", calcResult.data.r);
        } else {
          setError(calcResult.error?.message || "计算错误");
        }
      }
    }
  };

  const shareResults = () => {
    if (result) {
      const url = new URL(window.location.href);
      url.searchParams.set("P", P.toString());
      url.searchParams.set("r", r.toString());
      url.searchParams.set("n", n.toString());
      url.searchParams.set("mode", mode);
      
      navigator.clipboard.writeText(url.toString());
      alert("链接已复制到剪贴板！");
    }
  };

  const resetForm = () => {
    reset();
    setResult(null);
    setError(null);
  };

  const handleSelectHistory = (record: import("@/lib/useCalculationHistory").HistoryRecord<FVResult>) => {
    const inputs = record.inputs as { P: number; r: number; n: number; mode: "simple" | "compound" };
    setValue("P", inputs.P);
    setValue("r", inputs.r);
    setValue("n", inputs.n);
    setValue("mode", inputs.mode);
    setCalculationMode("fv");
  };

  return (
    <div className="space-y-6">
      <Tabs value={calculationMode} onValueChange={(value: any) => setCalculationMode(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fv">计算终值</TabsTrigger>
          <TabsTrigger value="principal">计算本金</TabsTrigger>
          <TabsTrigger value="rate">计算利率</TabsTrigger>
        </TabsList>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* 输入表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                参数输入
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="P">本金 (元)</Label>
                  <Input
                    id="P"
                    type="number"
                    step="0.01"
                    {...register("P", { valueAsNumber: true })}
                    className={errors.P ? "border-red-500" : ""}
                  />
                  {errors.P && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.P.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="r">年收益率 (%)</Label>
                  <Input
                    id="r"
                    type="number"
                    step="0.01"
                    {...register("r", { valueAsNumber: true })}
                    className={errors.r ? "border-red-500" : ""}
                  />
                  {errors.r && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.r.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="n">投资年限</Label>
                  <Input
                    id="n"
                    type="number"
                    step="0.01"
                    {...register("n", { valueAsNumber: true })}
                    className={errors.n ? "border-red-500" : ""}
                  />
                  {errors.n && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.n.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode">计算模式</Label>
                  <Select onValueChange={(value: "simple" | "compound") => setValue("mode", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择计算模式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">单利</SelectItem>
                      <SelectItem value="compound">复利</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    <Calculator className="h-4 w-4 mr-2" />
                    计算
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-green-800 text-sm font-medium">终值</div>
                      <div className="text-green-900 text-2xl font-bold">
                        ¥{result.FV.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-blue-800 text-sm font-medium">纯利润</div>
                      <div className={`text-2xl font-bold ${result.profit >= 0 ? "text-green-900" : "text-red-900"}`}>
                        ¥{result.profit.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">计算详情</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>投资模式: {mode === "compound" ? "复利" : "单利"}</div>
                      <div>本金: ¥{P?.toLocaleString("zh-CN")}</div>
                      <div>年收益率: {r}%</div>
                      <div>投资年限: {n}年</div>
                      <div>收益倍数: {P ? (result.FV / P).toFixed(2) : '–'}倍</div>
                    </div>
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
                  <p>请输入参数进行计算</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 增长曲线图 */}
        {chartData.length > 1 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                复利 vs 单利增长曲线
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSimple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="year"
                    tickFormatter={(v) => `${v}年`}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1000000
                        ? `${(v / 1000000).toFixed(1)}M`
                        : v >= 1000
                        ? `${(v / 1000).toFixed(0)}K`
                        : v.toFixed(0)
                    }
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`,
                      name,
                    ]}
                    labelFormatter={(label) => `第 ${label} 年`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="复利"
                    stroke="#22c55e"
                    fill="url(#colorCompound)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="单利"
                    stroke="#3b82f6"
                    fill="url(#colorSimple)"
                    strokeWidth={2}
                  />
                </AreaChart>
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
        title="复利计算历史"
      />
    </div>
  );
}
