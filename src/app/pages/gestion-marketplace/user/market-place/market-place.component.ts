import { Component, OnInit, ViewChild } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PCategoryService } from '../../services/pcategory.service';
import { LignedecommandeService } from '../../services/lignedecommande.service';
import { PanierService } from '../../services/panier.service';
import { FavorisService } from '../../services/favoris.service';
import { Favoris } from '../../models/Favoris';
import { Options } from 'ng5-slider';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { ProductImageService } from '../../services/product-image.service';
import { ProductImage } from '../../models/ProductImage';

@Component({
  selector: 'app-market-place',
  templateUrl: './market-place.component.html',
  styles: [`
    .product-image-transition {
      transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .btn-light.rounded-circle {
      background-color: rgba(255, 255, 255, 0.7);
      border: none;
      opacity: 0.7;
      transition: opacity 0.2s ease, background-color 0.2s ease;
    }

    .btn-light.rounded-circle:hover {
      background-color: rgba(255, 255, 255, 0.9);
      opacity: 1;
    }

    .card:hover .product-image-transition {
      transform: scale(1.03);
    }
  `]
})
export class MarketPlaceComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  productlist: any[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  cartItemCount: number = 0;
  currentUser: any;
  // Slider configuration
  minValue: number = 0;
  maxValue: number = 1000;
  sliderOptions: Options = {
    floor: 0,
    ceil: 1000,
    translate: (value: number): string => {
      return '$' + value;
    }
  };

  // Add price range properties with default values
  minPrice: number = 0;
  maxPrice: number = 1000;

  // Modal reference
  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;

  // Track favorited products
  favoritedProducts: Set<number> = new Set();

  constructor(
    private productService: ProductService,
    private categoryService: PCategoryService,
    private ligneCommandeService: LignedecommandeService,
    private panierService: PanierService,
    private router: Router,
    private productImageService: ProductImageService,
    private favorisService: FavorisService,  // Add FavorisService
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);
    console.log('Current user:', this.currentUser);
    this.loadProducts();
    this.loadCategories();
    this.loadCartCount();
    this.loadUserFavorites(); // Add this line
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.productlist = data;
        // Load images for each product
        this.products.forEach(product => {
          this.loadProductImages(product);
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => this.categories = data,
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  loadCartCount(): void {
    console.log('Loading cart for user ID:', this.currentUser.id);
    if (!this.currentUser || !this.currentUser.id) {
      console.error('User ID is not set. Cannot load cart count.');
      return;
    }
    this.panierService.getPanierByUser(this.currentUser.id).subscribe({
      next: (panier) => {
        console.log('Panier received:', panier);

        if (panier && panier.idPanier) {
          this.ligneCommandeService.getLigneCommandesByPanierId(panier.idPanier).subscribe({
            next: (lignes) => {
              console.log('Cart items received:', lignes);

              // Log each product in cart for debugging
              lignes.forEach(ligne => {
                console.log(`Cart item: ${ligne.produit?.nomProduit} (ID: ${ligne.produit?.idProduit}), Quantity: ${ligne.quantite}`);
              });

              // Calculate total items in cart
              this.cartItemCount = lignes.reduce((total, ligne) => {
                return total + (ligne.quantite || 0);
              }, 0);

              console.log('Final cart count:', this.cartItemCount);
            },
            error: (error) => {
              console.error('Error loading ligne commandes:', error);
              this.cartItemCount = 0;
            }
          });
        } else {
          console.log('No valid panier found');
          this.cartItemCount = 0;
        }
      },
      error: (error) => {
        console.error('Error loading panier:', error);
        this.cartItemCount = 0;
      }
    });
  }

  loadUserFavorites(): void {
    if (!this.currentUser || !this.currentUser.id) {
      return;
    }

    this.favorisService.retrieveAllFavoris().subscribe({
      next: (favoris) => {
        // Filter favorites for current user
        const userFavorites = favoris.filter(f => f.idUser === this.currentUser.id);

        // Add to tracked set
        userFavorites.forEach(fav => {
          if (fav.idProduit) {
            this.favoritedProducts.add(fav.idProduit);
          }
        });

        console.log('User favorites loaded:', this.favoritedProducts);
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
      }
    });
  }

  categoryFilter(categoryName: string): void {
    if (categoryName) {
      this.products = this.productlist.filter(item =>
        item.categorie?.nomCategorie === categoryName
      );
    } else {
      this.products = this.productlist;
    }
  }

  performSearch(): void {
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      this.products = this.productlist.filter(item =>
        item.nomProduit.toLowerCase().includes(term) ||
        item.categorie?.nomCategorie.toLowerCase().includes(term)
      );
    } else {
      this.products = [...this.productlist];
    }
  }

  pageChanged(event: any): void {
    // Implement pagination if needed
    console.log('Page changed:', event);
  }

  onPriceChange(): void {
    if (this.minPrice > this.maxPrice) {
      this.minPrice = this.maxPrice;
    }

    this.products = this.productlist.filter(product =>
      product.prixProduit >= this.minPrice &&
      product.prixProduit <= this.maxPrice
    );
  }

  buyProduct(product: any): void {
    console.log('Buying product:', product);
    console.log('User ID:', this.currentUser.id);
    if (!product || !product.idProduit) {
      console.error('Invalid product');
      return;
    }

    // Keep track of which product is being added
    const productBeingAdded = {
      id: product.idProduit,
      name: product.nomProduit
    };

    console.log(`Adding product to cart: ${productBeingAdded.name} (ID: ${productBeingAdded.id})`);

    // Check if userId is set
    if (!this.currentUser || !this.currentUser.id) {
      console.error('User ID is not set. Cannot add product to cart.');
      return;
    }
    this.panierService.ajouterProduitAuPanier(this.currentUser.id, productBeingAdded.id, 1).subscribe({
      next: (response) => {
        console.log(`Successfully added ${productBeingAdded.name} to cart:`, response);
        if (response) {
          // Update cart count
          this.loadCartCount();
          // Show success message
          // Add toastr notification here if you're using it
        }
      },
      error: (error) => {
        console.error(`Error adding ${productBeingAdded.name} to cart:`, error);
        // Show error message
      }
    });
  }

  navigateToCart(): void {
    if (this.cartItemCount > 0) {
      this.router.navigate(['/marketplacefront/user/cart'])
        .then(() => console.log('Navigation successful'))
        .catch(error => {
          console.error('Navigation error:', error);
          // Only use fallback if needed
          if (error.toString().includes('Navigation canceled')) {
            window.location.href = '/marketplacefront/user/cart';
          }
        });
    } else {
      console.log('Cart is empty');
    }
  }

  loadProductImages(product: any): void {
    // Set default image index
    product.currentImageIndex = 0;

    // First add main image to gallery
    product.imageGallery = [{
      idImage: -1, // Use negative to indicate it's not from DB
      imageUrl: product.imageProduit,
      displayOrder: 0
    }];

    // Then load other images from API
    this.productImageService.getImagesByProductId(product.idProduit).subscribe({
      next: (images) => {
        // Only add images that aren't already the main image
        const additionalImages = images.filter(img =>
          img.imageUrl !== product.imageProduit
        );

        if (additionalImages.length > 0) {
          // Combine main image with additional images
          product.imageGallery = [...product.imageGallery, ...additionalImages];
        }
      },
      error: (error) => {
        console.error('Error loading product images for product ' + product.idProduit, error);
      }
    });
  }

  navigateProductImage(product: any, direction: 'prev' | 'next', event: Event): void {
    // Prevent the click from triggering parent elements
    event.stopPropagation();

    if (!product.imageGallery || product.imageGallery.length <= 1) {
      return; // No navigation needed for single image
    }

    const totalImages = product.imageGallery.length;

    if (direction === 'next') {
      product.currentImageIndex = (product.currentImageIndex + 1) % totalImages;
    } else {
      product.currentImageIndex = (product.currentImageIndex - 1 + totalImages) % totalImages;
    }
  }

  getCurrentImageUrl(product: any): string {
    if (product.imageGallery && product.imageGallery.length > 0 &&
        product.currentImageIndex !== undefined &&
        product.imageGallery[product.currentImageIndex]) {
      return product.imageGallery[product.currentImageIndex].imageUrl;
    }
    return product.imageProduit;
  }

  getImageCount(product: any): number {
    return product.imageGallery ? product.imageGallery.length : 1;
  }

  // Add new method for adding product to favorites
  addToFavorites(product: any, event: Event): void {
    event.stopPropagation(); // Prevent event bubbling

    console.log('Adding product to favorites:', product);

    if (!product || !product.idProduit) {
      console.error('Invalid product');
      return;
    }

    // Check if user is logged in
    if (!this.currentUser || !this.currentUser.id) {
      console.error('User ID is not set. Cannot add to favorites.');
      // You could redirect to login or show a message
      return;
    }

    const favoris = new Favoris();
    console.log('Current user ID:', this.currentUser.id);
    console.log('Product ID:', product.idProduit);
    favoris.idUser = this.currentUser.id;
    favoris.idProduit = product.idProduit;

    this.favorisService.addFavoris(favoris).subscribe({
      next: (response) => {

        console.log('Product added to favorites successfully:', response);
        // Add to tracked favorites
        this.favoritedProducts.add(product.idProduit);

      },
      error: (error) => {
        console.error('Error adding product to favorites:', error);
        alert('Failed to add product to favorites. Please try again.');
      }
    });
  }

  // New method to remove from favorites
  removeFavorite(product: any): void {
    if (!this.currentUser || !this.currentUser.id) {
      return;
    }

    // First, find the favorite ID by querying all favorites
    this.favorisService.retrieveAllFavoris().subscribe({
      next: (favoris) => {
        // Find the favorite entry for this product and user
        const favorite = favoris.find(f =>
          f.idUser === this.currentUser.id &&
          f.idProduit === product.idProduit
        );

        if (favorite && favorite.idFavoris) {
          // Remove the favorite
          this.favorisService.removeFavoris(favorite.idFavoris).subscribe({
            next: () => {
              console.log('Removed from favorites successfully');
              // Remove from tracked favorites
              this.favoritedProducts.delete(product.idProduit);
            },
            error: (err) => {
              console.error('Error removing from favorites:', err);
            }
          });
        }
      },
      error: (err) => {
        console.error('Error finding favorite to remove:', err);
      }
    });
  }

  // Check if a product is in favorites
  isProductFavorited(productId: number): boolean {
    return this.favoritedProducts.has(productId);
  }

  // Toggle favorites
  toggleFavorite(product: any, event: Event): void {
    event.stopPropagation(); // Prevent event bubbling

    if (!product || !product.idProduit) {
      console.error('Invalid product');
      return;
    }

    // Check if user is logged in
    if (!this.currentUser || !this.currentUser.id) {
      console.error('User ID is not set. Cannot manage favorites.');
      alert('Please log in to manage your favorites.');
      return;
    }

    const productId = product.idProduit;

    if (this.isProductFavorited(productId)) {
      // Product is already favorited, so remove it
      this.removeFavorite(product);
    } else {
      // Product is not favorited, so add it
      this.addToFavorites(product, event);
    }
  }
}
