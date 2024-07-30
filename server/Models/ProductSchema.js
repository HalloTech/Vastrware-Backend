const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - category
 *         - images
 *         - stockQuantity
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the product
 *         description:
 *           type: string
 *           description: The description of the product
 *         price:
 *           type: number
 *           description: The price of the product
 *         category:
 *           type: string
 *           enum: ['Sarees', 'Lehenga', 'Suite', 'Gowns', 'Laungery & Garments', 'Thaan kapda', 'Froks']
 *           description: The category of the product
 *         subCategory:
 *           type: string
 *           description: The subcategory of the product
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs for the product
 *         stockQuantity:
 *           type: number
 *           description: The quantity of the product in stock
 *         size:
 *           type: string
 *           description: The size of the product
 *         color:
 *           type: string
 *           description: The color of the product
 *         material:
 *           type: string
 *           description: The material of the product
 *         isAvailable:
 *           type: boolean
 *           description: Availability of the product
 *           default: true
 *         discountPercentage:
 *           type: number
 *           description: Discount percentage for the product
 *           default: 0
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of tags for the product
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the product was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the product was last updated
 */

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Sarees', 'Lehenga', 'Suite', 'Gowns', 'Laungery & Garments', 'Thaan kapda', 'Froks']
  },
  subCategory: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    required: true
  }],
  stockQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  availableSizes: [{
    type: String,
    trim: true
  }],
  availableColors: [{
    type: String,
    trim: true
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  carousel: { type: Boolean, default: false }, // New field
  most_selling_product: { type: Boolean, default: false } ,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  product_specification: {
    material: { type: String },
    careInstruction: { type: String },
    dimensions: { type: String },
  },
});

productSchema.plugin(require('mongoose-paginate-v2'));

// Create a text index for search functionality
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Pre-save hook to update the 'updatedAt' field
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
