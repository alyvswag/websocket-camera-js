const WebSocket = require("ws");

const server = new WebSocket.Server({ port: process.env.PORT || 3000 });

let robots = {}; // {"robot1": [client1, client2], "robot2": [client3]}
let clients = []; // Müştəriləri saxlayacaq array

server.on("connection", (ws) => {
    console.log("Yeni müştəri qoşuldu!");

    let assignedRobot = null;

    // Müştəri ilə mesaj alış-verişi
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

                // Komanda göndərilməsi
            } else if (data.type === "command" && assignedRobot) {
                console.log(`Komanda: ${assignedRobot} üçün ${data.command}`);
                robots[assignedRobot].forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "command", command: data.command }));
                    }
                });

                // Sensor məlumatlarının alındığı vəziyyət
            } else if (data.type === "sensorData" && data.robotName) {
                console.log(`Sensor məlumatı: ${data.robotName} robotundan alındı`);
                // Sensor məlumatlarını hər kəsə yay
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "sensorData",
                            robotName: data.robotName,
                            data: data.data
                        }));
                    }
                });

                // Yanlış tələblər
            } else {
                ws.send(JSON.stringify({ type: "error", message: "Yanlış sorğu" }));
            }

        } catch (e) {
            ws.send(JSON.stringify({ type: "error", message: "Yanlış JSON formatı" }));
        }
    });

    // Müştəri ilə əlaqə kəsildikdə
    ws.on("close", () => {
        console.log("Müştəri əlaqəni kəsdi");
        if (assignedRobot && robots[assignedRobot]) {
            robots[assignedRobot] = robots[assignedRobot].filter(client => client !== ws);
            if (robots[assignedRobot].length === 0) {
                delete robots[assignedRobot];
            }
        }

        // Müştəriyi clients array-dən sil
        clients = clients.filter(client => client !== ws);
    });

    // Yeni müştəriyi `clients` array-ə əlavə et
    clients.push(ws);
});

console.log(`WebSocket serveri portda ${process.env.PORT || 3000} başladıldı`);
