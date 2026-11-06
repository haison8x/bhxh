import {
  validateRows, parseSavedState, parseSalaryK, parseThang,
  tinhLuongHuu, tinhMotLan, chiTiet,
} from './calc.js';
import { HE_SO_NAM_AP_DUNG, HE_SO_NGUON, MUC_THAM_CHIEU } from './data.js';

const KEY_INPUT = 'bhxh-input-v1';
const KEY_TAB = 'bhxh-tab-v1';

const $ = (sel) => document.querySelector(sel);
const rowsEl = $('#rows');
const tpl = $('#row-tpl');
const messagesEl = $('#messages');
const panels = { huu: $('#panel-huu'), motlan: $('#panel-motlan') };

const nf = new Intl.NumberFormat('vi-VN');
const money = (n) => `${nf.format(Math.round(n))} đ`;
const pct = (n) => `${nf.format(n)}%`;
const thoiGian = (t) => `${Math.floor(t / 12)} năm ${t % 12} tháng`;
const thang = ({ y, m }) => `${String(m).padStart(2, '0')}/${y}`;
const nam = (n) => nf.format(n);

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* bỏ qua */ }
}
function storageRemove(key) {
  try { localStorage.removeItem(key); } catch { /* bỏ qua */ }
}

let state = parseSavedState(storageGet(KEY_INPUT));
if (state.rows.length === 0) state.rows = [{ from: '', to: '', salary: '' }];

function today() {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

// ---------- Nhập liệu ----------

function updatePreview(rowEl, salaryText) {
  const k = parseSalaryK(salaryText);
  rowEl.querySelector('.preview').textContent = k ? `= ${money(k * 1000)}` : '';
}

function renderRows() {
  rowsEl.replaceChildren();
  state.rows.forEach((r, i) => {
    const el = tpl.content.firstElementChild.cloneNode(true);
    el.dataset.index = String(i);
    el.querySelector('.no').textContent = String(i + 1);
    el.querySelector('.from').value = r.from;
    el.querySelector('.to').value = r.to;
    el.querySelector('.salary').value = r.salary;
    updatePreview(el, r.salary);
    rowsEl.append(el);
  });
}

rowsEl.addEventListener('input', (e) => {
  const rowEl = e.target.closest('.row');
  if (!rowEl) return;
  const r = state.rows[Number(rowEl.dataset.index)];
  for (const f of ['from', 'to', 'salary']) {
    if (e.target.classList.contains(f)) r[f] = e.target.value;
  }
  if (e.target.classList.contains('salary')) updatePreview(rowEl, e.target.value);
  update();
});

// Chuẩn hóa tháng về dạng MM/YYYY khi rời ô (vd "122020" → "12/2020").
rowsEl.addEventListener('focusout', (e) => {
  if (!e.target.matches('.from, .to')) return;
  const t = parseThang(e.target.value);
  if (!t || e.target.value === thang(t)) return;
  e.target.value = thang(t);
  const r = state.rows[Number(e.target.closest('.row').dataset.index)];
  r[e.target.classList.contains('from') ? 'from' : 'to'] = e.target.value;
  update();
});

rowsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.del');
  if (!btn) return;
  const i = Number(btn.closest('.row').dataset.index);
  state.rows.splice(i, 1);
  if (state.rows.length === 0) state.rows.push({ from: '', to: '', salary: '' });
  renderRows();
  update();
});

$('#add-row').addEventListener('click', () => {
  const last = state.rows[state.rows.length - 1];
  const lastTo = last && parseThang(last.to);
  let from = '';
  if (lastTo) {
    const next = lastTo.m === 12 ? { y: lastTo.y + 1, m: 1 } : { y: lastTo.y, m: lastTo.m + 1 };
    from = thang(next);
  }
  state.rows.push({ from, to: '', salary: '' });
  renderRows();
  update();
  const inputs = rowsEl.querySelectorAll('.row:last-child input');
  (from ? inputs[1] : inputs[0]).focus();
});

$('#clear-all').addEventListener('click', () => {
  if (!confirm('Xóa toàn bộ dữ liệu đã nhập?')) return;
  storageRemove(KEY_INPUT);
  state = { gender: 'nam', rows: [{ from: '', to: '', salary: '' }] };
  syncGender();
  renderRows();
  update();
});

document.querySelectorAll('input[name="gender"]').forEach((el) => {
  el.addEventListener('change', () => {
    state.gender = el.value;
    update();
  });
});

function syncGender() {
  document.querySelectorAll('input[name="gender"]').forEach((el) => {
    el.checked = el.value === state.gender;
  });
}

// ---------- Tabs ----------

function selectTab(name) {
  for (const btn of document.querySelectorAll('[role="tab"]')) {
    const on = btn.dataset.tab === name;
    btn.setAttribute('aria-selected', String(on));
  }
  for (const [k, p] of Object.entries(panels)) p.hidden = k !== name;
  storageSet(KEY_TAB, name);
}

document.querySelectorAll('[role="tab"]').forEach((btn) => {
  btn.addEventListener('click', () => selectTab(btn.dataset.tab));
});

// ---------- Kết quả ----------

function fact(label, value) {
  return `<div class="fact"><span>${label}</span><b>${value}</b></div>`;
}

function statsHtml(tk) {
  return `
    <h3>Tiền BHXH đã đóng <small class="note">(theo lương danh nghĩa)</small></h3>
    <div class="facts">
      ${fact('Người lao động đã đóng BHXH', money(tk.nld))}
      ${fact('Công ty đã đóng BHXH', money(tk.cty))}
    </div>`;
}

