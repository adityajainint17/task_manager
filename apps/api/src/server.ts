import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server started on 0.0.0.0:${env.PORT}`);
});

