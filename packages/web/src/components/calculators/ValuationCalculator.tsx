"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Calculator, TrendingUp } from "lucide-react";
import { calculatePEValuation, calculateDCF } from "@finance-suites/shared";
import type { PEResult, DCFResult } from "@finance-suites/shared";

// ── PE 表单 ──────────────────────────────────────────────────────────────────

const peSchema = z.object({
  EPS: z.number().min(0.01, "EPS必须大于0"),
  pePessimistic: z.number().min(0.01, "悲观PE必须大于0"),
  peNeutral: z.number().min(0.01, "中性PE必须大于0"),
  peOptimistic: z.number().min(0.01, "乐观PE必须大于0"),
  safetyMargin: z.number().min(0, "安全边际不能为负").max(99, "安全边际不能超过99%"),
});

type PEFormData = z.infer<typeof peSchema>;

// ── DCF 表单 ─────────────────────────────────────────────────────────────────

const dcfSchema = z.object({
  FCF0: z.number().min(0.01, "FCF0必须大于0"),
  g: z.number().min(-50, "增长率不能低于-50%").max(200, "增长率不能超过200%"),
  r: z.number().min(0.01, "折现率必须大于0").max(99, "折现率不能超过99%"),
  n: z.number().min(1, "预测年限至少1年").max(30, "预测年限不超过30年"),
  terminalType: z.enum(["gordon", "multiple"]),
  terminalValue: z.number(),
});

type DCFFormData = z.infer<typeof dcfSchema>;

const fmt2 = (v: number) =>
  v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Component ────────────────────────────────────────────────────────────────

