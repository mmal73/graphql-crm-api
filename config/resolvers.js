const userModel = require('../models/User');
const bcryptjs = require('bcryptjs');

const resolvers = {
    Query: {
        getUsers: () => {
            
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

        }
    }
};

module.exports = resolvers;
