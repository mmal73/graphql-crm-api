const { gql } = require('apollo-server');

const typeDefs = gql`
    type User{
        id: ID
        name: String
        lastname: String
        email: String
        created_at: String
    }
    input UserInput{
        name: String
        lastname: String
        email: String
        password: String
    }
    type Query{
        getUsers: [User]
    }
    type Mutation{
        newUser(input: UserInput): User
    }
`;

module.exports = typeDefs;
