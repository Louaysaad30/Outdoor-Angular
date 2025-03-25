import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Post } from "../models/post.model";
import { Observable } from "rxjs";
import { Media } from "../models/media.model";

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = 'http://localhost:9090/post'; // Your Spring Boot endpoint

  constructor(private http: HttpClient) { }

  // Create a new post with multipart/form-data
  createPost(post: Post, mediaFiles?: File[]): Observable<Post> {
    const formData = new FormData();
    formData.append('content', post.content || '');
    formData.append('userId', post.userId?.toString() || '10');

    if (mediaFiles && mediaFiles.length > 0) {
      mediaFiles.forEach(file => {
        formData.append('mediaFiles', file);
      });
    }

    return this.http.post<Post>(`${this.apiUrl}/add`, formData);
  }

  // Get all posts
  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/all`);
  }

  // Get a single post by id
  getPostById(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/${id}`);
  }
}
