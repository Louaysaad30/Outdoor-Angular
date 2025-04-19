import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatRoom } from '../models/chat-room';
import { ChatMessage } from '../models/chat-message';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  
  private baseUrl = 'http://localhost:9096/ws'; // adjust if needed

  constructor(private http: HttpClient) {}

  // 1. Create chat room
  createChatRoom(senderId: number, recipientId: number): Observable<any> {
    const params = new HttpParams()
      .set('senderId', senderId.toString())
      .set('recipientId', recipientId.toString());
    return this.http.post(`${this.baseUrl}/create`, null, { params });
  }

  // 2. Check if chat room exists
  checkChatRoom(senderId: number, recipientId: number): Observable<any> {
    const params = new HttpParams()
      .set('senderId', senderId)
      .set('recipientId', recipientId);
    return this.http.get(`${this.baseUrl}/exists`, { params });
  }

  // 3. Get all chat rooms for a user
  getChatRoomsForUser(userId: number): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.baseUrl}/user/${userId}`);
  }

  // 4. Get messages between two users
  getChatMessages(senderId: number, recipientId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/messages/${senderId}/${recipientId}`);
  }


}
