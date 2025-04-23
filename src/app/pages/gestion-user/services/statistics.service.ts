import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private baseUrl = 'http://localhost:9096/statistics'; // Replace with your backend URL

  constructor(private http: HttpClient) {}

  // Get total users
  getTotalUsers(): Observable<{ totalUsers: number }> {
    return this.http.get<{ totalUsers: number }>(`${this.baseUrl}/total-users`);
  }

  // Get verified users
  getVerifiedUsers(): Observable<{ verifiedUsers: number }> {
    return this.http.get<{ verifiedUsers: number }>(`${this.baseUrl}/verified-users`);
  }

  // Get non-verified users
  getNonVerifiedUsers(): Observable<{ nonVerifiedUsers: number }> {
    return this.http.get<{ nonVerifiedUsers: number }>(`${this.baseUrl}/non-verified-users`);
  }

  // Get blocked users
  getBlockedUsers(): Observable<{ blockedUsers: number }> {
    return this.http.get<{ blockedUsers: number }>(`${this.baseUrl}/blocked-users`);
  }

  // Get non-blocked users
  getNonBlockedUsers(): Observable<{ nonBlockedUsers: number }> {
    return this.http.get<{ nonBlockedUsers: number }>(`${this.baseUrl}/non-blocked-users`);
  }

  // Get users by role
  getUsersByRole(): Observable<{ usersByRole: Record<string, number> }> {
    return this.http.get<{ usersByRole: Record<string, number> }>(`${this.baseUrl}/users-by-role`);
  }

  // Get total messages
  getTotalMessages(): Observable<{ totalMessages: number }> {
    return this.http.get<{ totalMessages: number }>(`${this.baseUrl}/total-messages`);
  }

  // Get unread messages
  getUnreadMessages(): Observable<{ unreadMessages: number }> {
    return this.http.get<{ unreadMessages: number }>(`${this.baseUrl}/unread-messages`);
  }

  // Get messages by user
  getMessagesByUser(): Observable<{ messagesByUser: Record<number, number> }> {
    return this.http.get<{ messagesByUser: Record<number, number> }>(`${this.baseUrl}/messages-by-user`);
  }

  // Get messages by chat room
  getMessagesByChatRoom(): Observable<{ messagesByChatRoom: Record<number, number> }> {
    return this.http.get<{ messagesByChatRoom: Record<number, number> }>(`${this.baseUrl}/messages-by-chat-room`);
  }
}