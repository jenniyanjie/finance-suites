"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, DollarSign, PieChart, Home as HomeIcon } from "lucide-react";
import CompoundInterestCalculator from "@/components/calculators/CompoundInterestCalculator";
import CAGRCalculator from "@/components/calculators/CAGRCalculator";
import RealEstateCalculator from "@/components/calculators/RealEstateCalculator";

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
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="compound" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                复利计算
              </TabsTrigger>
              <TabsTrigger value="cagr" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                年化收益
              </TabsTrigger>
              <TabsTrigger value="realestate" className="flex items-center gap-2">
                <HomeIcon className="h-4 w-4" />
                房地产投资
              </TabsTrigger>
              <TabsTrigger value="position" className="flex items-center gap-2" disabled>
                <PieChart className="h-4 w-4" />
                仓位管理
                <span className="text-xs text-gray-500">(即将上线)</span>
              </TabsTrigger>
              <TabsTrigger value="valuation" className="flex items-center gap-2" disabled>
                <Calculator className="h-4 w-4" />
                估值工具
                <span className="text-xs text-gray-500">(即将上线)</span>
              </TabsTrigger>
            </TabsList>

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

            <TabsContent value="position" className="space-y-6">
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">仓位管理计算器</h3>
                    <p className="text-gray-500">即将上线，敬请期待</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="valuation" className="space-y-6">
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">估值工具</h3>
                    <p className="text-gray-500">PE估值和DCF模型即将上线</p>
                  </div>
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