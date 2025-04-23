export class ForumComment {
  id?: string;
  content?: string;
  createdAt?: string;
  userId?: number;
  username?: string; // For display purposes
  postId?: string;
  parentCommentId?: string | null; // For nested comments
  replies?: ForumComment[];
}
