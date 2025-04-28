import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ReviewAnalysisResponse } from '../../models/ReviewAnalysisResponse';
import { ReviewAnalysisService } from '../../services/reviewAnalysis.service';
import { ProductService } from '../../services/product.service';
import { ToastrService } from 'ngx-toastr';
import { Chart, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-review-analysis',
  templateUrl: './reviewAnalysis.component.html'
})
export class ReviewAnalysisComponent implements OnInit {
  @ViewChild('sentimentChart') sentimentChartRef!: ElementRef;
  @ViewChild('ageChart') ageChartRef!: ElementRef;

  reviewAnalyses: ReviewAnalysisResponse[] = [];
  // Map to store product images keyed by product ID
  productImages: Map<number, string> = new Map();
  loading: boolean = false;
  sentimentChart: any;
  ageChart: any;
  chartsRendered: boolean = false;

  // Sentiment counts
  positiveCount: number = 0;
  negativeCount: number = 0;
  neutralCount: number = 0;

  // Age demographics
  ageGroups: { [key: string]: number } = {
    'Under 18': 0,
    '18-24': 0,
    '25-34': 0,
    '35-44': 0,
    '45-54': 0,
    '55+': 0
  };

  // New properties
  topProducts: any[] = [];
  sortOption: string = 'sentiment-desc';

  // Add this property
  reviewSortOption: string = 'newest';

  constructor(
    private reviewAnalysisService: ReviewAnalysisService,
    private productService: ProductService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadReviewAnalyses();
  }

  loadReviewAnalyses(): void {
    this.loading = true;
    this.reviewAnalysisService.getReviewAnalyses().subscribe({
      next: (data) => {
        this.reviewAnalyses = data;
        this.processAnalysisData(data);
        this.processProductPerformance(); // Add this line

        // Load product images for each review that has a product ID
        this.loadProductImages(data);
      },
      error: (error) => {
        console.error('Error fetching review analyses:', error);
        this.toastr.error('Failed to load review analyses. Please try again later.');
        this.loading = false;
      }
    });
  }

  // New method to load product images
  loadProductImages(reviews: ReviewAnalysisResponse[]): void {
    // Extract unique product IDs
    const productIds = new Set<number>();
    reviews.forEach(review => {
      if (review.idProduit) {
        productIds.add(review.idProduit);
      }
    });

    // If no product IDs, just render the charts
    if (productIds.size === 0) {
      this.loading = false;
      setTimeout(() => this.renderCharts(), 100);
      return;
    }

    // Create an array of observables for product requests
    const productRequests = Array.from(productIds).map(id =>
      this.productService.getProductById(id).pipe(
        catchError(error => {
          console.error(`Error fetching product ${id}:`, error);
          return of(null); // Return null for failed requests
        })
      )
    );

    // Execute all requests in parallel
    forkJoin(productRequests)
      .pipe(
        finalize(() => {
          this.loading = false;
          // Render charts after product images are loaded
          setTimeout(() => this.renderCharts(), 100);
        })
      )
      .subscribe({
        next: (products) => {
          // Store product images in the map
          products.forEach(product => {
            if (product && product.idProduit) {
              this.productImages.set(product.idProduit, product.imageProduit);
            }
          });
        },
        error: (error) => {
          console.error('Error loading product images:', error);
        }
      });
  }

  // Get product image URL by product ID
  getProductImage(productId: number): string {
    return this.productImages.get(productId) || 'assets/images/no-image.png';
  }

  processAnalysisData(data: ReviewAnalysisResponse[]): void {
    // Reset counters
    this.positiveCount = 0;
    this.negativeCount = 0;
    this.neutralCount = 0;

    // Reset age groups
    Object.keys(this.ageGroups).forEach(key => {
      this.ageGroups[key] = 0;
    });

    // Process each review
    data.forEach(review => {
      // Count sentiments
      if (review.sentiment) {
        const sentiment = review.sentiment.toLowerCase();
        if (sentiment.includes('positive')) {
          this.positiveCount++;
        } else if (sentiment.includes('negative')) {
          this.negativeCount++;
        } else {
          this.neutralCount++;
        }
      }

      // Count age demographics
      if (review.age) {
        if (review.age < 18) {
          this.ageGroups['Under 18']++;
        } else if (review.age >= 18 && review.age <= 24) {
          this.ageGroups['18-24']++;
        } else if (review.age >= 25 && review.age <= 34) {
          this.ageGroups['25-34']++;
        } else if (review.age >= 35 && review.age <= 44) {
          this.ageGroups['35-44']++;
        } else if (review.age >= 45 && review.age <= 54) {
          this.ageGroups['45-54']++;
        } else {
          this.ageGroups['55+']++;
        }
      }
    });
  }

