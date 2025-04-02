import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = 'http://localhost:9093/api/files';

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(this.apiUrl + '/upload', formData, {
      responseType: 'text'  // Expect text response from server
    }).pipe(
      map(response => {
        if (!response) {
          throw new Error('No response from server');
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Upload error details:', error);
    let errorMessage = 'Upload failed: ';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage += error.error.message;
    } else {
      // Server-side error
      errorMessage += error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
