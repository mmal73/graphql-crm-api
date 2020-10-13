require('dotenv').config({path: '.env'});
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/User');
const productModel = require('../models/Product');

const createToken = (user, word, expiration) =>{
    const {id, email, name, lastname} = user;
    
    return jwt.sign({id, email, name, lastname}, word, {expiresIn: expiration});
}

const resolvers = {
    Query: {
        getUser: async (_, { token }) => {
            return await jwt.verify(token, process.env.SECRET_WORD);
        },
        getProducts: async () => {
            try {
                return await productModel.find({});
            } catch (error) {
                throw new Error(error);
            }
        }
    },
    Mutation: {
        newUser: async(_, { input }) => {
            // Destructuring input
            const { email, password } = input;
            
            // Check if the user is already registered
            const userExist = await userModel.findOne({email}); 
            if(userExist){
                throw new Error('The user is already registered');
            }
            
            // Hash password
            input.password = await bcryptjs.hash(password, 10);
            
            // Save in db
            try {
                const newUser = new userModel(input);
                newUser.save();
                return newUser;
            } catch (error) {
                throw new Error(error);
            }

        },
        authenticateUser: async (_, { input })=>{
            // Destructuring input
            const { email, password } = input;
            
            // Check if the user exist
            const userExist = await userModel.findOne({email});
            if( !userExist ){
                throw new Error('The user is not already registered');
            }

            // Check if the password is correct
            const correctPassword = await bcryptjs.compare( password, userExist.password);
            if( !correctPassword ){
                throw new Error('The password is incorrect');
            }
            
            // Create token
            return {
                token: createToken(userExist, process.env.SECRET_WORD, '24h')
            }

        },
        newProduct: async (_, {input}) => {
            try{
                const product = new productModel(input);
                return product.save();
            } catch (error) {
                throw new Error(error);
            }

        },
    }
};

module.exports = resolvers;
