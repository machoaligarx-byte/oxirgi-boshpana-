const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Oxirgi Boshpana serveri ishlayapti!");
});
app.get("/health", (req, res) => res.json({ status: "ok" }));

const rooms = {};
const cardDeck = {
  "Kasb": ["Shifokor","Muhandis","Oshpaz","O‘qituvchi","Dehqon","Dasturchi","Elektrik","Quruvchi","Haydovchi","Mexanik","Veterinar","Qutqaruvchi","Harbiy","Tikuvchi","Duradgor","Bog‘bon","Kimyogar","Biolog","Geolog","Uchuvchi","Dengizchi","Sartarosh","Payvandchi","Arxitektor","Rassom","Fotograf","Jurnalist","Tarjimon","Psixolog","Feldsher"],
  "Sog‘liq": ["Sog‘lom","Astma","Ko‘rish zaif","Allergiya","Kuchli immunitet","Eshitish zaif","Tez charchaydi","Jismonan baquvvat","Uyqusizlik","Yaxshi ko‘radi","Surunkali bel og‘rig‘i","Stressga chidamli","Tez yugura oladi","Qo‘li jarohatlangan","Qon guruhi noyob"],
  "Yosh": ["18 yosh","21 yosh","25 yosh","29 yosh","32 yosh","36 yosh","41 yosh","45 yosh","50 yosh","56 yosh","61 yosh","67 yosh","72 yosh","78 yosh","85 yosh"],
  "Xobbi": ["Ovchilik","Bog‘dorchilik","Birinchi yordam","Ta’mirlash","Suzish","Baliq ovlash","Kitob o‘qish","Ovqat tayyorlash","Yulduzlarni kuzatish","Tikuvchilik","Yog‘och o‘ymakorligi","Shaxmat","Chorvachilik","Xarita tuzish","Rasm chizish"],
  "Yuk": ["Asboblar to‘plami","Dori qutisi","Urug‘lar","Radio","Hech narsa","Arqon","Pichoq","Filtrli suv idishi","Chiroq","Batareyalar","Konserva","Issiq kiyim","Kompas","Palatka","Tikuv anjomlari","Kitob","Walkie-talkie","Baliq ovlash anjomlari","Gaz niqobi","Fonarik"],
  "Sir": ["Suv manbasini biladi","Yashirin qo‘rquvi bor","Omon qolish tajribasi bor","Hech kimga aytmagan siri bor","Boshpananing xaritasini topgan","Oldin yolg‘iz yashagan","Muhim ma’lumotni yashiradi","Boshqa guruhni taniydi","Yashirin zaxirasi bor","Kutilmagan qobiliyati bor"]
};
const modifiers = {
  "Kasb": ["tajribali","yosh mutaxassis","usta","sobiq mutaxassis","tezkor","ixtirochi","puxta bilimli","amaliy tajribali","qiyin vaziyatga moslashgan","jamoada ishlaydigan","mustaqil ishlaydigan","kam uchraydigan mutaxassislik","ko‘p tilli","dala sharoitida ishlagan","rahbarlik tajribali","shogird tayyorlagan","eski usullarni biladi","zamonaviy texnikani biladi","ta’mirlashga usta","muammolarni tez hal qiladi"],
  "Sog‘liq": ["yengil darajada","o‘rtacha darajada","yaxshi nazorat qilinadi","vaqti-vaqti bilan bezovta qiladi","jismoniy faol","tez tiklanadi","sovuqqa chidamli","issiqqa chidamli","doimiy kuzatuv talab qiladi","maxsus parvarish talab qiladi","harakatlanishga ta’sir qiladi","uyquga ta’sir qiladi","stressda kuchayadi","dori bilan nazorat qilinadi","uzoq yurishda bilinadi","vaqtinchalik holat","yaxshi immunitet","chidamliligi yuqori","chidamliligi past","alohida ehtiyotkorlik kerak"],
  "Yosh": ["jismonan baquvvat","katta hayotiy tajribali","tez o‘rganuvchi","chidamli","ehtiyotkor","faol","kuzatuvchan","mustaqil","jamoaviy ishlashni yoqtiradi","rejalashtirishga usta"],
  "Xobbi": ["bolaligidan shug‘ullanadi","professional darajada","mustaqil o‘rgangan","jamoa bilan bajaradi","maxsus asboblari bor","boshqalarga o‘rgata oladi","dala sharoitida foydali","kam uchraydigan mashg‘ulot","ko‘p yillik tajribaga ega","yangi boshlagan","tez o‘rganadi","ijodiy yondashadi","amaliy foyda keltiradi","sabr talab qiladi","aniqlik talab qiladi","xavfsizlikni yaxshi biladi"],
  "Yuk": ["yangi","eski, ammo ishlaydi","mustahkamlangan","ixcham","og‘ir","yengil","zaxira nusxasi","suv o‘tkazmaydigan qadoqda","ta’mirlangan","qo‘lda yasalgan","cheklangan miqdorda","uzoq muddat saqlanadi","batareyasi bor","qo‘shimcha qismlari bor","maxsus himoya qopida"],
  "Sir": ["faqat bir kishiga aytgan","eski voqea bilan bog‘liq","jamoaga foyda keltirishi mumkin","xavfli ma’lumot","hali tekshirilmagan","kutilmagan oqibatga ega","boshqa o‘yinchiga aloqador","vaqt o‘tishi bilan ochiladi","ishonch talab qiladi","muhim qarorga ta’sir qiladi","yashirin dalilga ega","sirli xabar bilan bog‘liq","ikki xil talqin qilinadi","jamoani ajratishi mumkin","kelishuvga yordam berishi mumkin"]
};
for (const category of Object.keys(cardDeck)) {
  const base = [...cardDeck[category]];
  cardDeck[category] = [...new Set(base.flatMap(card => [card, ...(modifiers[category] || []).map(m => `${card} — ${m}`)]))];
}
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const cleanCode = code => String(code || "").trim().toUpperCase();
function reply(cb, value) { if (typeof cb === "function") cb(value); }
function publicPlayers(room) { return room.players.map(p => ({ id: p.id, name: p.name, isHost: p.id === room.host })); }
function sendPlayers(code) {
  const room = rooms[code];
  if (room) io.to(code).emit("playersUpdated", publicPlayers(room));
}
function finishIfTwo(code) {
  const room = rooms[code];
  if (!room || room.players.length !== 2 || room.finished) return;
  room.finished = true;
  room.voting = null;
  io.to(code).emit("gameFinished", {
    winners: publicPlayers(room),
    message: "O‘yin tugadi! Boshpanada aynan 2 kishi qoldi."
  });
}
io.on("connection", socket => {
  socket.on("createRoom", (playerName, cb) => {
    let code = Math.random().toString(36).slice(2, 8).toUpperCase();
    while (rooms[code]) code = Math.random().toString(36).slice(2, 8).toUpperCase();
    rooms[code] = {
      host: socket.id, started: false, finished: false,
      players: [{ id: socket.id, name: String(playerName || "O‘yinchi").trim().slice(0,24) || "O‘yinchi" }],
      playerCards: {}, revealedCards: {}, voting: null
    };
    socket.join(code);
    reply(cb, { ok: true, code });
    sendPlayers(code);
    io.to(code).emit("systemMessage", { text: `${rooms[code].players[0].name} xona yaratdi.` });
  });

  socket.on("joinRoom", ({ code, name } = {}, cb) => {
    code = cleanCode(code);
    const room = rooms[code];
    if (!room) return reply(cb, { ok: false, error: "Xona topilmadi." });
    if (room.started) return reply(cb, { ok: false, error: "O‘yin boshlangan, qo‘shilish mumkin emas." });
    if (room.players.length >= 8) return reply(cb, { ok: false, error: "Xona to‘la (maksimum 8 o‘yinchi)." });
    if (room.players.some(p => p.id === socket.id)) return reply(cb, { ok: true, code });
    const player = { id: socket.id, name: String(name || "O‘yinchi").trim().slice(0,24) || "O‘yinchi" };
    room.players.push(player);
    socket.join(code);
    reply(cb, { ok: true, code });
    sendPlayers(code);
    io.to(code).emit("systemMessage", { text: `${player.name} xonaga qo‘shildi.` });
  });

  socket.on("startGame", (rawCode, cb) => {
    const code = cleanCode(rawCode), room = rooms[code];
    if (!room) return reply(cb, { ok: false, error: "Xona topilmadi." });
    if (room.host !== socket.id) return reply(cb, { ok: false, error: "Faqat xona egasi o‘yinni boshlaydi." });
    if (room.started) return reply(cb, { ok: false, error: "O‘yin allaqachon boshlangan." });
    if (room.players.length < 2) return reply(cb, { ok: false, error: "Kamida 2 o‘yinchi kerak." });
    room.started = true; room.finished = false; room.playerCards = {}; room.revealedCards = {}; room.voting = null;
    for (const player of room.players) {
      const cards = {};
      for (const [category, options] of Object.entries(cardDeck)) cards[category] = pick(options);
      room.playerCards[player.id] = cards;
      io.to(player.id).emit("privateCards", cards);
    }
    io.to(code).emit("gameStarted", { message: "O‘yin boshlandi!", players: publicPlayers(room) });
    io.to(code).emit("systemMessage", { text: "O‘yin boshlandi! Har bir o‘yinchida 6 ta maxfiy karta bor." });
    reply(cb, { ok: true });
  });

  socket.on("revealCard", ({ code: rawCode, category } = {}, cb) => {
    const code = cleanCode(rawCode), room = rooms[code];
    if (!room || !room.started || room.finished) return reply(cb, { ok: false, error: "O‘yin faol emas." });
    const player = room.players.find(p => p.id === socket.id);
    const cards = room.playerCards[socket.id];
    if (!player || !cards || !Object.prototype.hasOwnProperty.call(cards, category)) return reply(cb, { ok: false, error: "Karta topilmadi." });
    room.revealedCards[socket.id] ||= [];
    if (!room.revealedCards[socket.id].includes(category)) room.revealedCards[socket.id].push(category);
    io.to(code).emit("cardRevealed", { playerId: socket.id, playerName: player.name, category, value: cards[category] });
    reply(cb, { ok: true });
  });

  socket.on("startVoting", (rawCode, cb) => {
    const code = cleanCode(rawCode), room = rooms[code];
    if (!room || !room.started || room.finished) return reply(cb, { ok: false, error: "O‘yin faol emas." });
    if (room.host !== socket.id) return reply(cb, { ok: false, error: "Faqat xona egasi ovoz berishni boshlaydi." });
    if (room.players.length <= 2) return reply(cb, { ok: false, error: "O‘yin tugagan: 2 kishi qoldi." });
    if (room.voting?.active) return reply(cb, { ok: false, error: "Ovoz berish allaqachon boshlangan." });
    room.voting = { active: true, votes: {} };
    io.to(code).emit("votingStarted", { players: publicPlayers(room) });
    io.to(code).emit("systemMessage", { text: "Ovoz berish boshlandi. Bitta o‘yinchini tanlang." });
    reply(cb, { ok: true });
  });

  socket.on("castVote", ({ code: rawCode, targetId } = {}, cb) => {
    const code = cleanCode(rawCode), room = rooms[code];
    if (!room || !room.voting?.active || room.finished) return reply(cb, { ok: false, error: "Ovoz berish faol emas." });
    if (!room.players.some(p => p.id === socket.id)) return reply(cb, { ok: false, error: "Siz bu xonada emassiz." });
    if (!room.players.some(p => p.id === targetId)) return reply(cb, { ok: false, error: "O‘yinchi topilmadi." });
    if (socket.id === targetId) return reply(cb, { ok: false, error: "O‘zingizga ovoz bera olmaysiz." });
    if (Object.prototype.hasOwnProperty.call(room.voting.votes, socket.id)) return reply(cb, { ok: false, error: "Siz allaqachon ovoz bergansiz." });
    room.voting.votes[socket.id] = targetId;
    reply(cb, { ok: true });
    const voted = Object.keys(room.voting.votes).length;
    io.to(code).emit("voteProgress", { voted, total: room.players.length });
    if (voted !== room.players.length) return;
    const counts = {};
    Object.values(room.voting.votes).forEach(id => counts[id] = (counts[id] || 0) + 1);
    const highest = Math.max(...Object.values(counts));
    const tied = Object.keys(counts).filter(id => counts[id] === highest);
    const eliminatedId = pick(tied); // Durang bo‘lsa, teng ovoz olganlardan biri tasodifiy chiqadi.
    const eliminated = room.players.find(p => p.id === eliminatedId);
    room.players = room.players.filter(p => p.id !== eliminatedId);
    delete room.playerCards[eliminatedId];
    delete room.revealedCards[eliminatedId];
    room.voting = null;
    if (room.host === eliminatedId && room.players.length) room.host = room.players[0].id;
    io.to(code).emit("votingResult", {
      eliminated: eliminated ? [{ id: eliminated.id, name: eliminated.name }] : [],
      remaining: publicPlayers(room),
      finished: room.players.length === 2,
      draw: false,
      message: room.players.length === 2
        ? "O‘yin tugadi! Boshpanada aynan 2 kishi qoldi."
        : tied.length > 1
          ? "Ovozlar teng bo‘ldi; teng ovoz olganlardan bittasi tasodifiy chiqarildi."
          : `${eliminated?.name || "O‘yinchi"} o‘yindan chiqarildi.`
    });
    sendPlayers(code);
    finishIfTwo(code);
  });

  socket.on("chatMessage", ({ code: rawCode, message } = {}, cb) => {
    const code = cleanCode(rawCode), room = rooms[code];
    if (!room || !room.players.some(p => p.id === socket.id)) return reply(cb, { ok: false, error: "Xona topilmadi." });
    const text = String(message || "").trim().slice(0, 500);
    if (!text) return reply(cb, { ok: false, error: "Xabar bo‘sh." });
    const player = room.players.find(p => p.id === socket.id);
    io.to(code).emit("chatMessage", { playerId: socket.id, playerName: player.name, message: text, time: new Date().toISOString() });
    reply(cb, { ok: true });
  });

  socket.on("disconnect", () => {
    for (const [code, room] of Object.entries(rooms)) {
      const wasHost = room.host === socket.id;
      const leaving = room.players.find(p => p.id === socket.id);
      room.players = room.players.filter(p => p.id !== socket.id);
      delete room.playerCards[socket.id];
      delete room.revealedCards[socket.id];
      if (room.voting?.votes) delete room.voting.votes[socket.id];
      if (!room.players.length) { delete rooms[code]; continue; }
      if (wasHost) room.host = room.players[0].id;
      if (room.voting?.active) {
        room.voting = null;
        io.to(code).emit("votingCancelled", { message: "O‘yinchi uzildi. Boshlovchi ovoz berishni qayta boshlashi mumkin." });
      }
      if (leaving) io.to(code).emit("systemMessage", { text: `${leaving.name} uzildi.` });
      sendPlayers(code);
      finishIfTwo(code);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => console.log(`Server ${PORT} portida ishga tushdi`));
