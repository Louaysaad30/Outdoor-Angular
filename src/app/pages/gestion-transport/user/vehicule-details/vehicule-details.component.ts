import { Component, OnInit } from '@angular/core';
import { VehiculeService } from '../../services/vehicule.service';
import { ReviewService } from '../../services/review.service';
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
  
  private readonly BAD_WORDS = [
    'merde', 'isreal', 'con', 'putain', 'shit', 'shitty', 
    'fuck', 'asshole', 'bitch', 'damn', 'hell'
  ];

  constructor(
    private route: ActivatedRoute,
    private vehiculeService: VehiculeService,
    private fb: FormBuilder,
    private reviewService: ReviewService
  ) {
    this.reviewForm = this.fb.group({
      rating: [null, [Validators.required]],
      comment: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);
    
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
        this.getReviewsByVehicule();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading vehicle details:', error);
        this.loading = false;
      }
    });
  }

  getReviewsByVehicule(): void {
    if (this.vehiculeId) {
      this.reviewService.getReviewsByVehicule(this.vehiculeId).subscribe({
        next: (data: Review[]) => {
          this.reviews = data.map(review => ({
            ...review,
            user: this.getUserInfoForReview(review.userId) || {
              nom: 'Anonymous',
              prenom: '',
              image: null
            }
          }));
          this.sortReviews(this.reviewSort);
          this.calculateAverageRating();
        },
        error: (error) => {
          console.error('Error fetching reviews:', error);
        }
      });
    }
  }

  getSortLabel(): string {
    switch (this.reviewSort) {
      case 'newest': return 'Newest';
      case 'highest': return 'Highest';
      case 'lowest': return 'Lowest';
      default: return 'Sort by';
    }
  }

  private filterBadWords(content: string): string {
    let filteredContent = content;
    this.badWordsDetected = false;
    
    for (const badWord of this.BAD_WORDS) {
      const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
      if (regex.test(content)) {
        this.badWordsDetected = true;
      }
      const stars = '*'.repeat(badWord.length);
      filteredContent = filteredContent.replace(regex, stars);
    }
    
    return filteredContent;
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
    this.showForm = !this.showForm;
    this.badWordsDetected = false;
    if (this.showForm) {
      this.reviewForm.reset();
    }
  }

  saveReview(): void {
    if (this.reviewForm.valid && this.vehiculeId && this.currentUser?.id) {
      const filteredComment = this.filterBadWords(this.reviewForm.value.comment);
      
      const review: Review = {
        ...this.reviewForm.value,
        comment: filteredComment,
        vehiculeId: this.vehiculeId,
        userId: this.currentUser.id,
        createdDate: new Date().toISOString(),
        user: {
          nom: this.currentUser.nom,
          prenom: this.currentUser.prenom,
          image: this.currentUser.image
        }
      };

      this.reviewService.addReview(this.vehiculeId, review).subscribe({
        next: (newReview) => {
          newReview.user = {
            nom: this.currentUser.nom,
            prenom: this.currentUser.prenom,
            image: this.currentUser.image
          };
          
          this.reviews.unshift(newReview);
          this.calculateAverageRating();
          this.reviewForm.reset();
          this.showForm = false;
          this.badWordsDetected = false;
        },
        error: (error) => {
          console.error('Error saving review:', error);
        }
      });
    }
  }

  deleteReview(reviewId: number): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.deleteError = null;
      this.deleteSuccess = false;
      
      this.reviewService.deleteReview(reviewId).subscribe({
        next: () => {
          this.reviews = this.reviews.filter(review => review.id !== reviewId);
          this.calculateAverageRating();
          this.deleteSuccess = true;
          setTimeout(() => this.deleteSuccess = false, 3000);
        },
        error: (error) => {
          console.error('Error deleting review:', error);
          this.deleteError = 'Failed to delete review. Please try again.';
          setTimeout(() => this.deleteError = null, 3000);
        }
      });
    }
  }
}