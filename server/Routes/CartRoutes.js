const express = require('express');
const router = express.Router();
const Cart = require('../Models/CartSchema');
const auth = require('../MiddleWare/auth');

router.get('/:userId' ,  async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId }).populate('products.product');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:userId/add', async (req, res) => {
  try {
    const { product, quantity, size, purchasePrice, totalPrice, priceWithTax, totalTax, status } = req.body;
    let cart = await Cart.findOne({ user: req.params.userId });

    if (!cart) {
      cart = new Cart({ user: req.params.userId, products: [] });
    }

    const existingItem = cart.products.find(item => item.product.toString() === product);

    if (existingItem) {
      // Update existing item quantity
      existingItem.quantity += quantity;
      // Update other fields if needed
      existingItem.size = size;
      existingItem.purchasePrice = purchasePrice;
      existingItem.totalPrice = totalPrice;
      existingItem.priceWithTax = priceWithTax;
      existingItem.totalTax = totalTax;
      existingItem.status = status;
    } else {
      // Add new item to the cart
      cart.products.push({
        product,
        quantity,
        size,
        purchasePrice,
        totalPrice,
        priceWithTax,
        totalTax,
        status
      });
    }
    console.log(cart)
    cart.updatedAt = Date.now();
    await cart.save();
    const result=await cart.populate('products.product')

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/:userId/update' ,  async (req, res) => {
  try {
    const { productId, quantity , size , purchasePrice ,totalPrice } = req.body;
    const cart = await Cart.findOne({ user: req.params.userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(item => item.product.toString() === productId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.quantity = quantity;
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:userId/remove/:productId' ,  async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:userId/clear' ,  async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;