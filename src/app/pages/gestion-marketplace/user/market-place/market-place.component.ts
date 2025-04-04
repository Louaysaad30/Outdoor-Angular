import { Component, OnInit, ViewChild } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PCategoryService } from '../../services/pcategory.service';
import { LignedecommandeService } from '../../services/lignedecommande.service';
import { PanierService } from '../../services/panier.service';
import { Options } from 'ng5-slider';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';

@Component({
  selector: 'app-market-place',
  templateUrl: './market-place.component.html'
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
    private router: Router
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
}
