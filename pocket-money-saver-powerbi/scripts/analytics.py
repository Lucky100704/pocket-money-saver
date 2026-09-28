"""
Pocket Money Saver — analytics layer.
Reads the raw transactions and produces the CSVs that Power BI consumes.

In production this reads from PostgreSQL via SQLAlchemy. For the demo it
reads the generated transactions.csv. Same output either way.

Outputs (all in ../data/analytics/):
  - monthly_summary.csv       income vs expenses per month
  - category_trends.csv       spend by category per month
  - fixed_vs_variable.csv     monthly split of fixed vs variable costs
  - forecast.csv              next-month forecast (weighted 3-mo moving avg)
  - budget_vs_actual.csv      current-month spend against budget per category
  - savings_progress.csv      goal target vs saved and % complete
"""

import csv
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path
from statistics import mean

DATA = Path(__file__).resolve().parent.parent / "data"
OUT = DATA / "analytics"
OUT.mkdir(exist_ok=True)


# ---------- helpers ----------
def read_csv(name):
    with open(DATA / name) as f:
        return list(csv.DictReader(f))


def clean_transactions(raw):
    """Validate: drop unusable rows, coerce types. Mirrors the app's Python layer."""
    dropped = 0
    cleaned = []
    for r in raw:
        try:
            if not r["date"] or not r["amount"]:
                dropped += 1
                continue
            r["amount"] = float(r["amount"])
            if r["amount"] <= 0:
                dropped += 1
                continue
            y, m, d = map(int, r["date"].split("-"))
            r["_date"] = date(y, m, d)
            r["_month"] = f"{y:04d}-{m:02d}"
            cleaned.append(r)
        except (ValueError, KeyError):
            dropped += 1
    print(f"cleaned: kept {len(cleaned)}, dropped {dropped}")
    return cleaned


def write(name, rows, fields):
    with open(OUT / name, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"  wrote {name} ({len(rows)} rows)")


# ---------- analytics ----------
def monthly_summary(txns):
    by_month = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
    for t in txns:
        by_month[t["_month"]][t["kind"]] += t["amount"]
    return [
        {
            "month": m,
            "income": round(v["income"], 2),
            "expenses": round(v["expense"], 2),
            "net_savings": round(v["income"] - v["expense"], 2),
            "savings_rate": round(
                (v["income"] - v["expense"]) / v["income"] if v["income"] else 0, 4
            ),
        }
        for m, v in sorted(by_month.items())
    ]


def category_trends(txns):
    by = defaultdict(float)
    for t in txns:
        if t["kind"] != "expense":
            continue
        by[(t["_month"], t["category"])] += t["amount"]
    return [
        {"month": m, "category": c, "amount": round(a, 2)}
        for (m, c), a in sorted(by.items())
    ]


def fixed_vs_variable(txns):
    by = defaultdict(lambda: {"fixed": 0.0, "variable": 0.0})
    for t in txns:
        if t["kind"] != "expense":
            continue
        by[t["_month"]][t["cost_type"]] += t["amount"]
    return [
        {"month": m, "fixed": round(v["fixed"], 2), "variable": round(v["variable"], 2)}
        for m, v in sorted(by.items())
    ]


def forecast(txns):
    """Weighted 3-month moving average, fixed + variable computed separately.
    Weights favour recent months (0.5, 0.3, 0.2)."""
    fv = fixed_vs_variable(txns)
    if len(fv) < 3:
        return []
    recent = fv[-3:]
    weights = [0.2, 0.3, 0.5]  # oldest -> newest
    fx = sum(r["fixed"] * w for r, w in zip(recent, weights))
    va = sum(r["variable"] * w for r, w in zip(recent, weights))
    last_month = date.fromisoformat(fv[-1]["month"] + "-01")
    nxt = (last_month.replace(day=28) + timedelta(days=4)).replace(day=1)
    return [{
        "month": nxt.strftime("%Y-%m"),
        "forecast_fixed": round(fx, 2),
        "forecast_variable": round(va, 2),
        "forecast_total": round(fx + va, 2),
        "method": "weighted 3-mo moving avg (0.5/0.3/0.2)",
    }]


def budget_vs_actual(txns, budgets):
    """Compare the latest month's spend to the budget per category."""
    if not txns:
        return []
    latest = max(t["_month"] for t in txns)
    spend = defaultdict(float)
    for t in txns:
        if t["_month"] == latest and t["kind"] == "expense":
            spend[t["category"]] += t["amount"]
    rows = []
    for b in budgets:
        limit = float(b["monthly_limit"])
        actual = round(spend.get(b["category"], 0.0), 2)
        rows.append({
            "month": latest,
            "category": b["category"],
            "budget": limit,
            "actual": actual,
            "remaining": round(limit - actual, 2),
            "pct_used": round(actual / limit if limit else 0, 4),
            "status": "over" if actual > limit else ("on-track" if actual >= 0.7 * limit else "under"),
        })
    return rows


def savings_progress(goals):
    return [
        {
            "goal_id": g["goal_id"],
            "name": g["name"],
            "target": float(g["target"]),
            "saved": float(g["saved"]),
            "remaining": round(float(g["target"]) - float(g["saved"]), 2),
            "pct_complete": round(float(g["saved"]) / float(g["target"]), 4),
            "deadline": g["deadline"],
        }
        for g in goals
    ]


# ---------- main ----------
def main():
    print("Reading raw data...")
    txns = clean_transactions(read_csv("transactions.csv"))
    budgets = read_csv("budgets.csv")
    goals = read_csv("savings_goals.csv")

    print("Building analytics tables...")
    write("monthly_summary.csv",  monthly_summary(txns),
          ["month", "income", "expenses", "net_savings", "savings_rate"])
    write("category_trends.csv",  category_trends(txns),
          ["month", "category", "amount"])
    write("fixed_vs_variable.csv", fixed_vs_variable(txns),
          ["month", "fixed", "variable"])
    write("forecast.csv",         forecast(txns),
          ["month", "forecast_fixed", "forecast_variable", "forecast_total", "method"])
    write("budget_vs_actual.csv", budget_vs_actual(txns, budgets),
          ["month", "category", "budget", "actual", "remaining", "pct_used", "status"])
    write("savings_progress.csv", savings_progress(goals),
          ["goal_id", "name", "target", "saved", "remaining", "pct_complete", "deadline"])

    print(f"\nDone. Analytics CSVs in: {OUT}")


if __name__ == "__main__":
    main()
