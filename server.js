const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createServer: createViteServer } = require('vite');

const { log } = require("./logger.js");
const { setupKeyboardShortcuts } = require("./serverHotkey.js");
const { transformState, initGameState, getActionInfo } = require("./game.js");
const { randomPick } = require("./random.js");
const { isSafeToEmit } = require("./object.js");


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
      stopVoteTimeout(vote)
      isSafeToEmit(vote);
      io.emit("vote cancel", vote);
    }
  }

  function getVoteEndTime(vote) {
    return vote.timeout ? (Date.now() + vote.timeout * 1000) : null;
  }

  function tryStartVote(vote) {
      if (isVoteRunning()) {
        return false;
      }
      Object.assign(vote, {
        voteId: crypto.randomUUID(),
        index: votes.length,
      });
      votes.push(vote);
      setVoteTimeout(vote, vote.timeout);
      isSafeToEmit(vote);
      io.emit("vote start", vote);
      tryStartVoteTimeout(vote);
      return true;
  }

  function setVoteTimeout(vote, timeout) {
    vote.timeout = timeout;
    vote.endTime = getVoteEndTime(vote);
  }

  function tryStartVoteTimeout(vote) {
    if (vote.timeout) {
      const remainTime = vote.endTime ? vote.endTime - Date.now() : vote.timeout * 1000;
      vote.timeoutId = setTimeout(() => {
        endVote(vote);
      }, remainTime);
      return true;
    }
    return false;
  }

  function stopVoteTimeout(vote) {
    clearTimeout(vote.timeoutId);
    delete vote.timeoutId;
  }

  function endVote(info) {
    const { voteId } = info;
    const vote = votes.find((vote) => vote.voteId === voteId);
    if (!vote) {
      return;
    }
    vote.finished = true;
    if (vote.timeoutId !== undefined) {
      stopVoteTimeout(vote);
    }
    log("vote end", vote);
    isSafeToEmit(vote);
    io.emit("vote end", vote);
    messages.push(vote);

    const action = decideActionByVote(vote);
    goToNextGameState(action);
  }

  function goToNextGameState(action) {
    transformState(gameState, action);
    isSafeToEmit(gameState);
    io.emit("game state", gameState);
    if (gameState.message) {
      const data = {
        name: '榮中青年',
        text: gameState.message,
      };
      isSafeToEmit(data);
      io.emit("chat message", data);
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
      isSafeToEmit(msg);
      io.emit("chat message", msg);
      messages.push(msg);
    });

    socket.on("game start", (callback) => {
      log("[request] game start");
      gameState = initGameState();
      callback(true);
      isSafeToEmit(gameState);
      io.emit("game state", gameState);
      trySetupGameVote();
    });

    socket.on("game pause", (callback) => {
      log("[request] game pause");
      gameState.paused = true;
      callback(true);
      isSafeToEmit(gameState);
      io.emit("game state", gameState);
      cancelCurrentVote();
    });

    socket.on("game resume", (callback) => {
      log("[request] game resume");
      gameState.paused = false;
      callback(true);
      isSafeToEmit(gameState);
      io.emit("game state", gameState);
      trySetupGameVote();
    });

    socket.on("vote start", (info, callback) => {
      log("[request] vote start", info);
      // const started = tryStartVote(info);
      if (nextVoteStartTimeout) {
        clearTimeout(nextVoteStartTimeout);
        nextVoteStartTimeout = null;
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

    socket.on("vote set timeout", (info) => {
      log("[request] vote set timeout", info);
      const vote = votes.find((vote) => vote.voteId === info.voteId);
      if (vote) {
        if ('timeout' in info) {
          stopVoteTimeout(vote);
          setVoteTimeout(vote, info.timeout);
        }
        if (info.paused === true) {
          stopVoteTimeout(vote);
          vote.paused = true;
          vote.remainTimeout = vote.endTime - Date.now();
        } else if (info.paused === false) {
          vote.paused = false;
          vote.remainTimeout = null;
          tryStartVoteTimeout(vote);
        }
        if (!vote.paused && vote.timeout) {
          tryStartVoteTimeout(vote);
        }
      }
    });

    socket.on("vote end", (info) => {
      log("[request] vote end", info);
      endVote(info);
    });

    socket.on("vote cancel", (info) => {
      log("[request] vote cancel", info);
      cancelCurrentVote(info);
    });

    socket.on("disconnect", () => {
      log("使用者離開");
    });

    const syncData = {
      messages,
      vote: isVoteRunning() ? {
        ...votes.at(-1),
        timeoutId: undefined,
      } : null,
      game: gameState,
    };
    isSafeToEmit(syncData);
    socket.emit("sync", syncData);
  });

  const host = "0.0.0.0";
  const port = process.env.PORT || 3000;
  httpServer.listen(port, host, () => {
    console.log("伺服器已啟動於 port", port);
  });

  setupKeyboardShortcuts();
}

startServer();
