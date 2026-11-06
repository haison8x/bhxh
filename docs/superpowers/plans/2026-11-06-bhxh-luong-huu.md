# Trang tính lương hưu & BHXH một lần — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Static Vietnamese web page (GitHub Pages) estimating monthly pension and one-time BHXH withdrawal from a private-sector worker's contribution history entered from VssID.

**Architecture:** Pure calculation module (`js/calc.js`) + constant tables (`js/data.js`) as ES modules, unit-tested with Node's built-in `node:test`. A thin UI module (`js/app.js`) reads the form, calls the calc functions, renders two result tabs, and persists input in `localStorage`. No build step, no runtime dependencies.

**Tech Stack:** HTML, CSS, vanilla JavaScript (ES modules), Node 24 `node --test` for tests, git + `gh` for publishing.

**Spec:** `docs/superpowers/specs/2026-11-06-bhxh-luong-huu-design.md`

## Global Constraints

- No runtime dependencies, no build step, no CDN. `package.json` exists only for `"type": "module"` and `"test": "node --test tests/"`; no `dependencies`/`devDependencies`.
- All UI text in Vietnamese. Money shown as `15.000.000 đ` (`Intl.NumberFormat('vi-VN')` + ` đ`), rounded to whole đồng.
- Salary input unit: **nghìn đồng** (`15000` = 15.000.000 đ). Internally everything is in đồng.
- "As of today": no projection; coefficient for years missing from the table (≥ 2027) = 1.00.
- Hệ số table = 2026 table from spec §6.1 (Thông báo 340/BHXH-CSXH); label shown on page: "Hệ số trượt giá áp dụng năm 2026".
- `MUC_THAM_CHIEU = 2_530_000` (Nghị định 161/2026/NĐ-CP).
- Contribution rates (BHXH column only), spec §6.5: before 01/2007 → cty 15 / nld 5; 2007–2009 → 15/5; 2010–2011 → 16/6; 2012–2013 → 17/7; 01/2014–05/2017 → 18/8; from 06/2017 → 17/8.
- Disclaimer text, always visible: *"Kết quả chỉ mang tính tham khảo, không đảm bảo chính xác và không tư vấn bất kỳ phương án nào. Số liệu chính thức do cơ quan BHXH xác định."*
- Scope line under the input: *"Chỉ nhập các giai đoạn đóng BHXH bắt buộc tại doanh nghiệp. Nếu có giai đoạn tự nguyện hoặc khu vực nhà nước, kết quả sẽ sai lệch."*
- Works at phone width (≥ 360px), no horizontal page scroll (detail table may scroll inside its own container).
- Local preview needs an HTTP server (ES modules): `python -m http.server 8000` or `npx serve`.

## Review Focus

1. **Salary typed in full đồng** (`15000000`) instead of thousands → per-row warning "Mức lương có vẻ quá cao — nhập theo nghìn đồng (15 triệu → 15000)" when salary > 20 × MUC_THAM_CHIEU (i.e. `salaryK > 50600`). Test in Task 2.
2. **Salary typed with separators** (`15.000`, `15,000`, ` 15000 `) → parsed as 15000. Test in Task 2.
3. **Half-filled or blank row** (user pressed "Thêm dòng" and stopped) → a fully blank row is ignored; a partially filled row is an error naming the row. Test in Task 2.
4. **Overlapping or out-of-order rows** → overlap is an error naming both rows, results hidden; order of rows does not change results. Tests in Task 2 and Task 3.
5. **Corrupt or missing saved data** (`localStorage` blocked, bad JSON, old shape) → page loads with empty form, no exception. Test in Task 2 (`parseSavedState`).

---

## File Structure

```
index.html            page shell: disclaimer, input form, tabs, result containers
css/style.css         layout + theme (light/dark via prefers-color-scheme)
js/data.js            HE_SO_TRUOT_GIA, HE_SO_NAM_AP_DUNG, HE_SO_NGUON, TY_LE_DONG, MUC_THAM_CHIEU
js/calc.js            pure functions (no DOM)
js/app.js             DOM wiring, rendering, localStorage
tests/calc.test.js    node:test tests for data.js + calc.js
package.json          {"type":"module","scripts":{"test":"node --test tests/"}}
README.md             description, local run, how to update the tables yearly
.gitignore            node_modules/
```

