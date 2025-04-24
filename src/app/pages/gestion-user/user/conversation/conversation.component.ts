import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, AfterViewChecked } from '@angular/core';
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
export class ConversationComponent implements OnInit, OnChanges, AfterViewInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
 
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
    this.scrollToBottom();


    this.websocket.messages$.subscribe(message => {
      if (message) {
        console.log('Received message:', message);
                this.loadMessages();
        // Mark as read if it's received by the current user
      }
    });
    this.websocket.messages$.subscribe(message => {
      if (message?.type === 'message-read') {
          // Update specific message
          const msg = this.messages.find(m => m.id === message.messageId);
          if (msg) {
              msg.isRead = true;
          }
      } else {
          // Handle other messages
          this.loadMessages();
      }
  });
  
  }
  ngAfterViewInit() {
    this.scrollToBottom();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }
   scrollToBottom(): void {
    if (this.myScrollContainer) {
      try {
        this.myScrollContainer.nativeElement.scrollTop =
          this.myScrollContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Scroll error:', err);
      }
    }
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
  
    this.chatService.getChatMessages(senderId, recipientId).subscribe((msgs: ChatMessage[]) => {
      this.messages = msgs.map(msg => ({
        ...msg,
        isRead: !!msg.isRead
      }));
  
      // Mark unread messages as read
      this.messages.forEach(message => {
        if (this.currentUser.id === message.recipient && !message.isRead) {
          this.chatService.markMessageAsRead(message.id).subscribe(() => {
            message.isRead = true;
            // Only send via websocket, don't mark again
            this.websocket.markMessageAsRead(message.id, this.currentUser.id);
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