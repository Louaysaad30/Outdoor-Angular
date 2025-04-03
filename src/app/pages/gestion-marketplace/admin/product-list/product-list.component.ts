import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import { PCategorie } from '../../models/PCategorie';
import { PCategoryService } from '../../services/pcategory.service';
import { image } from 'ngx-editor/schema/nodes';
import { FileUploadService } from '../../services/cloudinary.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  @ViewChild('showModal', { static: false }) showModal?: ModalDirective;

  @ViewChild('deleteRecordModal') deleteRecordModal?: ModalDirective;

  productForm: FormGroup;
  products: Product[] = [];
  allproducts: Product[] = [];
  term: string = '';
  deleteId: number = 0;
  masterSelected: boolean = false;
  items: any[] = [];
  uploadedFiles: any[] = [];
  categories: PCategorie[] = [];
  selectedCategory: string = '';
  currentImage: string | null = null;
  selectedFile: File | null = null;
  currentProduct?: Product;
  isFormValid: boolean = false;

  // Add property for image URL
  imageBasePath = 'http://localhost:9093/uploads/';

  // Dropzone config
  dropzoneConfig = {
    url: 'your-upload-url',
    maxFilesize: 2,
    acceptedFiles: 'image/*',
    addRemoveLinks: true
  };

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private pCategoryService: PCategoryService,
    private fileUploadService: FileUploadService
  ) {
    this.productForm = this.fb.group({
      nomProduit: ['', [Validators.required]],
      descriptionProduit: ['', [Validators.required, Validators.minLength(10)]],
      prixProduit: ['', [Validators.required, Validators.min(0)]],
      stockProduit: ['', [Validators.required, Validators.min(1)]],
      categorie: [null],
      imageProduit: [null]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (data) => {
      //  console.log('Loaded products:', data); // Debug log
        this.products = data;
        this.allproducts = data;
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  loadCategories(): void {
    this.pCategoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  filterdata(): void {
    if (this.term) {
      const searchTerm = this.term.toLowerCase();
      this.products = this.allproducts.filter(product => {
       // console.log('Product being filtered:', product); // Debug log
        return (
          product.nomProduit.toLowerCase().includes(searchTerm) ||
          product.categorie.nomCategorie.toLowerCase().includes(searchTerm) ||
          product.prixProduit.toString().includes(searchTerm) ||
          product.stockProduit.toString().includes(searchTerm)
        );
      });
    } else {
      this.products = this.allproducts;
    }
  }

  filterByCategory(): void {
    if (!this.selectedCategory) {
      this.products = this.allproducts;
    } else {
      this.products = this.allproducts.filter(product =>
        product.categorie?.idCategorie?.toString() === this.selectedCategory
      );
    }
  }

  onSort(column: string): void {
    this.products = [...this.products].sort((a, b) => {
      const valueA = this.getSortValue(a, column);
      const valueB = this.getSortValue(b, column);
      return valueA.localeCompare(valueB);
    });
  }

  private getSortValue(item: Product, column: string): string {
   // console.log('Sorting item:', item); // Debug log
    switch (column) {
      case 'nomProduit':
        return item.nomProduit;
      case 'categorie':
        return item.categorie.nomCategorie;
      case 'prixProduit':
        return item.prixProduit.toString();
      case 'stockProduit':
        return item.stockProduit.toString();
      default:
        return '';
    }
  }

  checkUncheckAll(event: any): void {
    this.products.forEach(product => product.states = event.target.checked);
  }

  onCheckboxChange(event: any): void {
    const selectedCount = this.products.filter(product => product.states).length;
    this.masterSelected = selectedCount === this.products.length;
  }

  editList(index: number): void {
    const product = this.products[index];
    if (product) {
      this.currentProduct = product;
      this.currentImage = product.imageProduit;
      this.showModal?.show();

    //  console.log('Editing product:', product);

      this.productForm.patchValue({
        nomProduit: product.nomProduit,
        descriptionProduit: product.descriptionProduit,
        prixProduit: product.prixProduit,
        stockProduit: product.stockProduit,
        categorie: product.categorie
      });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.currentImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProduct(): void {
    if (!this.currentProduct) {
    //  console.log('No product selected for update');
      return;
    }

    // Get form values
    const formValues = this.productForm.value;

    // Check required fields only
    if (!formValues.nomProduit || !formValues.descriptionProduit ||
        !formValues.prixProduit || !formValues.stockProduit) {
      console.error('Required fields are missing');
      return;
    }

    const updateData = {
      idProduit: this.currentProduct.idProduit,
      nomProduit: formValues.nomProduit,
      descriptionProduit: formValues.descriptionProduit,
      prixProduit: formValues.prixProduit,
      stockProduit: formValues.stockProduit,
      categorie: formValues.categorie || this.currentProduct.categorie,
      imageProduit: this.currentProduct.imageProduit
    };

    //console.log('Updating product with data:', updateData);

    if (this.selectedFile) {
      this.fileUploadService.uploadFile(this.selectedFile).pipe(
        switchMap(imageUrl => {
          console.log('New image uploaded:', imageUrl);
          updateData.imageProduit = imageUrl;
          return this.productService.updateProduct(this.currentProduct!.idProduit, updateData);
        })
      ).subscribe({
        next: (response) => {
        //  console.log('Product updated with new image:', response);
          this.showModal?.hide();
          this.loadProducts();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error updating product:', error);
        }
      });
    } else {
      this.productService.updateProduct(this.currentProduct.idProduit, updateData)
        .subscribe({
          next: (response) => {
         //   console.log('Product updated successfully:', response);
            this.showModal?.hide();
            this.loadProducts();
            this.resetForm();
          },
          error: (error) => {
            console.error('Error updating product:', error);
          }
        });
    }
  }

  private resetForm(): void {
    this.productForm.reset();
    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
    this.currentProduct = undefined;
    this.selectedFile = null;
    this.currentImage = null;
  }

  removeItem(id: number): void {
    this.deleteId = id;
    this.deleteRecordModal?.show();
  }

  deleteData(id: number): void {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.loadProducts(); // Refresh the list
        this.deleteRecordModal?.hide();
      },
      error: (error) => {
        console.error('Error deleting product:', error);
      }
    });
  }

  onUploadSuccess(event: any): void {
    const [file] = event;
    this.uploadedFiles.push(file);
  }

  removeFile(file: any): void {
    const index = this.uploadedFiles.indexOf(file);
    if (index !== -1) {
      this.uploadedFiles.splice(index, 1);
    }
  }

  pageChanged(event: any): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.products = this.allproducts.slice(startItem, endItem);
  }

  navigateToAddProduct(): void {
    this.router.navigate(['/marketplaceback/admin/add-product']);
  }
}
