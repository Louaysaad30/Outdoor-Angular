import { Component, OnInit, ViewChild } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PCategoryService } from '../../services/pcategory.service';
import { LignedecommandeService } from '../../services/lignedecommande.service';
import { PanierService } from '../../services/panier.service';
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
  userId: number = 1; // Static user ID for now

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

  constructor(
    private productService: ProductService,
    private categoryService: PCategoryService,
    private ligneCommandeService: LignedecommandeService,
    private panierService: PanierService,
    private router: Router,
    private productImageService: ProductImageService,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadCartCount();
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
    this.panierService.getPanierByUser(this.userId).subscribe({
      next: (panier) => {
        console.log('Panier received:', panier);

        if (panier && panier.idPanier) {
          this.ligneCommandeService.getLigneCommandesByPanierId(panier.idPanier).subscribe({
            next: (lignes) => {
              console.log('Lignes received:', lignes);

              // Calculate total items in cart
              this.cartItemCount = lignes.reduce((total, ligne) => {
                return total + (ligne.quantite || 0);
              }, 0);

              console.log('Cart count calculated:', this.cartItemCount);
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
    if (!product || !product.idProduit) {
      console.error('Invalid product');
      return;
    }

    this.panierService.ajouterProduitAuPanier(this.userId, product.idProduit, 1).subscribe({
      next: (response) => {
        console.log('Add to cart response:', response);
        if (response) {
          // Update cart count
          this.loadCartCount();
          // Show success message or notification here if needed
        }
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        // Show error message or notification here if needed
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
}
