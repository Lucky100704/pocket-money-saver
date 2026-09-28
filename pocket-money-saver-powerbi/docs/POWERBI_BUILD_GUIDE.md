# Pocket Money Saver — Power BI Dashboard Build Guide

Everything you need to open Power BI Desktop on Windows and have a working dashboard in ~30 minutes. Every click, every DAX measure, every visual.

---

## 0. Before you start

**On your Windows ASUS:**
1. Install **Power BI Desktop** (free, Microsoft Store or powerbi.microsoft.com/desktop).
2. Copy the whole `pms_powerbi` folder to `C:\Users\ASUS\Downloads\pms_powerbi`.
3. Confirm `data\analytics\` has these 6 files:
   - `monthly_summary.csv`
   - `category_trends.csv`
   - `fixed_vs_variable.csv`
   - `forecast.csv`
   - `budget_vs_actual.csv`
   - `savings_progress.csv`

Later, when the app is deployed, you swap the CSV data source for a live PostgreSQL connection — nothing else changes.

---

## 1. Load the data (5 min)

1. Open Power BI Desktop → **Home → Get data → Text/CSV**.
2. Load each of the 6 CSVs above **one at a time**. Click **Transform Data** before Load only if you want to peek — otherwise **Load**.
3. In the **Model** view (left sidebar, third icon), verify column data types:
   - `month` columns → **Text** (keep as `YYYY-MM` for now).
   - `amount`, `income`, `expenses`, `budget`, `actual`, `target`, `saved`, `forecast_*` → **Decimal Number**.
   - `pct_used`, `pct_complete`, `savings_rate` → **Decimal Number** (format as **Percentage** later).
   - `deadline` → **Date**.

## 2. Create the date table (2 min)

Home → **New table**, paste:

```dax
DateTable = 
ADDCOLUMNS(
    CALENDAR(DATE(2025,10,1), DATE(2026,12,31)),
    "Year", YEAR([Date]),
    "MonthNum", MONTH([Date]),
    "MonthName", FORMAT([Date], "MMM YYYY"),
    "MonthKey", FORMAT([Date], "YYYY-MM")
)
```

Mark it as a date table: right-click `DateTable` → **Mark as date table** → Date column: `Date`.

## 3. Relationships (2 min)

**Model view** → drag to create these one-to-many relationships (single direction):

| From (many) | To (one) |
|---|---|
| `monthly_summary[month]` | `DateTable[MonthKey]` |
| `category_trends[month]` | `DateTable[MonthKey]` |
| `fixed_vs_variable[month]` | `DateTable[MonthKey]` |
| `budget_vs_actual[month]` | `DateTable[MonthKey]` |
| `forecast[month]` | `DateTable[MonthKey]` |

## 4. Measures — paste each into New Measure (10 min)

Home → **New measure** → paste one at a time. Put them in a table called `_Measures` (New table → `_Measures = {BLANK()}` — a home for all measures).

```dax
Total Income = SUM(monthly_summary[income])

Total Expenses = SUM(monthly_summary[expenses])

Net Savings = [Total Income] - [Total Expenses]

Savings Rate = DIVIDE([Net Savings], [Total Income])

Avg Monthly Expenses = 
AVERAGEX(VALUES(monthly_summary[month]), CALCULATE(SUM(monthly_summary[expenses])))

Latest Month = MAX(monthly_summary[month])

Latest Month Expenses = 
CALCULATE([Total Expenses], monthly_summary[month] = [Latest Month])

MoM Expense Change = 
VAR curr = [Latest Month Expenses]
VAR prev_month = 
    CALCULATE(
        MAX(monthly_summary[month]),
        monthly_summary[month] < [Latest Month]
    )
VAR prev = CALCULATE([Total Expenses], monthly_summary[month] = prev_month)
RETURN DIVIDE(curr - prev, prev)

Category Spend = SUM(category_trends[amount])

Budget Used % = 
DIVIDE(SUM(budget_vs_actual[actual]), SUM(budget_vs_actual[budget]))

Forecast Total = SUM(forecast[forecast_total])

Goal Progress = 
DIVIDE(SUM(savings_progress[saved]), SUM(savings_progress[target]))

Fixed Costs = SUM(fixed_vs_variable[fixed])

Variable Costs = SUM(fixed_vs_variable[variable])

