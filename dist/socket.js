"use strict";
// const { createAdapter } = require("@socket.io/redis-adapter");
// const redisClient = require("./redis");
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initializeSocketIO = void 0;
const socket_io_1 = require("socket.io");
let io;
const initializeSocketIO = (server) => {
    try {
        io = new socket_io_1.Server(server, {
            pingTimeout: 60000,
            cors: {
                origin: ["http://localhost:3000"],
                credentials: true,
            },
            // connectionStateRecovery: {}
        });
        console.log("Socket initialized");
    }
    catch (e) {
        console.log(e);
    }
    return io;
};
exports.initializeSocketIO = initializeSocketIO;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO is not initialized");
    }
    return io;
};
exports.getIO = getIO;
