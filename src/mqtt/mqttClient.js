/**
 * Khởi tạo kết nối MQTT dùng cho toàn bộ Backend.
 * - DEV_EMBEDDED_BROKER=true: tự chạy 1 broker Aedes nhúng trong tiến trình
 *   (phục vụ dev/test khi không có Mosquitto/HiveMQ thật) rồi tự kết nối vào đó.
 * - Ngược lại: kết nối tới MQTT_BROKER_URL (broker thật, ví dụ Mosquitto/EMQX).
 */
const mqtt = require('mqtt');
const net = require('net');
const config = require('../config/mqtt.config');

function startEmbeddedBroker(port) {
  const aedes = require('aedes')();
  const server = net.createServer(aedes.handle);
  server.listen(port, () => {
    console.log(`[MQTT-BROKER] Aedes broker đang chạy ở port ${port}`);
  });
  return server;
}

function createBackendMqttClient() {
  let brokerHandle = null;
  if (config.DEV_EMBEDDED_BROKER) {
    brokerHandle = startEmbeddedBroker(config.BROKER_PORT);
  }

  const client = mqtt.connect(config.BROKER_URL, {
    username: config.USERNAME,
    password: config.PASSWORD,
    clientId: `backend_${Math.random().toString(16).slice(2, 10)}`,
    reconnectPeriod: 2000,
  });

  client.on('connect', () => {
    // eslint-disable-next-line no-console
    console.log(`[MQTT] Backend đã kết nối tới broker: ${config.BROKER_URL}`);
    client.subscribe([config.TOPICS.TELEMETRY, config.TOPICS.STATUS], { qos: 1 }, (err) => {
      if (err) console.error('[MQTT] Lỗi subscribe:', err);
      else console.log(`[MQTT] Đã subscribe: ${config.TOPICS.TELEMETRY}, ${config.TOPICS.STATUS}`);
    });
  });

  client.on('error', (err) => console.error('[MQTT] Lỗi kết nối:', err.message));

  return { client, brokerHandle };
}

module.exports = { createBackendMqttClient };
