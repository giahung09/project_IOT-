/**
 * Xử lý message MQTT — nhận telemetry, status và điều khiển lệnh.
 */
const config = require('../config/mqtt.config');
const movingAverage = require('../services/movingAverage.service');
const alertDetection = require('../services/alertDetection.service');
const firebaseService = require('../services/firebase.service');
const deviceStatusService = require('../services/deviceStatus.service');
const notificationService = require('../services/notification.service');

function attachHandlers(mqttClient) {
  mqttClient.on('message', async (topic, payloadBuf) => {
    let payload;
    try {
      payload = JSON.parse(payloadBuf.toString());
    } catch {
      console.error(`[MQTT] Payload không hợp lệ trên topic ${topic}`);
      return;
    }

    if (topic.endsWith('/telemetry')) {
      await handleDeviceData(payload);
    } else if (topic.endsWith('/status')) {
      await handleDeviceStatus(payload);
    }
  });
}

async function handleDeviceData(payload) {
  const { device_id, deviceId: legacyId, spo2, bpm, temperature, timestamp } = payload;
  const deviceId = device_id || legacyId;

  if (!deviceId) {
    console.error('[MQTT] Thiếu device_id trong payload telemetry');
    return;
  }

  const validation = alertDetection.validateSample({ spo2, bpm, temperature });
  if (!validation.valid) {
    console.warn(`[MQTT] Dữ liệu lỗi từ ${deviceId}: ${validation.errors.join('; ')} — bỏ qua`);
    return;
  }

  const maResult = movingAverage.addSample(deviceId, spo2, bpm, temperature);
  if (!maResult.ready) return;

  const { spo2Avg, bpmAvg, tempAvg } = maResult;

  const analysis = alertDetection.analyze(deviceId, spo2Avg, bpmAvg, tempAvg);
  const ts = timestamp || Math.floor(Date.now() / 1000);

  await firebaseService.addTelemetry(deviceId, {
    timestamp: ts,
    spo2: spo2Avg,
    bpm: bpmAvg,
    temperature: tempAvg,
    status: analysis.status, 
  });

  console.log(`[Telemetry] ${deviceId} | SpO2=${spo2Avg}% BPM=${bpmAvg} Temp=${tempAvg} -> ${analysis.status}`);

  if (analysis.confirmedAlert) {
    const alertRecord = {
      timestamp: ts,
      type: analysis.confirmedAlert.type,
      value: analysis.confirmedAlert.message,
      notified: true
    };
    await firebaseService.addAlert(deviceId, alertRecord);
    await notificationService.notifyAlert({ deviceId, spo2: spo2Avg, bpm: bpmAvg, temperature: tempAvg, message: alertRecord.value, ...alertRecord });
  }
}

async function handleDeviceStatus(payload) {
  const { device_id, deviceId: legacyId, status, timestamp } = payload;
  const deviceId = device_id || legacyId;
  if (!deviceId) return;
  const ts = timestamp || Math.floor(Date.now() / 1000);
  if (status === 'online') {
    deviceStatusService.markOnline(deviceId, ts);
    console.log(`[Heartbeat] ${deviceId} online lúc ${new Date(ts * 1000).toISOString()}`);
  }
}

/**
 * Gửi lệnh điều khiển tới ESP32 qua topic command duy nhất theo định dạng JSON
 */
function publishControl(mqttClient, deviceId, type, payload) {
  const topic = typeof config.TOPICS.COMMAND === 'function' ? config.TOPICS.COMMAND(deviceId) : `devices/${deviceId}/command`;
  
  const commandMessage = { type, ...payload };
  mqttClient.publish(topic, JSON.stringify(commandMessage), { qos: 1 });
  console.log(`[MQTT] Đã gửi lệnh tới ${topic}:`, commandMessage);
  return topic;
}

module.exports = { attachHandlers, publishControl };
