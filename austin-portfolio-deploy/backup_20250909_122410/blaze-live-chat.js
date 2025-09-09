/**
 * Blaze Intelligence Live Chat Widget
 * AI-powered customer support with real-time assistance
 */

class BlazeLiveChat {
    constructor(config = {}) {
        this.config = {
            position: config.position || 'bottom-right',
            primaryColor: config.primaryColor || '#ff6b35',
            accentColor: config.accentColor || '#00ffff',
            title: config.title || 'Blaze Support',
            subtitle: config.subtitle || 'Championship-level assistance',
            autoGreeting: config.autoGreeting !== false,
            greetingDelay: config.greetingDelay || 3000,
            aiEnabled: config.aiEnabled !== false,
            offlineMessage: config.offlineMessage || 'Leave a message',
            businessHours: config.businessHours || { start: 8, end: 20 },
            ...config
        };
        
        this.state = {
            isOpen: false,
            isMinimized: false,
            hasInteracted: false,
            messages: [],
            typing: false,
            online: true,
            unreadCount: 0
        };
        
        this.aiResponses = {
            greeting: [
                "Welcome to Blaze Intelligence! How can I help you achieve championship analytics today?",
                "Hi there! Ready to explore our sports intelligence platform?",
                "Hello! I'm here to help you discover how Blaze can transform your organization."
            ],
            demo: [
                "I'd be happy to schedule a demo for you! Our platform demos typically cover MLB, NFL, NBA, and NCAA analytics. What sport are you most interested in?",
                "Great choice! Our demos showcase real-time analytics, Vision AI, and ROI metrics. Would you prefer a live demo or recorded overview?"
            ],
            pricing: [
                "Our pricing starts at $1,188/year for Demo tier, $50,000/year for Professional, and $250,000/year for Enterprise. We offer 67-80% savings compared to competitors. Would you like detailed pricing information?",
                "We have flexible pricing options designed for organizations of all sizes. Our Professional tier at $50,000/year is most popular. Should I send you our pricing comparison?"
            ],
            features: [
                "Blaze Intelligence offers: ✅ 94.6% accuracy analytics ✅ <100ms latency ✅ Vision AI for biomechanical analysis ✅ Real-time data streaming ✅ Multi-sport coverage (MLB, NFL, NBA, NCAA). What feature interests you most?",
                "Our key differentiators include micro-expression detection (1/25th second), championship character assessment, and 2.8M+ data points. Would you like to see our Vision AI demo?"
            ],
            default: [
                "That's a great question! Let me connect you with our team for a detailed answer. Could you share your email?",
                "I'd love to help with that. For the best assistance, I can have a specialist reach out. What's the best way to contact you?"
            ]
        };
        
        this.init();
    }
    
    init() {
        this.createWidget();
        this.attachEventListeners();
        this.checkBusinessHours();
        
        if (this.config.autoGreeting) {
            setTimeout(() => this.showGreeting(), this.config.greetingDelay);
        }
        
        // Initialize AI context
        this.initializeAI();
        
        // Track page context for better responses
        this.trackPageContext();
    }
    
