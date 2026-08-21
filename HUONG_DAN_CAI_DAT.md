# Hướng Dẫn Cài Đặt và Chạy Project (Dành Cho Thành Viên Nhóm)

Chào bạn, đây là tài liệu hướng dẫn từng bước để bạn có thể tự cài đặt và chạy hệ thống Backend này trên máy tính cá nhân.

---

## Phần 1: Cài đặt môi trường bắt buộc

Để chạy được dự án Backend này, máy tính của bạn cần cài đặt **Node.js**.
1. Truy cập trang web: [https://nodejs.org/](https://nodejs.org/)
2. Tải và cài đặt phiên bản **LTS** (Ví dụ: v18.x.x hoặc v20.x.x).
3. Cứ bấm "Next" cho đến khi hoàn tất.
4. Để kiểm tra xem đã cài đặt thành công chưa, mở **CMD** (hoặc Terminal) và gõ:
   ```bash
   node -v
   ```
   *Nếu hiện ra phiên bản (vd: `v18.17.0`) là đã thành công.*

---

## Phần 2: Cài đặt thư viện cho dự án

1. Giải nén thư mục source code (nếu tải file zip về).
2. Dùng phần mềm **Visual Studio Code (VS Code)** mở thư mục `vl_backend`.
3. Mở Terminal trong VS Code (Chọn thanh menu: `Terminal` -> `New Terminal`).
4. Trong Terminal, gõ lệnh sau để tải các thư viện cần thiết:
   ```bash
   npm install
   ```
   *Đợi 1-2 phút để máy tính tải các thư viện (express, mqtt, firebase...) về máy. Sẽ có thư mục `node_modules` xuất hiện.*

---

## Phần 3: Cấu hình biến môi trường (.env)

Dự án cần một file cấu hình ẩn có tên là `.env` để chạy.
1. Trong thư mục `vl_backend`, bạn sẽ thấy có một file tên là `.env.example`.
2. Hãy **copy** file đó và đổi tên bản copy thành `.env` (Lưu ý: chỉ là `.env`, không có chữ gì đằng trước dấu chấm).
3. Mở file `.env` ra, bạn có thể giữ nguyên cấu hình mặc định ban đầu để chạy thử ở chế độ mô phỏng (`FIREBASE_MODE=mock`, `DEV_EMBEDDED_BROKER=true`).

---

## Phần 4: Khởi động hệ thống

Bây giờ bạn đã sẵn sàng để chạy thử. Dự án cung cấp sẵn một số lệnh tiện lợi. Trên Terminal của VS Code, hãy gõ 1 trong các lệnh sau:

### Lựa chọn 1: Chạy mô phỏng (Khuyên dùng để test nghiệm thu)
Lệnh này sẽ bật Server Backend, đồng thời tự động tạo ra một mạch "ESP32 ảo" liên tục gửi dữ liệu (SpO2, Nhịp tim giả lập) về Backend để kiểm tra hệ thống cảnh báo.
```bash
npm run simulate:esp32
```
*Bạn sẽ thấy log màn hình nhảy liên tục báo hiệu dữ liệu đang được nhận và xử lý.*

### Lựa chọn 2: Chạy để test với phần cứng thật
Nếu bạn là người giữ mạch ESP32 thật và muốn kết nối mạch thật vào Backend:
```bash
npm start
```
*Lưu ý: Nếu dùng mạch thật, hãy đọc thêm file `CONNECT_ESP32.md` để biết cách cấu hình mạng Wi-Fi và MQTT nhé.*

---

## Phần 5: Hướng dẫn test nhanh API (Tùy chọn)

Sau khi server đã chạy (Port 3000), bạn có thể test thử xem API có hoạt động không bằng cách mở trình duyệt web (Chrome/Edge) và truy cập:
- Lấy dữ liệu mới nhất: [http://localhost:3000/api/v1/latest?deviceId=esp32_01](http://localhost:3000/api/v1/latest?deviceId=esp32_01)
- Lấy lịch sử đo: [http://localhost:3000/api/v1/history?deviceId=esp32_01](http://localhost:3000/api/v1/history?deviceId=esp32_01)

*(Nếu trình duyệt trả về một cục chữ có ngoặc nhọn `{...}` thì tức là thành công!)*

**Chúc bạn setup thành công! Có lỗi gì thì chụp màn hình Terminal gửi lại nhóm nhé.**
