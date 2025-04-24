import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup, FormBuilder, Validators } from '@angular/forms';
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { NgxDropzoneModule } from 'ngx-dropzone';
import { PostService } from '../../services/post.service';
import { Post } from '../../models/post.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-post',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerComponent, ReactiveFormsModule, NgxDropzoneModule],
  templateUrl: './add-post.component.html',
  styleUrls: ['./add-post.component.scss']
})
export class AddPostComponent implements OnInit {
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

  constructor(
    private postService: PostService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.formData = this.formBuilder.group({
      message: ['', Validators.required]
    });
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
}
