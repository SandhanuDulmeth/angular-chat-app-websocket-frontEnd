// help-support.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, Inject } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-help-support',
  imports: [FormsModule, CommonModule],
  templateUrl: './customer-chat.component.html',
  styleUrls: ['./customer-chat.component.css']
})
export class CustomerChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  messages: any[] = [];
  inputMessage = '';
  isConnected = false;
  isConnecting = true;
  connectionError = '';
  editingMessageId: number | null = null;
  editingContent = '';
  private destroy$ = new Subject<void>();
  private stompClient!: Client;
  customerEmail = '';

  constructor(private http: HttpClient, @Inject(AuthService) private authService: AuthService) {}

  ngOnInit() {
    this.customerEmail = this.authService.getCustomerEmail();
    this.fetchMessages();
    this.initWebSocket();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.stompClient) this.stompClient.deactivate();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  private fetchMessages() {
    this.http.get<any[]>(`http://localhost:8080/chat/${encodeURIComponent(this.customerEmail)}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.messages = data || [],
        error: (err) => this.connectionError = 'Failed to load chat history'
      });
  }

  private initWebSocket() {
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      debug: (str) => console.log('STOMP:', str),
      reconnectDelay: 5000
    });

    this.stompClient.onConnect = () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.connectionError = '';

      this.stompClient.subscribe('/topic/messages', (message) => {
        const receivedData = JSON.parse(message.body);
        
        if (typeof receivedData === 'number') {
          this.messages = this.messages.filter(msg => msg.id !== receivedData);
          return;
        }
        
        if (receivedData.customerId === this.customerEmail) {
          const index = this.messages.findIndex(m => m.id === receivedData.id);
          if (index >= 0) {
            this.messages[index] = receivedData;
          } else {
            this.messages.push(receivedData);
          }
          this.messages = [...this.messages];
        }
      });
    };

    this.stompClient.onStompError = (frame) => {
      this.connectionError = 'Connection error: ' + (frame.headers?.['message'] || 'Unknown error');
      this.isConnected = false;
      this.isConnecting = false;
    };

    this.stompClient.onWebSocketError = (event) => {
      this.connectionError = 'WebSocket error: Failed to connect to server';
      this.isConnected = false;
      this.isConnecting = false;
    };

    this.stompClient.onDisconnect = () => {
      this.isConnected = false;
      this.isConnecting = false;
      this.connectionError = 'Disconnected from server';
    };

    this.stompClient.activate();
  }

  sendMessage(): void {
    if (!this.isConnected || !this.inputMessage.trim()) return;
  
    // Send message logic
    const messageDTO = {
      customerId: this.customerEmail,
      content: this.inputMessage.trim(),
      user: 'CUSTOMER'
    };
  
    this.stompClient.publish({
      destination: '/app/chat',
      body: JSON.stringify(messageDTO)
    });
  
    // Clear input
    this.inputMessage = '';
  }

  startEditing(message: any) {
    this.editingMessageId = message.id;
    this.editingContent = message.content;
  }

  updateMessage() {
    if (!this.editingContent.trim() || !this.editingMessageId) return;

    const messageDTO = {
      id: this.editingMessageId,
      customerId: this.customerEmail,
      content: this.editingContent.trim(),
      user: 'CUSTOMER'
    };

    this.stompClient.publish({
      destination: '/app/chat/update',
      body: JSON.stringify(messageDTO)
    });

    this.cancelEditing();
  }

  deleteMessage(messageId: number) {
    if (confirm('Are you sure you want to delete this message?')) {
      this.stompClient.publish({
        destination: '/app/message/delete',
        body: JSON.stringify(messageId)
      });
      this.messages = this.messages.filter(msg => msg.id !== messageId);
    }
  }

  cancelEditing() {
    this.editingMessageId = null;
    this.editingContent = '';
  }

  checkConnection() {
    if (this.stompClient && !this.stompClient.connected) {
      this.stompClient.activate();
      this.isConnecting = true;
    }
  }

  handleEnterKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent; // Cast the event to KeyboardEvent
    const messageInput = event.target as HTMLTextAreaElement; // Get the textarea element
  
    if (keyboardEvent.shiftKey) {
      return; // Allow Shift+Enter for new lines
    }
  
    keyboardEvent.preventDefault(); // Prevent default Enter behavior
    this.sendMessage();
    messageInput.style.height = 'auto'; // Reset textarea height
  }
}