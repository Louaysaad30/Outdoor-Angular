import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, UntypedFormGroup} from "@angular/forms";
import {RouterLink} from "@angular/router";
import {SharedModule} from "../../../../shared/shared.module";
import {SimplebarAngularModule} from "simplebar-angular";
import {TooltipModule} from "ngx-bootstrap/tooltip";
import {NgxDropzoneModule} from "ngx-dropzone";
import {PickerComponent} from "@ctrl/ngx-emoji-mart";

@Component({
  selector: 'app-forum-post',
  standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, SharedModule, SimplebarAngularModule, TooltipModule, NgxDropzoneModule, PickerComponent],
  templateUrl: './forum-post.component.html',
  styleUrl: './forum-post.component.scss'
})
export class ForumPostComponent {

  // bread crumb items
  breadCrumbItems!: Array<{}>;

  ngOnInit(): void {
    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: 'Support Tickets', active: true },
      { label: 'Overview', active: true }
    ];
  }
  showFullDescription = false;


  //add post
  profileImage: string = 'assets/profile-pic.png';
  isModalOpen: boolean = false;
  postContent: string = '';

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
    if (this.postContent.trim() || this.uploadedFiles.length > 0) {
      console.log('Post Published:', {
        text: this.postContent,
        files: this.uploadedFiles
      });
      this.closePostModal();
    }
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
  //end post
}
