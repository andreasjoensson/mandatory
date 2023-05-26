import "./login.css";
import logo from "../../assets/logo.png";
import { AccountCircleOutlined, MailOutline } from "@material-ui/icons";
import { Lock } from "@material-ui/icons";
import { useState, useContext } from "react";
import { gql, useMutation } from "@apollo/client";
import { AuthContext } from "../../context/auth";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import Spline from "@splinetool/react-spline";
import { Redirect } from "react-router-dom";

const LOGIN_QUERY = gql`
  mutation login($name: String!, $password: String!) {
    login(name: $name, password: $password) {
      token
      user_id
      email
      password
      age
      profilepic
      profilecover
      name
      role
    }
  }
`;

export default function Login() {
  const context = useContext(AuthContext);
  const [name, setName] = useState("");
  const history = useHistory();
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [login] = useMutation(LOGIN_QUERY, {
    update(_, { data: { login: userData } }) {
      setLoading(false);
      context.login(userData);
      setLoggedIn(true); // Set loggedIn state to trigger the redirect
      if (userData.role === "ADMIN") {
        //history.push("/admin");
      } else {
        //history.push("/dashboard");
      }
    },
    onError(err) {
      setLoading(false);
      setErrors(err.graphQLErrors[0].extensions.errors);
    },
  });

  const CLIENT_ID = "cee4f57a36b40c930bd7";
  const REDIRECT_URI = "https://zucc.dk/callback";

  const handleGithubLogin = (e) => {
    e.preventDefault();
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
  };

  if (loggedIn && context.user.role !== "ADMIN") {
    // Redirect to the protected route after successful login
    return <Redirect to="/dashboard" />;
  }

  if (loggedIn && context.user.role === "ADMIN") {
    return <Redirect to="/admin" />;
  }

  const submitLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    login({
      variables: {
        name: name,
        password: password,
      },
    });
  };

  return (
    <div className="login">
      <div className="login-container">
        <div className="logo">
          <img src={logo} />
        </div>

        <div className="loginContainer">
          <div className="loginText mb-3">
            <h1>Log ind</h1>
            <p>Log ind for at få adgang til en commmunity af studerende nu!</p>
          </div>

          <form className="loginForm mt-3 " onSubmit={submitLogin}>
            <label>Brugernavn</label>
            <div className="inputIcons">
              <input
                type="text"
                placeholder="Indtast et navn"
                onChange={(e) => setName(e.target.value)}
              />
              <AccountCircleOutlined className="icon" />
            </div>

            <label>Password</label>
            <div className="inputIcons">
              <input
                type="password"
                placeholder="Indtast dit password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="icon" />
            </div>

            <div className="bottomLogin mb-3">
              <div className="checkbox d-flex align-items-center">
                <input type="checkbox" name="vehicle1" value="Bike" />
                <label className="ms-3">Log mig ikke ud.</label>
              </div>
              <Link className="forgotPassword" to="/glemtkode">
                Glemt password?
              </Link>
            </div>

            {loading ? (
              <button
                type="submit"
                className="loginButton d-flex justify-content-center"
              >
                Logger ind....{" "}
                <div
                  class="spinner-grow spinner-grow-sm ms-3"
                  role="status"
                ></div>
              </button>
            ) : (
              <>
                <button type="submit" className="loginButton">
                  Login
                </button>
                <button
                  onClick={(e) => handleGithubLogin(e)}
                  className="loginButton"
                >
                  <img
                    src={require("../../assets/github-logo.png")}
                    className="small-logo me-3"
                  />{" "}
                  Login med Github
                </button>
              </>
            )}

            <a href="/register" className="registerA">
              Har du ikke lavet en konto endnu? Registrer her.
            </a>
          </form>
          {Object.keys(errors).length > 0 && (
            <div className="ui error message">
              <ul className="list">
                {Object.values(errors).map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <Spline
        className="spline"
        scene="https://prod.spline.design/oPYLiDyNhuFxiZZc/scene.splinecode"
      />
    </div>
  );
}
