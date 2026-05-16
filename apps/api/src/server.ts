import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";


async function startServer() {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log(`Connecting to database... (${retries} attempts left)`);
      await prisma.$connect();
      console.log("Database connected successfully.");
      break;
    } catch (err) {
      console.error("Database connection failed:", err);
      retries -= 1;
      if (retries === 0) {
        console.error("Could not connect to database. Exiting.");
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Server started on 0.0.0.0:${env.PORT}`);
  });
}

startServer();


