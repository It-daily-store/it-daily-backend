// const { createAdapter } = require("@socket.io/redis-adapter");
// const redisClient = require("./redis");

import { Server } from "socket.io";
import { Server as htttpServer } from "http";
import { NextFunction, Request, Response } from "express";

let io: Server;

export const initializeSocketIO = (server: htttpServer) => {
  try {
    io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: ["http://localhost:3000"],
        credentials: true,
      },
      // connectionStateRecovery: {}
    });
    console.log("Socket initialized");
  } catch (e) {
    console.log(e);
  }

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }
  return io;
};