  // New method to process product performance
  processProductPerformance(): void {
    // Group reviews by product ID
    const productMap = new Map<number, any>();

    this.reviewAnalyses.forEach(review => {
      if (!review.idProduit) return;

      if (!productMap.has(review.idProduit)) {
        productMap.set(review.idProduit, {
          idProduit: review.idProduit,
          reviews: [],
          positiveCount: 0,
          neutralCount: 0,
          negativeCount: 0,
          reviewCount: 0,
          sentiment: 'Unknown'
        });
      }

      const product = productMap.get(review.idProduit);
      product.reviews.push(review);
      product.reviewCount++;

      if (review.sentiment) {
        const sentiment = review.sentiment.toLowerCase();
        if (sentiment.includes('positive')) {
          product.positiveCount++;
        } else if (sentiment.includes('negative')) {
          product.negativeCount++;
        } else {
          product.neutralCount++;
        }
      }
    });

    // Calculate percentages and overall sentiment
    productMap.forEach(product => {
      product.positivePercentage = Math.round((product.positiveCount / product.reviewCount) * 100) || 0;
      product.neutralPercentage = Math.round((product.neutralCount / product.reviewCount) * 100) || 0;
      product.negativePercentage = Math.round((product.negativeCount / product.reviewCount) * 100) || 0;

      if (product.positiveCount > product.negativeCount && product.positiveCount > product.neutralCount) {
        product.sentiment = 'Positive';
      } else if (product.negativeCount > product.positiveCount && product.negativeCount > product.neutralCount) {
        product.sentiment = 'Negative';
      } else {
        product.sentiment = 'Neutral';
      }
    });

    // Convert map to array
    this.topProducts = Array.from(productMap.values());

    // Sort products
    this.sortProducts();
  }

  sortProducts(): void {
    switch (this.sortOption) {
      case 'sentiment-desc':
        this.topProducts.sort((a, b) => b.positivePercentage - a.positivePercentage);
        break;
      case 'sentiment-asc':
        this.topProducts.sort((a, b) => a.positivePercentage - b.positivePercentage);
        break;
      case 'reviews-desc':
        this.topProducts.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }
  }

  // Add these methods

