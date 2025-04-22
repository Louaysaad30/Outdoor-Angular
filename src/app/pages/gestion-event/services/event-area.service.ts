import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventArea, EventAreaStatus, EventAreaApprovalDTO } from '../models/event-area.model';

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

createEventAreaWithImage(eventArea: EventArea, image: File): Observable<EventArea> {
  // Create FormData object
  const formData = new FormData();
  formData.append('image', image);

  // Construct URL with query parameters
  const url = `${this.apiUrl}/upload?name=${encodeURIComponent(eventArea.name)}&capacity=${eventArea.capacity}&latitude=${eventArea.latitude}&longitude=${eventArea.longitude}&description=${encodeURIComponent(eventArea.description)}`;

  // Get user ID from local storage
  const userId = this.getUserId();

  // Set headers with User-ID
  const headers = new HttpHeaders({
    'User-ID': userId.toString()
  });

  // Make the request
  return this.http.post<EventArea>(url, formData, { headers });
}

// Helper method to get current user ID
private getUserId(): number {
  const userJson = localStorage.getItem('user');
  if (userJson) {
    const user = JSON.parse(userJson);
    return user.id;
  }
  return 0; // Default or handle appropriately
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

  getPendingEventAreas(): Observable<EventArea[]> {
    return this.http.get<EventArea[]>(`${this.apiUrl}/pending`);
  }

  getRejectedEventAreas(): Observable<EventArea[]> {
    return this.http.get<EventArea[]>(`${this.apiUrl}/rejected`);
  }

  getApprovedEventAreas(): Observable<EventArea[]> {
    return this.http.get<EventArea[]>(`${this.apiUrl}/approved`);
  }

  approveEventArea(id: number): Observable<EventArea> {
    return this.http.post<EventArea>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectEventArea(id: number, rejectionMessage: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reject`, {
      message: rejectionMessage
    }, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  resetEventAreaStatus(id: number): Observable<EventArea> {
    const statusChangeDTO = {
      newStatus: 'PENDING',
      message: 'Status reset to pending by administrator'
    };

    return this.http.post<EventArea>(`${this.apiUrl}/${id}/change-status`, statusChangeDTO, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  getEventAreaWithUserDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/user`);
  }

  getEventsByEventArea(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/events`);
  }

  getEventAreasByUserId(userId: number): Observable<EventArea[]> {
    return this.http.get<EventArea[]>(`${this.apiUrl}/user/${userId}`);
  }
}
