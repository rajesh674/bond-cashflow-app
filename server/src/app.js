const express = require('express');
const cors = require('cors');
const bond = require('./bond');

const app = express();
app.use(cors());
app.use(express.json());

function parse(req, res, needYield) {
  const body = req.body || {};
  const input = {
    faceValue: Number(body.faceValue),
    couponRate: Number(body.couponRate),
    yearsToMaturity: Number(body.yearsToMaturity),
    frequency: body.frequency,
    yieldRate: needYield ? Number(body.yieldRate) : undefined,
  };
  const errors = bond.validate(input);
  if (needYield && Number.isNaN(input.yieldRate)) errors.push('yieldRate is required');
  if (errors.length) {
    res.status(400).json({ errors });
    return null;
  }
  return input;
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Payment schedule: coupon + principal for every period.
app.post('/api/cashflows', (req, res) => {
  const input = parse(req, res, false);
  if (!input) return;
  const schedule = bond.cashflowSchedule(input);
  const totalCoupons = schedule.reduce((s, r) => s + r.coupon, 0);
  res.json({ schedule, totals: { coupons: +totalCoupons.toFixed(2), principal: input.faceValue } });
});

// Price and duration at a given yield.
app.post('/api/valuation', (req, res) => {
  const input = parse(req, res, true);
  if (!input) return;
  res.json({
    price: +bond.price(input, input.yieldRate).toFixed(2),
    duration: bond.duration(input, input.yieldRate),
  });
});

// What-if: price impact of yield moves.
app.post('/api/sensitivity', (req, res) => {
  const input = parse(req, res, true);
  if (!input) return;
  const shifts = Array.isArray(req.body.shiftsBps) && req.body.shiftsBps.length
    ? req.body.shiftsBps.map(Number).filter((n) => Number.isFinite(n))
    : undefined;
  res.json({ results: bond.sensitivity(input, input.yieldRate, shifts) });
});

module.exports = app;