export default function ValuationCalculator() {
  const [peResult, setPEResult] = useState<PEResult | null>(null);
  const [dcfResult, setDCFResult] = useState<DCFResult | null>(null);
  const [peError, setPEError] = useState<string | null>(null);
  const [dcfError, setDCFError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pe" | "dcf">("pe");

  // ── PE form ────────────────────────────────────────────────────────────────

  const peForm = useForm<PEFormData>({
    resolver: zodResolver(peSchema),
    defaultValues: { EPS: 5, pePessimistic: 10, peNeutral: 15, peOptimistic: 20, safetyMargin: 20 },
  });

  const eps = peForm.watch("EPS");
  const pePessimistic = peForm.watch("pePessimistic");
  const peNeutral = peForm.watch("peNeutral");
  const peOptimistic = peForm.watch("peOptimistic");
  const safetyMargin = peForm.watch("safetyMargin");

  useEffect(() => {
    if (activeTab !== "pe") return;
    if (!eps || !pePessimistic || !peNeutral || !peOptimistic) return;
    const res = calculatePEValuation({
      EPS: eps,
      targetPE: { pessimistic: pePessimistic, neutral: peNeutral, optimistic: peOptimistic },
      safetyMargin: safetyMargin ?? 0,
    });
    if (res.success && res.data) {
      setPEResult(res.data);
      setPEError(null);
    } else {
      setPEError(res.error?.message || "计算错误");
      setPEResult(null);
    }
  }, [eps, pePessimistic, peNeutral, peOptimistic, safetyMargin, activeTab]);

  // ── DCF form ───────────────────────────────────────────────────────────────

  const dcfForm = useForm<DCFFormData>({
    resolver: zodResolver(dcfSchema),
    defaultValues: { FCF0: 100, g: 10, r: 12, n: 5, terminalType: "gordon", terminalValue: 3 },
  });

  const fcf0 = dcfForm.watch("FCF0");
  const g = dcfForm.watch("g");
  const rDCF = dcfForm.watch("r");
  const nDCF = dcfForm.watch("n");
  const terminalType = dcfForm.watch("terminalType");
  const terminalValue = dcfForm.watch("terminalValue");

  useEffect(() => {
    if (activeTab !== "dcf") return;
    if (!fcf0 || rDCF === undefined || nDCF === undefined) return;
    const res = calculateDCF({
      FCF0: fcf0,
      g: g ?? 0,
      r: rDCF,
      n: nDCF,
      terminalValue: { type: terminalType, value: terminalValue ?? 0 },
    });
    if (res.success && res.data) {
      setDCFResult(res.data);
      setDCFError(null);
    } else {
      setDCFError(res.error?.message || "计算错误");
      setDCFResult(null);
    }
  }, [fcf0, g, rDCF, nDCF, terminalType, terminalValue, activeTab]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pe">PE估值</TabsTrigger>
          <TabsTrigger value="dcf">DCF折现现金流</TabsTrigger>
        </TabsList>

        {/* ──────── PE Tab ──────── */}
        <TabsContent value="pe">
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  PE估值参数
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>每股收益 EPS (元)</Label>
                  <Input type="number" step="0.01" {...peForm.register("EPS", { valueAsNumber: true })} />
                  {peForm.formState.errors.EPS && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />{peForm.formState.errors.EPS.message}
                    </p>
                  )}
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm text-gray-500 mb-3">目标PE倍数区间</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">悲观</Label>
                      <Input type="number" step="0.5" {...peForm.register("pePessimistic", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">中性</Label>
                      <Input type="number" step="0.5" {...peForm.register("peNeutral", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">乐观</Label>
                      <Input type="number" step="0.5" {...peForm.register("peOptimistic", { valueAsNumber: true })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>安全边际 (%)</Label>
                  <Input type="number" step="1" {...peForm.register("safetyMargin", { valueAsNumber: true })} />
                  <p className="text-xs text-gray-500">在中性目标价基础上打折作为建议买入价</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>估值结果</CardTitle>
              </CardHeader>
              <CardContent>
                {peError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">计算错误</span>
                    </div>
                    <p className="text-red-700 mt-1">{peError}</p>
                  </div>
                )}

                {peResult && !peError && (
                  <div className="space-y-4">
                    {/* 目标价区间 */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">目标价区间</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                          <p className="text-xs text-red-600 mb-1">悲观</p>
                          <p className="text-red-900 font-bold">¥{fmt2(peResult.targetPriceRange.pessimistic)}</p>
                          <p className="text-xs text-red-500">PE {pePessimistic}x</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <p className="text-xs text-blue-600 mb-1">中性</p>
                          <p className="text-blue-900 font-bold">¥{fmt2(peResult.targetPriceRange.neutral)}</p>
                          <p className="text-xs text-blue-500">PE {peNeutral}x</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <p className="text-xs text-green-600 mb-1">乐观</p>
                          <p className="text-green-900 font-bold">¥{fmt2(peResult.targetPriceRange.optimistic)}</p>
                          <p className="text-xs text-green-500">PE {peOptimistic}x</p>
                        </div>
                      </div>
                    </div>

                    {/* 建议买入价 */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                      <p className="text-amber-800 text-sm font-medium">建议买入价（含{safetyMargin}%安全边际）</p>
                      <p className="text-amber-900 text-3xl font-bold mt-1">¥{fmt2(peResult.suggestedBuyPrice)}</p>
                      <p className="text-amber-600 text-xs mt-1">
                        = 中性目标价 ¥{fmt2(peResult.targetPriceRange.neutral)} × {100 - safetyMargin}%
                      </p>
                    </div>

                    <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-600 space-y-1">
                      <div>EPS：¥{eps}</div>
                      <div>PE区间：{pePessimistic}x — {peNeutral}x — {peOptimistic}x</div>
                      <div>安全边际：{safetyMargin}%</div>
                    </div>
                  </div>
                )}

                {!peResult && !peError && (
                  <div className="text-center text-gray-500 py-8">
                    <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>请输入参数进行估值</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ──────── DCF Tab ──────── */}
        <TabsContent value="dcf">
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  DCF参数
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>当年自由现金流 FCF₀ (元/百万元等任意单位)</Label>
                  <Input type="number" step="1" {...dcfForm.register("FCF0", { valueAsNumber: true })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>预测期增长率 g (%)</Label>
                    <Input type="number" step="0.5" {...dcfForm.register("g", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label>折现率 r (%)</Label>
                    <Input type="number" step="0.5" {...dcfForm.register("r", { valueAsNumber: true })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>预测年限 n (年)</Label>
                  <Input type="number" step="1" {...dcfForm.register("n", { valueAsNumber: true })} />
                </div>

                <div className="border-t pt-3 space-y-3">
                  <p className="text-sm text-gray-500">终值计算方式</p>
                  <Select
                    defaultValue="gordon"
                    onValueChange={(v) => {
                      dcfForm.setValue("terminalType", v as "gordon" | "multiple");
                      dcfForm.setValue("terminalValue", v === "gordon" ? 3 : 15);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gordon">戈登增长模型（永续增长率）</SelectItem>
                      <SelectItem value="multiple">退出倍数</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="space-y-1">
                    <Label className="text-sm">
                      {terminalType === "gordon" ? "永续增长率 (%)" : "退出倍数 (x)"}
                    </Label>
                    <Input
                      type="number"
                      step={terminalType === "gordon" ? "0.1" : "0.5"}
                      {...dcfForm.register("terminalValue", { valueAsNumber: true })}
                    />
                    {terminalType === "gordon" && (
                      <p className="text-xs text-gray-500">必须小于折现率 r</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DCF估值结果</CardTitle>
              </CardHeader>
              <CardContent>
                {dcfError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">计算错误</span>
                    </div>
                    <p className="text-red-700 mt-1">{dcfError}</p>
                  </div>
                )}

                {dcfResult && !dcfError && (
                  <div className="space-y-4">
                    {/* 内在价值 */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
                      <p className="text-green-800 text-sm font-medium">DCF内在价值</p>
                      <p className="text-green-900 text-3xl font-bold mt-1">
                        {fmt2(dcfResult.valuation)}
                      </p>
                      <p className="text-green-600 text-xs mt-1">（与FCF₀同单位）</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-700 text-xs">终值 (未折现)</p>
                        <p className="text-blue-900 font-bold">{fmt2(dcfResult.terminalValue)}</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-purple-700 text-xs">终值占比</p>
                        <p className="text-purple-900 font-bold">
                          {dcfResult.valuation > 0
                            ? ((dcfResult.terminalValue /
                                Math.pow(1 + rDCF / 100, nDCF) /
                                dcfResult.valuation) *
                                100
                              ).toFixed(1)
                            : "–"}%
                        </p>
                      </div>
                    </div>

                    {/* 现金流明细 */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-2 px-2 text-gray-600">年份</th>
                            <th className="text-right py-2 px-2 text-gray-600">FCF</th>
                            <th className="text-right py-2 px-2 text-gray-600">现值 (PV)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dcfResult.cashFlowDetails.map((row) => (
                            <tr key={row.year} className="border-b border-dashed">
                              <td className="py-1.5 px-2 text-gray-500">第 {row.year} 年</td>
                              <td className="py-1.5 px-2 text-right">{fmt2(row.cashFlow)}</td>
                              <td className="py-1.5 px-2 text-right text-blue-700">{fmt2(row.presentValue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!dcfResult && !dcfError && (
                  <div className="text-center text-gray-500 py-8">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>请输入DCF参数进行估值</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
