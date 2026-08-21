require('dotenv').config();
const mqtt = require('mqtt');

const { start } = require('../src/server');
const firebaseService = require('../src/services/firebase.service');

const DEVICE_ID = process.env.SIM_DEVICE_ID || 'esp32_01';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('\n========== BƯỚC 1: Khởi động Backend ==========');
  const { server, mqttClient } = start();
  await sleep(500);

  console.log('\n========== BƯỚC 2: Mô phỏng ESP32 gửi dữ liệu ==========');
  const simClient = mqtt.connect('mqtt://localhost:1883', { clientId: 'esp32-sim-demo' });

  await new Promise((resolve) => simClient.on('connect', resolve));

  // Gửi heartbeat trước
  simClient.publish(
    `devices/${DEVICE_ID}/status`,
    JSON.stringify({ device_id: DEVICE_ID, status: 'online', timestamp: Math.floor(Date.now() / 1000) })
  );

  // Kịch bản: 10 mẫu bình thường, rồi 15 mẫu SpO2 thấp liên tục
  const samples = [];
  for (let i = 0; i < 10; i += 1) samples.push({ spo2: 97 + Math.random(), bpm: 75 + Math.round(Math.random() * 5), temperature: 36.5 });
  for (let i = 0; i < 15; i += 1) samples.push({ spo2: 86 + Math.random(), bpm: 100 + Math.round(Math.random() * 5), temperature: 38.5 });

  for (const s of samples) {
    simClient.publish(
      `devices/${DEVICE_ID}/telemetry`,
      JSON.stringify({ 
        device_id: DEVICE_ID, 
        spo2: Math.round(s.spo2 * 10) / 10, 
        bpm: s.bpm, 
        temperature: s.temperature,
        finger_detected: true,
        timestamp: Math.floor(Date.now() / 1000) 
      })
    );
    await sleep(120); 
  }

  console.log('\n... đợi Backend xử lý xong các lô moving-average ...');
  await sleep(500);

  console.log('\n========== BƯỚC 3: Test REST API (giả lập Dashboard) ==========');
  const fetch = require('node-fetch');
  const BASE = 'http://localhost:3000';

  const latest = await (await fetch(`${BASE}/api/devices/${DEVICE_ID}/latest`)).json();
  console.log(`GET /api/devices/${DEVICE_ID}/latest ->`, latest);

  const history = await (await fetch(`${BASE}/api/devices/${DEVICE_ID}/history?limit=10`)).json();
  console.log(`GET /api/devices/${DEVICE_ID}/history -> ${history.length} bản ghi`);

  const snooze = await (
    await fetch(`${BASE}/api/devices/${DEVICE_ID}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_sec: 60 }),
    })
  ).json();
  console.log(`POST /api/devices/${DEVICE_ID}/snooze ->`, snooze);

  console.log('\n========== BƯỚC 4: Tóm tắt dữ liệu trong "Firebase" (mock) ==========');
  const dump = firebaseService._dump ? firebaseService._dump() : null;
  if (dump) {
    console.log('devices:', dump.devices);
    console.log('telemetry count:', Object.keys(dump.telemetry[DEVICE_ID] || {}).length);
    console.log('alerts count:', Object.keys(dump.alerts[DEVICE_ID] || {}).length);
  }

  console.log('\n=== DEMO HOÀN TẤT — nhấn Ctrl+C để thoát ===');
  simClient.end();
  server.close();
  mqttClient.end(true);
  process.exit(0);
}

main().catch((err) => {
  console.error('[DEMO] Lỗi:', err);
  process.exit(1);
});
