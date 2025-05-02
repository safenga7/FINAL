document.addEventListener("DOMContentLoaded", async function () {
    const chatBox = document.querySelector(".chat-box");
    const inputField = document.querySelector(".message-input");
    const sendButton = document.querySelector(".send-button");
    const typingIndicator = document.getElementById("typingIndicator");
    const errorPopup = document.getElementById("errorMessage");
    const sessionsCounter = document.getElementById("sessionsRemaining");
    const buttonText = sendButton.querySelector(".button-text");
    const buttonLoader = sendButton.querySelector(".button-loader");

    // Get CSRF token
    let csrfToken;
    try {
        const response = await fetch('/api/csrf-token', {
            credentials: 'include'
        });
        const data = await response.json();
        csrfToken = data.token;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
    }

    // Initialize WebSocket connection
    let ws;
    function connectWebSocket() {
        const token = localStorage.getItem('token');
        if (!token) return;

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}?token=${token}`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    function handleWebSocketMessage(data) {
        switch (data.type) {
            case 'typing':
                handleTypingIndicator(data);
                break;
            case 'message':
                addMessage(data.message, data.sender);
                break;
        }
    }

    function handleTypingIndicator(data) {
        if (data.isTyping) {
            showTypingIndicator();
        } else {
            hideTypingIndicator();
        }
    }

    // Add CSRF token to all API requests
    const makeRequest = async (url, options = {}) => {
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            }
        };

        return fetch(url, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });
    };

    // Check authentication and subscription status
    async function checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return false;
        }

        try {
            const response = await makeRequest('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login.html';
                }
                return false;
            }

            const userData = await response.json();
            if (userData.subscriptionStatus !== 'active') {
                window.location.href = '/index.html#subscription';
                return false;
            }

            updateSessionsCounter(userData.sessionsRemaining);
            return true;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    let typingTimeout;
    function sendTypingStatus(isTyping) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'typing',
                isTyping
            }));
        }
    }

    async function sendMessage() {
        const userMessage = inputField.value.trim();
        if (userMessage === "") return;

        // Check auth and subscription
        if (!await checkAuth()) return;

        addMessage(userMessage, "user");
        inputField.value = "";
        showTypingIndicator();
        setLoading(true);

        // Send typing status
        sendTypingStatus(false);

        try {
            // First try the API endpoint
            let response;
            try {
                response = await makeRequest('/api/ai/generate', {
                    method: 'POST',
                    body: JSON.stringify({ message: userMessage })
                });
            } catch (apiError) {
                console.warn('API endpoint failed, using fallback:', apiError);
                // If API fails, use a simple response for testing
                response = {
                    ok: true,
                    json: async () => ({
                        response: "I'm a simple AI response for testing. The actual AI integration will provide more sophisticated responses.",
                        sessionsRemaining: 5
                    })
                };
            }

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login.html';
                    return;
                }
                if (response.status === 403) {
                    window.location.href = '/index.html#subscription';
                    return;
                }
                throw new Error('AI response failed');
            }

            const data = await response.json();
            hideTypingIndicator();
            addMessage(data.response, "bot");

            // Broadcast message via WebSocket if needed
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'message',
                    message: data.response,
                    sender: 'bot'
                }));
            }

            // Update sessions counter
            if (data.sessionsRemaining !== undefined) {
                updateSessionsCounter(data.sessionsRemaining);
            }
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();

            // Fallback response for testing
            addMessage("I'm sorry, there was an error processing your request. This is a fallback response for testing purposes.", "bot");
            showError("Sorry, an error occurred. Please try again later.");
        } finally {
            setLoading(false);
        }
    }

    function updateSessionsCounter(count) {
        sessionsCounter.textContent = `Осталось сессий: ${count}`;
    }

    function showError(message) {
        errorPopup.querySelector('p').textContent = message;
        errorPopup.style.display = 'flex';
        setTimeout(() => {
            errorPopup.style.display = 'none';
        }, 5000);
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);

        if (sender === "bot") {
            const botImage = document.createElement("img");
            botImage.src = "images/hope.svg";
            botImage.alt = "Bot";
            messageDiv.appendChild(botImage);
        }

        const messageText = document.createElement("p");
        messageText.textContent = text;
        messageDiv.appendChild(messageText);
        chatBox.appendChild(messageDiv);

        // Ensure new message is visible
        chatBox.scrollTop = chatBox.scrollHeight;

        // Animate message
        setTimeout(() => {
            messageDiv.style.opacity = "1";
        }, 100);
    }

    function showTypingIndicator() {
        typingIndicator.style.display = "flex";
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function hideTypingIndicator() {
        typingIndicator.style.display = "none";
    }

    function setLoading(isLoading) {
        buttonText.style.display = isLoading ? 'none' : 'inline';
        buttonLoader.style.display = isLoading ? 'block' : 'none';
        sendButton.disabled = isLoading;
        inputField.disabled = isLoading;
    }

    // Facebook SDK initialization
    window.fbAsyncInit = function() {
        FB.init({
            appId      : '1234567890', // Replace with your Facebook App ID
            cookie     : true,
            xfbml      : true,
            version    : 'v18.0'
        });
    };

    function handleFacebookLogin() {
        FB.login(function(response) {
            if (response.authResponse) {
                // User successfully logged in
                FB.api('/me', { fields: 'email,name' }, function(userInfo) {
                    // Send user data to your backend
                    fetch('/api/auth/facebook', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            accessToken: response.authResponse.accessToken,
                            userID: response.authResponse.userID,
                            email: userInfo.email,
                            name: userInfo.name
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.location.href = '/'; // Redirect to home page
                        }
                    })
                    .catch(error => console.error('Error:', error));
                });
            }
        }, { scope: 'email,public_profile' });
    }

    function handleInstagramLogin() {
        // Instagram Basic Display API OAuth URL
        const instagramClientId = '1234567890'; // Replace with your Instagram App ID
        const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/instagram/callback`);
        const scope = 'user_profile,user_media';

        const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${instagramClientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

        window.location.href = authUrl;
    }

    // Event Listeners
    sendButton.addEventListener("click", sendMessage);

    inputField.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    inputField.addEventListener("input", () => {
        sendTypingStatus(true);
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        typingTimeout = setTimeout(() => {
            sendTypingStatus(false);
        }, 1000);
    });

    errorPopup.querySelector('.close-error').addEventListener('click', () => {
        errorPopup.style.display = 'none';
    });

    // Initialize WebSocket connection
    connectWebSocket();

    // Initial auth check
    checkAuth();
});

