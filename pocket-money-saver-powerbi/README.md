# Pocket Money Saver — Power BI Analytics

Power BI dashboard built on top of the [Pocket Money Saver](https://github.com/Lucky100704) personal finance app. Reads live PostgreSQL data through a Python analytics layer, aggregates it into six analytics tables, and visualizes them across a four-page dashboard.

**Stack:** PostgreSQL · Python (pandas, SQLAlchemy) · Power BI (DAX, Power Query)
**Author:** Sai Srinivas Uppara ([@Lucky100704](https://github.com/Lucky100704))
**Related project:** [Pocket Money Saver](https://github.com/Lucky100704) — Node/Express/React/PostgreSQL full-stack app

---

## What it does

The Pocket Money Saver app captures a user's transactions, budgets, savings goals, and recurring expenses in PostgreSQL. This project sits on top of that:

1. **Python analytics layer** connects to PostgreSQL, cleans the raw transactions (drops unusable rows, coerces types, filters non-positive amounts), and aggregates them into six analytics tables.
2. **Power BI dashboard** reads those tables via 14 DAX measures and presents them across four pages: Overview, Category Deep Dive, Budgets & Forecast, and Savings Goals.

The design lets the data source swap between CSV (for local testing) and live PostgreSQL (once the app is deployed) with no dashboard changes.

---

## Repository structure

```
pocket-money-saver-powerbi/
├── scripts/
│   ├── generate_data.py           reproducible synthetic dataset for testing
│   └── analytics.py               cleaning + aggregation pipeline
├── data/
│   ├── transactions.csv           raw data (495 rows, 12 months)
│   ├── budgets.csv
│   ├── savings_goals.csv
│   ├── recurring_transactions.csv
│   └── analytics/                 outputs consumed by Power BI
│       ├── monthly_summary.csv
│       ├── category_trends.csv
│       ├── fixed_vs_variable.csv
│       ├── forecast.csv
│       ├── budget_vs_actual.csv
│       └── savings_progress.csv
├── docs/
│   └── POWERBI_BUILD_GUIDE.md    build guide + all 14 DAX measures
└── README.md
```

---

## Quick start

**Regenerate the analytics tables:**
```bash
python3 scripts/generate_data.py    # optional — CSVs are already committed
python3 scripts/analytics.py
```

**Open the dashboard:**
1. Install Power BI Desktop (Windows).
2. Follow [`docs/POWERBI_BUILD_GUIDE.md`](docs/POWERBI_BUILD_GUIDE.md).
3. Save as `pocket_money_saver.pbix`.

---

## Analytics layer — what's inside

### Data cleaning (`clean_transactions`)
- Drops rows missing `date` or `amount`
- Coerces `amount` to float, `date` to `datetime.date`
- Filters out non-positive amounts
- Adds `_month` (`YYYY-MM`) for aggregation

### Six output tables

| Table | Purpose |
|---|---|
| `monthly_summary.csv` | Income vs expenses per month + savings rate |
| `category_trends.csv` | Spend by category per month |
| `fixed_vs_variable.csv` | Monthly split of fixed vs variable expenses |
| `forecast.csv` | Next-month forecast, weighted 3-mo moving average |
| `budget_vs_actual.csv` | Current-month spend vs budget per category |
| `savings_progress.csv` | Goal target vs saved and % complete |

### Forecast method

Weighted 3-month moving average, computed separately for fixed and variable costs:

```
forecast_next_month = 0.5 × month_t + 0.3 × month_(t-1) + 0.2 × month_(t-2)
```

Fixed costs (rent, subscriptions, phone) are stable and forecast tightly. Variable costs (dining, entertainment, shopping) are smoothed with the same weights.

---

## Dashboard — 4 pages, 14 DAX measures

### Page 1 — Overview
Cards for Total Income, Total Expenses, Net Savings, Savings Rate. Income vs Expenses column chart with a Net Savings line overlay. Month slicer.

### Page 2 — Category Deep Dive
Category spend bar chart (sorted descending), category trend lines over time, fixed vs variable donut, sortable table.

### Page 3 — Budgets & Forecast
Budget vs actual clustered column, conditional-formatted budget table (red > 100%, amber 70–100%, green < 70%), forecast cards for next month total / fixed / variable.

### Page 4 — Savings Goals
Goal table with progress %, target vs saved bar chart, gauge per goal.

### DAX measures (highlights)

```dax
Net Savings = [Total Income] - [Total Expenses]

Savings Rate = DIVIDE([Net Savings], [Total Income])

MoM Expense Change =
VAR curr = [Latest Month Expenses]
VAR prev_month =
    CALCULATE(MAX(monthly_summary[month]),
              monthly_summary[month] < [Latest Month])
VAR prev = CALCULATE([Total Expenses], monthly_summary[month] = prev_month)
RETURN DIVIDE(curr - prev, prev)

Budget Used % =
DIVIDE(SUM(budget_vs_actual[actual]), SUM(budget_vs_actual[budget]))
```

Full list of 14 measures in the [build guide](docs/POWERBI_BUILD_GUIDE.md).

---

## Design

Matches the parent app's dark-green fintech aesthetic:
- Background: `#0D1614`
- Accent: `#3ECF8E`
- Type: Space Grotesk / Outfit / IBM Plex Mono

---

## Roadmap

- [ ] Swap CSV source for live PostgreSQL once the app is deployed (Render + Supabase)
- [ ] Publish to Power BI Service for a shareable URL
- [ ] Add month-over-month comparison view
- [ ] AI-generated insight paragraph per month

---

## License

MIT
