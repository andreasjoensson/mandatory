const { ApolloServer } = require("apollo-server");
const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  async willSendRequest({ request, context }) {
    // Pass the user from the gateway context to the microservices by setting a header
    if (context.user) {
      request.http.headers.set("authorization", context.user);
    }
  }
}

const gateway = new ApolloGateway({
  serviceList: [
    { name: "posts", url: "https://fjaesbog-posts.azurewebsites.net/graphql" },
    {
      name: "community",
      url: "https://fjaesbog-community.azurewebsites.net/graphql",
    },
    { name: "users", url: "https://fjaesbog-user.azurewebsites.net/graphql" },
    {
      name: "reactions",
      url: "https://fjaesbog-reactions.azurewebsites.net/graphql",
    },
  ],
  buildService({ name, url }) {
    return new AuthenticatedDataSource({ url });
  },
});

const server = new ApolloServer({
  gateway,
  subscriptions: false,
  context: ({ req }) => {
    const user = req.headers.authorization; // Extract the user from the authorization header
    return { user }; // Return the user as part of the context
  },
});

server.listen({ port: 9000 }).then(({ url }) => {
  console.log(`🚀 Gateway ready at ${url}`);
});
