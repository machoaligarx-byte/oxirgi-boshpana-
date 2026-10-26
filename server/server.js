
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

// Kartalar uchun noyob variantlarni yaratish.
for (const category of Object.keys(cardDeck)) {
  const baseCards = [...cardDeck[category]];
  const modifiers = cardModifiers[category] || [];

  const expandedCards = baseCards.flatMap(card => [
    card,
    ...modifiers.map(modifier => `${card} — ${modifier}`)
  ]);

  cardDeck[category] = [...new Set(expandedCards)];
}

console.log(
  "Jami noyob karta variantlari:",
  Object.values(cardDeck).reduce((sum, cards) => sum + cards.length, 0)
);

function shuffled(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function reply(callback, result) {
  if (typeof callback === "function") callback(result);
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
  // Xona yaratish.
  socket.on("createRoom", (playerName, callback) => {
    let code = makeCode();
    while (rooms[code]) code = makeCode();

    rooms[code] = {
      host: socket.id,
      started: false,
      players: [{
        id: socket.id,
        name: String(playerName || "O‘yinchi").slice(0, 24)
      }],
      playerCards: {},
      revealedCards: {},
      voting: null
    };

    socket.join(code);
    reply(callback, { ok: true, code });
    sendPlayers(code);
  });

  // Xonaga qo‘shilish.
  socket.on("joinRoom", ({ code, name } = {}, callback) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms[code];

    if (!room) {
      reply(callback, { ok: false, error: "Xona topilmadi" });
      return;
    }

    if (room.started) {
      reply(callback, {
        ok: false,
        error: "O‘yin allaqachon boshlangan"
      });
      return;
    }

    if (room.players.length >= 8) {
      reply(callback, { ok: false, error: "Xona to‘la" });
      return;
    }

    if (room.players.some(p => p.id === socket.id)) {
      reply(callback, { ok: true, code });
      return;
    }

    room.players.push({
      id: socket.id,
      name: String(name || "O‘yinchi").slice(0, 24)
    });

    socket.join(code);
    reply(callback, { ok: true, code });
    sendPlayers(code);
  });

  // O‘yinni faqat xona egasi boshlaydi.
  socket.on("startGame", (code, callback) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms[code];

    if (!room) {
      reply(callback, { ok: false, error: "Xona topilmadi" });
      return;
    }

    if (room.host !== socket.id) {
      reply(callback, {
        ok: false,
        error: "Faqat xona egasi boshlashi mumkin"
      });
      return;
    }

    if (room.started) {
      reply(callback, { ok: false, error: "O‘yin boshlangan" });
      return;
    }

    if (room.players.length < 2) {
      reply(callback, {
        ok: false,
        error: "Kamida 2 o‘yinchi kerak"
      });
      return;
    }

    room.started = true;
    room.playerCards = {};
    room.revealedCards = {};
    room.voting = null;

    for (const player of room.players) {
      const cards = {};

      // Har bir o‘yinchiga 6 ta maxfiy karta.
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

    reply(callback, { ok: true });
  });

  // O‘yinchi o‘z kartasini istalgan payt ochishi mumkin.
  socket.on("revealCard", ({ code, category } = {}, callback) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms[code];

    if (!room || !room.started) {
      reply(callback, { ok: false, error: "O‘yin topilmadi" });
      return;
    }

    const player = room.players.find(p => p.id === socket.id);
    const cards = room.playerCards[socket.id];

    if (!player || !cards ||
        !Object.prototype.hasOwnProperty.call(cards, category)) {
      reply(callback, { ok: false, error: "Karta topilmadi" });
      return;
    }

    room.revealedCards[socket.id] =
      room.revealedCards[socket.id] || [];

    if (!room.revealedCards[socket.id].includes(category)) {
      room.revealedCards[socket.id].push(category);
    }

    io.to(code).emit("cardRevealed", {
      playerName: player.name,
      category,
      value: cards[category]
    });

    reply(callback, { ok: true });
  });

  // Ovoz berishni faqat xona egasi boshlaydi.
  socket.on("startVoting", (code, callback) => {
    code = String(code || "").trim().toUpperCase();
    const room = rooms[code];

    if (!room || !room.started) {
      reply(callback, { ok: false, error: "O‘yin topilmadi" });
      return;
    }

    if (room.host !== socket.id) {
      reply(callback, {
        ok: false,
        error: "Faqat boshlovchi ovoz berishni boshlaydi"
      });
      return;
    }

    if (room.players.length <= 2) {
      reply(callback, {
        ok: false,
        error: "O‘yin tugagan: boshpanada 2 kishi qoldi."
      });
      return;
    }

    if (room.voting?.active) {
      reply(callback, {
        ok: false,
        error: "Ovoz berish allaqachon boshlangan"
      });
      return;
    }

    room.voting = { active: true, votes: {} };

    io.to(code).emit("votingStarted", {
      players: room.players.map(p => ({
        id: p.id,
        name: p.name
      }))
    });

    reply(callback, { ok: true });
  });

  // Ovoz berish: har bir o‘yinchi bir marta ovoz beradi.
  socket.on("castVote", (data, callback) => {
    const code = String(data?.code || "").trim().toUpperCase();
    const targetId = String(data?.targetId || "");
    const room = rooms[code];

    if (!room || !room.voting?.active) {
      reply(callback, {
        ok: false,
        error: "Ovoz berish faol emas."
      });
      return;
    }

    if (!room.players.some(p => p.id === socket.id)) {
      reply(callback, { ok: false, error: "Siz bu xonada emassiz." });
      return;
    }

    if (room.players.length <= 2) {
      room.voting.active = false;
      reply(callback, {
        ok: false,
        error: "O‘yin tugagan: 2 kishi qoldi."
      });
      return;
    }

    if (!room.players.some(p => p.id === targetId)) {
      reply(callback, { ok: false, error: "O‘yinchi topilmadi." });
      return;
    }

    if (socket.id === targetId) {
      reply(callback, {
        ok: false,
        error: "O‘zingizga ovoz bera olmaysiz."
      });
      return;
    }

    if (Object.prototype.hasOwnProperty.call(room.voting.votes, socket.id)) {
      reply(callback, {
        ok: false,
        error: "Siz allaqachon ovoz bergansiz."
      });
      return;
    }

    room.voting.votes[socket.id] = targetId;
    reply(callback, { ok: true });

    const votedCount = Object.keys(room.voting.votes).length;

    io.to(code).emit("voteProgress", {
      voted: votedCount,
      total: room.players.length
    });

    if (votedCount !== room.players.length) return;

    const counts = {};

    for (const id of Object.values(room.voting.votes)) {
      counts[id] = (counts[id] || 0) + 1;
    }

    const maxVotes = Math.max(...Object.values(counts));
    const tiedIds = Object.keys(counts).filter(
      id => counts[id] === maxVotes
    );

    // Teng ovoz bo‘lsa, eng ko‘p ovoz olganlar orasidan bittasi tasodifiy tanlanadi.
    const eliminatedId =
      tiedIds[Math.floor(Math.random() * tiedIds.length)];

    const eliminated = room.players
      .filter(p => p.id === eliminatedId)
      .map(p => ({ id: p.id, name: p.name }));

    room.players = room.players.filter(p => p.id !== eliminatedId);
    room.voting.active = false;

    // Xona egasi chiqarilsa, yangi egani tayinlash.
    if (room.host === eliminatedId && room.players.length > 0) {
      room.host = room.players[0].id;
    }

    io.to(code).emit("votingResult", {
      eliminated,
      remaining: room.players.map(p => ({
        id: p.id,
        name: p.name
      })),
      finished: room.players.length === 2,
      draw: false,
      message: room.players.length === 2
        ? "O‘yin tugadi! Boshpanada aynan 2 kishi qoldi."
        : tiedIds.length > 1
          ? "Ovozlar teng bo‘ldi. Tasodifiy tanlov orqali bitta o‘yinchi chiqarildi."
          : "Ovoz berish tugadi."
    });

    sendPlayers(code);
  });

  // O‘yinchi uzilib qolsa, xonani yangilash.
  socket.on("disconnect", () => {
    for (const [code, room] of Object.entries(rooms)) {
      const wasHost = room.host === socket.id;

      room.players = room.players.filter(p => p.id !== socket.id);
      delete room.playerCards[socket.id];
      delete room.revealedCards[socket.id];

      if (room.voting?.votes) {
        delete room.voting.votes[socket.id];
      }

      if (room.players.length === 0) {
        delete rooms[code];
        continue;
      }

      if (wasHost) {
        room.host = room.players[0].id;
      }

      // Ulanish uzilganda qolgan o‘yinchilar uchun ovoz holatini qayta boshlash.
      if (room.voting?.active) {
        room.voting.votes = {};
        io.to(code).emit("votingStarted", {
          players: room.players.map(p => ({
            id: p.id,
            name: p.name
          }))
        });
      }

      sendPlayers(code);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portida ishga tushdi`);
});
