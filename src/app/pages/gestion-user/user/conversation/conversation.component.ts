import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { SimplebarAngularModule } from 'simplebar-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { ChatService } from '../../services/chat.service';
import { ChatMessage } from '../../models/chat-message';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    BsDropdownModule,
    FormsModule,
    SharedModule,
    SimplebarAngularModule,
  ],
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent implements OnInit, OnChanges {
  @Input() user: any; // Selected user for the conversation
  messages: ChatMessage[] = []; // Messages in the conversation
  messageText: string = ''; // Input message text
  currentUser: any; // Current logged-in user
  token: any; // Authentication token

  constructor(
    private chatService: ChatService,
    private websocket: WebsocketService
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.token = localStorage.getItem('authToken');
    console.log('Token:', this.token);

    this.connectToWebSocket();
    this.loadMessages();

    // Subscribe to WebSocket messages
    this.websocket.messages$.subscribe(message => {
      if (message) {
        console.log('Received message:', message);
        //this.messages.push(message); // Add the new message to the conversation
        this.loadMessages(); // Reload messages to ensure the view is updated
      }
    });
  }
  

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && !changes['user'].firstChange) {
      console.log('User input changed:', this.user);
      this.loadMessages(); // Load new messages for the new user
    }
  }

  
  loadMessages() {
    const senderId = this.currentUser.id;
    const recipientId = this.user.id;
  
    console.log('Loading messages for sender:', senderId, 'and recipient:', recipientId);
  
    this.chatService.getChatMessages(senderId, recipientId).subscribe((msgs: ChatMessage[]) => {
      console.log('Loaded messages:', msgs);
  
      // Ensure isRead is a boolean
      this.messages = msgs.map(msg => ({
        ...msg,
        isRead: !!msg.isRead
      }));
  
      // Mark messages as read if current user is the recipient
      this.messages.forEach(message => {
        if (this.currentUser.id === message.recipient && !message.isRead) {
          this.chatService.markMessageAsRead(message.id).subscribe(() => {
            message.isRead = true; // Update the UI
  
            // Emit messageRead event to server to notify sender
            this.websocket.stompClient?.publish({
              destination: '/app/readMessage', // Path where the server listens
              body: JSON.stringify({ messageId: message.id, senderId: this.currentUser.id })
            });
          });
        }
      });
    });
  }

  connectToWebSocket() {
    if (!this.token) {
      console.error('No authentication token found');
      return;
    }

    console.log('Connecting to WebSocket with token');
    this.websocket.connect(this.token, this.currentUser.id);
  }

  sendMessage(): void {
    if (!this.messageText.trim()) return;

    const content = this.messageText.trim();

    const payload = {
      sender: this.currentUser.id,
      recipient: this.user.id,
      content,
      timestamp: new Date().toISOString(),
    };

    console.log('Sending message:', payload);

    // Send the message via WebSocket
    this.websocket.sendMessage(payload);

    // Clear the input field
    this.messageText = '';
  }
}