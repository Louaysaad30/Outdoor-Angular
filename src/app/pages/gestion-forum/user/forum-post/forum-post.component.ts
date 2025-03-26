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

@Component({
  selector: 'app-forum-post',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SharedModule, SimplebarAngularModule, TooltipModule, NgxDropzoneModule, PickerComponent, ReactiveFormsModule],
  templateUrl: './forum-post.component.html',
  styleUrl: './forum-post.component.scss'
})
export class ForumPostComponent {



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

  constructor(
    private postService: PostService,
    private router: Router,
    private formBuilder: FormBuilder,
  private commentService: CommentService

) {}
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

  loadPosts() {
    this.loading = true;
    this.postService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
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
  addComment(postId: string): void {
    if (!this.newComment.trim()) return;

    this.commentService.addComment(postId, this.newComment, 10).subscribe({
      next: (comment: ForumComment) => {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          if (!post.comments) {
            post.comments = [];
          }
          post.comments.push(comment);
        }
        this.newComment = '';
      },
      error: (error) => {
        console.error('Error adding comment:', error);
      }
    });
  }


}
