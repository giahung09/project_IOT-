const fetch = require('node-fetch');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const DEVICE_ID = process.env.SIM_DEVICE_ID || 'esp32_01';

async function callApi(label, method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  console.log(`\n[TEST] ${label}`);
  console.log(`  ${method} ${path}${body ? ' body=' + JSON.stringify(body) : ''}`);
  console.log(`  -> HTTP ${res.status}`, data);
  return { status: res.status, data };
}

async function run() {
  console.log(`=== Test REST API tại ${BASE_URL} (device=${DEVICE_ID}) ===`);

  await callApi('Health check', 'GET', '/health');

  await callApi('Lấy dữ liệu mới nhất', 'GET', `/api/devices/${DEVICE_ID}/latest`);

  await callApi('Lấy lịch sử đo (10 bản ghi gần nhất)', 'GET', `/api/devices/${DEVICE_ID}/history?limit=10`);

  await callApi('Snooze báo động', 'POST', `/api/devices/${DEVICE_ID}/snooze`, { duration_sec: 120 });

  await callApi('Đọc ngưỡng cảnh báo hiện tại của thiết bị', 'GET', `/api/devices/${DEVICE_ID}/thresholds`);

  await callApi(
    'Đặt ngưỡng cảnh báo riêng cho thiết bị',
    'PUT',
    `/api/devices/${DEVICE_ID}/thresholds`,
    { 
      spo2: { warnMin: 97, criticalMin: 92 },
      temperature: { warnMin: 37.5, warnMax: 38.0, criticalMin: 35.0 }
    }
  );

  await callApi(
    'Đặt nhắc nhở uống thuốc',
    'POST',
    `/api/devices/${DEVICE_ID}/reminders`,
    { message: 'UỐNG THUỐC', duration_sec: 15 }
  );

  console.log('\n=== Hoàn tất test REST API ===');
}

run().catch((err) => {
  console.error('[TEST] Lỗi:', err);
  process.exit(1);
});
