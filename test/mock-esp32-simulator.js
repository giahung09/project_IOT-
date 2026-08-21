require('dotenv').config();
const mqtt = require('mqtt');

const DEVICE_ID = process.env.SIM_DEVICE_ID || 'esp32_01'; // updated id
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const SAMPLE_INTERVAL_MS = 1000;
const HEARTBEAT_INTERVAL_MS = 3000;

const client = mqtt.connect(BROKER_URL, { clientId: `esp32-sim-${DEVICE_ID}` });

let sampleCount = 0;

function randomInRange(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function nextSample() {
  sampleCount += 1;
  
  // Phase 1: Normal (1 - 10s)
  if (sampleCount <= 10) {
    return { spo2: randomInRange(96, 99), bpm: Math.round(randomInRange(70, 85)), temperature: randomInRange(36.0, 37.0) };
  }
  // Phase 2: LOW SpO2 Alert (11 - 25s) -> đợi qua bộ lọc moving average (5s) mới báo
  if (sampleCount <= 25) {
    return { spo2: randomInRange(84, 88), bpm: Math.round(randomInRange(70, 85)), temperature: randomInRange(36.0, 37.0) };
  }
  // Phase 3: HIGH BPM Alert (26 - 40s)
  if (sampleCount <= 40) {
    return { spo2: randomInRange(96, 99), bpm: Math.round(randomInRange(130, 140)), temperature: randomInRange(36.0, 37.0) };
  }
  // Phase 4: HIGH TEMP Alert (41 - 55s)
  if (sampleCount <= 55) {
    return { spo2: randomInRange(96, 99), bpm: Math.round(randomInRange(70, 85)), temperature: randomInRange(39.0, 40.0) };
  }
  
  // Back to Normal (loop forever)
  if (sampleCount > 80) sampleCount = 0; // restart the demo loop
  return { spo2: randomInRange(96, 99), bpm: Math.round(randomInRange(70, 85)), temperature: randomInRange(36.0, 37.0) };
}

client.on('connect', () => {
  console.log(`[ESP32-SIM] ${DEVICE_ID} đã kết nối tới ${BROKER_URL}`);

  const commandTopic = `devices/${DEVICE_ID}/command`;
  client.subscribe(commandTopic);
  client.on('message', (topic, payload) => {
    if (topic === commandTopic) {
      const msg = JSON.parse(payload.toString());
      console.log(`[ESP32-SIM] 🔊 Nhận lệnh điều khiển:`, msg);
    }
  });

  const dataTimer = setInterval(() => {
    const { spo2, bpm, temperature } = nextSample();
    const payload = {
      device_id: DEVICE_ID,
      spo2,
      bpm,
      temperature,
      finger_detected: true,
      timestamp: Math.floor(Date.now() / 1000),
    };
    client.publish(`devices/${DEVICE_ID}/telemetry`, JSON.stringify(payload));
    console.log(`[ESP32-SIM] -> devices/${DEVICE_ID}/telemetry`, payload);

    // Chạy liên tục vòng lặp bằng cách không clearInterval
  }, SAMPLE_INTERVAL_MS);

  const heartbeatTimer = setInterval(() => {
    const payload = { device_id: DEVICE_ID, status: 'online', timestamp: Math.floor(Date.now() / 1000) };
    client.publish(`devices/${DEVICE_ID}/status`, JSON.stringify(payload));
    console.log(`[ESP32-SIM] -> devices/${DEVICE_ID}/status`, payload);
  }, HEARTBEAT_INTERVAL_MS);
  heartbeatTimer.unref?.();
});

client.on('error', (err) => console.error('[ESP32-SIM] Lỗi MQTT:', err.message));
