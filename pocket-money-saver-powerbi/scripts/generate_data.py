"""
Pocket Money Saver — synthetic data generator.
Creates 12 months of realistic personal-finance transactions,
budgets, savings goals, and recurring transactions.

Run: python generate_data.py
Output: ../data/*.csv
"""

import csv
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(42)  # reproducible

OUT = Path(__file__).resolve().parent.parent / "data"
OUT.mkdir(exist_ok=True)

START = date(2025, 10, 1)
END = date(2026, 9, 30)

# --- Categories with realistic spend profiles ---
# (category, kind, cost_type, monthly_min, monthly_max, txn_count_range)
CATEGORIES = [
    ("Salary",          "income",  "fixed",    3800, 3800, (1, 1)),
    ("Freelance",       "income",  "variable",  200, 900,  (0, 3)),
    ("Rent",            "expense", "fixed",    1450, 1450, (1, 1)),
    ("Internet",        "expense", "fixed",      75,   75, (1, 1)),
    ("Phone",           "expense", "fixed",      55,   55, (1, 1)),
    ("Subscriptions",   "expense", "fixed",      42,   58, (2, 4)),
    ("Groceries",       "expense", "variable",  380, 620,  (6, 12)),
    ("Dining",          "expense", "variable",   90, 260,  (3, 10)),
    ("Transport",       "expense", "variable",   60, 180,  (4, 12)),
    ("Utilities",       "expense", "fixed",     110, 160,  (1, 2)),
    ("Entertainment",   "expense", "variable",   30, 140,  (1, 6)),
    ("Shopping",        "expense", "variable",   40, 300,  (1, 5)),
    ("Health",          "expense", "variable",    0, 120,  (0, 2)),
    ("Education",       "expense", "fixed",     200, 200,  (1, 1)),
]

MERCHANTS = {
    "Salary":        ["Direct Deposit — Employer"],
    "Freelance":     ["Upwork Payout", "Client Invoice", "Fiverr Payout"],
    "Rent":          ["Landlord E-Transfer"],
    "Internet":      ["Rogers", "Bell"],
    "Phone":         ["Freedom Mobile", "Koodo"],
    "Subscriptions": ["Netflix", "Spotify", "iCloud", "ChatGPT", "YouTube Premium"],
    "Groceries":     ["Metro", "No Frills", "Costco", "Loblaws", "FreshCo", "Walmart"],
    "Dining":        ["Tim Hortons", "Uber Eats", "DoorDash", "A&W", "Pizza Pizza", "Subway"],
    "Transport":     ["Transit Windsor", "Uber", "Shell", "Petro-Canada"],
    "Utilities":     ["Enwin", "Enbridge"],
    "Entertainment": ["Cineplex", "Steam", "PlayStation Store"],
    "Shopping":      ["Amazon", "Walmart", "Winners", "H&M", "Best Buy"],
    "Health":        ["Shoppers Drug Mart", "Rexall", "Dental Clinic"],
    "Education":     ["University of Windsor"],
}


def month_iter(start: date, end: date):
    y, m = start.year, start.month
    while (y, m) <= (end.year, end.month):
        yield y, m
        m += 1
        if m == 13:
            m = 1
            y += 1


def days_in_month(y: int, m: int) -> int:
    nxt = date(y + (m // 12), (m % 12) + 1, 1)
    return (nxt - date(y, m, 1)).days


def gen_transactions():
    rows = []
    tid = 1
    for y, m in month_iter(START, END):
        dim = days_in_month(y, m)
        for cat, kind, cost_type, lo, hi, (nlo, nhi) in CATEGORIES:
            n = random.randint(nlo, nhi)
            if n == 0:
                continue
            # total for the month, split across n transactions
            monthly_total = random.uniform(lo, hi)
            splits = sorted(random.sample(range(1, 100), k=n - 1)) if n > 1 else []
            splits = [0] + splits + [100]
            weights = [(splits[i + 1] - splits[i]) / 100 for i in range(n)]
            for w in weights:
                d = random.randint(1, dim)
                amount = round(monthly_total * w, 2)
                if amount < 1:
                    continue
                merchant = random.choice(MERCHANTS[cat])
                rows.append({
                    "transaction_id": tid,
                    "user_id": 1,
                    "date": date(y, m, d).isoformat(),
                    "amount": amount,
                    "category": cat,
                    "kind": kind,
                    "cost_type": cost_type,
                    "merchant": merchant,
                    "notes": "",
                })
                tid += 1
    rows.sort(key=lambda r: r["date"])
    return rows


def gen_budgets():
    return [
        {"user_id": 1, "category": "Groceries",     "monthly_limit": 550},
        {"user_id": 1, "category": "Dining",        "monthly_limit": 180},
        {"user_id": 1, "category": "Transport",     "monthly_limit": 150},
        {"user_id": 1, "category": "Entertainment", "monthly_limit": 100},
        {"user_id": 1, "category": "Shopping",      "monthly_limit": 200},
        {"user_id": 1, "category": "Subscriptions", "monthly_limit": 60},
    ]


def gen_goals():
    return [
        {"goal_id": 1, "user_id": 1, "name": "TFSA 2026",       "target": 6000, "saved": 3200, "deadline": "2026-12-31"},
        {"goal_id": 2, "user_id": 1, "name": "Emergency Fund",  "target": 5000, "saved": 4100, "deadline": "2027-03-31"},
        {"goal_id": 3, "user_id": 1, "name": "MacBook Upgrade", "target": 2400, "saved": 900,  "deadline": "2027-06-30"},
    ]


def gen_recurring():
    return [
        {"recurring_id": 1, "user_id": 1, "category": "Rent",          "amount": 1450, "frequency": "monthly", "next_date": "2026-10-01"},
        {"recurring_id": 2, "user_id": 1, "category": "Internet",      "amount":   75, "frequency": "monthly", "next_date": "2026-10-05"},
        {"recurring_id": 3, "user_id": 1, "category": "Phone",         "amount":   55, "frequency": "monthly", "next_date": "2026-10-08"},
        {"recurring_id": 4, "user_id": 1, "category": "Subscriptions", "amount":   16, "frequency": "monthly", "next_date": "2026-10-12"},
        {"recurring_id": 5, "user_id": 1, "category": "Salary",        "amount": 3800, "frequency": "monthly", "next_date": "2026-10-15"},
    ]


def write_csv(path, rows, fields):
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def main():
    txns = gen_transactions()
    write_csv(OUT / "transactions.csv", txns,
              ["transaction_id", "user_id", "date", "amount", "category",
               "kind", "cost_type", "merchant", "notes"])
    write_csv(OUT / "budgets.csv", gen_budgets(),
              ["user_id", "category", "monthly_limit"])
    write_csv(OUT / "savings_goals.csv", gen_goals(),
              ["goal_id", "user_id", "name", "target", "saved", "deadline"])
    write_csv(OUT / "recurring_transactions.csv", gen_recurring(),
              ["recurring_id", "user_id", "category", "amount", "frequency", "next_date"])
    print(f"Wrote {len(txns)} transactions to {OUT}")
    print("Files:", [p.name for p in OUT.glob("*.csv")])


if __name__ == "__main__":
    main()
