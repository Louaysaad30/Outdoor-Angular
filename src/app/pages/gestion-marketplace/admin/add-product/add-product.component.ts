import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { concat, Observable, of, throwError } from 'rxjs';
import { catchError, last, switchMap, tap } from 'rxjs/operators';
import { CodeProduit } from '../../models/CodeProduit';
import { ProductService } from '../../services/product.service';
import { PCategorie } from '../../models/PCategorie';
import { PCategoryService } from '../../services/pcategory.service';
import { FileUploadService } from '../../services/cloudinary.service';
import { ProductCodeService } from '../../services/product-code.service';
import { Product } from '../../models/product';

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
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: PCategoryService,
    private productCodeService: ProductCodeService, // Add this
    private router: Router,
    private fileUploadService: FileUploadService
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showErrorMessage = true;
        this.errorMessage = 'Please select an image file';
        setTimeout(() => this.showErrorMessage = false, 3000);
        return;
      }

      // Validate file size (e.g., 5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.showErrorMessage = true;
        this.errorMessage = 'File size must not exceed 5MB';
        setTimeout(() => this.showErrorMessage = false, 3000);
        return;
      }

      this.selectedFile = file;
      // Update form control
      this.productForm.patchValue({
        imageProduit: file
      });
      const imageControl = this.productForm.get('imageProduit');
      if (imageControl) {
        imageControl.markAsTouched();
        imageControl.setErrors(null);
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
      this.showErrorMessage = true;
      this.errorMessage = !this.isImageSelected() ?
        'Please select an image' : 'Please fill all required fields correctly';
      setTimeout(() => this.showErrorMessage = false, 3000);
      return;
    }

    if (this.productForm.valid && this.selectedFile) {
      this.isLoading = true;

      this.fileUploadService.uploadFile(this.selectedFile).pipe(
        tap(imageUrl => {
          console.log('Received URL from server:', imageUrl);
        }),
        catchError(error => {
          console.error('Upload error:', error);
          this.showErrorMessage = true;
          this.errorMessage = error.message || 'Failed to upload image';
          this.isLoading = false;
          setTimeout(() => this.showErrorMessage = false, 3000);
          return throwError(() => error);
        }),
        switchMap(imageUrl => {
          if (!imageUrl) {
            throw new Error('No image URL received');
          }

          // First create the product
          const product: Partial<Product> = {
            nomProduit: this.productForm.value.nomProduit,
            descriptionProduit: this.productForm.value.descriptionProduit,
            prixProduit: Number(this.productForm.value.prixProduit),
            stockProduit: Number(this.productForm.value.stockProduit),
            imageProduit: imageUrl,
            categorie: this.productForm.value.categorie
          };

          return this.productService.addProduct(product as Product);
        }),
        switchMap(createdProduct => {
          if (!createdProduct || !createdProduct.idProduit) {
            throw new Error('Product creation failed');
          }

          const tasks: Observable<Product>[] = [];

          // Assign category if selected
          if (this.productForm.value.categorie) {
            tasks.push(
              this.productService.assignProductToCategory(
                createdProduct.idProduit,
                this.productForm.value.categorie.idCategorie
              )
            );
          }

          // Assign product code if selected
          const selectedCode = this.productForm.value.codeProduit;
          if (selectedCode && selectedCode.idCodeProduit) {
            console.log('Assigning product code:', selectedCode);
            tasks.push(
              this.productService.assignProductToProductCode(
                createdProduct.idProduit,
                selectedCode.idCodeProduit
              )
            );
          }

          // If we have assignments to make, execute them in sequence
          return tasks.length > 0 ?
            concat(...tasks).pipe(
              tap(result => console.log('Assignment result:', result)),
              catchError(error => {
                console.error('Assignment error:', error);
                return throwError(() => new Error('Failed to assign category or product code'));
              }),
              last()
            ) :
            of(createdProduct);
        })
      ).subscribe({
        next: (finalProduct) => {
          console.log('Product created and assigned successfully:', finalProduct);
          this.showSuccessMessage = true;
          this.isLoading = false;
          this.productForm.reset();
          this.selectedFile = null;
          setTimeout(() => {
            this.showSuccessMessage = false;
            this.router.navigate(['/marketplaceback/admin/productList']);
          }, 1500);
        },
        error: (error) => {
          console.error('Operation failed:', error);
          this.showErrorMessage = true;
          this.errorMessage = error.message || 'Failed to complete product setup';
          this.isLoading = false;
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
