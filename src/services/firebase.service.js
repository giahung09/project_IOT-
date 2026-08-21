/**
 * Lớp trừu tượng thao tác dữ liệu, tuân thủ Biên bản Thống nhất Kỹ thuật:
 *   /devices/{deviceId}/status  -> { online, last_seen }
 *   /telemetry/{deviceId}/{id}  -> { timestamp, spo2, bpm, temperature }
 *   /alerts/{deviceId}/{id}     -> { timestamp, type, value, notified }
 *   /thresholds/{deviceId}      -> { spo2_min, bpm_min, bpm_max, temp_min, temp_max }
 *   /reminders/{deviceId}/{id}  -> { time, message, status }
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const MODE = process.env.FIREBASE_MODE || 'mock';
const MOCK_DB_PATH = path.join(__dirname, '..', '..', 'data', 'mock-db.json');

function loadMockDb() {
  if (fs.existsSync(MOCK_DB_PATH)) {
    try {
      const loaded = JSON.parse(fs.readFileSync(MOCK_DB_PATH, 'utf-8'));
      if (!loaded.devices) loaded.devices = {};
      if (!loaded.telemetry) loaded.telemetry = {};
      if (!loaded.alerts) loaded.alerts = {};
      if (!loaded.thresholds) loaded.thresholds = {};
      if (!loaded.reminders) loaded.reminders = {};
      return loaded;
    } catch {
      /* fall through to fresh db */
    }
  }
  return { devices: {}, telemetry: {}, alerts: {}, thresholds: {}, reminders: {} };
}

let mockDb = loadMockDb();
let pushCounter = 1;

function persist() {
  fs.mkdirSync(path.dirname(MOCK_DB_PATH), { recursive: true });
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(mockDb, null, 2));
}

function genPushId() {
  return `-N${String(pushCounter++).padStart(3, '0')}`;
}

const mockImpl = {
  async upsertDevice(deviceId, patch) {
    if (!mockDb.devices[deviceId]) mockDb.devices[deviceId] = { status: {} };
    if (!mockDb.devices[deviceId].status) mockDb.devices[deviceId].status = {};
    const current = mockDb.devices[deviceId].status;
    mockDb.devices[deviceId].status = { ...current, ...patch };
    persist();
    return mockDb.devices[deviceId].status;
  },

  async getDevice(deviceId) {
    return mockDb.devices[deviceId]?.status || null;
  },

  async addTelemetry(deviceId, record) {
    if (!mockDb.telemetry[deviceId]) mockDb.telemetry[deviceId] = {};
    const id = genPushId();
    mockDb.telemetry[deviceId][id] = record;
    persist();
    return id;
  },

  async getLatestTelemetry(deviceId) {
    const bucket = mockDb.telemetry[deviceId];
    if (!bucket) return null;
    const keys = Object.keys(bucket);
    if (!keys.length) return null;
    const lastKey = keys[keys.length - 1];
    return bucket[lastKey];
  },

  async getHistory(deviceId, limit = 50) {
    const bucket = mockDb.telemetry[deviceId];
    if (!bucket) return [];
    return Object.values(bucket).slice(-limit);
  },

  async addAlert(deviceId, alert) {
    if (!mockDb.alerts[deviceId]) mockDb.alerts[deviceId] = {};
    const id = genPushId().replace('-N', '-A');
    mockDb.alerts[deviceId][id] = alert;
    persist();
    return id;
  },

  async getAlerts(deviceId, limit = 50) {
    const bucket = mockDb.alerts[deviceId];
    if (!bucket) return [];
    return Object.values(bucket).slice(-limit);
  },

  async setThresholds(deviceId, thresholds) {
    mockDb.thresholds[deviceId] = thresholds;
    persist();
    return thresholds;
  },

  async getThresholds(deviceId) {
    return mockDb.thresholds[deviceId] || null;
  },

  async addReminder(deviceId, reminder) {
    if (!mockDb.reminders[deviceId]) mockDb.reminders[deviceId] = {};
    const id = genPushId().replace('-N', '-R');
    mockDb.reminders[deviceId][id] = reminder;
    persist();
    return id;
  },

  async getReminders(deviceId) {
    const bucket = mockDb.reminders[deviceId];
    if (!bucket) return {};
    return bucket;
  },

  async deleteReminder(deviceId, reminderId) {
    if (mockDb.reminders[deviceId] && mockDb.reminders[deviceId][reminderId]) {
      delete mockDb.reminders[deviceId][reminderId];
      persist();
    }
  },

  _dump() {
    return mockDb;
  },
};

// ... Real impl omitted for brevity but would follow same path logic
function buildRealImpl() {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getDatabase } = require('firebase-admin/database');

  if (!getApps().length) {
    // using mock config logic placeholder
  }
  const db = getDatabase();

  return {
    async upsertDevice(deviceId, patch) {
      const ref = db.ref(`devices/${deviceId}/status`);
      await ref.update(patch);
      const snap = await ref.get();
      return snap.val();
    },
    async getDevice(deviceId) {
      const snap = await db.ref(`devices/${deviceId}/status`).get();
      return snap.exists() ? snap.val() : null;
    },
    async addTelemetry(deviceId, record) {
      const ref = await db.ref(`telemetry/${deviceId}`).push(record);
      return ref.key;
    },
    async getLatestTelemetry(deviceId) {
      const snap = await db.ref(`telemetry/${deviceId}`).orderByKey().limitToLast(1).get();
      if (!snap.exists()) return null;
      return Object.values(snap.val())[0];
    },
    async getHistory(deviceId, limit = 50) {
      const snap = await db.ref(`telemetry/${deviceId}`).orderByKey().limitToLast(limit).get();
      if (!snap.exists()) return [];
      return Object.values(snap.val());
    },
    async addAlert(deviceId, alert) {
      const ref = await db.ref(`alerts/${deviceId}`).push(alert);
      return ref.key;
    },
    async getAlerts(deviceId, limit = 50) {
      const snap = await db.ref(`alerts/${deviceId}`).orderByKey().limitToLast(limit).get();
      if (!snap.exists()) return [];
      return Object.values(snap.val());
    },
    async setThresholds(deviceId, thresholds) {
      const ref = db.ref(`thresholds/${deviceId}`);
      await ref.set(thresholds);
      return thresholds;
    },
    async getThresholds(deviceId) {
      const snap = await db.ref(`thresholds/${deviceId}`).get();
      return snap.exists() ? snap.val() : null;
    },
    async addReminder(deviceId, reminder) {
      const ref = await db.ref(`reminders/${deviceId}`).push(reminder);
      return ref.key;
    },
    async getReminders(deviceId) {
      const snap = await db.ref(`reminders/${deviceId}`).get();
      return snap.exists() ? snap.val() : {};
    },
    async deleteReminder(deviceId, reminderId) {
      await db.ref(`reminders/${deviceId}/${reminderId}`).remove();
    }
  };
}

const impl = MODE === 'real' ? buildRealImpl() : mockImpl;

module.exports = {
  mode: MODE,
  ...impl,
};