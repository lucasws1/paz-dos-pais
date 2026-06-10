import "dotenv/config";
import app from "./app.js";
import { startScheduler } from "./services/scheduler.service.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startScheduler();
});
