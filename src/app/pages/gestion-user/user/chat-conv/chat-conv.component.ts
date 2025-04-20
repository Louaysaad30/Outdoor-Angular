import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { cloneDeep } from 'lodash';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { SimplebarAngularModule } from 'simplebar-angular';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { SharedModule } from 'src/app/shared/shared.module';
import { fetchattachmentData, fetchbookmarkData, fetchcallsData, fetchchannnelData, fetchchatData, fetchcontactData, fetchmessagesData } from 'src/app/store/chat/chat.action';
import { selectattachmentData, selectbookmarkData, selectcallData, selectcallslistData, selectchannelData, selectcontactData, selectData } from 'src/app/store/chat/chat.selector';
import { UserServiceService } from 'src/app/account/auth/services/user-service.service';
import { ChatService } from '../../services/chat.service';
import { UserListComponent } from "../user-list/user-list.component";
import { ConversationComponent } from "../conversation/conversation.component";
import { ChatMessage } from '../../models/chat-message';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-chat-conv',
  standalone: true,
  imports: [
    PickerModule,
    CommonModule,
    TabsModule,
    BsDropdownModule,
    FormsModule,
    SimplebarAngularModule,
    ReactiveFormsModule,
    SharedModule,
    NgSelectModule,
    SharedModule,
    UserListComponent,
    ConversationComponent
],
  providers: [DatePipe] ,
//  
  templateUrl: './chat-conv.component.html',
  styleUrl: './chat-conv.component.scss'
})
export class ChatConvComponent implements OnDestroy  {
    private subscriptions = new Subscription();
    channeldata: any
    contactData: any
    chatData: any
    searchText: any;
    searchMsgText: any;
    formData!: UntypedFormGroup;
    usermessage!: string;
    isFlag: boolean = false;
    submitted = false;
    isStatus = 'online';
    isProfile: string = 'assets/images/users/48/avatar-2.jpg';
    username: any = 'Lisa Parker';
    messageData: any
    images: { src: string; thumb: string; caption: string }[] = [];
    isreplyMessage = false;
    emoji = '';
    currentTab = 'chats';
    showChatContent = true;
    showVideoContent = false;
    running = true;
    chatTime = 0;
    formattedTime = '00:00:00';
    timerId: any;

    @ViewChild('scrollRef') scrollRef: any;
    attachementsData: any;
    callsData: any;
    bookmarkData: any;
    users: any[] = [];
    selectedUser:any;
    currentUser: any;
    messages: ChatMessage[] | undefined;
    constructor(    private websocketService: WebsocketService
,        private userService: UserServiceService, private chatService: ChatService,public formBuilder: UntypedFormBuilder, private datePipe: DatePipe, public store: Store) { }

    ngOnInit(): void {
      this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log("Utilisateur connecté :", this.currentUser.id);
        // Chat Data Get Function
        // Validation
        this.formData = this.formBuilder.group({
            message: ['', [Validators.required]],
        });
        const token = localStorage.getItem('authToken');
        if (token) {
          this.websocketService.connect(token, this.currentUser.id);
        }
        this.subscriptions.add(
            this.websocketService.connectedUsers$.subscribe(connectedUsers => {
              console.log('Received connected users:', connectedUsers);
              this.updateUserStatuses(connectedUsers);
            })
          );
          this.loadUsers();

    }
  
    loadUsers() {
        this.userService.getUsersWithConversations(this.currentUser.id).subscribe((res) => {
          this.users = res;
          console.log('Initial users loaded:', this.users);
          
          // After loading users, check if we have any connected users data
          if (this.websocketService.connectedUsersSubject.value.length > 0) {
            this.updateUserStatuses(this.websocketService.connectedUsersSubject.value);
          }
        });
      }
      
    
    selectUser(user: any): void {
        if (this.selectedUser === user) {
        return;  // Do nothing if the same user is clicked again
        }
        this.selectedUser = user;
        console.log('Utilisateur sélectionné:', user);
        this.loadChatForUser(user);
    }
    
