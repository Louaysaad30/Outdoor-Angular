import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormGroup, Validators} from "@angular/forms";
import {Router, RouterLink} from "@angular/router";
import {SharedModule} from "../../../../shared/shared.module";
import {SimplebarAngularModule} from "simplebar-angular";
import {TooltipModule} from "ngx-bootstrap/tooltip";
import {NgxDropzoneModule} from "ngx-dropzone";
import {PickerComponent} from "@ctrl/ngx-emoji-mart";
import {PostService} from "../../services/post.service";
import {Post} from "../../models/post.model";
import {Media} from "../../models/media.model";
import {CommentService} from "../../services/comment.service";
import {ForumComment} from "../../models/ForumComment.model";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {co} from "@fullcalendar/core/internal-common";
import {ReactionService} from "../../services/reaction.service";
import {ReactionType} from "../../models/reaction-type.enum";
import {Reaction} from "../../models/reaction.model";
import { ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';


import { catchError } from 'rxjs/operators';
import {ModalModule} from "ngx-bootstrap/modal";

@Component({
  selector: 'app-forum-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SharedModule, SimplebarAngularModule, TooltipModule, NgxDropzoneModule, PickerComponent, ReactiveFormsModule, ModalModule],
  templateUrl: './forum-post.component.html',
  styleUrl: './forum-post.component.scss'
})
export class ForumPostComponent {
  userReactions: Map<string, Reaction> = new Map<string, Reaction>();


  toxicContentDetected: boolean = false; // Added property

  profileImage: string = 'assets/profile-pic.png';
  isModalOpen: boolean = false;
  postContent: string = '';
  isSubmitting: boolean = false;
  USER_ID=10;

  // Emoji Picker
  showEmojiPicker = false;
  sets: string[] = ['native', 'google', 'twitter', 'facebook', 'emojione', 'apple', 'messenger'];
  set: string = 'twitter';

  // File Upload
  showFileUpload = false;
  uploadedFiles: any[] = [];

  // Form Data
  submitted1 = false;
  formData!: UntypedFormGroup;

  posts: Post[] = [];
  loading = false;
  error = '';
  newComment: string = '';
  selectedPost: Post | null = null;
  isDetailModalOpen: boolean = false;
  newDetailComment: string = '';
  ReactionType = ReactionType;

  constructor(
    private postService: PostService,
    private router: Router,
    private formBuilder: FormBuilder,
  private commentService: CommentService,
    private modalService: NgbModal,
  private reactionService: ReactionService // Add this line


) {}


  // Missing ViewChild reference and modal show call

// Added ViewChild reference and modal show call


@ViewChild('deleteRecordModal', { static: false }) deleteRecordModal!: ModalDirective;

handleToxicContentError() {
  this.toxicContentDetected = true;
  setTimeout(() => {
    this.deleteRecordModal.show();
  });
}
  openPostDetail(post: Post): void {
    this.selectedPost = post;
    this.isDetailModalOpen = true;
    this.newDetailComment = '';
    this.currentMediaIndex = 0; // Reset to first media when opening detail
    // Pre-load top level comments when opening post detail
    this.commentService.getTolevel(post.id!).subscribe({
      next: (comments) => {
        this.topLevelComments[post.id!] = comments || [];
      }
    });

  }

  closeDetailModal() {
    this.isDetailModalOpen = false;
    this.selectedPost = null;
    this.newDetailComment = '';
  }

addDetailComment(): void {
    if (!this.newDetailComment.trim() || !this.selectedPost) return;

    this.commentService.addComment(this.selectedPost.id!, this.newDetailComment, this.USER_ID).subscribe({
      next: (comment: ForumComment) => {
        // Update the post's comments array
        if (this.selectedPost && this.selectedPost.comments) {
          this.selectedPost.comments.push(comment);
        }

        // Update the topLevelComments collection which is displayed in the modal
        if (this.selectedPost && this.selectedPost.id) {
          if (!this.topLevelComments[this.selectedPost.id]) {
            this.topLevelComments[this.selectedPost.id] = [];
          }
          this.topLevelComments[this.selectedPost.id].push(comment);

          // Create a new array reference to trigger change detection
          this.topLevelComments[this.selectedPost.id] = [...this.topLevelComments[this.selectedPost.id]];
        }

        // Clear the input field
        this.newDetailComment = '';
      },

      error: (errorObj) => {
        this.isSubmitting = false; // Reset submission state
        if (errorObj == "OK") {
          this.toxicContentDetected = true;
          this.handleToxicContentError()
        }
        else {
          // Handle other errors if needed
          this.error = errorObj.message || 'An error occurred';
        }
      }
    });
}



  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Forum', active: false },
      { label: 'Feed', active: true }
    ];

    this.formData = this.formBuilder.group({
      message: ['', Validators.required]
    });

    // Fetch posts when component initializes
    this.loadPosts();
  }
  // Method to load reactions for a specific post
  loadReactions(postId: string) {
    this.reactionService.getReactionsByPostId(postId).subscribe({
      next: (reactions) => {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.reactions = reactions;
console.log('Reactions:', reactions);
          // Store the user's reaction (if any) for easy access
          const userReaction = reactions.find(r => r.userId === this.USER_ID); // Using static user ID 10
          if (userReaction) {
            this.userReactions.set(postId, userReaction);
          }
        }
      },
      error: (error) => {
        console.error(`Error loading reactions for post ${postId}:`, error);
      }
    });
  }

  // Method to get icon class based on reaction type
  getReactionIcon(reactionType: ReactionType): string {
    switch (reactionType) {
      case ReactionType.LIKE: return 'bi bi-hand-thumbs-up-fill text-primary';
      case ReactionType.LOVE: return 'bi bi-heart-fill text-danger';
      case ReactionType.HAHA: return 'bi bi-emoji-laughing-fill text-warning';
      case ReactionType.WOW: return 'bi bi-emoji-dizzy-fill text-warning' ;
      case ReactionType.SAD: return 'bi bi-emoji-frown-fill text-info';
      case ReactionType.ANGRY: return 'bi bi-emoji-angry-fill text-danger';
      default: return 'bi bi-hand-thumbs-up text-muted';
    }
  }