Data shapes used everywhere:
- `Period = { from: { y: number, m: number }, to: { y: number, m: number }, salaryK: number }` (m is 1–12, inclusive range)
- `Gender = 'nam' | 'nu'`
- `MonthEntry = { y: number, m: number, salary: number }` (salary in đồng)

---

### Task 1: Repo scaffold, constant tables, core helpers

**Files:**
- Create: `package.json`, `.gitignore`, `js/data.js`, `js/calc.js`, `tests/calc.test.js`

**Interfaces:**
- Produces (`js/data.js`):
  - `HE_SO_TRUOT_GIA: { truoc1995: 5.81, [year: number]: number }` — values 1995…2026 copied from spec §6.1
  - `HE_SO_NAM_AP_DUNG = 2026`, `HE_SO_NGUON = 'Thông báo 340/BHXH-CSXH'`
  - `TY_LE_DONG: Array<{ tu: {y,m}, cty: number, nld: number }>` ordered ascending, rows start 01/1900, 01/2010, 01/2012, 01/2014, 06/2017 (percent numbers)
  - `MUC_THAM_CHIEU = 2530000`
- Produces (`js/calc.js`):
  - `heSo(y: number): number`
  - `tyLeDong(y: number, m: number): { cty: number, nld: number }`
  - `quyDoiNam(soThang: number): number` — full years + (lẻ 0 → 0, 1–6 → 0.5, 7–11 → 1)
  - `expandMonths(periods: Period[]): MonthEntry[]` — one entry per month, sorted ascending, salary = salaryK × 1000

- [ ] **Step 1: Init repo and package**

```bash
git init -b main
git remote add origin https://github.com/haison8x/bhxh.git
```
Create `package.json` and `.gitignore` as in File Structure.

- [ ] **Step 2: Write failing tests** in `tests/calc.test.js` (import from `../js/calc.js`, use `node:test` + `node:assert/strict`):

```js
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
  for (const [n, y] of [[0,0],[5,0.5],[11,1],[180,15],[181,15.5],[186,15.5],[187,16],[235,20]])
    assert.equal(quyDoiNam(n), y);
});
test('expandMonths sorts and spans years', () => {
  const r = expandMonths([
    { from:{y:2025,m:1}, to:{y:2025,m:2}, salaryK: 20000 },
    { from:{y:2024,m:11}, to:{y:2024,m:12}, salaryK: 10000 },
  ]);
  assert.deepEqual(r.map(e => [e.y, e.m, e.salary]),
    [[2024,11,10000000],[2024,12,10000000],[2025,1,20000000],[2025,2,20000000]]);
});
```

- [ ] **Step 3: Run** `npm test` — Expected: FAIL (module/exports missing).

- [ ] **Step 4: Implement** `js/data.js` (tables verbatim from spec, with a comment naming the source document and year) and the four functions in `js/calc.js`. `heSo`: `y < 1995 → truoc1995`, missing key → 1.

