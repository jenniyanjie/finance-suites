# 金融计算器集合 Finance Suites

专业的金融计算工具集合，包含Web端和微信小程序端，提供复利计算、年化收益率(CAGR)等投资理财计算功能。

## 🎯 项目特色

- **跨平台架构**: 通过共享业务逻辑，同时支持Web端和小程序端
- **计算准确**: 与Excel等专业工具保持一致的计算精度
- **响应式设计**: 完美适配桌面端和移动端
- **实时计算**: 参数变更时实时更新计算结果
- **URL分享**: 支持通过URL参数分享计算结果

## 🏗️ 项目架构

```
finance-suites/
├── packages/
│   ├── shared/           # 共享业务逻辑库
│   │   ├── src/
│   │   │   ├── types/    # TypeScript类型定义
│   │   │   ├── math/     # 数学计算函数
│   │   │   └── utils/    # 工具函数
│   │   └── __tests__/    # 单元测试
│   ├── web/              # Next.js Web应用
│   │   ├── src/
│   │   │   ├── app/      # App Router页面
│   │   │   ├── components/ # React组件
│   │   │   └── lib/      # 工具库
│   │   └── public/       # 静态资源
│   └── miniprogram/      # Taro小程序 (规划中)
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd finance-suites

# 安装依赖
npm install
```

### 开发运行

```bash
# 启动Web端开发服务器
npm run dev:web

# 启动小程序端开发 (规划中)
npm run dev:mini
```

### 构建部署

```bash
# 构建Web端
npm run build:web

# 构建小程序端 (规划中)
npm run build:mini
```

## 📊 已实现功能

### MVP阶段 ✅

- [x] **复利计算器**
  - 单利和复利计算
  - 正向计算终值
  - 反向计算本金和利率
  - 实时计算和结果显示

- [x] **CAGR年化收益率计算器**
  - 基于买入价、卖出价和持有期间计算CAGR
  - 目标价格计算
  - 达到目标收益所需时间计算

- [x] **技术架构**
  - 共享业务逻辑库 (`@finance-suites/shared`)
  - Web端应用 (Next.js 14 + shadcn/ui)
  - TypeScript类型安全
  - 单元测试覆盖

### 规划中功能

- [ ] **盈亏比与胜率期望计算器**
- [ ] **仓位管理工具 (Kelly公式)**
- [ ] **期权盈亏计算器**
- [ ] **估值工具 (PE/DCF)**
- [ ] **房贷计算器**
- [ ] **微信小程序端**

## 🛠️ 技术栈

### 共享库
- TypeScript
- Vitest (单元测试)

### Web端
- Next.js 14 (App Router)
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui
- React Hook Form + Zod

### 小程序端 (规划)
- Taro 3
- React
- TypeScript

## 🧮 计算器功能详解

### 1. 复利计算器

**核心公式:**
- 单利: `FV = P × (1 + r × n)`
- 复利: `FV = P × (1 + r)^n`

**功能特色:**
- 支持单利/复利模式切换
- 实时计算和结果预览
- 反向计算支持
- 边界情况处理 (负收益率、大数溢出等)

### 2. CAGR年化收益率计算器

**核心公式:**
- 总收益率: `(Sell/Buy - 1) × 100%`
- CAGR: `[(Sell/Buy)^(1/Years) - 1] × 100%`

**功能特色:**
- 三种计算模式: CAGR计算、目标价格、所需时间
- 支持短期投资 (小于1年)
- 批量投资对比功能

## 🎨 设计特色

- **现代化UI**: 基于shadcn/ui设计系统
- **响应式布局**: 完美适配各种屏幕尺寸
- **直观交互**: 标签切换和实时计算
- **专业外观**: 类似专业金融工具的界面设计

## 🧪 测试

```bash
# 运行单元测试
npm run test

# 监听模式运行测试
npm run test:watch
```

## 📝 开发指南

### 添加新计算器

1. 在 `packages/shared/src/types/` 中定义类型
2. 在 `packages/shared/src/math/` 中实现计算逻辑
3. 编写单元测试
4. 在Web端创建UI组件
5. 更新主页面的标签导航

### 代码规范

- 使用TypeScript进行类型检查
- 遵循ESLint规则
- 编写单元测试确保计算准确性
- 使用语义化的组件命名

## 🔄 部署

### Web端 (Vercel)

```bash
# 连接Vercel
npx vercel

# 部署
npx vercel --prod
```

### 小程序端 (规划)

使用Taro CLI构建并上传到微信开发者工具。

## 🤝 贡献指南

1. Fork项目
2. 创建feature分支
3. 提交变更
4. 创建Pull Request

## 📄 许可证

MIT License

---

**开发者:** Jennifer Yan  
**创建时间:** 2025年9月  
**技术支持:** 基于现代Web技术栈构建
