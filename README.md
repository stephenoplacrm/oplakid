# OplaKid

Trang game cho trẻ em, hiện có hai game: **Cờ vua** (chơi với máy ở 3 mức hoặc với bạn online, có đồng hồ, điểm Elo và hạng từ Tân binh đến Đại kiện tướng, chọn câu nói nhanh trong ván, gợi ý và đi lại khi chơi với máy) và **Gõ phím** (luyện gõ 10 ngón cho trẻ tiểu học): 262 bài chia 10 cấp độ (50 bài thêm không bắt buộc để mở cấp độ sau; từ Cấp độ 6 bé gõ tiếng Việt bằng bộ gõ tiếng Việt có sẵn của máy); 6 trò chơi; nhạc nền thiếu nhi khi gõ; đua với bóng ma; đua trực tuyến với bạn; Trường tiểu học OplaKid 3D xem ai đang online.

## Có gì trong bản này

- **Tài khoản bố mẹ:** đăng ký, đăng nhập, đăng xuất, quên mật khẩu (gửi link qua email), đổi mật khẩu, xoá tài khoản.
  - Mật khẩu băm bằng scrypt.
  - Phiên đăng nhập lưu bằng cookie HttpOnly, có chống CSRF.
  - Giới hạn số lần thử để chống dò mật khẩu.
- **Hồ sơ bé:** mỗi tài khoản có nhiều bé. Bé đăng nhập bằng cách chọn hồ sơ của mình.
- **Lưu tiến độ trên máy chủ:** học trên máy nào cũng giữ nguyên tiến độ.
- **Thời gian thực qua WebSocket:** đếm số người online, phòng đua với bạn, ván cờ vua online và **Trường tiểu học OplaKid 3D, là trang chính**: hai lớp Gõ phím, một lớp Cờ vua (bạn nào đang chơi cờ thì ngồi vào bàn cờ), sân đua và Góc phụ huynh. Bấm vào lớp để vào game.
  - Các bạn đang online thấy con vật đại diện, biệt danh và cấp độ học của nhau. Dữ liệu cuộc đua chỉ hiện với người cùng tài khoản hoặc cùng phòng đua.
- **Đua trực tuyến do máy chủ điều khiển:**
  - Đua với bạn: tối đa 5 bé cùng cấp độ, lời mời hiện trong khung trò chuyện; sau 1 phút máy vào chơi ngang trình nếu còn ít bạn.
  - Đua với máy ở 3 mức Dễ, Vừa, Khó.
  - Danh sách cuộc đua đang chờ, hiện còn thiếu bao nhiêu người.
  - Chờ 40 giây chưa đủ người thì máy vào chơi cùng; sau 8 giây các bé có thể bấm "Đua luôn".
  - Máy chủ giữ đồng hồ và tự tính thời gian về đích, chặn tốc độ vô lý (trên khoảng 300 WPM).
  - Đua đội: về đích càng sớm, đội càng được nhiều điểm.
- - **Trang Chính sách quyền riêng tư** (`/privacy`): đây là **bản nháp**, cần điền thông tin công ty và nhờ luật sư rà soát.

## Chạy thử trên máy

Cần Node.js 22 trở lên.

```bash
npm install
cp .env.example .env      # sửa APP_ORIGIN=http://localhost:3000, bỏ trống SMTP_URL
npm run dev
```

Mở http://localhost:3000. Khi chưa cấu hình SMTP, link "Quên mật khẩu" được in ra cửa sổ chạy server thay vì gửi email.

## Đưa lên mạng

App là **một tiến trình Node.js** dùng **một file SQLite**. Khi host cần đảm bảo hai điều:

1. **Ổ đĩa được giữ lại** cho `DATABASE_PATH`. Nếu không, mỗi lần deploy sẽ mất hết tài khoản.
2. **Proxy cho phép WebSocket** tại đường dẫn `/ws`.

### Cách 1: VPS (ví dụ một máy Ubuntu) với Docker và nginx

