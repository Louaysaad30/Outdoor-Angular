import {Component, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { Post } from '../../models/post.model';
import { PostService } from '../../services/post.service';
import { CommentService } from '../../services/comment.service';
import { ReactionService } from '../../services/reaction.service';
import { ForumComment } from '../../models/ForumComment.model';
import { ReactionType } from '../../models/reaction-type.enum';
import { Reaction } from '../../models/reaction.model';
import { Media } from "../../models/media.model";
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {TabsModule} from "ngx-bootstrap/tabs";
import {Observable} from "rxjs";
import {ModalDirective, ModalModule} from "ngx-bootstrap/modal";
;


@Component({
  selector: 'app-mes-posts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SharedModule,
    NgxDropzoneModule,
    PickerComponent,
    ReactiveFormsModule,
    BsDropdownModule,
    TabsModule,
    ModalModule
  ],
  templateUrl: './mes-posts.component.html',
  styleUrl: './mes-posts.component.scss'
})
export class MesPostsComponent implements OnInit {
  // Constants
  readonly USER_ID = 10; // Current user ID - should be retrieved from auth service in a real app

  // State variables
  posts: Post[] = [];
  loading = false;
  error = '';
  selectedPost: Post | null = null;
  userReactions: Map<string, Reaction> = new Map<string, Reaction>();
  reactionBarVisible: Map<string, boolean> = new Map<string, boolean>();
  hideReactionBarTimeouts: Map<string, any> = new Map<string, any>();

  // UI state
  isDetailModalOpen = false;
  newComment = '';

  toxicImageDetected=false;// Reset toxicity flag


  // Enums
  ReactionType = ReactionType;

