require('dotenv').config();
const mqtt = require('mqtt');
const fetch = require('node-fetch');
const { start } = require('../src/server');

const DEVICE_ID = process.env.SIM_DEVICE_ID || 'esp32_01';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('--- KHỞI ĐỘNG SERVER ---');
  const { server, mqttClient } = start();
  await sleep(1000);

  console.log('\n--- KẾT NỐI MẠCH ESP32 GIẢ LẬP ---');
  const simClient = mqtt.connect('mqtt://localhost:1883', { clientId: 'esp32-sim-test' });

  await new Promise((resolve) => simClient.on('connect', resolve));
  simClient.subscribe(`devices/${DEVICE_ID}/command`);

  simClient.on('message', (topic, payload) => {
    const msg = JSON.parse(payload.toString());
    console.log(`\n👉 [ESP32 NHẬN LỆNH] Topic: ${topic}`);
    console.log(`   Dữ liệu lệnh:`, msg);
  });

  console.log('\n--- TEST 1: GỬI TELEMETRY & NHẬN LỆNH ĐIỀU KHIỂN LED ---');
  // Gửi 5 mẫu bình thường để kích hoạt Moving Average (cần 5 mẫu)
  for (let i = 0; i < 5; i++) {
    simClient.publish(`devices/${DEVICE_ID}/telemetry`, JSON.stringify({ 
      device_id: DEVICE_ID, spo2: 98, bpm: 75, temperature: 36.5 
    }));
  }
  await sleep(1000); // Chờ server xử lý và trả về LED GREEN

  // Gửi 5 mẫu nguy hiểm (SpO2 thấp) để thử lấy LED RED
  for (let i = 0; i < 5; i++) {
    simClient.publish(`devices/${DEVICE_ID}/telemetry`, JSON.stringify({ 
      device_id: DEVICE_ID, spo2: 85, bpm: 75, temperature: 36.5 
    }));
  }
  await sleep(1000); // Chờ server trả về LED RED

  console.log('\n--- TEST 2: ĐẶT LỊCH HẸN NHẮC NHỞ Y TẾ ---');
  const delaySec = 3; 
  const scheduleTime = Math.floor(Date.now() / 1000) + delaySec;
  
  console.log(`1. Gọi API hẹn giờ sau ${delaySec} giây nữa (nội dung: "UONG THUOC")...`);
  const res = await fetch(`http://localhost:3000/api/devices/${DEVICE_ID}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "UONG THUOC", duration_sec: 15, time: scheduleTime }),
  });
  const data = await res.json();
  console.log(`   Phản hồi API:`, data);

  console.log(`2. Đang chờ hệ thống tự động bắn lệnh khi tới giờ...`);
  // Đợi 5 giây để xem còi/oled có bật lên không
  await sleep(5000);

  console.log('\n--- HOÀN TẤT BÀI TEST ---');
  simClient.end();
  server.close();
  mqttClient.end(true);
  process.exit(0);
}

main().catch((err) => {
  console.error('[DEMO] Lỗi:', err);
  process.exit(1);
});
