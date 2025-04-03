import { Component, OnInit } from '@angular/core';
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
    TabsModule
  ],
  templateUrl: './mes-posts.component.html',
  styleUrl: './mes-posts.component.scss'
})
export class MesPostsComponent implements OnInit {
  // Constants
  readonly USER_ID = 20; // Current user ID - should be retrieved from auth service in a real app

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
      case ReactionType.WOW: return 'bi bi-emoji-surprise-fill text-warning';
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
    this.isDetailModalOpen = true;
  }

  closeDetailModal() {
    this.isDetailModalOpen = false;
    this.selectedPost = null;
    this.newDetailComment = '';
  }

  addDetailComment(): void {
    if (!this.selectedPost || !this.newDetailComment.trim()) return;

    this.commentService.addComment(this.selectedPost.id!, this.newDetailComment, this.USER_ID).subscribe({
      next: (comment: ForumComment) => {
        // Find the post in the main posts array only
        const post = this.posts.find(p => p.id === this.selectedPost!.id);
        if (post) {
          if (!post.comments) {
            post.comments = [];
          }
          post.comments.push(comment);

          // Update selectedPost to reference the same array
          this.selectedPost = post;
        }

        this.newDetailComment = '';
      },
      error: (error) => {
        console.error('Error adding comment:', error);
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
          },
          error: (error) => {
            console.error('Error creating post', error);
            this.isSubmitting = false;
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
  console.log('All media items:', this.mediaItems.length);

  const videos = this.mediaItems.filter(media =>
    this.isVideo(media.mediaUrl!) &&
    media.post &&
    media.post.id
  );

  console.log('Filtered videos:', videos.length);
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
  editComment(comment: any): void {
    // Handle edit comment logic
    this.activeCommentDropdown = null;
  }

  deleteComment(commentId: string): void {
    // Handle delete comment logic
    this.activeCommentDropdown = null;
  }

}
