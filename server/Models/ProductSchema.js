const mongoose = require('mongoose');

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
  availableSizesColors: [{
    size: {
      type: String,
      trim: true
    },
    colors: [{
      color: {
        type: String,
        trim: true
      },
      combination_price: {
        type: Number,
        min: 0
      }
    }]
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
  carousel: { type: Boolean, default: false },
  most_selling_product: { type: Boolean, default: false },
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
