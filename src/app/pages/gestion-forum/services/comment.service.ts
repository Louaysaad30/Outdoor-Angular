// src/app/pages/gestion-forum/services/comment.service.ts
import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { ForumComment } from '../models/ForumComment.model';
import { environment } from 'src/environments/environment';
import {catchError} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = 'http://localhost:9090/comment'; // Your Spring Boot endpoint
  private handleError: any;

  constructor(private http: HttpClient) { }

// In comment.service.ts
  addComment(postId: string, content: string, userId: number): Observable<ForumComment> {
    const params = new HttpParams()
      .set('content', content)
      .set('userId', userId.toString());

    return this.http.post<ForumComment>(`${this.apiUrl}/${postId}`, null, { params })
      .pipe(
        catchError(error => {
          // Check if the error is related to inappropriate content
          if (error.status === 400 && error.error?.error?.includes('inappropriate language')) {
            // Return a custom error that can be detected in the component
            return throwError(() => 'Content Warning: The comment contains inappropriate language.');
          }
          return throwError(() => error);
        })
      );
  }
  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${commentId}`);
  }

  // In comment.service.ts
  editComment(commentId: string, content: string): Observable<ForumComment> {
    const params = new HttpParams().set('content', content);
    return this.http.put<ForumComment>(`${this.apiUrl}/${commentId}`, null, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  replyToComment(commentId: string, content: string, userId: number): Observable<ForumComment> {
    const params = new HttpParams()
      .set('content', content)
      .set('userId', userId.toString());

    return this.http.post<ForumComment>(`${this.apiUrl}/reply/${commentId}`, null, { params })
      .pipe(
        catchError(error => {
          // Check if the error is related to inappropriate content
          if (error.status === 400 && error.error?.error?.includes('inappropriate language')) {
            // Return a custom error that can be detected in the component
            return throwError(() => 'Content Warning: The comment contains inappropriate language.');
          }
          return throwError(() => error);
        })
      );
  }

  getTolevel(postId: string): Observable<ForumComment[]> {
    return this.http.get<ForumComment[]>(`${this.apiUrl}/top-level/${postId}`);
  }
}