    updateUserStatuses(connectedUsers: any[]) {
        console.log('Updating user statuses with:', connectedUsers);
        
        // Create a map of connected user IDs for quick lookup
        const connectedUserIds = new Set(connectedUsers.map(u => u.id));
        
        // Update the status for each user
        this.users = this.users.map(user => {
          return {
            ...user,
            etat: connectedUserIds.has(user.id) ? 'ONLINE' : 'OFFLINE'
          };
        });
        
        console.log('Updated users list:', this.users);
      }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.websocketService.disconnect(this.currentUser.id);
  }
    loadChatForUser(user: any): void {
        // Fetch and load messages for the selected user
        const senderId = this.currentUser.id;
        const recipientId = user.id;
    
        this.chatService.checkChatRoom(senderId, recipientId).subscribe({
            next: (room) => {
            this.loadMessages(room);
            console.log('Room:', room, 'Sender:', senderId, 'Recipient:', recipientId);
            },
            error: (err) => {
            console.error('Error checking chat room:', err);
            }
        });
        
    }
  
    loadMessages( chatRoomId: number) {

        this.chatService.getMessagesByChatRoomId(chatRoomId).subscribe((msgs: ChatMessage[]) => {
        this.messages = msgs;
        });
    }
  
    openConversation(user: any): void {
      this.chatService.getChatRoomsForUser(user.id).subscribe(conversation => {
        console.log('Conversation ouverte :', conversation);
        // ici tu peux passer la conversation à une fenêtre de chat
      });
    }


    closeoffcanvas() {
        document.querySelector('.chat-detail')?.classList.remove('show')
        document.querySelector('.backdrop1')?.classList.remove('show')
    }

    openEnd() {
        document.querySelector('.chat-detail')?.classList.add('show')
        document.querySelector('.backdrop1')?.classList.add('show')
    }

    // Change Tab Content
    changeTab(tab: string) {
        this.currentTab = tab;
    }

    /**
     * 
   * Returns form
   */
    get form() {
        return this.formData.controls;
    }

  

    onListScroll() {
        if (this.scrollRef !== undefined) {
            setTimeout(() => {
                this.scrollRef.SimpleBar.getScrollElement().scrollTop = this.scrollRef.SimpleBar.getScrollElement().scrollHeight;
            }, 500);
        }
    }
    // File Upload
    imageURL: any;
    fileChange(event: any) {
        this.imageURL = ''
        let fileList: any = (event.target as HTMLInputElement);
        let file: File = fileList.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            this.imageURL = reader.result as string;
        }
    }
    /**
   * Save the message in chat
   */
    messageSave() {
        const message = this.formData.get('message')!.value;
        if (this.isreplyMessage == true) {
            var itemReplyList: any = document.getElementById("users-chat")?.querySelector(".chat-conversation-list");
            var dateTime = this.datePipe.transform(new Date(), "h:mm a");
            var chatReplyUser = (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .conversation-name") as HTMLAreaElement).innerHTML;
            var chatReplyMessage = (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .mb-0") as HTMLAreaElement).innerText;

            this.messageData.push({
                isSender: true,
                sender: 'Marcus',
                replayName: chatReplyUser,
                replaymsg: chatReplyMessage,
                message,
                createdAt: dateTime,
            });

        }
        else {
            if (this.formData.valid && message) {
                // Message Push in Chat
                this.messageData.push({
                    id: this.messageData.length + 1,
                    isSender: true,
                    sender: 'Marcus',
                    message,
                    image: this.imageURL,
                    createdAt: this.datePipe.transform(new Date(), "h:mm a"),
                });
            }
            if (this.imageURL) {
                // Message Push in Chat
                this.messageData.push({
                    id: this.messageData.length + 1,
                    isSender: true,
                    sender: 'Marcus',
                    image: this.imageURL,
                    createdAt: this.datePipe.transform(new Date(), "h:mm a"),
                });
            }
        }
        document.querySelector('.replyCard')?.classList.remove('show');
        (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .mb-0") as HTMLAreaElement).innerHTML = '';
        (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .conversation-name") as HTMLAreaElement).innerHTML = '';
        this.isreplyMessage = false;
        this.emoji = '';
        this.imageURL = '';

        this.onListScroll();
        // Set Form Data Reset
        this.formData = this.formBuilder.group({
            message: null,
        });
        this.formData.reset();
    }

    // Emoji Picker
    showEmojiPicker = false;
    sets: any = [
        'native',
        'google',
        'twitter',
        'facebook',
        'emojione',
        'apple',
        'messenger'
    ]
    set: any = 'twitter';
    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    addEmoji(event: any) {
        const { emoji } = this;
        const text = `${emoji}${event.emoji.native}`;
        this.emoji = text;
        this.showEmojiPicker = false;
    }

    /***
    * OnClick User Chat show
    */
    chatUsername(name: string, image: any, event: any) {
        const li = document.querySelectorAll('#userList')
        li.forEach((item: any) => {
            item.classList.remove('active')
        })
        event.target.closest('li').classList.add('active')
        this.isFlag = true;
        this.username = name;
        const currentDate = new Date();
        this.isStatus = status;
        this.isProfile = image ? image : 'assets/images/users/user-dummy-img.jpg';
        // this.messageData.map((chat) => { if (chat.image) { chat.profile = this.isProfile } });
        const userChatShow = document.querySelector('.user-chat');
        if (userChatShow != null) {
            userChatShow.classList.add('user-chat-show');
        }
    }

    // Copy Message
    copyMessage(event: any) {
        navigator.clipboard.writeText(event.target.closest('.chat-list').querySelector('.ctext-content').innerHTML);
        (document.getElementById("copyClipBoard") as HTMLElement).style.display = "block";
        setTimeout(() => {
            (document.getElementById("copyClipBoard") as HTMLElement).style.display = "none";
        }, 1000);
    }

    // Delete Message
    deleteMessage(event: any) {
        event.target.closest('.chat-list').remove();
    }

    // Replay Message
    replyMessage(event: any, align: any) {
        this.isreplyMessage = true;
        document.querySelector('.replyCard')?.classList.add('show');
        var copyText = event.target.closest('.chat-list').querySelector('.ctext-content').innerHTML;
        (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .mb-0") as HTMLAreaElement).innerHTML = copyText;
        var msgOwnerName: any = event.target.closest(".chat-list").classList.contains("right") == true ? 'You' : document.querySelector('.username')?.innerHTML;
        (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .conversation-name") as HTMLAreaElement).innerHTML = msgOwnerName;
    }

    closeReplay() {
        document.querySelector('.replyCard')?.classList.remove('show');
    }

    // Delete All Message
    deleteAllMessage(event: any) {
        var allMsgDelete: any = document.getElementById('users-conversation')?.querySelectorAll('.chat-list');
        allMsgDelete.forEach((item: any) => {
            item.remove();
        })
    }

    // Contact Search
    ContactSearch() {
        var input: any, filter: any, ul: any, li: any, a: any | undefined, i: any, txtValue: any;
        input = document.getElementById("searchContact") as HTMLAreaElement;
        filter = input.value.toUpperCase();
        ul = document.querySelectorAll(".chat-user-list");
        ul.forEach((item: any) => {
            li = item.getElementsByTagName("li");
            for (i = 0; i < li.length; i++) {
                a = li[i].getElementsByTagName("p")[0];
                txtValue = a?.innerText;
                if (txtValue?.toUpperCase().indexOf(filter) > -1) {
                    li[i].style.display = "";
                } else {
                    li[i].style.display = "none";
                }
            }
        })

    }

    // Message Search
    MessageSearch() {
        var input: any, filter: any, ul: any, li: any, a: any | undefined, i: any, txtValue: any;
        input = document.getElementById("searchMessage") as HTMLAreaElement;
        filter = input.value.toUpperCase();
        ul = document.getElementById("users-conversation");
        li = ul.getElementsByTagName("li");
        for (i = 0; i < li.length; i++) {
            a = li[i].getElementsByTagName("p")[0];
            txtValue = a?.innerText;
            if (txtValue?.toUpperCase().indexOf(filter) > -1) {
                li[i].style.display = "";
            } else {
                li[i].style.display = "none";
            }
        }
    }

    onFocus() {
        this.showEmojiPicker = false;
    }
    onBlur() {
    }

    /**
     * Delete Chat Contact Data 
     */
    delete(event: any) {
        event.target.closest('li')?.remove();
    }

    hideChat() {
        const userChatShow = document.querySelector('.user-chat');
        if (userChatShow != null) {
            userChatShow.classList.remove('user-chat-show');
        }
    }

    startVideocall() {
        this.showChatContent = false;
        this.showVideoContent = true;
        this.running = true;
        this.increment();
    }

    disconnectCall() {
        this.showChatContent = true;
        this.showVideoContent = false;
        this.running = false;
        this.chatTime = 0;
        this.formattedTime = '00:00:00';
        clearTimeout(this.timerId);
    }

    increment() {
        if (this.running) {
            this.timerId = setTimeout(() => {
                this.chatTime++;
                let hours = Math.floor(this.chatTime / 10 / 3600);
                let mins = Math.floor((this.chatTime / 10 / 60) % 60);
                let secs = Math.floor((this.chatTime / 10) % 60);
                this.formattedTime = `${this.padZero(hours)}:${this.padZero(mins)}:${this.padZero(secs)}`;
                this.increment();
                return `${this.padZero(hours)}:${this.padZero(mins)}:${this.padZero(secs)}`
            }, 100);
        }
    }


    padZero(num: number): string {
        return num <= 9 ? '0' + num : num.toString();
    }


}
