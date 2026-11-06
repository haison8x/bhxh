// Tạo js/extra.js (dữ liệu cá nhân đã làm rối) từ js/secret-data.js (chỉ có trên máy, đã .gitignore).
// Chạy: npm run extra
import { writeFileSync } from 'node:fs';
import { DU_LIEU_BI_MAT } from '../js/secret-data.js';
import { maHoa } from '../js/calc.js';

const out = new URL('../js/extra.js', import.meta.url);
writeFileSync(out, `// Tạo tự động bằng "npm run extra". Không sửa tay.\nexport const EXTRA = '${maHoa(DU_LIEU_BI_MAT)}';\n`);
console.log(`Đã ghi js/extra.js (${DU_LIEU_BI_MAT.length} dòng).`);
