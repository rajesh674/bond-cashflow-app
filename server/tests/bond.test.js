const request = require('supertest');
const app = require('../src/app');
const bond = require('../src/bond');

const par = { faceValue: 1000, couponRate: 0.06, yearsToMaturity: 5, frequency: 'annual' };

describe('bond maths', () => {
  test('schedule has one row per period and repays principal at the end', () => {
    const s = bond.cashflowSchedule({ ...par, frequency: 'semiannual' });
    expect(s).toHaveLength(10);
    expect(s[0].coupon).toBe(30);
    expect(s[9].principal).toBe(1000);
    expect(s[9].cumulative).toBe(1300);
  });

  test('bond priced at its coupon rate trades at par', () => {
    expect(bond.price(par, 0.06)).toBeCloseTo(1000, 6);
  });

  test('price falls when yield rises and rises when yield falls', () => {
    expect(bond.price(par, 0.08)).toBeLessThan(1000);
    expect(bond.price(par, 0.04)).toBeGreaterThan(1000);
  });

  test('zero coupon duration equals years to maturity', () => {
    const d = bond.duration({ ...par, couponRate: 0 }, 0.05);
    expect(d.macaulay).toBeCloseTo(5, 3);
  });

  test('sensitivity base case has zero change', () => {
    const r = bond.sensitivity(par, 0.06);
    const base = r.find((x) => x.shiftBps === 0);
    expect(base.change).toBe(0);
    expect(r.find((x) => x.shiftBps === 100).price).toBeLessThan(base.price);
  });

  test('validation catches bad input', () => {
    expect(bond.validate({ ...par, faceValue: -5 })).toHaveLength(1);
    expect(bond.validate({ ...par, frequency: 'weekly' })).toHaveLength(1);
  });
});

describe('API', () => {
  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  test('POST /api/cashflows returns schedule and totals', async () => {
    const res = await request(app).post('/api/cashflows').send(par);
    expect(res.status).toBe(200);
    expect(res.body.schedule).toHaveLength(5);
    expect(res.body.totals.coupons).toBe(300);
  });

  test('POST /api/valuation returns price near par at coupon yield', async () => {
    const res = await request(app).post('/api/valuation').send({ ...par, yieldRate: 0.06 });
    expect(res.status).toBe(200);
    expect(res.body.price).toBeCloseTo(1000, 1);
    expect(res.body.duration.modified).toBeGreaterThan(0);
  });

  test('POST /api/sensitivity returns results', async () => {
    const res = await request(app).post('/api/sensitivity').send({ ...par, yieldRate: 0.06 });
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(3);
  });

  test('invalid input returns 400 with errors', async () => {
    const res = await request(app).post('/api/cashflows').send({ ...par, couponRate: 7 });
    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toMatch(/couponRate/);
  });

  test('missing yieldRate returns 400', async () => {
    const res = await request(app).post('/api/valuation').send(par);
    expect(res.status).toBe(400);
  });
});
