const WebSocket = require("ws");
const express = require("express");

const app = express();
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

let lastImage = null;

wss.on("connection", function connection(ws) {
    console.log("Yeni müştəri qoşuldu!");

    // Əgər müştəri qoşularsa, ona sonuncu görüntünü göndər
    if (lastImage) {
        ws.send(lastImage);
    }

    ws.on("message", function incoming(data) {
        lastImage = data;  // Sonuncu şəkli yadda saxla
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });

    ws.on("close", function () {
        console.log("Müştəri bağlantısı kəsildi.");
    });
});

app.use(express.static("public")); // HTML səhifəsini göstərmək üçün

server.listen(9090, function () {
    console.log("Server 9090 portunda işləyir...");
});
