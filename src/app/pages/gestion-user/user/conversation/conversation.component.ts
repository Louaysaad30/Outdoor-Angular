import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { SimplebarAngularComponent, SimplebarAngularModule } from 'simplebar-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { ChatService } from '../../services/chat.service';
import { ChatMessage } from '../../models/chat-message';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';

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
export class ConversationComponent implements OnInit , OnChanges {
  
  @Input() user: any;
  messages: ChatMessage[] = [];
  messageText: string = '';
  currentUser: any ;
  token:any;
  constructor(
    private chatService: ChatService,
    private websocket: WebsocketService
  ) {}
  
  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.token=localStorage.getItem('authToken');
    console.log('token:', this.token);
    this.connectToWebSocket();
    this.loadMessages();
    this.websocket.messages$.subscribe(message => {
      if (message) {
        console.log('Received message:', message);
        // Log and add the received message to the array of messages
        console.log(`Message received from user ID ${message.sender}: ${message.content}`);
        this.messages.push(message);
        this.loadMessages();  // Reload messages to ensure the view is updated
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
      this.messages = msgs;
    });
    
  }
  
  connectToWebSocket() {
    if (!this.token) {
      console.error('No authentication token found');
      return;
    }
    
    console.log('Connecting to WebSocket with token');
    this.websocket.connect(this.token);
  }
  
  sendMessage(): void {
    if (!this.messageText.trim()) return;
    
    const content = this.messageText.trim();
    
    const payload = {
      sender: this.currentUser.id,
      recipient: this.user.id,
      content,
      timestamp: new Date().toISOString()
    };
    console.log('Sending message:', payload);
    // Send via WebSocket
    this.websocket.sendMessage(payload);
    
    // Clear the input
    this.messageText = '';
  }
}