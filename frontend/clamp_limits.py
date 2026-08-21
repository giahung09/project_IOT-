import json
import os

def update_func(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for n in data:
            if n['type'] == 'function' and 'Chuẩn bị Request Ngưỡng' in n.get('name', ''):
                n['func'] = '''var p = msg.payload;

var s_min = Number(p.spo2_criticalMin);
var b_min = Number(p.bpm_min);
var b_max = Number(p.bpm_max);
var t_min = Number(p.temp_criticalMin);
var t_max = Number(p.temp_warnMax);

// Giới hạn trong khoảng quy định
s_min = Math.max(50, Math.min(99, s_min));

b_min = Math.max(30, Math.min(150, b_min));
b_max = Math.max(50, Math.min(220, b_max));
if (b_min >= b_max) b_max = b_min + 1;

t_min = Math.max(34.0, Math.min(37.0, t_min));
t_max = Math.max(37.0, Math.min(42.0, t_max));
if (t_min >= t_max) t_max = t_min + 0.1;

msg.payload = {
    spo2: { criticalMin: s_min },
    bpm: { min: b_min, max: b_max },
    temperature: { criticalMin: Number(t_min.toFixed(1)), warnMax: Number(t_max.toFixed(1)) }
};

msg.url = "http://localhost:3000/api/devices/esp32_01/thresholds";
msg.method = "PUT";
msg.actionType = "set_threshold";

return [msg, null];'''
                
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print('Updated auto clamping in', file_path)
    except Exception as e:
        print('Error', file_path, e)

update_func(r'D:\BackUp\HCMUS_Semester_6\IoT\project\NodeRED_Frontend_v2.json')
update_func(r'C:\Users\hungl\.node-red\flows.json')
