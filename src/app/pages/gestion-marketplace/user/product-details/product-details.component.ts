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
import { Panier } from '../../models/Panier';
import { LigneCommande } from '../../models/LigneCommande';
import { UpdateQuantiteDTO } from '../../models/DTO/UpdateQuantiteDTO';
import { LignedecommandeService } from '../../services/lignedecommande.service';
import { CartUpdateService } from '../../services/cart-update.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReviewService } from '../../services/review/review.service';
import { Review } from '../../models/Review';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html'
})

// Product Detail Component
export class ProductDetailsComponent implements OnInit {

  // bread crumb items
  breadCrumbItems!: Array<{}>;
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

  // Add these properties to your component class
  isHovered: boolean = false;
  hoveredIndex: number = -1;

  // Add these properties to your component class
  reviewForm: FormGroup = new FormGroup({});
  productReviews: Review[] = [];
  loadingReviews: boolean = false;
  showReviewForm: boolean = false;
  reviewFormSubmitted: boolean = false;
  isSubmittingReview: boolean = false;
  averageRating: number = 0;

  // Add these properties to your component
  isDeletingReview = false;
  deletingReviewId: number | null = null;

  // Add these properties to your component
  reviewToDeleteId: number | null = null;

  // Add this ViewChild reference
  @ViewChild('deleteConfirmModal', { static: false }) deleteConfirmModal?: ModalDirective;

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
    private cdr: ChangeDetectorRef,
    private ligneCommandeService: LignedecommandeService,
    private cartUpdateService: CartUpdateService,
    private cartService: CartUpdateService, // Add this if not already present
    private reviewService: ReviewService
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

    // Initialize the review form
    this.reviewForm = this.formBuilder.group({
      rating: [null, Validators.required],
      reviewText: ['', Validators.required]
    });

    // Load reviews when product details are loaded
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      this.loadProductDetails(productId);
      this.loadProductReviews(productId);
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
    if (!this.currentUser || !this.currentUser.id) {
      this.toastr.warning('Please log in to add products to cart', 'Authentication Required');
      this.router.navigate(['/auth/login']);
      return;
    }

    // Check if product exists
    if (!this.productdetail || !this.productdetail.idProduit) {
      this.toastr.error('Product details not available', 'Error');
      return;
    }

    // Check if product is in stock
    if (this.productdetail.stockProduit <= 0) {
      this.toastr.error('This product is out of stock', 'Error');
      return;
    }

    // Check if requested quantity is valid
    if (this.quantity <= 0) {
      this.toastr.error('Please select a valid quantity', 'Error');
      return;
    }

    // Check if requested quantity exceeds available stock
    if (this.quantity > this.productdetail.stockProduit) {
      this.toastr.warning(
        `Only ${this.productdetail.stockProduit} units available. Your quantity has been adjusted.`,
        'Limited Stock'
      );
      this.quantity = this.productdetail.stockProduit;
    }

    this.isAddingToCart = true;

