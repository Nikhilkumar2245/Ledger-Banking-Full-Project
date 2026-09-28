const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB connected Successfully");
  } catch (error) {
    console.log("Mongodb Connection Error", error.message);
    process.exit(1);
  }
}

module.exports = connectDb;