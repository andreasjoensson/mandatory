const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Query {
    getPosts: [Post]
    getPostsFromUser(name: String!): [Post]
    getCommunityPosts(name: String!): [Post]
  }

  type Mutation {
    createPost(
      title: String!
      text: String!
      image: String
      community_id: ID!
    ): Post
    deletePost(post_id: ID!): Post
  }

  type Post @key(fields: "post_id") {
    post_id: ID!
    user_id: ID!
    title: String!
    text: String!
    created_at: String!
    name: String
    profilepic: String
    community_id: ID
    image: String
    comments: [Comment]
    likes: [Like]
  }

  type Like @key(fields: "id") {
    id: ID!
    user_id: ID!
    created_at: String!
  }
  type Dislike @key(fields: "id") {
    id: ID!
    user_id: ID!
    created_at: String!
  }

  type Comment @key(fields: "id") {
    id: ID!
    created_at: String
    user_id: ID!
    name: String
    profilepic: String
    text: String!
  }
`;

module.exports = typeDefs;
