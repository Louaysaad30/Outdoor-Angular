import { Injectable } from '@angular/core';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Client | null = null;
  private readonly wsEndpoint = 'http://localhost:9096/ws';
  private readonly userTopic = '/user/queue/messages';
  private token: string = '';
  private isConnected = false;

  private messageSubject = new Subject<any>();

  connect(token: string): void {
    this.token = token;

    this.stompClient = new Client({
      brokerURL: undefined, // Use SockJS instead
      webSocketFactory: () => new SockJS(this.wsEndpoint),
      connectHeaders: {
        Authorization: `Bearer ${this.token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('✅ Connected to WebSocket');
        this.isConnected = true;
        this.subscribeToUserQueue();
      },
      onStompError: (frame) => {
        console.error('❌ STOMP Error:', frame);
      },
      onWebSocketError: (error) => {
        console.error('❌ WebSocket Error:', error);
      }
    });

    this.stompClient.activate();
  }

  private subscribeToUserQueue(): void {
    if (!this.stompClient) return;

    this.stompClient.subscribe(this.userTopic, (message: IMessage) => {
      const body = JSON.parse(message.body);
      console.log('📥 Received message:', body);
      this.messageSubject.next(body);
    });
  }

  onMessage(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  sendMessage(destination: string, payload: any): void {
    if (this.stompClient && this.isConnected) {
      this.stompClient.publish({
        destination,
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      console.log('📤 Message sent:', payload);
    } else {
      console.warn('❌ WebSocket not connected. Message not sent.');
    }
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.deactivate();
      this.isConnected = false;
      console.log('🔌 Disconnected from WebSocket');
    }
  }
}