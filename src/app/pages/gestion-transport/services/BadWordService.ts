import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BadWordService {
    private apiUrl = 'http://localhost:9095/api/bad-words';

    constructor(private http: HttpClient) { }

    filterContent(content: string): Observable<{ filteredContent: string, hasBadWords: boolean }> {
      return this.http.get<string[]>(this.apiUrl).pipe(
        map(badWords => {
          let hasBadWords = false;
          let filteredContent = content;
          
          badWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(content)) hasBadWords = true;
            filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
          });
          
          return { filteredContent, hasBadWords };
        }),
        catchError(error => {
          console.error('Error fetching bad words, using fallback list', error);
          // Fallback to default bad words if API fails
          const fallbackWords = ['merde', 'con', 'putain', 'shit', 'fuck', 
                                'asshole', 'bitch', 'damn', 'hell'];
          let hasBadWords = false;
          let filteredContent = content;
          
          fallbackWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(content)) hasBadWords = true;
            filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
          });
          
          return of({ filteredContent, hasBadWords });
        })
      );
    }
}