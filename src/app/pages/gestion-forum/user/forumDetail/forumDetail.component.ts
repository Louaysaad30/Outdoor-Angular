// src/app/pages/gestion-forum/user/forumDetail/forumDetail.component.ts
  import { Component, Input, OnInit } from '@angular/core';
  import { Post } from '../../models/post.model';
  import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
  import { CommonModule } from "@angular/common";
  import { FormsModule, ReactiveFormsModule } from "@angular/forms";
  import { RouterLink } from "@angular/router";
  import { SharedModule } from "../../../../shared/shared.module";
  import { SimplebarAngularModule } from "simplebar-angular";
  import { TooltipModule } from "ngx-bootstrap/tooltip";
  import { NgxDropzoneModule } from "ngx-dropzone";
  import { PickerComponent } from "@ctrl/ngx-emoji-mart";

  @Component({
    selector: 'app-forum-detail',
    templateUrl: './forumDetail.component.html',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, SharedModule, SimplebarAngularModule, TooltipModule, NgxDropzoneModule, PickerComponent, ReactiveFormsModule],
    styleUrls: ['./forumDetail.component.scss']
  })
  export class ForumDetailComponent implements OnInit {
    @Input() post!: Post;

    constructor(public activeModal: NgbActiveModal) {}

    ngOnInit(): void {
      // Ensure post data is available
      if (!this.post) {
        console.error('No post data provided to modal');
        this.activeModal.dismiss('No post data');
      }
    }

    isImage(url: string): boolean {
      if (!url) return false;
      return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) !== null;
    }

    isVideo(url: string): boolean {
      if (!url) return false;
      return url.match(/\.(mp4|webm|ogg|mov|avi)$/i) !== null;
    }

    close(): void {
      this.activeModal.close();
    }
  }
