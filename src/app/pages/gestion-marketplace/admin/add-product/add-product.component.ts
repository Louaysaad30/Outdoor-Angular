import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html'
})
export class AddProductComponent implements OnInit {
  productForm: FormGroup;
  categories: any[] = [];
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      nomProduit: [''],
      descriptionProduit: [''],
      prixProduit: [''],
      stockProduit: [''],
      categorie: [''],
      imageProduit: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    // TODO: Implement your category loading logic here
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files[0]) {
      this.selectedFile = event.target.files[0];
    }
  }

  onSubmit(): void {
    const productData = this.productForm.value;
    const product = new Product();
    product.nomProduit = productData.nomProduit;
    product.descriptionProduit = productData.descriptionProduit;
    product.prixProduit = productData.prixProduit;
    product.stockProduit = productData.stockProduit;
    product.categorie = productData.categorie;
    product.imageProduit = this.selectedFile?.name || '';

    this.productService.addProduct(product).subscribe({
      next: (response) => {
        console.log('Product added successfully', response);

      },
      error: (error) => {
        console.error('Error adding product', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}