- [ ] **Step 5: Run** `npm test` — Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore js/data.js js/calc.js tests/calc.test.js
git commit -m "feat: data tables and core calc helpers"
```

---

### Task 2: Input parsing, validation, saved state

**Files:**
- Modify: `js/calc.js`, `tests/calc.test.js`

**Interfaces:**
- Consumes: `MUC_THAM_CHIEU`, `expandMonths`
- Produces:
  - `parseSalaryK(text: string): number | null` — strips spaces, `.` and `,`; returns integer > 0 or `null`
  - `parseThang(text: string): { y, m } | null` — accepts `MM/YYYY` or `M/YYYY`, m 1–12, y 1960–2100
  - `RawRow = { from: string, to: string, salary: string }`
  - `validateRows(rows: RawRow[], today: { y, m }): { periods: Period[], errors: Array<{ row: number, message: string }>, warnings: Array<{ row: number, message: string }> }` — `row` is 1-based index in the input; fully blank rows skipped silently; `periods` only meaningful when `errors.length === 0`
  - `parseSavedState(text: string | null): { gender: Gender, rows: RawRow[] }` — default `{ gender: 'nam', rows: [] }` on null / bad JSON / wrong shape

Error/warning messages (exact):
- partial row: `Dòng ${i}: chưa nhập đủ từ tháng, đến tháng và mức lương.`
- bad month: `Dòng ${i}: tháng không hợp lệ (nhập dạng MM/YYYY).`
- to < from: `Dòng ${i}: "đến tháng" phải sau hoặc bằng "từ tháng".`
- bad salary: `Dòng ${i}: mức lương không hợp lệ.`
- overlap: `Dòng ${i} và dòng ${j} bị trùng thời gian.`
- warning, salary too high (`salaryK * 1000 > 20 * MUC_THAM_CHIEU`): `Dòng ${i}: mức lương có vẻ quá cao — nhập theo nghìn đồng (15 triệu → 15000).`
- warning, future (`to` after `today`): `Dòng ${i}: có tháng sau tháng hiện tại, vẫn được tính.`

- [ ] **Step 1: Write failing tests**

```js
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
  const r = validateRows([{from:'',to:'',salary:''},{from:'01/2020',to:'',salary:'10000'}], T);
  assert.equal(r.errors.length, 1); assert.equal(r.errors[0].row, 2);
});
test('validateRows: overlap names both rows', () => {
  const r = validateRows([
    {from:'01/2020',to:'12/2020',salary:'10000'},
    {from:'06/2020',to:'12/2021',salary:'12000'}], T);
  assert.equal(r.errors[0].message, 'Dòng 1 và dòng 2 bị trùng thời gian.');
});
test('validateRows: to before from', () => {
  const r = validateRows([{from:'05/2020',to:'01/2020',salary:'10000'}], T);
  assert.equal(r.errors[0].row, 1);
});
test('validateRows: warnings for full-dong salary and future month', () => {
  const r = validateRows([{from:'01/2026',to:'12/2026',salary:'15000000'}], T);
  assert.equal(r.errors.length, 0); assert.equal(r.warnings.length, 2);
});
test('validateRows: no warning at cap 50600', () => {
  const r = validateRows([{from:'01/2020',to:'12/2020',salary:'50600'}], T);
  assert.equal(r.warnings.length, 0);
});
test('parseSavedState tolerates garbage', () => {
  const d = { gender: 'nam', rows: [] };
  assert.deepEqual(parseSavedState(null), d); assert.deepEqual(parseSavedState('{bad'), d);
  assert.deepEqual(parseSavedState('{"gender":"x","rows":5}'), d);
  assert.deepEqual(parseSavedState('{"gender":"nu","rows":[{"from":"01/2020","to":"12/2020","salary":"10000"}]}'),
    { gender: 'nu', rows: [{ from: '01/2020', to: '12/2020', salary: '10000' }] });
});
```

- [ ] **Step 2: Run** `npm test` — Expected: new tests FAIL.
- [ ] **Step 3: Implement** the four functions in `js/calc.js`. Overlap check: sort parsed periods by start, compare each with the previous; report original 1-based row numbers, smaller first.
- [ ] **Step 4: Run** `npm test` — Expected: all PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: input parsing and validation"`

---

### Task 3: Average salary, pension, contribution stats, detail rows

**Files:**
- Modify: `js/calc.js`, `tests/calc.test.js`

**Interfaces:**
- Consumes: `heSo`, `tyLeDong`, `quyDoiNam`, `expandMonths`, `MUC_THAM_CHIEU`
- Produces:
  - `binhQuan(months: MonthEntry[]): number` — Σ(salary × heSo(y)) / months.length, unrounded
  - `thongKeDong(months: MonthEntry[]): { nld: number, cty: number }` — Σ salary × rate / 100, rounded to đồng
  - `chiTiet(periods: Period[]): Array<{ tu: {y,m}, den: {y,m}, soThang: number, luong: number, heSo: number, luongDieuChinh: number, nld: number, cty: number }>` — each period split at calendar-year boundaries, sorted ascending; `luongDieuChinh = luong × heSo`; nld/cty summed per month (rate may change inside a row, e.g. 2017)
  - `tinhLuongHuu(gender: Gender, periods: Period[]): { tongThang, binhQuan, duDieuKien: boolean, soNam: number, tyLe: number, luongHuu: number, apSan: boolean, namVuot: number, troCapMotLan: number, thongKe: {nld,cty} }` — money fields rounded to đồng; `binhQuan` rounded for output; when `!duDieuKien`, `tyLe/luongHuu/troCapMotLan = 0`

