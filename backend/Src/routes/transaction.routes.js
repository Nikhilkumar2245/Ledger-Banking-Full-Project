const {Router} = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

const transactionRoutes = Router();

transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

// Post /api/transactions/system/initail-funds
// Create initial funds transaction from system user 

transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitailFundsTransaction)

module.exports = transactionRoutes;