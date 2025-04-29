import { Component, OnInit, ViewChild } from '@angular/core';
          import { SlickCarouselComponent, SlickCarouselModule } from "ngx-slick-carousel";
          import { TooltipModule } from "ngx-bootstrap/tooltip";
          import { ActivatedRoute } from "@angular/router";
          import {DatePipe, NgIf, NgFor, AsyncPipe, NgClass, NgTemplateOutlet} from "@angular/common";
          import { SharedModule } from "../../../../shared/shared.module";
          import { PostService } from "../../services/post.service";
          import { Post } from "../../models/post.model";
          import { UserServiceService } from "../../../../account/auth/services/user-service.service";
          import { switchMap } from "rxjs/operators";
import {ForumComment} from "../../models/ForumComment.model";
import {PaginationModule} from "ngx-bootstrap/pagination";
import {FormsModule} from "@angular/forms";
import {CommentService} from "../../services/comment.service";
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

          @Component({
            selector: 'app-postdetail',
            standalone: true,
            imports: [
              SlickCarouselModule,
              TooltipModule,
              DatePipe,
              NgIf,
              NgFor,
              AsyncPipe,
              SharedModule,
              NgClass,
              NgTemplateOutlet,
              PaginationModule,
              FormsModule
            ],
            templateUrl: './postdetail.component.html',
            styleUrl: './postdetail.component.scss'
          })
          export class PostdetailComponent implements OnInit {
            // bread crumb items
            breadCrumbItems!: Array<{}>;
            post: Post | null = null;
            loading: boolean = true;
            error: string | null = null;

            @ViewChild('slickModal') slickModal!: SlickCarouselComponent;

            // Media slider config
            slideConfig = {
              infinite: true,
              slidesToShow: 1,
              slidesToScroll: 1,
              autoplay: true,  // Enabled autoplay
              autoplaySpeed: 3000,  // Added autoplaySpeed
              dots: true,
              arrows: true
            };

            slidesConfig = {
              infinite: true,
              slidesToShow: 4,
              slidesToScroll: 1,
              autoplay: true,  // Enabled autoplay
              autoplaySpeed: 3000,  // Added autoplaySpeed
              responsive: [
                {
                  breakpoint: 992,
                  settings: {
                    slidesToShow: 3,
                  }
                },
                {
                  breakpoint: 576,
                  settings: {
                    slidesToShow: 2,
                  }
                }
              ]
            };

            constructor(
              private route: ActivatedRoute,
              private postService: PostService,
              private userService: UserServiceService,
              private commentService: CommentService// Add this service injection

            ) {}

ngOnInit(): void {
              // Set breadcrumb
              this.breadCrumbItems = [
                { label: 'Forum Management' },
                { label: 'Posts' },
                { label: 'Post Details', active: true }
              ];

              // Get post ID from route parameter and fetch post data
              this.route.paramMap.pipe(
                switchMap(params => {
                  const id = params.get('id');
                  if (!id) {
                    throw new Error('Post ID is required');
                  }
                  return this.postService.getPostById(id);
                }),
                switchMap(post => {
                  this.post = post;
                  // If post has a userId, fetch user details
                  if (post && post.userId) {
                    return this.userService.getUserById(post.userId);
                  }
                  return Promise.resolve(null);
                })
              ).subscribe({
                next: (user) => {
                  if (user && this.post) {
                    // Add user details to post
                    this.post.username = user.nom + ' ' + user.prenom;
                    this.post.userProfilePic = user.image || 'assets/images/users/avatar-1.jpg';
                    // Populate comment usernames if post has comments
                    if (this.post.comments && this.post.comments.length > 0) {
                      this.populateCommentUserData(this.post.comments);
                      // Process comments sentiment after populating user data
                      this.processCommentsWithSentiment(this.post.comments);
                    }
                  }
                  this.analyzeAllComments();

                  this.loading = false;
                },
                error: (err) => {
                  console.error('Error fetching post details:', err);
                  this.error = 'Failed to load post details. Please try again.';
                  this.loading = false;
                }
              });
            }
            // Add this new method to your component
private populateCommentUserData(comments: ForumComment[]): void {
  // Create a unique set of all user IDs from comments and all nested replies
  const userIds = new Set<string>();

  // Recursive function to collect all userIds from comments at any nesting level
  const collectUserIds = (commentsList: ForumComment[]) => {
    commentsList.forEach(comment => {
      if (comment.userId) userIds.add(comment.userId.toString());

      // Process replies recursively
      if (comment.replies && comment.replies.length > 0) {
        collectUserIds(comment.replies);
      }
    });
  };

  // Start collecting user IDs
  collectUserIds(comments);

  // Fetch user data for all unique user IDs
  Array.from(userIds).forEach(userId => {
    this.userService.getUserById(+userId).subscribe({
      next: (user) => {
        // Recursive function to update usernames at any nesting level
        const updateUserData = (commentsList: ForumComment[]) => {
          commentsList.forEach(comment => {
            if (comment.userId?.toString() === userId) {
              comment.username = user.nom + ' ' + user.prenom;
              comment.userProfilePic = user.image || 'assets/images/users/avatar-1.jpg';
            }

            // Process replies recursively
            if (comment.replies && comment.replies.length > 0) {
              updateUserData(comment.replies);
            }
          });
        };

        // Start updating user data
        updateUserData(comments);
      },
      error: (error) => {
        console.error(`Error fetching user data for ID ${userId}:`, error);
      }
    });
  });
}            // Check if media is video
            isVideo(url: string | undefined): boolean {
              if (!url) return false;

              const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
              const urlLower = url.toLowerCase();

              return videoExtensions.some(ext => urlLower.endsWith(ext)) ||
                (url.includes('video/') || url.includes('youtube') || url.includes('vimeo'));
            }

            // Slider navigation
            slickChange(event: any) {
              // Handle slider change event
            }

            // Preview slide
            slidePreview(id: any, event: any) {
              const swiper = document.querySelectorAll('.swiperlist');
              swiper.forEach((el: any) => {
                el.classList.remove('swiper-slide-thumb-active');
              });
              event.target.closest('.swiperlist').classList.add('swiper-slide-thumb-active');
              this.slickModal.slickGoTo(id);
            }

            // Format date to readable format
            formatDate(date: string | Date | undefined): string {
              if (!date) return 'Unknown date';
              return new Date(date).toLocaleString();
            }

            // Delete post method can be added here
            deletePost() {
              if (!this.post || !this.post.id) return;

              if (confirm('Are you sure you want to delete this post?')) {
                this.postService.deletePost(this.post.id).subscribe({
                  next: () => {
                    // Navigate back or show success message
                    history.back();
                  },
                  error: (err) => {
                    console.error('Error deleting post:', err);
                    alert('Failed to delete post. Please try again.');
                  }
                });
              }
            }






// Update or add this method

            getTopLevelComments(postId: string): ForumComment[] {
              if (!this.post?.comments) return [];

              const repliesIds = new Set(this.post.comments.flatMap(c => c.replies?.map(r => r.id) || []));

              return this.post.comments.filter(comment =>
                !comment.parentCommentId && !repliesIds.has(comment.id)
              );
            }


// Pagination pour les commentaires
            currentPage: number = 1;
            commentsPerPage: number = 5;

            get paginatedTopLevelComments(): ForumComment[] {
              const topLevelComments = this.getTopLevelComments(this.post?.id!);
              const startIndex = (this.currentPage - 1) * this.commentsPerPage;
              return topLevelComments.slice(startIndex, startIndex + this.commentsPerPage);
            }

            onPageChange(page: number): void {
              this.currentPage = page;
            }

// Add this method to handle page changes



deleteComment(commentId: string): void {
  if (confirm('Are you sure you want to delete this comment?')) {
    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        if (this.post && this.post.comments) {
          // First check if it's a top-level comment
          const commentIndex = this.post.comments.findIndex(comment => comment.id === commentId);

          if (commentIndex !== -1) {
            // Before removing, store the replies that need to be removed
            const repliesToRemove = this.post.comments[commentIndex].replies || [];

            // Remove the top-level comment
            this.post.comments.splice(commentIndex, 1);

            // Remove all replies associated with this comment from the UI
            // This is necessary because the backend already removed them from the database
            if (repliesToRemove.length > 0) {
              // Create a set of IDs to remove for faster lookup
              const replyIdsToRemove = new Set(repliesToRemove.map(reply => reply.id));

              // Filter out any replies that were children of the deleted comment
              this.post.comments = this.post.comments.filter(comment =>
                !replyIdsToRemove.has(comment.id)
              );
            }
          } else {
            // It's a nested reply, use the existing method to find and remove it
            this.removeNestedComment(this.post.comments, commentId);
          }
        }
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment. Please try again.');
      }
    });
  }
}

            private removeNestedComment(comments: ForumComment[], commentId: string): boolean {
              for (let i = 0; i < comments.length; i++) {
                const comment = comments[i];

                // Check if this comment has the reply we want to delete
                if (comment.replies && comment.replies.length > 0) {
                  const replyIndex = comment.replies.findIndex(reply => reply.id === commentId);

                  if (replyIndex !== -1) {
                    // Found the reply, remove it
                    comment.replies.splice(replyIndex, 1);
                    return true;
                  }

                  // If not found directly, search deeper in nested replies
                  if (this.removeNestedComment(comment.replies, commentId)) {
                    return true;
                  }
                }
              }

              return false;
            }


    // Add these properties to the PostdetailComponent class
    positiveCommentCount: number = 0;
    negativeCommentCount: number = 0;

    // Add this method to analyze all comments
