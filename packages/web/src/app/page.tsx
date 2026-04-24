"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, DollarSign, PieChart, Home as HomeIcon, Activity, Building2, Layers, RefreshCw } from "lucide-react";
import CompoundInterestCalculator from "@/components/calculators/CompoundInterestCalculator";
import CAGRCalculator from "@/components/calculators/CAGRCalculator";
import RealEstateCalculator from "@/components/calculators/RealEstateCalculator";
import TradingCostCalculator from "@/components/calculators/TradingCostCalculator";
import KellyCalculator from "@/components/calculators/KellyCalculator";
import MortgageCalculator from "@/components/calculators/MortgageCalculator";
import ValuationCalculator from "@/components/calculators/ValuationCalculator";
import OptionsCalculator from "@/components/calculators/OptionsCalculator";
import DCACalculator from "@/components/calculators/DCACalculator";

export default function Home() {
  const [activeTab, setActiveTab] = useState("compound");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            金融计算器集合
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            专业的投资理财计算工具 - 快速、准确、易用
          </p>
        </div>

        {/* Main Calculator Tabs */}
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="space-y-1 mb-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="compound" className="flex items-center gap-1 text-xs">
                  <DollarSign className="h-3.5 w-3.5" />
                  复利
                </TabsTrigger>
                <TabsTrigger value="cagr" className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3.5 w-3.5" />
                  年化收益
                </TabsTrigger>
                <TabsTrigger value="realestate" className="flex items-center gap-1 text-xs">
                  <HomeIcon className="h-3.5 w-3.5" />
                  房产投资
                </TabsTrigger>
                <TabsTrigger value="mortgage" className="flex items-center gap-1 text-xs">
                  <Building2 className="h-3.5 w-3.5" />
                  房贷
                </TabsTrigger>
                <TabsTrigger value="trading" className="flex items-center gap-1 text-xs">
                  <Activity className="h-3.5 w-3.5" />
                  港股交易
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="position" className="flex items-center gap-1 text-xs">
                  <PieChart className="h-3.5 w-3.5" />
                  仓位管理
                </TabsTrigger>
                <TabsTrigger value="valuation" className="flex items-center gap-1 text-xs">
                  <Calculator className="h-3.5 w-3.5" />
                  估值工具
                </TabsTrigger>
                <TabsTrigger value="options" className="flex items-center gap-1 text-xs">
                  <Layers className="h-3.5 w-3.5" />
                  期权损益
                </TabsTrigger>
                <TabsTrigger value="dca" className="flex items-center gap-1 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" />
                  定投模拟
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="compound" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    复利计算器
                  </CardTitle>
                  <CardDescription>
                    计算单利和复利的终值、本金、收益率等，支持正向和反向计算
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CompoundInterestCalculator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cagr" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    年化收益率计算器 (CAGR)
                  </CardTitle>
                  <CardDescription>
                    根据买入价、卖出价和持有时间计算总收益率和年化收益率
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CAGRCalculator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="realestate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HomeIcon className="h-5 w-5 text-orange-600" />
                    房地产投资收益计算器
                  </CardTitle>
                  <CardDescription>
                    计算杠杆买房的投资回报率，包含租金收益和房价升值，支持目标收益分析和杠杆对比
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RealEstateCalculator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trading" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-600" />
                    IBKR 港股交易费用计算器
                  </CardTitle>
                  <CardDescription>
                    计算港股交易的买卖费用，包含佣金、印花税、清算费等各项费用，精确计算净收益和投资回报率
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TradingCostCalculator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mortgage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-teal-600" />
                    房贷计算器
                  </CardTitle>
                  <CardDescription>
                    等额本息与等额本金两种还款方式对比，完整摊还明细，利息总额一目了然
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MortgageCalculator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="position" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    仓位管理计算器（Kelly准则）
                  </CardTitle>
                  <CardDescription>
                    根据胜率和盈亏比，使用Kelly准则计算最优仓位比例，评估交易系统期望值
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <KellyCalculator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="valuation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-indigo-600" />
                    估值工具
                  </CardTitle>
                  <CardDescription>
                    PE区间估值 + DCF两阶段折现现金流模型，计算内在价值与安全边际买入价
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ValuationCalculator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="options" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-rose-600" />
                    期权损益计算器
                  </CardTitle>
                  <CardDescription>
                    计算 Long/Short Call/Put 四个方向的到期盈亏与损益平衡价，含可视化盈亏剖面图
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OptionsCalculator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dca" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-cyan-600" />
                    定投模拟器（DCA）
                  </CardTitle>
                  <CardDescription>
                    模拟固定金额定期投入，对比定投 vs 一次性投入收益，含每期明细与资产增长图
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DCACalculator />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            © 2025 金融计算器集合 - 为投资者提供专业的计算工具
          </p>
        </footer>
      </div>
    </div>
  );
}