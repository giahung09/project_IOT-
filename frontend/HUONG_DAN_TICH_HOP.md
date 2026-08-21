# HƯỚNG DẪN TÍCH HỢP FRONTEND (NODE-RED) & BACKEND (NODE.JS)

Tài liệu này giải thích cách Frontend và Backend giao tiếp với nhau trong hệ thống Giám sát SpO2 & Nhịp tim, giúp người phụ trách Backend (Node.js) và Frontend (Node-RED) dễ dàng ghép nối code khi làm việc độc lập.

---

## 1. Tổng Quan Kiến Trúc Giao Tiếp
Hệ thống sử dụng cơ chế Decoupled (phân tách độc lập), giao tiếp song song qua 2 giao thức:
1. **MQTT (Real-time):** Dành riêng cho dữ liệu luồng tốc độ cao, độ trễ thấp (Kim đồng hồ, Biểu đồ thời gian thực).
2. **REST API (HTTP):** Dành cho việc truy vấn dữ liệu đã lưu (Lịch sử, Cảnh báo) và thực thi các thao tác điều khiển (Tắt còi, Gửi lời nhắc).

---

## 2. Phần 1: Giao thức MQTT (Dữ liệu thời gian thực)

Frontend (Node-RED) đóng vai trò là một **MQTT Subscriber**.
- **MQTT Broker:** Mặc định Frontend đang kết nối tới cổng `1883` của máy chứa Backend. Backend phải mở MQTT Broker (sử dụng thư viện `aedes` hoặc Mosquitto).
- **Topic lắng nghe:** `24127541/device/data`
- **Format dữ liệu Backend/ESP32 cần gửi (Payload):**
  Frontend yêu cầu cấu trúc JSON chuẩn xác như sau:
  ```json
  {
    "spo2": 98,
    "bpm": 72
  }
  ```
  *(Frontend sẽ tự động bóc tách 2 biến này để vẽ lên Kim đồng hồ và Biểu đồ đường Live).*

---

## 3. Phần 2: REST API (Dữ liệu tĩnh & Lệnh điều khiển)

Frontend đóng vai trò là một **HTTP Client**, mặc định gọi tới base URL `http://localhost:3000`. Backend cần đảm bảo các Router API (ví dụ trong file `api.routes.js`) trả về đúng cấu trúc sau:

### 3.1. API Lấy Lịch Sử Đo (Dành cho History Table & History Chart)
- **Method & Endpoint:** `GET /api/v1/history?deviceId=esp32_001&limit=50`
- **Frontend mong đợi (Response Format):** Trả về một mảng chứa dữ liệu các lần đo. Chú ý thuộc tính `time` (timestamp dạng chuỗi hoặc milliseconds).
  ```json
  [
    { "time": 1718000000000, "spo2": 98, "bpm": 75 },
    { "time": 1718000005000, "spo2": 97, "bpm": 76 }
  ]
  ```

### 3.2. API Lấy Nhật Ký Cảnh Báo (Dành cho Alerts Table)
- **Method & Endpoint:** `GET /api/v1/alerts?deviceId=esp32_001&limit=20`
- **Frontend mong đợi (Response Format):**
  ```json
  [
    { "timestamp": 1718000000, "message": "CẢNH BÁO: SpO2 giảm xuống mức nguy hiểm (88%)" },
    { "timestamp": 1718000010, "message": "CẢNH BÁO: Nhịp tim bất thường (130 BPM)" }
  ]
  ```
  *(Lưu ý: `timestamp` ở đây Frontend đang tự hiểu là số giây (unix timestamp), nên nó sẽ tự động nhân 1000 lên để hiển thị ngày giờ).*

### 3.3. API Điều khiển từ xa (Bảng điều khiển)
Khi người dùng bấm nút trên Dashboard, Frontend sẽ POST dữ liệu xuống Backend.
- **Tắt còi tạm thời (Snooze):**
  - Gửi tới: `POST /api/v1/device/buzzer`
  - Body: `{ "state": false }`
- **Gửi tin nhắn lên màn hình OLED:**
  - Gửi tới: `POST /api/v1/device/esp32_001/oled/message`
  - Body: `{ "message": "Noi dung can nhac..." }`

**Backend cần trả về cho cả 2 API trên:**
```json
{
  "success": true,
  "message": "Đã xử lý lệnh thành công"
}
```

---

## 4. Hướng dẫn thay đổi Cấu hình khi chạy khác máy tính

Nếu người code Backend chạy mã trên máy A (ví dụ IP: `192.168.1.15`), còn người code Frontend chạy Node-RED trên máy B:

Người làm Frontend cần mở màn hình cấu hình Node-RED và thay đổi `localhost` thành IP của máy A:
1. **MQTT Node:** Nhấp đúp vào node `Nhận Data từ ESP32` ➔ Sửa MQTT Server ➔ Đổi `localhost` thành `192.168.1.15`.
2. **HTTP Node:** Nhấp đúp vào 3 node `http request` (Màu xanh lá) ➔ Sửa đường dẫn URL ➔ Đổi `http://localhost:3000/...` thành `http://192.168.1.15:3000/...`
3. Cuối cùng bấm **Deploy**.

**Chúc hai bạn ghép code thành công!**
