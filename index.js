const dotenv = require("dotenv");
dotenv.config(); // ✅ MUST BE FIRST

const express = require("express");
const cors = require("cors");
const contactRoutes = require("./routes/routes");
const paymentRoutes = require("./routes/paymentRoutes");

console.log("CLIENT ID:", process.env.PHONE_PE_CLIENT_ID);
const app = express();

// Parse JSON
app.use(express.json());

const allowedOrigins = [
  "http://localhost:3001",
  "https://neeltechnologies.net",
  // "http://localhost:5173",
  "https://www.neeltechnologies.com",
  "https://neeltechnologies.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("CORS error: origin not allowed", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Routes
app.use("/api", contactRoutes);
app.use("/api", paymentRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
