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
];

App.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
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