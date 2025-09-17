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
import { AlertCircle, Home, BarChart3, Share2, Target, TrendingUp } from "lucide-react";
import { calculateRealEstateReturn, calculateRequiredAppreciation, batchCompareRealestate } from "@finance-suites/shared";
import type { RealEstateInput, RealEstateResult } from "@finance-suites/shared";

// 表单验证模式
const realEstateSchema = z.object({
  propertyPrice: z.number().min(0.01, "房屋总价必须大于0"),
  leverageRatio: z.number().min(0, "杠杆比例不能小于0").max(0.99, "杠杆比例不能大于99%"),
  loanRate: z.number().min(0, "房贷利率不能小于0").max(50, "房贷利率不能大于50%"),
  rentYield: z.number().min(0, "租售比不能小于0").max(20, "租售比不能大于20%"),
  priceGrowth: z.number().min(-50, "房价年涨幅不能小于-50%").max(100, "房价年涨幅不能大于100%")
});

const targetROESchema = z.object({
  propertyPrice: z.number().min(0.01, "房屋总价必须大于0"),
  leverageRatio: z.number().min(0, "杠杆比例不能小于0").max(0.99, "杠杆比例不能大于99%"),
  loanRate: z.number().min(0, "房贷利率不能小于0").max(50, "房贷利率不能大于50%"),
  rentYield: z.number().min(0, "租售比不能小于0").max(20, "租售比不能大于20%"),
  targetROE: z.number().min(-100, "目标ROE不能小于-100%").max(1000, "目标ROE不能大于1000%")
});

type RealEstateFormData = z.infer<typeof realEstateSchema>;
type TargetROEFormData = z.infer<typeof targetROESchema>;

