import {Post} from "./post.model";

export class Media {
  id?: string;
  createdAt?: string;
  userId?: number;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  post?: Post
}
