# Bond Cashflow & Sensitivity Calculator

A small full-stack app that takes a bond (face value, coupon, maturity, payment frequency) and a market yield, then shows:

- the **payment schedule** (coupon and principal for every period),
- the bond's **price** and **Macaulay / modified duration**,
- a **what-if table and chart** of how the price changes when yields move (-200 to +200 bps).

Built with **Node.js + Express** (REST API), **React + Vite** (UI) and **Jest + Supertest** (tests).

## Project structure

```
server/   Express REST API and the bond maths (src/bond.js), with Jest tests
client/   React UI (Vite) with a plain-SVG price chart
```

## Run locally

Requires Node.js 18+.

```bash
# 1. API (http://localhost:4000)
cd server
npm install
npm start

# 2. UI (http://localhost:5173), in a second terminal
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api` to the API on port 4000.

## Run the tests

```bash
cd server
npm test
```

12 tests cover the maths (par pricing, price/yield relationship, zero-coupon duration, validation) and every API endpoint, including error responses.

## API

All endpoints accept JSON. Rates are decimals (`0.07` = 7%).

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/health` | - | `{ status: "ok" }` |
| POST | `/api/cashflows` | `faceValue, couponRate, yearsToMaturity, frequency` | payment schedule and totals |
| POST | `/api/valuation` | same + `yieldRate` | price, Macaulay and modified duration |
| POST | `/api/sensitivity` | same + `yieldRate`, optional `shiftsBps` | price change for each yield shift |

`frequency` is `annual`, `semiannual` or `quarterly`. Invalid input returns `400` with an `errors` array.

Example:

```bash
curl -X POST localhost:4000/api/valuation \
  -H "Content-Type: application/json" \
  -d '{"faceValue":1000,"couponRate":0.07,"yearsToMaturity":5,"frequency":"semiannual","yieldRate":0.065}'
```

## How the maths works

- Coupon per period = face value x coupon rate / payments per year.
- Price = sum of each cashflow discounted at (yield / payments per year) for its period.
- Macaulay duration = time-weighted average of discounted cashflows divided by price; modified duration = Macaulay / (1 + yield / payments per year).

## Ideas for next steps

- Save bonds and scenarios to MongoDB.
- Add accrued interest and yield-to-maturity from a quoted price.
- Add authentication and a portfolio of bonds.
