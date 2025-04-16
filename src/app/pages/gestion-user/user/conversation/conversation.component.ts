import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges, OnInit } from '@angular/core';
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
 
  @Input() user: any; // The selected user to chat with
  messages: ChatMessage[] = [];
  messageText: string = '';

  constructor(private chatService: ChatService,private websocket:WebsocketService) {}
currentUser: any = JSON.parse(localStorage.getItem('user') || '{}');

ngOnInit(): void {
  this.websocket.onMessage().subscribe((incomingMessage: any) => {
    // Vérifie que le message reçu vient de l'utilisateur actuellement sélectionné
    if (incomingMessage.sender.id === this.user.id || incomingMessage.recipient.id === this.user.id) {
      // Log the received message
      console.log("Received Message:", incomingMessage);

      // Add the incoming message to the list
      this.messages.push({
        ...incomingMessage,
        timestamp: new Date(incomingMessage.timestamp)
      });

      // Log the updated messages list
      console.log("Updated Messages List After Receiving:", this.messages);
    }
  });

  this.loadMessages();
  this.connectToWebSocket(); // Connect to WebSocket on init
}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && !changes['user'].firstChange) {
      this.loadMessages(); // Recharger messages pour le nouvel utilisateur
    }
  }
  
  loadMessages() {
    // Load the chat messages for the selected user
    const senderId = JSON.parse(localStorage.getItem('user') || '{}').id;
    const recipientId = this.user.id;

    this.chatService.getChatMessages(senderId, recipientId).subscribe((msgs: ChatMessage[]) => {
      this.messages = msgs;
    });
  }

  
  connectToWebSocket() {
    const token = this.currentUser.token; // Assuming JWT token is stored in the user object
    this.websocket.connect(token);
  }
  sendMessage(): void {
    if (!this.messageText.trim()) return;
  
    const senderId = this.currentUser.id;
    const recipientId = this.user.id;
    const content = this.messageText.trim();
  
    // Prepare the message payload
    const payload = {
      sender: { id: senderId },
      recipient: { id: recipientId },
      content,
      timestamp: new Date().toISOString()
    };
  
    // Send the message via WebSocket
    this.websocket.sendMessage('/app/chat', payload);
  
    // Log the sent message
    console.log("Sent Message:", payload);
  
    // Locally add the sent message to the messages list
    this.messages.push({
      ...payload,
      timestamp: new Date(payload.timestamp), // Convert string to Date object
      sender: { id: senderId },
      recipient: { id: recipientId }
    });
  
    // Log the updated list of messages
    console.log("Updated Messages List:", this.messages);
  
    this.messageText = ''; // Reset message input
  }
  
}
