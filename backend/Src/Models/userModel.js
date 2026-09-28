const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: [true, "Email is requires"],
    trim: true,
    lowercase: true,
    unique: [true, "Email is already exits"],
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email"]
  },
  password:{
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password should contain more then 6"],
    select: false
  },
  systemUser: {
    type: Boolean,
    default: false,
    immutable: true,
    select: false
  }
},
  {
    timestamps: true
})

userSchema.pre("save", async function() {
  if(!this.isModified("password")){
    return ;
  }
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash
  return 
})

userSchema.methods.comparePassword = async function(password){
  return bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;