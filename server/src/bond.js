// Core bond maths. Pure functions, no I/O, so they are easy to unit test.

const FREQUENCIES = { annual: 1, semiannual: 2, quarterly: 4 };

function validate({ faceValue, couponRate, yearsToMaturity, frequency, yieldRate }) {
  const errors = [];
  if (!(faceValue > 0)) errors.push('faceValue must be greater than 0');
  if (!(couponRate >= 0 && couponRate <= 1)) errors.push('couponRate must be between 0 and 1 (e.g. 0.07 for 7%)');
  if (!(yearsToMaturity > 0 && yearsToMaturity <= 100)) errors.push('yearsToMaturity must be between 0 and 100');
  if (!FREQUENCIES[frequency]) errors.push('frequency must be annual, semiannual or quarterly');
  if (yieldRate !== undefined && !(yieldRate > -1 && yieldRate <= 1)) errors.push('yieldRate must be between -1 and 1 (e.g. 0.065 for 6.5%)');
  return errors;
}

/** Coupon and principal payment schedule. */
function cashflowSchedule({ faceValue, couponRate, yearsToMaturity, frequency }) {
  const f = FREQUENCIES[frequency];
  const periods = Math.round(yearsToMaturity * f);
  const coupon = (faceValue * couponRate) / f;
  const rows = [];
  let cumulative = 0;
  for (let t = 1; t <= periods; t++) {
    const principal = t === periods ? faceValue : 0;
    const total = coupon + principal;
    cumulative += total;
    rows.push({
      period: t,
      yearsFromNow: +(t / f).toFixed(4),
      coupon: round2(coupon),
      principal: round2(principal),
      total: round2(total),
      cumulative: round2(cumulative),
    });
  }
  return rows;
}

/** Present value of all cashflows at the given yield. */
function price(bond, yieldRate) {
  const f = FREQUENCIES[bond.frequency];
  const y = yieldRate / f;
  return cashflowSchedule(bond).reduce(
    (sum, cf) => sum + cf.total / Math.pow(1 + y, cf.period),
    0
  );
}

/** Macaulay and modified duration (in years). */
function duration(bond, yieldRate) {
  const f = FREQUENCIES[bond.frequency];
  const y = yieldRate / f;
  const p = price(bond, yieldRate);
  const weighted = cashflowSchedule(bond).reduce(
    (sum, cf) => sum + (cf.yearsFromNow * cf.total) / Math.pow(1 + y, cf.period),
    0
  );
  const macaulay = weighted / p;
  return { macaulay: round4(macaulay), modified: round4(macaulay / (1 + y)) };
}

/** Price at a set of parallel yield shifts (in basis points). */
function sensitivity(bond, yieldRate, shiftsBps = [-200, -100, -50, 0, 50, 100, 200]) {
  const base = price(bond, yieldRate);
  return shiftsBps.map((bps) => {
    const y = yieldRate + bps / 10000;
    const p = price(bond, y);
    return {
      shiftBps: bps,
      yieldRate: round4(y),
      price: round2(p),
      change: round2(p - base),
      changePct: round4(((p - base) / base) * 100),
    };
  });
}

const round2 = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 10000) / 10000;

module.exports = { FREQUENCIES, validate, cashflowSchedule, price, duration, sensitivity };
