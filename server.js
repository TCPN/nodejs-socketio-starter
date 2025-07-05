const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createServer: createViteServer } = require('vite');

const { log } = require("./logger.js");
const { setupKeyboardShortcuts } = require("./serverHotkey.js");
const { transformState, initGameState, getActionInfo } = require("./game.js");
const { randomPick } = require("./random.js");


const app = express();
const httpServer = http.createServer(app)
const io = new Server(httpServer);

async function startServer() {
  // 🔥 建立 Vite dev server
  const vite = await createViteServer({
    server: { middlewareMode: 'html' }, // 🧠 用作 middleware
    root: 'client' // 指向前端目錄
  });

  app.use(vite.middlewares);
  app.use(express.static("public"));

  const messages = [];
  const votes = [];
  let gameState = null;
  let nextVoteStartTimeout = null;

  function isVoteRunning() {
    const lastVote = votes.at(-1);
    return lastVote && lastVote.finished !== true;
  }

  function getCurrentVote() {
    return votes.at(-1);
  }

  function cancelCurrentVote() {
    const vote = getCurrentVote();
    if (vote) {
      vote.canceled = true;
      clearTimeout(vote.timeoutId);
      delete vote.timeoutId;
      io.emit("vote cancel", vote);
    }
  }

  function tryStartVote(info) {
      if (isVoteRunning()) {
        return false;
      }
      Object.assign(info, {
        voteId: crypto.randomUUID(),
        endTime: info.timeout ? (Date.now() + info.timeout * 1000) : null,
      });
      votes.push(info);
      io.emit("vote start", info);
      if (info.timeout) {
        info.timeoutId = setTimeout(() => {
          endVote(info);
        }, info.timeout * 1000);
      }
      return true;
  }

  function endVote(info) {
    const { voteId } = info;
    const vote = votes.find((vote) => vote.voteId === voteId);
    if (!vote) {
      return;
    }
    vote.finished = true;
    if (vote.timeoutId !== undefined) {
      clearTimeout(vote.timeoutId);
      delete vote.timeoutId;
    }
    log("vote end", vote);
    io.emit("vote end", vote);
    messages.push(vote);

    const action = decideActionByVote(vote);
    goToNextGameState(action);
  }

  function goToNextGameState(action) {
    transformState(gameState, action);
    io.emit("game state", gameState);
    if (gameState.message) {
      io.emit("chat message", {
        name: '榮中青年',
        text: gameState.message,
      });
    }
    if (gameState.finishGoal) {
      return;
    }
    nextVoteStartTimeout = setTimeout(() => {
      trySetupGameVote();
    }, 3000);
  }

  function decideActionByVote(vote) {
    const allVotes = Object.values(vote.votes ?? {});
    const result = vote.items.map((item) => {
      const count = allVotes.filter(vote => vote === item.itemId).length;
      return {
        itemId: item.itemId,
        count,
      };
    });
    const highestCount = Math.max(...result.map((item) => item.count));
    if (highestCount === 0) {
      return null;
    }
    const highest = result.filter((item) => item.count === highestCount);
    const chosen = randomPick(highest);
    return chosen.itemId;
  }

  function makeGameVote(state) {
    const vote = {
      source: 'game',
      kind: 'direction',
      items: [
        { text: '上', itemId: 'U', info: getActionInfo(state, 'U') },
        { text: '左', itemId: 'L', info: getActionInfo(state, 'L') },
        { text: '下', itemId: 'D', info: getActionInfo(state, 'D') },
        { text: '右', itemId: 'R', info: getActionInfo(state, 'R') },
      ],
      timeout: 10,
    };
    return vote;
  }

  function trySetupGameVote() {
    if (gameState.paused) {
      return false;
    }
    const vote = makeGameVote(gameState);
    return tryStartVote(vote);
  }

  io.on("connection", (socket) => {
    log("使用者已連線");

    socket.on("chat message", (msg) => {
      log("[request] chat message", msg);
      io.emit("chat message", msg);
      messages.push(msg);
    });

    socket.on("game start", (callback) => {
      log("[request] game start");
      gameState = initGameState();
      callback(true);
      io.emit("game state", gameState);
      trySetupGameVote();
    });

    socket.on("game pause", (callback) => {
      log("[request] game pause");
      gameState.paused = true;
      callback(true);
      io.emit("game state", gameState);
      cancelCurrentVote();
    });

    socket.on("game resume", (callback) => {
      log("[request] game resume");
      gameState.paused = false;
      callback(true);
      io.emit("game state", gameState);
      trySetupGameVote();
    });

    socket.on("vote start", (info, callback) => {
      log("[request] vote start", info);
      // const started = tryStartVote(info);
      if (nextVoteStartTimeout) {
        clearTimeout(nextVoteStartTimeout);
      }
      const started = trySetupGameVote();
      callback(started);
    });

    socket.on("vote", (info) => {
      log("[request] vote", info);
      const vote = votes.find((vote) => vote.voteId === info.voteId);
      if (vote && vote.paused !== true) {
        vote.votes ??= {};
        vote.votes[info.userId] = info.itemId;
      }
    });

    socket.on("vote end", (info) => {
      log("[request] vote end", info);
      endVote(info);
    });

    socket.on("disconnect", () => {
      log("使用者離開");
    });

    socket.emit("sync", { messages, vote: isVoteRunning() ? votes.at(-1) : null, game: gameState });
  });

  const host = "0.0.0.0";
  const port = process.env.PORT || 3000;
  httpServer.listen(port, host, () => {
    console.log("伺服器已啟動於 port", port);
  });

  setupKeyboardShortcuts();
}

startServer();