```bash
docker build -t be-go-phim .
docker run -d --name be-go-phim --restart unless-stopped \
  -p 127.0.0.1:3000:3000 -v /srv/be-go-phim:/data --env-file .env be-go-phim
```

Cấu hình nginx (HTTPS lấy bằng certbot):

```nginx
server {
  server_name begophim.vn;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Trong `.env`, đặt `APP_ORIGIN=https://begophim.vn` (đúng tên miền thật) và `TRUST_PROXY=1`.

### Cách 2: Railway, Render, Fly.io

- Dùng Dockerfile có sẵn.
- Gắn một **persistent volume** vào `/data`.
- Khai báo các biến môi trường như trong `.env.example`.
- Chỉ chạy **1 instance**, vì danh sách người online đang nằm trong bộ nhớ của tiến trình (xem mục "Khi cần mở rộng").

## Biến môi trường

| Biến | Ý nghĩa |
|---|---|
| `APP_ORIGIN` | Địa chỉ web công khai, ví dụ `https://begophim.vn`. **Bắt buộc đúng**, vì dùng để chống CSRF, kiểm tra WebSocket và tạo link đặt lại mật khẩu. |
| `PORT` | Cổng app lắng nghe, mặc định 3000. |
| `DATABASE_PATH` | Đường dẫn file SQLite. |
| `SMTP_URL`, `MAIL_FROM` | Gửi email quên mật khẩu, ví dụ qua Gmail Workspace, Amazon SES hoặc Mailgun. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Bật nút “Đăng nhập/Đăng ký bằng Google”. Tạo OAuth Client (Web) trong Google Cloud Console, thêm Authorized redirect URI: `<APP_ORIGIN>/auth/google/callback`. Bỏ trống thì nút tự ẩn. |
| `ADMIN_EMAILS` | Danh sách email (cách nhau bằng dấu phẩy) của quản trị viên. Chỉ họ thấy mục “Góp ý đã nhận” trong Góc phụ huynh. |
| `ADMIN_EMAILS` (trang quản trị) | Cũng dùng để mở trang `/admin`: thống kê người dùng, hiệu năng máy chủ, tìm, khoá hoặc mở khoá, đăng xuất, tạo link đặt lại mật khẩu và xoá tài khoản ba mẹ. Quản trị viên là tài khoản bình thường có email nằm trong danh sách này. |
| `FEEDBACK_EMAIL` | (Không bắt buộc) Email nhận thông báo mỗi khi có góp ý mới; cần `SMTP_URL`. |
| `TRUST_PROXY` | Số lớp proxy đứng trước app. |
| `COOKIE_SECURE` | Tự bật khi `APP_ORIGIN` là https. |

## Sao lưu

Sao lưu file SQLite định kỳ, ví dụ mỗi đêm:

```bash
sqlite3 /srv/be-go-phim/be-go-phim.sqlite ".backup '/srv/backup/bgp-$(date +%F).sqlite'"
```

## Chưa có, nên làm trước khi mở rộng

- **Xác minh email khi đăng ký:** hiện tại ai cũng có thể đăng ký bằng email chưa xác minh.
- **"Cổng phụ huynh" cho Góc phụ huynh:** ví dụ hỏi một phép nhân trước khi vào. Các thao tác nguy hiểm như đổi mật khẩu hay xoá tài khoản đã yêu cầu mật khẩu, nhưng bé vẫn mở được Góc phụ huynh để xem và đổi cài đặt.
- **Lọc từ ngữ trong biệt danh:** biệt danh hiện cho mọi bạn đang online nên cần lọc từ tục kỹ (danh sách chặn trong `cleanNick` còn ngắn).
- **Khi cần mở rộng:** nếu chạy nhiều instance, chuyển danh sách người online và phòng đua sang Redis, chuyển SQLite sang PostgreSQL.
- **Thông báo xử lý dữ liệu cá nhân trẻ em:** rà soát với luật sư theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 và các nghị định hướng dẫn.
