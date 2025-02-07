const WebSocket = require("ws");

const server = new WebSocket.Server({ port: process.env.PORT || 3000 });

let robots = {}; // {"robot1": [client1, client2], "robot2": [client3]}

server.on("connection", (ws) => {
    console.log("Yeni müştəri qoşuldu!");

    let assignedRobot = null;

    ws.on("message", (message) => {
        try {
            let data = JSON.parse(message);

            // Robot qeydiyyatı
            if (data.type === "register" && data.robotName) {
                assignedRobot = data.robotName;
                if (!robots[assignedRobot]) {
                    robots[assignedRobot] = [];
                }
                robots[assignedRobot].push(ws);
                console.log(`Müştəri ${assignedRobot} robotuna qeydiyyatdan keçdi`);
                ws.send(JSON.stringify({ type: "info", message: `Robot ${assignedRobot} ilə qeydiyyatdan keçdi` }));

            } else if (data.type === "video" && data.robotName) {
                // Canlı video frame-ləri almaq
                console.log(`Canlı video frame-i: ${data.robotName}`);
                // Burada base64 şəkli müştərilərə göndərin
                robots[assignedRobot].forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "video", data: data.data }));
                    }
                });
            }

        } catch (e) {
            ws.send(JSON.stringify({ type: "error", message: "Yanlış JSON formatı" }));
        }
    });

    ws.on("close", () => {
        console.log("Müştəri əlaqəni kəsdi");
        if (assignedRobot && robots[assignedRobot]) {
            robots[assignedRobot] = robots[assignedRobot].filter(client => client !== ws);
            if (robots[assignedRobot].length === 0) {
                delete robots[assignedRobot];
            }
        }
    });
});

console.log(`WebSocket serveri portda ${process.env.PORT || 3000} başladıldı`);

