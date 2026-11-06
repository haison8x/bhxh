import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  heSo, tyLeDong, quyDoiNam, expandMonths,
  parseSalaryK, parseThang, validateRows, parseSavedState,
  binhQuan, thongKeDong, chiTiet, tinhLuongHuu, tinhMotLan, duLieuMau,
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

const P = (fy, fm, ty, tm, k) => ({ from: { y: fy, m: fm }, to: { y: ty, m: tm }, salaryK: k });

test('binhQuan applies coefficients', () => {
  const m = expandMonths([P(2010, 1, 2010, 12, 5000), P(2024, 1, 2024, 12, 10000)]);
  assert.equal(Math.round(binhQuan(m)), 10050000);
});

test('thongKeDong across 05/2017 rate change', () => {
  assert.deepEqual(thongKeDong(expandMonths([P(2017, 5, 2017, 6, 10000)])), { cty: 3500000, nld: 1600000 });
});

test('chiTiet splits by year', () => {
  const r = chiTiet([P(2012, 7, 2015, 3, 10000)]);
  assert.deepEqual(r.map(x => [x.tu.y, x.tu.m, x.den.m, x.soThang, x.heSo]),
    [[2012, 7, 12, 6, 1.51], [2013, 1, 12, 12, 1.42], [2014, 1, 12, 12, 1.36], [2015, 1, 3, 3, 1.36]]);
});

test('pension: nu 15 nam = 45%', () => {
  const r = tinhLuongHuu('nu', [P(2025, 1, 2039, 12, 10000)]);
  assert.equal(r.tyLe, 45); assert.equal(r.luongHuu, 4500000); assert.equal(r.apSan, false);
});

test('pension: nam 15 nam = 40%', () => {
  assert.equal(tinhLuongHuu('nam', [P(2025, 1, 2039, 12, 10000)]).luongHuu, 4000000);
});

test('pension: nam 19y7m rounds to 20 → 45%', () => {
  assert.equal(tinhLuongHuu('nam', [P(2025, 1, 2044, 7, 10000)]).tyLe, 45);
});

test('pension: nam 19y3m → 44.5%', () => {
  const r = tinhLuongHuu('nam', [P(2025, 1, 2044, 3, 10000)]);
  assert.equal(r.tyLe, 44.5); assert.equal(r.luongHuu, 4450000);
});

test('pension: nu 14y11m not eligible', () => {
  const r = tinhLuongHuu('nu', [P(2025, 1, 2039, 11, 10000)]);
  assert.equal(r.duDieuKien, false); assert.equal(r.luongHuu, 0);
});

test('pension: nu 32 nam → 75% + trợ cấp 2 năm vượt', () => {
  const r = tinhLuongHuu('nu', [P(2025, 1, 2056, 12, 10000)]);
  assert.equal(r.tyLe, 75); assert.equal(r.luongHuu, 7500000);
  assert.equal(r.namVuot, 2); assert.equal(r.troCapMotLan, 10000000);
});

test('pension: floor at mức tham chiếu for ≥ 20 năm', () => {
  const r = tinhLuongHuu('nam', [P(2025, 1, 2044, 12, 1000)]);
  assert.equal(r.luongHuu, 2530000); assert.equal(r.apSan, true);
});

test('pension: row order does not matter', () => {
  const a = [P(2010, 1, 2010, 12, 5000), P(2024, 1, 2038, 12, 10000)];
  assert.deepEqual(tinhLuongHuu('nam', a), tinhLuongHuu('nam', [...a].reverse()));
});

test('mot lan: straddles 2014, odd months move to post-2014', () => {
  const r = tinhMotLan([P(2012, 7, 2015, 3, 10000)]);
  assert.equal(r.namTruoc2014, 1); assert.equal(r.namTu2014, 2);
  assert.equal(r.soTien, 77500000);
});

test('mot lan: under 12 months uses 22%', () => {
  assert.equal(tinhMotLan([P(2025, 1, 2025, 6, 10000)]).soTien, 13200000);
});

test('mot lan: under 12 months capped at 2 × bình quân', () => {
  assert.equal(tinhMotLan([P(2025, 1, 2025, 11, 10000)]).soTien, 20000000);
});

test('mot lan: exactly 12 months from 2025 = 2 × bq', () => {
  assert.equal(tinhMotLan([P(2025, 1, 2025, 12, 10000)]).soTien, 20000000);
});

