// src/app/services/event-area.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventArea } from '../models/event-area.model';

@Injectable({
  providedIn: 'root'
})
export class EventAreaService {
  private apiUrl = 'http://localhost:9091/api/eventareas';

  constructor(private http: HttpClient) { }

  getAllEventAreas(): Observable<EventArea[]> {
    return this.http.get<EventArea[]>(this.apiUrl);
  }

  getEventAreaById(id: number): Observable<EventArea> {
    return this.http.get<EventArea>(`${this.apiUrl}/${id}`);
  }

  createEventArea(eventArea: EventArea): Observable<EventArea> {
    return this.http.post<EventArea>(this.apiUrl, eventArea);
  }

  updateEventArea(id: number, eventArea: EventArea): Observable<EventArea> {
    return this.http.put<EventArea>(`${this.apiUrl}/${id}`, eventArea);
  }

  deleteEventArea(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
