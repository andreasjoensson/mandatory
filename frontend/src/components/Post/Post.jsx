import {
  CommentOutlined,
  Send,
  ThumbDown,
  ThumbsUpDown,
  ThumbUp,
  ThumbUpSharp,
} from "@material-ui/icons";
import Dislike from "../Reactions/Dislike";
import Like from "../Reactions/Like";
import { useEffect } from "react";
import "./post.css";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/auth";
import Comments from "../Comments/Comments";
import moment from "moment";
import "moment/locale/da";
import { EmojiEmotionsOutlined } from "@material-ui/icons";
import { Delete } from "@material-ui/icons";
import DeletePost from "../DeletePost/DeletePost";

function Post({ post_id, name, profilePic, createdAt, title, text, image }) {
  const { user } = useContext(AuthContext);
  const [alreadyLiked, setLiked] = useState(false);
  const [alreadyDisliked, setDisliked] = useState(false);
  const [comment, setComment] = useState("");
  moment.locale();

  const GET_LIKES_COUNT = gql`
    query getLikes($post_id: ID!) {
      getLikes(post_id: $post_id) {
        likes {
          user_id
        }
        dislikes {
          user_id
        }
        likeCount
      }
    }
  `;

  const SEND_MESSAGE_MUTATION = gql`
    mutation createComment($post_id: ID!, $text: String!) {
      createComment(post_id: $post_id, text: $text) {
        user_id
      }
    }
  `;
  const GET_COMMENTS_QUERY = gql`
    query getComments($post_id: ID!) {
      getComments(post_id: $post_id) {
        text
        name
        profilepic
        created_at
        user_id
      }
    }
  `;

  const [sendMessage] = useMutation(SEND_MESSAGE_MUTATION, {
    variables: {
      post_id: post_id,
      text: comment,
    },
    refetchQueries: [
      {
        query: GET_COMMENTS_QUERY,
        variables: { post_id: post_id },
      },
    ],
  });

  const { data, loading } = useQuery(GET_LIKES_COUNT, {
    variables: {
      post_id: post_id,
    },
  });

  useEffect(() => {
    setLiked(
      data?.getLikes.likes.filter((e) => e.user_id == user.user_id).length > 0
    );
    setDisliked(
      data?.getLikes.dislikes.filter((e) => e.user_id == user.user_id).length >
        0
    );
  }, [data]);

  if (loading)
    return (
      <div class="lds-circle">
        <div></div>
      </div>
    );

  return (
    <div className="post">
      <div className="postUser">
        <div className="postUserImage">
          <img src={profilePic} alt="" className="postProfilePic" />
        </div>
        <div className="postUserInformation">
          <h3>{name}</h3>
          <span>{moment(createdAt).fromNow()}</span>
        </div>
        {user.name == name ? <DeletePost id={post_id} /> : <p></p>}
      </div>
      <div className="postContent">
        <h3>{title}</h3>
        <p>{text}</p>
        {image !== "" || "" ? (
          <img src={image} className="postPicture" />
        ) : (
          <p></p>
        )}
      </div>

      <div className="postBottom">
        <div className="postComments">
          <CommentOutlined />
          <p>Kommentar</p>
        </div>

        <div className="postLikes">
          <Like postID={post_id} alreadyLiked={alreadyLiked} />
          <Dislike postID={post_id} alreadyDisliked={alreadyDisliked} />
          <p>{data?.getLikes.likeCount} Likes</p>
          <p></p>
        </div>
      </div>

      <div className="postComment">
        <img
          src={
            user.profilepic.length > 0
              ? user.profilepic
              : "https://www.mico.dk/wp-content/uploads/2020/05/blank-profile-picture-973460_1280.png"
          }
          className="postProfilePic"
        />
        <input
          type="text"
          placeholder="Skriv din kommentar"
          onChange={(e) => setComment(e.target.value)}
        />
        <EmojiEmotionsOutlined
          className="sendComment"
          color="disabled"
          onClick={sendMessage}
        />
      </div>
      <Comments post_id={post_id} />
    </div>
  );
}

export default Post;
