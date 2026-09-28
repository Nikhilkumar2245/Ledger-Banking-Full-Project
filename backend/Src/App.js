const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");


const authRoutes = require("./routes/authRoutes");
const accountRoute = require("./routes/account.routers");
const transactionRoutes = require("./routes/transaction.routes");

const App = express();
App.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
App.use(express.json());
App.use(cookieParser());

App.get("/", (req, res) => {
  res.send("Hello Nikhil!")
})

App.use("/api/auth", authRoutes);
App.use("/api/accounts", accountRoute);
App.use("/api/transaction", transactionRoutes);


module.exports = App