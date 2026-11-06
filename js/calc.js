import { HE_SO_TRUOT_GIA, TY_LE_DONG, MUC_THAM_CHIEU } from './data.js';

const idx = ({ y, m }) => y * 12 + (m - 1);
const fromIdx = (i) => ({ y: Math.floor(i / 12), m: (i % 12) + 1 });

export function heSo(y) {
  if (y < 1995) return HE_SO_TRUOT_GIA.truoc1995;
  return HE_SO_TRUOT_GIA[y] ?? 1;
}

export function tyLeDong(y, m) {
  const i = idx({ y, m });
  let rate = TY_LE_DONG[0];
  for (const r of TY_LE_DONG) if (idx(r.tu) <= i) rate = r;
  return { cty: rate.cty, nld: rate.nld };
}

// Quy đổi số tháng thành số năm: tháng lẻ 1–6 = nửa năm, 7–11 = một năm.
export function quyDoiNam(soThang) {
  const nam = Math.floor(soThang / 12);
  const le = soThang % 12;
  return nam + (le === 0 ? 0 : le <= 6 ? 0.5 : 1);
}

export function expandMonths(periods) {
  const out = [];
  for (const p of periods) {
    for (let i = idx(p.from); i <= idx(p.to); i++) {
      out.push({ ...fromIdx(i), salary: p.salaryK * 1000 });
    }
  }
  return out.sort((a, b) => idx(a) - idx(b));
}

// ---------- Nhập liệu ----------

export function parseSalaryK(text) {
  const s = String(text ?? '').replace(/[\s.,]/g, '');
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n > 0 ? n : null;
}

export function parseThang(text) {
  const mt = /^\s*(\d{1,2})\/(\d{4})\s*$/.exec(String(text ?? ''));
  if (!mt) return null;
  const m = Number(mt[1]);
  const y = Number(mt[2]);
  if (m < 1 || m > 12 || y < 1960 || y > 2100) return null;
  return { y, m };
}

const isBlank = (v) => String(v ?? '').trim() === '';

export function validateRows(rows, today) {
  const errors = [];
  const warnings = [];
  const parsed = [];
  rows.forEach((r, k) => {
    const i = k + 1;
    const blanks = [r.from, r.to, r.salary].filter(isBlank).length;
    if (blanks === 3) return;
    if (blanks > 0) {
      errors.push({ row: i, message: `Dòng ${i}: chưa nhập đủ từ tháng, đến tháng và mức lương.` });
      return;
    }
    const from = parseThang(r.from);
    const to = parseThang(r.to);
    if (!from || !to) {
      errors.push({ row: i, message: `Dòng ${i}: tháng không hợp lệ (nhập dạng MM/YYYY).` });
      return;
    }
    if (idx(to) < idx(from)) {
      errors.push({ row: i, message: `Dòng ${i}: "đến tháng" phải sau hoặc bằng "từ tháng".` });
      return;
    }
    const salaryK = parseSalaryK(r.salary);
    if (salaryK === null) {
      errors.push({ row: i, message: `Dòng ${i}: mức lương không hợp lệ.` });
      return;
    }
    if (salaryK * 1000 > 20 * MUC_THAM_CHIEU) {
      warnings.push({ row: i, message: `Dòng ${i}: mức lương có vẻ quá cao — nhập theo nghìn đồng (15 triệu → 15000).` });
    }
    if (idx(to) > idx(today)) {
      warnings.push({ row: i, message: `Dòng ${i}: có tháng sau tháng hiện tại, vẫn được tính.` });
    }
    parsed.push({ row: i, period: { from, to, salaryK } });
  });

  const sorted = [...parsed].sort((a, b) => idx(a.period.from) - idx(b.period.from));
  for (let k = 1; k < sorted.length; k++) {
    const prev = sorted[k - 1];
    const cur = sorted[k];
    if (idx(cur.period.from) <= idx(prev.period.to)) {
      const [a, b] = [prev.row, cur.row].sort((x, y) => x - y);
      errors.push({ row: a, message: `Dòng ${a} và dòng ${b} bị trùng thời gian.` });
    }
  }

  return { periods: parsed.map((p) => p.period), errors, warnings };
}

export function parseSavedState(text) {
  const fallback = { gender: 'nam', rows: [] };
  if (text == null) return fallback;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return fallback;
  }
  if (!data || (data.gender !== 'nam' && data.gender !== 'nu') || !Array.isArray(data.rows)) return fallback;
  const rows = data.rows
    .filter((r) => r && typeof r === 'object')
    .map((r) => ({ from: String(r.from ?? ''), to: String(r.to ?? ''), salary: String(r.salary ?? '') }));
  return { gender: data.gender, rows };
}
