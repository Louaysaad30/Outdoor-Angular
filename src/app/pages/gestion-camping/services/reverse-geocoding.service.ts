import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReverseGeocodingService {
  private apiKey = 'aa692e485492445abaa9864b6f0ef108 '; // Replace with your OpenCage API key

  constructor(private http: HttpClient) {}

  reverseGeocode(lat: number, lng: number): Observable<any> {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${this.apiKey}`;
    return this.http.get(url);
  }
}
