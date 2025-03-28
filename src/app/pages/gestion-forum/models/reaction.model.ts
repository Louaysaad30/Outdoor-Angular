import {ReactionType} from "./reaction-type.enum";

export class Reaction {
  id?: string;
  postId?: string;
  userId?: number;
  reactionType?: ReactionType; // Note: case matters - make sure this matches your backend
  createdAt?: string;
  username?: string;
}
