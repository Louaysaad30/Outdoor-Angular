import { Component, ViewChild, OnInit } from '@angular/core';
import { SlickCarouselComponent } from 'ngx-slick-carousel';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { HttpClient } from '@angular/common/http';
import { DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';


@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html'
})

// Product Detail Component
export class ProductDetailsComponent implements OnInit {

  // bread crumb items
  breadCrumbItems!: Array<{}>;
  reviewForm!: UntypedFormGroup;
  productdetail: Product | null = null;
  submitted: boolean = false;
  deleteId: any;
  loading: boolean = true;
  error: string | null = null;
  productId: number = 0;

  // Image gallery handling
  currentImageIndex: number = 0;
  imageGallery: string[] = [];
  baseImageUrl: string = 'http://localhost:9093/uploads/'; // Adjust this to your API URL

  files: File[] = [];

  @ViewChild('slickModal') slickModal!: SlickCarouselComponent;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: 'Marketplace' },
      { label: 'Product Details', active: true }
    ];

    // Get the product ID from the route parameters
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.productId = +id; // Convert to number
        this.loadProductDetails(this.productId);
      } else {
        this.error = 'Product ID not found';
        this.loading = false;
      }
    });

    // Initialize your review form here if needed
    this.initReviewForm();
  }

  /**
   * Load product details by ID
   * @param id Product ID
   */
  loadProductDetails(id: number): void {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.productdetail = product;
        // Update breadcrumb with product name
        this.breadCrumbItems = [
          { label: 'Marketplace', link: '/marketplace' },
          { label: product.nomProduit, active: true }
        ];

        // Initialize image gallery
        this.initImageGallery();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading product details:', err);
        this.error = 'Failed to load product details. Please try again later.';
        this.loading = false;
      }
    });
  }

  /**
   * Initialize image gallery from product
   */
  initImageGallery(): void {
    if (!this.productdetail) return;

    this.imageGallery = [];

    // Add main product image first
    if (this.productdetail.imageProduit) {
      this.imageGallery.push(this.baseImageUrl + this.productdetail.imageProduit);
    }

    // Add gallery images if available
    if (this.productdetail.imageGallery && this.productdetail.imageGallery.length > 0) {
      this.productdetail.imageGallery.forEach(img => {
        if (img.imageUrl) {
          this.imageGallery.push(this.baseImageUrl + img.imageUrl);
        }
      });
    }

    // If no images available, add a placeholder
    if (this.imageGallery.length === 0) {
      this.imageGallery.push('assets/images/placeholder-product.jpg');
    }

    // Update the slide config to reflect the current gallery
    this.updateSlideConfig();
  }

  /**
   * Update slide configuration based on gallery size
   */
  updateSlideConfig(): void {
    // Adjust the slidesToShow based on the number of images
    this.slidesConfig = {
      infinite: true,
      slidesToShow: Math.min(4, this.imageGallery.length),
      slidesToScroll: 1,
      autoplay: true,
    };
  }

  /**
   * Initialize the review form
   */
  initReviewForm(): void {
    this.reviewForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      rating: [null, [Validators.required]],
      comment: ['', [Validators.required]],
      img: ['']
    });
  }

  // Existing methods
  slideConfig = {
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
  };

  slidesConfig = {
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
  };

  slickChange(event: any) {
    const swiper = document.querySelectorAll('.swiperlist');
  }

  slidePreview(id: any, event: any) {
    const swiper = document.querySelectorAll('.swiperlist');
    swiper.forEach((el: any) => {
      el.classList.remove('swiper-slide-thumb-active');
    });
    event.target.closest('.swiperlist').classList.add('swiper-slide-thumb-active');
    this.slickModal.slickGoTo(id);
  }

  public dropzoneConfig: DropzoneConfigInterface = {
    clickable: true,
    addRemoveLinks: true,
    previewsContainer: false,
  };

  uploadedFiles: any[] = [];

  // File Upload
  profile: any = [];
  onUploadSuccess(event: any) {
    setTimeout(() => {
      this.uploadedFiles.push(event[0]);
      this.profile.push(event[0].dataURL);
      this.reviewForm.controls['img'].setValue(this.profile);
    }, 0);
  }

  // File Remove
  removeFile(event: any) {
    this.uploadedFiles.splice(this.uploadedFiles.indexOf(event), 1);
  }
}
