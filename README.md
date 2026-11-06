# Ước tính lương hưu & BHXH một lần

Trang web tĩnh giúp người lao động đóng BHXH bắt buộc tại doanh nghiệp ước tính:

- **lương hưu hằng tháng**, và
- **số tiền rút BHXH một lần**,

dựa trên quá trình đóng BHXH xem được trong app VssID, theo Luật BHXH 2024 (số 41/2024/QH15). Trang cũng thống kê tổng tiền BHXH mà người lao động và công ty đã đóng.

> **Lưu ý:** Kết quả chỉ mang tính tham khảo, không đảm bảo chính xác và không tư vấn bất kỳ phương án nào. Số liệu chính thức do cơ quan BHXH xác định.

Xem trang: https://haison8x.github.io/bhxh/

## Giả định chính

- Tính như thể nhận lương hưu hoặc rút một lần **ngay hôm nay**, không dự phóng tương lai.
- Chỉ tính BHXH bắt buộc khu vực tư nhân. Không tính các giai đoạn BHXH tự nguyện hay khu vực nhà nước.
- Không tính tuổi: giả định nghỉ hưu đúng tuổi, không trừ tỷ lệ do nghỉ hưu sớm, không kiểm tra điều kiện rút một lần.
- Mức lương nhập theo **nghìn đồng** (15 triệu → `15000`).

Chi tiết công thức xem [tài liệu thiết kế](docs/superpowers/specs/2026-11-06-bhxh-luong-huu-design.md).

## Chạy trên máy

Trang dùng ES modules nên cần chạy qua HTTP server, không mở trực tiếp file được:

```bash
python -m http.server 8000
# mở http://localhost:8000
```

## Kiểm thử

Cần Node 20 trở lên, không cần cài thêm gói nào:

```bash
npm test
```

## Cập nhật hằng năm

Mọi số liệu cố định nằm trong [js/data.js](js/data.js):

| Hằng số | Khi nào cập nhật |
|---|---|
| `HE_SO_TRUOT_GIA`, `HE_SO_NAM_AP_DUNG`, `HE_SO_NGUON` | Khi BHXH Việt Nam công bố bảng hệ số điều chỉnh tiền lương mới (thường đầu năm) |
| `MUC_THAM_CHIEU` | Khi mức lương cơ sở hoặc mức tham chiếu thay đổi |
| `TY_LE_DONG` | Khi tỷ lệ đóng BHXH thay đổi |

Sau khi sửa, chạy `npm test`. Một số test ghim giá trị của bảng cũ (ví dụ `heSo(2024) = 1.03`, mức sàn `2530000`), nên cập nhật số kỳ vọng trong [tests/calc.test.js](tests/calc.test.js) cho khớp với bảng mới.
