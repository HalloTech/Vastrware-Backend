const express = require('express');
const router = express.Router();
const Product = require("../Models/ProductSchema")
const multer = require("multer");
const {uploadToS3} =require("../utility/S3UtilityforImageUpload");


const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: name
 *         type: string
 *         required: true
 *       - in: formData
 *         name: description
 *         type: string
 *         required: true
 *       - in: formData
 *         name: price
 *         type: number
 *         required: true
 *       - in: formData
 *         name: category
 *         type: string
 *         required: true
 *       - in: formData
 *         name: subCategory
 *         type: string
 *       - in: formData
 *         name: stockQuantity
 *         type: number
 *         required: true
 *       - in: formData
 *         name: size
 *         type: string
 *       - in: formData
 *         name: color
 *         type: string
 *       - in: formData
 *         name: material
 *         type: string
 *       - in: formData
 *         name: isAvailable
 *         type: boolean
 *       - in: formData
 *         name: discountPercentage
 *         type: number
 *       - in: formData
 *         name: tags
 *         type: array
 *         items:
 *           type: string
 *       - in: formData
 *         name: images
 *         type: array
 *         items:
 *           type: file
 *         collectionFormat: multi
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Error creating product
 */
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      stockQuantity,
      size,
      color,
      isAvailable,
      discountPercentage,
      tags,
      ...otherDetails
    } = req.body;

    // Basic validation
    if (!name || !description || !price || !category || !stockQuantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToS3(file));
      imageUrls = await Promise.all(uploadPromises);
    }

    // Create a new product instance
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      subCategory,
      images: imageUrls,
      stockQuantity,
      size,
      color,
      material,
      isAvailable,
      discountPercentage,
      tags,
      ...otherDetails
    });

    // Save the product to the database
    const savedProduct = await newProduct.save();

    res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});



router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const sortBy = req.query.sortBy || 'createdAt'; 
    const order = req.query.order === 'asc' ? 1 : -1; 
    const search = req.query.search || ''; 

    const query = search
      ? { $text: { $search: search } }
      : {};

    const options = {
      page: page,
      limit: limit,
      sort: { [sortBy]: order },
      collation: { locale: 'en' } 
    };

    const result = await Product.paginate(query, options);

    res.json({
      products: result.docs,
      currentPage: result.page,
      totalPages: result.totalPages,
      totalProducts: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});


