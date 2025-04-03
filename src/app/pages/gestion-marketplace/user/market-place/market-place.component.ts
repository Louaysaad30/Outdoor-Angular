import { Component, OnInit, ViewChild } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PCategoryService } from '../../services/pcategory.service';
import { LignedecommandeService } from '../../services/lignedecommande.service';
import { PanierService } from '../../services/panier.service';
import { Options } from 'ng5-slider';
import { ModalDirective } from 'ngx-bootstrap/modal';

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
    private panierService: PanierService
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
        if (panier && panier.lignesCommande) {
          // Sum up all quantities instead of counting items
          this.cartItemCount = panier.lignesCommande.reduce(
            (total, ligne) => total + ligne.quantite, 0
          );
        } else {
          this.cartItemCount = 0;
        }
      },
      error: (error) => {
        console.error('Error loading cart count:', error);
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
    this.panierService.ajouterProduitAuPanier(this.userId, product.idProduit, 1).subscribe({
      next: (response) => {
        if (response) {
          // Force reload cart count after successful purchase
          this.loadCartCount();
          // Optional: Show success message
          console.log('Product added successfully');
        }
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
      }
    });
  }
}
