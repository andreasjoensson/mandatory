const pool = require("./database/db");
const bcrypt = require("bcryptjs");
const createToken = require("./auth/createToken");
const { UserInputError } = require("apollo-server");
const { validateLoginInput } = require("./validations");

module.exports = {
  Query: {
    async getProfile(_, { name }) {
      const user = await pool.query("SELECT * FROM users WHERE name=$1", [
        name,
      ]);
      const schoolQuery = await pool.query("SELECT * FROM school WHERE id=$1", [
        user.rows[0].school,
      ]);

      let school = schoolQuery.rows[0];

      console.log("SKOLE", school);
      return {
        ...user.rows[0],
        school,
      };
    },
    async getCommunityMembers(_, { name }) {
      const getCommunityID = await db.query(
        "SELECT id FROM community where name = $1",
        [name]
      );
      const members = await db.query(
        "SELECT users_id FROM members WHERE community_id = $1",
        [getCommunityID.rows[0].id]
      );
      return members.rows;
    },
    async getAll() {
      const users = await pool.query("SELECT * FROM users");
      const forums = await pool.query("SELECT * FROM community");

      return {
        user: users.rows,
        community: forums.rows,
      };
    },
  },
  Mutation: {
    async createUser(
      _,
      {
        name,
        email,
        password,
        confirmPassword,
        age,
        school,
        profilePic,
        profileCover,
      }
    ) {
      let errors = {};
      password = await bcrypt.hash(password, 12);

      const schoolInsert = await pool.query(
        "INSERT INTO school(name,logo) VALUES($1,$2) RETURNING id",
        [school.Navn, school.Logo]
      );

      let now = new Date(); //getting current date
      let currentY = now.getFullYear(); //extracting year from the date
      let currentM = now.getMonth(); //extracting month from the date

      var dob = new Date(age); //formatting input as date
      var prevY = dob.getFullYear(); //extracting year from input date
      var prevM = dob.getMonth(); //extracting month from input date

      var ageY = currentY - prevY;
      var ageM = Math.abs(currentM - prevM); //converting any negative value to positive

      const res = await pool.query(
        "INSERT INTO users(name, email, age, password, school, profilepic, profilecover, created_at) VALUES($1,$2,$3,$4,$5,$6, $7, $8) RETURNING *",
        [
          name,
          email,
          ageY,
          password,
          schoolInsert.rows[0].id,
          profilePic,
          profileCover,
          new Date().toISOString().slice(0, 19).replace("T", " "),
        ]
      );
      console.log("res", res.rows[0]);
      const token = createToken(res.rows[0]);
      console.log("token", token);
      return {
        ...res.rows[0],
        token,
      };
    },
    async addMember(_, { community_id }, context) {
      const user = checkAuth(context);
      const getMembers = await db.query(
        "SELECT * FROM members WHERE community_id = $1",
        [community_id]
      );

      if (
        getMembers.rows.filter((row) => row.users_id == user.user_id).length > 0
      ) {
        console.log(
          "user is already member, so unfollow member from community"
        );
        const removeMember = await db.query(
          "DELETE FROM members WHERE community_id =$1 AND users_id = $2 RETURNING*",
          [community_id, user.user_id]
        );
        return removeMember.rows[0];
      }

      const addMember = await db.query(
        "INSERT INTO members(community_id, users_id) VALUES($1,$2) RETURNING *",
        [community_id, user.user_id]
      );

      return addMember.rows[0];
    },
    async login(_, { name, password }) {
      const { errors, valid } = validateLoginInput(name, password);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const user = await pool.query("SELECT * from users WHERE name = $1", [
        name,
      ]);

      if (user.rows.length < 1) {
        errors.general = "Bruger ikke fundet";
        throw new UserInputError("Bruger ikke fundet", { errors });
      }

      const match = await bcrypt.compare(password, user.rows[0].password);
      if (!match) {
        errors.general = "Forkert kode";
        throw new UserInputError("Forkert kode", { errors });
      }
      const token = createToken(user.rows[0]);

      return {
        ...user.rows[0],
        token,
      };
    },
  },
};
