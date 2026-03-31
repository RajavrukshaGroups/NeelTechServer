const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db"); // ✅ ADD

const contactRoutes = require("./routes/routes");
const paymentRoutes = require("./routes/paymentRoutes");
const paymentRoutesActDir = require("./routes/paymentRoutesActDir");

const app = express();

// ✅ CONNECT DATABASE
connectDB();

console.log("CLIENT ID:", process.env.PHONE_PE_CLIENT_ID);

// Middleware
app.use(express.json());

const allowedOrigins = [
  "http://localhost:3001",
  "https://neeltechnologies.net",
  "https://www.neeltechnologies.com",
  "https://neeltechnologies.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("CORS error:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Routes
app.use("/api", contactRoutes);
app.use("/api", paymentRoutes);
app.use("/api/active-dir", paymentRoutesActDir);

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});