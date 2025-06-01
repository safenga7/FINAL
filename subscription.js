document.addEventListener('DOMContentLoaded', async () => {
    // Get CSRF token first
    let csrfToken;
    try {
        const response = await fetch('/api/csrf-token', {
            credentials: 'include'
        });
        const data = await response.json();
        csrfToken = data.token;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        showError('Unable to initialize payment system. Please refresh the page.');
        return;
    }

    // Helper function for API requests with CSRF token
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

    const subscriptionButtons = document.querySelectorAll('.subscription-plan button');
    
    subscriptionButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            const planDiv = this.closest('.subscription-plan');
            const planTitle = planDiv.querySelector('h2').textContent;
            
            // Map plan titles to IDs
            const planMap = {
                'Пакет Безопасность': 'basic',
                'Пакет Надежда': 'standard',
                'Пакет Удовлетворение': 'premium'
            };
            
            const planId = planMap[planTitle];

            try {
                const response = await makeRequest('/api/payments/create-subscription', {
                    method: 'POST',
                    body: JSON.stringify({ planId })
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/login.html';
                        return;
                    }
                    throw new Error('Subscription creation failed');
                }

                const data = await response.json();
                
                // Redirect to Stripe Checkout
                window.location.href = data.url;
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to process subscription. Please try again later.');
            }
        });
    });

    // Handle subscription success/failure redirects
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
        // Verify the subscription status
        makeRequest(`/api/payments/verify-subscription?session_id=${sessionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Subscription activated successfully!');
                window.location.href = '/AI.html';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to verify subscription. Please contact support.');
        });
    }
});