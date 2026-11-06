import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heSo, tyLeDong, quyDoiNam, expandMonths } from '../js/calc.js';

test('heSo', () => {
  assert.equal(heSo(1990), 5.81); assert.equal(heSo(1995), 4.91);
  assert.equal(heSo(2010), 1.96); assert.equal(heSo(2024), 1.03);
  assert.equal(heSo(2026), 1.00); assert.equal(heSo(2030), 1.00);
});

test('tyLeDong', () => {
  assert.deepEqual(tyLeDong(1990, 1), { cty: 15, nld: 5 });
  assert.deepEqual(tyLeDong(2008, 12), { cty: 15, nld: 5 });
  assert.deepEqual(tyLeDong(2010, 1), { cty: 16, nld: 6 });
  assert.deepEqual(tyLeDong(2013, 12), { cty: 17, nld: 7 });
  assert.deepEqual(tyLeDong(2017, 5), { cty: 18, nld: 8 });
  assert.deepEqual(tyLeDong(2017, 6), { cty: 17, nld: 8 });
  assert.deepEqual(tyLeDong(2026, 11), { cty: 17, nld: 8 });
});

test('quyDoiNam', () => {
  for (const [n, y] of [[0, 0], [5, 0.5], [11, 1], [180, 15], [181, 15.5], [186, 15.5], [187, 16], [235, 20]])
    assert.equal(quyDoiNam(n), y);
});

test('expandMonths sorts and spans years', () => {
  const r = expandMonths([
    { from: { y: 2025, m: 1 }, to: { y: 2025, m: 2 }, salaryK: 20000 },
    { from: { y: 2024, m: 11 }, to: { y: 2024, m: 12 }, salaryK: 10000 },
  ]);
  assert.deepEqual(r.map(e => [e.y, e.m, e.salary]),
    [[2024, 11, 10000000], [2024, 12, 10000000], [2025, 1, 20000000], [2025, 2, 20000000]]);
});