  constructor(
    private postService: PostService,
    private commentService: CommentService,
    private reactionService: ReactionService,
    private formBuilder: FormBuilder
  ) {
    // Initialize form
    this.formData = this.formBuilder.group({
      message: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserPosts();
    this.loadUserMedia();

  }
  onTabSelect(event: any): void {
    if (event.heading === 'Media') {
      this.loadUserMedia();
    }
  }

  loadUserPosts(): void {
    this.loading = true;
    this.postService.getUserPosts(this.USER_ID).subscribe({
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
        console.error('Error fetching user posts', error);
        this.error = `Failed to load your posts. Please try again later.`;
        this.loading = false;
      }
    });
  }

  // Reaction handling methods
  loadReactions(postId: string): void {
    this.reactionService.getReactionsByPostId(postId).subscribe({
      next: (reactions) => {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.reactions = reactions;

          // Store the user's reaction (if any) for easy access
          const userReaction = reactions.find(r => r.userId === this.USER_ID);
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

  reactToPost(postId: string, reactionType: ReactionType): void {
    const existingReaction = this.userReactions.get(postId);

    if (existingReaction) {
      // If user is clicking the same reaction, remove it
      if (existingReaction.reactionType === reactionType) {
        this.reactionService.deleteReaction(existingReaction.id!).subscribe({
          next: () => {
            this.userReactions.delete(postId);
            this.loadReactions(postId);
            this.hideReactionBar(postId);
          },
          error: (error) => console.error('Error removing reaction:', error)
        });
      } else {
        // If user is changing reaction type, update it
        this.reactionService.updateReaction(existingReaction.id!, reactionType).subscribe({
          next: (updatedReaction) => {
            this.userReactions.set(postId, updatedReaction);
            this.loadReactions(postId);
            this.hideReactionBar(postId);
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
          this.hideReactionBar(postId);
        },
        error: (error) => console.error('Error adding reaction:', error)
      });
    }
  }

  // Reaction UI methods
  getReactionIcon(reactionType: ReactionType): string {
    switch (reactionType) {
      case ReactionType.LIKE: return 'bi bi-hand-thumbs-up-fill text-primary';
      case ReactionType.LOVE: return 'bi bi-heart-fill text-danger';
      case ReactionType.HAHA: return 'bi bi-emoji-laughing-fill text-warning';
      case ReactionType.WOW: return 'bi bi-emoji-dizzy-fill text-warning';
      case ReactionType.SAD: return 'bi bi-emoji-frown-fill text-info';
      case ReactionType.ANGRY: return 'bi bi-emoji-angry-fill text-danger';
      default: return 'bi bi-hand-thumbs-up text-muted';
    }
  }

  showReactionBar(postId: string): void {
    if (!this.reactionBarVisible.get(postId)) {
      this.reactionBarVisible.set(postId, true);
      if (this.hideReactionBarTimeouts.has(postId)) {
        clearTimeout(this.hideReactionBarTimeouts.get(postId));
        this.hideReactionBarTimeouts.delete(postId);
      }
    }
  }

  hideReactionBarWithDelay(postId: string): void {
    const timeout = setTimeout(() => {
      this.reactionBarVisible.set(postId, false);
      this.hideReactionBarTimeouts.delete(postId);
    }, 300);

    this.hideReactionBarTimeouts.set(postId, timeout);
  }

  hideReactionBar(postId: string): void {
    this.reactionBarVisible.set(postId, false);
    if (this.hideReactionBarTimeouts.has(postId)) {
      clearTimeout(this.hideReactionBarTimeouts.get(postId));
      this.hideReactionBarTimeouts.delete(postId);
    }
  }

  keepReactionBarVisible(postId: string): void {
    if (this.hideReactionBarTimeouts.has(postId)) {
      clearTimeout(this.hideReactionBarTimeouts.get(postId));
      this.hideReactionBarTimeouts.delete(postId);
    }
    this.reactionBarVisible.set(postId, true);
  }

  toggleReactionBar(postId: string): void {
    const currentState = this.reactionBarVisible.get(postId);
    this.reactionBarVisible.set(postId, !currentState);

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

  hasReacted(postId: string, reactionType: ReactionType): boolean {
    const userReaction = this.userReactions.get(postId);
    return userReaction?.reactionType === reactionType;
  }

  getTotalReactionCount(postId: string): number {
    const post = this.posts.find(p => p.id === postId);
    return post?.reactions?.length || 0;
  }

  // Post management methods
  deletePost(postId: string): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postService.deletePost(postId).subscribe({
        next: () => {
          this.posts = this.posts.filter(post => post.id !== postId);
        },
        error: (error) => {
          console.error('Error deleting post', error);
        }
      });
    }
  }


  // Comment methods
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
      error: (error) => {
        console.error('Error adding comment:', error);
      }
    });
  }



  openPostDetail(post: Post): void {
    this.selectedPost = {...post};
    console.log("Post:", this.selectedPost);
    console.log(this.selectedPost.comments);
    this.isDetailModalOpen = true;
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

  /*** Modal Controls ***/
  openPostModal() {
    this.isModalOpen = true;
  }
/*

  closePostModal() {
    this.isModalOpen = false;
    this.showFileUpload = false;
    this.uploadedFiles = [];
    this.postContent = '';
    this.formData.reset();
    this.submitted1 = false;
  }
*/

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
    this.openPostModal();
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
/*
  publishPost() {
    this.submitted1 = true;

    if (this.formData.invalid && !this.uploadedFiles.length) {
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    if (this.postContent.trim() || this.uploadedFiles.length > 0) {
      this.isSubmitting = true;

      // Create post object matching the Spring Boot entity
      const post: Post = {
        content: this.postContent,
        hasMedia: this.uploadedFiles.length > 0,
        userId: this.USER_ID, // Using the user ID constant
        username: 'Iyed Mejri',
        email: 'iyed.mejri@example.com'
      };

      // Extract actual File objects for upload
      const mediaFiles = this.uploadedFiles.map(fileObj => fileObj.file);

      // Call service with both post data and files
      this.postService.createPost(post, mediaFiles).subscribe({
        next: (createdPost) => {
          console.log('Post created successfully', createdPost);
          this.handlePostSuccess();
        },
        error: (error) => {
          console.error('Error creating post', error);
          this.isSubmitting = false;
        }
      });
    }
  }
*/

  private handlePostSuccess() {
    this.closePostModal();
    this.isSubmitting = false;
    this.loadUserPosts();
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

  profileImage: string = 'assets/profile-pic.png';
  isModalOpen: boolean = false;
  postContent: string = '';
  isSubmitting: boolean = false;

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

  newDetailComment: string = '';
  get form() {
    return this.formData?.controls;
  }

// Add to component properties
isEditMode = false;
editPostId: string | null = null;
editingPost: Post | null = null;
  mediaToDelete: string[] = [];

editPost(post: Post): void {
    this.isEditMode = true;
    this.editPostId = post.id!;
    this.editingPost = {...post};
    this.postContent = post.content || '';
    this.uploadedFiles = [];

    // Load existing media files
    if (post.media && post.media.length > 0) {
      post.media.forEach(media => {
        this.uploadedFiles.push({
          name: media.mediaUrl?.split('/').pop() || 'media',
          type: this.isImage(media.mediaUrl!) ? 'image/jpeg' : 'video/mp4',
          size: 0,
          objectURL: media.mediaUrl,
          isExisting: true,
          id: media.id
        });
      });
      this.showFileUpload = true; // Show file upload area if post has media
    }

    this.mediaToDelete = [];
    this.isModalOpen = true;
  }

  publishPost() {
    this.submitted1 = true;

    if (this.isSubmitting) {
      return;
    }

    if (this.postContent.trim() || this.uploadedFiles.length > 0) {
      this.isSubmitting = true;

      if (this.isEditMode && this.editPostId) {
        // Extract new files to upload (not existing media)
        const newMediaFiles = this.uploadedFiles
          .filter(file => !file.isExisting)
          .map(file => file.file || file);

        const mediaTypes = this.uploadedFiles
          .map(file => file.type);

        // Determine if post has media after edit (both new and existing that haven't been deleted)
        const hasMedia = this.uploadedFiles.length > 0;

        // Update the post with hasMedia flag
        this.postService.updatePost(
          this.editPostId,
          this.postContent,
          newMediaFiles,
          mediaTypes,
          this.mediaToDelete,
          hasMedia
        ).subscribe({
          next: (updatedPost) => {
            this.handlePostSuccess();
          },
          error: (error) => {
            console.error('Error updating post:', error);
            this.isSubmitting = false;
          }
        });
      } else {
        // Existing create post logic
        const post: Post = {
          content: this.postContent,
          hasMedia: this.uploadedFiles.length > 0,
          userId: this.USER_ID,
          username: 'Iyed Mejri',
          email: 'iyed.mejri@example.com'
        };

        const mediaFiles = this.uploadedFiles.map(fileObj => fileObj.file);

        this.postService.createPost(post, mediaFiles).subscribe({
          next: (createdPost) => {
            console.log('Post created successfully', createdPost);
            this.handlePostSuccess();
            this.toxicContentDetected = false; // Reset toxic content state
            this.toxicImageDetected=false;// Reset toxicity flag

          },
          error: (errorObj) => {
            this.isSubmitting = false;
            console.log('alooo', errorObj?.message);
            if (errorObj === 'TOXIC_CONTENT') {
              this.toxicContentDetected = true;
            } else if (errorObj === 'TOXIC_IMAGE') {
              this.toxicImageDetected = true;
            } else {
              this.error = errorObj.message || 'An error occurred';
            }
          }
        });
      }
    }
  }

// Add method to mark media for deletion
removeExistingMedia(file: any) {
  const index = this.uploadedFiles.findIndex(f => f.id === file.id);
  if (index !== -1) {
    // Store the ID to be removed on the server
    if (file.id) {
      this.mediaToDelete.push(file.id);
    }
    this.uploadedFiles.splice(index, 1);
  }
}
// Modify closePostModal to reset edit state
closePostModal() {
  this.isModalOpen = false;
  this.isEditMode = false;
  this.editPostId = null;
  this.editingPost = null;
  this.showFileUpload = false;
  this.uploadedFiles = [];
  this.postContent = '';
  this.formData.reset();
  this.submitted1 = false;
  this.mediaToDelete = [];
  this.showEmojiPicker = false;
  this.showFileUpload = false;
  this.reactionBarVisible.clear();
  this.toxicContentDetected = false;
  this.toxicImageDetected=false;// Reset toxicity flag
}

// Media management
mediaItems: Media[] = [];
mediaPage = 1;
mediaPageSize = 12;
hasMoreMedia = false;

// Call this in ngOnInit or in a specific method when the media tab is selected
loadUserMedia(): void {
  this.loading = true;
  this.postService.getUserMedia(this.USER_ID).subscribe({
    next: (mediaList) => {
      this.mediaItems = mediaList;
      this.loading = false;
    },
    error: (error) => {
      console.error('Error fetching media', error);
      this.loading = false;
    }
  });
}
hasAnyMedia(): boolean {
  return this.mediaItems && this.mediaItems.length > 0;
}

getAllMedia(): Media[] {
  return this.mediaItems;
}

  getOnlyImages(): Media[] {
    return this.mediaItems.filter(media => this.isImage(media.mediaUrl!)
    && media.post&& media.post.id);
  }

getOnlyVideos(): Media[] {
  // Logging for debugging

  const videos = this.mediaItems.filter(media =>
    this.isVideo(media.mediaUrl!) &&
    media.post &&
    media.post.id
  );

  return videos;
}  isImage(url: string): boolean {
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/) !== null;
  }

  isVideo(url: string): boolean {
    return url.match(/\.(mp4|webm|ogg|mov|avi)$/) !== null;
  }



  loadMoreMedia(): void {
  this.mediaPage++;
  this.loadUserMedia();
}

openMediaPreview(media: Media): void {
  // Implement a modal or lightbox view for the selected media
  console.log('Open preview for media', media);
}

goToPost(postId: string | undefined): void {
  console.log('goToPost called with ID:', postId);

  if (!postId) {
    console.error('No post ID available for this media');
    return;
  }

  // Add loading state
  this.loading = true;

  this.postService.getPostById(postId).subscribe({
    next: (post) => {
      console.log('Post fetched successfully:', post);
      this.loading = false;
      if (post) {
        this.selectedPost = {...post};
        this.isDetailModalOpen = true;
      } else {
        console.error('Post data is empty');
      }
    },
    error: (error) => {
      this.loading = false;
      console.error('Error fetching post details:', error);
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

  // In your component class
  displayedImageCount = 6; // Initially show 6 images

  // Method to load more images
  loadMoreImages(): void {
    if (this.displayedImageCount < this.getOnlyImages().length) {
      this.displayedImageCount += this.getOnlyImages().length;
    }
  }

  // Add this to ngOnInit or wherever you reset your view
  resetImageCount(): void {
    this.displayedImageCount = 6;
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
}  cancelEditComment(): void {
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

  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal!: ModalDirective;

  toxicContentDetected: boolean = false; // Added property
  handleToxicContentError() {
    this.toxicContentDetected = true;
    setTimeout(() => {
      this.deleteRecordModal.show();
    });
  }

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


// Add this property to your component class
topLevelComments: { [postId: string]: ForumComment[] } = {};

// Replace the existing getTopLevelComments method with this:
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


