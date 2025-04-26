export interface ChatMessage {  
    id: number;
    sender: any;
    recipient: any;
    content: string;
    imageUrl?: string; 
    timestamp?: Date;
    isRead?: boolean;
  }
 