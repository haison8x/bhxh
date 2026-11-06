// Bảng số liệu cố định. Cập nhật hằng năm khi có văn bản mới (xem README).

// Hệ số điều chỉnh tiền lương tháng đã đóng BHXH, áp dụng năm 2026.
// Nguồn: Thông báo 340/BHXH-CSXH (điểm a khoản 1 Điều 16 Nghị định 158/2025/NĐ-CP).
export const HE_SO_NAM_AP_DUNG = 2026;
export const HE_SO_NGUON = 'Thông báo 340/BHXH-CSXH';
export const HE_SO_TRUOT_GIA = {
  truoc1995: 5.81,
  1995: 4.91, 1996: 4.65, 1997: 4.50, 1998: 4.18, 1999: 4.01,
  2000: 4.07, 2001: 4.09, 2002: 3.94, 2003: 3.81, 2004: 3.54,
  2005: 3.27, 2006: 3.05, 2007: 2.81, 2008: 2.29, 2009: 2.14,
  2010: 1.96, 2011: 1.65, 2012: 1.51, 2013: 1.42, 2014: 1.36,
  2015: 1.36, 2016: 1.32, 2017: 1.28, 2018: 1.23, 2019: 1.20,
  2020: 1.16, 2021: 1.14, 2022: 1.11, 2023: 1.07, 2024: 1.03,
  2025: 1.00, 2026: 1.00,
};

// Tỷ lệ đóng BHXH (%) — chỉ phần BHXH, không gồm BHYT, BHTN, BHTNLĐ-BNN.
// Mỗi dòng áp dụng từ tháng `tu` cho đến dòng kế tiếp. Trước 2007 lấy theo Nghị định 12/CP.
export const TY_LE_DONG = [
  { tu: { y: 1900, m: 1 }, cty: 15, nld: 5 },
  { tu: { y: 2010, m: 1 }, cty: 16, nld: 6 },
  { tu: { y: 2012, m: 1 }, cty: 17, nld: 7 },
  { tu: { y: 2014, m: 1 }, cty: 18, nld: 8 },
  { tu: { y: 2017, m: 6 }, cty: 17, nld: 8 },
];

// Mức tham chiếu = mức lương cơ sở (Nghị định 161/2026/NĐ-CP, từ 01/7/2026).
export const MUC_THAM_CHIEU = 2530000;
