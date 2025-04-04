import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NlpService {
  private apiUrl = 'http://localhost:9091/api/events/nlp';

  constructor(private http: HttpClient) {}

  /**
   * Extract keywords from event description
   */
  extractKeywords(eventId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${eventId}/extract-keywords`, {});
  }

  /**
   * Preview text improvement without saving
   */
  previewImprovement(text: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/preview-improvement`, { text });
  }
}
