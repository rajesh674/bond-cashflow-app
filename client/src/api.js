async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.errors || ['Request failed']).join('. '));
  return data;
}

export const fetchCashflows = (b) => post('/api/cashflows', b);
export const fetchValuation = (b) => post('/api/valuation', b);
export const fetchSensitivity = (b) => post('/api/sensitivity', b);
