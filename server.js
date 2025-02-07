const WebSocket = require("ws");

const server = new WebSocket.Server({ port: process.env.PORT || 3000 });

let robots = {}; // {"robot1": [client1, client2], "robot2": [client3]}
let robotData = {}; // {"robot1": { temperature: 25, distance: 100 }, "robot2": { ... } }

server.on("connection", (ws) => {
    console.log("New client connected!");

    let assignedRobot = null;

    ws.on("message", (message) => {
        try {
            let data = JSON.parse(message);

            if (data.type === "register" && data.robotName) {
                assignedRobot = data.robotName;
                if (!robots[assignedRobot]) {
                    robots[assignedRobot] = [];
                    robotData[assignedRobot] = {}; // Yeni robot üçün boş məlumat yığımı
                }
                robots[assignedRobot].push(ws);
                console.log(`Client registered to robot: ${assignedRobot}`);
                ws.send(JSON.stringify({ type: "info", message: `Registered to ${assignedRobot}` }));
            }
            else if (data.type === "command" && assignedRobot) {
                console.log(`Command for ${assignedRobot}: ${data.command}`);
                robots[assignedRobot].forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "command", command: data.command }));
                    }
                });
            }
            else if (data.type === "sensorData" && assignedRobot) {
                // Robotdan gələn sensor məlumatlarını yadda saxlayırıq
                robotData[assignedRobot] = { ...robotData[assignedRobot], ...data.data };
                console.log(`Data from ${assignedRobot}:`, data.data);

                // Bütün müştərilərə sensor məlumatlarını göndəririk
                robots[assignedRobot].forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "sensorData", data: data.data }));
                    }
                });
            }
            else {
                ws.send(JSON.stringify({ type: "error", message: "Invalid request" }));
            }
        } catch (e) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid JSON format" }));
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
        if (assignedRobot && robots[assignedRobot]) {
            robots[assignedRobot] = robots[assignedRobot].filter(client => client !== ws);
            if (robots[assignedRobot].length === 0) {
                delete robots[assignedRobot];
                delete robotData[assignedRobot];
            }
        }
    });
});
