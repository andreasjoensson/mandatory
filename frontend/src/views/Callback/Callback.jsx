import { useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useApolloClient, gql } from "@apollo/client";

const Callback = () => {
  const location = useLocation();
  const history = useHistory();
  const client = useApolloClient();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    const fetchAccessToken = async () => {
      try {
        const mutation = gql`
          mutation Callback($code: String!) {
            callback(code: $code) {
              user_id
              name
              password
              age
              email
              profilepic
              profilecover
              token
              created_at
              last_login
              reason
              banned
              role
            }
          }
        `;

        const response = await client.mutate({
          mutation,
          variables: {
            code: code,
          },
        });

        console.log("response", response);

        //history.push("/dashboard");
      } catch (error) {
        // Handle error scenarios
        console.error("Error occurred during access token retrieval:", error);
        // Redirect the user to an error page or login page
        history.push("/error");
      }
    };

    fetchAccessToken();
  }, [client, history, location.search]);

  return (
    <div>
      <h2>Logger ind med github...</h2>
    </div>
  );
};

export default Callback;
