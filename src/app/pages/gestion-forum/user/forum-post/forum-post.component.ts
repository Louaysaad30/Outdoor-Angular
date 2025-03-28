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
import {ForumDetailComponent} from "../forumDetail/forumDetail.component";
import {co} from "@fullcalendar/core/internal-common";
import {ReactionService} from "../../services/reaction.service";
import {ReactionType} from "../../models/reaction-type.enum";
import {Reaction} from "../../models/reaction.model";

@Component({
  selector: 'app-forum-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SharedModule, SimplebarAngularModule, TooltipModule, NgxDropzoneModule, PickerComponent, ReactiveFormsModule],
  templateUrl: './forum-post.component.html',
  styleUrl: './forum-post.component.scss'
})
export class ForumPostComponent {
  userReactions: Map<string, Reaction> = new Map<string, Reaction>();



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

  openPostDetail(post: Post): void {
    this.selectedPost = post;
    this.isDetailModalOpen = true;
    this.newDetailComment = '';
    this.currentMediaIndex = 0; // Reset to first media when opening detail
  }

  closeDetailModal() {
    this.isDetailModalOpen = false;
    this.selectedPost = null;
    this.newDetailComment = '';
  }

addDetailComment(): void {
    if (!this.selectedPost || !this.newDetailComment.trim()) return;

    this.commentService.addComment(this.selectedPost.id!, this.newDetailComment, 10).subscribe({
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
          const userReaction = reactions.find(r => r.userId === 10); // Using static user ID 10
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
      case ReactionType.WOW: return 'bi bi-emoji-surprise-fill text-warning';
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
    this.reactionService.addReaction(postId, 10, reactionType).subscribe({
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
        userId: 10, // Using the static ID as in your Spring Boot entity
        username: 'test_user',
        email: 'test_user@example.com'
      };

      // Extract actual File objects for upload
      const mediaFiles = this.uploadedFiles.map(fileObj => fileObj.file);

      // Call service with both post data and files
      this.postService.createPost(post, mediaFiles).subscribe(
        (createdPost) => {
          console.log('Post created successfully', createdPost);
          this.handlePostSuccess();
        },
        (error) => {
          console.error('Error creating post', error);
          this.isSubmitting = false;
          // Handle error, e.g., show message to user
        }
      );
    }
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

    this.commentService.addComment(postId, commentText, 10).subscribe({
      next: (comment: ForumComment) => {
        // Find the post and add the comment to it
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



}
