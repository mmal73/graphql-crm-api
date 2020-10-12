const { ApolloServer } = require('apollo-server');
const typeDefs = require('./config/schema');
const resolvers = require('./config/resolvers');

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers
});

apolloServer.listen().then(({url}) => {
    console.log(`🚀 Server ready at ${url}`);
});