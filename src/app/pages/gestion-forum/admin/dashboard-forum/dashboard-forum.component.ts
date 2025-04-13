// typescript
import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import * as ApexCharts from 'apexcharts';
import { Store } from '@ngrx/store';
import { fetchfeedbackdataData, fetchpropertydataData, fetchrentproprtydataData, fetchsalepropertydataData } from 'src/app/store/RealEstate/realEstate.action';
import { selectData, selectfeedData, selectrentData, selectsaleData } from 'src/app/store/RealEstate/realEstate-selector';
import { StatisticsService } from '../../services/statistics.service';
import {PostService} from "../../services/post.service";
import {Post} from "../../models/post.model";

@Component({
  selector: 'app-dashboard-forum',
  templateUrl: './dashboard-forum.component.html',
  styleUrls: ['./dashboard-forum.component.scss'],
  providers: [DecimalPipe]
})
export class DashboardForumComponent implements OnInit {

  breadCrumbItems!: Array<{}>;
  saleChart: any;
  rentChart: any;
  visitorsChart: any;
  residencypropertyChart: any;
  propertytypeChart: any;

  propertylist: any;
  feedbackData: any;
  salepropertyData: any;
  rentpropertyData: any;
  currentDate: any;
  currentTab = 'sale';

  todayStats: { postsToday: number; commentsToday: number; reactionsToday: number; mediaToday: number } | null = null;

  direction: any = 'asc';
  sortKey: any = '';
  sortValue: any = 'Property Name';



  constructor(
    public store: Store,
    private statsService: StatisticsService,
    private postService: PostService,

  ) {
    const today = new Date();
    this.currentDate = { from: today, to: today };
    this.selectedDate = today; // Also initialize selectedDate

  }

  // Add these properties to your DashboardForumComponent class
  totalPosts: number = 0;
  totalComments: number = 0;
  totalMedia: number = 0;
  totalReactions: number = 0;

  // Add this method to your DashboardForumComponent class
  loadTotalStats(): void {
    this.statsService.getTotalStatistics().subscribe(
      (stats) => {
        this.totalPosts = stats.totalPosts;
        this.totalComments = stats.totalComments;
        this.totalMedia = stats.totalMedia;
        this.totalReactions = stats.totalReactions;
      },
      (error) => {
        console.error("Error loading total statistics:", error);
      }
    );
  }
  // Add property to store trend data
  weeklyTrends: {
    posts: { percentage: number; isPositive: boolean },
    comments: { percentage: number; isPositive: boolean },
    reactions: { percentage: number; isPositive: boolean },
    media: { percentage: number; isPositive: boolean }
  } | null = null;

  // Add method to load weekly trends
  loadWeeklyTrends(): void {
    this.statsService.getWeeklyTrends().subscribe(
      (trends) => {
        this.weeklyTrends = trends;
      },
      (error) => {
        console.error('Error loading weekly trends:', error);
      }
    );
  }

  // Add property to store top rated posts
  topRatedPosts: any[] = [];

