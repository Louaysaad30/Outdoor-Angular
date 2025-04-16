
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
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
export class ConversationComponent implements OnInit {

  @Input() user: any;
  messages: ChatMessage[] = [];
  messageText: string = '';
  currentUser: any = JSON.parse(localStorage.getItem('user') || '{}');

  constructor(
    private chatService: ChatService,
    private websocket: WebsocketService
  ) {}

  ngOnInit(): void {
    this.loadMessages();
    this.connectToWebSocket();

    this.websocket.onMessage().subscribe((incomingMessage: any) => {
      // Only push messages related to current conversation
      if (
        (incomingMessage.sender.id === this.user.id && incomingMessage.recipient.id === this.currentUser.id) ||
        (incomingMessage.sender.id === this.currentUser.id && incomingMessage.recipient.id === this.user.id)
      ) {
        this.messages.push({
          ...incomingMessage,
          timestamp: new Date(incomingMessage.timestamp)
        });
      }
    });
  }

  loadMessages() {
    const senderId = this.currentUser.id;
    const recipientId = this.user.id;

    this.chatService.getChatMessages(senderId, recipientId).subscribe((msgs: ChatMessage[]) => {
      this.messages = msgs;
    });
  }

  connectToWebSocket() {
    const token = this.currentUser.token;
    this.websocket.connect(token);
  }

  sendMessage(): void {
    if (!this.messageText.trim()) return;

    const content = this.messageText.trim();

    const payload = {
      sender: this.currentUser,
      recipient: this.user,
      content,
      timestamp: new Date().toISOString()
    };

    // Send via WebSocket
    this.websocket.sendMessage('/app/chat', payload);

    // Locally show message
    this.messages.push({
      ...payload,
      timestamp: new Date(payload.timestamp),
    });

    this.messageText = '';
  }
}
