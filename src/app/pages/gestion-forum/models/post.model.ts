import {Media} from "./media.model";
import {Reaction} from "./reaction.model";

export class Post {
  id?: string;
  content?: string;
  createdAt?: string;
  hasMedia?: boolean;
  userId?: number;
  username?: string;
  email?: string;
  media?: Media[];
  comments?: Comment[];
  reactions?: Reaction[];
}
