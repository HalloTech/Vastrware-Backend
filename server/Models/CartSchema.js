const mongoose = require('mongoose');
const { CART_ITEM_STATUS } = require('../constants');

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  size: {
    type: String,
    // required: true
  } , 
  purchasePrice: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  priceWithTax: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: CART_ITEM_STATUS.Not_processed,
    enum: [
      CART_ITEM_STATUS.Not_processed,
      CART_ITEM_STATUS.Processing,
      CART_ITEM_STATUS.Shipped,
      CART_ITEM_STATUS.Delivered,
      CART_ITEM_STATUS.Cancelled
    ]
  }

});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [CartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart;