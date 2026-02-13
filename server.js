const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createServer: createViteServer } = require('vite');

const { log } = require("./logger.js");
const { setupKeyboardShortcuts } = require("./serverHotkey.js");
const { transformState, initGameState, getActionInfo } = require("./game.js");
const { randomPick } = require("./random.js");

const { Direction } = require("./game/types.js");

/** @typedef {string} VoteID */
/** @typedef {'game'} VoteSource */
/** @typedef {'direction'} VoteKind */
/** @typedef {number} VoteTimeout */
/**
 * @typedef {{
 *  text: string,
 *  itemId: string,
 *  info: ReturnType<typeof getActionInfo>,
 * }} VoteItem
 */

/**
 * @typedef {{
 *  voteId: VoteID,
 *  index: number,
 *  source: VoteSource,
 *  kind: VoteKind,
 *  items: VoteItem[],
 *  timeout: VoteTimeout,
 *  endTime?: number | null,
 *  timeoutId?: NodeJS.Timeout,
 * }} Vote
 */

// ref: https://chatgpt.com/s/t_687e7ff5a9908191a592f4b24c96233d

const app = express();
const httpServer = http.createServer(app)
const io = new Server(httpServer);

io.use((socket, next) => {
  const clientId = socket.handshake.auth.clientId;
  if (!clientId) {
    return next(new Error('Missing clientId'));
  }
  socket.clientId = clientId; // 自定義保存
  next();
});