Fixed % of Expenses = 
DIVIDE([Fixed Costs], [Fixed Costs] + [Variable Costs])
```

Format the % measures: click the measure → **Measure tools** ribbon → Format: **Percentage**, 1 decimal.

## 5. Page 1 — Overview (5 min)

Insert → **Text box** for the title: "Pocket Money Saver — Overview". 22pt, bold.

Add these visuals (drag from the ribbon):

| Visual | Fields | Notes |
|---|---|---|
| **Card** | `[Total Income]` | Title: "Total Income" |
| **Card** | `[Total Expenses]` | Title: "Total Expenses" |
| **Card** | `[Net Savings]` | Title: "Net Savings" — Format: green if positive |
| **Card** | `[Savings Rate]` | Title: "Savings Rate" |
| **Line and clustered column** | Axis: `monthly_summary[month]`; Column: `income`, `expenses`; Line: `net_savings` | Title: "Income vs Expenses" |
| **Slicer** | `DateTable[MonthName]` | Style: dropdown |

Layout: 4 cards across the top, big chart below, slicer top-right.

## 6. Page 2 — Category Deep Dive (5 min)

| Visual | Fields |
|---|---|
| **Clustered bar chart** | Axis: `category_trends[category]`; Values: `[Category Spend]`; sort descending |
| **Line chart** | Axis: `month`; Values: `amount`; Legend: `category` — filter to top 5 categories |
| **Donut chart** | Legend: `fixed_vs_variable` category (fixed/variable — via `[Fixed Costs]` + `[Variable Costs]` as fields, or unpivot in Power Query) |
| **Table** | Columns: `category`, `[Category Spend]`, sort by spend descending |

## 7. Page 3 — Budgets & Forecast (5 min)

| Visual | Fields |
|---|---|
| **Clustered column** | Axis: `budget_vs_actual[category]`; Values: `budget`, `actual` | Title: "Budget vs Actual (this month)" |
| **Table** | Columns: `category`, `budget`, `actual`, `remaining`, `pct_used`, `status` — conditional format `pct_used` (red > 100%, amber 70-100%, green < 70%) |
| **Card** | `[Forecast Total]` | Title: "Next Month Forecast" |
| **Card** | `[Fixed Costs]` (from forecast table) | Title: "Forecast — Fixed" |
| **Card** | `[Variable Costs]` (from forecast table) | Title: "Forecast — Variable" |

## 8. Page 4 — Savings Goals (3 min)

| Visual | Fields |
|---|---|
| **Table** | `name`, `target`, `saved`, `remaining`, `pct_complete`, `deadline` |
| **Bar chart** | Axis: `name`; Values: `saved`, `target` (clustered) |
| **Gauge** (one per goal, or one linked to slicer) | Value: `saved`; Max: `target` |

## 9. Polish (5 min)

- **Theme:** View → Themes → Browse for themes… or pick a dark one to match the app's fintech look. Custom colors: background `#0D1614`, accent `#3ECF8E`.
- **Title bar:** add a text box across the top of every page with "Pocket Money Saver — [Page Name]".
- **Page navigation:** Insert → Buttons → Blank, one per page. Format → Action → Type: Page navigation.
- **Filters pane:** collapse it (arrow on the right).

## 10. Save & export

- **File → Save as** → `pocket_money_saver.pbix` in the `pms_powerbi/` folder.
- To publish: **File → Publish → Publish to Power BI** (needs a free Microsoft account and Power BI Service). This gives you a shareable link — good for the interview if they ask to see it.
- Export a snapshot: **File → Export → Export to PDF**. Attach the PDF alongside the `.pbix` in your GitHub repo.

---

## Later: swap CSV for live PostgreSQL

Once you deploy the app (Render + Vercel + hosted Postgres like Supabase or Neon):

1. **Home → Transform data → Data source settings**.
2. Change source of each analytics table from CSV to **PostgreSQL database**.
3. Server: your DB host. Database: your DB name. Auth: Basic (username/password).
4. Replace CSV queries with SQL views (create `analytics.monthly_summary`, `analytics.category_trends`, etc. as views in Postgres that mirror what `analytics.py` computes).
5. Refresh — dashboard now updates live.

---

## What to say in the interview

> "For Pocket Money Saver I built a Power BI dashboard on top of the Python analytics layer. The layer connects to PostgreSQL, cleans the raw transactions, and outputs six analytics tables — monthly summary, category trends, fixed vs variable split, next-month forecast, budget vs actual, and savings progress. Power BI reads those with 14 DAX measures, across four pages: Overview, Category Deep Dive, Budgets & Forecast, and Savings Goals. The forecast uses a weighted 3-month moving average, splitting fixed and variable costs. Right now it runs on my local Postgres; the design lets me swap that for a hosted database once the app is deployed, with no changes to the dashboard."

That's honest, specific, and matches exactly what's in this repo.
