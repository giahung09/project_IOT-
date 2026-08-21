import json
import os
import random

def gen_id():
    return ''.join(random.choice('0123456789abcdef') for _ in range(16))

def update_file(file_path, is_flows):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        z_val = None
        for n in data:
            if 'z' in n:
                z_val = n['z']
                break

        # 1. Modify "Kiểm tra ngưỡng & Cảnh báo"
        for n in data:
            if n['type'] == 'function' and 'Kiểm tra ngưỡng' in n.get('name', ''):
                n['func'] = '''var data = msg.payload;
var lastAlertTime = context.get('lastAlertTime') || 0;
var currentTime = new Date().getTime();

// Cooldown 10s
if (currentTime - lastAlertTime < 10000) {
    return null;
}

// Lấy ngưỡng từ global, nếu chưa có dùng default
var thresholds = global.get('currentThresholds') || {
    spo2: { criticalMin: 90 },
    bpm: { min: 50, max: 120 },
    temperature: { criticalMin: 35.0, warnMax: 38.0 }
};

var s_min = thresholds.spo2.criticalMin;
var b_min = thresholds.bpm.min;
var b_max = thresholds.bpm.max;
var t_min = thresholds.temperature.criticalMin;
var t_max = thresholds.temperature.warnMax;

if(data.spo2 < s_min) {
    context.set('lastAlertTime', currentTime);
    msg.payload = "CẢNH BÁO: SpO2 giảm xuống mức nguy hiểm (" + data.spo2 + "%)";
    return msg;
}
if(data.bpm > b_max || data.bpm < b_min) {
    context.set('lastAlertTime', currentTime);
    msg.payload = "CẢNH BÁO: Nhịp tim bất thường (" + data.bpm + " BPM)";
    return msg;
}
if(data.temperature > t_max || data.temperature < t_min) {
    context.set('lastAlertTime', currentTime);
    msg.payload = "CẢNH BÁO: Nhiệt độ bất thường (" + data.temperature + " °C)";
    return msg;
}
return null;'''

            # 2. Modify "Chuẩn bị Request Ngưỡng"
            if n['type'] == 'function' and 'Chuẩn bị Request Ngưỡng' in n.get('name', ''):
                n['func'] = n['func'].replace(
                    '''msg.payload = {
    spo2: { criticalMin: s_min },''',
                    '''msg.payload = {
    spo2: { criticalMin: s_min },'''
                ).replace(
                    '''msg.url = "http://localhost:3000/api/devices/esp32_01/thresholds";''',
                    '''global.set('currentThresholds', msg.payload);\n\nmsg.url = "http://localhost:3000/api/devices/esp32_01/thresholds";'''
                )

            # 3. Update Temperature Gauge Colors
            if n['type'] == 'ui_gauge' and 'Nhiệt độ' in n.get('name', ''):
                # We want Red < 35, Green 35-38, Red > 38
                n['min'] = 30
                n['max'] = 45
                n['seg1'] = 35
                n['seg2'] = 38
                n['colors'] = ['#d62728', '#2ca02c', '#d62728'] # Red, Green, Red

        # 4. Add Inject -> HTTP Request -> Function (to fetch on startup)
        inject_id = gen_id()
        http_req_id = gen_id()
        func_id = gen_id()

        inject_node = {
            "id": inject_id,
            "type": "inject",
            "name": "Khởi động (Lấy Ngưỡng)",
            "props": [{"p": "payload"}],
            "repeat": "",
            "crontab": "",
            "once": True,
            "onceDelay": 0.5,
            "topic": "",
            "payload": "",
            "payloadType": "date",
            "x": 170,
            "y": 100,
            "wires": [[http_req_id]]
        }

        http_req_node = {
            "id": http_req_id,
            "type": "http request",
            "name": "GET Thresholds",
            "method": "GET",
            "ret": "obj",
            "paytoqs": "ignore",
            "url": "http://localhost:3000/api/devices/esp32_01/thresholds",
            "tls": "",
            "persist": False,
            "proxy": "",
            "insecureHTTPParser": False,
            "authType": "",
            "senderr": False,
            "headers": [],
            "x": 380,
            "y": 100,
            "wires": [[func_id]]
        }

        func_node = {
            "id": func_id,
            "type": "function",
            "name": "Lưu Thresholds vào Global",
            "func": "global.set('currentThresholds', msg.payload);\nreturn msg;",
            "outputs": 1,
            "noerr": 0,
            "initialize": "",
            "finalize": "",
            "libs": [],
            "x": 620,
            "y": 100,
            "wires": [[]]
        }
        
        if z_val:
            inject_node['z'] = z_val
            http_req_node['z'] = z_val
            func_node['z'] = z_val
            
        data.extend([inject_node, http_req_node, func_node])

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print('Updated sync logic in', file_path)
    except Exception as e:
        print('Error', file_path, e)

update_file(r'D:\BackUp\HCMUS_Semester_6\IoT\project\NodeRED_Frontend_v2.json', False)
update_file(r'C:\Users\hungl\.node-red\flows.json', True)