// Add this property to your class
reactionBarVisible: Map<string, boolean> = new Map<string, boolean>();
hideReactionBarTimeouts: Map<string, any> = new Map<string, any>();

// Add these methods
showReactionBar(postId: string): void {
  if (!this.reactionBarVisible.get(postId)) {
    this.reactionBarVisible.set(postId, true);
    // Clear any pending timeout for hiding
    if (this.hideReactionBarTimeouts.has(postId)) {
      clearTimeout(this.hideReactionBarTimeouts.get(postId));
      this.hideReactionBarTimeouts.delete(postId);
    }
  }
}

hideReactionBarWithDelay(postId: string): void {
  // Set a timeout to hide the reaction bar
  const timeout = setTimeout(() => {
    this.reactionBarVisible.set(postId, false);
    this.hideReactionBarTimeouts.delete(postId);
  }, 300); // Small delay to allow moving the mouse to the reaction bar

  this.hideReactionBarTimeouts.set(postId, timeout);
}

hideReactionBar(postId: string): void {
  this.reactionBarVisible.set(postId, false);
  // Clear any pending timeout
  if (this.hideReactionBarTimeouts.has(postId)) {
    clearTimeout(this.hideReactionBarTimeouts.get(postId));
    this.hideReactionBarTimeouts.delete(postId);
  }
}

keepReactionBarVisible(postId: string): void {
  // Clear any pending timeout for hiding
  if (this.hideReactionBarTimeouts.has(postId)) {
    clearTimeout(this.hideReactionBarTimeouts.get(postId));
    this.hideReactionBarTimeouts.delete(postId);
  }
  this.reactionBarVisible.set(postId, true);
}

toggleReactionBar(postId: string): void {
  const currentState = this.reactionBarVisible.get(postId);
  this.reactionBarVisible.set(postId, !currentState);

  // If the user already reacted and is clicking the main button again, toggle the reaction off
  if (currentState && this.userReactions.has(postId)) {
    const existingReaction = this.userReactions.get(postId);
    if (existingReaction && existingReaction.id) {
      this.reactionService.deleteReaction(existingReaction.id).subscribe({
        next: () => {
          this.userReactions.delete(postId);
          this.loadReactions(postId);
        },
        error: (error) => console.error('Error removing reaction:', error)
      });
    }
  }
}

