// language: typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = 'http://localhost:9090/statistics';

  constructor(private http: HttpClient) {}

  getTodayStatistics(): Observable<{ postsToday: number; commentsToday: number; reactionsToday: number; mediaToday: number }> {
    return this.http.get<{ postsToday: number; commentsToday: number; reactionsToday: number; mediaToday: number }>(`${this.apiUrl}/today`);
  }

  getStatisticsByDate(date: string): Observable<{ posts: number; comments: number; reactions: number; media: number }> {
    return this.http.get<{ posts: number; comments: number; reactions: number; media: number }>(`${this.apiUrl}/by-date?date=${date}`);
  }

  getDailyStatistics(startDate: string, endDate: string): Observable<{
    posts: { [date: string]: number };
    comments: { [date: string]: number };
    reactions: { [date: string]: number };
    media: { [date: string]: number }
  }> {
    return this.http.get<{ posts: { [date: string]: number }; comments: { [date: string]: number }; reactions: { [date: string]: number }; media: { [date: string]: number } }>(
      `${this.apiUrl}/daily?startDate=${startDate}&endDate=${endDate}`
    );
  }

  // Add this to statistics.service.ts
  getTotalStatistics(): Observable<{ totalPosts: number; totalComments: number; totalReactions: number; totalMedia: number }> {
    return this.http.get<{ totalPosts: number; totalComments: number; totalReactions: number; totalMedia: number }>(`${this.apiUrl}/total`);
  }

getWeeklyTrends(): Observable<{
  posts: { percentage: number; isPositive: boolean },
  comments: { percentage: number; isPositive: boolean },
  reactions: { percentage: number; isPositive: boolean },
  media: { percentage: number; isPositive: boolean }
}> {
  return this.http.get<any>(`${this.apiUrl}/weekly-trends`).pipe(
    map(response => {
      console.log('Weekly trends response:', response);

      return {
        posts: {
          percentage: Math.abs(response.posts?.percentageChange || 0),
          isPositive: response.posts?.increased || false
        },
        comments: {
          percentage: Math.abs(response.comments?.percentageChange || 0),
          isPositive: response.comments?.increased || false
        },
        reactions: {
          percentage: Math.abs(response.reactions?.percentageChange || 0),
          isPositive: response.reactions?.increased || false
        },
        media: {
          percentage: Math.abs(response.media?.percentageChange || 0),
          isPositive: response.media?.increased || false
        }
      };
    }),
    catchError(error => {
      console.error('Error fetching weekly trends:', error);
      return throwError(() => error);
    })
  );
}



// Add to statistics.service.ts
getPeakHoursByDate(date: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/peak-hours-by-date?date=${date}`);
}
}