export default function RealEstateCalculator() {
  const [result, setResult] = useState<RealEstateResult | null>(null);
  const [requiredGrowth, setRequiredGrowth] = useState<number | null>(null);
  const [compareResults, setCompareResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculationMode, setCalculationMode] = useState<"basic" | "target" | "compare">("basic");

  const basicForm = useForm<RealEstateFormData>({
    resolver: zodResolver(realEstateSchema),
    defaultValues: {
      propertyPrice: 600,
      leverageRatio: 0.6667,
      loanRate: 2,
      rentYield: 3,
      priceGrowth: 3
    }
  });

  const targetForm = useForm<TargetROEFormData>({
    resolver: zodResolver(targetROESchema),
    defaultValues: {
      propertyPrice: 600,
      leverageRatio: 0.6667,
      loanRate: 2,
      rentYield: 3,
      targetROE: 15
    }
  });

  // 基础计算表单监听
  const basicPropertyPrice = basicForm.watch("propertyPrice");
  const basicLeverageRatio = basicForm.watch("leverageRatio");
  const basicLoanRate = basicForm.watch("loanRate");
  const basicRentYield = basicForm.watch("rentYield");
  const basicPriceGrowth = basicForm.watch("priceGrowth");

  // 目标ROE表单监听
  const targetPropertyPrice = targetForm.watch("propertyPrice");
  const targetLeverageRatio = targetForm.watch("leverageRatio");
  const targetLoanRate = targetForm.watch("loanRate");
  const targetRentYield = targetForm.watch("rentYield");
  const targetROE = targetForm.watch("targetROE");

  // 实时计算基础收益
  useEffect(() => {
    if (calculationMode === "basic" && basicPropertyPrice && basicLeverageRatio !== undefined && 
        basicLoanRate !== undefined && basicRentYield !== undefined && basicPriceGrowth !== undefined) {
      const calcResult = calculateRealEstateReturn({
        propertyPrice: basicPropertyPrice,
        leverageRatio: basicLeverageRatio,
        loanRate: basicLoanRate,
        rentYield: basicRentYield,
        priceGrowth: basicPriceGrowth
      });
      
      if (calcResult.success && calcResult.data) {
        setResult(calcResult.data);
        setError(null);
      } else {
        setError(calcResult.error?.message || "计算错误");
        setResult(null);
      }
    }
  }, [basicPropertyPrice, basicLeverageRatio, basicLoanRate, basicRentYield, basicPriceGrowth, calculationMode]);

  // 实时计算所需房价涨幅
  useEffect(() => {
    if (calculationMode === "target" && targetPropertyPrice && targetLeverageRatio !== undefined && 
        targetLoanRate !== undefined && targetRentYield !== undefined && targetROE !== undefined) {
      const calcResult = calculateRequiredAppreciation(
        targetPropertyPrice, targetLeverageRatio, targetLoanRate, targetRentYield, targetROE
      );
      
      if (calcResult.success && calcResult.data) {
        setRequiredGrowth(calcResult.data.requiredPriceGrowth);
        setError(null);
      } else {
        setError(calcResult.error?.message || "计算错误");
        setRequiredGrowth(null);
      }
    }
  }, [targetPropertyPrice, targetLeverageRatio, targetLoanRate, targetRentYield, targetROE, calculationMode]);

  // 杠杆比例对比
  const handleCompare = () => {
    const baseInput = {
      propertyPrice: basicPropertyPrice,
      loanRate: basicLoanRate,
      rentYield: basicRentYield,
      priceGrowth: basicPriceGrowth
    };
    const leverageRatios = [0, 0.3, 0.5, 0.7, 0.8];

    const calcResult = batchCompareRealestate(baseInput, leverageRatios);
    
    if (calcResult.success && calcResult.data) {
      setCompareResults(calcResult.data);
      setError(null);
    } else {
      setError(calcResult.error?.message || "对比计算错误");
      setCompareResults(null);
    }
  };

  const shareResults = () => {
    if (result) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "realestate");
      url.searchParams.set("price", basicPropertyPrice.toString());
      url.searchParams.set("leverage", basicLeverageRatio.toString());
      url.searchParams.set("rate", basicLoanRate.toString());
      url.searchParams.set("yield", basicRentYield.toString());
      url.searchParams.set("growth", basicPriceGrowth.toString());
      
      navigator.clipboard.writeText(url.toString());
      alert("链接已复制到剪贴板！");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={calculationMode} onValueChange={(value: any) => setCalculationMode(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">基础计算</TabsTrigger>
          <TabsTrigger value="target">目标收益</TabsTrigger>
          <TabsTrigger value="compare">杠杆对比</TabsTrigger>
        </TabsList>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <TabsContent value="basic" className="col-span-2">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 基础计算输入 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    房地产投资参数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="propertyPrice">房屋总价 (万元)</Label>
                      <Input
                        id="propertyPrice"
                        type="number"
                        step="0.01"
                        {...basicForm.register("propertyPrice", { valueAsNumber: true })}
                        className={basicForm.formState.errors.propertyPrice ? "border-red-500" : ""}
                      />
                      {basicForm.formState.errors.propertyPrice && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {basicForm.formState.errors.propertyPrice.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leverageRatio">杠杆比例 (0-0.99)</Label>
                      <Input
                        id="leverageRatio"
                        type="number"
                        step="0.01"
                        {...basicForm.register("leverageRatio", { valueAsNumber: true })}
                        className={basicForm.formState.errors.leverageRatio ? "border-red-500" : ""}
                      />
                      <p className="text-xs text-gray-500">例如：0.67 = 67%杠杆，30%首付</p>
                      {basicForm.formState.errors.leverageRatio && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {basicForm.formState.errors.leverageRatio.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loanRate">房贷利率 (%)</Label>
                      <Input
                        id="loanRate"
                        type="number"
                        step="0.1"
                        {...basicForm.register("loanRate", { valueAsNumber: true })}
                        className={basicForm.formState.errors.loanRate ? "border-red-500" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rentYield">租售比 (%)</Label>
                      <Input
                        id="rentYield"
                        type="number"
                        step="0.1"
                        {...basicForm.register("rentYield", { valueAsNumber: true })}
                        className={basicForm.formState.errors.rentYield ? "border-red-500" : ""}
                      />
                      <p className="text-xs text-gray-500">年租金收入 / 房价 × 100%</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priceGrowth">房价年涨幅 (%)</Label>
                      <Input
                        id="priceGrowth"
                        type="number"
                        step="0.1"
                        {...basicForm.register("priceGrowth", { valueAsNumber: true })}
                        className={basicForm.formState.errors.priceGrowth ? "border-red-500" : ""}
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* 基础计算结果 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    投资收益分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {error && calculationMode === "basic" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">计算错误</span>
                      </div>
                      <p className="text-red-700 mt-1">{error}</p>
                    </div>
                  )}

                  {result && !error && calculationMode === "basic" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="text-blue-800 text-sm font-medium">年总收益</div>
                          <div className="text-blue-900 text-2xl font-bold">
                            {result.totalProfit.toFixed(2)}万
                          </div>
                        </div>
                        
                        <div className={`border rounded-lg p-4 ${result.roe >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className={`text-sm font-medium ${result.roe >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                            年回报率 (ROE)
                          </div>
                          <div className={`text-2xl font-bold ${result.roe >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                            {result.roe >= 0 ? "+" : ""}{result.roe.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">收益构成详情</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">自有资金</div>
                            <div className="font-medium">{result.equity.toFixed(2)}万</div>
                          </div>
                          <div>
                            <div className="text-gray-600">贷款金额</div>
                            <div className="font-medium">{result.loan.toFixed(2)}万</div>
                          </div>
                          <div>
                            <div className="text-gray-600">年租金收入</div>
                            <div className="font-medium text-green-600">+{result.rent.toFixed(2)}万</div>
                          </div>
                          <div>
                            <div className="text-gray-600">年利息支出</div>
                            <div className="font-medium text-red-600">-{result.interest.toFixed(2)}万</div>
                          </div>
                          <div>
                            <div className="text-gray-600">净租金收益</div>
                            <div className={`font-medium ${result.netRent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.netRent >= 0 ? "+" : ""}{result.netRent.toFixed(2)}万
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">房价上涨收益</div>
                            <div className="font-medium text-blue-600">+{result.appreciation.toFixed(2)}万</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={shareResults} variant="outline" className="flex-1">
                          <Share2 className="h-4 w-4 mr-2" />
                          分享结果
                        </Button>
                        <Button onClick={handleCompare} variant="outline" className="flex-1">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          杠杆对比
                        </Button>
                      </div>
                    </div>
                  )}

                  {!result && !error && calculationMode === "basic" && (
                    <div className="text-center text-gray-500 py-8">
                      <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>请输入参数进行计算</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="target" className="col-span-2">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 目标收益输入 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    目标收益计算
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label>房屋总价 (万元)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...targetForm.register("propertyPrice", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>杠杆比例 (0-0.99)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...targetForm.register("leverageRatio", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>房贷利率 (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        {...targetForm.register("loanRate", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>租售比 (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        {...targetForm.register("rentYield", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>目标年回报率 (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        {...targetForm.register("targetROE", { valueAsNumber: true })}
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* 目标收益结果 */}
              <Card>
                <CardHeader>
                  <CardTitle>所需房价涨幅</CardTitle>
                </CardHeader>
                <CardContent>
                  {requiredGrowth !== null && !error && calculationMode === "target" && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <div className="text-green-800 text-sm font-medium">达成目标需要的年涨幅</div>
                        <div className="text-green-900 text-3xl font-bold">
                          {requiredGrowth >= 0 ? "+" : ""}{requiredGrowth.toFixed(2)}%
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">计算说明</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>目标年回报率: {targetROE}%</div>
                          <div>杠杆比例: {(targetLeverageRatio * 100).toFixed(1)}%</div>
                          <div>当前租售比: {targetRentYield}%</div>
                          {requiredGrowth < 0 && (
                            <div className="text-orange-600 font-medium">
                              ⚠️ 负涨幅意味着即使房价下跌也能达成目标收益
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compare" className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  杠杆比例对比分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                {compareResults && (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      {compareResults.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {item.leverageRatio === 0 ? "全款购房" : `${(item.leverageRatio * 100).toFixed(0)}%杠杆`}
                            </div>
                            <div className="text-sm text-gray-600">
                              首付比例: {((1 - item.leverageRatio) * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${item.roe >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.roe >= 0 ? "+" : ""}{item.roe.toFixed(2)}%
                            </div>
                            <div className="text-sm text-gray-600">
                              年收益: {item.totalProfit.toFixed(1)}万
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">💡 分析要点</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 适度杠杆可以放大收益，但也会增加风险</li>
                        <li>• 当租售比 &gt; 房贷利率时，杠杆效果更明显</li>
                        <li>• 杠杆过高时，利息成本可能吞噬大部分收益</li>
                        <li>• 建议结合个人风险承受能力选择合适杠杆</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
