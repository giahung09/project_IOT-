import json
import uuid

def uid():
    return str(uuid.uuid4()).replace('-', '')[:16]

tab_id = uid()
tab_history_id = uid()

group_metrics_id = uid()
group_live_charts_id = uid()
group_controls_id = uid()

group_history_charts_id = uid()
group_history_table_id = uid()
group_alerts_id = uid()

mqtt_broker_id = uid()
mqtt_in_id = uid()
func_parse_id = uid()

gauge_spo2_id = uid()
gauge_bpm_id = uid()

chart_spo2_id = uid()
chart_bpm_id = uid()

alert_func_id = uid()
toast_id = uid()
audio_id = uid()

btn_snooze_id = uid()
form_reminder_id = uid()

func_snooze_req_id = uid()
func_reminder_req_id = uid()
http_req_id = uid()

func_success_toast_id = uid()
toast_success_id = uid()

# History fetching nodes
inject_history_id = uid()
http_req_history_id = uid()
func_format_history_id = uid()
history_chart_id = uid()
template_history_id = uid()

# Alerts fetching nodes
inject_alerts_id = uid()
http_req_alerts_id = uid()
template_alerts_id = uid()

flow = [
    {
        "id": tab_id,
        "type": "ui_tab",
        "name": "Hệ Thống Giám Sát",
        "icon": "dashboard",
        "order": 1,
        "disabled": False,
        "hidden": False
    },
    {
        "id": tab_history_id,
        "type": "ui_tab",
        "name": "Lịch Sử & Cảnh Báo",
        "icon": "history",
        "order": 2,
        "disabled": False,
        "hidden": False
    },
    {
        "id": group_metrics_id,
        "type": "ui_group",
        "name": "Chỉ Số Hiện Tại",
        "tab": tab_id,
        "order": 1,
        "disp": True,
        "width": "6",
        "collapse": False
    },
    {
        "id": group_live_charts_id,
        "type": "ui_group",
        "name": "Biểu Đồ Theo Thời Gian Thực",
        "tab": tab_id,
        "order": 2,
        "disp": True,
        "width": "12",
        "collapse": False
    },
    {
        "id": group_controls_id,
        "type": "ui_group",
        "name": "Bảng Điều Khiển",
        "tab": tab_id,
        "order": 3,
        "disp": True,
        "width": "6",
        "collapse": False
    },
    {
        "id": group_history_charts_id,
        "type": "ui_group",
        "name": "Biểu Đồ Lịch Sử (History Chart)",
        "tab": tab_history_id,
        "order": 1,
        "disp": True,
        "width": "12",
        "collapse": False
    },
    {
        "id": group_history_table_id,
        "type": "ui_group",
        "name": "Bảng Dữ Liệu Lịch Sử (History Table)",
        "tab": tab_history_id,
        "order": 2,
        "disp": True,
        "width": "12",
        "collapse": False
    },
    {
        "id": group_alerts_id,
        "type": "ui_group",
        "name": "Nhật Ký Cảnh Báo",
        "tab": tab_history_id,
        "order": 3,
        "disp": True,
        "width": "12",
        "collapse": False
    },
    {
        "id": mqtt_broker_id,
        "type": "mqtt-broker",
        "name": "Local MQTT Broker",
        "broker": "localhost",
        "port": "1883",
        "clientid": "",
        "autoConnect": True,
        "usetls": False,
        "protocolVersion": "4",
        "keepalive": "60",
        "cleansession": True
    },
    {
        "id": mqtt_in_id,
        "type": "mqtt in",
        "name": "Nhận Data từ ESP32",
        "topic": "24127541/device/data",
        "qos": "0",
        "datatype": "json",
        "broker": mqtt_broker_id,
        "nl": False,
        "rap": True,
        "rh": 0,
        "inputs": 0,
        "x": 170,
        "y": 100,
        "wires": [[func_parse_id]]
    },
    {
        "id": func_parse_id,
        "type": "function",
        "name": "Xử lý dữ liệu",
        "func": "var data = msg.payload;\nvar spo2 = data.spo2;\nvar bpm = data.bpm;\n\nreturn [\n    {payload: spo2},\n    {payload: bpm},\n    {payload: {spo2: spo2, bpm: bpm}}\n];",
        "outputs": 3,
        "x": 400,
        "y": 100,
        "wires": [
            [gauge_spo2_id, chart_spo2_id],
            [gauge_bpm_id, chart_bpm_id],
            [alert_func_id]
        ]
    },
    {
        "id": alert_func_id,
        "type": "function",
        "name": "Kiểm tra ngưỡng & Cảnh báo",
        "func": "var data = msg.payload;\nif(data.spo2 < 90) {\n    msg.payload = \"CẢNH BÁO: SpO2 giảm xuống mức nguy hiểm (\" + data.spo2 + \"%)\";\n    return msg;\n}\nif(data.bpm > 120 || data.bpm < 50) {\n    msg.payload = \"CẢNH BÁO: Nhịp tim bất thường (\" + data.bpm + \" BPM)\";\n    return msg;\n}\nreturn null;",
        "outputs": 1,
        "x": 660,
        "y": 440,
        "wires": [[toast_id, audio_id]]
    },
    {
        "id": toast_id,
        "type": "ui_toast",
        "name": "Popup Cảnh Báo",
        "position": "top right",
        "displayTime": "5",
        "highlight": "red",
        "sendall": True,
        "outputs": 0,
        "ok": "OK",
        "cancel": "",
        "raw": False,
        "topic": "Cảnh báo y tế khẩn cấp!",
        "x": 900,
        "y": 420,
        "wires": []
    },
    {
        "id": audio_id,
        "type": "ui_audio",
        "name": "Còi âm thanh (Web)",
        "group": group_controls_id,
        "voice": "en-US",
        "always": "",
        "x": 900,
        "y": 480,
        "wires": []
    },
    {
        "id": gauge_spo2_id,
        "type": "ui_gauge",
        "name": "SpO2 (%)",
        "group": group_metrics_id,
        "order": 1,
        "width": 0,
        "height": 0,
        "gtype": "gage",
        "title": "SpO2 (%)",
        "label": "%",
        "format": "{{value}}",
        "min": 0,
        "max": 100,
        "colors": ["#ff0000", "#e6e600", "#00ff00"],
        "seg1": "90",
        "seg2": "95",
        "x": 660,
        "y": 40,
        "wires": []
    },
    {
        "id": gauge_bpm_id,
        "type": "ui_gauge",
        "name": "Nhịp Tim (BPM)",
        "group": group_metrics_id,
        "order": 2,
        "width": 0,
        "height": 0,
        "gtype": "gage",
        "title": "Nhịp Tim (BPM)",
        "label": "BPM",
        "format": "{{value}}",
        "min": 0,
        "max": 200,
        "colors": ["#ff0000", "#00ff00", "#ff0000"],
        "seg1": "50",
        "seg2": "120",
        "x": 680,
        "y": 100,
        "wires": []
    },
    {
        "id": chart_spo2_id,
        "type": "ui_chart",
        "name": "Biểu đồ SpO2 (Live)",
        "group": group_live_charts_id,
        "order": 1,
        "width": "6",
        "height": "4",
        "label": "SpO2 theo thời gian",
        "chartType": "line",
        "legend": "false",
        "xformat": "HH:mm:ss",
        "interpolate": "linear",
        "nodata": "",
        "dot": False,
        "ymin": "70",
        "ymax": "100",
        "removeOlder": 1,
        "removeOlderUnit": "60",
        "x": 680,
        "y": 240,
        "wires": [[]]
    },
    {
        "id": chart_bpm_id,
        "type": "ui_chart",
        "name": "Biểu đồ BPM (Live)",
        "group": group_live_charts_id,
        "order": 2,
        "width": "6",
        "height": "4",
        "label": "Nhịp tim theo thời gian",
        "chartType": "line",
        "legend": "false",
        "xformat": "HH:mm:ss",
        "interpolate": "linear",
        "nodata": "",
        "dot": False,
        "ymin": "40",
        "ymax": "150",
        "removeOlder": 1,
        "removeOlderUnit": "60",
        "x": 670,
        "y": 300,
        "wires": [[]]
    },
    {
        "id": btn_snooze_id,
        "type": "ui_button",
        "name": "Tắt Còi Tạm Thời",
        "group": group_controls_id,
        "order": 1,
        "width": 0,
        "height": 0,
        "passthru": False,
        "label": "🔕 Tắt Còi Tạm Thời",
        "tooltip": "Tắt tiếng bíp trong vòng 60s",
        "color": "white",
        "bgcolor": "orange",
        "icon": "",
        "payload": "{\"type\": \"snooze\", \"duration_sec\": 60}",
        "payloadType": "json",
        "topic": "",
        "x": 180,
        "y": 560,
        "wires": [[func_snooze_req_id]]
    },
    {
        "id": form_reminder_id,
        "type": "ui_form",
        "name": "Gửi Nhắc Hẹn",
        "group": group_controls_id,
        "order": 2,
        "width": 0,
        "height": 0,
        "label": "📝 Gửi Lời Nhắc Đến Thiết Bị",
        "format": [{"label":"Nội dung lời nhắc","value":"message","type":"text","required":True}],
        "storeOutMessages": True,
        "fwdInMessages": True,
        "cancel": "Hủy",
        "submit": "Gửi Lệnh",
        "x": 140,
        "y": 620,
        "wires": [[func_reminder_req_id]]
    },
    {
        "id": func_snooze_req_id,
        "type": "function",
        "name": "Chuẩn bị Request Tắt Còi",
        "func": "msg.payload = { state: false };\nmsg.url = \"http://localhost:3000/api/v1/device/buzzer\";\nmsg.actionType = \"snooze\";\nreturn msg;",
        "outputs": 1,
        "x": 450,
        "y": 560,
        "wires": [[http_req_id]]
    },
    {
        "id": func_reminder_req_id,
        "type": "function",
        "name": "Chuẩn bị Request Nhắc Hẹn",
        "func": "msg.url = \"http://localhost:3000/api/v1/device/esp32_001/oled/message\";\nmsg.actionType = \"reminder\";\nmsg.originalMessage = msg.payload.message;\nreturn msg;",
        "outputs": 1,
        "x": 460,
        "y": 620,
        "wires": [[http_req_id]]
    },
    {
        "id": http_req_id,
        "type": "http request",
        "name": "Gọi Backend API",
        "method": "POST",
        "ret": "obj",
        "paytoqs": "ignore",
        "url": "",
        "tls": "",
        "persist": False,
        "proxy": "",
        "insecureHTTPParser": False,
        "authType": "",
        "senderr": False,
        "headers": [],
        "x": 680,
        "y": 580,
        "wires": [[func_success_toast_id]]
    },
    {
        "id": func_success_toast_id,
        "type": "function",
        "name": "Xử lý Response",
        "func": "if (msg.payload && msg.payload.success) {\n    if (msg.actionType === 'snooze') {\n        msg.payload = \"Đã gửi lệnh tắt còi đến thiết bị thành công!\";\n    } else if (msg.actionType === 'reminder') {\n        msg.payload = \"Đã gửi lệnh nhắc hẹn: \" + msg.originalMessage;\n    } else {\n        msg.payload = \"Lệnh thực thi thành công!\";\n    }\n} else {\n    msg.payload = \"Lỗi khi gọi API: \" + JSON.stringify(msg.payload);\n}\nreturn msg;",
        "outputs": 1,
        "x": 880,
        "y": 580,
        "wires": [[toast_success_id]]
    },
    {
        "id": toast_success_id,
        "type": "ui_toast",
        "name": "Toast Kết Quả",
        "position": "bottom right",
        "displayTime": "3",
        "highlight": "blue",
        "sendall": True,
        "outputs": 0,
        "ok": "OK",
        "raw": False,
        "topic": "Hệ thống:",
        "x": 1070,
        "y": 580,
        "wires": []
    },
    # --- Lịch sử đo & Chart Lịch sử ---
    {
        "id": inject_history_id,
        "type": "inject",
        "name": "Lấy Lịch Sử (10s)",
        "props": [{"p": "payload"}],
        "repeat": "10",
        "crontab": "",
        "once": True,
        "onceDelay": 0.5,
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "x": 170,
        "y": 700,
        "wires": [[http_req_history_id]]
    },
    {
        "id": http_req_history_id,
        "type": "http request",
        "name": "GET /api/v1/history",
        "method": "GET",
        "ret": "obj",
        "paytoqs": "ignore",
        "url": "http://localhost:3000/api/v1/history?deviceId=esp32_001&limit=50",
        "tls": "",
        "persist": False,
        "proxy": "",
        "insecureHTTPParser": False,
        "authType": "",
        "senderr": False,
        "headers": [],
        "x": 370,
        "y": 700,
        "wires": [[func_format_history_id]]
    },
    {
        "id": func_format_history_id,
        "type": "function",
        "name": "Format History",
        "func": "var history = msg.payload;\nif (!Array.isArray(history)) return null;\n\nvar spo2Data = [];\nvar bpmData = [];\n\nfor(var i=0; i<history.length; i++) {\n    var ts = new Date(history[i].time).getTime();\n    // Node-RED ui_chart expects x in milliseconds\n    spo2Data.push({x: ts, y: history[i].spo2});\n    bpmData.push({x: ts, y: history[i].bpm});\n}\n\n// Format chuẩn của Node-RED Dashboard cho bulk update chart\nvar chartMsg = {\n    payload: [{\n        series: [\"SpO2 (%)\", \"Nhịp tim (BPM)\"],\n        data: [\n            spo2Data,\n            bpmData\n        ],\n        labels: [\"SpO2\", \"BPM\"]\n    }]\n};\n\nvar tableMsg = { payload: history };\n\nreturn [chartMsg, tableMsg];",
        "outputs": 2,
        "x": 580,
        "y": 700,
        "wires": [
            [history_chart_id],
            [template_history_id]
        ]
    },
    {
        "id": history_chart_id,
        "type": "ui_chart",
        "name": "Biểu đồ Lịch sử",
        "group": group_history_charts_id,
        "order": 1,
        "width": "12",
        "height": "6",
        "label": "Xu hướng SpO2 và BPM trong quá khứ",
        "chartType": "line",
        "legend": "true",
        "xformat": "HH:mm:ss dd/MM",
        "interpolate": "linear",
        "nodata": "Đang tải dữ liệu...",
        "dot": False,
        "ymin": "30",
        "ymax": "150",
        "removeOlder": 1,
        "removeOlderUnit": "86400",
        "x": 800,
        "y": 680,
        "wires": [[]]
    },
    {
        "id": template_history_id,
        "type": "ui_template",
        "name": "Bảng Lịch Sử",
        "group": group_history_table_id,
        "order": 1,
        "width": 0,
        "height": 0,
        "format": "<div style=\"height: 300px; overflow-y: auto;\">\n<table style=\"width:100%; border-collapse: collapse; font-size: 14px; text-align: left;\">\n  <tr style=\"background-color:#eee; position: sticky; top: 0;\"><th style=\"border: 1px solid #ddd; padding: 10px;\">Thời gian</th><th style=\"border: 1px solid #ddd; padding: 10px;\">SpO2</th><th style=\"border: 1px solid #ddd; padding: 10px;\">BPM</th></tr>\n  <tr ng-repeat=\"row in msg.payload | orderBy:'-time'\">\n    <td style=\"border: 1px solid #ddd; padding: 10px;\">{{row.time | date:'HH:mm:ss dd/MM/yyyy'}}</td>\n    <td style=\"border: 1px solid #ddd; padding: 10px;\">{{row.spo2}}%</td>\n    <td style=\"border: 1px solid #ddd; padding: 10px;\">{{row.bpm}}</td>\n  </tr>\n</table>\n</div>",
        "storeOutMessages": True,
        "fwdInMessages": True,
        "resizes": True,
        "templateScope": "local",
        "className": "",
        "x": 790,
        "y": 720,
        "wires": [[]]
    },
    # --- Cảnh báo ---
    {
        "id": inject_alerts_id,
        "type": "inject",
        "name": "Lấy Cảnh Báo (10s)",
        "props": [{"p": "payload"}],
        "repeat": "10",
        "crontab": "",
        "once": True,
        "onceDelay": 0.5,
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "x": 170,
        "y": 800,
        "wires": [[http_req_alerts_id]]
    },
    {
        "id": http_req_alerts_id,
        "type": "http request",
        "name": "GET /api/v1/alerts",
        "method": "GET",
        "ret": "obj",
        "paytoqs": "ignore",
        "url": "http://localhost:3000/api/v1/alerts?deviceId=esp32_001&limit=20",
        "tls": "",
        "persist": False,
        "proxy": "",
        "insecureHTTPParser": False,
        "authType": "",
        "senderr": False,
        "headers": [],
        "x": 370,
        "y": 800,
        "wires": [[template_alerts_id]]
    },
    {
        "id": template_alerts_id,
        "type": "ui_template",
        "name": "Bảng Cảnh Báo",
        "group": group_alerts_id,
        "order": 1,
        "width": 0,
        "height": 0,
        "format": "<div style=\"height: 300px; overflow-y: auto;\">\n<table style=\"width:100%; border-collapse: collapse; font-size: 14px; text-align: left;\">\n  <tr style=\"background-color:#fee; position: sticky; top: 0;\"><th style=\"border: 1px solid #ddd; padding: 10px;\">Thời gian</th><th style=\"border: 1px solid #ddd; padding: 10px;\">Nội dung</th></tr>\n  <tr ng-repeat=\"row in msg.payload | orderBy:'-timestamp'\">\n    <td style=\"border: 1px solid #ddd; padding: 10px; color: red;\">{{row.timestamp * 1000 | date:'HH:mm:ss dd/MM/yyyy'}}</td>\n    <td style=\"border: 1px solid #ddd; padding: 10px; color: red;\">{{row.message}}</td>\n  </tr>\n</table>\n</div>",
        "storeOutMessages": True,
        "fwdInMessages": True,
        "resizes": True,
        "templateScope": "local",
        "className": "",
        "x": 580,
        "y": 800,
        "wires": [[]]
    }
]

with open('D:/BackUp/HCMUS_Semester_6/IoT/project/NodeRED_Frontend_v2.json', 'w', encoding='utf8') as f:
    json.dump(flow, f, indent=4)
