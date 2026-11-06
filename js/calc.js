import { HE_SO_TRUOT_GIA, TY_LE_DONG, MUC_THAM_CHIEU, LUONG_CO_SO } from './data.js';

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
  const raw = String(text ?? '').replace(/\s/g, '');
  // Dấu . hoặc , chỉ được dùng để phân cách hàng nghìn (15.000), không nhận số thập phân (15.5).
  if (!/^\d+$/.test(raw) && !/^\d{1,3}([.,]\d{3})+$/.test(raw)) return null;
  const s = raw.replace(/[.,]/g, '');
  const n = Number(s);
  return n > 0 ? n : null;
}

export function parseThang(text) {
  // Chấp nhận mọi dấu phân cách hoặc không có (bàn phím số trên iPhone không có "/").
  const mt = /^\s*(\d{1,2})\D*(\d{4})\s*$/.exec(String(text ?? ''));
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
      errors.push({ row: i, message: `Dòng ${i}: tháng không hợp lệ (nhập dạng MM/YYYY hoặc MMYYYY).` });
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
    if (salaryK < 1000) {
      warnings.push({ row: i, message: `Dòng ${i}: mức lương có vẻ quá thấp — nhập theo nghìn đồng (15 triệu → 15000).` });
    }
    if (idx(to) > idx(today)) {
      warnings.push({ row: i, message: `Dòng ${i}: có tháng sau tháng hiện tại, vẫn được tính.` });
    }
    parsed.push({ row: i, period: { from, to, salaryK } });
  });

  const sorted = [...parsed].sort((a, b) => idx(a.period.from) - idx(b.period.from));
  // So mỗi dòng với dòng kết thúc muộn nhất trước nó, để không bỏ sót cặp trùng nào.
  let latest = null;
  for (const cur of sorted) {
    if (latest && idx(cur.period.from) <= idx(latest.period.to)) {
      const [a, b] = [latest.row, cur.row].sort((x, y) => x - y);
      errors.push({ row: a, rows: [a, b], message: `Dòng ${a} và dòng ${b} bị trùng thời gian.` });
    }
    if (!latest || idx(cur.period.to) > idx(latest.period.to)) latest = cur;
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

// ---------- Tính toán ----------

export function binhQuan(months) {
  if (months.length === 0) return 0;
  const tong = months.reduce((s, e) => s + e.salary * heSo(e.y), 0);
  return tong / months.length;
}

export function thongKeDong(months) {
  let nld = 0;
  let cty = 0;
  for (const e of months) {
    const r = tyLeDong(e.y, e.m);
    nld += (e.salary * r.nld) / 100;
    cty += (e.salary * r.cty) / 100;
  }
  return { nld: Math.round(nld), cty: Math.round(cty) };
}

export function chiTiet(periods) {
  const rows = [];
  const sorted = [...periods].sort((a, b) => idx(a.from) - idx(b.from));
  // Tách mỗi giai đoạn theo năm dương lịch (hệ số theo năm) và theo mốc đổi tỷ lệ đóng.
  for (const p of sorted) {
    const luong = p.salaryK * 1000;
    let group = null;
    for (let i = idx(p.from); i <= idx(p.to); i++) {
      const t = fromIdx(i);
      const r = tyLeDong(t.y, t.m);
      if (!group || group.tu.y !== t.y || group.tyLeNld !== r.nld || group.tyLeCty !== r.cty) {
        const hs = heSo(t.y);
        group = {
          tu: t, den: t, soThang: 0, luong, heSo: hs, luongDieuChinh: Math.round(luong * hs),
          tyLeNld: r.nld, tyLeCty: r.cty, nld: 0, cty: 0,
        };
        rows.push(group);
      }
      group.den = t;
      group.soThang += 1;
      group.nld += (luong * r.nld) / 100;
      group.cty += (luong * r.cty) / 100;
    }
  }
  for (const g of rows) {
    g.nld = Math.round(g.nld);
    g.cty = Math.round(g.cty);
  }
  return rows;
}

export function tinhLuongHuu(gender, periods) {
  const months = expandMonths(periods);
  const tongThang = months.length;
  const bq = binhQuan(months);
  const soNam = quyDoiNam(tongThang);
  const duDieuKien = tongThang >= 180;
  let tyLe = 0;
  let luongHuu = 0;
  let apSan = false;
  let namVuot = 0;
  let troCapMotLan = 0;
  if (duDieuKien) {
    if (gender === 'nu') tyLe = 45 + 2 * (soNam - 15);
    else if (soNam >= 20) tyLe = 45 + 2 * (soNam - 20);
    else tyLe = 40 + 1 * (soNam - 15);
    tyLe = Math.min(tyLe, 75);
    luongHuu = (tyLe / 100) * bq;
    if (tongThang >= 240 && luongHuu < MUC_THAM_CHIEU) {
      luongHuu = MUC_THAM_CHIEU;
      apSan = true;
    }
    const vuot = tongThang - (gender === 'nu' ? 360 : 420);
    if (vuot > 0) {
      namVuot = quyDoiNam(vuot);
      troCapMotLan = namVuot * 0.5 * bq;
    }
  }
  return {
    tongThang, binhQuan: Math.round(bq), duDieuKien, soNam, tyLe,
    luongHuu: Math.round(luongHuu), apSan, namVuot, troCapMotLan: Math.round(troCapMotLan),
    thongKe: thongKeDong(months),
  };
}

export function tinhMotLan(periods) {
  const months = expandMonths(periods);
  const tongThang = months.length;
  const bq = binhQuan(months);
  const moc = idx({ y: 2014, m: 1 });
  const thangTruoc2014 = months.filter((e) => idx(e) < moc).length;
  const thangTu2014 = tongThang - thangTruoc2014;
  // Tháng lẻ của giai đoạn trước 2014 được chuyển sang giai đoạn từ 2014 (cách tính lâu nay của
  // cơ quan BHXH; chưa tìm được điều khoản tương ứng trong Nghị định 158/2025/NĐ-CP).
  const namTruoc2014 = Math.floor(thangTruoc2014 / 12);
  const namTu2014 = quyDoiNam(thangTu2014 + (thangTruoc2014 % 12));
  const duoi12Thang = tongThang > 0 && tongThang < 12;
  let soTien;
  if (duoi12Thang) {
    const tongLuong = months.reduce((s, e) => s + e.salary, 0);
    soTien = Math.min(0.22 * tongLuong, 2 * bq);
  } else {
    soTien = 1.5 * bq * namTruoc2014 + 2 * bq * namTu2014;
  }
  return {
    tongThang, binhQuan: Math.round(bq), thangTruoc2014, thangTu2014,
    namTruoc2014, namTu2014, duoi12Thang, soTien: Math.round(soTien),
    soThangHuong: duoi12Thang ? null : 1.5 * namTruoc2014 + 2 * namTu2014,
    thongKe: thongKeDong(months),
  };
}


// ---------- Dữ liệu mẫu ----------

const fmtThang = ({ y, m }) => `${String(m).padStart(2, '0')}/${y}`;

// Quá trình đóng mẫu tròn 20 năm, kết thúc ở tháng trước `today`, mỗi giai đoạn đóng ở mức cao nhất
// (20 lần lương cơ sở), đổi mức đúng tháng lương cơ sở thay đổi.
export function duLieuMau(today) {
  const cuoi = idx(today) - 1;
  const dau = cuoi - 239;
  const rows = [];
  LUONG_CO_SO.forEach((r, k) => {
    const next = LUONG_CO_SO[k + 1];
    const tu = Math.max(idx(r.tu), dau);
    const den = Math.min(next ? idx(next.tu) - 1 : cuoi, cuoi);
    if (tu > den) return;
    rows.push({ from: fmtThang(fromIdx(tu)), to: fmtThang(fromIdx(den)), salary: String(20 * r.k) });
  });
  return rows;
}

// true nếu `soLan` lần nhấn gần nhất nằm trong `trongMs` mili giây (thời điểm tính bằng ms).
export function laChuoiNhanh(times, soLan, trongMs) {
  if (times.length < soLan) return false;
  const gan = times.slice(-soLan);
  return gan[gan.length - 1] - gan[0] <= trongMs;
}
