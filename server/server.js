
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.get("/", (req, res) => {
  res.send("Oxirgi Boshpana serveri ishlayapti!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const rooms = {};

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

io.on("connection", (socket) => {
  socket.on("createRoom", (playerName, callback) => {
    let code = makeCode();
    while (rooms[code]) code = makeCode();

    rooms[code] = {
      players: [{ id: socket.id, name: String(playerName || "O‘yinchi").slice(0, 24) }],
      votes: {}
    };

    socket.join(code);
    if (typeof callback === "function") callback({ ok: true, code });
  });

  socket.on("joinRoom", ({ code, name }, callback) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms[code];

    if (!room) {
      if (typeof callback === "function") callback({ ok: false, error: "Xona topilmadi" });
      return;
    }

    if (room.players.length >= 8) {
      if (typeof callback === "function") callback({ ok: false, error: "Xona to‘la" });
      return;
    }

    room.players.push({
      id: socket.id,
      name: String(name || "O‘yinchi").slice(0, 24)
    });

    socket.join(code);
    io.to(code).emit("playersUpdated", room.players.map(p => ({ name: p.name })));

    if (typeof callback === "function") callback({ ok: true, code });
  });

  socket.on("vote", ({ code, target }) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms[code];
    if (!room) return;

    room.votes[socket.id] = String(target || "");
    io.to(code).emit("voteCount", Object.keys(room.votes).length);
  });

  socket.on("disconnect", () => {
    for (const [code, room] of Object.entries(rooms)) {
      room.players = room.players.filter(p => p.id !== socket.id);
      delete room.votes[socket.id];

      if (room.players.length === 0) {
        delete rooms[code];
      } else {
        io.to(code).emit("playersUpdated", room.players.map(p => ({ name: p.name })));
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portida ishga tushdi`);
});
