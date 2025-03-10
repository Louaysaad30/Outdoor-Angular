import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule} from "@angular/forms";
import {RouterLink} from "@angular/router";
import {SharedModule} from "../../../../shared/shared.module";
import {SimplebarAngularModule} from "simplebar-angular";
import {TooltipModule} from "ngx-bootstrap/tooltip";

@Component({
  selector: 'app-forum-post',
  standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, SharedModule, SimplebarAngularModule, TooltipModule],
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

}
