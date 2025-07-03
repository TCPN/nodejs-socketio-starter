const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("使用者已連線");

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("使用者離開");
  });
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log("伺服器已啟動於 port", port);
});
