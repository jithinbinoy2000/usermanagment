const mongoose = require('mongoose')

const  accountSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        lowercase: true,
        trim:true,
        index:true,
        unique:true
    },
    phone:{type:String,unique:true},
    address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zip: String,
  },
  balance: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'CLOSED'],
    default: 'ACTIVE',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isDeleted: { type: Boolean, default: false },
},{timestamps:true});

module.exports = mongoose.model("Account",accountSchema);
