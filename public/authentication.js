// Authentication utilities

// Show loading spinner
function showLoading(button) {
    if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner"></span> Loading...';
    }
}

// Hide loading spinner
function hideLoading(button, originalText) {
    if (button) {
        button.disabled = false;
        button.innerHTML = originalText || 'Submit';
    }
}

// Show error message
function showError(message, container) {
    const errorContainer = container || document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.style.color = '#dc3545';
    errorContainer.style.marginBottom = '15px';
    errorContainer.style.padding = '10px';
    errorContainer.style.border = '1px solid #dc3545';
    errorContainer.style.borderRadius = '4px';
    errorContainer.style.backgroundColor = '#f8d7da';
    errorContainer.textContent = message;

    if (!container) {
        const form = document.querySelector('form');
        if (form) {
            form.insertBefore(errorContainer, form.firstChild);
        }
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorContainer.parentNode) {
            errorContainer.parentNode.removeChild(errorContainer);
        }
    }, 5000);
}

/**
 * Check if the user is authenticated
 * @returns {boolean} True if the user is authenticated, false otherwise
 */
function isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
}

/**
 * Redirect to the login page if the user is not authenticated
 * @returns {boolean} True if the user is authenticated, false otherwise
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'loogin.html';
        return false;
    }
    return true;
}

/**
 * Check authentication and subscription status
 * @returns {Promise<boolean>} True if the user is authenticated and has an active subscription
 */
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'loogin.html';
        return false;
    }

    try {
        const response = await fetch('http://localhost:5091/api/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'loogin.html';
            }
            return false;
        }

        const userData = await response.json();
        if (userData.subscriptionStatus !== 'active') {
            window.location.href = 'index.html#subscription';
            return false;
        }

        if (typeof updateSessionsCounter === 'function') {
            updateSessionsCounter(userData.sessionsRemaining);
        }
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

/**
 * Make an authenticated API request
 * @param {string} url - The API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Response>} The fetch response
 */
async function makeRequest(url, options = {}) {
    const token = localStorage.getItem('token');

    // Set default headers
    options.headers = options.headers || {};
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';

    // Add authorization header if token exists
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, options);

        // Handle authentication errors
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'loogin.html';
        }

        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

/**
 * Handle login form submission
 */
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        showLoading(submitButton);

        try {
            console.log('Attempting login with:', { email });

            const response = await fetch('http://localhost:5091/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                localStorage.setItem('token', data.token);
                if (data.user && data.user.subscriptionStatus === 'active') {
                    window.location.href = 'AI.html';
                } else {
                    window.location.href = 'index.html#subscription';
                }
            } else {
                showError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An error occurred during login. Please try again later.');
        } finally {
            hideLoading(submitButton, originalButtonText);
        }
    });
}

/**
 * Handle registration form submission
 */
function setupRegistrationForm() {
    // Look for registration form in newacc.html
    const registrationForm = document.querySelector('.auth-form');
    if (!registrationForm) {
        console.log('Registration form not found');
        return;
    }

    console.log('Registration form found, setting up event listener');

    registrationForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const name = document.getElementById('name')?.value;
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;
        const submitButton = registrationForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        if (!name || !email || !password || !confirmPassword) {
            showError('Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        showLoading(submitButton);

        try {
            console.log('Attempting registration with:', { name, email });

            const response = await fetch('http://localhost:5091/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            console.log('Registration response:', data);

            if (response.ok) {
                localStorage.setItem('token', data.token);
                alert('Registration successful! You will now be redirected.');
                window.location.href = 'index.html#subscription';
            } else {
                showError(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError('An error occurred during registration. Please try again later.');
        } finally {
            hideLoading(submitButton, originalButtonText);
        }
    });
}

/**
 * Handle password reset form submission
 */
function setupPasswordResetForm() {
    const resetForm = document.querySelector('.auth-form');
    // Only set up if we're on the forget.html page
    if (!resetForm || !window.location.href.includes('forget.html')) {
        return;
    }

    resetForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = document.getElementById('email')?.value;
        const submitButton = resetForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        if (!email) {
            showError('Please enter your email address');
            return;
        }

        showLoading(submitButton);

        try {
            const response = await fetch('http://localhost:5091/api/users/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                alert('Password reset instructions have been sent to your email.');
                window.location.href = 'loogin.html';
            } else {
                const data = await response.json();
                showError(data.message || 'Password reset failed. Please try again.');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            showError('An error occurred during password reset. Please try again later.');
        } finally {
            hideLoading(submitButton, originalButtonText);
        }
    });
}

// Initialize authentication forms when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing authentication forms');

    // Check if user is already logged in
    if (isAuthenticated()) {
        console.log('User is authenticated');

        // Add logout functionality to any logout buttons
        const logoutButtons = document.querySelectorAll('.logout-button');
        logoutButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            });
        });
    } else {
        console.log('User is not authenticated');
    }

    // Setup forms based on current page
    if (window.location.href.includes('loogin.html') || window.location.href.includes('login.html')) {
        console.log('Setting up login form');
        setupLoginForm();
    } else if (window.location.href.includes('newacc.html')) {
        console.log('Setting up registration form');
        setupRegistrationForm();
    } else if (window.location.href.includes('forget.html')) {
        console.log('Setting up password reset form');
        setupPasswordResetForm();
    } else {
        // For other pages, set up all forms that might be present
        setupLoginForm();
        setupRegistrationForm();
        setupPasswordResetForm();
    }
});
