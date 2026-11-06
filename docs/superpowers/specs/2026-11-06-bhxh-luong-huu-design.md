# Thiết kế: Trang tính lương hưu & BHXH một lần (tham khảo)

Ngày: 2026-11-06 · Repo: https://github.com/haison8x/bhxh (GitHub Pages)

## 1. Mục đích

Người lao động làm **công ty tư nhân** (lương do doanh nghiệp quyết định) muốn biết **ước tính**:

- lương hưu hằng tháng nếu nhận lương hưu, hoặc
- số tiền nhận được nếu rút BHXH một lần,

dựa trên quá trình đóng BHXH mà họ xem được trong app **VssID** (Quản lý cá nhân → Quá trình tham gia → BHXH, bấm vào biểu tượng con mắt từng dòng để thấy mức lương).

Đã xác nhận: VssID là nguồn dữ liệu duy nhất thực tế. Trang tra cứu trên baohiemxahoi.gov.vn đòi tài khoản giao dịch điện tử, không dùng được → bỏ.

Trang **chỉ để tham khảo**, ghi rõ: *không đảm bảo chính xác, không tư vấn bất kỳ phương án nào*.

## 2. Mục tiêu / Không làm / Tránh

**Mục tiêu**
- Nhập quá trình đóng nhanh nhất có thể: chỉ một dòng mỗi khi mức lương thay đổi.
- Ra con số lương hưu / rút một lần, kèm thống kê tổng tiền BHXH người lao động và công ty đã đóng.
- Hiển thị chi tiết từng giai đoạn để người dùng tự dò lại.

**Không làm**
- Không tính cho khu vực nhà nước (lương theo hệ số, ngạch bậc).
- Không dự phóng tương lai: **coi như nhận lương hưu / rút một lần ngay hôm nay**, chỉ dựa trên quá trình đã nhập. Không có ô "năm dự kiến".
- Không hỏi ngày sinh, không tính tuổi nghỉ hưu, không tính giảm trừ nghỉ hưu trước tuổi (giả định nghỉ đúng tuổi).
- Không kiểm tra điều kiện được rút một lần — chỉ tính số tiền và ghi chú điều kiện.
- Không tính BHYT, BHTN, BHTNLĐ-BNN — chỉ BHXH.
- Chỉ BHXH **bắt buộc**, khu vực tư nhân. Không hỗ trợ giai đoạn BHXH tự nguyện hay giai đoạn làm nhà nước (không có cột "loại"); trang ghi một dòng hướng dẫn: "Chỉ nhập các giai đoạn đóng BHXH bắt buộc tại doanh nghiệp. Nếu có giai đoạn tự nguyện hoặc khu vực nhà nước, kết quả sẽ sai lệch." (*quyết định của Claude*, theo yêu cầu "chỉ công ty tư nhân").
- Không backend, không gửi dữ liệu đi đâu.

**Tránh (thất bại dù chạy được)**
- Người dùng nản vì nhập liệu cực.
- Trang trông như lời khuyên chọn hưu hay rút.
- Con số đưa ra mà không thấy được cách tính.

## 3. Ràng buộc kỹ thuật

- HTML + CSS + JavaScript thuần, không build step, không phụ thuộc thư viện ngoài (*quyết định của Claude*).
- Host trên GitHub Pages từ repo `haison8x/bhxh` (nhánh mặc định, thư mục gốc).
- Giao diện tiếng Việt, dùng tốt trên điện thoại (người dùng vừa mở VssID vừa nhập).
- Định dạng số kiểu Việt Nam: `15.000.000 đ`.

## 4. Nhập liệu

Một khối nhập dùng chung cho cả hai tab (*quyết định của Claude* — giới tính và quá trình đóng giống nhau ở hai tab, nhập một lần):

- **Giới tính:** Nam / Nữ.
- **Quá trình đóng:** bảng, mỗi dòng gồm
  - Từ tháng (MM/YYYY)
  - Đến tháng (MM/YYYY), tính cả hai đầu
  - Mức lương đóng BHXH, **nhập theo nghìn đồng** (15 triệu → nhập `15000`). Bên cạnh hiển thị ngay giá trị đầy đủ `15.000.000 đ`.
  - Nút xóa dòng; nút "Thêm dòng" (*đề xuất:* dòng mới tự điền "từ tháng" = tháng kế tiếp của dòng trước).
- Hướng dẫn ngắn: lấy số ở đâu trong VssID; gộp các dòng liền nhau có cùng mức lương thành một dòng.
- **Kiểm tra hợp lệ:** đến tháng ≥ từ tháng; lương > 0; các giai đoạn không chồng lấn (báo lỗi rõ dòng nào). Giai đoạn vượt quá tháng hiện tại → cảnh báo, vẫn tính.
- **Lưu trên máy:** tự lưu giới tính + quá trình đóng vào `localStorage` (bọc try/catch); mở lại trang thì điền lại. Có nút "Xóa dữ liệu".

