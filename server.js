const WebSocket = require("ws");
const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let lastImage = null;

wss.on("connection", (ws) => {
    console.log("Yeni müştəri qoşuldu!");

    if (lastImage) {
        ws.send(lastImage);
    }

    ws.on("message", (data) => {
        lastImage = data;
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });

    ws.on("close", () => {
        console.log("Müştəri bağlantısı kəsildi.");
    });
});

app.use(express.static("public"));

server.listen(9090, () => {
    console.log("Server 9090 portunda işləyir...");
});
