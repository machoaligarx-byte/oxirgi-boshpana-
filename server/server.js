
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.get("/", (req, res) =>
  res.send("Oxirgi Boshpana serveri ishlayapti!")
);

app.get("/health", (req, res) =>
  res.json({ status: "ok" })
);

const rooms = {};

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const cardDeck = {
  "Kasb": ["Shifokor", "Muhandis", "Oshpaz", "O‘qituvchi", "Dehqon", "Dasturchi"],
  "Sog‘liq": ["Sog‘lom", "Astma", "Ko‘rish zaif", "Allergiya", "Kuchli immunitet"],
  "Yosh": ["18 yosh", "25 yosh", "32 yosh", "41 yosh", "56 yosh", "67 yosh"],
  "Xobbi": ["Ovchilik", "Bog‘dorchilik", "Birinchi yordam", "Ta’mirlash", "Suzish"],
  "Yuk": ["Asboblar to‘plami", "Dori qutisi", "Urug‘lar", "Radio", "Hech narsa"],
  "Sir": ["Suv manbasini biladi", "Yashirin qo‘rquvi bor", "Omon qolish tajribasi bor", "Hech kimga aytmagan siri bor"]
};

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sendPlayers(code) {
  const room = rooms[code];
  if (!room) return;
  io.to(code).emit(
    "playersUpdated",
    room.players.map(p => ({ name: p.name }))
  );
}

io.on("connection", socket => {
  socket.on("createRoom", (playerName, callback) => {
    let code = makeCode();
    while (rooms[code]) code = makeCode();

    rooms[code] = {
      host: socket.id,
      started: false,
      players: [{
        id: socket.id,
        name: String(playerName || "O‘yinchi").slice(0, 24)
      }]
    };

    socket.join(code);
    if (typeof callback === "function") {
      callback({ ok: true, code });
    }
    sendPlayers(code);
  });

  socket.on("joinRoom", ({ code, name } = {}, callback) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms[code];

    if (!room) {
      if (typeof callback === "function")
        callback({ ok: false, error: "Xona topilmadi" });
      return;
    }

    if (room.started) {
      if (typeof callback === "function")
        callback({ ok: false, error: "O‘yin allaqachon boshlangan" });
      return;
    }

    if (room.players.length >= 8) {
      if (typeof callback === "function")
        callback({ ok: false, error: "Xona to‘la" });
      return;
    }

    if (room.players.some(p => p.id === socket.id)) {
      if (typeof callback === "function")
        callback({ ok: true, code });
      return;
    }

    room.players.push({
      id: socket.id,
      name: String(name || "O‘yinchi").slice(0, 24)
    });

    socket.join(code);

    if (typeof callback === "function")
      callback({ ok: true, code });

    sendPlayers(code);
  });

  socket.on("startGame", (code, callback) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms[code];

    if (!room) {
      if (typeof callback === "function")
        callback({ ok: false, error: "Xona topilmadi" });
      return;
    }

    if (room.host !== socket.id) {
      if (typeof callback === "function")
        callback({ ok: false, error: "Faqat xona egasi boshlashi mumkin" });
      return;
    }

    if (room.started) {
      if (typeof callback === "function")
        callback({ ok: false, error: "O‘yin boshlangan" });
      return;
    }

    if (room.players.length < 2) {
      if (typeof callback === "function")
        callback({ ok: false, error: "Kamida 2 o‘yinchi kerak" });
      return;
    }

    room.started = true;

    for (const player of room.players) {
      const cards = {};

      for (const [category, options] of Object.entries(cardDeck)) {
        cards[category] =
          shuffled(options)[0];
      }

      io.to(player.id).emit("privateCards", cards);
    }

    io.to(code).emit("gameStarted", {
      message: "O‘yin boshlandi!",
      players: room.players.map(p => ({ name: p.name }))
    });

    if (typeof callback === "function")
      callback({ ok: true });
  });

  socket.on("disconnect", () => {
    for (const [code, room] of Object.entries(rooms)) {
      room.players = room.players.filter(p => p.id !== socket.id);

      if (room.players.length === 0) {
        delete rooms[code];
      } else {
        if (room.host === socket.id) {
          room.host = room.players[0].id;
        }
        sendPlayers(code);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portida ishga tushdi`);
});