  // Add method to load top rated posts
  loadTopRatedPosts(): void {
    this.postService.getTopRatedPosts().subscribe(
      (posts) => {
        this.topRatedPosts = posts;
        console.log('Top rated posts:', posts);
      },
      (error) => {
        console.error('Error loading top rated posts:', error);
      }
    );
  }

// Nouvelle propriété pour stocker les posts récents
recentPosts: Post[] = [];

// Méthode pour charger les posts récents
loadRecentPosts(): void {
  this.postService.getPosts().subscribe(
    (posts) => {
      // Sort by date (most recent first) and handle undefined `createdAt`
      this.recentPosts = posts.sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      ).slice(0, 6); // Take only the first 6 posts
    },
    (error) => {
      console.error('Error loading recent posts:', error);
    }
  );
}

  ngOnInit(): void {
    this.loadRecentPosts();


    this.loadCurrentDayStats();

    // BreadCrumb
    this.breadCrumbItems = [
      { label: 'Dashboards' },
      { label: 'Real Estate', active: true }
    ];

    this._saleChart('["--tb-primary"]');
    this._rentChart('["--tb-warning"]');
    this._visitorsChart('["--tb-secondary"]');
    this._residencypropertyChart('["--tb-success"]');

    // Store data
    this.store.dispatch(fetchpropertydataData());
    this.store.select(selectData).subscribe((data) => {
      this.propertylist = data;
    });
    this.store.dispatch(fetchfeedbackdataData());
    this.store.select(selectfeedData).subscribe((data) => {
      this.feedbackData = data;
    });
    this.store.dispatch(fetchsalepropertydataData());
    this.store.select(selectsaleData).subscribe((data) => {
      this.salepropertyData = data;
    });
    this.store.dispatch(fetchrentproprtydataData());
    this.store.select(selectrentData).subscribe((data) => {
      this.rentpropertyData = data;
    });

    // Load statistics for today and update the chart when stats arrive.
    this.loadTodayStats();
    this.loadTotalStats();
    this.loadWeeklyTrends();
    this.loadTopRatedPosts();



  }

  // Improved loadCurrentDayStats with better error handling and loading indication
  loadCurrentDayStats(): void {
    const today = new Date();
    const formattedDate = this.formatDateForApi(today);

    // Initialize to false until data is loaded
    this.dataFound = false;

    this.statsService.getStatisticsByDate(formattedDate).subscribe(
      (result) => {
        this.todayStats = {
          postsToday: result.posts,
          commentsToday: result.comments,
          mediaToday: result.media,
          reactionsToday: result.reactions
        };

        // Now update charts with received data
        this._propertytypeChart('["--tb-primary","--tb-secondary","--tb-light","--tb-danger","--tb-success"]');

        // Also load hourly data for the same day
        this.onCalendarDateChange(today);
      },
      (error) => {
        console.error('Erreur lors du chargement des statistiques du jour:', error);
        this.dataFound = false; // Ensure we show "no data" message on error
      }
    );
  }

  // Load today's statistics using the StatisticsService and update chart after data is loaded.
  loadTodayStats(): void {
    this.statsService.getTodayStatistics().subscribe(
      (stats) => {
        this.todayStats = stats;
        this._propertytypeChart('["--tb-primary", "--tb-secondary", "--tb-light","--tb-danger", "--tb-success"]');
      },
      (error) => {
        console.error("Error loading today statistics:", error);
      }
    );
  }

  // Called when the user changes the date in the flatpickr input.
// typescript
// TypeScript in file `src/app/pages/gestion-forum/admin/dashboard-forum/dashboard-forum.component.ts`

