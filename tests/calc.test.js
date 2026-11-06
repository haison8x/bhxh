import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  heSo, tyLeDong, quyDoiNam, expandMonths,
  parseSalaryK, parseThang, validateRows, parseSavedState,
} from '../js/calc.js';

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

test('parseSalaryK', () => {
  assert.equal(parseSalaryK('15000'), 15000); assert.equal(parseSalaryK('15.000'), 15000);
  assert.equal(parseSalaryK(' 15,000 '), 15000); assert.equal(parseSalaryK(''), null);
  assert.equal(parseSalaryK('abc'), null); assert.equal(parseSalaryK('0'), null);
});

test('parseThang', () => {
  assert.deepEqual(parseThang('09/2025'), { y: 2025, m: 9 });
  assert.deepEqual(parseThang('9/2025'), { y: 2025, m: 9 });
  assert.equal(parseThang('13/2025'), null); assert.equal(parseThang('2025-09'), null);
});

const T = { y: 2026, m: 11 };

test('validateRows: blank row ignored, partial row errors', () => {
  const r = validateRows([{ from: '', to: '', salary: '' }, { from: '01/2020', to: '', salary: '10000' }], T);
  assert.equal(r.errors.length, 1); assert.equal(r.errors[0].row, 2);
});

test('validateRows: overlap names both rows', () => {
  const r = validateRows([
    { from: '01/2020', to: '12/2020', salary: '10000' },
    { from: '06/2020', to: '12/2021', salary: '12000' }], T);
  assert.equal(r.errors[0].message, 'Dòng 1 và dòng 2 bị trùng thời gian.');
});

test('validateRows: to before from', () => {
  const r = validateRows([{ from: '05/2020', to: '01/2020', salary: '10000' }], T);
  assert.equal(r.errors[0].row, 1);
});

test('validateRows: warnings for full-dong salary and future month', () => {
  const r = validateRows([{ from: '01/2026', to: '12/2026', salary: '15000000' }], T);
  assert.equal(r.errors.length, 0); assert.equal(r.warnings.length, 2);
});

test('validateRows: no warning at cap 50600', () => {
  const r = validateRows([{ from: '01/2020', to: '12/2020', salary: '50600' }], T);
  assert.equal(r.warnings.length, 0);
});

test('validateRows: valid rows produce periods', () => {
  const r = validateRows([{ from: '01/2020', to: '12/2020', salary: '10.000' }], T);
  assert.deepEqual(r.periods, [{ from: { y: 2020, m: 1 }, to: { y: 2020, m: 12 }, salaryK: 10000 }]);
});

test('parseSavedState tolerates garbage', () => {
  const d = { gender: 'nam', rows: [] };
  assert.deepEqual(parseSavedState(null), d); assert.deepEqual(parseSavedState('{bad'), d);
  assert.deepEqual(parseSavedState('{"gender":"x","rows":5}'), d);
  assert.deepEqual(parseSavedState('{"gender":"nu","rows":[{"from":"01/2020","to":"12/2020","salary":"10000"}]}'),
    { gender: 'nu', rows: [{ from: '01/2020', to: '12/2020', salary: '10000' }] });
});
