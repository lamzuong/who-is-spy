import http from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { registerGameHandlers } from './sockets/registerGameHandlers.js';

const env = getEnv();
const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.clientOrigin,
    methods: ['GET', 'POST'],
  },
});

registerGameHandlers(io);

server.listen(env.port, () => {
  console.log(`Who is the Spy server listening on port ${env.port}`);
});