## 5. Kết quả — hai tab

Tab **Lương hưu** và tab **Rút BHXH một lần**. Mỗi tab hiển thị:

1. Con số chính (lương hưu hằng tháng / số tiền rút một lần).
2. Tổng thời gian đóng (x năm y tháng), mức bình quân tiền lương, tỷ lệ hưởng hoặc số tháng hưởng.
3. Thống kê: **tổng tiền BHXH người lao động đã đóng** và **tổng tiền BHXH công ty đã đóng** (theo lương danh nghĩa, chưa trượt giá — *quyết định của Claude*).
4. Bảng chi tiết theo từng giai đoạn (tách theo năm dương lịch vì hệ số theo năm): số tháng, lương, hệ số trượt giá, lương sau điều chỉnh, tiền NLĐ đóng, tiền công ty đóng.
5. Ghi chú: kết quả tính theo mặt bằng giá hiện nay; bảng hệ số và tỷ lệ đóng áp dụng.

Lưu ý miễn trừ hiển thị cố định trên trang (đầu hoặc cuối, luôn thấy được): *"Kết quả chỉ mang tính tham khảo, không đảm bảo chính xác và không tư vấn bất kỳ phương án nào. Số liệu chính thức do cơ quan BHXH xác định."*

## 6. Cách tính (Luật BHXH số 41/2024/QH15, hiệu lực 01/7/2025)

### 6.1 Mức bình quân tiền lương (Điều 72, 73)
Tính trên **toàn bộ thời gian đóng**:

```
bình quân = Σ (lương tháng × hệ số trượt giá của năm đóng) / tổng số tháng đóng
```

Hệ số trượt giá: bảng cố định trong code (một file/đối tượng riêng, dễ sửa), người dùng không chỉnh được. Năm không có trong bảng (tương lai) → hệ số 1,00. Năm trước 1995 → dùng hệ số "Trước 1995".

**Chủ dự án chốt: dùng bảng áp dụng năm 2026** (Thông báo 340/BHXH-CSXH, hệ số tiền lương theo điểm a khoản 1 Điều 16 Nghị định 158/2025/NĐ-CP). Nguồn: https://nhandan.vn/ocop/he-so-dieu-chinh-tien-luong-thu-nhap-thang-da-dong-bao-hiem-xa-hoi-cua-nam-2026-post941554.html

| Năm | Hệ số | Năm | Hệ số | Năm | Hệ số |
|---|---|---|---|---|---|
| Trước 1995 | 5,81 | 2006 | 3,05 | 2017 | 1,28 |
| 1995 | 4,91 | 2007 | 2,81 | 2018 | 1,23 |
| 1996 | 4,65 | 2008 | 2,29 | 2019 | 1,20 |
| 1997 | 4,50 | 2009 | 2,14 | 2020 | 1,16 |
| 1998 | 4,18 | 2010 | 1,96 | 2021 | 1,14 |
| 1999 | 4,01 | 2011 | 1,65 | 2022 | 1,11 |
| 2000 | 4,07 | 2012 | 1,51 | 2023 | 1,07 |
| 2001 | 4,09 | 2013 | 1,42 | 2024 | 1,03 |
| 2002 | 3,94 | 2014 | 1,36 | 2025 | 1,00 |
| 2003 | 3,81 | 2015 | 1,36 | 2026 | 1,00 |
| 2004 | 3,54 | 2016 | 1,32 | | |
| 2005 | 3,27 | | | | |

Builder ghi trong code tên văn bản và năm áp dụng của bảng, và hiển thị dòng "Hệ số trượt giá áp dụng năm 2026" trên trang. Mỗi năm chủ dự án tự thay bảng.

### 6.2 Quy đổi tháng lẻ (Điều 5 khoản 6)
Khi tính mức hưởng: tháng lẻ 1–6 tháng = nửa năm, 7–11 tháng = một năm. Điều kiện "đủ 15 năm" tính theo tháng thực (≥ 180 tháng).

### 6.3 Lương hưu (Điều 64, 66)
- Tổng thời gian đóng < 180 tháng → báo "Chưa đủ 15 năm đóng BHXH để hưởng lương hưu", gợi ý xem tab rút một lần (chỉ là chỉ dẫn, không khuyên).
- N = số năm sau quy đổi tháng lẻ (6.2).
- **Nữ:** tỷ lệ = 45% + 2% × (N − 15), tối đa 75%.
- **Nam:** N ≥ 20: 45% + 2% × (N − 20), tối đa 75%; 15 ≤ N < 20: 40% + 1% × (N − 15).
- Lương hưu = tỷ lệ × bình quân.
- **Mức sàn (Điều 141 khoản 11):** nếu đóng ≥ 20 năm, lương hưu không thấp hơn mức tham chiếu (hiện bằng mức lương cơ sở). Giá trị là hằng số trong code: **2.530.000 đ** (lương cơ sở theo Nghị định 161/2026/NĐ-CP, từ 01/7/2026).
- **Trợ cấp một lần khi nghỉ hưu (Điều 68):** số năm đóng vượt 35 (nam) / 30 (nữ), quy đổi tháng lẻ, × 0,5 × bình quân. Hiển thị thành dòng riêng nếu > 0. (Không tính trường hợp ×2 cho năm đóng sau khi đủ điều kiện, vì không biết tuổi.)

