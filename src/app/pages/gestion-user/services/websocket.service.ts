import { Injectable } from '@angular/core';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../models/chat-message';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  stompClient: Client | null = null;  // STOMP client instance to handle WebSocket connection

  // Subject to manage the stream of incoming messages
  private messageSubject = new BehaviorSubject<any>(null);
  public messages$ = this.messageSubject.asObservable();  // Observable for components to subscribe to messages

  // Subject to track the connection status (connected/disconnected)
  private connectionSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionSubject.asObservable();

  
  connect (token:any){

    const socket = new SockJS('http://localhost:9096/ws');  // Initialize the SockJS WebSocket connection to the server

        this.stompClient = new Client({
          webSocketFactory: () => socket,
          reconnectDelay: 5000,
          debug: (str) => console.log(str),
          connectHeaders: {  // MUST include these
              Authorization: `Bearer ${token}`,
              'X-Client-Type': 'angular'  // Optional but helpful for debugging
          }
      });

      this.stompClient.onConnect = (frame) => {
          console.log('Connected to:', frame.headers['server']);  // Should show server info
          this.connectionSubject.next(true);
      };
      
      this.stompClient.onStompError = (frame) => {
          console.error('Connection error:', frame.headers['message']);
      };

    this.stompClient.onConnect = (frame) => {
        console.log('Connected to WebSocket server');
        this.connectionSubject.next(true);

          // Fix subscription path
        this.stompClient?.subscribe('/queue/messages', (message) => {
          console.log('Received message:', message.body);  // Log the received message
              this.messageSubject.next(JSON.parse(message.body)); 
          });
        };

    // Handle errors reported by the STOMP broker
    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);  // Log the error message
      console.error('Additional details: ' + frame.body);  // Log additional error details
    };
    
    this.stompClient?.activate();
  }

  sendMessage(payload: any) {
    if (this.stompClient && this.stompClient.connected) {
      // Log the message being sent and the sender
      console.log(`Message sent by ${payload.sender} to ${payload.recipient}: ${payload.content}`);

      // Publish (send) the message to the '/app/chat.sendMessage' destination
      this.stompClient.publish({
        destination: '/app/chat',
        body: JSON.stringify(payload)  // Convert the message to JSON and send
      });
    } else {
      // Log an error if the WebSocket connection is not active
      console.error('WebSocket is not connected. Unable to send message.');
    }

  }

  disconnect(){
    if (this.stompClient) {
      this.stompClient.deactivate();  // Deactivate the WebSocket connection
    }
  }
  
}