router.get('/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || 'createdAt';
      const order = req.query.order === 'asc' ? 1 : -1;
      const subCategory = req.query.subCategory;
  
      let query = { category: category };
  
     
      if (subCategory) {
        query.subCategory = subCategory;
      }
  
      const options = {
        page: page,
        limit: limit,
        sort: { [sortBy]: order },
        collation: { locale: 'en' } 
      };
  
      const result = await Product.paginate(query, options);
  
      if (result.docs.length === 0) {
        return res.status(404).json({ message: 'No products found in this category' });
      }
  
      res.json({
        products: result.docs,
        currentPage: result.page,
        totalPages: result.totalPages,
        totalProducts: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      });
    } catch (error) {
      console.error('Error fetching products by category:', error);
      res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
  });

  router.get('/search', async (req, res) => {
    try {
      const { query, page = 1, limit = 10 } = req.query;
      
      const searchQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { subCategory: { $regex: query, $options: 'i' } }
        ]
      };
  
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        select: 'name category subCategory price stockQuantity', // Limit fields for brevity
        sort: { createdAt: -1 }
      };
  
      const result = await Product.paginate(searchQuery, options);
  
      res.json({
        products: result.docs,
        currentPage: result.page,
        totalPages: result.totalPages,
        totalProducts: result.totalDocs
      });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ message: 'Error searching products', error: error.message });
    }
  });

  router.put('/update/:id', upload.array('images', 5), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, ...updateData } = req.body;
  
      // Log request body and files for debugging
      console.log('Request Body:', req.body);
      console.log('Files:', req.files);
  
      if (!id) {
        return res.status(400).json({ message: 'Product ID is required for updating' });
      }
  
      // Handle image uploads separately if they are provided
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file => uploadToS3(file));
        const imageUrls = await Promise.all(uploadPromises);
        updateData.images = imageUrls;
      }
  
      // Find the product by ID and update it
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
  
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      // Send the updated product in the response
      res.json({
        message: 'Product updated successfully',
        product: updatedProduct
      });
    } catch (error) {
      console.error('Error updating product:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
      }
      res.status(500).json({ message: 'Error updating product', error: error.message });
    }
  });

  router.patch('/deactivate/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!id) {
        return res.status(400).json({ message: 'Product ID is required' });
      }
  
      // Find the product by ID and update its availability
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: { isAvailable: false } },
        { new: true, runValidators: true }
      );
  
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      res.json({
        message: 'Product deactivated successfully',
        product: updatedProduct
      });
    } catch (error) {
      console.error('Error deactivating product:', error);
      res.status(500).json({ message: 'Error deactivating product', error: error.message });
    }
  });

  router.get('/tags/:tag', async (req, res) => {
    try {
      const { tag } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
  
      const products = await Product.find({ tags: tag })
                                    .skip((page - 1) * limit)
                                    .limit(limit);
  
      res.json({ products });
    } catch (error) {
      console.error('Error fetching products by tag:', error);
      res.status(500).json({ message: 'Error fetching products by tag', error: error.message });
    }
  });

  router.patch('/bulk-update', async (req, res) => {
    try {
      const updates = req.body; // Expecting an array of update objects with product ID and fields to update
  
      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: 'Updates should be an array' });
      }
  
      const bulkOps = updates.map(update => ({
        updateOne: {
          filter: { _id: update.id },
          update: { $set: update.data },
          upsert: false
        }
      }));
  
      const result = await Product.bulkWrite(bulkOps);
  
      res.json({
        message: 'Products updated successfully',
        result
      });
    } catch (error) {
      console.error('Error bulk updating products:', error);
      res.status(500).json({ message: 'Error bulk updating products', error: error.message });
    }
  });
  

  router.get('/new-arrivals', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
  
      const products = await Product.find()
                                    .sort({ createdAt: -1 })
                                    .limit(limit);
  
      res.json({ products });
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
      res.status(500).json({ message: 'Error fetching new arrivals', error: error.message });
    }
  });

  router.get('/carousel', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; 
      const limit = parseInt(req.query.limit) || 10; 
      const sortBy = req.query.sortBy || 'createdAt'; 
      const order = req.query.order === 'asc' ? 1 : -1; 
      const search = req.query.search || ''; 
  
      const query = { carousel: true };
      if (search) {
        query.$text = { $search: search };
      }
  
      const options = {
        page: page,
        limit: limit,
        sort: { [sortBy]: order },
        collation: { locale: 'en' }
      };
  
      const result = await Product.paginate(query, options);
  
      res.json({
        products: result.docs,
        currentPage: result.page,
        totalPages: result.totalPages,
        totalProducts: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      });
    } catch (error) {
      console.error('Error fetching carousel products:', error);
      res.status(500).json({ message: 'Error fetching carousel products', error: error.message });
    }
  });

  router.get('/most-selling', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; 
      const limit = parseInt(req.query.limit) || 10; 
      const sortBy = req.query.sortBy || 'createdAt'; 
      const order = req.query.order === 'asc' ? 1 : -1; 
      const search = req.query.search || ''; 
  
      const query = { most_selling_product: true };
      if (search) {
        query.$text = { $search: search };
      }
  
      const options = {
        page: page,
        limit: limit,
        sort: { [sortBy]: order },
        collation: { locale: 'en' }
      };
  
      const result = await Product.paginate(query, options);
  
      res.json({
        products: result.docs,
        currentPage: result.page,
        totalPages: result.totalPages,
        totalProducts: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      });
    } catch (error) {
      console.error('Error fetching most selling products:', error);
      res.status(500).json({ message: 'Error fetching most selling products', error: error.message });
    }
  });
  
  
  
  

module.exports = router;