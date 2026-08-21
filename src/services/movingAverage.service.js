/**
 * Bộ lọc trung bình trượt (Moving Average), N = 5 mẫu.
 * Bao gồm cả spo2, bpm và temperature.
 */
const { MOVING_AVERAGE_WINDOW } = require('../config/thresholds.config');

class MovingAverageBuffer {
  constructor(windowSize = MOVING_AVERAGE_WINDOW) {
    this.windowSize = windowSize;
    this.buffers = new Map(); // deviceId -> { spo2: [], bpm: [], temp: [] }
  }

  _getBuffer(deviceId) {
    if (!this.buffers.has(deviceId)) {
      this.buffers.set(deviceId, { spo2: [], bpm: [], temp: [] });
    }
    return this.buffers.get(deviceId);
  }

  addSample(deviceId, spo2, bpm, temp) {
    const buf = this._getBuffer(deviceId);
    buf.spo2.push(spo2);
    buf.bpm.push(bpm);
    if (temp != null) buf.temp.push(temp);

    if (buf.spo2.length < this.windowSize) {
      return { ready: false, count: buf.spo2.length, windowSize: this.windowSize };
    }

    const spo2Avg = average(buf.spo2);
    const bpmAvg = average(buf.bpm);
    const tempAvg = buf.temp.length > 0 ? average(buf.temp) : null;

    // reset
    buf.spo2 = [];
    buf.bpm = [];
    buf.temp = [];

    return {
      ready: true,
      spo2Avg: Math.round(spo2Avg), // Tỷ lệ % SpO2 (số nguyên)
      bpmAvg: Math.round(bpmAvg),   // Nhịp tim (số nguyên)
      tempAvg: tempAvg != null ? round1(tempAvg) : null, // Nhiệt độ (1 số thập phân)
      windowSize: this.windowSize,
    };
  }
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

module.exports = new MovingAverageBuffer();
module.exports.MovingAverageBuffer = MovingAverageBuffer;
