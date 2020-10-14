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
    type Product{
        id: ID
        name: String!
        stock: Int!
        price: Float!
        created_at: String
    }
    type Client{
        id: ID
        name: String!
        lastname: String!
        company: String!
        email: String!
        phone: String
        seller: ID
        created_at: String!
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
    input ProductInput{
        name: String!
        stock: Int!
        price: Float!
    }
    input ClientInput{
        name: String!
        lastname: String!
        company: String!
        email: String!
        phone: String
    }
    type Query{
        # Users
        getUser( token: String! ): User
        
        # Products
        getProducts: [Product]
        getProduct( id: ID! ): Product

        # Clients
        getClients: [Client]
        getSellerClients: [Client]
        getClient( id: ID! ): Client
    }
    type Mutation{
        # Users
        newUser( input: UserInput ): User
        authenticateUser( input: authenticateInput ): Token

        # Products
        newProduct( input: ProductInput ): Product
        updateProduct( id: ID!, input: ProductInput! ): Product
        deleteProduct( id: ID! ): String

        # Clients
        newClient( input: ClientInput ): Client
        updateClient( id: ID!, input: ClientInput! ): Client
    }
`;

module.exports = typeDefs;
