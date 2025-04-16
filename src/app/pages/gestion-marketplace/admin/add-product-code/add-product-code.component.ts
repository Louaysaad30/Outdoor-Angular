import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductCodeService } from '../../services/product-code.service';
import { CodeProduit } from '../../models/CodeProduit';

@Component({
  selector: 'app-add-product-code',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-product-code.component.html'
})
export class AddProductCodeComponent implements OnInit {
  productCodeForm: FormGroup;
  showSuccessMessage = false;
  showErrorMessage = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private productCodeService: ProductCodeService
  ) {
    this.productCodeForm = this.fb.group({
      code: ['', [
        Validators.required,
        Validators.pattern('^CP-[0-9]{4}$')
      ]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.productCodeForm.valid) {
      const code = this.productCodeForm.value.code;

      this.productCodeService.checkProductCodeExists(code).subscribe({
        next: (exists) => {
          if (exists) {
            this.showErrorMessage = true;
            this.errorMessage = `Product code "${code}" already exists!`;
            setTimeout(() => {
              this.showErrorMessage = false;
            }, 3000);
          } else {
            const productCode: CodeProduit = {
              code: code,
              produit: []
            };

            this.productCodeService.addProductCode(productCode).subscribe({
              next: (response) => {
                console.log('Product code added successfully', response);
                this.productCodeForm.reset();
                this.showSuccessMessage = true;
                setTimeout(() => {
                  this.showSuccessMessage = false;
                }, 3000);
              },
              error: (error) => {
                console.error('Error adding product code', error);
                this.showErrorMessage = true;
                this.errorMessage = 'Error adding product code. Please try again.';
                setTimeout(() => {
                  this.showErrorMessage = false;
                }, 3000);
              }
            });
          }
        },
        error: (error) => {
          console.error('Error checking product code:', error);
          this.showErrorMessage = true;
          this.errorMessage = 'Error checking product code. Please try again.';
          setTimeout(() => {
            this.showErrorMessage = false;
          }, 3000);
        }
      });
    }
  }
}
