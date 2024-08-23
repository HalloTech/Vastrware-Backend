const express = require('express');
const router = express.Router();
const Product = require("../Models/ProductSchema")
const multer = require("multer");
const {uploadToS3} =require("../utility/S3UtilityforImageUpload");
const auth = require('../MiddleWare/auth');
const role = require('../MiddleWare/role');



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
router.post('/' , upload.array('images[]', 7), async (req, res) => {
  try {
    let {
      name,
      description,
      price,
      category,
      subCategory,
      stockQuantity,
      isAvailable,
      discountPercentage,
      tags,
      availableSizesColors,
      ...otherDetails
    } = JSON.parse(req.body.data);


   

    if (!name || !description || !price || !category || !stockQuantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (typeof availableSizesColors === 'string') {
      try {
        availableSizesColors = JSON.parse(availableSizesColors);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid availableSizesColors format' });
      }
    }
    console.log('Received parsedavailableSizesColors:', availableSizesColors);

    if (!Array.isArray(availableSizesColors)) {
      return res.status(400).json({ message: 'availableSizesColors must be an array' });
    }

    let imageUrls = [];
    let thumbnail
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async(file) => {
        if(file.originalname!='thumbnail'){
          return uploadToS3(file)
        }
        thumbnail=await uploadToS3(file)
        return null
      });
      imageUrls = await Promise.all(uploadPromises)
      imageUrls=imageUrls.filter((item)=>item!==null);
    }

    // console.log('THUMBNAIL',thumbnail)
    // console.log('IMG URL',imageUrls)

    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (error) {
        tags = tags.split(',').map(tag => tag.trim());
      }
    }

    // Create a new product instance
    const newProduct = new Product({
      name,
      description,
      price: Number(price),
      category,
      subCategory,
      images: imageUrls,
      thumbnail:thumbnail,
      stockQuantity: Number(stockQuantity),
      isAvailable: isAvailable === true,
      discountPercentage: Number(discountPercentage),
      tags: Array.isArray(tags) ? tags : [],
      availableSizesColors,
      ...otherDetails
    });

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

router.get('/search', async (req, res) => {
  try {
    const { category, query, page = 1, limit = 10 } = req.query;
    let filter = {};

    if (category) {
      filter.category = category;
    }

    if (query) {
      filter.$text = { $search: query };
    }

    if (!category && !query) {
      return res.status(400).json({ message: 'Please provide either category or query parameter' });
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 } 
    };

    const result = await Product.paginate(filter, options);

    res.json({
      products: result.docs,
      currentPage: result.page,
      totalPages: result.totalPages,
      totalProducts: result.totalDocs
    });
  } catch (error) {
    console.error('Error in product search:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/'    ,    async (req, res) => {
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

router.get('/:id' ,  async (req, res) => {
  try {
    const id = req.params.id;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});


router.get('/category/:category' ,  async (req, res) => {
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



  router.put('/update/:id', upload.array('images[]', 7), async (req, res) => {
    try {
      const { id } = req.params;
      const {  ...updateData } = JSON.parse(req.body.data);

      let availableSizesColors=updateData.availableSizesColors
  
      // console.log(309,updateData)
  
      if (!id) {
        return res.status(400).json({ message: 'Product ID is required for updating' });
      }

      if (typeof availableSizesColors === 'string') {
        try {
          availableSizesColors = JSON.parse(availableSizesColors);
        } catch (error) {
          return res.status(400).json({ message: 'Invalid availableSizesColors format' });
        }
      }
      // console.log('Received parsedavailableSizesColors:', availableSizesColors);
  
      if (!Array.isArray(availableSizesColors)) {
        return res.status(400).json({ message: 'availableSizesColors must be an array' });
      }

      updateData.availableSizesColors=availableSizesColors
  
      let imageUrls = [];
      let thumbnail;
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(async (file) => {
          if (file.originalname !== 'thumbnail') {
            return uploadToS3(file);
          }
          thumbnail = await uploadToS3(file);
          return null;
        });
        imageUrls = await Promise.all(uploadPromises);
        imageUrls = imageUrls.filter((item) => item !== null);
        updateData.images = [...updateData.prevImgs,...imageUrls];
        if(thumbnail){
          updateData.thumbnail = thumbnail;
        }
      }
  
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
  
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
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
  

  router.patch('/deactivate/:id' ,  async (req, res) => {
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

  router.get('/tags/:tag' ,  async (req, res) => {
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

  router.patch('/bulk-update' ,  async (req, res) => {
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
  

  router.get('/new-arrivals' ,  async (req, res) => {
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

  router.get('/carousel' ,  async (req, res) => {
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

  router.get('/most-selling' ,  async (req, res) => {
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

  router.delete(
    '/delete/:id',
    async (req, res) => {
      try {
        const product = await Product.deleteOne({ _id: req.params.id });
  
        res.status(200).json({
          success: true,
          message: `Product has been deleted successfully!`,
          product
        });
      } catch (error) {
        res.status(400).json({
          error: 'Your request could not be processed. Please try again.'
        });
      }
    }
  );
  
  
  
  

module.exports = router;