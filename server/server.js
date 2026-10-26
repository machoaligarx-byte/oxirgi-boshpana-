
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
  "Kasb": [
    "Shifokor", "Muhandis", "Oshpaz", "O‘qituvchi", "Dehqon",
    "Dasturchi", "Elektrik", "Quruvchi", "Haydovchi", "Mexanik",
    "Veterinar", "Qutqaruvchi", "Harbiy", "Tikuvchi", "Duradgor",
    "Bog‘bon", "Kimyogar", "Biolog", "Geolog", "Uchuvchi",
    "Dengizchi", "Sartarosh", "Payvandchi", "Arxitektor", "Rassom",
    "Fotograf", "Jurnalist", "Tarjimon", "Psixolog", "Feldsher"
  ],
  "Sog‘liq": [
    "Sog‘lom", "Astma", "Ko‘rish zaif", "Allergiya",
    "Kuchli immunitet", "Eshitish zaif", "Tez charchaydi",
    "Jismonan baquvvat", "Uyqusizlik", "Yaxshi ko‘radi",
    "Surunkali bel og‘rig‘i", "Stressga chidamli",
    "Tez yugura oladi", "Qo‘li jarohatlangan", "Qon guruhi noyob"
  ],
  "Yosh": [
    "18 yosh", "21 yosh", "25 yosh", "29 yosh", "32 yosh",
    "36 yosh", "41 yosh", "45 yosh", "50 yosh", "56 yosh",
    "61 yosh", "67 yosh", "72 yosh", "78 yosh", "85 yosh"
  ],
  "Xobbi": [
    "Ovchilik", "Bog‘dorchilik", "Birinchi yordam",
    "Ta’mirlash", "Suzish", "Baliq ovlash", "Kitob o‘qish",
    "Ovqat tayyorlash", "Yulduzlarni kuzatish", "Tikuvchilik",
    "Yog‘och o‘ymakorligi", "Shaxmat", "Chorvachilik",
    "Xarita tuzish", "Rasm chizish"
  ],
  "Yuk": [
    "Asboblar to‘plami", "Dori qutisi", "Urug‘lar",
    "Radio", "Hech narsa", "Arqon", "Pichoq",
    "Filtrli suv idishi", "Chiroq", "Batareyalar",
    "Konserva", "Issiq kiyim", "Kompas", "Palatka",
    "Tikuv anjomlari", "Kitob", "Walkie-talkie",
    "Baliq ovlash anjomlari", "Gaz niqobi", "Fonarik"
  ],
  "Sir": [
    "Suv manbasini biladi", "Yashirin qo‘rquvi bor",
    "Omon qolish tajribasi bor", "Hech kimga aytmagan siri bor",
    "Boshpananing xaritasini topgan", "Oldin yolg‘iz yashagan",
    "Muhim ma’lumotni yashiradi", "Boshqa guruhni taniydi",
    "Yashirin zaxirasi bor", "Kutilmagan qobiliyati bor"
  ]
};