// typescript
// typescript
onDateChange(newDate: any): void {
  if (!newDate) return;

  const formatLocalDate = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  if (newDate.from && newDate.to) {
    const startDate = formatLocalDate(new Date(newDate.from));
    const endDate = formatLocalDate(new Date(newDate.to));
    this.statsService.getDailyStatistics(startDate, endDate).subscribe(
      (data) => {
        // Sum daily values
        const totalPosts = Object.values(data.posts).reduce((sum, val) => sum + val, 0);
        const totalComments = Object.values(data.comments).reduce((sum, val) => sum + val, 0);
        const totalMedia = Object.values(data.media).reduce((sum, val) => sum + val, 0);
        const totalReactions = Object.values(data.reactions).reduce((sum, val) => sum + val, 0);

        // Update todayStats and refresh chart
        this.todayStats = {
          postsToday: totalPosts,
          commentsToday: totalComments,
          mediaToday: totalMedia,
          reactionsToday: totalReactions
        };
        this._propertytypeChart (`["--tb-primary","--tb-secondary","--tb-light","--tb-danger","--tb-success"]`);
      },
      (error) => console.error('Error fetching daily stats:', error)
    );
  } else if (newDate.from) {
    const singleDate = formatLocalDate(new Date(newDate.from));
    this.statsService.getStatisticsByDate(singleDate).subscribe(
      (result) => {
        // Update todayStats and refresh chart
        this.todayStats = {
          postsToday: result.posts,
          commentsToday: result.comments,
          mediaToday: result.media,
          reactionsToday: result.reactions
        };
        this._propertytypeChart(`["--tb-primary","--tb-secondary","--tb-light","--tb-danger","--tb-success"]`);
      },
      (error) => console.error('Error fetching single-date stats:', error)
    );
  }
}



  sortBy(column: any, value: any) {



    this.sortValue = value;
    this.onSort(column);
  }

  onSort(column: any): void {
    this.direction = this.direction === 'asc' ? 'desc' : 'asc';
    const sortedArray = [...this.propertylist];
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === 'asc' ? res : -res;
    });
    this.propertylist = sortedArray;
  }

  compare(v1: string | number, v2: string | number): number {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  changeTab(tab: string) {
    this.currentTab = tab;
  }

  private getChartColorsArray(colors: any) {
    colors = JSON.parse(colors);
    return colors.map(function (value: any) {
      var newValue = value.replace(" ", "");
      if (newValue.indexOf(",") === -1) {
        var color = getComputedStyle(document.documentElement).getPropertyValue(newValue);
        if (color) {
          color = color.replace(" ", "");
          return color;
        } else return newValue;
      } else {
        var val = value.split(',');
        if (val.length == 2) {
          var rgbaColor = getComputedStyle(document.documentElement).getPropertyValue(val[0]);
          rgbaColor = "rgba(" + rgbaColor + "," + val[1] + ")";
          return rgbaColor;
        } else {
          return newValue;
        }
      }
    });
  }

  private _saleChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.saleChart = {
      series: [80],
      chart: {
        width: 110,
        height: 110,
        type: 'radialBar',
        sparkline: { enabled: true }
      },
      plotOptions: {
        radialBar: {
          hollow: { margin: 0, size: '50%' },
          track: { margin: 0, background: colors, opacity: 0.2 },
          dataLabels: { show: false }
        }
      },
      grid: { padding: { top: -15, bottom: -15 } },
      stroke: { lineCap: 'round' },
      labels: ['Cricket'],
      colors: colors
    };
    const attributeToMonitor = 'data-theme';
    const observer = new MutationObserver(() => {
      this.reloadCharts();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [attributeToMonitor] });
  }

  reloadCharts() {
    this._saleChart('["--tb-primary"]');
    this._rentChart('["--tb-warning"]');
    this._visitorsChart('["--tb-secondary"]');
    this._residencypropertyChart('["--tb-success"]');
    this._propertytypeChart('["--tb-primary", "--tb-secondary", "--tb-light","--tb-danger", "--tb-success"]');

 this._propertysaleChart('["--tb-danger"]');
  }

  private _rentChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.rentChart = {
      series: [65],
      chart: {
        width: 110,
        height: 110,
        type: 'radialBar',
        sparkline: { enabled: true }
      },
      plotOptions: {
        radialBar: {
          hollow: { margin: 0, size: '50%' },
          track: { margin: 0, background: colors, opacity: 0.2 },
          dataLabels: { show: false }
        }
      },
      grid: { padding: { top: -15, bottom: -15 } },
      stroke: { lineCap: 'round' },
      labels: ['Cricket'],
      colors: colors
    };
  }

  private _visitorsChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.visitorsChart = {
      series: [47],
      chart: {
        width: 110,
        height: 110,
        type: 'radialBar',
        sparkline: { enabled: true }
      },
      plotOptions: {
        radialBar: {
          hollow: { margin: 0, size: '50%' },
          track: { margin: 0, background: colors, opacity: 0.2 },
          dataLabels: { show: false }
        }
      },
      grid: { padding: { top: -15, bottom: -15 } },
      stroke: { lineCap: 'round' },
      labels: ['Cricket'],
      colors: colors
    };
  }

  private _residencypropertyChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.residencypropertyChart = {
      series: [43],
      chart: {
        width: 110,
        height: 110,
        type: 'radialBar',
        sparkline: { enabled: true },
        redrawOnParentResize: true
      },
      plotOptions: {
        radialBar: {
          hollow: { margin: 0, size: '50%' },
          track: { margin: 0, background: colors, opacity: 0.2 },
          dataLabels: { show: false }
        }
      },
      grid: { padding: { top: -15, bottom: -15 } },
      stroke: { lineCap: 'round' },
      labels: ['Cricket'],
      colors: colors
    };
  }

