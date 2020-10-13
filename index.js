const { ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const conectDB = require('./config/db');

conectDB();

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers
});

apolloServer.listen().then(({url}) => {
    console.log(`🚀 Server ready at ${url}`);
});