const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
  account:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    required: [true, "Ledger must be associated with a account"],
    index: true,
    immutable: true,
  },
  amount: {
    type: Number,
    required: [true, "Amount is required for creating the ledger entry"],
    immutable: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "transaction",
    required: [true, "Ledger must be associated with a transaction"],
    index: true,
    immutable: true
  },
  type: {
    type: String,
    enum: {
      values: ["Credit", "Debit"],
      message: "Type can be either Credit or Debit",
    },
    required: [true, "Ledger type is required"],
    immutable: true,
  }
})

function preventLedgerModification() {
  throw new Error("Ledger entry cannot be modified after creation");
}

ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);

const ledgerModel = mongoose.model("ledger", ledgerSchema);

module.exports = ledgerModel;