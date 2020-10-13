const { gql } = require('apollo-server');

const typeDefs = gql`
    type User{
        id: ID
        name: String
        lastname: String
        email: String
        created_at: String
    }
    type Token{
        token: String
    }
    input UserInput{
        name: String
        lastname: String
        email: String
        password: String
    }
    input authenticateInput{
        email: String!
        password: String!
    }
    type Query{
        getUser(token: String!): User
    }
    type Mutation{
        newUser(input: UserInput): User
        authenticateUser(input: authenticateInput): Token
    }
`;

module.exports = typeDefs;