Rules (spec §6.2–6.3): eligible iff `tongThang >= 180`. `soNam = quyDoiNam(tongThang)`. Nữ: `45 + 2*(soNam-15)`, max 75. Nam: `soNam >= 20 → 45 + 2*(soNam-20)` max 75; else `40 + 1*(soNam-15)`. Floor: `tongThang >= 240 && luongHuu < MUC_THAM_CHIEU → luongHuu = MUC_THAM_CHIEU, apSan = true`. Excess: `vuot = tongThang - (nam ? 420 : 360)`; if > 0, `namVuot = quyDoiNam(vuot)`, `troCapMotLan = namVuot * 0.5 * binhQuan`.

Helper for tests: `const P = (fy,fm,ty,tm,k) => ({ from:{y:fy,m:fm}, to:{y:ty,m:tm}, salaryK:k })`.

- [ ] **Step 1: Write failing tests**

```js
test('binhQuan applies coefficients', () => {
  const m = expandMonths([P(2010,1,2010,12,5000), P(2024,1,2024,12,10000)]);
  assert.equal(Math.round(binhQuan(m)), 10050000);
});
test('thongKeDong across 05/2017 rate change', () => {
  assert.deepEqual(thongKeDong(expandMonths([P(2017,5,2017,6,10000)])), { cty: 3500000, nld: 1600000 });
});
test('chiTiet splits by year', () => {
  const r = chiTiet([P(2012,7,2015,3,10000)]);
  assert.deepEqual(r.map(x => [x.tu.y, x.tu.m, x.den.m, x.soThang, x.heSo]),
    [[2012,7,12,6,1.51],[2013,1,12,12,1.42],[2014,1,12,12,1.36],[2015,1,3,3,1.36]]);
});
test('pension: nu 15 nam = 45%', () => {
  const r = tinhLuongHuu('nu', [P(2025,1,2039,12,10000)]);
  assert.equal(r.tyLe, 45); assert.equal(r.luongHuu, 4500000); assert.equal(r.apSan, false);
});
test('pension: nam 15 nam = 40%', () => {
  assert.equal(tinhLuongHuu('nam', [P(2025,1,2039,12,10000)]).luongHuu, 4000000);
});
test('pension: nam 19y7m rounds to 20 → 45%', () => {
  assert.equal(tinhLuongHuu('nam', [P(2025,1,2044,7,10000)]).tyLe, 45);
});
test('pension: nam 19y3m → 44.5%', () => {
  const r = tinhLuongHuu('nam', [P(2025,1,2044,3,10000)]);
  assert.equal(r.tyLe, 44.5); assert.equal(r.luongHuu, 4450000);
});
test('pension: nu 14y11m not eligible', () => {
  const r = tinhLuongHuu('nu', [P(2025,1,2039,11,10000)]);
  assert.equal(r.duDieuKien, false); assert.equal(r.luongHuu, 0);
});
test('pension: nu 32 nam → 75% + trợ cấp 2 năm vượt', () => {
  const r = tinhLuongHuu('nu', [P(2025,1,2056,12,10000)]);
  assert.equal(r.tyLe, 75); assert.equal(r.luongHuu, 7500000);
  assert.equal(r.namVuot, 2); assert.equal(r.troCapMotLan, 10000000);
});
test('pension: floor at mức tham chiếu for ≥ 20 năm', () => {
  const r = tinhLuongHuu('nam', [P(2025,1,2044,12,1000)]);
  assert.equal(r.luongHuu, 2530000); assert.equal(r.apSan, true);
});
test('pension: row order does not matter', () => {
  const a = [P(2010,1,2010,12,5000), P(2024,1,2038,12,10000)];
  assert.deepEqual(tinhLuongHuu('nam', a), tinhLuongHuu('nam', [...a].reverse()));
});
```

- [ ] **Step 2: Run** `npm test` — Expected: new tests FAIL.
- [ ] **Step 3: Implement** the four functions in `js/calc.js`.
- [ ] **Step 4: Run** `npm test` — Expected: all PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: pension calculation and contribution stats"`

---

### Task 4: One-time withdrawal (BHXH một lần)

**Files:**
- Modify: `js/calc.js`, `tests/calc.test.js`

