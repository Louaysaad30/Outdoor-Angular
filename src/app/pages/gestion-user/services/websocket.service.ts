import { Injectable } from '@angular/core';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../models/chat-message';
import { User } from 'src/app/store/Authentication/auth.models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  constructor(private route: Router) { }
  stompClient: Client | null = null;

  private messageSubject = new BehaviorSubject<any>(null);
  public messages$ = this.messageSubject.asObservable();
  private connectionSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionSubject.asObservable();
  public connectedUsersSubject = new BehaviorSubject<any[]>([]);
  public connectedUsers$ = this.connectedUsersSubject.asObservable();

  connect(token: any, userId: any) {
    const socket = new SockJS('http://localhost:9096/ws');

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        'userId': userId.toString(),
        'X-Client-Type': 'angular'
      }
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket server');
      this.connectionSubject.next(true);
      this.sendOnlineStatus(userId);
      // WebSocketService: Add a subscription to the notifications channel
     // In your connect method
      // In your connect() method, add this subscription:
      this.stompClient?.subscribe('/queue/read-receipts', (message) => {
        const receipt = JSON.parse(message.body);
        console.log('Read receipt received:', receipt);
        this.messageSubject.next({
            type: 'message-read',
            messageId: receipt.messageId
        });
      });      
      

      this.stompClient?.subscribe('/queue/messages', (message) => {
        console.log('Received message:', message.body);
        this.messageSubject.next(JSON.parse(message.body));
      });

      this.stompClient?.subscribe('/topic/connected-users', (message) => {
        const users = JSON.parse(message.body);
        this.connectedUsersSubject.next(users);
      });
    };

    this.stompClient.onDisconnect = (frame) => {
      this.connectionSubject.next(false);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.stompClient.activate();
  }

  sendMessage(payload: any) {
    if (this.stompClient && this.stompClient.connected) {
      console.log(`Message sent by ${payload.sender} to ${payload.recipient}: ${payload.content}`);
      this.stompClient.publish({
        destination: '/app/chat',
        body: JSON.stringify(payload)
      });
      console.log('Message sent:', payload);
    } else {
      console.error('WebSocket is not connected. Unable to send message.');
    }
  }

  sendOnlineStatus(userId: number) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/user.online',
        body: JSON.stringify({ userId })
      });
    }
  }

  sendOfflineStatus(userId: any) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/user.offline',
        body: JSON.stringify({ userId })
      });
    } else {
      console.warn('Cannot send offline status: STOMP client not connected');
    }
  }

  disconnect(user: any) {
    // ✅ First send the offline status if connected
    this.sendOfflineStatus(user);
    console.log('User is offline:', user);

    setTimeout(() => {
      this.stompClient?.deactivate(); // Then deactivate
      this.connectionSubject.next(false);
      console.log('WebSocket disconnected');
      this.route.navigate(['/auth/logout']);
    }, 1000); // Give it some time to send the message

  }
  markMessageAsRead(messageId: number, senderId: number) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/readMessage',
        body: JSON.stringify({ messageId, senderId })
      });

    } else {
      console.error('WebSocket is not connected. Unable to mark message as read.');
    }
  }
  
}
