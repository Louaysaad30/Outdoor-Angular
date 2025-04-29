import { Component, OnInit } from '@angular/core';
import { VehiculeService } from '../../services/vehicule.service';
import { ReviewService } from '../../services/review.service';
import { BadWordService } from '../../services/BadWordService';
import { ActivatedRoute } from '@angular/router';
import { Vehicule } from '../../models/vehicule.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Review } from '../../models/review.model';

@Component({
  selector: 'app-vehicule-details',
  templateUrl: './vehicule-details.component.html',
  styleUrls: ['./vehicule-details.component.scss']
})
export class VehiculeDetailsComponent implements OnInit {
  vehicule: Vehicule | null = null;
  reviews: Review[] = [];
  reviewForm: FormGroup;
  vehiculeId: number | null = null;
  showForm = false;
  currentUser: any;
  loading = true;
  reviewSort: 'newest' | 'highest' | 'lowest' = 'newest';
  badWordsDetected = false;
  deleteError: string | null = null;
  deleteSuccess = false;
  userReview: Review | null = null;
  isEditing = false;

  constructor(
    private route: ActivatedRoute,
    private vehiculeService: VehiculeService,
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private badWordService: BadWordService
  ) {
    this.reviewForm = this.fb.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.vehiculeId = +id;
      this.loadVehicleDetails();
    }
  }

  loadVehicleDetails(): void {
    this.loading = true;
    this.vehiculeService.getVehiculeById(this.vehiculeId!).subscribe({
      next: (data: Vehicule) => {
        this.vehicule = data;
        this.loadReviews();
      },
      error: (error) => {
        console.error('Error loading vehicle details:', error);
        this.loading = false;
      }
    });
  }

  loadReviews(): void {
    if (!this.vehiculeId) return;

    this.loading = true;
    this.reviewService.getReviewsByVehicule(this.vehiculeId).subscribe({
      next: (reviews: Review[]) => {
        this.reviews = reviews.map(review => ({
          ...review,
          user: this.getUserInfoForReview(review.userId) || {
            nom: 'Anonymous',
            prenom: '',
            image: null
          }
        }));
        
        if (this.currentUser) {
          this.loadUserReview();
        }
        
        this.sortReviews(this.reviewSort);
        this.calculateAverageRating();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching reviews:', error);
        this.loading = false;
      }
    });
  }

  loadUserReview(): void {
    if (!this.vehiculeId || !this.currentUser?.id) return;
    
    this.reviewService.getUserReview(this.vehiculeId, this.currentUser.id).subscribe({
      next: (review) => {
        this.userReview = review;
        if (this.userReview) {
          this.reviewForm.patchValue({
            rating: this.userReview.rating,
            comment: this.userReview.comment
          });
        }
      },
      error: (error) => {
        console.error('Error loading user review:', error);
      }
    });
  }

  getSortLabel(): string {
    switch (this.reviewSort) {
      case 'newest': return 'Newest';
      case 'highest': return 'Highest';
      case 'lowest': return 'Lowest';
      default: return 'Sort by';
    }
  }

  getUserInfoForReview(userId: number): any {
    if (this.currentUser && this.currentUser.id === userId) {
      return {
        nom: this.currentUser.nom,
        prenom: this.currentUser.prenom,
        image: this.currentUser.image
      };
    }
    return null;
  }

  calculateAverageRating(): void {
    if (this.reviews.length > 0) {
      const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
      const average = sum / this.reviews.length;
      this.vehicule!.rating = parseFloat(average.toFixed(1));
      
      this.vehiculeService.updateVehiculeRating(this.vehiculeId!, this.vehicule!.rating).subscribe({
        next: () => console.log('Vehicle rating updated successfully'),
        error: (error) => console.error('Error updating vehicle rating:', error)
      });
    }
  }

  sortReviews(sortType: 'newest' | 'highest' | 'lowest'): void {
    if (!this.reviews || this.reviews.length === 0) return;
    this.reviewSort = sortType;
    const sortedReviews = [...this.reviews];
    
    switch (sortType) {
      case 'newest':
        sortedReviews.sort((a, b) => 
          new Date(b.createdDate || '').getTime() - new Date(a.createdDate || '').getTime());
        break;
      case 'highest':
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
    }
    
    this.reviews = sortedReviews;
  }

  toggleReviewForm(): void {
    if (this.userReview && !this.isEditing) {
      this.startEdit(this.userReview);
      return;
    }
    this.showForm = !this.showForm;
    this.isEditing = false;
    if (this.showForm) this.reviewForm.reset();
  }

  startEdit(review: Review): void {
    this.isEditing = true;
    this.showForm = true;
    this.reviewForm.patchValue({
      rating: review.rating,
      comment: review.comment
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.showForm = false;
    this.reviewForm.reset();
  }

  saveReview(): void {
    if (this.reviewForm.invalid || !this.vehiculeId || !this.currentUser?.id) return;

    this.loading = true;
    this.badWordService.filterContent(this.reviewForm.value.comment).subscribe({
      next: ({filteredContent, hasBadWords}) => {
        this.badWordsDetected = hasBadWords;
        
        const reviewData: Review = {
          ...this.reviewForm.value,
          comment: filteredContent,
          vehiculeId: this.vehiculeId!,
          userId: this.currentUser.id,
          createdDate: new Date().toISOString(),
          user: {
            nom: this.currentUser.nom,
            prenom: this.currentUser.prenom,
            image: this.currentUser.image
          }
        };

        if (this.isEditing && this.userReview) {
          this.updateReview(reviewData);
        } else {
          this.createReview(reviewData);
        }
      },
      error: (error) => {
        console.error('Error filtering bad words:', error);
        this.loading = false;
        this.deleteError = 'Error processing your review content.';
        setTimeout(() => this.deleteError = null, 3000);
      }
    });
  }

  createReview(review: Review): void {
    this.reviewService.addReview(this.vehiculeId!, review).subscribe({
      next: (newReview) => {
        const reviewWithUser = {
          ...newReview,
          user: {
            nom: this.currentUser.nom,
            prenom: this.currentUser.prenom,
            image: this.currentUser.image
          }
        };
        
        this.reviews.unshift(reviewWithUser);
        this.userReview = reviewWithUser;
        this.calculateAverageRating();
        this.resetForm();
        this.loading = false;
        
        this.deleteSuccess = true;
        setTimeout(() => this.deleteSuccess = false, 3000);
      },
      error: (error) => {
        console.error('Error saving review:', error);
        this.loading = false;
        this.deleteError = 'Failed to save review. Please try again.';
        setTimeout(() => this.deleteError = null, 3000);
      }
    });
  }

  updateReview(review: Review): void {
    if (!this.userReview?.id) return;

    this.loading = true;
    this.reviewService.updateReview(this.userReview.id, review).subscribe({
      next: (updatedReview) => {
        const index = this.reviews.findIndex(r => r.id === updatedReview.id);
        if (index !== -1) {
          this.reviews[index] = {
            ...updatedReview,
            user: {
              nom: this.currentUser.nom,
              prenom: this.currentUser.prenom,
              image: this.currentUser.image
            }
          };
        }
        
        this.userReview = updatedReview;
        this.calculateAverageRating();
        this.resetForm();
        this.loading = false;
        
        this.deleteSuccess = true;
        setTimeout(() => this.deleteSuccess = false, 3000);
      },
      error: (error) => {
        console.error('Error updating review:', error);
        this.loading = false;
        this.deleteError = 'Failed to update review. Please try again.';
        setTimeout(() => this.deleteError = null, 3000);
      }
    });
  }

  deleteReview(reviewId: number): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.loading = true;
      this.deleteError = null;
      this.deleteSuccess = false;
      
      this.reviewService.deleteReview(reviewId).subscribe({
        next: () => {
          this.reviews = this.reviews.filter(r => r.id !== reviewId);
          if (this.userReview?.id === reviewId) {
            this.userReview = null;
          }
          this.calculateAverageRating();
          this.loading = false;
          
          this.deleteSuccess = true;
          setTimeout(() => this.deleteSuccess = false, 3000);
        },
        error: (error) => {
          console.error('Error deleting review:', error);
          this.loading = false;
          this.deleteError = 'Failed to delete review. Please try again.';
          setTimeout(() => this.deleteError = null, 3000);
        }
      });
    }
  }

  private resetForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.badWordsDetected = false;
    this.reviewForm.reset();
  }

  getReviewButtonText(): string {
    if (this.isEditing) return 'Cancel Edit';
    if (this.userReview) return 'Edit Your Review';
    return 'Add Review';
  }
}