**Interfaces:**
- Consumes: `binhQuan`, `quyDoiNam`, `expandMonths`, `thongKeDong`
- Produces: `tinhMotLan(periods: Period[]): { tongThang, binhQuan, thangTruoc2014, thangTu2014, namTruoc2014, namTu2014, duoi12Thang: boolean, soTien, thongKe: {nld,cty} }` — `soTien` and `binhQuan` rounded to đồng

Rules (spec §6.4): `P` = months before 01/2014, `Q` = months from 01/2014. `namTruoc2014 = floor(P/12)`; `namTu2014 = quyDoiNam(Q + P % 12)`; `soTien = 1.5*bq*namTruoc2014 + 2*bq*namTu2014`. If `tongThang < 12`: `duoi12Thang = true`, `soTien = min(0.22 * Σ nominal salary, 2 * bq)`.

- [ ] **Step 1: Write failing tests**

```js
test('mot lan: straddles 2014, odd months move to post-2014', () => {
  const r = tinhMotLan([P(2012,7,2015,3,10000)]);
  assert.equal(r.namTruoc2014, 1); assert.equal(r.namTu2014, 2);
  assert.equal(r.soTien, 65576923);
});
test('mot lan: under 12 months uses 22%', () => {
  assert.equal(tinhMotLan([P(2025,1,2025,6,10000)]).soTien, 13200000);
});
test('mot lan: under 12 months capped at 2 × bình quân', () => {
  assert.equal(tinhMotLan([P(2025,1,2025,11,10000)]).soTien, 20000000);
});
test('mot lan: exactly 12 months from 2025 = 2 × bq', () => {
  assert.equal(tinhMotLan([P(2025,1,2025,12,10000)]).soTien, 20000000);
});
```

- [ ] **Step 2: Run** `npm test` — Expected: new tests FAIL.
- [ ] **Step 3: Implement** `tinhMotLan` in `js/calc.js`.
- [ ] **Step 4: Run** `npm test` — Expected: all PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: one-time withdrawal calculation"`

---

### Task 5: Page UI

**Files:**
- Create: `index.html`, `css/style.css`, `js/app.js`

**Interfaces:**
- Consumes: `validateRows`, `parseSavedState`, `parseSalaryK`, `tinhLuongHuu`, `tinhMotLan`, `chiTiet`, `HE_SO_NAM_AP_DUNG`, `HE_SO_NGUON`
- Produces: the page. `localStorage` key: `bhxh-input-v1`, value `JSON.stringify({ gender, rows })`.

Page structure (top to bottom):
1. `<title>Tính lương hưu BHXH</title>`, `lang="vi"`, viewport meta. Header title "Ước tính lương hưu & BHXH một lần".
2. Disclaimer box (exact text from Global Constraints), visually distinct, always visible.
3. Input section: gender radio (Nam/Nữ); short VssID guide ("Mở VssID → Quản lý cá nhân → Quá trình tham gia → BHXH, bấm biểu tượng con mắt ở từng dòng để xem mức lương. Gộp các dòng liền nhau có cùng mức lương thành một dòng."); scope line (exact text from Global Constraints); rows table — each row: `Từ tháng` text input (placeholder `MM/YYYY`, `inputmode="numeric"`), `Đến tháng`, `Mức lương (nghìn đồng)` (`inputmode="numeric"`), live preview `= 15.000.000 đ` under the salary input (via `parseSalaryK`), delete button; "Thêm dòng" button (new row's `from` prefilled with the month after the previous row's `to` when parsable); "Xóa dữ liệu" button (confirm dialog, clears storage and form).
4. Error/warning list under the table (errors red, warnings amber). When errors exist, result tabs show "Sửa lỗi ở trên để xem kết quả."
5. Tabs: "Lương hưu" | "Rút BHXH một lần" (buttons with `role="tab"`, `aria-selected`). Selected tab remembered in `localStorage` key `bhxh-tab-v1` (try/catch).
6. Tab Lương hưu: headline `luongHuu`/tháng (or "Chưa đủ 15 năm đóng BHXH để hưởng lương hưu. Xem tab Rút BHXH một lần để tham khảo số tiền." when not eligible); facts: tổng thời gian (`x năm y tháng`), mức bình quân, tỷ lệ hưởng (`44,5%`); note when `apSan` ("Đã áp dụng mức lương hưu thấp nhất bằng mức tham chiếu 2.530.000 đ"); line "Trợ cấp một lần khi nghỉ hưu: … (n năm đóng vượt)" when `troCapMotLan > 0`.
7. Tab Rút một lần: headline `soTien`; facts: tổng thời gian, mức bình quân, số năm trước 2014 × 1,5 tháng, số năm từ 2014 × 2 tháng (or the 22% explanation when `duoi12Thang`); conditions note: "Điều kiện rút một lần (không kiểm tra ở đây): có thời gian đóng trước 01/7/2025; sau 12 tháng không đóng BHXH bắt buộc và tự nguyện; và các trường hợp khác theo Điều 70 Luật BHXH 2024 và Nghị định 158/2025/NĐ-CP."
8. Both tabs: stats block "Người lao động đã đóng BHXH: …" / "Công ty đã đóng BHXH: …" (from `thongKe`, "theo lương danh nghĩa"); detail table from `chiTiet` (columns: Từ, Đến, Số tháng, Lương, Hệ số, Lương sau điều chỉnh, NLĐ đóng, Công ty đóng) inside an `overflow-x: auto` wrapper; note "Kết quả tính theo mặt bằng giá hiện nay. Hệ số trượt giá áp dụng năm 2026 (Thông báo 340/BHXH-CSXH)."
9. Footer: same disclaimer sentence, link to repo.

