const express = require('express');
const { makeControllers } = require('../controllers/api.controller');
const { asyncHandler } = require('../utils/asyncHandler');

function buildApiRouter(mqttClient) {
  const router = express.Router();
  const ctrl = makeControllers(mqttClient);

  router.get('/devices/:id/latest', asyncHandler(ctrl.getLatest));
  router.get('/devices/:id/history', asyncHandler(ctrl.getHistory));
  router.get('/devices/:id/alerts', asyncHandler(ctrl.getAlerts));
  
  router.get('/devices/:id/thresholds', asyncHandler(ctrl.getThresholds));
  router.put('/devices/:id/thresholds', asyncHandler(ctrl.setThresholds));

  router.get('/devices/:id/reminders', asyncHandler(ctrl.getReminders));
  router.post('/devices/:id/reminders', asyncHandler(ctrl.addReminder));
  router.delete('/devices/:id/reminders/:reminderId', asyncHandler(ctrl.deleteReminder));

  router.post('/devices/:id/snooze', asyncHandler(ctrl.snoozeAlert));

  return router;
}

module.exports = { buildApiRouter };