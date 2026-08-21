import json
import os

def update_snooze(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for n in data:
            if n['type'] == 'function' and 'Chuẩn bị Request Tắt Còi' in n.get('name', ''):
                n['func'] = '''msg.payload = { duration_sec: 60 };
msg.url = "http://localhost:3000/api/devices/esp32_01/snooze";
msg.method = "POST";
msg.actionType = "snooze";
return msg;'''
                
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print('Fixed snooze in', file_path)
    except Exception as e:
        print('Error', file_path, e)

update_snooze(r'D:\BackUp\HCMUS_Semester_6\IoT\project\NodeRED_Frontend_v2.json')
update_snooze(r'C:\Users\hungl\.node-red\flows.json')
