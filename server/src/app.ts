import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import fs from 'node:fs';

export function createApp() {
  const app = express();
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const clientDistDir = path.resolve(currentDir, '../../client/dist');

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({
      ok: true,
      service: 'who-is-spy-server',
      timestamp: new Date().toISOString(),
    });
  });

  if (fs.existsSync(clientDistDir)) {
    app.use(express.static(clientDistDir));

    app.get('*', (request, response, next) => {
      if (request.path.startsWith('/socket.io')) {
        next();
        return;
      }

      response.sendFile(path.join(clientDistDir, 'index.html'));
    });
  }

  return app;
}
