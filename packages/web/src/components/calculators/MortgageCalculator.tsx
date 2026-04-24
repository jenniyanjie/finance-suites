"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Home, BarChart3 } from "lucide-react";
import { calculateMortgage } from "@finance-suites/shared";
import type { MortgageResult } from "@finance-suites/shared";

const formSchema = z.object({
  L: z.number().min(0.01, "贷款额必须大于0"),
  r: z.number().min(0.01, "年利率必须大于0").max(100, "年利率不能超过100%"),
  n: z.number().min(1, "年限至少1年").max(50, "年限不超过50年"),
  method: z.enum(["annuity", "equal_principal"]),
});

type FormData = z.infer<typeof formSchema>;

const fmt = (v: number) =>
  v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function MortgageCalculator() {
  const [result, setResult] = useState<MortgageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const { register, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { L: 1000000, r: 4.2, n: 30, method: "annuity" },
  });

  const L = watch("L");
  const r = watch("r");
  const n = watch("n");
  const method = watch("method");

  useEffect(() => {
    if (!L || !r || !n || !method) return;
    const res = calculateMortgage({ L, r, n, method });
    if (res.success && res.data) {
      setResult(res.data);
      setError(null);
    } else {
      setError(res.error?.message || "计算错误");
      setResult(null);
    }
  }, [L, r, n, method]);

  const scheduleToShow = showFullSchedule
    ? result?.amortizationSchedule ?? []
    : result?.amortizationSchedule.slice(0, 12) ?? [];

  const isAnnuity = method === "annuity";

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 输入表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              贷款参数
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>贷款金额 (元)</Label>
              <Input
                type="number"
                step="10000"
                {...register("L", { valueAsNumber: true })}
                className={errors.L ? "border-red-500" : ""}
              />
              {errors.L && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.L.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>年利率 (%)</Label>
              <Input
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
              <Label>贷款年限</Label>
              <Input
                type="number"
                step="1"
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
              <Label>还款方式</Label>
              <Select
                defaultValue="annuity"
                onValueChange={(v) => setValue("method", v as "annuity" | "equal_principal")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annuity">等额本息（每月固定还款）</SelectItem>
                  <SelectItem value="equal_principal">等额本金（首月最高，逐月递减）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {result && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p>
                  {isAnnuity
                    ? `每月固定还款：¥${fmt(result.monthlyPayment)}`
                    : `首月还款：¥${fmt(result.monthlyPayment)}（逐月递减）`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 汇总结果 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              还款概览
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
                    <div className="text-green-800 text-sm font-medium">
                      {isAnnuity ? "月供" : "首月还款"}
                    </div>
                    <div className="text-green-900 text-2xl font-bold">
                      ¥{fmt(result.monthlyPayment)}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-800 text-sm font-medium">总还款额</div>
                    <div className="text-blue-900 text-2xl font-bold">
                      ¥{fmt(result.totalPayment)}
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800 text-sm font-medium">总利息支出</div>
                    <div className="text-red-900 text-2xl font-bold">
                      ¥{fmt(result.totalInterest)}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-amber-800 text-sm font-medium">利息占比</div>
                    <div className="text-amber-900 text-2xl font-bold">
                      {L ? ((result.totalInterest / result.totalPayment) * 100).toFixed(1) : "–"}%
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-600 space-y-1">
                  <div>贷款金额：¥{fmt(L)}</div>
                  <div>年利率：{r}%（月利率 {(r / 12).toFixed(4)}%）</div>
                  <div>还款期数：{Math.round(n * 12)} 个月</div>
                  <div>还款方式：{isAnnuity ? "等额本息" : "等额本金"}</div>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="text-center text-gray-500 py-8">
                <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>请输入贷款参数进行计算</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 摊还明细表 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>还款明细表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">期数</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">月供</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">本金</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">利息</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">剩余本金</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleToShow.map((row) => (
                    <tr
                      key={row.month}
                      className="border-b border-dashed hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2 px-3 text-gray-600">第 {row.month} 期</td>
                      <td className="py-2 px-3 text-right font-medium">¥{fmt(row.payment)}</td>
                      <td className="py-2 px-3 text-right text-green-700">¥{fmt(row.principal)}</td>
                      <td className="py-2 px-3 text-right text-red-600">¥{fmt(row.interest)}</td>
                      <td className="py-2 px-3 text-right text-gray-600">¥{fmt(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.amortizationSchedule.length > 12 && (
              <button
                onClick={() => setShowFullSchedule(!showFullSchedule)}
                className="mt-4 w-full text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {showFullSchedule
                  ? "收起"
                  : `展开全部 ${result.amortizationSchedule.length} 期明细`}
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
