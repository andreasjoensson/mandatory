const {
  getCommunityByIdName,
  createPostMessage,
} = require("./rabbitmq/service");
const checkAuth = require("./auth/checkAuth");
const pool = require("./database/db");
const cacheMiddleware = require("./cache/cacheMiddleware");

module.exports = {
  Query: {
    getPosts: async (_) => {
      let res = await pool.query("SELECT * FROM posts");
      return res.rows;
    },
    getPostsFromUser: cacheMiddleware(async (_, { name }) => {
      let posts = await pool.query("SELECT * FROM posts WHERE name = $1", [
        name,
      ]);
      return posts.rows;
    }),
    getCommunityPosts: async (_, { name }) => {
      //kald på anden microservice
      try {
        const communityId = await getCommunityByIdName(name);
        console.log(`Community ID: ${communityId}`);
        const posts = await pool.query(
          "SELECT * FROM posts WHERE community_id = $1",
          [communityId]
        );
        return posts.rows;
      } catch (err) {
        console.error(err);
      }
    },
  },
  Mutation: {
    async createPost(_, { title, text, image, community_id }, context) {
      const user = checkAuth(context);
      const client = await pool.connect();

      try {
        await client.query("BEGIN"); // Start transaction

        const res = await client.query(
          "INSERT INTO posts(user_id, title, text, image, created_at, name, profilepic, community_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
          [
            user.user_id,
            title,
            text,
            image,
            new Date().toISOString().slice(0, 19).replace("T", " "),
            user.name,
            user.profilepic,
            community_id,
          ]
        );

        createPostMessage(community_id, res.rows[0].id);

        await client.query("COMMIT"); // Commit transaction

        return {
          ...res.rows[0],
          ...user,
        };
      } catch (error) {
        await client.query("ROLLBACK"); // Rollback transaction
        console.error("Error creating post:", error);
        throw error;
      } finally {
        client.release();
      }
    },
    async deletePost(_, { post_id }) {
      const post = await pool.query(
        "DELETE FROM posts WHERE post_id = $1 RETURNING*",
        [post_id]
      );
      return post.rows[0];
    },
  },
};
