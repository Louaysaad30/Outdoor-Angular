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

  createEventAreaWithImage(eventArea: EventArea, imageFile: File): Observable<EventArea> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', eventArea.name);
    formData.append('capacity', eventArea.capacity.toString());
    formData.append('latitude', eventArea.latitude.toString());
    formData.append('longitude', eventArea.longitude.toString());
    formData.append('description', eventArea.description);

    return this.http.post<EventArea>(`${this.apiUrl}/upload`, formData);
  }

  updateEventArea(id: number, eventArea: EventArea, imageFile?: File): Observable<EventArea> {
    const formData = new FormData();
    if (imageFile) {
      formData.append('image', imageFile);
    }
    formData.append('name', eventArea.name);
    formData.append('capacity', eventArea.capacity.toString());
    formData.append('latitude', eventArea.latitude.toString());
    formData.append('longitude', eventArea.longitude.toString());
    formData.append('description', eventArea.description);

    return this.http.put<EventArea>(`${this.apiUrl}/${id}/update`, formData);
  }

  deleteEventArea(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
