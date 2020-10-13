const { ApolloServer } = require( 'apollo-server' );
const typeDefs = require( './db/schema' );
const resolvers = require( './db/resolvers' );
const jwt = require( 'jsonwebtoken' );
const conectDB = require( './config/db' );
require( 'dotenv' ).config( { path: '.env' } );

conectDB();

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context:( { req } ) => {
        const token = req.headers[ 'authorization' ] || '';
        
        if(token){
            try {
                const currentUser = jwt.verify(token.replace( 'Bearer ', '' ), process.env.SECRET_WORD);
                return{
                    currentUser
                }
            } catch (error) {
                throw new Error( error );
            }
        }
    }
});

apolloServer.listen().then(({url}) => {
    console.log(`🚀 Server ready at ${url}`);
});