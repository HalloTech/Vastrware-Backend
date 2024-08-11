// server/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongodbURI = 'mongodb+srv://faiez:j8rn0AIqnawXbFH2@faiez.gknkolw.mongodb.net/06-JOBS-API?retryWrites=true&w=majority';
    // const mongodbURI='mongodb://localhost:27017/ecommerce'
    await mongoose.connect(mongodbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