// TypeScript

  dataFound = true; // new flag

  // ... constructor, ngOnInit, and other methods remain unchanged

  private _propertytypeChart(colors: any): void {
    colors = this.getChartColorsArray(colors);
    const stats = this.todayStats || { postsToday: 0, commentsToday: 0, mediaToday: 0, reactionsToday: 0 };
    const total =
      stats.postsToday +
      stats.commentsToday +
      stats.mediaToday +
      stats.reactionsToday;

    // Set flag depending on data availability
    this.dataFound = total > 0;

    // Only set up the chart configuration if data exists
    if (this.dataFound) {
      this.propertytypeChart = {
        tooltip: { trigger: 'item' },
        legend: {
          bottom: '0%',
          left: 'center',
          selectedMode: false,
          textStyle: { color: "#87888a" }
        },
        series: [
          {
            type: 'pie',
            radius: ['70%', '100%'],
            center: ['50%', '70%'],
            startAngle: 180,
            label: {
              color: "#87888a",
              formatter(param: any) {
                return `${param.name} `;
              }
            },
            itemStyle: { borderWidth: 4 },
            data: [
              { value: stats.postsToday, name: 'Post' },
              { value: stats.commentsToday, name: 'Comment' },
              { value: stats.mediaToday, name: 'Media' },
              { value: stats.reactionsToday, name: 'Reaction' },
              {
                value:
                  stats.postsToday +
                  stats.commentsToday +
                  stats.mediaToday +
                  stats.reactionsToday,
                itemStyle: {
                  color: 'none',
                  decal: { symbol: 'none' }
                },
                label: { show: false }
              }
            ]
          }
        ],
        color: colors
      };
    }
  }




  propertysaleChart: any;

  private _propertysaleChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

    // Exemple de données pour chaque heure (à remplacer par vos données réelles)
    const hourlyData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 50) + 10);

    this.propertysaleChart = {
      series: [{
        name: "Activité par heure",
        data: hourlyData}],
      chart: {
        height: 328,
        type: 'bar',
        toolbar: {
          show: false,
        }
      },
      colors: colors,
      plotOptions: {
        bar: {
          columnWidth: '30%',
          distributed: true,
          borderRadius: 5,
        }
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: false
      },
      xaxis: {
        type: 'category',
        categories: hours,
        title: {
          text: 'Heures de la journée'
        }
      },
      yaxis: {
        title: {
          text: 'Nombre d\'activités'
        }
      },
      tooltip: {
        y: {
          formatter: function (val : number) {
            return val + " activités"
          }
        }
      }
    }
  }




    // const attributeToMonitor = 'data-theme';

    // const observer = new MutationObserver(() => {
    //   this._propertysaleChart('["--tb-danger"]');
    // });
    // observer.observe(document.documentElement, {
    //   attributes: true,
    //   attributeFilter: [attributeToMonitor]
    // });


// In your component class
selectedDate: Date = new Date();

// Add to dashboard-forum.component.ts
peakHoursData: any = null;

onCalendarDateChange(event: Date) {
  console.log('Date selected:', event);
  this.selectedDate = event;

  // Format date as YYYY-MM-DD for API
  const formattedDate = this.formatDateForApi(event);

  this.statsService.getPeakHoursByDate(formattedDate).subscribe(
    (data) => {
      this.peakHoursData = data;
      this.updateChart(data);
    },
    (error) => {
      console.error('Error fetching peak hours data:', error);
    }
  );
}

formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

updateChart(data: any): void {
  // Use the same color array handling as in _propertysaleChart
  const colors = this.getChartColorsArray('["--tb-danger"]');
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  // Calculate total activity data
  const totalData: number[] = [];

  for (let i = 0; i < 24; i++) {
    const hourKey = i.toString();
    const hourData = data.hourlyBreakdown[hourKey] || { posts: 0, comments: 0, reactions: 0 };
    const total = hourData.posts + hourData.comments + hourData.reactions;
    totalData.push(total);
  }

  // Update chart configuration with the same styling as _propertysaleChart
  this.propertysaleChart = {
    series: [{
      name: "Activité par heure",
      data: totalData
    }],
    chart: {
      height: 328,
      type: 'bar',
      toolbar: {
        show: false,
      }
    },
    colors: colors,
    plotOptions: {
      bar: {
        columnWidth: '30%',
        distributed: true,
        borderRadius: 5,
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      show: false
    },
    xaxis: {
      type: 'category',
      categories: hours,
      title: {
        text: 'Heures de la journée'
      }
    },
    yaxis: {
      title: {
        text: 'Nombre d\'activités'
      }
    },
    tooltip: {
      y: {
        formatter: function(val: number) {
          return val + " activités";
        }
      }
    }
  };
}

// Méthode pour charger explicitement les données du jour courant
}


