require('dotenv').config({path: '.env'});
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/User');
const productModel = require('../models/Product');
const clientModel = require('../models/Client');
const orderModel = require('../models/Order');
const { findOneAndUpdate } = require('../models/User');

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
        },

        getProduct: async (_, { id }) => {
            const existProduct = productModel.findById(id);
            if( !existProduct ){
                throw new Error('Product does not exist');
            }
            return existProduct;
        },

        getClients: async () => {
            try {
                return await clientModel.find({});
            } catch (error) {
                throw new Error(error);
            }
        },

        getSellerClients: async ( _, {}, ctx) => {
            try {
                console.log(ctx)
                return await clientModel.find( { seller: ctx.currentUser.id.toString() } );
            } catch (error) {
                throw new Error(error);
            }
        },

        getClient: async ( _, { id }, ctx ) => {
            // Check if client exist
            const clientExist = await clientModel.findById(id);
            if( !clientExist ){
                throw new Error('The client does not exist');
            }
            // Who created it can see it
            console.log(clientExist)
            console.log(ctx.currentUser)
            if( clientExist.seller.toString() !== ctx.currentUser.id ){
                throw new Error("Can't you see it");
            }
            return clientExist;
        },

        getOrders: async () => {
            try {
                return await orderModel.find({});
            } catch (error) {
                throw new Error(error);
            }
        },

        getSellerOrders: async (_, {}, ctx) => {
            try {
                return await orderModel.find({ seller: ctx.currentUser.id});
            } catch (error) {
                throw new Error(error);
            }
        },

        getOrder: async (_, { id }, ctx) => {
            try {
                const existOrder = await orderModel.findById(id);
                if( !existOrder ){
                    throw new Error('Order does not exist');
                }
                if( existOrder.seller.toString() !== ctx.currentUser.id ){
                    throw new Error("Can't you see it");
                }
                return existOrder;
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
        
        updateProduct: async (_, { id, input }) => {
            // Check if the product exist
            const existProduct = productModel.findById(id);
            if( !existProduct ){
                throw new Error('Product does not exist');
            }
            return await productModel.findOneAndUpdate( { _id: id }, input, { new: true } );
        },
        
        deleteProduct: async (_, { id, input }) => {
            // Check if the product exist
            const existProduct = productModel.findById(id);
            if( !existProduct ){
                throw new Error('Product does not exist');
            }
            
            await productModel.findOneAndDelete( { _id: id } );
            return "Product removed";
        },
        
        newClient: async (_, { input }, ctx) => {
            // Check if the client exist
            const { email } = input;
            const existClient = await clientModel.findOne({email});
            
            if( existClient ){
                throw new Error('Client exist');
            }

            try {
                const newClient = new clientModel(input);
                newClient.seller = ctx.currentUser.id.toString()
                return await newClient.save();
            } catch (error) {
                throw new Error(error);
            }
        },

        updateClient: async ( _, { id, input }, ctx ) => {
            // Check if exist the client
            const existClient = await clientModel.findById( id );
            if( !existClient ){
                throw new Error('Client does not exist');
            }
            // Who created it can see it
            if( existClient.seller.toString() !== ctx.currentUser.id ){
                throw new Error("Can't you see it");
            }
            return await clientModel.findOneAndUpdate( { _id: id }, input, { new: true } );
        },

        deleteClient: async ( _, { id }, ctx  ) => {
            // Check if exist the client
            const existClient = await clientModel.findById( id );
            if( !existClient ){
                throw new Error('Client does not exist');
            }
            // Who created it can see it
            if( existClient.seller.toString() !== ctx.currentUser.id ){
                throw new Error("Can't you see it");
            }
            await clientModel.findOneAndDelete( { _id: id } );
            return "Client removed";
        },
        // Orders
        newOrder: async ( _, { id, input },  ctx) => {
            const { client } = input;
            // Check if exist the client
            const existClient = await clientModel.findById( client );
            if( !existClient ){
                throw new Error('Client does not exist');
            }
            // Who created it can see it
            if( existClient.seller.toString() !== ctx.currentUser.id ){
                throw new Error("Can't you see it");
            }
            // Check stock of product
            
            for await ( const article of input.order){
                const { id, quantity } = article;
                const findProduct = await productModel.findById(id);
                if( findProduct.stock < quantity ){
                    throw new Error(`No quantity available for ${findProduct.name}`);
                }else{
                    findProduct.stock = findProduct.stock - quantity;
                    await findProduct.save();
                }
            }
            
            // Create order
            const newOrder = new orderModel(input);
            // Assign seller
            newOrder.seller = ctx.currentUser.id;
            // Save in database
            return await newOrder.save();
        },

        updateOrder: async ( _, { id, input }, ctx) => {
            const { client } = input;
            const existOrder = await orderModel.findById(id);
            if( !existOrder ){
                throw new Error('Order does not exist');
            }
            const existClient = await clientModel.findById(client);
            if( !existClient ){
                throw new Error('Client does not exist');
            }
            // if client belongs to the seller
            if( existClient.seller.toString() !== ctx.currentUser.id ){
                throw new Error("Can't you see it");
            }
            for await ( const article of input.order){
                const { quantity } = article;
                const findProduct = await productModel.findById(article.id);
                if( findProduct.stock < quantity ){
                    throw new Error(`No quantity available for ${findProduct.name}`);
                }else{
                    findProduct.stock = findProduct.stock - quantity;
                    await findProduct.save();
                }
            }
            return await orderModel.findOneAndUpdate( { _id: id }, input, { new: true } );
        },

        deleteOrder: async ( _, { id }, ctx) => {
            const existOrder = await orderModel.findById(id);
            if( !existOrder ){
                throw new Error('Order does not exist');
            }
            // if client belongs to the seller
            if( existOrder.seller.toString() !== ctx.currentUser.id ){
                throw new Error("Can't you see it");
            }
            await orderModel.findOneAndDelete( { _id: id } );
            return 'Order deleted';
        }
    }
};

module.exports = resolvers;