// Modify your reactToPost method to hide the reaction bar after selection
reactToPost(postId: string, reactionType: ReactionType) {
  const existingReaction = this.userReactions.get(postId);

  if (existingReaction) {
    // If user is clicking the same reaction, remove it (toggle off)
    if (existingReaction.reactionType === reactionType) {
      this.reactionService.deleteReaction(existingReaction.id!).subscribe({
        next: () => {
          this.userReactions.delete(postId);
          this.loadReactions(postId);
          this.hideReactionBar(postId); // Hide the reaction bar
        },
        error: (error) => console.error('Error removing reaction:', error)
      });
    } else {
      // If user is changing reaction type, update it
      this.reactionService.updateReaction(existingReaction.id!, reactionType).subscribe({
        next: (updatedReaction) => {
          this.userReactions.set(postId, updatedReaction);
          this.loadReactions(postId);
          this.hideReactionBar(postId); // Hide the reaction bar
        },
        error: (error) => console.error('Error updating reaction:', error)
      });
    }
  } else {
    // If no existing reaction, add a new one
    this.reactionService.addReaction(postId, this.USER_ID, reactionType).subscribe({
      next: (newReaction) => {
        this.userReactions.set(postId, newReaction);
        this.loadReactions(postId);
        this.hideReactionBar(postId); // Hide the reaction bar
      },
      error: (error) => console.error('Error adding reaction:', error)
    });
  }
}
 /* // Method to handle user reactions
  reactToPost(postId: string, reactionType: ReactionType) {
    const existingReaction = this.userReactions.get(postId);

    if (existingReaction) {
      // If user is clicking the same reaction, remove it (toggle off)
      if (existingReaction.reactionType === reactionType) {
        this.reactionService.deleteReaction(existingReaction.id!).subscribe({
          next: () => {
            this.userReactions.delete(postId);
            this.loadReactions(postId); // Refresh reactions
          },
          error: (error) => console.error('Error removing reaction:', error)
        });
      } else {
        // If user is changing reaction type, update it
        this.reactionService.updateReaction(existingReaction.id!, reactionType).subscribe({
          next: (updatedReaction) => {
            this.userReactions.set(postId, updatedReaction);
            this.loadReactions(postId); // Refresh reactions
          },
          error: (error) => console.error('Error updating reaction:', error)
        });
      }
    } else {
      // If no existing reaction, add a new one
      this.reactionService.addReaction(postId, 10, reactionType).subscribe({
        next: (newReaction) => {
          this.userReactions.set(postId, newReaction);
          this.loadReactions(postId); // Refresh reactions
        },
        error: (error) => console.error('Error adding reaction:', error)
      });
    }
  }*/

  // Method to check if user has reacted with a specific reaction type
  hasReacted(postId: string, reactionType: ReactionType): boolean {
    const userReaction = this.userReactions.get(postId);
    return userReaction?.reactionType === reactionType;
  }

  // Get reaction counts by type
  getReactionCount(postId: string, reactionType: ReactionType): number {
    const post = this.posts.find(p => p.id === postId);
    if (!post || !post.reactions) return 0;

    return post.reactions.filter(r => r.reactionType === reactionType).length;
  }

  // Get total reaction count
  getTotalReactionCount(postId: string): number {
    const post = this.posts.find(p => p.id === postId);
    return post?.reactions?.length || 0;
  }
  loadPosts() {
    this.loading = true;
    this.postService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        // Load reactions for each post
        this.posts.forEach(post => {
          if (post.id) {
            this.loadReactions(post.id);
          }
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching posts', error);
        this.error = `Failed to load posts (${error.status}). Please check if the backend server is running.`;
        this.loading = false;
      }
    });
  }
  isImage(url: string): boolean {
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/) !== null;
  }

  isVideo(url: string): boolean {
    return url.match(/\.(mp4|webm|ogg|mov|avi)$/) !== null;
  }

  get form() {
    return this.formData?.controls;
  }

  /*** Modal Controls ***/
  openPostModal() {
    this.isModalOpen = true;
  }

  closePostModal() {
    this.isModalOpen = false;
    this.showFileUpload = false;
    this.uploadedFiles = [];
    this.postContent = '';
    this.formData.reset();
    this.submitted1 = false;
  }

  /*** Emoji Picker ***/
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: any) {
    this.postContent += event.emoji.native;
    this.showEmojiPicker = false;
  }

  onFocus() {
    this.showEmojiPicker = false;
  }

  onBlur() {}

  /*** File Upload Handling ***/
  addPhoto() {
    this.showFileUpload = true;
  }

  onSelect(event: any) {
    this.uploadedFiles.push(...event.addedFiles.map((file: any) => ({
      file: file, // Store the actual file for upload
      name: file.name,
      type: file.type,
      size: file.size,
      objectURL: URL.createObjectURL(file)
    })));
  }

  removeFile(file: any) {
    this.uploadedFiles = this.uploadedFiles.filter(f => f !== file);
  }

  /*** Post Submission ***/
  // Added resetForm method
  resetForm(): void {
    this.postContent = '';
    this.uploadedFiles = [];
    this.formData.reset();
    this.submitted1 = false;
  }