async function startServer() {
  // 🔥 建立 Vite dev server
  const vite = await createViteServer({
    server: { middlewareMode: 'html' }, // 🧠 用作 middleware
    root: 'client' // 指向前端目錄
  });

  app.use(vite.middlewares);
  app.use(express.static("public"));

  const clients = new Map();
  const messages = [];
  const votes = [];
  let gameState = null;
  let nextVoteStartTimeoutID = null;
  let hostFullControl = false;

  /** @type {number} */
  let voteTimeout = 10; // seconds
  /** @type {number} */
  let voteInterval = 3; // seconds

  /**
   * @param {Vote} vote
   * @returns {Vote & { timeoutId: undefined }}
   */
  function makeVoteEmitSafe(vote) {
    return {
      ...vote,
      timeoutId: undefined,
    };
  }

  /** @returns {boolean} */
  function isVoteRunning() {
    const lastVote = votes.at(-1);
    return lastVote && lastVote.finished !== true;
  }

  /**
   * @returns { Vote | undefined }
   */
  function getCurrentVote() {
    return votes.at(-1);
  }

  function cancelCurrentVote() {
    const vote = getCurrentVote();
    if (vote) {
      vote.canceled = true;
      stopVoteTimeout(vote)
      io.emit("vote cancel", makeVoteEmitSafe(vote));
    }
  }

  /**
   * @param {Vote} vote
   * @returns {number | null}
   */
  function getVoteEndTime(vote) {
    return vote.timeout ? (Date.now() + vote.timeout * 1000) : null;
  }

  /**
   * @param {Vote} vote
   * @returns  {boolean}
   */
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
      io.emit("vote start", makeVoteEmitSafe(vote));
      log("vote start", vote);
      tryStartVoteTimeout(vote);
      return true;
  }

  /**
   * @param {Vote} vote
   * @param {number} timeout  ???
   */
  function setVoteTimeout(vote, timeout) {
    vote.timeout = timeout;
    vote.endTime = getVoteEndTime(vote);
  }

  /**
   * @param {Vote} vote
   */
  function pauseVote(vote) {
    stopVoteTimeout(vote);
    vote.paused = true;
    vote.remainTimeout = vote.endTime - Date.now();
  }

  /**
   * @param {Vote} vote
   */
  function resumeVote(vote) {
    vote.paused = false;
    vote.endTime = Date.now() + vote.remainTimeout;
    vote.remainTimeout = null;
    tryStartVoteTimeout(vote);
  }

  /**
   * @param {Vote} vote
   * @returns {boolean}
   */
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

  /**
   * @param {Vote} vote
   */
  function stopVoteTimeout(vote) {
    clearTimeout(vote.timeoutId);
    delete vote.timeoutId;
  }

  /**
   * @param {{ voteId: string }} info
   */
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
    io.emit("vote end", makeVoteEmitSafe(vote));
    messages.push(vote);

    const action = decideActionByVote(vote);
    goToNextGameState(action);
  }

  function startBetweenVoteTimeout() {
    stopBetweenVoteTimeout();
    nextVoteStartTimeoutID = setTimeout(() => {
      nextVoteStartTimeoutID = null;
      trySetupGameVote();
    }, hostFullControl ? 0 : voteInterval * 1000);
  }

  function stopBetweenVoteTimeout() {
    if (nextVoteStartTimeoutID) {
      clearTimeout(nextVoteStartTimeoutID);
      nextVoteStartTimeoutID = null;
    }
  }

  /**
   * @param {Direction | null} action
   */
  function goToNextGameState(action) {
    transformState(gameState, action);
    io.emit("game state", gameState);
    if (gameState.message) {
      const data = {
        name: '榮中青年',
        text: gameState.message,
      };
      io.emit("chat message", data);
    }
    if (gameState.end) {
      return;
    }
    startBetweenVoteTimeout();
  }

  /**
   * @param {Vote} vote
   * @returns {Direction | null}
   */
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

  /**
   * @returns {Vote}
   */
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
      timeout: voteTimeout,
    };
    return vote;
  }

  function trySetupGameVote() {
    if (!gameState || gameState.paused) {
      return false;
    }
    const vote = makeGameVote(gameState);
    return tryStartVote(vote);
  }

  function setupClient(socket) {
    socket.on("chat message", (msg) => {
      log("[request] chat message", msg);
      io.emit("chat message", msg);
      messages.push(msg);
    });

    socket.on("game start", (callback) => {
      log("[request] game start");
      const playerIds = ([...clients.values()]
        .filter((client) => client.role === 'player')
        .map(client => client.id));
      gameState = initGameState(playerIds);
      io.emit("game state", gameState);
      trySetupGameVote();
      callback(true);
    });

    socket.on("game stop", (callback) => {
      log("[request] game stop");
      if (isVoteRunning()) {
        const vote = getCurrentVote()
        vote.finished = true;
        stopVoteTimeout(vote);
        stopBetweenVoteTimeout();
        io.emit("vote update", null);
      }
      gameState = null;
      io.emit("game state", null);
      callback(true);
    });

    socket.on("game pause", (callback) => {
      log("[request] game pause");
      if (isVoteRunning()) {
        const vote = getCurrentVote();
        pauseVote(vote);
        io.emit('vote update', makeVoteEmitSafe(vote))
      }
      gameState.paused = true;
      io.emit("game state", gameState);
      callback(true);
    });

    socket.on("game resume", (callback) => {
      log("[request] game resume");
      gameState.paused = false;
      io.emit("game state", gameState);
      if (isVoteRunning()) {
        const vote = getCurrentVote();
        resumeVote(vote);
        io.emit('vote update', makeVoteEmitSafe(vote))
      }
      callback(true);
    });

    socket.on("vote start", (info, callback) => {
      log("[request] vote start", info);
      // const started = tryStartVote(info);
      stopBetweenVoteTimeout();
      const started = trySetupGameVote();
      callback(started);
    });

    socket.on("vote", (info, callback) => {
      log("[request] vote", info);
      const vote = votes.find((vote) => vote.voteId === info.voteId);
      if (vote && vote.paused !== true) {
        vote.votes ??= {};
        vote.votes[info.userId] = info.itemId;
      }
      io.to(info.userId).emit("vote chosen", { [info.userId]: info.itemId });
      callback();
    });

    socket.on("vote set timeout", (info) => {
      log("[request] vote set timeout", info);
      const vote = votes.at(-1);
      if (vote?.voteId !== info.voteId) {
        return;
      }
      if ('timeout' in info) {
        stopVoteTimeout(vote);
        setVoteTimeout(vote, info.timeout);
        if (!('paused' in info) && !vote.paused) {
          tryStartVoteTimeout(vote);
        }
      }
      if (info.paused === true) {
        pauseVote(vote);
      } else if (info.paused === false) {
        resumeVote(vote);
      }
      io.emit("vote update", makeVoteEmitSafe(vote));
    });

    socket.on("vote end", (info) => {
      log("[request] vote end", info);
      endVote(info);
    });

    socket.on("vote cancel", (info) => {
      log("[request] vote cancel", info);
      cancelCurrentVote(info);
    });

    socket.on("set full control", (enabled, callback) => {
      log("[request] set full control", enabled);
      hostFullControl = enabled;
      callback();
    });

    const syncData = {
      messages,
      vote: isVoteRunning() ? makeVoteEmitSafe(getCurrentVote()) : null,
      game: gameState,
      clients: Object.fromEntries(clients.entries()),
    };
    socket.emit("sync", syncData);
  }

  io.on("connection", (socket) => {
    log(`使用者已連線: clientId = ${socket.clientId}`);

    socket.join(socket.clientId);
    const client = clients.get(socket.clientId) ?? {
      id: socket.clientId,
      sockets: {},
      name: `User ${socket.clientId.slice(0, 4)}`,
      status: 'online',
      role: 'player',
    };
    if (!clients.has(socket.clientId)) {
      clients.set(socket.clientId, client);
    }
    client.sockets[socket.id] = 'connected';
    client.status = 'online';
    io.emit("clients update", { [socket.clientId]: client });

    socket.on("rename", (name) => {
      client.name = name;
      if (name === 'IMHost') {
        client.role = 'host';
      }
      io.emit("clients update", { [socket.clientId]: {
        name: client.name,
        role: client.role,
      } });
    });

    socket.on("disconnect", () => {
      log(`使用者離開: clientId = ${socket.clientId}`);
      delete client.sockets[socket.id];
      if (Object.keys(client.sockets).length === 0) {
        io.emit("clients update", { [socket.clientId]: { status: 'offline' } });
      }
    });

    setupClient(socket);
  });

  const host = "0.0.0.0";
  const port = process.env.PORT || 3000;
  httpServer.listen(port, host, () => {
    console.log("伺服器已啟動於 port", port);
  });

  setupKeyboardShortcuts();
}

startServer();
