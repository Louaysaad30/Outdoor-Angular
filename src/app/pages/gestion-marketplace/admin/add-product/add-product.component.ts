import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { concat, forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, last, switchMap, tap } from 'rxjs/operators';
import { CodeProduit } from '../../models/CodeProduit';
import { ProductService } from '../../services/product.service';
import { PCategorie } from '../../models/PCategorie';
import { PCategoryService } from '../../services/pcategory.service';
import { FileUploadService } from '../../services/cloudinary.service';
import { ProductCodeService } from '../../services/product-code.service';
import { Product } from '../../models/product';
import { ProductImageService } from '../../services/product-image.service';

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

  selectedFiles: File[] = [];
  imagePreviewUrls: string[] = [];

  @Output() productAdded = new EventEmitter<boolean>();

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: PCategoryService,
    private productCodeService: ProductCodeService, // Add this
    private router: Router,
    private fileUploadService: FileUploadService,
    private productImageService: ProductImageService  // Add this
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
    const files = event.target.files;
    if (files && files.length > 0) {
      // Réinitialiser si nécessaire
      // this.selectedFiles = [];
      // this.imagePreviewUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Valider le type de fichier
        if (!file.type.startsWith('image/')) {
          this.showErrorMessage = true;
          this.errorMessage = 'Please select only image files';
          continue;
        }

        // Valider la taille (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          this.showErrorMessage = true;
          this.errorMessage = 'File size must not exceed 5MB';
          continue;
        }

        this.selectedFiles.push(file);

        // Générer un aperçu
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }

      // Mettre à jour le contrôle de formulaire
      this.productForm.patchValue({
        imageProduit: this.selectedFiles.length > 0 ? 'selected' : null
      });

      if (this.selectedFiles.length > 0) {
        const imageControl = this.productForm.get('imageProduit');
        if (imageControl) {
          imageControl.markAsTouched();
          imageControl.updateValueAndValidity();
        }
      }
    }
  }

  removeSelectedImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviewUrls.splice(index, 1);

    // Mettre à jour le contrôle de formulaire
    if (this.selectedFiles.length === 0) {
      this.productForm.patchValue({ imageProduit: null });
    }
  }

  get formControls() {
    return this.productForm.controls;
  }

  isImageSelected(): boolean {
    return this.selectedFiles.length > 0;
  }

  onSubmit(): void {
    if (this.productForm.invalid || !this.isImageSelected()) {
      this.markFormGroupTouched(this.productForm);
      this.showErrorMessage = true;
      this.errorMessage = !this.isImageSelected() ?
        'Please select at least one image' : 'Please fill all required fields correctly';
      return;
    }

    if (this.productForm.valid && this.selectedFiles.length > 0) {
      this.isLoading = true;
      this.showErrorMessage = false;

      // Upload multiple images
      this.fileUploadService.uploadMultipleFiles(this.selectedFiles).subscribe({
        next: (imageUrls) => {
          const productData = {
            ...this.productForm.value,
            imageProduit: imageUrls[0], // La première image comme image principale
            dateCreation: new Date()
          };

          this.productService.addProduct(productData).subscribe({
            next: (product) => {
              // Si plus d'une image, ajouter les autres à la galerie
              if (imageUrls.length > 1) {
                const additionalImages = imageUrls.slice(1);
                this.addImagesToProductGallery(product.idProduit, additionalImages);
              } else {
                this.handleSuccess();
              }
            },
            error: (error) => this.handleError(error)
          });
        },
        error: (error) => this.handleError(error)
      });
    }
  }

  private addImagesToProductGallery(productId: number, imageUrls: string[]): void {
    // Use the productImageService instead of productService
    forkJoin(imageUrls.map(url => this.productImageService.addImageToProduct(productId, url)))
      .subscribe({
        next: (_) => this.handleSuccess(),
        error: (error) => this.handleError(error)
      });
  }

  private handleSuccess(): void {
    this.showSuccessMessage = true;
    this.isLoading = false;
    this.productForm.reset();
    this.selectedFiles = [];
    this.imagePreviewUrls = [];

    // Notifier le composant parent
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.productAdded.emit(true);
    }, 1500);
  }

  private handleError(error: any): void {
    console.error('Error:', error);
    this.showErrorMessage = true;
    this.errorMessage = 'Failed to create product: ' + (error.message || 'Unknown error');
    this.isLoading = false;
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
