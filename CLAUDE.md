# Oplakid (Bé Gõ Phím): ghi chú cho Claude Code

Trang game cho trẻ em, hiện có ba game: Đố vui (đố vui chọn đáp án và ô chữ, tiếng Anh và tiếng Việt), Cờ vua và Gõ phím (luyện gõ 10 ngón cho trẻ tiểu học). Chạy tại https://oplakid.com.
Render tự deploy mỗi khi có commit vào nhánh `main`.

## Cấu trúc
- `server.js`: Express, tài khoản phụ huynh (scrypt, cookie phiên), API `/api/*`, WebSocket `/ws` (ai đang online).
- `races.js`: quản lý cuộc đua trên máy chủ (đua tối đa 5 bạn cùng cấp độ, sau 1 phút máy vào chơi ngang trình nếu còn ít bạn; đua với máy; ghép theo Cấp độ 1 đến Cấp độ 10).
- `chessgames.js`: cờ vua online giữa hai bạn (máy chủ giữ bàn cờ, tự kiểm tra từng nước đi, giữ đồng hồ, xử lý đầu hàng, xin hoà, tính điểm Elo, câu nói nhanh có sẵn trong ván). Ván cờ chỉ lưu trong bộ nhớ, không ghi vào SQLite. Điểm Elo của bé nằm trong hồ sơ bé (`state.chess.elo`, đồng bộ như tiến độ gõ phím); máy chủ nhận điểm do trình duyệt báo lên nên chưa chống gian lận điểm.
- `public/chess.js`: luật cờ vua và máy chơi cờ (3 mức), dùng chung cho trình duyệt (`window.OplaChess`) và máy chủ (`require`). Kiểm tra bằng `node tests/chess.test.js` (perft trên các thế cờ chuẩn).
- Trang chính (sau khi chọn bé) là Khu vui chơi OplaKid 3D (`#s-world`, `openWorld()` trong `app.js`): một lớp Gõ phím, một lớp Đố vui, một lớp Cờ vua, sân đua, Góc phụ huynh. Có nút và biển bấm được để vào game. Bé đang ở màn nào thì ngồi ở chỗ đó (`presence.act`: learn, chess, race, parent; còn lại đi dạo sân trường).
- Hồ sơ công khai của bé: bảng `kid_profiles` trong SQLite (biệt danh, con vật, cấp độ gõ phím, Elo, ván thắng hoà thua, đố vui, lần online gần nhất; khoá theo tài khoản và mã hồ sơ, mã gửi cho bé khác chỉ là `hid` băm). Các bé bấm vào nhau để xem (`profile.get`), danh sách "Vừa online" lấy từ `profile.recent`. Dữ liệu do trình duyệt báo lên nên chưa chống gian lận. Xoá khi ba mẹ xoá tài khoản hoặc sau 60 ngày.
- Kết bạn: bảng `kid_friends` (a gửi lời mời cho b, state 0 chờ, 1 là bạn bè; khoá theo `userId:pid` như `kid_profiles`). Phải được đồng ý mới thành bạn; bạn bè mời nhau chơi cờ qua `friend.invite` (ván riêng `priv` trong `chessgames.js`, không hiện ở danh sách chờ hay khung chat). Không có nhắn tin tự do.
- `public/index.html`, `public/app.css`, `public/app.js`: toàn bộ giao diện, JavaScript thuần, không có bước build.
- Cấp độ 6 đến 10 gõ tiếng Việt: bé dùng bộ gõ tiếng Việt có sẵn của máy (ô `#vn-input`); ứng dụng chỉ so chữ, không tự ghép dấu. Kho chữ tiếng Việt nằm trong `app.js` (`VN`). Không thêm file JS riêng cho phần này.
- Lớp học chữ (trong lớp Đố vui, `lopPlay()` trong `app.js`): kho câu hỏi là file chữ `public/lop-hoc-chu.txt` (không phải JS), tải khi bé chơi; kiểm tra bằng `node tests/lopchu.test.js`. Lấy ý tưởng và một phần câu hỏi (Lịch sử, Tiếng Anh, Tiếng kêu, Từ trái nghĩa) từ github.com/workaipvlinh-byte/lop-hoc-chu theo giấy phép MIT, xem `THIRD-PARTY-LICENSES.md`; không dùng ảnh hay mã giao diện của họ (ảnh không thuộc MIT). Khi thêm câu hỏi: không có chuyện người lớn, không lộ đáp án trong gợi ý.
- `public/privacy.html`, `public/contact.html`: chính sách quyền riêng tư và trang liên hệ (thông tin người vận hành, email, nơi đặt máy chủ). Chính sách chưa được luật sư rà soát.
- Dữ liệu: một file SQLite tại `DATABASE_PATH` (đĩa cố định `/data` trên Render).

## Quy tắc khi sửa
- Luôn làm trên nhánh mới và mở pull request; không commit thẳng vào `main`.
- Thêm file JS mới ở thư mục gốc thì phải thêm vào dòng `COPY` trong `Dockerfile`, nếu không server sẽ sập khi khởi động.
- Giữ nguyên các dòng cài `python3 make g++` trong `Dockerfile` (cần để build better-sqlite3 trên Render).
- Không đổi tên hay xoá cột trong bảng SQLite đang có. Muốn thêm dữ liệu thì thêm bảng hoặc cột mới, có giá trị mặc định.
- CSP chỉ cho phép script từ chính trang (`script-src 'self'`): không dùng script inline, không gọi CDN bên ngoài.
- Thư viện 3D (three.js r128) được phục vụ tại `/vendor/three.min.js` từ `node_modules`.
- Người dùng là trẻ em: không thêm tính năng nhắn tin tự do; biệt danh phải qua `cleanNick` trong `races.js`; biệt danh hiện cho mọi bạn đang online trong Khu vui chơi OplaKid (chủ dự án đã đồng ý), lời mời đua và lời mời chơi cờ do máy chủ tự gửi vào khung chat; trong ván cờ bé chỉ chọn câu có sẵn (`CHESS_SAYS`), không gõ chữ; dữ liệu cuộc đua chỉ hiện với người cùng phòng đua hoặc cùng tài khoản.
- Giao diện và thông báo viết bằng tiếng Việt, câu ngắn, dễ hiểu với trẻ lớp 1.

## Kiểm tra trước khi mở pull request
```bash
npm ci
node --check server.js && node --check races.js && node --check chessgames.js && node --check public/app.js && node --check public/chess.js
node tests/chess.test.js && node tests/lopchu.test.js
APP_ORIGIN=http://localhost:3000 node server.js   # mở http://localhost:3000, đăng ký, học 1 bài, đua với máy
```
