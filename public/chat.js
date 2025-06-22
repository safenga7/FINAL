import { exec } from "child_process";

function chatWithAI(message) {
    exec(`python chat.py "${message}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`⚠️ Stderr: ${stderr}`);
            return;
        }
        console.log(`🤖 AI Response: ${stdout}`);
    });
}

class ChatManager {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.messageContainer = document.querySelector('.message-container');
        this.messageInput = document.querySelector('.message-input');
        this.sendButton = document.querySelector('.send-button');
        this.typingIndicator = document.querySelector('.typing-indicator');
        this.ws = null;
        this.typingTimeout = null;
        
        this.initialize();
    }

    async initialize() {
        try {
            await this.setupWebSocket();
            this.attachEventListeners();
            await this.loadMessages();
        } catch (error) {
            console.error('Chat initialization failed:', error);
            this.showError('Failed to initialize chat. Please refresh the page.');
        }
    }

    async setupWebSocket() {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}?token=${token}&sessionId=${this.sessionId}`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.setConnectionStatus(true);
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.setConnectionStatus(false);
            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.setupWebSocket(), 5000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.showError('Connection error occurred');
        };
    }

    attachEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => {
            this.sendTypingStatus(true);
            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout);
            }
            this.typingTimeout = setTimeout(() => {
                this.sendTypingStatus(false);
            }, 1000);
        });
    }

    async loadMessages() {
        try {
            const response = await fetch(`/api/sessions/${this.sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load messages');
            }

            const data = await response.json();
            data.messages.forEach(message => this.displayMessage(message));
            
            // Mark messages as read
            this.markMessagesAsRead();
            
            // Scroll to bottom
            this.scrollToBottom();
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showError('Failed to load message history');
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'chat':
                this.displayMessage(data.message);
                if (data.message.senderId !== this.getCurrentUserId()) {
                    this.markMessagesAsRead();
                }
                break;

            case 'typing':
                if (data.userId !== this.getCurrentUserId()) {
                    this.showTypingIndicator(data.isTyping);
                }
                break;

            case 'messages_read':
                if (data.userId !== this.getCurrentUserId()) {
                    this.updateMessageReadStatus(data.userId);
                }
                break;

            case 'session_update':
                this.handleSessionUpdate(data);
                break;

            case 'error':
                this.showError(data.message);
                break;
        }
    }

    async sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content) return;

        try {
            const response = await fetch(`/api/sessions/${this.sessionId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            this.messageInput.value = '';
            this.sendTypingStatus(false);
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message');
        }
    }

    displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(message.senderId === this.getCurrentUserId() ? 'sent' : 'received');
        
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        contentElement.textContent = message.content;
        
        const timeElement = document.createElement('div');
        timeElement.classList.add('message-time');
        timeElement.textContent = new Date(message.timestamp).toLocaleTimeString();
        
        messageElement.appendChild(contentElement);
        messageElement.appendChild(timeElement);
        
        this.messageContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    sendTypingStatus(isTyping) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'typing',
                isTyping
            }));
        }
    }

    showTypingIndicator(show) {
        this.typingIndicator.style.display = show ? 'block' : 'none';
        if (show) {
            this.scrollToBottom();
        }
    }

    async markMessagesAsRead() {
        try {
            await fetch(`/api/sessions/${this.sessionId}/messages/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    updateMessageReadStatus(userId) {
        // Update UI to show messages have been read
        const unreadMessages = this.messageContainer.querySelectorAll('.message.sent:not(.read)');
        unreadMessages.forEach(message => message.classList.add('read'));
    }

    handleSessionUpdate(data) {
        if (data.status === 'completed') {
            this.showNotification('Session has ended');
            this.disableChat();
        }
    }

    getCurrentUserId() {
        // Get user ID from JWT token or local storage
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id;
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }
    }

    setConnectionStatus(connected) {
        const statusElement = document.querySelector('.connection-status');
        if (statusElement) {
            statusElement.textContent = connected ? 'Connected' : 'Disconnected';
            statusElement.classList.toggle('connected', connected);
        }
    }

    scrollToBottom() {
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.classList.add('error-message');
        errorElement.textContent = message;
        
        document.body.appendChild(errorElement);
        setTimeout(() => errorElement.remove(), 5000);
    }

    showNotification(message) {
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('notification');
        notificationElement.textContent = message;
        
        document.body.appendChild(notificationElement);
        setTimeout(() => notificationElement.remove(), 5000);
    }

    disableChat() {
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
        this.messageInput.placeholder = 'This session has ended';
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    
    if (sessionId) {
        new ChatManager(sessionId);
    } else {
        console.error('No session ID provided');
    }
});

// اختبار الكود
chatWithAI("How can I improve my mental health?");
