# Hướng Dẫn Cài Đặt và Chạy Frontend (Node-RED)

Phần Frontend của đồ án sử dụng Node-RED để xây dựng giao diện Dashboard. Dưới đây là các bước để cài đặt và chạy Frontend.

## 1. Cài đặt Node-RED
Node-RED yêu cầu phải có Node.js (Bạn đã cài ở bước Backend).
Để cài đặt Node-RED, mở Terminal (hoặc CMD) và chạy lệnh sau:
```bash
npm install -g --unsafe-perm node-red
```

## 2. Khởi chạy Node-RED
Sau khi cài đặt xong, gõ lệnh sau để khởi chạy Node-RED:
```bash
node-red
```
Node-RED sẽ chạy ở địa chỉ mặc định là: `http://localhost:1880/`
Bạn hãy mở trình duyệt web và truy cập vào đường dẫn trên để vào giao diện quản lý (Editor) của Node-RED.

*Lưu ý: Nếu quá trình cài đặt dashboard bị lỗi, bạn có thể cần cài đặt thêm thư viện giao diện cho Node-RED bằng cách mở mục Manage Palette trong Node-RED và cài đặt gói `node-red-dashboard`.*

## 3. Import giao diện (Flow) của Đồ án
Trong thư mục `frontend` này có chứa file `NodeRED_Frontend_v2.json`. Đây là file chứa toàn bộ giao diện và logic của đồ án.
Cách đưa file này vào Node-RED:
1. Tại giao diện web của Node-RED, nhấn vào biểu tượng **Menu (3 dấu gạch ngang)** ở góc trên cùng bên phải.
2. Chọn **Import**.
3. Trong bảng hiện ra, nhấn vào nút chọn file (hoặc tab **select a file to import**).
4. Trỏ đường dẫn đến file `NodeRED_Frontend_v2.json` nằm trong thư mục `frontend` của source code.
5. Nhấn **Import**.
6. Lúc này các node sẽ xuất hiện trên màn hình, bạn hãy nhấn nút **Deploy** (màu đỏ) ở góc phải phía trên để lưu lại.

## 4. Truy cập Dashboard của Frontend
Giao diện hiển thị (Dashboard) cho người dùng sẽ nằm ở đường dẫn:
`http://localhost:1880/ui`

## 5. Kết hợp (Tích hợp) với Backend
Sau khi cài đặt xong Frontend, bạn cần chắc chắn Frontend đang kết nối đúng đến Backend (Node.js).
Hãy xem chi tiết ở file [HUONG_DAN_TICH_HOP.md](./HUONG_DAN_TICH_HOP.md) trong cùng thư mục này để biết cách cấu hình kết nối MQTT và API giữa 2 bên.
