import express from 'express';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import { ApolloServer, gql } from 'apollo-server-express';

const app = express();

const pubsub = new PubSub();
const MESSAGE_CREATED = 'MESSAGE_CREATED';

@ObjectType()
class Message {
    @Field(type => String)
    id: String
    @Field(type => String)
    content: String
};

@ObjectType()
class Query {
    @Field(type => [Message])
    messages: Message[]
};

@Resolver(Message)
class MessageResolver {
    @Query(returns => [Message])

};

const typeDefs = gql`
  type Query {
    messages: [Message!]!
  }

  type Subscription {
    messageCreated: Message
  }

`;

const resolvers = {
  Query: {
    messages: () => [
      { id: 0, content: 'Hello!' },
      { id: 1, content: 'Bye!' },
    ],
  },
  Subscription: {
    messageCreated: {
      subscribe: () => pubsub.asyncIterator(MESSAGE_CREATED),
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer({
    schema
});

await server.start()

server.applyMiddleware({ app, path: '/graphql' });

const httpServer = createServer(app);

const subscriptionServer = SubscriptionServer.create({
  // This is the `schema` we just created.
  schema,
  // These are imported from `graphql`.
  execute,
  subscribe,
  // Providing `onConnect` is the `SubscriptionServer` equivalent to the
  // `context` function in `ApolloServer`.
  // Please [see the docs](https://github.com/apollographql/subscriptions-transport-ws#constructoroptions-socketoptions--socketserver)
  // for more information on this hook.
  async onConnect(
    connectionParams,
    webSocket,
    context
  ) {
    // If an object is returned here, it will be passed as the `context`
    // argument to your subscription resolvers.
  }
}, {
  // This is the `httpServer` we created in a previous step.
  server: httpServer,
  // This `server` is the instance returned from `new ApolloServer`.
  path: server.graphqlPath,
});


httpServer.listen({ port: 8000 }, () => {
  console.log('Apollo Server on http://localhost:8000/graphql');
});

let id = 2;

setInterval(() => {
  pubsub.publish(MESSAGE_CREATED, {
    messageCreated: { id, content: new Date().toString() },
  });

  id++;
}, 1000);
