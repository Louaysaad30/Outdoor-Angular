import { Component, OnInit, ViewChild } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PCategoryService } from '../../services/pcategory.service';
import { LignedecommandeService } from '../../services/lignedecommande.service';
import { PanierService } from '../../services/panier/panier.service';
import { FavorisService } from '../../services/favoris.service';
import { Favoris } from '../../models/Favoris';
import { Options } from 'ng5-slider';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { ProductImageService } from '../../services/product-image.service';
import { ProductImage } from '../../models/ProductImage';
import { Panier } from '../../models/Panier';
import { UpdateQuantiteDTO } from '../../models/DTO/UpdateQuantiteDTO';
import { ToastrService } from 'ngx-toastr';
import { CartUpdateService } from '../../services/cart-update.service';

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
    private toastr: ToastrService,
    private cartUpdateService: CartUpdateService // Ajouter cette ligne
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
    console.log('Loading cart for user ID:', this.currentUser?.id);
    if (!this.currentUser || !this.currentUser.id) {
      console.error('User ID is not set. Cannot load cart count.');
      this.cartItemCount = 0;
      return;
    }

    // Log the user to confirm it's loaded correctly
    console.log('Current user object:', JSON.stringify(this.currentUser));

    // Get all paniers for the user
    this.panierService.getAllPaniersByUserId(this.currentUser.id).subscribe({
      next: (paniers) => {
        console.log('All paniers received:', JSON.stringify(paniers));

        if (!paniers || paniers.length === 0) {
          console.log('No paniers found for this user');
          this.cartItemCount = 0;
          return;
        }

        // Filter for active (non-validated) paniers
        const activePaniers = paniers.filter(p => p.validated !== true);
        console.log('Active (non-validated) paniers:', activePaniers);

        if (activePaniers.length === 0) {
          console.log('No active paniers found');
          this.cartItemCount = 0;
          return;
        }

        // Use the first active panier
        const panier = activePaniers[0];

        if (!panier.idPanier) {
          console.log('Active panier has no ID');
          this.cartItemCount = 0;
          return;
        }

        console.log('Fetching ligne commandes for panier ID:', panier.idPanier);

        this.ligneCommandeService.getLigneCommandesByPanierId(panier.idPanier).subscribe({
          next: (lignes) => {
            // Log the raw data
            console.log('Raw ligne commandes data:', JSON.stringify(lignes));

            if (!lignes || lignes.length === 0) {
              console.log('No ligne commandes found for this panier');
              this.cartItemCount = 0;
              return;
            }

            // Check each ligne individually for debugging
            lignes.forEach((ligne, index) => {
              console.log(`Ligne ${index} (ID: ${ligne.idLigneCommande}):`,
                `commande=${JSON.stringify(ligne.commande)}, ` +
                `quantite=${ligne.quantite}`);
            });

            // Filter active items
            const activeCartItems = lignes.filter(ligne => {
              const isActive = ligne.commande === null;
              console.log(`Ligne ${ligne.idLigneCommande}: Is active? ${isActive}`);
              return isActive;
            });

            // Calculate total quantity
            this.cartItemCount = 0;
            activeCartItems.forEach(ligne => {
              console.log(`Adding quantite ${ligne.quantite} for ligne ${ligne.idLigneCommande}`);
              this.cartItemCount += (ligne.quantite || 0);
            });

            console.log('Final active cart count:', this.cartItemCount);
          },
          error: (error) => {
            console.error('Error loading ligne commandes:', error);
            this.cartItemCount = 0;
          }
        });
      },
      error: (error) => {
        console.error('Error loading paniers:', error);
        this.cartItemCount = 0;
      }
    });
  }

  loadUserFavorites(): void {
    if (!this.currentUser || !this.currentUser.id) {
      return;
    }

    this.favorisService.retrieveFavorisByUserId(this.currentUser.id).subscribe({
      next: (userFavorites) => {
        // Clear existing favorites
        this.favoritedProducts.clear();

        // Add to tracked set
        userFavorites.forEach(fav => {
          if (fav.idProduit) {
            this.favoritedProducts.add(fav.idProduit);
          }
        });

        console.log('User favorites loaded:', userFavorites.length);
      },
      error: (error) => {
        console.error('Error loading user favorites:', error);
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
    if (!this.currentUser || !this.currentUser.id) {
      console.error('User not logged in');
      return;
    }

    // Get all paniers for the user and filter for non-validated ones
    this.panierService.getAllPaniersByUserId(this.currentUser.id).subscribe({
      next: (paniers: Panier[]) => {
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
              // Nouveau panier, donc forcément nouveau produit
              this.addProductToCart(product, createdPanier);
            },
            error: (err) => console.error('Error creating panier:', err)
          });
        } else {
          // Use the first active panier
          const panier = activePaniers[0];
          console.log('Using existing panier:', panier);

          // Check if product already exists in the panier
          this.checkAndUpdateExistingProduct(product, panier);
        }
      },
      error: (err) => console.error('Error getting user paniers:', err)
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
          const newQuantity = existingLine.quantite + 1;
          const lineTotal = newQuantity * existingLine.prix;

          const updateDto: UpdateQuantiteDTO = {
            idLigneCommande: existingLine.idLigneCommande, // Guaranteed not undefined now
            quantite: newQuantity,
            idPanier: panier.idPanier, // Guaranteed not undefined now
            total: lineTotal
          };

          this.ligneCommandeService.updateLigneCommande(updateDto).subscribe({
            next: (response) => {
              console.log('Product quantity updated successfully', response);
              this.toastr.success(
                `Added 1 ${product.nomProduit} to your cart`,
                'Success'
              );
              this.loadCartCount(); // Refresh cart count
              this.cartUpdateService.triggerCartUpdate(); // Signaler la mise à jour
            },
            error: (err) => console.error('Error updating product quantity:', err)
          });
        } else {
          // Product not in cart, add as new item
          console.log('Product not in cart, adding as new item');
          this.addProductToCart(product, panier);
        }
      },
      error: (err) => console.error('Error checking cart items:', err)
    });
  }

  private addProductToCart(product: any, panier: Panier): void {
    const newLine = {
      quantite: 1,
      prix: product.prixProduit,
      idProduit: product.idProduit,
      produit: product,
      panier: panier
    };

    this.ligneCommandeService.addLigneCommande(newLine).subscribe({
      next: (response) => {
        console.log('Product added to cart successfully', response);
        this.toastr.success(
          `Added 1 ${product.nomProduit} to your cart`,
          'Success'
        );
        this.loadCartCount(); // Refresh cart count
        this.cartUpdateService.triggerCartUpdate(); // Signaler la mise à jour
      },
      error: (err) => console.error('Error adding product to cart:', err)
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
      this.toastr.warning('Please log in to manage favorites');
      return;
    }

    const productId = product.idProduit;

    if (this.isProductFavorited(productId)) {
      // Product is already favorited, so remove it
      this.removeFavorite(product, event);
    } else {
      // Product is not favorited, so add it
      this.addToFavorites(product, event);
    }
  }

  removeFavorite(product: any, event: Event): void {
    event.stopPropagation(); // Prevent event bubbling

    if (!this.currentUser || !this.currentUser.id) {
      return;
    }

    // Find the favorite ID by querying favorites for this specific user
    this.favorisService.retrieveFavorisByUserId(this.currentUser.id).subscribe({
      next: (favoris) => {
        // Find the favorite entry for this product
        const favorite = favoris.find(f => f.idProduit === product.idProduit);

        if (favorite && favorite.idFavoris) {
          // Remove the favorite
          this.favorisService.removeFavoris(favorite.idFavoris).subscribe({
            next: () => {
              console.log('Removed from favorites successfully');
              this.toastr.success(`Removed ${product.nomProduit} from favorites`);
              // Remove from tracked favorites
              this.favoritedProducts.delete(product.idProduit);
            },
            error: (err) => {
              console.error('Error removing from favorites:', err);
              this.toastr.error('Error removing from favorites');
            }
          });
        }
      },
      error: (err) => {
        console.error('Error finding favorite to remove:', err);
      }
    });
  }

  // Get the number of favorited products
  getNumberOfFavorites(): number {
    return this.favoritedProducts.size;
  }

  // Get the actual favorited product objects
  getFavoritedProducts(): any[] {
    // Filter products that are in the favoritedProducts set
    return this.products.filter(product =>
      this.favoritedProducts.has(product.idProduit)
    );
  }
}