// ---------- Final review fixes ----------

test('parseThang accepts other separators and bare digits (iOS numeric keypad)', () => {
  assert.deepEqual(parseThang('122020'), { y: 2020, m: 12 });
  assert.deepEqual(parseThang('12.2020'), { y: 2020, m: 12 });
  assert.deepEqual(parseThang('12-2020'), { y: 2020, m: 12 });
  assert.deepEqual(parseThang('1 2020'), { y: 2020, m: 1 });
  assert.equal(parseThang('2020'), null);
});

test('validateRows: warning when salary looks typed in millions', () => {
  const r = validateRows([{ from: '01/2020', to: '12/2020', salary: '15' }], T);
  assert.equal(r.errors.length, 0);
  assert.deepEqual(r.warnings.map(w => w.message),
    ['Dòng 1: mức lương có vẻ quá thấp — nhập theo nghìn đồng (15 triệu → 15000).']);
});

test('chiTiet splits at contribution-rate changes and reports the rates', () => {
  const r = chiTiet([P(2017, 1, 2017, 12, 10000)]);
  assert.deepEqual(r.map(x => [x.tu.m, x.den.m, x.tyLeNld, x.tyLeCty, x.nld, x.cty]),
    [[1, 5, 8, 18, 4000000, 9000000], [6, 12, 8, 17, 5600000, 11900000]]);
});

test('validateRows: overlap error lists both rows for highlighting', () => {
  const r = validateRows([
    { from: '01/2020', to: '12/2020', salary: '10000' },
    { from: '06/2020', to: '12/2021', salary: '12000' }], T);
  assert.deepEqual(r.errors[0].rows, [1, 2]);
});

// ---------- Deferred minors ----------

test('validateRows: exact warning text for salary typed in full đồng', () => {
  const r = validateRows([{ from: '01/2020', to: '12/2020', salary: '15000000' }], T);
  assert.deepEqual(r.warnings.map(w => w.message),
    ['Dòng 1: mức lương có vẻ quá cao — nhập theo nghìn đồng (15 triệu → 15000).']);
});

test('parseSalaryK rejects decimals, keeps thousand separators', () => {
  assert.equal(parseSalaryK('15.5'), null);
  assert.equal(parseSalaryK('15,25'), null);
  assert.equal(parseSalaryK('1.500.000'), 1500000);
  assert.equal(parseSalaryK('15.000'), 15000);
});

test('validateRows: reports every row overlapping an earlier long row', () => {
  const r = validateRows([
    { from: '01/2010', to: '12/2020', salary: '10000' },
    { from: '01/2012', to: '12/2013', salary: '10000' },
    { from: '01/2015', to: '12/2016', salary: '10000' }], T);
  assert.deepEqual(r.errors.map(e => e.rows), [[1, 2], [1, 3]]);
});

test('mot lan: reports total months of average salary', () => {
  assert.equal(tinhMotLan([P(2012, 7, 2015, 3, 10000)]).soThangHuong, 5.5);
  assert.equal(tinhMotLan([P(2025, 1, 2025, 6, 10000)]).soThangHuong, null);
});

// ---------- Dữ liệu mẫu ----------

test('duLieuMau: mức đóng cao nhất từ 01/2007 đến tháng trước, liền mạch, không lỗi/cảnh báo', () => {
  const rows = duLieuMau(T);
  assert.equal(rows[0].from, '01/2007');
  assert.equal(rows[0].salary, '9000');
  assert.equal(rows.at(-1).to, '10/2026');
  assert.equal(rows.at(-1).salary, '50600');
  const r = validateRows(rows, T);
  assert.deepEqual(r.errors, []); assert.deepEqual(r.warnings, []);
  const months = expandMonths(r.periods);
  assert.equal(months.length, (2026 - 2007) * 12 + 10);
});

test('duLieuMau: 20 × lương cơ sở 2.340.000 cho 07/2024–06/2026', () => {
  const row = duLieuMau(T).find(x => x.from === '07/2024');
  assert.deepEqual(row, { from: '07/2024', to: '06/2026', salary: '46800' });
});

test('duLieuMau: cuts off rows that start after today', () => {
  const rows = duLieuMau({ y: 2026, m: 3 });
  assert.equal(rows.at(-1).to, '02/2026');
  assert.equal(rows.at(-1).salary, '46800');
});