const cardModifiers = {
  "Kasb": [
    "tajribali", "yosh mutaxassis", "usta", "sobiq mutaxassis",
    "tezkor", "ixtirochi", "puxta bilimli", "amaliy tajribali",
    "qiyin vaziyatga moslashgan", "jamoada ishlaydigan",
    "mustaqil ishlaydigan", "kam uchraydigan mutaxassislik",
    "ko‘p tilli", "dala sharoitida ishlagan", "rahbarlik tajribali",
    "shogird tayyorlagan", "eski usullarni biladi",
    "zamonaviy texnikani biladi", "ta’mirlashga usta",
    "muammolarni tez hal qiladi"
  ],
  "Sog‘liq": [
    "yengil darajada", "o‘rtacha darajada", "yaxshi nazorat qilinadi",
    "vaqti-vaqti bilan bezovta qiladi", "jismoniy faol",
    "tez tiklanadi", "sovuqqa chidamli", "issiqqa chidamli",
    "doimiy kuzatuv talab qiladi", "maxsus parvarish talab qiladi",
    "harakatlanishga ta’sir qiladi", "uyquga ta’sir qiladi",
    "stressda kuchayadi", "dori bilan nazorat qilinadi",
    "uzoq yurishda bilinadi", "vaqtinchalik holat",
    "yaxshi immunitet", "chidamliligi yuqori",
    "chidamliligi past", "alohida ehtiyotkorlik kerak"
  ],
  "Yosh": [
    "jismonan baquvvat", "katta hayotiy tajribali",
    "tez o‘rganuvchi", "chidamli", "ehtiyotkor",
    "faol", "kuzatuvchan", "mustaqil",
    "jamoaviy ishlashni yoqtiradi", "rejalashtirishga usta"
  ],
  "Xobbi": [
    "bolaligidan shug‘ullanadi", "professional darajada",
    "mustaqil o‘rgangan", "jamoa bilan bajaradi",
    "maxsus asboblari bor", "boshqalarga o‘rgata oladi",
    "dala sharoitida foydali", "kam uchraydigan mashg‘ulot",
    "ko‘p yillik tajribaga ega", "yangi boshlagan",
    "tez o‘rganadi", "ijodiy yondashadi",
    "amaliy foyda keltiradi", "sabr talab qiladi",
    "aniqlik talab qiladi", "xavfsizlikni yaxshi biladi"
  ],
  "Yuk": [
    "yangi", "eski, ammo ishlaydi", "mustahkamlangan",
    "ixcham", "og‘ir", "yengil", "zaxira nusxasi",
    "suv o‘tkazmaydigan qadoqda", "ta’mirlangan",
    "qo‘lda yasalgan", "cheklangan miqdorda",
    "uzoq muddat saqlanadi", "batareyasi bor",
    "qo‘shimcha qismlari bor", "maxsus himoya qopida"
  ],
  "Sir": [
    "faqat bir kishiga aytgan", "eski voqea bilan bog‘liq",
    "jamoaga foyda keltirishi mumkin", "xavfli ma’lumot",
    "hali tekshirilmagan", "kutilmagan oqibatga ega",
    "boshqa o‘yinchiga aloqador", "vaqt o‘tishi bilan ochiladi",
    "ishonch talab qiladi", "muhim qarorga ta’sir qiladi",
    "yashirin dalilga ega", "sirli xabar bilan bog‘liq",
    "ikki xil talqin qilinadi", "jamoani ajratishi mumkin",
    "kelishuvga yordam berishi mumkin"
  ]
};

for (const category of Object.keys(cardDeck)) {
  const baseCards = [...cardDeck[category]];
  const modifiers = cardModifiers[category] || [];

  const expandedCards = baseCards.flatMap(card => [
    card,
    ...modifiers.map(modifier => `${card} — ${modifier}`)
  ]);

  cardDeck[category] = [...new Set(expandedCards)];
}

const totalCards = Object.values(cardDeck)
  .reduce((sum, cards) => sum + cards.length, 0);

console.log("Jami noyob karta variantlari:", totalCards);

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
    room.playerCards = {};

    for (const player of room.players) {
      const cards = {};

      for (const [category, options] of Object.entries(cardDeck)) {
        cards[category] = shuffled(options)[0];
      }
      room.playerCards[player.id] = cards;
      io.to(player.id).emit("privateCards", cards);
    }

    io.to(code).emit("gameStarted", {
      message: "O‘yin boshlandi!",
      players: room.players.map(p => ({ name: p.name }))
    });

    if (typeof callback === "function")
      callback({ ok: true });
  });


  socket.on("revealCard", ({ code, category } = {}, callback) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms[code];

    if (!room || !room.started) {
      if (typeof callback === "function")
        callback({ ok: false, error: "O‘yin topilmadi" });
      return;
    }

    const player = room.players.find(p => p.id === socket.id);
    const cards = room.playerCards?.[socket.id];

    if (!player || !cards || !Object.prototype.hasOwnProperty.call(cards, category)) {
      if (typeof callback === "function")
        callback({ ok: false, error: "Karta topilmadi" });
      return;
    }

    room.revealedCards = room.revealedCards || {};
    room.revealedCards[socket.id] = room.revealedCards[socket.id] || [];

    if (!room.revealedCards[socket.id].includes(category)) {
      room.revealedCards[socket.id].push(category);
    }

    io.to(code).emit("cardRevealed", {
      playerName: player.name,
      category,
      value: cards[category]
    });

    if (typeof callback === "function")
      callback({ ok: true });
  });

  socket.on("startVoting", (code, callback) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms[code];

    if (!room || !room.started) {
      if (typeof callback === "function")
        callback({ ok: false, error: "O‘yin topilmadi" });
      return;
    }

    if (room.host !== socket.id) {
      if (typeof callback === "function")
        callback({ ok: false, error: "Faqat boshlovchi ovoz berishni boshlaydi" });
      return;
    }

    room.voting = {
      active: true,
      votes: {}
    };

    io.to(code).emit("votingStarted", {
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
