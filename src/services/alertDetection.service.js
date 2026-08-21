/**
 * Chức năng: Tiền xử lý, phân tích dữ liệu và phát hiện bất thường.
 * Có xét thêm nhiệt độ theo Biên bản Thống nhất Kỹ thuật.
 */
const { getThresholdsForDevice, ALERT_CONSECUTIVE_COUNT } = require('../config/thresholds.config');

const PHYSIO_LIMITS = {
  spo2: { min: 50, max: 100 },
  bpm: { min: 30, max: 220 },
  temperature: { min: 20, max: 50 },
};

const consecutiveCounters = new Map(); // deviceId -> { spo2: n, bpm: n, temp: n }

function getCounters(deviceId) {
  if (!consecutiveCounters.has(deviceId)) {
    consecutiveCounters.set(deviceId, { spo2: 0, bpm: 0, temp: 0 });
  }
  return consecutiveCounters.get(deviceId);
}

function validateSample({ spo2, bpm, temperature }) {
  const errors = [];
  if (typeof spo2 !== 'number' || spo2 < PHYSIO_LIMITS.spo2.min || spo2 > PHYSIO_LIMITS.spo2.max) {
    errors.push(`spo2 ngoài giới hạn sinh lý: ${spo2}`);
  }
  if (typeof bpm !== 'number' || bpm < PHYSIO_LIMITS.bpm.min || bpm > PHYSIO_LIMITS.bpm.max) {
    errors.push(`bpm ngoài giới hạn sinh lý: ${bpm}`);
  }
  if (temperature != null && (typeof temperature !== 'number' || temperature < PHYSIO_LIMITS.temperature.min || temperature > PHYSIO_LIMITS.temperature.max)) {
    errors.push(`temperature ngoài giới hạn sinh lý: ${temperature}`);
  }
  return { valid: errors.length === 0, errors };
}

function classifySpo2(spo2, thresholds) {
  if (spo2 < thresholds.spo2.criticalMin) return 'LOW_SPO2';
  if (spo2 < thresholds.spo2.warnMin) return 'WATCH_SPO2';
  return 'NORMAL';
}

function classifyBpm(bpm, thresholds) {
  if (bpm < thresholds.bpm.min) return 'LOW_BPM';
  if (bpm > thresholds.bpm.max) return 'HIGH_BPM';
  return 'NORMAL';
}

function classifyTemp(temp, thresholds) {
  if (temp == null) return 'NORMAL';
  if (temp < thresholds.temperature.criticalMin || temp > thresholds.temperature.warnMax) return 'CRITICAL_TEMP';
  if (temp >= thresholds.temperature.warnMin && temp <= thresholds.temperature.warnMax) return 'WATCH_TEMP';
  if (temp >= thresholds.temperature.criticalMin && temp < thresholds.temperature.normalMin) return 'WATCH_TEMP'; // treat 35.0-35.9 as watch
  return 'NORMAL';
}

function analyze(deviceId, spo2Avg, bpmAvg, tempAvg) {
  const thresholds = getThresholdsForDevice(deviceId);
  const counters = getCounters(deviceId);

  const spo2Class = classifySpo2(spo2Avg, thresholds);
  const bpmClass = classifyBpm(bpmAvg, thresholds);
  const tempClass = classifyTemp(tempAvg, thresholds);

  const isSpo2Abnormal = spo2Class !== 'NORMAL';
  const isBpmAbnormal = bpmClass !== 'NORMAL';
  const isTempAbnormal = tempClass !== 'NORMAL';

  counters.spo2 = isSpo2Abnormal ? counters.spo2 + 1 : 0;
  counters.bpm = isBpmAbnormal ? counters.bpm + 1 : 0;
  counters.temp = isTempAbnormal ? counters.temp + 1 : 0;

  let confirmedAlert = null;
  if (counters.spo2 >= ALERT_CONSECUTIVE_COUNT) {
    confirmedAlert = {
      type: spo2Class === 'LOW_SPO2' ? 'LOW_SPO2' : 'WATCH_SPO2',
      message: `SpO2 ${spo2Class === 'LOW_SPO2' ? 'nguy hiểm' : 'thấp'} (${spo2Avg}%)`,
    };
  } else if (counters.bpm >= ALERT_CONSECUTIVE_COUNT) {
    confirmedAlert = {
      type: bpmClass,
      message: `Nhịp tim ${bpmClass === 'LOW_BPM' ? 'quá thấp' : 'quá cao'} (${bpmAvg} bpm)`,
    };
  } else if (counters.temp >= ALERT_CONSECUTIVE_COUNT) {
    confirmedAlert = {
      type: tempClass,
      message: `Nhiệt độ ${tempClass === 'CRITICAL_TEMP' ? 'nguy hiểm' : 'bất thường'} (${tempAvg}°C)`,
    };
  }

  let status = 'NORMAL';
  if (spo2Class === 'LOW_SPO2' || bpmClass === 'LOW_BPM' || bpmClass === 'HIGH_BPM' || tempClass === 'CRITICAL_TEMP') {
    status = 'CRITICAL';
  } else if (spo2Class === 'WATCH_SPO2' || tempClass === 'WATCH_TEMP') {
    status = 'WATCH';
  }

  return {
    status,
    spo2Class,
    bpmClass,
    tempClass,
    counters: { ...counters },
    confirmedAlert,
  };
}

module.exports = { validateSample, analyze, PHYSIO_LIMITS };
