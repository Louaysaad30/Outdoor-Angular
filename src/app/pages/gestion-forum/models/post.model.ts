import {Media} from "./media.model";
import {Reaction} from "./reaction.model";
import {ForumComment} from "./ForumComment.model";

export class Post {
  id?: string;
  content?: string;
  createdAt?: string;
  hasMedia?: boolean;
  userId?: number;
  username?: string;
  email?: string;
  media?: Media[];
  comments?: ForumComment[];
  reactions?: Reaction[];
  newComment?: string; // Add this property
  userProfilePic?: string; // Added property

}
