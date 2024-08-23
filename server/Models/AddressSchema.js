const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  dateOfBirth: { type: Date, required: false },
  gender: { type: String, required: false },
  isDefault: {
    type: Boolean,
    default: false
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

const Address = mongoose.model('Address', AddressSchema);

module.exports = Address;
