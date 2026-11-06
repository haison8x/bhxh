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


// Lương tối thiểu chung / lương cơ sở (nghìn đồng) theo thời điểm, dùng để tạo dữ liệu mẫu công khai
// với mức đóng BHXH cao nhất = 20 lần mức này. Thêm dòng mới khi lương cơ sở thay đổi.
export const LUONG_CO_SO = [
  { tu: { y: 2005, m: 10 }, k: 350 },  // NĐ 118/2005
  { tu: { y: 2006, m: 10 }, k: 450 },  // NĐ 94/2006
  { tu: { y: 2008, m: 1 }, k: 540 },   // NĐ 166/2007
  { tu: { y: 2009, m: 5 }, k: 650 },   // NĐ 33/2009
  { tu: { y: 2010, m: 5 }, k: 730 },   // NĐ 28/2010
  { tu: { y: 2011, m: 5 }, k: 830 },   // NĐ 22/2011
  { tu: { y: 2012, m: 5 }, k: 1050 },  // NĐ 31/2012
  { tu: { y: 2013, m: 7 }, k: 1150 },  // NĐ 66/2013
  { tu: { y: 2016, m: 5 }, k: 1210 },  // NĐ 47/2016
  { tu: { y: 2017, m: 7 }, k: 1300 },  // NĐ 47/2017
  { tu: { y: 2018, m: 7 }, k: 1390 },  // NĐ 72/2018
  { tu: { y: 2019, m: 7 }, k: 1490 },  // NĐ 38/2019
  { tu: { y: 2023, m: 7 }, k: 1800 },  // NĐ 24/2023
  { tu: { y: 2024, m: 7 }, k: 2340 },  // NĐ 73/2024
  { tu: { y: 2026, m: 7 }, k: 2530 },  // NĐ 161/2026
];