analyzeAllComments(): void {
  if (!this.post?.comments || this.post.comments.length === 0) return;

  // Reset counters
  this.positiveCommentCount = 0;
  this.negativeCommentCount = 0;

  let analyzedCount = 0;
  const totalComments = this.post.comments.length;

  // Analyze each comment
  this.post.comments.forEach(comment => {
    this.postService.analyzeText(comment.content ?? '').subscribe({
      next: (result) => {
        // Log the raw response for debugging
        console.log('Received analysis result:', result);

        try {
          // Parse if it's a string
          const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

          // Based on the console logs, the API returns "Positive" or "Negative" with capital letters
          if (parsedResult.prediction === 'Positive') {
            this.positiveCommentCount++;
            console.log('Added positive comment');
          } else if (parsedResult.prediction === 'Negative') {
            this.negativeCommentCount++;
            console.log('Added negative comment');
          } else {
            console.log('Unknown prediction value:', parsedResult.prediction);
          }
        } catch (e) {
          console.error('Error parsing result:', e);
          // Fallback to string check if needed
          const resultStr = String(result);
          if (resultStr.includes('Positive')) {
            this.positiveCommentCount++;
          } else if (resultStr.includes('Negative')) {
            this.negativeCommentCount++;
          }
        }

        analyzedCount++;
        // Log when all comments have been analyzed
        if (analyzedCount === totalComments) {
          console.log(`Analysis complete: ${this.positiveCommentCount} positive, ${this.negativeCommentCount} negative comments`);
        }
      },
      error: (err) => {
        console.error('Error analyzing comment:', err);
        analyzedCount++;
      }
    });
  });
}    // Add this to ngOnInit, after post data is loaded




