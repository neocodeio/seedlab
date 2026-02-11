import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
  console.log("SUPABASE_URL", process.env.SUPABASE_URL);
  console.log("SERVICE_ROLE", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
});
