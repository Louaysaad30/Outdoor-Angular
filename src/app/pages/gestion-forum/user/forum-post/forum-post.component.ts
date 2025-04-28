import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
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
import { switchMap, takeWhile, catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';



import {ModalModule} from "ngx-bootstrap/modal";
import {interval, Subscription} from "rxjs";
import {AuthServiceService} from "../../../../account/auth/services/auth-service.service";
import {UserServiceService} from "../../../../account/auth/services/user-service.service";

@Component({
  selector: 'app-forum-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SharedModule, SimplebarAngularModule, TooltipModule, NgxDropzoneModule, PickerComponent, ReactiveFormsModule, ModalModule],
  templateUrl: './forum-post.component.html',
  styleUrl: './forum-post.component.scss',

})
export class ForumPostComponent implements OnInit {
  userReactions: Map<string, Reaction> = new Map<string, Reaction>();


  toxicContentDetected: boolean = false; // Added property
  toxicImageDetected: boolean = false; // Added property

  profileImage: string = 'assets/profile-pic.png';
  isModalOpen: boolean = false;
  postContent: string = '';
  isSubmitting: boolean = false;
  USER_ID: number;
  isLoadingComments: boolean = false;

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
  private user: any;
   nameUser: any;
   firstnameUser: any;

  constructor(
    private postService: PostService,
    private router: Router,
    private formBuilder: FormBuilder,
    private commentService: CommentService,
    private modalService: NgbModal,
    private reactionService: ReactionService, // Add this line
    private authService: AuthServiceService,
    private  userService: UserServiceService,
  private route: ActivatedRoute // Add this line




) {
    this.USER_ID = 0;

  }


  // Missing ViewChild reference and modal show call

// Added ViewChild reference and modal show call


  @ViewChild('deleteRecordModal', {static: false}) deleteRecordModal!: ModalDirective;

  handleToxicContentError() {
    this.toxicContentDetected = true;
    setTimeout(() => {
      this.deleteRecordModal.show();
    });
  }

// After
openPostDetail(post: Post): void {
  this.selectedPost = post;
  this.isDetailModalOpen = true;
  this.newDetailComment = '';
  this.currentMediaIndex = 0;
  this.isLoadingComments = true; // Add this flag



  // Pre-load top level comments when opening post detail
  this.commentService.getTolevel(post.id!).subscribe({
    next: (comments) => {
      let remainingComments = comments ? comments.length : 0;

      if (remainingComments === 0) {
        this.topLevelComments[post.id!] = [];
        this.isLoadingComments = false;
        return;
      }

      this.topLevelComments[post.id!] = comments || [];

      // Process top-level comments and their replies recursively
      this.topLevelComments[post.id!].forEach((comment, index) => {
        this.enrichCommentWithUserDetails(comment, (updatedComment) => {
          this.topLevelComments[post.id!][index] = updatedComment;
          remainingComments--;
          if (remainingComments === 0) {
            this.isLoadingComments = false;
          }
        });
      });
    },
    error: () => {
      this.isLoadingComments = false;
    }
  });
}
// Recursive helper method to enrich comments and their replies with user details
private enrichCommentWithUserDetails(comment: any, callback: (updatedComment: any) => void): void {
  this.commentService.getCommentWithUserDetails(comment.id!).subscribe({
    next: (response) => {
      // Enrich the current comment with user details
      const enrichedComment = {
        ...response.comment,
        userProfilePic: response.user.image,
        username: `${response.user.prenom} ${response.user.nom}`
      };

      // If this comment has replies, process them recursively
      if (enrichedComment.replies && enrichedComment.replies.length > 0) {
        let pendingReplies = enrichedComment.replies.length;

        enrichedComment.replies.forEach((reply: any, replyIndex: number) => {
          this.enrichCommentWithUserDetails(reply, (updatedReply) => {
            enrichedComment.replies[replyIndex] = updatedReply;

            // When all replies are processed, call the callback
            pendingReplies--;
            if (pendingReplies === 0) {
              callback(enrichedComment);
            }
          });
        });
      } else {
        // If no replies, just call the callback
        callback(enrichedComment);
      }
    },
    error: (error) => {
      console.error('Error fetching user details:', error);
      callback(comment); // Return original comment on error
    }
  });
}  // Helper method to fetch user details for replies recursively
  fetchUserDetailsForReplies(replies: ForumComment[]): void {
    replies.forEach(reply => {
      this.commentService.getCommentWithUserDetails(reply.id!).subscribe({
        next: (response) => {
          reply.userProfilePic = response.user.image;

          // Process nested replies if any
          if (reply.replies && reply.replies.length > 0) {
            this.fetchUserDetailsForReplies(reply.replies);
          }
        },
        error: (error) => {
          console.error(`Error fetching user details for reply ${reply.id}:`, error);
        }
      });
    });
  }

  closeDetailModal() {
    this.isDetailModalOpen = false;
    this.selectedPost = null;
    this.newDetailComment = '';
  }




  ngOnInit(): void {
    this.loadAvailableLanguages();

    this.USER_ID = JSON.parse(localStorage.getItem('user')!).id;
    console.log('User ID:', this.USER_ID);
    this.profileImage  = JSON.parse(localStorage.getItem('user')!).image;
    this.nameUser = JSON.parse(localStorage.getItem('user')!).prenom + ' ' +JSON.parse(localStorage.getItem('user')!).nom  ;
    this.firstnameUser = JSON.parse(localStorage.getItem('user')!).prenom;
    this.loadPosts();
    this.breadCrumbItems = [
      { label: 'Forum', active: false },
      { label: 'Feed', active: true }
    ];

    this.formData = this.formBuilder.group({
      message: ['', Validators.required]
    });

    // Fetch posts when component initializes
  }

  // Keep the existing openPostDetail, but remove the user data loading part

  // Method to load reactions for a specific post
  loadReactions(postId: string) {
    this.reactionService.getReactionsByPostId(postId).subscribe({
      next: (reactions) => {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.reactions = reactions;
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
      case ReactionType.LIKE:
        return 'bi bi-hand-thumbs-up-fill text-primary';
      case ReactionType.LOVE:
        return 'bi bi-heart-fill text-danger';
      case ReactionType.HAHA:
        return 'bi bi-emoji-laughing-fill text-warning';
      case ReactionType.WOW:
        return 'bi bi-emoji-dizzy-fill text-warning';
      case ReactionType.SAD:
        return 'bi bi-emoji-frown-fill text-info';
      case ReactionType.ANGRY:
        return 'bi bi-emoji-angry-fill text-danger';
      default:
        return 'bi bi-hand-thumbs-up text-muted';
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
      next: (data: Post[]) => {
        const postsWithUsers$ = data.map((post: Post) => {
          return this.userService.getUserById(post.userId!).pipe(
            map((user: any) => {
              post.username = user.nom + ' ' + user.prenom;
              post.userProfilePic = user.image;
              return post;
            }),
            catchError((error: any) => {
              console.error(`Error fetching user data for post ID ${post.id}:`, error);
              return of(post); // continue even if user data fails
            })
          );
        });

        forkJoin(postsWithUsers$).subscribe({
          next: (posts: Post[]) => {
            this.posts = posts;
            this.posts.forEach(post => {
              if (post.id) {
                this.loadReactions(post.id);
              }
            });
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error loading posts with user data', error);
            this.loading = false;
          }
        });
      },
      error: (error: any) => {
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
    this.toxicContentDetected = false; // Reset toxicity flag
    this.toxicImageDetected = false; // Reset toxicity flag
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

  onBlur() {
  }

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
    this.toxicImageDetected = false; // Reset toxicity flag

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
        this.toxicContentDetected = false;
        this.toxicImageDetected = false;// Reset toxicity flag
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
        } else {
          // Handle other errors if needed
          this.error = errorObj.message || 'An error occurred';
        }
      }
    });
  }


  // Method to handle adding a comment in the detail modal
  addDetailComment(): void {
    if (!this.newDetailComment || !this.newDetailComment.trim() || !this.selectedPost) return;

    this.isSubmitting = true;

    this.commentService.addComment(this.selectedPost.id!, this.newDetailComment, this.USER_ID).subscribe({
      next: (comment: ForumComment) => {
        // Load user details for the new comment
        this.userService.getUserById(comment.userId!).subscribe({
          next: (user) => {
            comment.username = user.nom + ' ' + user.prenom;
            comment.userProfilePic = user.image;

            // Add comment to both data structures
            if (!this.selectedPost!.comments) {
              this.selectedPost!.comments = [];
            }
            this.selectedPost!.comments.push(comment);

            if (!this.topLevelComments[this.selectedPost!.id!]) {
              this.topLevelComments[this.selectedPost!.id!] = [];
            }
            this.topLevelComments[this.selectedPost!.id!].push(comment);

            // Create new reference to trigger change detection
            this.topLevelComments[this.selectedPost!.id!] = [...this.topLevelComments[this.selectedPost!.id!]];

            this.newDetailComment = '';
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error fetching user details:', error);
            this.isSubmitting = false;
          }
        });
      },
      error: (errorObj) => {
        this.isSubmitting = false; // Reset submission state
        if (errorObj == "OK") {
          this.toxicContentDetected = true;
          this.handleToxicContentError()
        } else {
          // Handle other errors if needed
          this.error = errorObj.message || 'An error occurred';
        }
      }
    });
  }

// Update the submitReply method to fetch user details for replies
  submitReply(commentId: string): void {
    if (!this.replyContent[commentId] || !this.replyContent[commentId].trim()) {
      return;
    }

    this.replySubmitting[commentId] = true;

    this.commentService.replyToComment(commentId, this.replyContent[commentId], this.USER_ID).subscribe({
      next: (reply) => {
        // Fetch user details for the reply
        this.userService.getUserById(reply.userId!).subscribe({
          next: (user) => {
            reply.username = user.nom + ' ' + user.prenom;
            reply.userProfilePic = user.image;

            // Now add the reply with user details
            this.addReplyToComment(commentId, reply);

            if (this.selectedPost?.id && this.posts) {
              const mainPost = this.posts.find(p => p.id === this.selectedPost?.id);
              if (mainPost) {
                this.addReplyToComment(commentId, reply, mainPost.comments);
              }
            }

            if (this.selectedPost?.id && this.topLevelComments[this.selectedPost.id]) {
              this.addReplyToComment(commentId, reply, this.topLevelComments[this.selectedPost.id]);

              // Trigger change detection
              this.topLevelComments[this.selectedPost.id] = [...this.topLevelComments[this.selectedPost.id]];
            }

            this.replyContent[commentId] = '';
            this.showReplyInput[commentId] = false;
            this.replySubmitting[commentId] = false;
          },
          error: (error) => {
            console.error('Error fetching user details for reply:', error);
            this.replySubmitting[commentId] = false;
          }
        });
      },
      error: (errorObj) => {
        this.replySubmitting[commentId] = false;

        if (errorObj == "OK") {
          this.toxicContentDetected = true;
          this.handleToxicContentError();
        } else {
          console.error('Error adding reply:', errorObj);
          this.error = errorObj.message || 'An error occurred';
        }
      }
    });
  }



  // Update the editComment method
  editComment(comment: ForumComment): void {
    this.editingCommentId = comment.id!;
    this.editCommentText = comment.content!;
    this.activeCommentDropdown = null;
  }

  // Add a saveEditedComment method
saveEditedComment(): void {
  if (!this.editingCommentId || !this.editCommentText.trim()) return;

  // Find the original comment to preserve all its details
  let originalComment: any = null;

  // Search in all possible locations
  if (this.selectedPost && this.selectedPost.id) {
    const comments = this.topLevelComments[this.selectedPost.id] || [];

    // Search in top level comments
    originalComment = comments.find(c => c.id === this.editingCommentId);

    // If not found, search in replies
    if (!originalComment) {
      for (const comment of comments) {
        if (comment.replies) {
          const reply = comment.replies.find(r => r.id === this.editingCommentId);
          if (reply) {
            originalComment = reply;
            break;
          }
        }
      }
    }
  }

  this.commentService.editComment(this.editingCommentId, this.editCommentText).subscribe({
    next: (response) => {
      console.log('Comment updated:', response);

      // Merge response with original comment to preserve user details
      const updatedComment = {
        ...originalComment,
        content: this.editCommentText,
        updatedAt: response.createdAt || new Date()
      };

      // Update comment in posts array
      this.posts.forEach(post => {
        if (post.comments) {
          const commentIndex = post.comments.findIndex(c => c.id === this.editingCommentId);
          if (commentIndex !== -1) {
            post.comments[commentIndex] = updatedComment;
          }
        }
      });

      // Update in topLevelComments
      if (this.selectedPost?.id && this.topLevelComments[this.selectedPost.id]) {
        // Update top level comments
        const topLevelIndex = this.topLevelComments[this.selectedPost.id].findIndex(
          c => c.id === this.editingCommentId
        );
        if (topLevelIndex !== -1) {
          this.topLevelComments[this.selectedPost.id][topLevelIndex] = updatedComment;
        }

        // Update replies
        this.topLevelComments[this.selectedPost.id].forEach(comment => {
          if (comment.replies) {
            const replyIndex = comment.replies.findIndex(r => r.id === this.editingCommentId);
            if (replyIndex !== -1) {
              comment.replies[replyIndex] = updatedComment;
            }
          }
        });

        // Trigger change detection
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
      this.commentService.getTolevel(postId).subscribe({
        next: (comments) => {
          this.topLevelComments[postId] = comments || [];
        },
        error: (error) => {
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


  // Add to your component class
  isMediaSidebarOpen: boolean = false;
  mediaDescription: string = '';
  contentType: string = 'image';
  mediaStyle: string = 'realistic';
  isGenerating: boolean = false;
  generatedMediaUrl: string | null = null;

  toggleMediaSidebar() {
    this.isMediaSidebarOpen = !this.isMediaSidebarOpen;
    if (this.isMediaSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMediaSidebar(event: Event) {
    if (event.target === event.currentTarget) {
      this.isMediaSidebarOpen = false;
      document.body.style.overflow = '';
    }
  }

  generatedPostId: string | null = null;
  contentCheckSubscription: Subscription | null = null;
  downloadLink: string | null = null;


// Update the generateMedia method
  generateMedia() {
    if (!this.mediaDescription) return;

    this.isGenerating = true;
    this.generatedMediaUrl = null;

    // Call the Spring Boot API to generate content
    this.postService.generateContent(this.mediaDescription, this.contentType).subscribe({
      next: (response) => {
        console.log('Content generation initiated:', response);
        this.generatedPostId = response.postId;

        // Start polling to check if content is ready
if (this.generatedPostId) {
          this.pollContentStatus(this.generatedPostId);
        }      },
      error: (error) => {
        console.error('Error generating content:', error);
        this.isGenerating = false;
      }
    });
  }

// Add method to poll content status
  pollContentStatus(postId: string) {
    // Clear previous subscription if any
    if (this.contentCheckSubscription) {
      this.contentCheckSubscription.unsubscribe();
    }

    // Poll every 2 seconds until content is ready
    this.contentCheckSubscription = interval(2000)
      .pipe(
        switchMap(() => this.postService.checkContentStatus(postId)),
        takeWhile(response => response.status !== 'completed', true)
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'completed') {
            this.isGenerating = false;
            this.generatedMediaUrl = response.contentUrl;
            this.downloadLink = response.contentUrl;

            // Stop polling
            if (this.contentCheckSubscription) {
              this.contentCheckSubscription.unsubscribe();
              this.contentCheckSubscription = null;
            }
          }
        },
        error: (error) => {
          console.error('Error checking content status:', error);
          this.isGenerating = false;

          // Stop polling on error
          if (this.contentCheckSubscription) {
            this.contentCheckSubscription.unsubscribe();
            this.contentCheckSubscription = null;
          }
        }
      });
  }

// Update regenerateMedia to use the API
  regenerateMedia() {
    this.generateMedia();
  }

// Add method for "Use This" button
  useGeneratedMedia() {
    if (this.generatedMediaUrl) {
      // Create a file object from the URL
      fetch(this.generatedMediaUrl)
        .then(res => res.blob())
        .then(blob => {
          // Create appropriate filename based on content type
          const filename = this.contentType === 'image'
            ? 'ai-generated-image.jpg'
            : 'ai-generated-video.mp4';

          // Create a File object
          const file = new File([blob], filename, {
            type: this.contentType === 'image' ? 'image/jpeg' : 'video/mp4'
          });

          // Add to uploaded files (using the existing uploadedFiles array in your component)
          this.uploadedFiles.push({
            file: file,
            name: file.name,
            type: file.type,
            size: file.size,
            objectURL: this.generatedMediaUrl
          });

          // Close sidebar
          this.isMediaSidebarOpen = false;
          document.body.style.overflow = '';

          // Optional: Open post modal to use the generated content
          this.openPostModal();
        })
        .catch(error => {
          console.error('Error converting URL to file:', error);
        });
    }
  }

// Add download functionality
downloadMedia() {
  if (!this.generatedMediaUrl) return;

  // Show a loading indicator
  const button = document.querySelector('.btn-outline-primary');
  let originalButtonText = '';
  if (button) {
    originalButtonText = button.innerHTML;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Downloading...';
  }

  // Use fetch to get the file as a blob
  fetch(this.generatedMediaUrl)
    .then(response => response.blob())
    .then(blob => {
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a link element with download attribute
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = this.contentType === 'image' ? 'ai-generated-image.jpg' : 'ai-generated-video.mp4';
      link.style.display = 'none';

      // Append to body, click and cleanup
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        if (button) {
          button.innerHTML = originalButtonText;
        }
      }, 100);
    })
    .catch(error => {
      console.error('Download failed:', error);
      if (button) {
        button.innerHTML = originalButtonText;
      }
    });
}// Clean up subscriptions when component is destroyed
  ngOnDestroy() {
    if (this.contentCheckSubscription) {
      this.contentCheckSubscription.unsubscribe();
    }

  }




goToUserPosts(userId: number | undefined): void {
  if (userId === undefined) {
    console.error('User ID is undefined');
    return;
  }
  // Navigate to the mesPost route with userId
  this.router.navigate(['../', 'mesPost'], {
    relativeTo: this.route,
    queryParams: { userId: userId }
  });
  console.log('Navigating to user posts for user ID:', userId);
}



// Add these properties to your component
selectedAITool: 'generator' | 'translator' = 'generator';
textToTranslate: string = '';
translatedText: string = '';
targetLanguage: string = '';
availableLanguages: Map<string, string> = new Map();
languagesArray: {code: string, name: string}[] = [];
isTranslating: boolean = false;
copySuccess: boolean = false;

// Add this to your ngOnInit


// Add these methods to your component
selectAITool(tool: 'generator' | 'translator'): void {
  this.selectedAITool = tool;

  // Reset states when switching tools
  if (tool === 'generator') {
    this.translatedText = '';
    this.copySuccess = false;
  } else {
    this.generatedMediaUrl = null;
    if (this.languagesArray.length === 0) {
      this.loadAvailableLanguages();
    }
  }
}

// Add to your component properties
translationError: string = '';
copyTranslation(): void {
  if (!this.translatedText) return;

  navigator.clipboard.writeText(this.translatedText).then(() => {
    this.copySuccess = true;
    setTimeout(() => this.copySuccess = false, 2000);
  });
}

// Update your reset method to handle both tools
resetAndCloseMediaSidebar(event: Event) {
  this.isMediaSidebarOpen = false;
  document.body.style.overflow = '';

  // Reset generator states
  this.mediaDescription = '';
  this.generatedMediaUrl = null;
  this.isGenerating = false;
  if (this.contentCheckSubscription) {
    this.contentCheckSubscription.unsubscribe();
    this.contentCheckSubscription = null;
  }

  // Reset translator states
  this.textToTranslate = '';
  this.translatedText = '';
  this.copySuccess = false;
}


// Add a loading indicator
isLoadingLanguages: boolean = false;

loadAvailableLanguages(): void {
  this.isLoadingLanguages = true;
  this.postService.getAvailableLanguages().subscribe({
    next: (languages) => {
      // Convert plain object to Map or handle as object
      this.availableLanguages = languages;

      // Use Object.entries instead of languages.keys()
      this.languagesArray = Object.entries(languages).map(([code, name]) => ({
        code: code,
        name: name as string
      })).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

      this.isLoadingLanguages = false;
    },
    error: (error) => {
      console.error('Error loading available languages:', error);
      this.isLoadingLanguages = false;
    }
  });
}

  private floresCodeToApiCode: {[key: string]: string} = {
    "eng_Latn": "en",
    "fra_Latn": "fr",
    "arb_Arab": "ar", // Another possible code for Arabic
    "spa_Latn": "es",
    "deu_Latn": "de",
    "ita_Latn": "it",
    "zho_Hans": "zh",
    "jpn_Jpan": "ja",
    "kor_Hang": "ko",
    "rus_Cyrl": "ru",

  };

  // Keep existing code...

  // Update this method to convert the language code
  translateText(): void {
    if (!this.textToTranslate || !this.targetLanguage) return;

    this.isTranslating = true;
    this.translatedText = '';
    this.translationError = '';

    // Convert the FLORES code to the API code
    const apiLanguageCode = this.floresCodeToApiCode[this.targetLanguage] || this.targetLanguage;

    this.postService.translateText(this.textToTranslate, apiLanguageCode).subscribe({
      next: (response) => {
        this.translatedText = response.translatedText;
        this.isTranslating = false;
      },
      error: (error) => {
        console.error('Error translating text:', error);
        this.isTranslating = false;
        this.translationError = 'Translation service is temporarily unavailable. Please try again later.';
      }
    });
  }

generateVideoThumbnail(videoElement: HTMLVideoElement, media: Media): void {
  // Skip if we already have a thumbnail
  if (media.thumbnailUrl) return;

  // Set video to a specific point
  videoElement.currentTime = 1.0; // Go to 1 second

  // Create thumbnail once we seek to that position
  videoElement.addEventListener('seeked', () => {
    // Create a canvas to capture the frame
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Draw the video frame on the canvas
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL
    try {
      const thumbnailUrl = canvas.toDataURL('image/jpeg');
      // Store the thumbnail URL in the media object
      media.thumbnailUrl = thumbnailUrl;
    } catch (e) {
      console.error('Could not generate thumbnail', e);
    }
  }, { once: true });
}
}
