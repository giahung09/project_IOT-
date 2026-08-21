# Hướng dẫn kết nối mạch thật ESP32 với Backend

Để kết nối ESP32 thật vào hệ thống, bạn cần thay đổi một số cấu hình ở cả **Backend** và **code trên ESP32**.

## 1. Cấu hình Backend (file `.env`)

Bạn có 2 lựa chọn về MQTT Broker để ESP32 và Backend giao tiếp với nhau:

### Lựa chọn 1: Dùng Local Broker (Embedded Broker của Backend)
*Điều kiện: Máy tính chạy backend và ESP32 phải kết nối chung vào 1 mạng Wi-Fi.*
1. Mở file `.env` ở thư mục gốc của backend.
2. Đảm bảo cấu hình sau được bật:
   ```env
   DEV_EMBEDDED_BROKER=true
   ```
3. Tìm địa chỉ IP máy tính của bạn:
   - Mở CMD (Windows) gõ `ipconfig` (tìm dòng IPv4 Address).
   - Mở Terminal (Mac/Linux) gõ `ifconfig` hoặc `ip a`.
   - Ví dụ IP của bạn là: `192.168.1.15`. Địa chỉ IP này sẽ được đưa vào code ESP32.

### Lựa chọn 2: Dùng Public/Cloud Broker (như EMQX, HiveMQ)
*Điều kiện: ESP32 và máy tính đều có kết nối Internet (không cần chung Wi-Fi).*
1. Mở file `.env`.
2. Sửa các dòng sau (ví dụ dùng EMQX):
   ```env
   DEV_EMBEDDED_BROKER=false
   MQTT_BROKER_URL=mqtt://broker.emqx.io
   MQTT_BROKER_PORT=1883
   ```

---

## 2. Cấu hình Code trên ESP32 (Arduino IDE / PlatformIO)

Trên ESP32, bạn cần sử dụng các thư viện thông dụng như `WiFi.h`, `PubSubClient.h` và `ArduinoJson.h`.
*(Lưu ý: Cấu trúc Topic và JSON thực tế đang chạy trên hệ thống có phần khác với tài liệu README.md gốc, dưới đây là thông tin chuẩn xác nhất để khớp với code Backend hiện tại).*

### A. Khai báo thông tin mạng và Broker
```cpp
const char* ssid = "TEN_WIFI_CUA_BAN";
const char* password = "MAT_KHAU_WIFI";

// Nếu dùng Lựa chọn 1 (Local Broker):
const char* mqtt_server = "192.168.1.15"; // Thay bằng IP IPv4 của máy tính

// Nếu dùng Lựa chọn 2 (Public Broker):
// const char* mqtt_server = "broker.emqx.io";

const int mqtt_port = 1883;
const char* device_id = "esp32_01"; // Phải khớp với mã thiết bị trên Dashboard / Backend
```

### B. Topic MQTT chuẩn
Hệ thống backend hiện đang sử dụng các topic sau:
- **Gửi dữ liệu cảm biến**: `devices/{device_id}/telemetry` (Ví dụ: `devices/esp32_01/telemetry`)
- **Gửi trạng thái (Heartbeat)**: `devices/{device_id}/status` (Ví dụ: `devices/esp32_01/status`)
- **Nhận lệnh điều khiển**: `devices/{device_id}/command` (Ví dụ: `devices/esp32_01/command`)

### C. Gửi dữ liệu cảm biến (Telemetry)
Dữ liệu gửi lên phải là chuỗi JSON với các trường (`key`) chính xác. Ví dụ định kỳ 1 giây/lần gọi hàm gửi:
```cpp
void sendSensorData() {
  StaticJsonDocument<200> doc;
  
  // Tên key bắt buộc phải giống chính xác như sau:
  doc["device_id"] = device_id;
  doc["spo2"] = readSpO2();            // Giá trị SpO2 lấy từ MAX30102
  doc["bpm"] = readBPM();              // Giá trị nhịp tim
  doc["temperature"] = readTemp();     // Giá trị nhiệt độ
  doc["finger_detected"] = true;       // Kiểm tra xem có đang đặt ngón tay không
  // Lưu ý: trường timestamp backend có thể tự sinh nếu ESP32 không gửi
  
  char buffer[200];
  serializeJson(doc, buffer);
  
  // Gửi lên topic telemetry
  client.publish("devices/esp32_01/telemetry", buffer);
}
```

### D. Gửi trạng thái Online (Heartbeat)
Backend cần biết thiết bị có đang hoạt động hay bị rớt mạng. Định kỳ gửi 10-30 giây/lần:
```cpp
void sendHeartbeat() {
  StaticJsonDocument<200> doc;
  doc["device_id"] = device_id;
  doc["status"] = "online";
  
  char buffer[200];
  serializeJson(doc, buffer);
  
  client.publish("devices/esp32_01/status", buffer);
}
```

### E. Nhận lệnh điều khiển (Subscribe)
Trong hàm `setup()` của ESP32, sau khi kết nối MQTT thành công, bạn phải đăng ký nhận bản tin (subscribe):
```cpp
client.subscribe("devices/esp32_01/command");
```

Trong hàm `callback` của thư viện `PubSubClient` để xử lý gói tin điều khiển:
```cpp
void callback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<200> doc;
  deserializeJson(doc, payload, length);
  
  // In ra log để xem lệnh gửi về là gì
  serializeJson(doc, Serial);
  Serial.println();
  
  // Xử lý bật tắt Buzzer, LED tùy theo lệnh từ JSON (thêm logic của bạn)
  // Ví dụ: bool buzzerState = doc["buzzer"]; 
}
```

---

## 3. Các bước kiểm tra luồng hoạt động
1. Khởi động Backend trên máy tính (`npm start`).
2. Nạp code vào mạch ESP32.
3. Mở **Serial Monitor** (baud rate 115200) để xem ESP32 kết nối Wi-Fi và MQTT Broker có thành công hay không.
4. Nếu ESP32 gửi dữ liệu thành công, trên terminal/console của Backend sẽ bắt đầu nhảy thông báo log dữ liệu nhận được.
5. Kiểm tra lỗi: Nếu Backend báo lỗi "Validation Error" (VD: thiếu trường `spo2`), hãy kiểm tra kĩ lại tên biến bên trong `doc["..."]` của bạn trên code C/C++ có bị sai chính tả hay không (lưu ý trường `device_id` và `finger_detected`).
