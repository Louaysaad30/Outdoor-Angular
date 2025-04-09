import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Event, Status} from '../models/event.model';
import {catchError} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:9091/api/events';

  constructor(private http: HttpClient) {}

  createEvent(formData: FormData): Observable<Event> {
      return this.http.post<Event>(`${this.apiUrl}/create`, formData);
    }

  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl);
  }

  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  updateEvent(id: number, eventData: any, imageFile?: File): Observable<Event> {
    const formData = new FormData();

    // Always include all required fields
    formData.append('title', eventData.title || '');
    formData.append('description', eventData.description || '');
    formData.append('startDate', eventData.startDate || '');
    formData.append('endDate', eventData.endDate || '');
    formData.append('status', eventData.status || '');
    formData.append('eventAreaId', eventData.eventArea?.id?.toString() || '');

    // Add image only if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http.put<Event>(`${this.apiUrl}/${id}/update`, formData);
  }
  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