analyzeSentiment(comment: ForumComment): Observable<ForumComment> {
  if (!comment || !comment.content) {
    return of(comment);
  }

  return this.postService.analyzeText(comment.content).pipe(
    map(sentiment => {
      try {
        // Parse the response if it's a string
        const parsedResult = typeof sentiment === 'string'
          ? JSON.parse(sentiment)
          : sentiment;

        // Set the sentiment based on the prediction field
        if (parsedResult.prediction) {
          comment.sentiment = parsedResult.prediction;
        } else {
          comment.sentiment = 'Neutral';
        }
      } catch (error) {
        // Fallback to string handling if parsing fails
        const sentimentStr = String(sentiment).trim();
        if (sentimentStr.includes('Positive')) {
          comment.sentiment = 'Positive';
        } else if (sentimentStr.includes('Negative')) {
          comment.sentiment = 'Negative';
        } else {
          comment.sentiment = 'Neutral';
        }
      }
      return comment;
    }),
    catchError(error => {
      console.error('Error analyzing comment sentiment:', error);
      return of(comment); // Return original comment in case of error
    })
  );
}// Process all comments and their replies with sentiment analysis
processCommentsWithSentiment(comments: ForumComment[]): void {
  if (!comments || comments.length === 0) return;

  // Process each comment
  comments.forEach(comment => {
    // Analyze the main comment
    this.analyzeSentiment(comment).subscribe(updatedComment => {
      comment.sentiment = updatedComment.sentiment;

      // Process replies if they exist
      if (comment.replies && comment.replies.length > 0) {
        this.processCommentsWithSentiment(comment.replies);
      }
    });
  });
}
          }