publishPost() {
    this.submitted1 = true;
    this.error = ''; // Clear previous errors
    this.toxicContentDetected = false; // Reset toxicity flag

    if (this.formData.invalid && !this.uploadedFiles.length) {
      return;
    }

    if (this.isSubmitting || (!this.postContent.trim() && !this.uploadedFiles.length)) {
      return;
    }

    this.isSubmitting = true;

    // Create post object
    const post: Post = {
      content: this.postContent.trim(),
      userId: this.USER_ID,
      username: 'Iyed Mejri',
      email: 'user@example.com'
    };

    // Extract actual File objects for upload
    const mediaFiles = this.uploadedFiles.map(fileObj => fileObj.file);

    // Call service with both post data and files
    this.postService.createPost(post, mediaFiles).subscribe({
      next: (createdPost) => {
        console.log('Post created successfully', createdPost);
        this.isSubmitting = false; // Reset submission state
        this.resetForm(); // Reset form after successful post
        this.closePostModal();
        // Refresh posts
        this.loadPosts();
      },

      error: (errorObj) => {
        this.isSubmitting = false; // Reset submission state
        if (errorObj == "OK") {
          this.toxicContentDetected = true;
        }
        else {
          // Handle other errors if needed
          this.error = errorObj.message || 'An error occurred';
        }
      }
    });
}
private handlePostSuccess() {
    this.closePostModal();
    this.isSubmitting = false;
    this.loadPosts();

    // Navigate to posts page or refresh current page
    // this.router.navigate(['/pages/gestion-forum/user/forumpost']);

    // Optionally emit an event to refresh posts list
    // this.postsRefresh.emit();
  }

  /*** Other Actions ***/
  addFriendsTag() {
    console.log('Ajout de tag amis');
  }

  addLocation() {
    console.log('Ajout de localisation');
  }

  addGif() {
    console.log('Ajout de GIF');
  }
//////////////
  // bread crumb items
  breadCrumbItems!: Array<{}>;

  showFullDescription = false;


  showAllMedia(media: Media[]) {

  }
addComment(postId: string, commentText: string): void {
    if (!commentText || !commentText.trim()) return;

    this.commentService.addComment(postId, commentText, this.USER_ID).subscribe({
      next: (comment: ForumComment) => {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          if (!post.comments) {
            post.comments = [];
          }
          post.comments.push(comment);
        }
      },

      error: (errorObj) => {
        this.isSubmitting = false; // Reset submission state
        if (errorObj == "OK") {
          this.toxicContentDetected = true;
          this.handleToxicContentError()
        }
        else {
          // Handle other errors if needed
          this.error = errorObj.message || 'An error occurred';
        }
      }
    });
}

  currentMediaIndex: number = 0;

  nextMedia(): void {
    if (this.selectedPost?.media && this.currentMediaIndex < this.selectedPost.media.length - 1) {
      this.currentMediaIndex++;
    }
  }

  prevMedia(): void {
    if (this.currentMediaIndex > 0) {
      this.currentMediaIndex--;
    }
  }

  goToMedia(index: number): void {
    if (this.selectedPost?.media && index >= 0 && index < this.selectedPost.media.length) {
      this.currentMediaIndex = index;
    }
  }



  // Track which dropdown is currently open
  activeCommentDropdown: string | null = null;

  // Toggle dropdown visibility
  toggleCommentDropdown(commentId: string): void {
    if (this.activeCommentDropdown === commentId) {
      this.activeCommentDropdown = null;
    } else {
      this.activeCommentDropdown = commentId;
    }
  }

  // Implement these methods