function detailHtml(periods) {
  const rows = chiTiet(periods).map((r) => `
    <tr>
      <td>${thang(r.tu)}</td><td>${thang(r.den)}</td><td>${r.soThang}</td>
      <td>${nf.format(r.luong)}</td><td>${nf.format(r.heSo)}</td><td>${nf.format(r.luongDieuChinh)}</td>
      <td>${r.tyLeNld}% / ${r.tyLeCty}%</td><td>${nf.format(r.nld)}</td><td>${nf.format(r.cty)}</td>
    </tr>`).join('');
  return `
    <h3>Chi tiết từng giai đoạn</h3>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Từ</th><th>Đến</th><th>Số tháng</th><th>Lương (đ)</th><th>Hệ số</th>
          <th>Lương sau điều chỉnh (đ)</th><th>Tỷ lệ đóng NLĐ / Cty</th><th>NLĐ đóng (đ)</th><th>Công ty đóng (đ)</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="note">Kết quả tính theo mặt bằng giá hiện nay. Hệ số trượt giá áp dụng năm ${HE_SO_NAM_AP_DUNG} (${HE_SO_NGUON}).</p>`;
}

function renderLuongHuu(gender, periods) {
  const r = tinhLuongHuu(gender, periods);
  const head = r.duDieuKien
    ? `<p class="headline-label">Lương hưu hằng tháng (ước tính)</p>
       <p class="headline">${money(r.luongHuu)}</p>`
    : `<p class="highlight">Chưa đủ 15 năm đóng BHXH để hưởng lương hưu. Xem tab Rút BHXH một lần để tham khảo số tiền.</p>`;
  const extra = [];
  if (r.apSan) extra.push(`<p class="note">Đã áp dụng mức lương hưu thấp nhất bằng mức tham chiếu ${money(MUC_THAM_CHIEU)}.</p>`);
  if (r.troCapMotLan > 0) {
    extra.push(`<p class="highlight">Trợ cấp một lần khi nghỉ hưu: <b>${money(r.troCapMotLan)}</b> (${nam(r.namVuot)} năm đóng vượt).</p>`);
  }
  panels.huu.innerHTML = `
    ${head}
    <div class="facts">
      ${fact('Tổng thời gian đóng', thoiGian(r.tongThang))}
      ${fact('Mức bình quân tiền lương', money(r.binhQuan))}
      ${r.duDieuKien ? fact('Tỷ lệ hưởng', pct(r.tyLe)) : ''}
    </div>
    ${extra.join('')}
    ${statsHtml(r.thongKe)}
    ${detailHtml(periods)}`;
}

function renderMotLan(periods) {
  const r = tinhMotLan(periods);
  const cach = r.duoi12Thang
    ? `<p class="note">Đóng dưới 12 tháng: nhận bằng 22% tổng tiền lương đã đóng, tối đa 2 tháng mức bình quân.</p>`
    : `<div class="facts">
         ${fact('Số năm đóng trước 2014', `${nam(r.namTruoc2014)} năm × 1,5 tháng`)}
         ${fact('Số năm đóng từ 2014', `${nam(r.namTu2014)} năm × 2 tháng`)}
       </div>`;
  panels.motlan.innerHTML = `
    <p class="headline-label">Số tiền rút BHXH một lần (ước tính)</p>
    <p class="headline">${money(r.soTien)}</p>
    <div class="facts">
      ${fact('Tổng thời gian đóng', thoiGian(r.tongThang))}
      ${fact('Mức bình quân tiền lương', money(r.binhQuan))}
    </div>
    ${cach}
    <p class="note">Điều kiện rút một lần (không kiểm tra ở đây): có thời gian đóng trước 01/7/2025; sau 12 tháng không đóng BHXH bắt buộc và tự nguyện; và các trường hợp khác theo Điều 70 Luật BHXH 2024 và Nghị định 158/2025/NĐ-CP.</p>
    ${statsHtml(r.thongKe)}
    ${detailHtml(periods)}`;
}

function renderMessages(errors, warnings) {
  messagesEl.replaceChildren(
    ...errors.map((m) => Object.assign(document.createElement('li'), { className: 'err', textContent: m.message })),
    ...warnings.map((m) => Object.assign(document.createElement('li'), { className: 'warn', textContent: m.message })),
  );
}

function markInvalidRows(errors) {
  const bad = new Set();
  for (const e of errors) {
    for (const row of e.rows ?? [e.row]) bad.add(row - 1);
  }
  rowsEl.querySelectorAll('.row').forEach((el) => {
    const on = bad.has(Number(el.dataset.index));
    el.classList.toggle('invalid', on);
    for (const input of el.querySelectorAll('input')) input.setAttribute('aria-invalid', String(on));
  });
}

function update() {
  storageSet(KEY_INPUT, JSON.stringify(state));
  const { periods, errors, warnings } = validateRows(state.rows, today());
  renderMessages(errors, warnings);
  markInvalidRows(errors);
  if (errors.length > 0) {
    for (const p of Object.values(panels)) p.innerHTML = '<p class="empty">Sửa lỗi ở trên để xem kết quả.</p>';
    return;
  }
  if (periods.length === 0) {
    for (const p of Object.values(panels)) p.innerHTML = '<p class="empty">Nhập quá trình đóng BHXH để xem kết quả.</p>';
    return;
  }
  renderLuongHuu(state.gender, periods);
  renderMotLan(periods);
}

// ---------- Khởi động ----------

syncGender();
renderRows();
selectTab(storageGet(KEY_TAB) === 'motlan' ? 'motlan' : 'huu');
update();
