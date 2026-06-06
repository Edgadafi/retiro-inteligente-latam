import { env } from "./config/env.js";
import { createApp, prepareServer } from "./app.js";

async function bootstrap() {
  await prepareServer();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.info(`[Server] Retiro Inteligente LATAM API → http://localhost:${env.PORT}`);
  });
}

bootstrap();
