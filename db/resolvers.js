require('dotenv').config({ path: '.env' });
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/User');
const productModel = require('../models/Product');
const clientModel = require('../models/Client');
const orderModel = require('../models/Order');
const { findOneAndUpdate } = require('../models/User');
const Product = require('../models/Product');

const status = {
  CANCELED: 'CANCELED',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
};

const createToken = (user, word, expiration) => {
  const { id, email, name, lastname } = user;

  return jwt.sign({ id, email, name, lastname }, word, {
    expiresIn: expiration,
  });
};

const authUser = (ctx) => {
  const { currentUser } = ctx;
  if (!currentUser) throw new Error('Unauthenticated');
  return currentUser;
};

const resolvers = {
  Query: {
    getUser: async (_, {}, ctx) => {
      return authUser(ctx);
    },

    getProducts: async (_, {}, ctx) => {
      authUser(ctx);
      try {
        return await productModel.find({});
      } catch (error) {
        throw new Error(error);
      }
    },

    getProduct: async (_, { id }) => {
      authUser(ctx);
      const existProduct = productModel.findById(id);
      if (!existProduct) {
        throw new Error('Product does not exist');
      }
      return existProduct;
    },

    getClients: async (_, {}, ctx) => {
      authUser(ctx);
      try {
        return await clientModel.find({ seller: ctx.currentUser.id });
      } catch (error) {
        throw new Error(error);
      }
    },

    getSellerClients: async (_, {}, ctx) => {
      authUser(ctx);
      try {
        return await clientModel.find({
          seller: ctx.currentUser.id.toString(),
        });
      } catch (error) {
        throw new Error(error);
      }
    },

    getClient: async (_, { id }, ctx) => {
      authUser(ctx);
      // Check if client exist
      const clientExist = await clientModel.findById(id);
      if (!clientExist) {
        throw new Error('The client does not exist');
      }
      // Who created it can see it
      if (clientExist.seller.toString() !== ctx.currentUser.id) {
        throw new Error("Can't you see it");
      }
      return clientExist;
    },

    getOrders: async (_, {}, ctx) => {
      authUser(ctx);
      try {
        const allOrders = await orderModel
          .find({ seller: ctx.currentUser.id })
          .populate('client');
        return allOrders;
      } catch (error) {
        throw new Error(error);
      }
    },

    getSellerOrders: async (_, {}, ctx) => {
      authUser(ctx);
      try {
        const sellerOrders = await orderModel
          .find({ seller: ctx.currentUser.id })
          .populate('client');
        return sellerOrders;
      } catch (error) {
        throw new Error(error);
      }
    },

    getOrder: async (_, { id }, ctx) => {
      authUser(ctx);
      try {
        const existOrder = await orderModel.findById(id);
        if (!existOrder) {
          throw new Error('Order does not exist');
        }
        if (existOrder.seller.toString() !== ctx.currentUser.id) {
          throw new Error("Can't you see it");
        }
        return existOrder;
      } catch (error) {
        throw new Error(error);
      }
    },

    getOrdersForStatus: async (_, { status }, ctx) => {
      authUser(ctx);
      try {
        return await orderModel.find({ seller: ctx.currentUser.id, status });
      } catch (error) {
        throw new Error(error);
      }
    },

    bestClients: async (_, {}, ctx) => {
      authUser(ctx);
      try {
        const clients = await orderModel.aggregate([
          { $match: { status: status.COMPLETED } },
          {
            $group: {
              _id: '$client',
              total: { $sum: '$total' },
            },
          },
          {
            $lookup: {
              from: 'clients',
              localField: '_id',
              foreignField: '_id',
              as: 'client',
            },
          },
        ]);
        return clients;
      } catch (error) {
        throw new Error(error);
      }
    },
    bestSellers: async (_, {}, ctx) => {
      authUser(ctx);
      try {
        const sellers = await orderModel.aggregate([
          { $match: { status: status.COMPLETED } },
          {
            $group: {
              _id: '$seller',
              total: { $sum: '$total' },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'seller',
            },
          },
          {
            $limit: 5,
          },
          {
            $sort: { total: -1 },
          },
        ]);
        return sellers;
      } catch (error) {
        throw new Error(error);
      }
    },
    searchProduct: async (_, { text }) => {
      authUser(ctx);
      const products = await Product.find({ $text: { $search: text } });
      return products;
    },
  },
  Mutation: {
    newUser: async (_, { input }) => {
      // Destructuring input
      const { email, password } = input;

      // Check if the user is already registered
      const userExist = await userModel.findOne({ email });
      if (userExist) {
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

    authenticateUser: async (_, { input }) => {
      // Destructuring input
      const { email, password } = input;

      // Check if the user exist
      const userExist = await userModel.findOne({ email });
      if (!userExist) {
        throw new Error('The user is not already registered');
      }

      // Check if the password is correct
      const correctPassword = await bcryptjs.compare(
        password,
        userExist.password
      );
      if (!correctPassword) {
        throw new Error('The password is incorrect');
      }

      // Create token
      return {
        token: createToken(userExist, process.env.SECRET_WORD, '24h'),
      };
    },

    newProduct: async (_, { input }, ctx) => {
      authUser(ctx);
      try {
        const product = new productModel(input);
        return product.save();
      } catch (error) {
        throw new Error(error);
      }
    },

    updateProduct: async (_, { id, input }, ctx) => {
      authUser(ctx);
      // Check if the product exist
      const existProduct = productModel.findById(id);
      if (!existProduct) {
        throw new Error('Product does not exist');
      }
      return await productModel.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
    },

    deleteProduct: async (_, { id }, ctx) => {
      authUser(ctx);
      // Check if the product exist
      const existProduct = productModel.findById(id);
      if (!existProduct) {
        throw new Error('Product does not exist');
      }

      await productModel.findOneAndDelete({ _id: id });
      return 'Product removed';
    },

    newClient: async (_, { input }, ctx) => {
      authUser(ctx);
      // Check if the client exist
      const { email } = input;
      const existClient = await clientModel.findOne({ email });

      if (existClient) {
        throw new Error('Client exist');
      }

      try {
        const newClient = new clientModel(input);
        newClient.seller = ctx.currentUser.id.toString();
        return await newClient.save();
      } catch (error) {
        throw new Error(error);
      }
    },

    updateClient: async (_, { id, input }, ctx) => {
      authUser(ctx);
      // Check if exist the client
      const existClient = await clientModel.findById(id);
      if (!existClient) {
        throw new Error('Client does not exist');
      }
      // Who created it can see it
      if (existClient.seller.toString() !== ctx.currentUser.id) {
        throw new Error("Can't you see it");
      }
      return await clientModel.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
    },

    deleteClient: async (_, { id }, ctx) => {
      authUser(ctx);
      // Check if exist the client
      const existClient = await clientModel.findById(id);
      if (!existClient) {
        throw new Error('Client does not exist');
      }
      // Who created it can see it
      if (existClient.seller.toString() !== ctx.currentUser.id) {
        throw new Error("Can't you see it");
      }
      await clientModel.findOneAndDelete({ _id: id });
      return 'Client removed';
    },
    // Orders
    newOrder: async (_, { input }, ctx) => {
      authUser(ctx);
      const { client } = input;
      // Check if exist the client
      const existClient = await clientModel.findById(client);
      if (!existClient) {
        throw new Error('Client does not exist');
      }
      // Who created it can see it
      if (existClient.seller.toString() !== ctx.currentUser.id) {
        throw new Error("Can't you see it");
      }
      // Check stock of product

      for await (const article of input.order) {
        const { id, quantity } = article;
        const findProduct = await productModel.findById(id);
        if (findProduct.stock < quantity) {
          throw new Error(`No quantity available for ${findProduct.name}`);
        } else {
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

    updateOrder: async (_, { id, input }, ctx) => {
      authUser(ctx);
      const { client } = input;
      const existOrder = await orderModel.findById(id);
      if (!existOrder) {
        throw new Error('Order does not exist');
      }
      const existClient = await clientModel.findById(client);
      if (!existClient) {
        throw new Error('Client does not exist');
      }
      // if client belongs to the seller
      if (existClient.seller.toString() !== ctx.currentUser.id) {
        throw new Error("Can't you see it");
      }
      const order = input.order || [];
      for await (const article of order) {
        const { quantity } = article;
        const findProduct = await productModel.findById(article.id);
        if (findProduct.stock < quantity) {
          throw new Error(`No quantity available for ${findProduct.name}`);
        } else {
          findProduct.stock = findProduct.stock - quantity;
          await findProduct.save();
        }
      }
      return await orderModel.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
    },

    deleteOrder: async (_, { id }, ctx) => {
      authUser(ctx);
      const existOrder = await orderModel.findById(id);
      if (!existOrder) {
        throw new Error('Order does not exist');
      }
      // if client belongs to the seller
      if (existOrder.seller.toString() !== ctx.currentUser.id) {
        throw new Error("Can't you see it");
      }
      await orderModel.findOneAndDelete({ _id: id });
      return 'Order deleted';
    },
  },
};

module.exports = resolvers;
