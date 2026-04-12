const DEFAULT_PORT = 3001;

export function getEnv() {
  return {
    port: Number(process.env.PORT || DEFAULT_PORT),
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  };
}
