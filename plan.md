# Feature Plan

## Current State

**Fully built (4):** Compound Interest, CAGR, Real Estate Investment, HK Trading Cost

**Types defined, unbuilt (`packages/shared/src/types/index.ts`):**
- Position Management (Kelly Criterion)
- PE & DCF Valuation
- Options P&L
- Mortgage
- Expectancy/Win Rate Analysis

**Disabled tab skeletons (2):** Position Management (仓位管理), Valuation Tools (估值工具)

---

## Tier 1 — Low Effort, Types Already Defined

### 1. Options P&L Calculator
`OptionInput/OptionResult` types exist. Calculate breakeven, max profit/loss at expiry for calls and puts. Natural complement to the existing HK Trading Cost calculator.

### 2. Mortgage Calculator
`MortgageInput/MortgageResult` types exist. Annuity vs. equal-principal repayment methods, full amortization schedule. Pairs directly with the Real Estate calculator.

### 3. Kelly Criterion Position Sizing
Types exist. Given win rate and profit/loss ratio, output optimal position size. Include half-Kelly conservative option and risk warning when full Kelly > 25%. Completes the already-visible disabled 仓位管理 tab.

---

## Tier 2 — New Calculators, Moderate Effort

### 4. Dollar-Cost Averaging (DCA) Simulator
Inputs: monthly investment, entry price, total periods, final price. Outputs: average cost, total invested, total return vs. lump-sum. Include a Recharts line chart showing DCA vs. lump-sum curve over time.

### 5. Dividend Reinvestment (DRIP) Calculator
Inputs: share price, dividend yield, DRIP toggle, holding years. Outputs: shares accumulated, income growth over time. Extends compound interest concept framed for dividend stock investors.

---

## Tier 3 — UX Improvements, Cross-Cutting Value

### 6. Calculation History (LocalStorage)
Store the last N calculations per tab in `localStorage`, display as a collapsible panel. No backend needed. Eliminates the current lack of any state persistence.

### 7. Charts on Existing Calculators
Recharts is already installed but unused. Add year-by-year growth curves to Compound Interest and CAGR calculators. No new features — high perceived quality improvement for near-zero cost.

### 8. Scenario Comparison Mode
Add a "Compare" toggle to CAGR and Real Estate calculators. Let users save up to 3 scenarios and view them side-by-side in a table. Addresses the most common calculator use case: varying one input to compare outcomes.

---

## Tier 4 — Strategic, Higher Effort

### 9. PE & DCF Valuation (completes disabled tab)
Completes the disabled 估值工具 tab. DCF inputs: FCF, growth rates (2-stage), discount rate, terminal value (Gordon model or exit multiple). Output: intrinsic value vs. current price, margin of safety.

### 10. Portfolio Aggregator (XIRR)
Input multiple positions (buy date, buy price, sell date/current price). Compute portfolio-level XIRR and weighted average return. Logical evolution once CAGR + position sizing tools are in place.

---

## Recommended Starting Order

1. **Kelly Criterion** — completes the already-visible disabled tab with minimal new groundwork
2. **Mortgage Calculator** — broadens appeal beyond traders, types already defined
3. **Charts on existing calculators** — highest impact-to-effort ratio, Recharts already installed
