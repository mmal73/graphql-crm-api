const mongoose = require('mongoose');

require('dotenv').config({ path: '.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_CONECTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    console.log('DB conected');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
module.exports = connectDB;
