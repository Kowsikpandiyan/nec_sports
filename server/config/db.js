const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nec_sports';
  
  const options = {
    autoIndex: true,
  };

  try {
    await mongoose.connect(mongoURI, options);
    console.log('MongoDB Connected Successfully.');
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    console.log('Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
