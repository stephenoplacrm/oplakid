# Oplakid (Bé Gõ Phím): ghi chú cho Claude Code

Web app luyện gõ 10 ngón cho trẻ tiểu học. Chạy tại https://oplakid.com.
Render tự deploy mỗi khi có commit vào nhánh `main`.

## Cấu trúc
- `server.js`: Express, tài khoản phụ huynh (scrypt, cookie phiên), API `/api/*`, WebSocket `/ws` (ai đang online).
- `races.js`: quản lý cuộc đua trên máy chủ (1v1, 3v3, 5v5, đua với máy, phòng riêng, ghép theo Lớp 1 đến Lớp 5).
- `public/index.html`, `public/app.css`, `public/app.js`: toàn bộ giao diện, JavaScript thuần, không có bước build.
- `public/privacy.html`: chính sách quyền riêng tư (bản nháp).
- Dữ liệu: một file SQLite tại `DATABASE_PATH` (đĩa cố định `/data` trên Render).

## Quy tắc khi sửa
- Luôn làm trên nhánh mới và mở pull request; không commit thẳng vào `main`.
- Thêm file JS mới ở thư mục gốc thì phải thêm vào dòng `COPY` trong `Dockerfile`, nếu không server sẽ sập khi khởi động.
- Giữ nguyên các dòng cài `python3 make g++` trong `Dockerfile` (cần để build better-sqlite3 trên Render).
- Không đổi tên hay xoá cột trong bảng SQLite đang có. Muốn thêm dữ liệu thì thêm bảng hoặc cột mới, có giá trị mặc định.
- CSP chỉ cho phép script từ chính trang (`script-src 'self'`): không dùng script inline, không gọi CDN bên ngoài.
- Thư viện 3D (three.js r128) được phục vụ tại `/vendor/three.min.js` từ `node_modules`.
- Người dùng là trẻ em: không thêm tính năng nhắn tin tự do; biệt danh phải qua `cleanNick` trong `races.js`; người lạ không được thấy biệt danh trong Trường tiểu học OplaKid.
- Giao diện và thông báo viết bằng tiếng Việt, câu ngắn, dễ hiểu với trẻ lớp 1.

## Kiểm tra trước khi mở pull request
```bash
npm ci
node --check server.js && node --check races.js && node --check public/app.js
APP_ORIGIN=http://localhost:3000 node server.js   # mở http://localhost:3000, đăng ký, học 1 bài, đua với máy
```
