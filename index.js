const { ApolloServer } = require('apollo-server');
const typeDefs = require('./config/schema');
const resolvers = require('./config/resolvers');
const conectDB = require('./config/db');

conectDB();

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers
});

apolloServer.listen().then(({url}) => {
    console.log(`🚀 Server ready at ${url}`);
});