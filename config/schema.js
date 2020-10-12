const { gql } = require('apollo-server');

const typeDefs = gql`
    type Query{
        getSomething: String
    }
`;

module.exports = typeDefs;