    // Get all paniers for the user and filter for non-validated ones
    this.panierService.getAllPaniersByUserId(this.currentUser.id).subscribe({
      next: (paniers) => {
        // Filter for paniers that are not validated (validated=false or undefined)
        const activePaniers = paniers.filter(p => p.validated !== true);

        if (activePaniers.length === 0) {
          // Create a new panier if no active panier exists
          console.log('No active panier found, creating a new one');
          const newPanier = new Panier();
          newPanier.userId = this.currentUser.id;
          newPanier.total = 0; // Initialize total to 0
          newPanier.validated = false;

          this.panierService.addPanier(newPanier).subscribe({
            next: (createdPanier) => {
              console.log('New panier created:', createdPanier);
              this.addProductToCart(this.productdetail!, createdPanier);
            },
            error: (err) => {
              console.error('Error creating panier:', err);
              this.toastr.error('Failed to create shopping cart', 'Error');
              this.isAddingToCart = false;
            }
          });
        } else {
          // Use the first active panier
          const panier = activePaniers[0];
          console.log('Using existing panier:', panier);

          // Check if product already exists in the panier
          this.checkAndUpdateExistingProduct(this.productdetail!, panier);
        }
      },
      error: (err) => {
        console.error('Error getting user paniers:', err);
        this.toastr.error('Failed to retrieve your cart information', 'Error');
        this.isAddingToCart = false;
      }
    });
  }

  private checkAndUpdateExistingProduct(product: any, panier: Panier): void {
    // Get all ligne commandes for this panier
    this.ligneCommandeService.getLigneCommandesByPanierId(panier.idPanier!).subscribe({
      next: (lignes) => {
        // Find if this product already exists in the cart (and not in a commande)
        const existingLine = lignes.find(
          ligne => ligne.idProduit === product.idProduit && ligne.commande === null
        );

        if (existingLine && existingLine.idLigneCommande && panier.idPanier) {
          // Product exists in cart, update quantity
          console.log('Product already in cart, updating quantity');

          // Calculate the new total for this line
          const newQuantity = existingLine.quantite + this.quantity;
          const lineTotal = newQuantity * existingLine.prix;

          const updateDto: UpdateQuantiteDTO = {
            idLigneCommande: existingLine.idLigneCommande,
            quantite: newQuantity,
            idPanier: panier.idPanier,
            total: lineTotal
          };

          this.ligneCommandeService.updateLigneCommande(updateDto).subscribe({
            next: (response) => {
              console.log('Product quantity updated successfully', response);
              this.toastr.success(
                `Added ${this.quantity} ${product.nomProduit} to your cart`,
                'Success'
              );
              this.isAddingToCart = false;
              this.loadCartCount();
              this.cartUpdateService.triggerCartUpdate(); // Ajouter cette ligne
            },
            error: (err) => {
              console.error('Error updating product quantity:', err);
              this.toastr.error('Failed to update product quantity', 'Error');
              this.isAddingToCart = false;
            }
          });
        } else {
          // Product not in cart, add as new item
          console.log('Product not in cart, adding as new item');
          this.addProductToCart(product, panier);
        }
      },
      error: (err) => {
        console.error('Error checking cart items:', err);
        this.toastr.error('Failed to check cart items', 'Error');
        this.isAddingToCart = false;
      }
    });
  }

  private addProductToCart(product: any, panier: Panier): void {
    const newLine = {
      quantite: this.quantity,
      prix: product.prixProduit,
      idProduit: product.idProduit,
      produit: product,
      panier: panier
    };

    this.ligneCommandeService.addLigneCommande(newLine).subscribe({
      next: (response) => {
        console.log('Product added to cart successfully', response);
        this.toastr.success(
          `Added ${this.quantity} ${product.nomProduit} to your cart`,
          'Success'
        );
        this.isAddingToCart = false;
        this.loadCartCount();
        this.cartUpdateService.triggerCartUpdate(); // Ajouter cette ligne
      },
      error: (err) => {
        console.error('Error adding product to cart:', err);
        this.toastr.error('Failed to add product to cart', 'Error');
        this.isAddingToCart = false;
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

  loadCartCount(): void {
    if (this.currentUser && this.currentUser.id) {
      this.panierService.getAllPaniersByUserId(this.currentUser.id).subscribe({
        next: (paniers: Panier[]) => {
          const activePaniers = paniers.filter(p => !p.validated);

          if (activePaniers.length > 0 && activePaniers[0].idPanier) {
            this.ligneCommandeService.getLigneCommandesByPanierId(activePaniers[0].idPanier).subscribe({
              next: (lignes: LigneCommande[]) => {
                const activeItems = lignes.filter(ligne => ligne.commande === null);
                this.cartUpdateService.updateCartCount(activeItems.length);
                this.cartUpdateService.triggerCartUpdate();
              },
              error: (err: any) => {
                console.error('Error loading cart items:', err);
                this.cartUpdateService.updateCartCount(0);
              }
            });
          } else {
            this.cartUpdateService.updateCartCount(0);
          }
        },
        error: (err: any) => {
          console.error('Error loading cart:', err);
          this.cartUpdateService.updateCartCount(0);
        }
      });
    } else {
      this.cartUpdateService.updateCartCount(0);
    }
  }

  // Add these methods to your class
  loadProductReviews(productId: number): void {
    this.loadingReviews = true;

    // Use the product-specific endpoint we added
    this.reviewService.getReviewsByProductId(productId).subscribe({
      next: (reviews) => {
        console.log('Reviews for product', productId, ':', reviews);
        this.productReviews = reviews;

        // Calculate average rating
        if (this.productReviews.length > 0) {
          const totalRating = this.productReviews.reduce((sum, review) =>
            sum + (review.rating || 0), 0);
          this.averageRating = totalRating / this.productReviews.length;
        } else {
          this.averageRating = 0;
        }

        this.loadingReviews = false;
      },
      error: (error) => {
        console.error('Error loading reviews for product:', error);
        this.loadingReviews = false;
      }
    });
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  submitReview(): void {
    this.reviewFormSubmitted = true;

    if (this.reviewForm.invalid) {
      return;
    }

    if (!this.currentUser || !this.productdetail) {
      this.toastr.error('You must be logged in to submit a review', 'Error');
      return;
    }

    if (!this.productdetail.idProduit) {
      this.toastr.error('Cannot submit review for this product', 'Error');
      return;
    }

    this.isSubmittingReview = true;

    // Créer un objet review avec le produit correctement formaté
    const newReview: Review = {
      rating: this.reviewForm.get('rating')?.value,
      reviewText: this.reviewForm.get('reviewText')?.value,
      userId: this.currentUser.id,
      userName: this.currentUser.nom + ' ' + this.currentUser.prenom,
      dateCreation: new Date(),
      image: this.currentUser.image,
      dateDeNaissance: this.currentUser.dateNaissance,
      // C'est ici la clé - inclure un objet product avec seulement l'ID
      product: {
        idProduit: this.productdetail.idProduit
      }
    };

    console.log('Submitting review:', newReview);

    this.reviewService.addReview(newReview).subscribe({
      next: (response) => {
        this.toastr.success('Your review has been submitted', 'Success');
        this.isSubmittingReview = false;
        this.showReviewForm = false;
        this.reviewForm.reset();
        this.reviewFormSubmitted = false;

        // Reload reviews to show the new one
        if (this.productdetail && this.productdetail.idProduit) {
          this.loadProductReviews(this.productdetail.idProduit);
        }
      },
      error: (error) => {
        console.error('Error submitting review:', error);
        this.toastr.error('There was an error submitting your review', 'Error');
        this.isSubmittingReview = false;
      }
    });
  }

  // Check if the review belongs to the current user and has a valid ID
  isUserReview(review: any): boolean {
    return this.currentUser &&
           review.userId === this.currentUser.id &&
           review.idReview !== undefined;
  }

  // Delete review method
  deleteReview(reviewId: number | undefined): void {
    // Check if reviewId is defined
    if (!reviewId) {
      this.toastr.error('Cannot delete review: Invalid review ID');
      return;
    }

    // Show confirmation dialog
    if (confirm('Are you sure you want to delete this review?')) {
      this.isDeletingReview = true;
      this.deletingReviewId = reviewId;

      // Call your service to delete the review
      this.reviewService.deleteReview(reviewId).subscribe({
        next: () => {
          // Remove the review from the list on success
          this.productReviews = this.productReviews.filter(r => r.idReview !== reviewId);

          // Recalculate average rating if needed
          this.calculateAverageRating();

          // Show success message
          this.toastr.success('Your review has been deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting review:', error);
          this.toastr.error('Failed to delete review. Please try again later.');
        },
        complete: () => {
          this.isDeletingReview = false;
          this.deletingReviewId = null;
        }
      });
    }
  }

  // Recalculate average rating after deletion
  calculateAverageRating(): void {
    if (this.productReviews.length === 0) {
      this.averageRating = 0;
      return;
    }

    const sum = this.productReviews.reduce((total, review) => total + (review.rating || 0), 0);
    this.averageRating = sum / this.productReviews.length;
  }

  // Open the delete confirmation modal
  openDeleteModal(reviewId: number) {
    this.reviewToDeleteId = reviewId;
    if (this.deleteConfirmModal) {
      this.deleteConfirmModal.show();
    }
  }

  // Confirm delete action from modal
  confirmDeleteReview() {
    if (this.reviewToDeleteId) {
      this.isDeletingReview = true;
      this.deletingReviewId = this.reviewToDeleteId;

      // Call your service to delete the review
      this.reviewService.deleteReview(this.reviewToDeleteId).subscribe({
        next: () => {
          // Remove the review from the list on success
          this.productReviews = this.productReviews.filter(r => r.idReview !== this.reviewToDeleteId);

          // Recalculate average rating if needed
          this.calculateAverageRating();

          // Show success message
          this.toastr.success('Your review has been deleted successfully');

          // Hide the modal using ModalDirective
          if (this.deleteConfirmModal) {
            this.deleteConfirmModal.hide();
          }
        },
        error: (error) => {
          console.error('Error deleting review:', error);
          this.toastr.error('Failed to delete review. Please try again later.');
        },
        complete: () => {
          this.isDeletingReview = false;
          this.deletingReviewId = null;
          this.reviewToDeleteId = null;
        }
      });
    }
  }
}
