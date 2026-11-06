import { HE_SO_TRUOT_GIA, TY_LE_DONG } from './data.js';

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