// Variables to add to your component
  editingCommentId: string | null = null;
  editCommentText: string = '';

  // Update the editComment method
  editComment(comment: ForumComment): void {
    this.editingCommentId = comment.id!;
    this.editCommentText = comment.content!;
    this.activeCommentDropdown = null;
  }

  // Add a saveEditedComment method
  saveEditedComment(): void {
    if (!this.editingCommentId || !this.editCommentText.trim()) return;

    this.commentService.editComment(this.editingCommentId, this.editCommentText).subscribe({
      next: (updatedComment) => {
        // Update comment in selectedPost if it exists
        if (this.selectedPost && this.selectedPost.comments) {
          const commentIndex = this.selectedPost.comments.findIndex(c => c.id === this.editingCommentId);
          if (commentIndex !== -1) {
            this.selectedPost.comments[commentIndex] = updatedComment;
          }
        }

        // Update comment in the main posts array
        this.posts.forEach(post => {
          if (post.comments) {
            const commentIndex = post.comments.findIndex(c => c.id === this.editingCommentId);
            if (commentIndex !== -1) {
              post.comments[commentIndex] = updatedComment;
            }
          }
        });

        // Update comment in the topLevelComments object - this is what's displayed in the modal
        if (this.selectedPost && this.selectedPost.id && this.topLevelComments[this.selectedPost.id]) {
          const topLevelIndex = this.topLevelComments[this.selectedPost.id].findIndex(
            c => c.id === this.editingCommentId
          );
          if (topLevelIndex !== -1) {
            this.topLevelComments[this.selectedPost.id][topLevelIndex] = updatedComment;
          }

          // Also check for replies within top level comments
          this.topLevelComments[this.selectedPost.id].forEach(comment => {
            if (comment.replies) {
              const replyIndex = comment.replies.findIndex(r => r.id === this.editingCommentId);
              if (replyIndex !== -1) {
                comment.replies[replyIndex] = updatedComment;
              }
            }
          });
        }

        // Create a new reference to trigger change detection
        if (this.selectedPost && this.selectedPost.id) {
          this.topLevelComments[this.selectedPost.id] = [...this.topLevelComments[this.selectedPost.id]];
        }

        // Reset edit mode
        this.editingCommentId = null;
        this.editCommentText = '';
      },
      error: (err) => {
        console.error('Error updating comment:', err);
      }
    });
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editCommentText = '';
  }

  deleteComment(commentId: string): void {
    // Show a confirmation dialog if desired
    if (confirm('Are you sure you want to delete this comment?')) {
      // Call your API service to delete the comment
      this.commentService.deleteComment(commentId).subscribe({
        next: () => {
          // Remove the comment from selectedPost.comments (existing code)
          if (this.selectedPost && this.selectedPost.comments) {
            this.selectedPost.comments = this.selectedPost.comments.filter(
              comment => comment.id !== commentId
            );
          }

          // Remove comment from topLevelComments
          if (this.selectedPost && this.selectedPost.id) {
            const postId = this.selectedPost.id;

            // Remove if it's a top-level comment
            if (this.topLevelComments[postId]) {
              this.topLevelComments[postId] = this.topLevelComments[postId].filter(
                comment => comment.id !== commentId
              );

              // Also check for this comment in replies and remove it
              this.topLevelComments[postId].forEach(comment => {
                if (comment.replies) {
                  comment.replies = comment.replies.filter(
                    reply => reply.id !== commentId
                  );
                }
              });

              // Create a new reference to trigger change detection
              this.topLevelComments[postId] = [...this.topLevelComments[postId]];
            }
          }

          // Remove from posts array too
          this.posts.forEach(post => {
            if (post.comments) {
              post.comments = post.comments.filter(c => c.id !== commentId);
            }
          });

          // Close the dropdown
          this.activeCommentDropdown = null;
        },
        error: (err) => {
          console.error('Error deleting comment:', err);
        }
      });
    }
  }

