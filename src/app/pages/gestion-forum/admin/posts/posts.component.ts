import {Component, ViewChild} from '@angular/core';
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
    DatePipe
  ],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.scss'
})
export class PostsComponent {

  endItem: any
  // bread crumb items
  breadCrumbItems!: Array<{}>;
  products!: any;
  allproducts!: any;
  productlist: any
  // Table data
  productList!: Observable<productgridModel[]>;
  searchResults: any;
  searchTerm: any;
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

  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;

  constructor(public store: Store ,   private postService: PostService
  ) {}
  posts: Post[] = [];
  allPosts: Post[] = [];
  ngOnInit(): void {
    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: 'Ecommerce', active: true },
      { label: 'Products Grid', active: true }
    ];

    setTimeout(() => {
      this.postService.getPosts().subscribe({
        next: (data) => {
          this.posts = data;
          this.allPosts = data;
          this.posts = this.allPosts.slice(0, 12);
        },
        error: (error) => {
          console.error('Error fetching posts:', error);
        },
        complete: () => {
          document.getElementById('elmLoader')?.classList.add('d-none');
        }
      });
    }, 1000);
  }


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

  confirmDelete() {
    this.store.dispatch(deleteproductsList({ id: this.deleteId.toString() }));
    this.deleteRecordModal?.hide()
  }

  // Category Filter
  categoryFilter(category: any) {
    this.products = this.productlist.filter((product: any) => {
      return product.category == category
    });
    this.products = this.products.slice(0, 10);
    if (this.products.length == 0) {
      (document.getElementById('search-result-elem') as HTMLElement).style.display = 'block'
    } else {
      (document.getElementById('search-result-elem') as HTMLElement).style.display = 'none'
    }
  }

  discountRates: number[] = [];

  // Discount Filter
  changeDiscount(e: any) {
    if (e.target.checked) {
      this.discountRates.push(e.target.defaultValue)

      this.products = this.productlist.filter((product: any) => {
        return product.ratings > e.target.defaultValue;
      });
    } else {
      for (var i = 0; i < this.discountRates.length; i++) {
        if (this.discountRates[i] === e.target.defaultValue) {
          this.discountRates.splice(i, 1)
        }
      }
    }
  }

  // Search Data
  performSearch(): void {
    this.searchResults = this.productlist.filter((item: any) => {
      return item.category.toLowerCase().includes(this.searchTerm.toLowerCase())
        || item.title.toLowerCase().includes(this.searchTerm.toLowerCase())
    })
    this.products = this.searchResults.slice(0, 10);
    if (this.searchResults.length == 0) {
      (document.getElementById('search-result-elem') as HTMLElement).style.display = 'block'
    } else {
      (document.getElementById('search-result-elem') as HTMLElement).style.display = 'none'
    }
  }

  // Page changed
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    this.endItem = event.page * event.itemsPerPage;
    this.products = this.productlist.slice(startItem, this.endItem);
  }

}
