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
                      <div>收益倍数: {(result.FV / P).toFixed(2)}倍</div>
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
      </Tabs>
    </div>
  );
}
