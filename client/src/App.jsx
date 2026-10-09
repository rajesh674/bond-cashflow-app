import React, { useState } from 'react';
import { fetchCashflows, fetchValuation, fetchSensitivity } from './api.js';
import PriceChart from './PriceChart.jsx';

const initial = { faceValue: 1000, couponRate: 7, yearsToMaturity: 5, frequency: 'semiannual', yieldRate: 6.5 };
const money = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function App() {
  const [form, setForm] = useState(initial);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function calculate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const body = {
      faceValue: Number(form.faceValue),
      couponRate: Number(form.couponRate) / 100,
      yearsToMaturity: Number(form.yearsToMaturity),
      frequency: form.frequency,
      yieldRate: Number(form.yieldRate) / 100,
    };
    try {
      const [cashflows, valuation, sensitivity] = await Promise.all([
        fetchCashflows(body), fetchValuation(body), fetchSensitivity(body),
      ]);
      setData({ cashflows, valuation, sensitivity: sensitivity.results });
    } catch (err) {
      setData(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="top">
        <h1>Bond cashflow and sensitivity calculator</h1>
        <p>Enter a bond and a market yield to see its payment schedule, fair price and how the price moves when yields change.</p>
      </header>

      <form className="inputs" onSubmit={calculate}>
        <label>Face value
          <input type="number" min="1" step="any" value={form.faceValue} onChange={update('faceValue')} required />
        </label>
        <label>Coupon rate (%)
          <input type="number" min="0" max="100" step="any" value={form.couponRate} onChange={update('couponRate')} required />
        </label>
        <label>Years to maturity
          <input type="number" min="0.25" step="any" value={form.yearsToMaturity} onChange={update('yearsToMaturity')} required />
        </label>
        <label>Payments
          <select value={form.frequency} onChange={update('frequency')}>
            <option value="annual">Annual</option>
            <option value="semiannual">Semiannual</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </label>
        <label>Market yield (%)
          <input type="number" step="any" value={form.yieldRate} onChange={update('yieldRate')} required />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Calculating' : 'Calculate'}</button>
      </form>

      {error && <p role="alert" className="error">{error}</p>}

      {!data && !error && <p className="empty">Press Calculate to see results for the bond above.</p>}

      {data && (
        <>
          <section className="summary" aria-label="Valuation">
            <div><span>Price</span><strong>{money(data.valuation.price)}</strong></div>
            <div><span>Modified duration</span><strong>{data.valuation.duration.modified.toFixed(2)} yrs</strong></div>
            <div><span>Macaulay duration</span><strong>{data.valuation.duration.macaulay.toFixed(2)} yrs</strong></div>
            <div><span>Total coupons</span><strong>{money(data.cashflows.totals.coupons)}</strong></div>
          </section>

          <section>
            <h2>Price if yields move</h2>
            <PriceChart results={data.sensitivity} />
            <div className="scroll">
              <table>
                <thead><tr><th>Shift (bps)</th><th>Yield</th><th>Price</th><th>Change</th><th>Change %</th></tr></thead>
                <tbody>
                  {data.sensitivity.map((r) => (
                    <tr key={r.shiftBps}>
                      <td>{r.shiftBps > 0 ? `+${r.shiftBps}` : r.shiftBps}</td>
                      <td>{(r.yieldRate * 100).toFixed(2)}%</td>
                      <td>{money(r.price)}</td>
                      <td className={r.change < 0 ? 'neg' : r.change > 0 ? 'pos' : ''}>{money(r.change)}</td>
                      <td className={r.change < 0 ? 'neg' : r.change > 0 ? 'pos' : ''}>{r.changePct.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>Payment schedule</h2>
            <div className="scroll">
              <table>
                <thead><tr><th>Period</th><th>Years</th><th>Coupon</th><th>Principal</th><th>Total</th><th>Cumulative</th></tr></thead>
                <tbody>
                  {data.cashflows.schedule.map((r) => (
                    <tr key={r.period}>
                      <td>{r.period}</td><td>{r.yearsFromNow}</td><td>{money(r.coupon)}</td>
                      <td>{r.principal ? money(r.principal) : '-'}</td><td>{money(r.total)}</td><td>{money(r.cumulative)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
