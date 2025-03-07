import { Server } from "socket.io";

let io;

const usersOnline = {};

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("joinRoom", (userId) => {
      socket.join(userId); // User joins a room based on their ID
    });

    // When a user joins, save their userId
    socket.on("userOnline", (userId) => {
      usersOnline[userId] = socket.id; // Map userId to socketId
      io.emit("updateUserStatus", {usersOnline});
    });

    socket.on("disconnect", () => {
      const userId = Object.keys(usersOnline).find(
        (key) => usersOnline[key] === socket.id
      );
      if (userId) {
        delete usersOnline[userId]; // Remove user from tracking
        io.emit("updateUserStatus", {usersOnline});
      }
      console.log(`User Disconnected: ${socket.id}`);
    });
  });
};

const sendNotification = (userId, notiData) => {
  if (io) {
    io.to(userId).emit("receiveNotification", { notiData });
  }
};

const sendRealTimeMessage = (receiverId, messageData) => {
  if (io) {
    io.to(receiverId).emit("receiveMessage", { messageData });
  }
};

const sendRealTimeFriendRequest = (receiverId, messageData) => {
  if (io) {
    io.to(receiverId).emit("newFriendRequest", { messageData });
  }
};

export { initializeSocket, sendNotification, sendRealTimeMessage,sendRealTimeFriendRequest };
