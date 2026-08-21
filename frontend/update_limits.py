import json
import os

def update_func(file_path, is_flows):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        http_node_id = 'f9869da439aa48f7'
        toast_node_id = 'dd03f393a9e74770'
        
        if is_flows:
            http_node = next((n for n in data if n['type'] == 'http request' and 'Gọi Backend API' in n.get('name', '')), None)
            toast_node = next((n for n in data if n['type'] == 'ui_toast' and 'Toast Kết Quả' in n.get('name', '')), None)
            if http_node: http_node_id = http_node['id']
            if toast_node: toast_node_id = toast_node['id']

        for n in data:
            if n['type'] == 'function' and 'Chuẩn bị Request Ngưỡng' in n.get('name', ''):
                n['outputs'] = 2
                n['wires'] = [[http_node_id], [toast_node_id]]
                n['func'] = '''var p = msg.payload;
var errors = [];

var s_min = Number(p.spo2_criticalMin);
var b_min = Number(p.bpm_min);
var b_max = Number(p.bpm_max);
var t_min = Number(p.temp_criticalMin);
var t_max = Number(p.temp_warnMax);

if (s_min < 50 || s_min > 99) errors.push("SpO2 (50-99%)");
if (b_min < 30 || b_min >= b_max) errors.push("BPM Min (30-Max)");
if (b_max > 220 || b_max <= b_min) errors.push("BPM Max (> Min)");
if (t_min < 34.0 || t_min >= t_max) errors.push("Temp Min (34.0-Max)");
if (t_max > 42.0 || t_max <= t_min) errors.push("Temp Max (> Min)");

if (errors.length > 0) {
    return [null, { payload: "Lỗi giá trị: " + errors.join(", "), topic: "Hệ thống:" }];
}

msg.payload = {
    spo2: { criticalMin: s_min },
    bpm: { min: b_min, max: b_max },
    temperature: { criticalMin: t_min, warnMax: t_max }
};
msg.url = "http://localhost:3000/api/devices/esp32_01/thresholds";
msg.method = "PUT";
msg.actionType = "set_threshold";
return [msg, null];'''
                
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print('Updated limits in', file_path)
    except Exception as e:
        print('Error', file_path, e)

update_func(r'D:\BackUp\HCMUS_Semester_6\IoT\project\NodeRED_Frontend_v2.json', False)
update_func(r'C:\Users\hungl\.node-red\flows.json', True)
