import {Component, OnInit, ViewChild} from '@angular/core';
import {AccordionModule} from "ngx-bootstrap/accordion";
import {ModalDirective, ModalModule} from "ngx-bootstrap/modal";
import {NgxSliderModule} from "ngx-slider-v2";
import {PageChangedEvent, PaginationModule} from "ngx-bootstrap/pagination";
import {RouterLink} from "@angular/router";
import {SharedModule} from "../../../../shared/shared.module";
import {UiSwitchModule} from "ngx-ui-switch";
import {Observable} from "rxjs";
import {productgridModel} from "../../../ecommerce/products-grid/products-grid.model";
import {Options} from "@angular-slider/ngx-slider";
import {Store} from "@ngrx/store";
import {deleteproductsList, fetchproductsList} from "../../../../store/Product/product.action";
import {selectData} from "../../../../store/Product/product.selector";
import {PostService} from "../../services/post.service";
import {Post} from "../../models/post.model";
import {DatePipe} from "@angular/common";
import {UserServiceService} from "../../../../account/auth/services/user-service.service";
import { FormsModule } from '@angular/forms'; // Add this import

import { switchMap, map, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [
    AccordionModule,
    ModalModule,
    NgxSliderModule,
    PaginationModule,
    RouterLink,
    SharedModule,
    UiSwitchModule,
    DatePipe,
    FormsModule  // Add FormsModule here

  ],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.scss'
})
export class PostsComponent implements OnInit {

  endItem: any
  // bread crumb items
  breadCrumbItems!: Array<{}>;
  products!: any;
  allproducts!: any;
  productlist: any
  // Table data
  productList!: Observable<productgridModel[]>;
  searchResults: any;
  // Price Slider
  pricevalue: number = 100;
  minVal: number = 100;
  maxVal: number = 500;
  deleteId: any;
  priceoption: Options = {
    floor: 0,
    ceil: 800,
    translate: (value: number): string => {
      return '$' + value;
    },
  };

  searchTerm: string = '';
  filteredPosts: Post[] = [];
  sortOption: string = 'All';
  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;

  constructor(public store: Store ,   private postService: PostService,  private userService: UserServiceService // Add this service

  ) {}
  posts: Post[] = [];
  allPosts: Post[] = [];


  // Add this method to your component class
  isVideo(url: string | undefined): boolean {
    if (!url) return false;

    // Check by file extension
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const urlLower = url.toLowerCase();

    // Check if URL has one of the video extensions
    return videoExtensions.some(ext => urlLower.endsWith(ext)) ||
      // Also check if mediaType is available in your data model
      (url.includes('video/') || url.includes('youtube') || url.includes('vimeo'));
  }
  /**
   * Range Slider Wise Data Filter
   */
  valueChange(value: number, boundary: boolean): void {
    if (boundary) {
      this.minVal = value;
    } else {
      this.maxVal = value;
      // this.products = productList.filter((product: any) => {
      //   return product.price <= value && product.price >= this;
      // }, this.minVal);
    }
  }

  // Remove Product
  removeItem(id: any) {
    this.deleteId = id;
    this.deleteRecordModal?.show()
  }



  currentPage: number = 1;
  itemsPerPage: number = 9;

  // After loading posts from your API
ngOnInit() {
  this.loadPosts();

  this.filteredPosts = this.posts; // Initialize filtered posts with all posts

}


loadPosts(): void {
  this.postService.getPosts().pipe(
    switchMap(posts => {
      this.allPosts = posts;

      if (posts.length === 0) {
        return of([]); // Return empty observable if no posts
      }

      // Create an array of user data requests for each post
      const userRequests = posts.map(post =>
        this.userService.getUserById(post.userId!).pipe(
          map(user => ({
            post,
            username: user.nom + ' ' + user.prenom,
            userImage: user.image || 'assets/images/users/avatar-1.jpg' // Default image if none
          }))
        )
      );

      // Execute all requests in parallel
      return forkJoin(userRequests);
    })
  ).subscribe({
    next: (results) => {
      // Update each post with user information
      results.forEach(result => {
        const index = this.allPosts.findIndex(p => p.id === result.post.id);
        if (index !== -1) {
          this.allPosts[index].username = result.username;
          this.allPosts[index].userProfilePic = result.userImage;
        }
      });

      this.updateDisplayedPosts();
      this.filteredPosts = this.posts; // Initialize filtered posts with all posts
    },
    error: (error) => {
      console.error('Error loading posts:', error);
    }
  });
}



  searchPosts(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPosts = this.allPosts; // Search against ALL posts
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredPosts = this.allPosts.filter(post => // Filter all posts, not just current page
        post.content?.toLowerCase().includes(term) ||
        post.username?.toLowerCase().includes(term)
      );
    }

    // Reset to first page after search
    this.currentPage = 1;

    // Update displayed posts based on filtered results
    this.updateDisplayedPostsAfterFilter();
  }



  sortPosts(): void {
    switch (this.sortOption) {
      case 'Newest':
        this.filteredPosts = [...this.allPosts].sort((a, b) => // Sort all posts
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
      case 'Best Rated':
        this.filteredPosts = [...this.allPosts].sort((a, b) => // Sort all posts
          (b.reactions?.length || 0) - (a.reactions?.length || 0)
        );
        break;
      default:
        this.filteredPosts = this.allPosts;
    }

    // Reset to first page after sorting
    this.currentPage = 1;

    // Update displayed posts based on filtered results
    this.updateDisplayedPostsAfterFilter();
  }

  // Add this new method to handle pagination of filtered results
  updateDisplayedPostsAfterFilter() {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    const endItem = this.currentPage * this.itemsPerPage;
    this.posts = this.filteredPosts.slice(startItem, endItem);
  }

  // Update this method to handle pagination
  pageChanged(event: any) {
    this.currentPage = event.page;
    this.updateDisplayedPostsAfterFilter();
  }




  // Update this method to handle pagination

  // Add this method to update displayed posts
  updateDisplayedPosts() {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    const endItem = this.currentPage * this.itemsPerPage;
    this.posts = this.allPosts.slice(startItem, endItem);
  }
  // Add these methods to your component class
  resetFilters() {
    this.searchTerm = '';
    this.sortOption = 'All';
    this.currentPage = 1;
    this.loadPosts();
  }

  getCommentCount(): number {
    return this.allPosts?.reduce((sum, post) => sum + (post.comments?.length || 0), 0) || 0;
  }

  getReactionCount(): number {
    return this.allPosts?.reduce((sum, post) => sum + (post.reactions?.length || 0), 0) || 0;
  }

  // Add this to your class imports at the top
  Math = Math;

  // Add this to handle actual deletion
  confirmDelete() {
    if (this.deleteId) {
      // Call your delete service
      this.postService.deletePost(this.deleteId).subscribe({
        next: () => {
          // Remove post from arrays
          this.allPosts = this.allPosts.filter(p => p.id !== this.deleteId);
          this.filteredPosts = this.filteredPosts.filter(p => p.id !== this.deleteId);
          this.updateDisplayedPostsAfterFilter();
          this.deleteRecordModal?.hide();
        },
        error: (error) => {
          console.error('Failed to delete post:', error);
        }
      });
    }
  }

}
