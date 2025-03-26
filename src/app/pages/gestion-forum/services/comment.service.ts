// src/app/pages/gestion-forum/services/comment.service.ts
import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { ForumComment } from '../models/ForumComment.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = 'http://localhost:9090/comment'; // Your Spring Boot endpoint

  constructor(private http: HttpClient) { }

  addComment(postId: string, content: string, userId: number ): Observable<ForumComment> {
    // Using HttpParams to match the @RequestParam in Spring Boot
    const params = new HttpParams()
      .set('content', content)
      .set('userId', userId.toString());

    return this.http.post<ForumComment>(`${this.apiUrl}/${postId}`, null, { params });
  }
}
