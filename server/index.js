import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import connectDb from "./configs/db.js";
import cors from "cors";
import situationRouter from "./routes/situation.route.js";
const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send("Hello from the Backend Server!");
});

app.use(express.json());
app.use(cookieParser());

connectDb();

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/situations", situationRouter);
app.use("/v1/situations", situationRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
