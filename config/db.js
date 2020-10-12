const mongoose = require('mongoose');

require('dotenv').config({path: '.env'});

const conectDB = async () =>{
    try{
        await mongoose.connect(process.env.DB_HOST, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log('DB conected');
    }catch(error){
        console.log(error);
        process.exit(1);
    }
}
module.exports = conectDB;