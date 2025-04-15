import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { SlickCarouselComponent } from 'ngx-slick-carousel';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { HttpClient } from '@angular/common/http';
import { DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { PanierService } from '../../services/panier/panier.service';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthServiceService } from 'src/app/account/auth/services/auth-service.service';
import { FavorisService } from '../../services/favoris.service';
import { Favoris } from '../../models/Favoris';

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
  currentUser: any ;


  // Image gallery handling
  currentImageIndex: number = 0;
  imageGallery: string[] = [];
  baseImageUrl: string = 'http://localhost:9093/uploads/'; // Adjust this to your API URL

  files: File[] = [];

  @ViewChild('slickModal') slickModal!: SlickCarouselComponent;

  isAddingToCart: boolean = false;
  userId: number | null = null;

  // Add these properties
  isProductFavorited: boolean = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private panierService: PanierService,
    private authService: AuthServiceService,
    private toastr: ToastrService,
    private favorisService: FavorisService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Récupérer l'utilisateur actuel
    this.currentUser = JSON.parse(localStorage.getItem('user')!);


    // Charger les détails du produit
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      this.loadProductDetails(productId);

      // Vérifier explicitement si le produit est dans les favoris après un court délai
      // pour s'assurer que currentUser est bien chargé
      setTimeout(() => {
        if (this.currentUser && this.currentUser.id) {
          console.log('Checking favorites for product:', productId);
          this.checkIfFavorited(productId);
        }
      }, 100);
    });
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
        console.log("Product loaded:", product);
        console.log("Main image URL:", product.imageProduit);
        if (product.imageGallery) {
          console.log("Gallery images:", product.imageGallery);
        }

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

    // Add main product image first if available (directly using Cloudinary URL)
    if (this.productdetail.imageProduit) {
      // Si l'URL est déjà complète (commence par http), l'utiliser directement
      if (this.productdetail.imageProduit.startsWith('http')) {
        this.imageGallery.push(this.productdetail.imageProduit);
      } else {
        // Sinon, utiliser l'URL comme identifiant Cloudinary
        this.imageGallery.push(this.productdetail.imageProduit);
      }
      console.log("Added main image:", this.imageGallery[this.imageGallery.length - 1]);
    }

    // Add gallery images if available
    if (this.productdetail.imageGallery && this.productdetail.imageGallery.length > 0) {
      this.productdetail.imageGallery.forEach(img => {
        if (img.imageUrl) {
          // Même logique que pour l'image principale
          if (img.imageUrl.startsWith('http')) {
            this.imageGallery.push(img.imageUrl);
          } else {
            this.imageGallery.push(img.imageUrl);
          }
          console.log("Added gallery image:", this.imageGallery[this.imageGallery.length - 1]);
        }
      });
    }

    // Si aucune image n'est disponible, ajouter une image par défaut
    if (this.imageGallery.length === 0) {
      this.imageGallery.push('assets/images/placeholder-product.jpg');
      console.log("No images found, using placeholder");
    }

    console.log("Image gallery initialized with", this.imageGallery.length, "images");
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

  /**
   * Handle image loading errors
   */
  handleImageError(event: any): void {
    // Remplacer l'image non chargée par une image par défaut
    event.target.src = 'assets/images/placeholder-product.jpg';
    console.log('Image failed to load, replaced with placeholder');
  }

  /**
   * Augmenter la quantité
   */
  incrementQuantity(): void {
    if (this.productdetail && this.quantity < this.productdetail.stockProduit) {
      this.quantity++;
    }
  }

  /**
   * Diminuer la quantité
   */
  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  /**
   * Mettre à jour la quantité directement depuis l'input
   */
  updateQuantity(event: any): void {
    const value = parseInt(event.target.value);
    if (!isNaN(value)) {
      if (value < 1) {
        this.quantity = 1;
      } else if (this.productdetail && value > this.productdetail.stockProduit) {
        this.quantity = this.productdetail.stockProduit;
      } else {
        this.quantity = value;
      }
    } else {
      this.quantity = 1;
    }
  }

  // Ajoutez cette propriété à votre classe
  quantity: number = 1;

  addToCart() {
    if (!this.currentUser.id) {
      this.toastr.warning('Please log in to add products to cart', 'Authentication Required');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (this.isAddingToCart) {
      return; // Prevent multiple clicks
    }

    this.isAddingToCart = true;

    this.panierService.ajouterProduitAuPanier(
      this.currentUser.id,
      this.productdetail?.idProduit ?? 0,
      this.quantity
    )
    .pipe(
      catchError(error => {
        console.error('Error adding to cart:', error);
        this.toastr.error('Failed to add product to cart', 'Error');
        return of(null);
      }),
      finalize(() => {
        this.isAddingToCart = false;
      })
    )
    .subscribe(response => {
      if (response) {
        this.toastr.success(`${this.quantity} ${this.productdetail?.nomProduit} added to cart`, 'Success');
      }
    });
  }

  // Add these methods to handle favorites functionality
  checkIfFavorited(productId: number): void {
    console.log('Checking if product is favorited, productId:', productId);

    if (!this.currentUser || !this.currentUser.id) {
      console.log('User not logged in, cannot check favorites');
      this.isProductFavorited = false;
      return;
    }

    this.favorisService.retrieveAllFavoris().subscribe({
      next: (favoris) => {
        console.log('All favorites received:', favoris);

        // Vérifier explicitement les correspondances
        const userFavorites = favoris.filter(f => f.idUser === this.currentUser.id);
        console.log('User favorites:', userFavorites);

        const isFavorited = userFavorites.some(f => f.idProduit === productId);
        console.log(`Product ${productId} is favorited:`, isFavorited);

        // Mettre à jour l'état et forcer le rafraîchissement de la vue
        this.isProductFavorited = isFavorited;

        // Détection de changement pour s'assurer que l'UI est mise à jour
        if (this.cdr) {
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error checking favorite status:', error);
        this.isProductFavorited = false;
      }
    });
  }

  toggleFavorite(): void {
    if (!this.currentUser || !this.currentUser.id) {
      console.error('User ID is not set. Cannot manage favorites.');
      alert('Please log in to manage your favorites.');
      return;
    }

    if (!this.productdetail || !this.productdetail.idProduit) {
      console.error('Invalid product');
      return;
    }

    if (this.isProductFavorited) {
      // Remove from favorites
      this.removeFavorite();
    } else {
      // Add to favorites
      this.addToFavorites();
    }
  }

  addToFavorites(): void {
    const favoris = new Favoris();
    favoris.idUser = this.currentUser.id;

    if (this.productdetail && this.productdetail.idProduit) {
      favoris.idProduit = this.productdetail.idProduit;
    } else {
      console.error('Product details are not available or invalid.');
      return;
    }

    console.log('Adding to favorites - User ID:', this.currentUser.id);
    console.log('Adding to favorites - Product ID:', this.productdetail.idProduit);

    this.favorisService.addFavoris(favoris).subscribe({
      next: (response) => {
        console.log('Product added to favorites successfully:', response);
        // Mettre à jour immédiatement l'état pour l'interface
        this.isProductFavorited = true;

      },
      error: (error) => {
        console.error('Error adding product to favorites:', error);
        alert('Failed to add product to favorites. Please try again.');
      }
    });
  }

  removeFavorite(): void {
    if (!this.currentUser || !this.currentUser.id || !this.productdetail || !this.productdetail.idProduit) {
      return;
    }

    console.log('Removing from favorites - User ID:', this.currentUser.id);
    console.log('Removing from favorites - Product ID:', this.productdetail.idProduit);

    // First, find the favorite ID by querying all favorites
    this.favorisService.retrieveAllFavoris().subscribe({
      next: (favoris) => {
        console.log('All favorites for removal:', favoris);

        // Find the favorite entry for this product and user
        const favorite = favoris.find(f =>
          f.idUser === this.currentUser.id &&
          f.idProduit === (this.productdetail?.idProduit ?? 0)
        );

        console.log('Found favorite to remove:', favorite);

        if (favorite && favorite.idFavoris) {
          // Remove the favorite
          this.favorisService.removeFavoris(favorite.idFavoris).subscribe({
            next: () => {
              console.log('Removed from favorites successfully');
              // Mettre à jour immédiatement l'état pour l'interface
              this.isProductFavorited = false;

            },
            error: (err) => {
              console.error('Error removing from favorites:', err);
              alert('Failed to remove from favorites. Please try again.');
            }
          });
        } else {
          console.error('Favorite not found for removal');
          alert('Could not find favorite to remove.');
        }
      },
      error: (err) => {
        console.error('Error finding favorite to remove:', err);
      }
    });
  }
}
