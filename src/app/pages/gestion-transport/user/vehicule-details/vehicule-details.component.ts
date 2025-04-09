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
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.vehiculeId = +id;
      this.vehiculeService.getVehiculeById(this.vehiculeId).subscribe((data: Vehicule) => {
        this.vehicule = data;
        this.getReviewsByVehicule();
      });
    }
  }

  
  getReviewsByVehicule() {
    if (this.vehiculeId) {
      this.reviewService.getReviewsByVehicule(this.vehiculeId).subscribe(
        (data: Review[]) => {
          console.log('Fetched reviews:', data);  
          this.reviews = data;
        },
        error => {
          console.error('Error fetching reviews:', error);
        }
      );
    }
  }
  

  toggleReviewForm() {
    this.showForm = !this.showForm;
  }

  
  saveReview(): void {
    if (this.reviewForm.valid && this.vehiculeId) {
      const review: Review = {
        ...this.reviewForm.value,
        vehiculeId: this.vehiculeId 
      };

      this.reviewService.addReview(this.vehiculeId, review).subscribe((newReview) => {
        this.reviews.push(newReview);
        this.reviewForm.reset(); 
        this.showForm = false; 
      });
    }
  }

  
  deleteReview(reviewId: number): void {
    this.reviewService.deleteReview(reviewId).subscribe(() => {
      this.reviews = this.reviews.filter(review => review.id !== reviewId);
    });
  }
}