  getSentimentBorderClass(sentiment: string): string {
    if (!sentiment) return '';

    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes('positive')) {
      return 'border-success';
    } else if (lowerSentiment.includes('negative')) {
      return 'border-danger';
    } else {
      return 'border-warning';
    }
  }

  getSentimentBadgeClass(sentiment: string): string {
    if (!sentiment) return 'bg-secondary';

    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes('positive')) {
      return 'bg-success';
    } else if (lowerSentiment.includes('negative')) {
      return 'bg-danger';
    } else {
      return 'bg-warning text-dark';
    }
  }

  // Mock method - in a real app, you'd calculate this from actual dates
  getRelativeDate(): string {
    const times = ['Just now', '5 min ago', '10 min ago', '15 min ago', '1 hour ago', '2 hours ago', 'Yesterday'];
    const randomIndex = Math.floor(Math.random() * times.length);
    return times[randomIndex];
  }

  sortReviews(): void {
    switch (this.reviewSortOption) {
      case 'newest':
        // Sort by date if available
        this.reviewAnalyses.sort((a, b) => {
          if (!a.dateCreation || !b.dateCreation) return 0;
          return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime();
        });
        break;
      case 'oldest':
        // Sort by date if available
        this.reviewAnalyses.sort((a, b) => {
          if (!a.dateCreation || !b.dateCreation) return 0;
          return new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime();
        });
        break;
      case 'sentiment':
        // Sort positive first, then neutral, then negative
        this.reviewAnalyses.sort((a, b) => {
          const getSentimentScore = (sentiment: string): number => {
            if (!sentiment) return 0;
            const lowerSentiment = sentiment.toLowerCase();
            if (lowerSentiment.includes('positive')) return 2;
            if (lowerSentiment.includes('neutral')) return 1;
            return 0;
          };

          return getSentimentScore(b.sentiment) - getSentimentScore(a.sentiment);
        });
        break;
    }
  }

  getAgeGroup(age: number | undefined): string {
    if (age === undefined || age === null) return 'Unknown';

    if (age < 18) {
      return 'Under 18';
    } else if (age >= 18 && age <= 24) {
      return '18-24';
    } else if (age >= 25 && age <= 34) {
      return '25-34';
    } else if (age >= 35 && age <= 44) {
      return '35-44';
    } else if (age >= 45 && age <= 54) {
      return '45-54';
    } else {
      return '55+';
    }
  }

  renderCharts(): void {
    console.log('Attempting to render charts');
    console.log('sentimentChartRef:', this.sentimentChartRef);
    console.log('ageChartRef:', this.ageChartRef);

    // Destroy previous charts if they exist
    if (this.sentimentChart) {
      this.sentimentChart.destroy();
    }
    if (this.ageChart) {
      this.ageChart.destroy();
    }

    // Use the canvas references from ViewChild
    if (this.sentimentChartRef && this.sentimentChartRef.nativeElement) {
      const canvas = this.sentimentChartRef.nativeElement;
      console.log('Creating sentiment chart with data:', [this.positiveCount, this.neutralCount, this.negativeCount]);

      this.sentimentChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Positive', 'Neutral', 'Negative'],
          datasets: [{
            data: [this.positiveCount, this.neutralCount, this.negativeCount],
            backgroundColor: [
              'rgba(76, 175, 80, 0.8)',  // Green for positive
              'rgba(255, 193, 7, 0.8)',  // Amber for neutral
              'rgba(244, 67, 54, 0.8)'   // Red for negative
            ],
            borderColor: [
              'rgba(76, 175, 80, 1)',  // Green for positive
              'rgba(255, 193, 7, 1)',  // Amber for neutral
              'rgba(244, 67, 54, 1)'   // Red for negative
            ],
            borderWidth: 2,
            borderRadius: 5,
            hoverOffset: 15
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '75%',  // Make the doughnut hole larger for a more modern look
          plugins: {
            legend: {
              display: false,  // Hide legend since we have custom legend below
            },
            tooltip: {
              callbacks: {
                label: function(context:any) {
                  const label = context.label || '';
                  const value = context.raw as number;
                  const total = context.dataset.data.reduce((acc: number, data: number) => acc + data, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${value} (${percentage}%)`;
                }
              },
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              titleColor: '#333',
              bodyColor: '#666',
              borderColor: 'rgba(200, 200, 200, 0.5)',
              borderWidth: 1,
              padding: 10,
              boxPadding: 4,
              usePointStyle: true,
              bodyFont: {
                family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                size: 14
              }
            }
          },
          elements: {
            arc: {
              borderWidth: 0
            }
          },
          animation: {
            animateScale: true,
            animateRotate: true,
            duration: 2000,
            easing: 'easeOutQuart'
          }
        }
      });
    } else {
      console.error('Sentiment chart reference not available');
    }

    if (this.ageChartRef && this.ageChartRef.nativeElement) {
      const canvas = this.ageChartRef.nativeElement;
      console.log('Creating age chart with data:', Object.values(this.ageGroups));

      this.ageChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: Object.keys(this.ageGroups),
          datasets: [{
            label: 'Number of Reviews',
            data: Object.values(this.ageGroups),
            backgroundColor: '#3F51B5',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
            },
            title: {
              display: true,
              text: 'Age Distribution'
            }
          }
        }
      });
    } else {
      console.error('Age chart reference not available');
    }
  }

  getSentimentClass(sentiment: string): string {
    if (!sentiment) return '';

    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes('positive')) {
      return 'text-success';
    } else if (lowerSentiment.includes('negative')) {
      return 'text-danger';
    } else {
      return 'text-warning';
    }
  }

  filterSentimentByDate(period: string): void {
    // In a real app, you would filter data by date here
    // For now, just show a message
    this.toastr.info(`Filter applied: ${period}`);

    // You would normally filter the data and update the chart here
    // For demo purposes, we'll just reload the existing data
    setTimeout(() => this.renderCharts(), 100);
  }

  filterAgeByDate(period: string): void {
    // In a real app, you would filter data by date here
    // For now, just show a message
    this.toastr.info(`Filter applied: ${period}`);

    // You would normally filter the data and update the chart here
    // For demo purposes, we'll just reload the existing data
    setTimeout(() => this.renderCharts(), 100);
  }

  getPrimaryAgeGroup(): string {
    let maxCount = 0;
    let primaryGroup = '';

    Object.entries(this.ageGroups).forEach(([group, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryGroup = group;
      }
    });

    return primaryGroup || 'Unknown';
  }

  // Add these methods to your component class

  getProductCardClass(sentiment: string): string {
    if (!sentiment) return 'border-secondary';

    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes('positive')) {
      return 'border-success border-2';
    } else if (lowerSentiment.includes('negative')) {
      return 'border-danger border-2';
    } else {
      return 'border-warning border-2';
    }
  }

  getSentimentIcon(sentiment: string): string {
    if (!sentiment) return 'fa-question';

    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes('positive')) {
      return 'fa-smile-beam';
    } else if (lowerSentiment.includes('negative')) {
      return 'fa-frown';
    } else {
      return 'fa-meh';
    }
  }

  // Add this method to your component class

  formatDate(dateInput: Date | string | undefined): string {
    if (!dateInput) {
      return 'N/A';
    }

    try {
      // Convert to Date object if it's a string
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      // Format options for date display
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };

      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  }

  getSentimentLabel(sentiment: string): string {
    if (!sentiment) return 'Unknown';

    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes('positive')) {
      return 'Positive';
    } else if (lowerSentiment.includes('negative')) {
      return 'Negative';
    } else {
      return 'Neutral';
    }
  }
}