// Navbar scroll effect
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
});

// Typing effect for header
const text = document.querySelector('.typing-effect');
if (text) {
    const textContent = text.textContent;
    text.textContent = '';
    let i = 0;

    function typeWriter() {
        if (i < textContent.length) {
            text.textContent += textContent.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    }

    typeWriter();
}

// Library content filtering
function filterContent() {
    const searchInput = document.getElementById('searchInput');
    const filter = searchInput.value.toLowerCase();
    const items = document.getElementsByClassName('library-item');

    Array.from(items).forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(filter) ? '' : 'none';
    });
}

function filterCategory(category) {
    const buttons = document.getElementsByClassName('category-btn');
    const items = document.getElementsByClassName('library-item');
    
    // Update active button
    Array.from(buttons).forEach(button => {
        button.classList.remove('active');
        if (button.textContent.toLowerCase().includes(category)) {
            button.classList.add('active');
        }
    });

    // Filter items
    Array.from(items).forEach(item => {
        if (category === 'all') {
            item.style.display = '';
        } else {
            item.style.display = item.classList.contains(category) ? '' : 'none';
        }
    });
}

// Add animation classes on scroll
const animatedElements = document.querySelectorAll('.subscription-plan, .doctor-card, .library-item');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fadeIn');
        }
    });
}, {
    threshold: 0.1
});

animatedElements.forEach(element => {
    observer.observe(element);
});

// Handle mobile menu
const menuButton = document.querySelector('.navbar-btn');
const navbarRow = document.querySelector('.navbar-row');

if (menuButton) {
    menuButton.addEventListener('click', () => {
        navbarRow.classList.toggle('show');
    });
}

// Handle smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Background elements animation
const backgroundElements = document.querySelectorAll('.background-element');

backgroundElements.forEach((element, index) => {
    element.style.animation = `float ${10 + index}s ease-in-out infinite`;
});

// Add floating animation
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% { transform: translate(0, 0); }
        50% { transform: translate(15px, -15px); }
        100% { transform: translate(0, 0); }
    }
`;
document.head.appendChild(style);
