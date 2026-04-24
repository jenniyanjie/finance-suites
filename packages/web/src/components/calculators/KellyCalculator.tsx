"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, AlertTriangle, PieChart, TrendingUp, ShieldCheck } from "lucide-react";
import { calculateKellyPosition, calculateExpectancy } from "@finance-suites/shared";
import type { PositionResult } from "@finance-suites/shared";
import { useCalculationHistory } from "@/lib/useCalculationHistory";
import HistoryPanel from "@/components/ui/HistoryPanel";

// ─── Zod schema ─────────────────────────────────────────────────────────────

const kellySchema = z.object({
  p: z
    .number()
    .min(0.01, "胜率必须大于0%")
    .max(0.99, "胜率必须小于100%"),
  b: z.number().min(0.01, "盈利倍数必须大于0"),
  riskAmount: z.number().min(0.01, "每笔风险金额必须大于0"),
  maxDrawdown: z.number().min(1, "最大回撤上限最小1%").max(100, "最大回撤上限最大100%").optional(),
});

type KellyFormData = z.infer<typeof kellySchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Render a coloured position bar (0–100%) */
function PositionBar({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = Math.min(value * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{(value * 100).toFixed(2)}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function KellyCalculator() {
  const [positionResult, setPositionResult] = useState<PositionResult | null>(null);
  const [expectancyPerTrade, setExpectancyPerTrade] = useState<number | null>(null);
  const [expectancyRatio, setExpectancyRatio] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { history, addRecord, removeRecord, clearHistory } = useCalculationHistory<PositionResult>('kelly');

  const form = useForm<KellyFormData>({
    resolver: zodResolver(kellySchema),
    defaultValues: {
      p: 0.5,
      b: 2,
      riskAmount: 1000,
      maxDrawdown: 20,
    },
  });

  const p = form.watch("p");
  const b = form.watch("b");
  const riskAmount = form.watch("riskAmount");
  const maxDrawdown = form.watch("maxDrawdown");

  useEffect(() => {
    if (!p || !b || !riskAmount) return;

    // Kelly position
    const kellyRes = calculateKellyPosition({ p, b, maxDrawdown });
    if (kellyRes.success && kellyRes.data) {
      setPositionResult(kellyRes.data);
      setError(null);
    } else {
      setPositionResult(null);
      setError(kellyRes.error?.message || "计算错误");
    }

    // Expectancy
    const expRes = calculateExpectancy(p, b, riskAmount);
    if (expRes.success && expRes.data) {
      setExpectancyPerTrade(expRes.data.expectancyPerTrade);
      setExpectancyRatio(expRes.data.expectancyRatio);
    } else {
      setExpectancyPerTrade(null);
      setExpectancyRatio(null);
    }
  }, [p, b, riskAmount, maxDrawdown]);

  // 防抖保存历史
  useEffect(() => {
    if (!positionResult) return;
    const timer = setTimeout(() => {
      addRecord({
        inputSummary: `胜率${p ? (p * 100).toFixed(0) : "–"}%，盈亏比${b}，风险¥${riskAmount}`,
        resultSummary: `全Kelly ${(positionResult.kellyPosition * 100).toFixed(2)}%，半Kelly ${(positionResult.kellyPosition / 2 * 100).toFixed(2)}%`,
        inputs: { p, b, riskAmount, maxDrawdown },
        result: positionResult,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [p, b, riskAmount, maxDrawdown, positionResult]);

  const handleSelectHistory = (record: import("@/lib/useCalculationHistory").HistoryRecord<PositionResult>) => {
    const i = record.inputs as { p: number; b: number; riskAmount: number; maxDrawdown?: number };
    form.setValue("p", i.p);
    form.setValue("b", i.b);
    form.setValue("riskAmount", i.riskAmount);
    if (i.maxDrawdown !== undefined) form.setValue("maxDrawdown", i.maxDrawdown);
  };

  // Derived display values
  const halfKelly = positionResult ? positionResult.kellyPosition / 2 : null;
  const quarterKelly = positionResult ? positionResult.kellyPosition / 4 : null;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Inputs ───────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              交易系统参数
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Win rate */}
            <div className="space-y-2">
              <Label htmlFor="p">胜率（0.01 – 0.99）</Label>
              <div className="relative">
                <Input
                  id="p"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.99"
                  {...form.register("p", { valueAsNumber: true })}
                  className={form.formState.errors.p ? "border-red-500" : ""}
                />
                <span className="absolute right-3 top-2.5 text-sm text-gray-400">
                  = {p ? (p * 100).toFixed(0) : "–"}%
                </span>
              </div>
              {form.formState.errors.p && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {form.formState.errors.p.message}
                </p>
              )}
            </div>

            {/* Profit multiple */}
            <div className="space-y-2">
              <Label htmlFor="b">盈亏比（平均盈利 / 平均亏损）</Label>
              <Input
                id="b"
                type="number"
                step="0.1"
                min="0.01"
                {...form.register("b", { valueAsNumber: true })}
                className={form.formState.errors.b ? "border-red-500" : ""}
              />
              {form.formState.errors.b && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {form.formState.errors.b.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                例：每次盈利 2000元、亏损 1000元，盈亏比 = 2
              </p>
            </div>

            {/* Risk amount */}
            <div className="space-y-2">
              <Label htmlFor="riskAmount">每笔风险金额（元）</Label>
              <Input
                id="riskAmount"
                type="number"
                step="100"
                min="0.01"
                {...form.register("riskAmount", { valueAsNumber: true })}
                className={form.formState.errors.riskAmount ? "border-red-500" : ""}
              />
              {form.formState.errors.riskAmount && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {form.formState.errors.riskAmount.message}
                </p>
              )}
            </div>

            {/* Max drawdown */}
            <div className="space-y-2">
              <Label htmlFor="maxDrawdown">可接受最大回撤（%，可选）</Label>
              <Input
                id="maxDrawdown"
                type="number"
                step="1"
                min="1"
                max="100"
                placeholder="如：20"
                {...form.register("maxDrawdown", { valueAsNumber: true })}
                className={form.formState.errors.maxDrawdown ? "border-red-500" : ""}
              />
              {form.formState.errors.maxDrawdown && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {form.formState.errors.maxDrawdown.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                填写后将给出控制回撤的建议仓位区间
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              仓位建议
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">无法计算</span>
                </div>
                <p className="text-red-700 mt-1 text-sm">{error}</p>
              </div>
            )}

            {/* High-risk warning */}
            {positionResult?.isHighRisk && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">高风险警告</p>
                  <p className="text-amber-700 text-sm mt-1">
                    Kelly仓位超过25%，实战中强烈建议使用半Kelly或更保守的仓位，以避免大幅回撤。
                  </p>
                </div>
              </div>
            )}

            {/* Kelly position bars */}
            {positionResult && !error && (
              <div className="space-y-4">
                <PositionBar
                  value={positionResult.kellyPosition}
                  label="全Kelly仓位"
                  color={positionResult.isHighRisk ? "bg-red-500" : "bg-purple-500"}
                />
                {halfKelly !== null && (
                  <PositionBar value={halfKelly} label="半Kelly（推荐）" color="bg-blue-500" />
                )}
                {quarterKelly !== null && (
                  <PositionBar value={quarterKelly} label="四分之一Kelly（保守）" color="bg-green-500" />
                )}

                {/* Suggested range from drawdown */}
                {positionResult.suggestedRange && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-1">
                    <div className="flex items-center gap-2 text-purple-800 font-medium">
                      <ShieldCheck className="h-4 w-4" />
                      基于最大回撤的建议区间
                    </div>
                    <p className="text-purple-700 text-sm">
                      {(positionResult.suggestedRange.min * 100).toFixed(2)}%
                      {" – "}
                      {(positionResult.suggestedRange.max * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Expectancy section */}
            {expectancyRatio !== null && expectancyPerTrade !== null && !error && (
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-gray-900 text-sm">系统期望值</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`rounded-lg p-4 border ${
                      expectancyRatio >= 0
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">期望值比率</div>
                    <div
                      className={`text-xl font-bold ${
                        expectancyRatio >= 0 ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {expectancyRatio >= 0 ? "+" : ""}
                      {expectancyRatio.toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">每单位风险</div>
                  </div>

                  <div
                    className={`rounded-lg p-4 border ${
                      expectancyPerTrade >= 0
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">每笔期望收益</div>
                    <div
                      className={`text-xl font-bold ${
                        expectancyPerTrade >= 0 ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {expectancyPerTrade >= 0 ? "+" : ""}¥
                      {expectancyPerTrade.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">按每笔风险 ¥{riskAmount?.toLocaleString("zh-CN")}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Parameter summary */}
            {positionResult && !error && (
              <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-600 space-y-1">
                <div className="font-medium text-gray-800 mb-2">当前参数</div>
                <div>胜率：{p ? (p * 100).toFixed(0) : "–"}%</div>
                <div>盈亏比：{b} : 1</div>
                <div>败率：{p ? ((1 - p) * 100).toFixed(0) : "–"}%</div>
                <div>每笔风险：¥{riskAmount?.toLocaleString("zh-CN")}</div>
              </div>
            )}

            {/* Empty state */}
            {!positionResult && !error && (
              <div className="text-center text-gray-400 py-12">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                <p>请输入参数进行计算</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Formula explanation ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Kelly准则说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>
            <span className="font-mono bg-gray-100 px-1 rounded">f* = (b·p − q) / b</span>
            {" "}— 其中 p 为胜率，q = 1−p 为败率，b 为盈亏比。
          </p>
          <p>
            <strong>全Kelly</strong> 理论上最大化长期复利增长，但波动极大，回撤可能超过50%。
          </p>
          <p>
            <strong>半Kelly</strong> 是实战中最常用的折中方案，长期收益约为全Kelly的75%，但回撤大幅降低。
          </p>
          <p className="text-amber-700">
            ⚠ Kelly仓位大于25%时属于高风险配置，适合风险承受能力强的专业交易者。
          </p>
        </CardContent>
      </Card>

      {/* 计算历史 */}
      <HistoryPanel
        history={history}
        onClear={clearHistory}
        onRemove={removeRecord}
        onSelect={handleSelectHistory}
        title="Kelly 计算历史"
      />
    </div>
  );
}
