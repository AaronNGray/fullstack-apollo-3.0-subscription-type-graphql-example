import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer, ConnectionContext } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import { ApolloServer, gql } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';

import { MessageResolver } from './types';

const MESSAGE_CREATED = 'MESSAGE_CREATED';

/*
const resolvers = {
  Subscription: {
    messageCreated: {
      subscribe: () => pubsub.asyncIterator(MESSAGE_CREATED),
    },
  },
};
*/
( async () => {
    const app = express();

    const pubSub = new PubSub();

    const schema = await buildSchema({
        resolvers:[MessageResolver],
        pubSub
    });

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
          connectionParams: Object,
          webSocket: WebSocket,
          context: ConnectionContext
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
      pubSub.publish(MESSAGE_CREATED, {
        messageCreated: { id, content: new Date().toString() },
      });

      id++;
    }, 1000);
})();
