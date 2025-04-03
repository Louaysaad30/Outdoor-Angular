import { Injectable } from '@angular/core';
              import { HttpClient } from '@angular/common/http';
              import { Post } from '../models/post.model';
              import { Observable, throwError } from 'rxjs';
              import { catchError, map } from 'rxjs/operators';
import {Media} from "../models/media.model";

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
                  formData.append('userId', post.userId?.toString() || '');

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

                // Get posts by user ID
                getUserPosts(userId: number): Observable<Post[]> {
                  return this.http.get<Post[]>(`${this.apiUrl}/user/${userId}`)
                    .pipe(
                      map((posts: Post[]) => posts.map((post: Post) => ({
                        ...post,
                        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()
                      }))),
                      catchError(error => {
                        console.error('Error fetching user posts:', error);
                        return throwError(() => new Error('Failed to load user posts. Please try again later.'));
                      })
                    );
                }


                // Add this method to post.service.ts

// Delete a post
                deletePost(postId: string): Observable<void> {
                  return this.http.delete<void>(`${this.apiUrl}/${postId}`).pipe(
                    catchError(error => {
                      console.error('Error deleting post:', error);
                      return throwError(() => new Error('Failed to delete post. Please try again later.'));
                    })
                  );
                }



                // Add this method to post.service.ts
                updatePost(
                  postId: string,
                  content: string,
                  mediaFiles?: File[],
                  mediaTypes?: string[],
                  mediaToDelete?: string[],
                  hasMedia?: boolean
                ): Observable<Post> {
                  const formData = new FormData();
                  formData.append('content', content || '');

                  if (hasMedia !== undefined) {
                    formData.append('hasMedia', hasMedia.toString());
                  }

                  if (mediaFiles && mediaFiles.length > 0) {
                    mediaFiles.forEach(file => {
                      formData.append('mediaFiles', file);
                    });
                  }

                  if (mediaTypes && mediaTypes.length > 0) {
                    mediaTypes.forEach(type => {
                      formData.append('mediaTypes', type);
                    });
                  }

                  if (mediaToDelete && mediaToDelete.length > 0) {
                    mediaToDelete.forEach(mediaId => {
                      formData.append('mediaToDelete', mediaId);
                    });
                  }

                  return this.http.put<Post>(`${this.apiUrl}/${postId}`, formData).pipe(
                    catchError(error => {
                      console.error('Error updating post:', error);
                      return throwError(() => new Error('Failed to update post. Please try again later.'));
                    })
                  );
                }
                 getUserMedia(userId: number): Observable<Media[]> {
                  return this.http.get<Media[]>(`${this.apiUrl}/${userId}/media`).pipe(
                    catchError(error => {
                      console.error('Error fetching user media:', error);
                      return throwError(() => new Error('Failed to load media'));
                    })
                  );
                }
                getPostById(postId: string): Observable<Post> {
                  return this.http.get<Post>(`${this.apiUrl}/${postId}`).pipe(
                    map((post: Post) => ({
                      ...post,
                      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()
                    })),
                    catchError(error => {
                      console.error('Error fetching post:', error);
                      return throwError(() => new Error('Failed to load post details.'));
                    })
                  );
                }

              }