Behaviour: recalc + save on every `input`/`change` event (debounce not needed). Empty state (no valid rows): results show "Nhập quá trình đóng BHXH để xem kết quả." All `localStorage` access wrapped in try/catch; load via `parseSavedState`. CSS: color tokens on `:root`, dark overrides in `@media (prefers-color-scheme: dark)`, system font stack, max content width ~860px, 16px side padding; on narrow screens each input row stacks into a card.

- [ ] **Step 1: Write `index.html`, `css/style.css`, `js/app.js`** per the structure above.
- [ ] **Step 2: Syntax check** — Run: `node --check js/app.js && npm test` — Expected: no output from `--check`, tests PASS.
- [ ] **Step 3: Manual verification in browser** — Run `python -m http.server 8000`, open `http://localhost:8000`. Check: (a) enter the 8 VssID rows from the spec screenshot era (e.g. `01/2020–07/2020 15000`, `08/2020–12/2021 18000`, …) → both tabs render, numbers formatted `x.xxx.xxx đ`; (b) type `15000000` → amber warning; (c) make two rows overlap → red error, results hidden; (d) reload → data restored; (e) "Xóa dữ liệu" → empty; (f) narrow window to 360px → no horizontal page scroll; (g) dark mode readable; (h) browser console has no errors.
- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css js/app.js
git commit -m "feat: calculator page UI"
```

---

### Task 6: README and publish to GitHub Pages

**Files:**
- Modify: `README.md`
- Add: `docs/superpowers/specs/…`, `docs/superpowers/plans/…` (already on disk)

- [ ] **Step 1: Write `README.md`** (Vietnamese): one-paragraph description + disclaimer; link `https://haison8x.github.io/bhxh/`; local run (`python -m http.server 8000`); tests (`npm test`); **"Cập nhật hằng năm"**: edit `HE_SO_TRUOT_GIA`, `HE_SO_NAM_AP_DUNG`, `HE_SO_NGUON` in `js/data.js` (and `MUC_THAM_CHIEU` when lương cơ sở changes), run `npm test` (Task 1/3 tests pin old values — update expected numbers accordingly).
- [ ] **Step 2: Commit docs** — `git add README.md docs && git commit -m "docs: README, design and plan"`
- [ ] **Step 3: Push** — Confirm `git ls-remote origin` is empty (remote verified empty on 2026-11-06), then `git push -u origin main`.
- [ ] **Step 4: Enable Pages** — Run: `gh api -X POST repos/haison8x/bhxh/pages -f "source[branch]=main" -f "source[path]=/"` — Expected: JSON with `"html_url": "https://haison8x.github.io/bhxh/"`.
- [ ] **Step 5: Verify live** — after ~1 min, `curl -sI https://haison8x.github.io/bhxh/` → `HTTP/2 200`; open it in a browser and repeat check (a) from Task 5.