### 6.4 BHXH một lần (Điều 70 khoản 3)
- Tách số tháng đóng trước 01/2014 (P) và từ 01/2014 (Q).
- Năm trước 2014 = floor(P / 12); tháng lẻ của P **chuyển sang** giai đoạn từ 2014 (*quyết định của Claude*, theo cách tính lâu nay của cơ quan BHXH; builder ghi chú nguồn nếu tìm được trong Nghị định 158/2025).
- Năm từ 2014 = (Q + P mod 12) quy đổi tháng lẻ theo 6.2.
- Số tiền = 1,5 × bình quân × năm trước 2014 + 2 × bình quân × năm từ 2014.
- Tổng thời gian < 12 tháng: số tiền = min(22% × Σ lương danh nghĩa, 2 × bình quân) (*quyết định của Claude*: "số tiền đã đóng" hiểu là 22% quỹ hưu trí-tử tuất).
- Ghi chú điều kiện (không kiểm tra): chỉ áp dụng cho người có thời gian đóng trước 01/7/2025; sau 12 tháng không đóng BHXH bắt buộc/tự nguyện; và các trường hợp khác theo Điều 70 Luật BHXH 2024 và Nghị định 158/2025/NĐ-CP.

### 6.5 Tiền BHXH đã đóng (thống kê)
Mỗi tháng: lương danh nghĩa × tỷ lệ theo thời điểm. Chỉ cột BHXH (không BHYT/BHTN/TNLĐ-BNN):

| Giai đoạn | Công ty | Người lao động |
|---|---|---|
| Trước 01/1995 | 15% | 5% (*Claude: dùng như 1995–2006*) |
| 01/1995 – 12/2006 (Nghị định 12/CP) | 15% | 5% |
| 01/2007 – 12/2009 | 15% | 5% |
| 01/2010 – 12/2011 | 16% | 6% |
| 01/2012 – 12/2013 | 17% | 7% |
| 01/2014 – 05/2017 | 18% | 8% |
| 06/2017 – nay | 17% | 8% |

Bảng này cũng là hằng số trong code, cạnh bảng hệ số. **Chủ dự án chốt:** dùng đúng cột "BHXH" trong bảng phân bổ tỷ lệ đóng như trên, giữ nguyên các con số kể cả khi các giai đoạn cũ có lẫn phần TNLĐ-BNN — không tự hiệu chỉnh. Con số 22% ở mục 6.4 là chuyện riêng, không cần khớp với bảng này. Tỷ lệ 1995–2006 lấy theo hiểu biết chung — builder đối chiếu Điều lệ BHXH ban hành kèm Nghị định 12/CP.

## 7. Phần để builder tự quyết
- Bố cục, màu sắc, kiểu chữ (gọn, dễ đọc trên điện thoại).
- Cấu trúc file (gợi ý: `index.html`, `style.css`, `app.js`, `data.js` cho hai bảng hằng số; phần tính toán tách thành hàm thuần để test được).
- Kiểu ô nhập tháng (select tháng/năm hoặc ô text MM/YYYY).
- Làm tròn hiển thị đến đồng.
- Kiểm thử: unit test cho hàm tính (chạy được trong trình duyệt hoặc Node, không bắt buộc framework), gồm các ca: nữ đúng 15 năm, nam 15–20 năm, nam 19 năm 7 tháng, vượt 35 năm, đóng < 12 tháng, đóng vắt qua 2014 có tháng lẻ.
- Cập nhật README: mô tả, cách cập nhật bảng hệ số mỗi năm.

## 8. Quyết định của Claude (để chủ dự án kiểm tra)
- Khối nhập dùng chung cho hai tab.
- Thống kê tiền đóng theo lương danh nghĩa.
- Tháng lẻ trước 2014 chuyển sang giai đoạn từ 2014.
- Đóng < 12 tháng: dùng 22%.
- Trước 1995 dùng tỷ lệ đóng 15%/5%.
- Nam/nữ quy đổi tháng lẻ trước khi tra tỷ lệ (vd nam 19 năm 7 tháng → 20 năm → 45%).
- Chỉ BHXH bắt buộc khu vực tư nhân; không hỗ trợ giai đoạn tự nguyện / nhà nước, chỉ ghi hướng dẫn.
- Có mức sàn lương hưu (≥ 20 năm) và trợ cấp một lần khi nghỉ hưu (vượt 35/30 năm).

## 9. Câu hỏi mở
Không còn. (Bảng hệ số đã chốt ở mục 6.1.)
