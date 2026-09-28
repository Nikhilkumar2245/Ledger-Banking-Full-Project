const transactionModel = require("../Models/transaction.model");
const ledgerModel = require("../Models/ledger.model");
const accountModel = require("../Models/account.model");
const emailService = require("../services/email.sevice");
const mongoose = require("mongoose");
const { promises } = require("nodemailer/lib/xoauth2");

/** 
 * -Create a new transaction
 * The 10-STEP Transaction flow:
 * 1. Validate request
 * 2. Validte idempotency key
 * 3. check account status
 * 4. Derive sender balance from ledger
 * 5. create transaction (pending)
 * 6. create debit ledger entry
 * 7. create credit ledger entry
 * 8. mark transaction as completed
 * 9. commit mongodb session
 * 10. Send email notification
 */

async function createTransaction(req, res){

  // 1. Validate request 
  const {fromAccount, toAccount, amount, idempotencyKey} = req.body;

  if(!fromAccount || !toAccount || !amount || !idempotencyKey){
    return res.status(400).json({
      message: "All fields are required"
    })
  }

  const fromUserAccount = await accountModel.findById({_id: fromAccount});
  const toUserAccount = await accountModel.findById({_id: toAccount});

  if(!fromUserAccount){
    return res.status(404).json({
      message: "Sender account not found"
    })
  }
  if(!toUserAccount){
    return res.status(404).json({
      message: "Receiver account not found"
    })
  }

  // 2. Validate idempotency key
  const isTransactionAlreadyExists = await transactionModel.findOne({idempotencyKey: idempotencyKey});

  if(isTransactionAlreadyExists){
    if(isTransactionAlreadyExists.status === "Completed"){
      return res.status(200).json({
        message: "Transaction already completed",
        transaction: isTransactionAlreadyExists
      })
    }
    if(isTransactionAlreadyExists.status === "Pending"){
      return res.status(200).json({
        message: "Transaction is already processing,please wait"
      })
    }
    if(isTransactionAlreadyExists.status === "Failed"){
      return res.status(500).json({
        message: "Transaction is already failed,please try again"
      })
    }
    if(isTransactionAlreadyExists.status === "Reversed"){
      return res.status(500).json({
        message: "Transaction is already reversed,please try again"
      })
    }
  }

  // 3. check account status
  if(fromUserAccount.status !== "Active" || toUserAccount.status !== "Active"){
    return res.status(400).json({
      message: "Both sender and receiver accounts must be active"
    })
  }

  // 4. Derive sender balance from ledger
  const balance = await fromUserAccount.getBalance();

  if(balance < amount){
   return res.status(400).json({
      message: `Insufficient balance. Current balance is ${balance}, but trying to send ${amount}`
    })
  }

  let transaction;
  try{
  
  // 5. Create Transaction (Pending)

  const session = await mongoose.startSession()
  session.startTransaction();

  transaction = (await transactionModel.create([{
    fromAccount,
    toAccount,
    amount,
    idempotencyKey,
    status: "Pending"
  }], {session}))[0];

  const debitLedgerEntry = await ledgerModel.create([{
    account: fromAccount,
    amount: amount,
    transaction: transaction._id,
    type: "Debit"
  }], {session})

 await (() => {
  return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
})();

  const creditLedgerEntry = await ledgerModel.create([{
    account: toAccount,
    amount: amount,
    transaction: transaction._id,
    type: "Credit"
  }], {session})
  
  await transactionModel.findOneAndUpdate(
    {_id: transaction._id},
    {status: "Completed"},
    {session}
  )

  await session.commitTransaction();
  session.endSession();

}catch (error){
  return res.status(400).json({
    message: "Transaction is Pending due to some issue, please retry after sometime ",
  })
}

  // 10. Send email notification
  
  await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);

  console.log("FINAL TRANSACTION:", transaction);

  return res.status(201).json({
    message: "Transaction completed successfully",
    transaction: transaction
  })


}        

async function createInitailFundsTransaction(req, res){
  const {toAccount, amount, idempotencyKey} = req.body

  if(!toAccount || !amount || !idempotencyKey){
    return res.status(400).json({
      message: "All fields are required"
    })
  }

  const toUserAccount = await accountModel.findOne({_id: toAccount});

  if(!toUserAccount){
    return res.status(404).json({
      message: "Receiver account not found"
    })
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id
  })

  if(!fromUserAccount){
    return res.status(404).json({
      message: "Sender account not found"
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "Pending"
  })
  
  const debitLedgerEntry = await ledgerModel.create([{
    account: fromUserAccount._id,
    amount: amount,
    transaction: transaction._id,
    type: "Debit"
  }], {session})

  const creditLedgerEntry = await ledgerModel.create([{
    account: toAccount,
    amount: amount,
    transaction: transaction._id,
    type: "Credit"
  }], {session})

  transaction.status = "Completed";
  await transaction.save({session})

  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    message: "Transaction completed successfully",
    transaction: transaction
  })


}

module.exports = {createTransaction, createInitailFundsTransaction};
