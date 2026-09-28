const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const accountRoute = require("./routes/account.routers");
const transactionRoutes = require("./routes/transaction.routes");

const App = express();

const allowedOrigins = [
  "https://ledger-banking-full-project.vercel.app",
  "https://ledger-banking-full-project-31nlvvmhc-bulid2.vercel.app",
  "http://localhost:5173",
];

App.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (
        origin.startsWith("https://ledger-banking-full-project-") &&
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

App.use(express.json());
App.use(cookieParser());

App.get("/", (req, res) => {
  res.send("Hello Nikhil!");
});

App.use("/api/auth", authRoutes);
App.use("/api/accounts", accountRoute);
App.use("/api/transaction", transactionRoutes);

module.exports = App;