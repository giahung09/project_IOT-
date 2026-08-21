import json
file_path = r'D:\BackUp\HCMUS_Semester_6\IoT\project\NodeRED_Frontend_v2.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for n in data:
    if n['id'] == 'f3bea49ad497474c' and 'msg.method' not in n['func']:
        n['func'] += '\nmsg.method = "POST";'
    if n['id'] == 'f9869da439aa48f7':
        n['method'] = 'use'
    if n['id'] == 'a56b4a0a4aed45c7':
        n['format'] = [
            {'label': 'Khung giờ nhắc hẹn', 'value': 'time', 'type': 'time', 'required': True},
            {'label': 'Nội dung lời nhắc', 'value': 'message', 'type': 'text', 'required': True}
        ]
    if n['id'] == '519b6ac37eb14e95':
        n['outputs'] = 2
        n['func'] = '''var targetTime = msg.payload.time;
var message = msg.payload.message;
var now = new Date();
var parts = targetTime.split(':');
var targetDate = new Date();
targetDate.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
if (targetDate.getTime() < now.getTime()) { targetDate.setDate(targetDate.getDate() + 1); }
var delayMs = targetDate.getTime() - now.getTime();
var delayMsg = { url: "http://localhost:3000/api/devices/esp32_01/reminders", method: "POST", actionType: "reminder", originalMessage: message, payload: { message: message, duration_sec: 15 }, delay: delayMs };
var toastMsg = { payload: "Đã lên lịch nhắc '" + message + "' vào lúc " + targetTime, topic: "Hệ thống nhắc hẹn" };
return [delayMsg, toastMsg];'''
        n['wires'] = [['delay_reminder_123'], ['dd03f393a9e74770']]
    if n['id'] == 'b0ac6db8ea1a4fdf' and 'set_threshold' not in n['func']:
        n['func'] = n['func'].replace('if (msg.actionType === \'snooze\') {', 'if (msg.actionType === \'set_threshold\') {\n        msg.payload = "Cập nhật ngưỡng cảnh báo thành công!";\n    } else if (msg.actionType === \'snooze\') {')

if not any(n['id'] == 'delay_reminder_123' for n in data):
    data.append({
        'id': 'delay_reminder_123',
        'type': 'delay',
        'name': 'Chờ đến giờ hẹn',
        'pauseType': 'delayv',
        'timeout': '5',
        'timeoutUnits': 'seconds',
        'rate': '1',
        'nbRateUnits': '1',
        'rateUnits': 'second',
        'randomFirst': '1',
        'randomLast': '5',
        'randomUnits': 'seconds',
        'drop': False,
        'outputs': 1,
        'x': 600,
        'y': 650,
        'wires': [['f9869da439aa48f7']]
    })

if not any(n['id'] == 'form_threshold_456' for n in data):
    data.extend([
        {
            'id': 'form_threshold_456',
            'type': 'ui_form',
            'name': 'Cập Nhật Ngưỡng',
            'group': '5ebc6d56cfc648ae',
            'order': 3,
            'width': 0,
            'height': 0,
            'label': '⚙️ Điều Chỉnh Ngưỡng Cảnh Báo',
            'format': [
                {'label': 'SpO2 Nguy Hiểm Min (%)', 'value': 'spo2_criticalMin', 'type': 'number', 'required': True},
                {'label': 'Nhịp Tim Cảnh Báo Min (BPM)', 'value': 'bpm_min', 'type': 'number', 'required': True},
                {'label': 'Nhịp Tim Cảnh Báo Max (BPM)', 'value': 'bpm_max', 'type': 'number', 'required': True},
                {'label': 'Nhiệt Độ Nguy Hiểm Min (°C)', 'value': 'temp_criticalMin', 'type': 'number', 'required': True},
                {'label': 'Nhiệt Độ Cảnh Báo Max (°C)', 'value': 'temp_warnMax', 'type': 'number', 'required': True}
            ],
            'storeOutMessages': True,
            'fwdInMessages': True,
            'cancel': 'Hủy',
            'submit': 'Lưu Ngưỡng',
            'x': 150,
            'y': 500,
            'wires': [['func_threshold_789']]
        },
        {
            'id': 'func_threshold_789',
            'type': 'function',
            'name': 'Chuẩn bị Request Ngưỡng',
            'func': 'var p = msg.payload;\nmsg.payload = {\n    spo2: { criticalMin: Number(p.spo2_criticalMin) },\n    bpm: { min: Number(p.bpm_min), max: Number(p.bpm_max) },\n    temperature: { criticalMin: Number(p.temp_criticalMin), warnMax: Number(p.temp_warnMax) }\n};\nmsg.url = "http://localhost:3000/api/devices/esp32_01/thresholds";\nmsg.method = "PUT";\nmsg.actionType = "set_threshold";\nreturn msg;',
            'outputs': 1,
            'x': 450,
            'y': 500,
            'wires': [['f9869da439aa48f7']]
        }
    ])

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)
print('Success!')