    createWidget() {
        // Create container
        const container = document.createElement('div');
        container.id = 'blaze-chat-widget';
        container.className = 'blaze-chat-container';
        container.innerHTML = `
            <!-- Chat Button -->
            <button id="blaze-chat-button" class="blaze-chat-button">
                <svg class="chat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <svg class="close-icon" style="display:none;" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span class="unread-badge" style="display:none;">0</span>
            </button>
            
            <!-- Chat Window -->
            <div id="blaze-chat-window" class="blaze-chat-window" style="display:none;">
                <!-- Header -->
                <div class="chat-header">
                    <div class="header-content">
                        <div class="header-title">
                            <span class="status-dot"></span>
                            <h3>${this.config.title}</h3>
                        </div>
                        <p class="header-subtitle">${this.config.subtitle}</p>
                    </div>
                    <button class="minimize-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                </div>
                
                <!-- Messages -->
                <div class="chat-messages" id="chat-messages">
                    <div class="message-wrapper">
                        <!-- Messages will be added here -->
                    </div>
                    <div class="typing-indicator" style="display:none;">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="quick-actions">
                    <button class="quick-btn" data-action="demo">📅 Schedule Demo</button>
                    <button class="quick-btn" data-action="pricing">💰 View Pricing</button>
                    <button class="quick-btn" data-action="features">🚀 Features</button>
                </div>
                
                <!-- Input -->
                <div class="chat-input-container">
                    <form id="chat-form" class="chat-form">
                        <input 
                            type="text" 
                            id="chat-input" 
                            class="chat-input" 
                            placeholder="Type your message..."
                            autocomplete="off"
                        />
                        <button type="submit" class="send-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        // Add styles
        const styles = document.createElement('style');
        styles.innerHTML = `
            .blaze-chat-container {
                position: fixed;
                ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                z-index: 9999;
                font-family: 'Inter', -apple-system, sans-serif;
            }
            
            .blaze-chat-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.accentColor});
                border: none;
                color: white;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .blaze-chat-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 30px rgba(255, 107, 53, 0.4);
            }
            
            .unread-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff0000;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
            }
            
            .blaze-chat-window {
                position: absolute;
                ${this.config.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
                ${this.config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
                width: 380px;
                height: 600px;
                background: #0a0a0a;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid rgba(0, 255, 255, 0.3);
            }
            
            .chat-header {
                background: linear-gradient(135deg, rgba(255, 107, 53, 0.9), rgba(0, 255, 255, 0.9));
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .header-title {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .header-title h3 {
                margin: 0;
                color: white;
                font-size: 18px;
                font-weight: 700;
            }
            
            .header-subtitle {
                margin: 4px 0 0 0;
                color: rgba(255, 255, 255, 0.9);
                font-size: 12px;
            }
            
            .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #00ff88;
                box-shadow: 0 0 10px #00ff88;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .minimize-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            
            .minimize-btn:hover {
                opacity: 1;
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                background: #0f0f0f;
            }
            
            .message {
                margin-bottom: 16px;
                display: flex;
                align-items: flex-start;
                gap: 8px;
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .message.user {
                flex-direction: row-reverse;
            }
            
            .message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }
            
            .message.bot .message-avatar {
                background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.accentColor});
            }
            
            .message.user .message-avatar {
                background: #1e293b;
            }
            
            .message-content {
                max-width: 70%;
                padding: 12px 16px;
                border-radius: 12px;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .message.bot .message-content {
                background: #1e293b;
                color: #e2e8f0;
                border-bottom-left-radius: 4px;
            }
            
            .message.user .message-content {
                background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.accentColor});
                color: white;
                border-bottom-right-radius: 4px;
            }
            
            .message-time {
                font-size: 11px;
                color: #64748b;
                margin-top: 4px;
            }
            
            .typing-indicator {
                display: flex;
                gap: 4px;
                padding: 12px 16px;
                background: #1e293b;
                border-radius: 12px;
                width: fit-content;
                margin-bottom: 8px;
            }
            
            .typing-indicator span {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #64748b;
                animation: typing 1.4s infinite;
            }
            
            .typing-indicator span:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .typing-indicator span:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes typing {
                0%, 60%, 100% {
                    transform: translateY(0);
                }
                30% {
                    transform: translateY(-10px);
                }
            }
            
            .quick-actions {
                padding: 12px;
                background: #0a0a0a;
                border-top: 1px solid #1e293b;
                display: flex;
                gap: 8px;
                overflow-x: auto;
            }
            
            .quick-btn {
                padding: 8px 12px;
                background: rgba(255, 107, 53, 0.2);
                border: 1px solid ${this.config.primaryColor};
                border-radius: 20px;
                color: white;
                font-size: 12px;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s;
            }
            
            .quick-btn:hover {
                background: rgba(255, 107, 53, 0.3);
                transform: translateY(-2px);
            }
            
            .chat-input-container {
                padding: 12px;
                background: #0a0a0a;
                border-top: 1px solid #1e293b;
            }
            
            .chat-form {
                display: flex;
                gap: 8px;
            }
            
            .chat-input {
                flex: 1;
                padding: 10px 14px;
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 24px;
                color: white;
                font-size: 14px;
                outline: none;
                transition: all 0.2s;
            }
            
            .chat-input:focus {
                border-color: ${this.config.accentColor};
                box-shadow: 0 0 0 3px rgba(0, 255, 255, 0.1);
            }
            
            .send-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.accentColor});
                border: none;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .send-btn:hover {
                transform: scale(1.1);
            }
            
            @media (max-width: 480px) {
                .blaze-chat-window {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 100px);
                    right: 20px;
                    left: 20px;
                }
            }
        `;
        
        document.head.appendChild(styles);
        document.body.appendChild(container);
    }
    
    attachEventListeners() {
        const button = document.getElementById('blaze-chat-button');
        const window = document.getElementById('blaze-chat-window');
        const form = document.getElementById('chat-form');
        const input = document.getElementById('chat-input');
        const minimize = document.querySelector('.minimize-btn');
        const quickBtns = document.querySelectorAll('.quick-btn');
        
        button.addEventListener('click', () => this.toggleChat());
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        minimize.addEventListener('click', () => this.minimizeChat());
        
        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Track user typing
        let typingTimer;
        input.addEventListener('input', () => {
            clearTimeout(typingTimer);
            if (input.value.length > 0) {
                typingTimer = setTimeout(() => {
                    // Could send typing indicator to backend
                }, 1000);
            }
        });
    }
    
    toggleChat() {
        const window = document.getElementById('blaze-chat-window');
        const button = document.getElementById('blaze-chat-button');
        const chatIcon = button.querySelector('.chat-icon');
        const closeIcon = button.querySelector('.close-icon');
        
        this.state.isOpen = !this.state.isOpen;
        
        if (this.state.isOpen) {
            window.style.display = 'flex';
            chatIcon.style.display = 'none';
            closeIcon.style.display = 'block';
            this.state.unreadCount = 0;
            this.updateUnreadBadge();
            
            if (!this.state.hasInteracted) {
                this.showWelcomeMessage();
                this.state.hasInteracted = true;
            }
        } else {
            window.style.display = 'none';
            chatIcon.style.display = 'block';
            closeIcon.style.display = 'none';
        }
    }
    
    minimizeChat() {
        this.toggleChat();
    }
    
    showGreeting() {
        if (!this.state.isOpen && !this.state.hasInteracted) {
            const greeting = this.getRandomResponse('greeting');
            this.addMessage(greeting, 'bot', false);
            this.state.unreadCount++;
            this.updateUnreadBadge();
        }
    }
    
    showWelcomeMessage() {
        if (this.state.messages.length === 0) {
            const welcome = this.getRandomResponse('greeting');
            this.addMessage(welcome, 'bot');
        }
    }
    
    handleSubmit(e) {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message) {
            this.addMessage(message, 'user');
            input.value = '';
            
            if (this.config.aiEnabled) {
                this.generateAIResponse(message);
            }
        }
    }
    
    handleQuickAction(action) {
        const actionMessages = {
            demo: "I'd like to schedule a demo",
            pricing: "Can you tell me about your pricing?",
            features: "What features does Blaze Intelligence offer?"
        };
        
        const message = actionMessages[action];
        if (message) {
            this.addMessage(message, 'user');
            this.generateAIResponse(message);
        }
    }
    
    generateAIResponse(userMessage) {
        this.showTyping();
        
        setTimeout(() => {
            this.hideTyping();
            
            const response = this.getAIResponse(userMessage);
            this.addMessage(response, 'bot');
            
            // Check if we should follow up
            if (userMessage.toLowerCase().includes('demo')) {
                setTimeout(() => {
                    this.addMessage("I can also connect you with our team immediately. Would you prefer to call (210) 273-5538 or email austin@blaze-intelligence.pages.dev?", 'bot');
                }, 2000);
            }
        }, 1500);
    }
    
    getAIResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('demo') || lowerMessage.includes('schedule')) {
            return this.getRandomResponse('demo');
        } else if (lowerMessage.includes('pric') || lowerMessage.includes('cost')) {
            return this.getRandomResponse('pricing');
        } else if (lowerMessage.includes('feature') || lowerMessage.includes('what')) {
            return this.getRandomResponse('features');
        } else {
            return this.getRandomResponse('default');
        }
    }
    
    getRandomResponse(category) {
        const responses = this.aiResponses[category] || this.aiResponses.default;
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    addMessage(text, sender, animate = true) {
        const messagesContainer = document.querySelector('.message-wrapper');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${sender}`;
        
        const avatar = sender === 'bot' ? '🔥' : '👤';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-bubble">
                <div class="message-content">${text}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageEl);
        
        // Scroll to bottom
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add to state
        this.state.messages.push({ text, sender, time });
        
        // Update unread if chat is closed
        if (!this.state.isOpen && sender === 'bot') {
            this.state.unreadCount++;
            this.updateUnreadBadge();
        }
    }
    
    showTyping() {
        const indicator = document.querySelector('.typing-indicator');
        indicator.style.display = 'flex';
        this.state.typing = true;
    }
    
    hideTyping() {
        const indicator = document.querySelector('.typing-indicator');
        indicator.style.display = 'none';
        this.state.typing = false;
    }
    
    updateUnreadBadge() {
        const badge = document.querySelector('.unread-badge');
        if (this.state.unreadCount > 0) {
            badge.textContent = this.state.unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    checkBusinessHours() {
        const now = new Date();
        const hour = now.getHours();
        const isBusinessHours = hour >= this.config.businessHours.start && 
                                hour < this.config.businessHours.end;
        
        this.state.online = isBusinessHours;
        
        // Update status indicator
        const statusDot = document.querySelector('.status-dot');
        if (statusDot) {
            statusDot.style.background = isBusinessHours ? '#00ff88' : '#ffaa00';
        }
    }
    
    initializeAI() {
        // Initialize more sophisticated AI context
        this.aiContext = {
            pageVisited: window.location.pathname,
            timeOnPage: 0,
            userIntent: null,
            previousQuestions: [],
            userProfile: null
        };
        
        // Track time on page
        setInterval(() => {
            this.aiContext.timeOnPage++;
        }, 1000);
    }
    
    trackPageContext() {
        // Provide context-aware responses based on current page
        const path = window.location.pathname;
        
        if (path.includes('pricing')) {
            this.aiContext.userIntent = 'pricing';
        } else if (path.includes('demo') || path.includes('vision-ai')) {
            this.aiContext.userIntent = 'demo';
        } else if (path.includes('testimonials')) {
            this.aiContext.userIntent = 'validation';
        }
    }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.blazeLiveChat = null;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.blazeLiveChat = new BlazeLiveChat({
                primaryColor: '#ff6b35',
                accentColor: '#00ffff',
                title: '🔥 Blaze Support',
                subtitle: 'Average response: <2 minutes',
                autoGreeting: true,
                greetingDelay: 5000,
                position: 'bottom-right'
            });
        });
    } else {
        window.blazeLiveChat = new BlazeLiveChat({
            primaryColor: '#ff6b35',
            accentColor: '#00ffff',
            title: '🔥 Blaze Support',
            subtitle: 'Average response: <2 minutes',
            autoGreeting: true,
            greetingDelay: 5000,
            position: 'bottom-right'
        });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeLiveChat;
}