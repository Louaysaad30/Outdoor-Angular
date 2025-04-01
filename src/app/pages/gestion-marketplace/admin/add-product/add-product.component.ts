import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product';
import { ProductCodeService } from '../../services/product-code.service';
import { CodeProduit } from '../../models/CodeProduit';
import { PCategorie } from '../../models/PCategorie';
import { PCategoryService } from '../../services/pcategory.service';
import { of, Observable, concat } from 'rxjs';
import { switchMap, tap, last, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html'
})
export class AddProductComponent implements OnInit {
  productForm: FormGroup;
  selectedFile: File | null = null;
  productCodes: CodeProduit[] = [];
  categories: PCategorie[] = [];
  showSuccessMessage: boolean = false;
  showErrorMessage: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: PCategoryService,
    private router: Router,
    private productCodeService: ProductCodeService
  ) {
    this.productForm = this.fb.group({
      nomProduit: ['', [Validators.required]],
      descriptionProduit: ['', [Validators.required, Validators.minLength(10)]],
      prixProduit: ['', [Validators.required, Validators.min(0)]],
      stockProduit: ['', [Validators.required, Validators.min(1)]],
      categorie: ['', [Validators.required]],
      codeProduit: ['', [Validators.required]],
      imageProduit: [null] // Remove required validator from here
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProductCodes();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => this.categories = categories,
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  loadProductCodes(): void {
    this.productCodeService.getAllProductCodes().subscribe({
      next: (codes) => this.productCodes = codes,
      error: (error) => console.error('Error loading product codes:', error)
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Update form control value
      this.productForm.patchValue({
        imageProduit: file
      });

      // Manually mark as touched and valid
      const imageControl = this.productForm.get('imageProduit');
      if (imageControl) {
        imageControl.markAsTouched();
        imageControl.setErrors(null);
      }

      this.selectedFile = file;
    } else {
      // If no file selected, mark as invalid
      const imageControl = this.productForm.get('imageProduit');
      if (imageControl) {
        imageControl.setErrors({ 'required': true });
      }
    }
  }

  get formControls() {
    return this.productForm.controls;
  }

  isImageSelected(): boolean {
    return !!this.selectedFile;
  }

  onSubmit(): void {
    if (this.productForm.invalid || !this.isImageSelected()) {
      this.markFormGroupTouched(this.productForm);

      if (!this.isImageSelected()) {
        this.showErrorMessage = true;
        this.errorMessage = 'Please select an image';
        setTimeout(() => this.showErrorMessage = false, 3000);
      } else {
        this.showErrorMessage = true;
        this.errorMessage = 'Please fill all required fields correctly';
        setTimeout(() => this.showErrorMessage = false, 3000);
      }
      return;
    }

    if (this.productForm.valid) {
      const product = new Product();
      product.nomProduit = this.productForm.value.nomProduit;
      product.descriptionProduit = this.productForm.value.descriptionProduit;
      product.prixProduit = Number(this.productForm.value.prixProduit);
      product.stockProduit = Number(this.productForm.value.stockProduit);
      product.imageProduit = this.selectedFile?.name || '';

      this.productService.addProduct(product).pipe(
        switchMap(addedProduct => {
          console.log('Product added successfully:', addedProduct);

          const assignments: Observable<Product>[] = [];

          // Add category assignment if selected
          if (this.productForm.value.categorie) {
            assignments.push(
              this.productService.assignProductToCategory(
                addedProduct.idProduit!,
                this.productForm.value.categorie.idCategorie
              ).pipe(
                tap(result => console.log('Category assigned:', result))
              )
            );
          }

          // Add code assignment if selected
          if (this.productForm.value.codeProduit) {
            assignments.push(
              this.productService.assignProductToProductCode(
                addedProduct.idProduit!,
                this.productForm.value.codeProduit.idCodeProduit
              ).pipe(
                tap(result => console.log('Product code assigned:', result))
              )
            );
          }

          // Execute all assignments sequentially
          return assignments.length > 0
            ? concat(...assignments).pipe(
                last(), // Take only the last result
                catchError(error => {
                  console.error('Assignment failed:', error);
                  // Return the original product if assignments fail
                  return of(addedProduct);
                })
              )
            : of(addedProduct);
        })
      ).subscribe({
        next: (finalProduct) => {
          console.log('All operations completed:', finalProduct);
          this.showSuccessMessage = true;
          this.productForm.reset();
          setTimeout(() => this.showSuccessMessage = false, 3000);
        },
        error: (error) => {
          console.error('Operation failed:', error);
          this.showErrorMessage = true;
          this.errorMessage = 'Failed to complete product setup. Please try again.';
          setTimeout(() => this.showErrorMessage = false, 3000);
        }
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}
