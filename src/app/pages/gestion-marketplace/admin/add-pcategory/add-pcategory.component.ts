import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PCategoryService } from '../../services/pcategory.service';
import { PCategorie } from '../../models/PCategorie';

@Component({
  selector: 'app-add-pcategory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-pcategory.component.html'
})
export class AddPCategoryComponent implements OnInit {
  categoryForm: FormGroup;
  showSuccessMessage = false;
  showErrorMessage = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private categoryService: PCategoryService
  ) {
    this.categoryForm = this.fb.group({
      nomCategorie: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.categoryForm.valid) {
      const nomCategorie = this.categoryForm.value.nomCategorie;

      this.categoryService.checkCategoryNameExists(nomCategorie).subscribe({
        next: (exists) => {
          if (exists) {
            this.showErrorMessage = true;
            this.errorMessage = `Category "${nomCategorie}" already exists!`;
            setTimeout(() => {
              this.showErrorMessage = false;
            }, 3000);
          } else {
            const category: PCategorie = {
              nomCategorie: nomCategorie,
              produit: []
            };

            this.categoryService.addCategory(category).subscribe({
              next: (response) => {
                console.log('Category added successfully', response);
                this.categoryForm.reset();
                this.showSuccessMessage = true;
                setTimeout(() => {
                  this.showSuccessMessage = false;
                }, 3000);
              },
              error: (error) => {
                console.error('Error adding category', error);
                this.showErrorMessage = true;
                this.errorMessage = 'Error adding category. Please try again.';
                setTimeout(() => {
                  this.showErrorMessage = false;
                }, 3000);
              }
            });
          }
        },
        error: (error) => {
          console.error('Error checking category name:', error);
          this.showErrorMessage = true;
          this.errorMessage = 'Error checking category name. Please try again.';
          setTimeout(() => {
            this.showErrorMessage = false;
          }, 3000);
        }
      });
    }
  }
}
