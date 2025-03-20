import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
interface ChatMessage {
  id: number;
  content: string;
  timestamp: string;
  user: string;
  customerId: string;
}

@Component({
  selector: 'app-admin-chat',
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-chat.component.html',
  styleUrls: ['./admin-chat.component.css']
})
export class AdminChatComponent implements OnInit, OnDestroy {
  customers: string[] = [];
  messages: ChatMessage[] = [];
  selectedCustomer: string | null = null;
  newMessage: string = '';
  stompClient: Client | null = null;
  isConnected = false;
  isConnecting = true;
  connectionError = '';

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  ngOnInit(): void {
    this.loadCustomers();
    this.setupStompClient();
  }

  ngOnDestroy(): void {
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.deactivate();
    }
  }

  // 1) Load initial list of customers
  loadCustomers(): void {
    fetch('http://localhost:8080/customers')
      .then((res) => res.json())
      .then((data: string[]) => {
        this.customers = data;
      })
      .catch((err) => {
        console.error('Error loading customers:', err);
      });
  }

  // 2) STOMP client setup
  setupStompClient(): void {
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      debug: (str) => console.log('Admin STOMP:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('Admin STOMP connected');
        this.isConnected = true;
        this.isConnecting = false;
        this.connectionError = '';
        this.stompClient = client;

        client.subscribe('/topic/messages', (message: IMessage) => {
          const receivedData = JSON.parse(message.body);

          // Handle message deletion by ID
          if (typeof receivedData === 'number') {
            const deletedMessageId = receivedData;
            this.messages = this.messages.filter((msg) => msg.id !== deletedMessageId);
            return;
          }

          // Handle message updates/additions
          const newMsg: ChatMessage = receivedData;
          if (newMsg.customerId === this.selectedCustomer) {
            const existingIndex = this.messages.findIndex((m) => m.id === newMsg.id);
            if (existingIndex !== -1) {
              // Update existing message
              this.messages[existingIndex] = newMsg;
            } else {
              // Add new message
              this.messages.push(newMsg);
            }
          }
          this.scrollToBottom();
        });
      },

      onStompError: (frame) => {
        console.error('Admin STOMP error', frame);
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionError = 'Connection error: ' + (frame.headers?.['message'] || 'Unknown error');
      },
      onWebSocketError: (evt) => {
        console.error('Admin WebSocket error', evt);
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionError = 'WebSocket error: Failed to connect to server';
      },
      onDisconnect: () => {
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionError = 'Disconnected from server';
      }
    });

    client.activate();
  }

  // 3) Fetch chat history for a selected customer
  fetchChatHistory(customerId: string): void {
    this.selectedCustomer = customerId;
    fetch(`http://localhost:8080/chat/${customerId}`)
      .then((res) => res.json())
      .then((data: ChatMessage[]) => {
        this.messages = data || [];
        this.scrollToBottom();
      })
      .catch((err) => {
        console.error('Error fetching chat history:', err);
      });
  }

  // 4) Send a new message
  sendMessage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (!this.newMessage.trim() || !this.selectedCustomer || !this.stompClient?.connected) {
      return;
    }

    const messageData = {
      customerId: this.selectedCustomer,
      content: this.newMessage.trim(),
      user: 'ADMIN'
    };

    this.stompClient.publish({
      destination: '/app/chat',
      body: JSON.stringify(messageData)
    });

    this.newMessage = '';
  }

  // Handle "Enter" key
  onKeyDown(event: KeyboardEvent): void {
    // SHIFT+Enter -> new line; Enter alone -> send message
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Delete message
  deleteMessage(messageId: number): void {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/message/delete',
        body: JSON.stringify(messageId)
      });
      this.messages = this.messages.filter((msg) => msg.id !== messageId);
    } else {
      console.error('Cannot delete message: STOMP client not connected');
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesEnd?.nativeElement) {
        this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }
  adjustTextareaHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}