// Component properties to manage reply input state
showReplyInput: { [key: string]: boolean } = {};
replyContent: { [key: string]: string } = {};
replySubmitting: { [key: string]: boolean } = {};

// Toggle reply input visibility
toggleReplyInput(commentId: string): void {
  this.showReplyInput[commentId] = !this.showReplyInput[commentId];
  if (!this.showReplyInput[commentId]) {
    this.replyContent[commentId] = '';
  }
}

// Submit a reply to a comment
submitReply(commentId: string): void {
  if (!this.replyContent[commentId] || !this.replyContent[commentId].trim()) {
    return;
  }

  // Show loading indicator
  this.replySubmitting[commentId] = true;

  // Call the comment service to submit the reply
  this.commentService.replyToComment(commentId, this.replyContent[commentId], this.USER_ID).subscribe({
    next: (reply) => {
      // Add the reply to the selected post (modal view)
      this.addReplyToComment(commentId, reply);

      // Also update the post in the main posts list if it exists
      if (this.selectedPost?.id && this.posts) {
        const mainPost = this.posts.find(p => p.id === this.selectedPost?.id);
        if (mainPost) {
          this.addReplyToComment(commentId, reply, mainPost.comments);
        }
      }

      // Update the top-level comments if they were already fetched
      if (this.selectedPost?.id && this.topLevelComments[this.selectedPost.id]) {
        this.addReplyToComment(commentId, reply, this.topLevelComments[this.selectedPost.id]);
      }

      // Reset state
      this.replyContent[commentId] = '';
      this.showReplyInput[commentId] = false;
      this.replySubmitting[commentId] = false;
    },
    error: (errorObj) => {
      this.replySubmitting[commentId] = false;

      if (errorObj == "OK") {
        this.toxicContentDetected = true;
        this.handleToxicContentError();
      } else {
        // Handle other errors
        console.error('Error adding reply:', errorObj);
        this.error = errorObj.message || 'An error occurred';
      }
    }
  });
}

// Helper method to recursively find the parent comment and add the reply
addReplyToComment(parentId: string, reply: ForumComment, comments: ForumComment[] = this.selectedPost?.comments ?? []): boolean {
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];

    // If this is the parent comment we're looking for
    if (comment.id === parentId) {
      if (!comment.replies) {
        comment.replies = [];
      }

      // Check if the reply already exists
      const replyExists = comment.replies.some(r => r.id === reply.id);
      if (!replyExists) {
        comment.replies.push(reply);
      }
      return true;
    }

    // Search through nested replies recursively
    if (comment.replies && comment.replies.length > 0) {
      if (this.addReplyToComment(parentId, reply, comment.replies)) {
        return true;
      }
    }
  }

  return false;
}
// Store top-level comments by post ID
topLevelComments: { [postId: string]: ForumComment[] } = {};

// Get top-level comments for a post
getTopLevelComments(postId: string): ForumComment[] {
  // Check if we already have the comments for this post
  if (!this.topLevelComments[postId]) {
    // If not, fetch them
    console.log('Fetching top-level comments for postId:', postId);
    this.commentService.getTolevel(postId).subscribe({
      next: (comments) => {
        console.log('Received top-level comments:', comments);
        this.topLevelComments[postId] = comments || [];
      },
      error: (error) => {
        console.error('Error fetching comments:', error);
        this.topLevelComments[postId] = [];
      }
    });

    // Initialize with empty array while waiting for response
    this.topLevelComments[postId] = [];
  }

  return this.topLevelComments[postId] || [];
}


  getRepliesForComment(commentId: string): ForumComment[] {
    if (!this.selectedPost || !this.selectedPost.comments) {
      return [];
    }
    return this.selectedPost.comments.filter(comment =>
      comment.parentCommentId === commentId
    );
  }

  getCommentReplies(commentId: string): any[] {
    if (!this.selectedPost || !this.selectedPost.comments) {
      return [];
    }

    return this.selectedPost.comments.filter(comment =>
      comment.parentCommentId === commentId
    );
  }


}
