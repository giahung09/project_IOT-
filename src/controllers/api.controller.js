/**
 * Controllers cho REST API, cập nhật theo chuẩn Biên bản Thống nhất Kỹ thuật
 */
const firebaseService = require('../services/firebase.service');
const { getThresholdsForDevice, setThresholdsForDevice } = require('../config/thresholds.config');
const { publishControl } = require('../mqtt/mqttHandlers');

function makeControllers(mqttClient) {
  return {
    async getLatest(req, res) {
      const deviceId = req.params.id;
      const latest = await firebaseService.getLatestTelemetry(deviceId);
      if (!latest) return res.status(404).json({ error: 'Chưa có dữ liệu' });
      res.json(latest);
    },

    async getHistory(req, res) {
      const deviceId = req.params.id;
      const limit = Number(req.query.limit) || 50;
      const history = await firebaseService.getHistory(deviceId, limit);
      res.json(history);
    },

    async getAlerts(req, res) {
      const deviceId = req.params.id;
      const limit = Number(req.query.limit) || 50;
      const alerts = await firebaseService.getAlerts(deviceId, limit);
      res.json(alerts);
    },

    async getThresholds(req, res) {
      const deviceId = req.params.id;
      // Trả về từ config in-memory (có fallback default) hoặc firebase
      const fromDb = await firebaseService.getThresholds(deviceId);
      res.json(fromDb || getThresholdsForDevice(deviceId));
    },

    async setThresholds(req, res) {
      const deviceId = req.params.id;
      const payload = req.body;
      
      const updated = setThresholdsForDevice(deviceId, payload);
      await firebaseService.setThresholds(deviceId, updated);

      // Gửi lệnh set_threshold xuống ESP32
      publishControl(mqttClient, deviceId, 'set_threshold', {
        spo2_min: updated.spo2.criticalMin,
        bpm_min: updated.bpm.min,
        bpm_max: updated.bpm.max,
        temp_min: updated.temperature.criticalMin,
        temp_max: updated.temperature.warnMax
      });

      res.json({ success: true, thresholds: updated });
    },

    async getReminders(req, res) {
      const deviceId = req.params.id;
      const reminders = await firebaseService.getReminders(deviceId);
      res.json(reminders);
    },

    async addReminder(req, res) {
      const deviceId = req.params.id;
      const { message, duration_sec } = req.body;
      if (!message) return res.status(400).json({ error: 'Thiếu message' });
      
      const reminder = { time: Math.floor(Date.now() / 1000), message, status: 'active' };
      const id = await firebaseService.addReminder(deviceId, reminder);

      publishControl(mqttClient, deviceId, 'reminder', { message, duration_sec: duration_sec || 15 });
      res.json({ success: true, id, reminder });
    },

    async deleteReminder(req, res) {
      const { id, reminderId } = req.params;
      await firebaseService.deleteReminder(id, reminderId);
      res.json({ success: true });
    },

    async snoozeAlert(req, res) {
      const deviceId = req.params.id;
      const { duration_sec } = req.body;
      publishControl(mqttClient, deviceId, 'snooze', { duration_sec: duration_sec || 60 });
      res.json({ success: true });
    }
  };
}

module.exports = { makeControllers };
