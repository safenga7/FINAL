// Authentication handler
class AuthHandler {
    constructor() {
        this.token = localStorage.getItem('token');
        this.csrfToken = null;
        this.initializeAuth();
    }

    async initializeAuth() {
        // Check if user is authenticated
        if (this.token) {
            this.checkAuthStatus();
        } else {
            this.updateUIForGuest();
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('http://localhost:5091/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.updateUIForUser(userData);
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
        }
    }

    async login(email, password) {
        try {
            const response = await fetch('http://localhost:5091/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || 'Неверный email или пароль',
                    errors: data.errors
                };
            }

            this.token = data.token;
            localStorage.setItem('token', this.token);

            // Update UI
            this.updateUIForUser(data.user);

            return {
                success: true,
                user: data.user
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: 'Ошибка при входе. Пожалуйста, попробуйте позже.'
            };
        }
    }

    async register(userData) {
        try {
            const response = await fetch('http://localhost:5091/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || 'Ошибка при регистрации',
                    errors: data.errors
                };
            }

            this.token = data.token;
            localStorage.setItem('token', this.token);

            // Update UI
            this.updateUIForUser(data.user);

            return {
                success: true,
                user: data.user
            };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: 'Ошибка при регистрации. Пожалуйста, попробуйте позже.'
            };
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.token = null;
        this.updateUIForGuest();

        // Redirect to home page if not already there
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }

    updateUIForUser(userData) {
        const navbarCol = document.querySelector('.navbar-col:last-child');
        if (!navbarCol) return;

        navbarCol.innerHTML = `
            <li><a class="nav-link" href="#">${userData.name || 'Профиль'}</a></li>
            <li><button class="nav-link" id="logoutButton">Выход</button></li>
            <li><a class="nav-link btn btn-primary" href="AI.html">Начать ИИ➔</a></li>
        `;

        // Add user dropdown
        const profileLink = navbarCol.querySelector('a[href="#"]');
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();

                // Check if dropdown already exists
                const existingDropdown = document.querySelector('.user-dropdown');
                if (existingDropdown) {
                    existingDropdown.remove();
                    return;
                }

                // Create dropdown
                const dropdown = document.createElement('div');
                dropdown.className = 'user-dropdown';
                dropdown.style.position = 'absolute';
                dropdown.style.top = '60px';
                dropdown.style.right = '20px';
                dropdown.style.backgroundColor = 'white';
                dropdown.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                dropdown.style.borderRadius = '4px';
                dropdown.style.padding = '10px';
                dropdown.style.zIndex = '1000';
                dropdown.style.minWidth = '200px';

                dropdown.innerHTML = `
                    <div style="padding: 10px; border-bottom: 1px solid #eee;">
                        <div style="font-weight: bold;">${userData.name}</div>
                        <div style="color: #666; font-size: 0.9rem;">${userData.email}</div>
                    </div>
                    <div style="padding: 10px; border-bottom: 1px solid #eee;">
                        <div>Статус подписки: ${userData.subscriptionStatus === 'active' ? 'Активна' : 'Неактивна'}</div>
                        <div>Осталось сессий: ${userData.sessionsRemaining}</div>
                    </div>
                    <div style="padding: 10px; cursor: pointer; color: #dc3545;" id="logoutLink">Выйти</div>
                `;

                document.body.appendChild(dropdown);

                // Add logout event
                document.getElementById('logoutLink').addEventListener('click', () => {
                    this.logout();
                    dropdown.remove();
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', function closeDropdown(e) {
                    if (!dropdown.contains(e.target) && e.target !== profileLink) {
                        dropdown.remove();
                        document.removeEventListener('click', closeDropdown);
                    }
                });
            });
        }

        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.logout());
        }
    }

    updateUIForGuest() {
        const navbarCol = document.querySelector('.navbar-col:last-child');
        if (!navbarCol) return;

        navbarCol.innerHTML = `
            <li><a class="nav-link font-semibold" href="#about">о нас</a></li>
            <li><a class="nav-link font-semibold" href="login.html">Вход</a></li>
            <li><a class="nav-link btn btn-primary" href="AI.html">Начать ИИ➔</a></li>
        `;

        // Remove any user dropdown if it exists
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.remove();
        }
    }

    async makeRequest(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (this.token) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Add base URL if not already included
        if (!url.startsWith('http')) {
            url = 'http://localhost:5091' + url;
        }

        return fetch(url, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });
    }

    async resetPassword(email) {
        // This is a mock implementation since we don't have a real password reset endpoint
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if email exists in our users
            const response = await this.makeRequest('/api/users/login', {
                method: 'POST',
                body: JSON.stringify({ email, password: 'dummy-check-only' })
            });

            const data = await response.json();

            // If email doesn't exist
            if (response.status === 400 && data.errors?.email?.includes('Invalid')) {
                return {
                    success: false,
                    error: 'Email не найден в системе'
                };
            }

            return {
                success: true,
                message: 'Инструкции по сбросу пароля отправлены на ваш email'
            };
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: 'Ошибка при сбросе пароля. Пожалуйста, попробуйте позже.'
            };
        }
    }

    async updateProfile(profileData) {
        // This is a mock implementation since we don't have a real profile update endpoint
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get current user data
            const response = await this.makeRequest('/api/users/me');

            if (!response.ok) {
                return {
                    success: false,
                    error: 'Не удалось получить данные пользователя'
                };
            }

            const userData = await response.json();

            // Merge with new data (this is just a simulation)
            const updatedUser = {
                ...userData,
                ...profileData
            };

            // Update UI with new data
            this.updateUIForUser(updatedUser);

            return {
                success: true,
                message: 'Профиль успешно обновлен'
            };
        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                error: 'Ошибка при обновлении профиля. Пожалуйста, попробуйте позже.'
            };
        }
    }
}

// Initialize authentication handler
const auth = new AuthHandler();

// Form submission handlers
document.addEventListener('DOMContentLoaded', () => {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form elements
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitButton = document.getElementById('loginButton');
            const buttonText = submitButton.querySelector('.button-text');
            const loader = submitButton.querySelector('.loader');
            const errorMessage = document.getElementById('error-message');

            // Show loading state
            if (buttonText && loader) {
                buttonText.style.display = 'none';
                loader.style.display = 'block';
            }
            if (submitButton) submitButton.disabled = true;

            try {
                const result = await auth.login(email, password);

                if (result.success) {
                    // Check subscription status
                    if (result.user && result.user.subscriptionStatus === 'active') {
                        window.location.href = 'AI.html';
                    } else {
                        window.location.href = 'index.html#subscription';
                    }
                } else {
                    // Display error message
                    if (errorMessage) {
                        errorMessage.textContent = result.error;
                        errorMessage.style.display = 'block';
                    }

                    // Display field-specific errors
                    if (result.errors) {
                        const emailError = document.getElementById('email-error');
                        const passwordError = document.getElementById('password-error');

                        if (emailError) emailError.textContent = result.errors.email || '';
                        if (passwordError) passwordError.textContent = result.errors.password || '';
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                if (errorMessage) {
                    errorMessage.textContent = 'Произошла ошибка при входе. Пожалуйста, попробуйте позже.';
                    errorMessage.style.display = 'block';
                }
            } finally {
                // Hide loading state
                if (buttonText && loader) {
                    buttonText.style.display = 'inline';
                    loader.style.display = 'none';
                }
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    // Registration form
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const gender = document.querySelector('input[name="gender"]:checked')?.value;
            const birthdate = document.getElementById('birthdate').value;
            const submitButton = registrationForm.querySelector('button[type="submit"]');
            const errorMessage = document.getElementById('error-message');

            // Validate password
            if (password.length < 6) {
                if (errorMessage) {
                    errorMessage.style.color = '#dc3545';
                    errorMessage.textContent = 'Пароль должен содержать не менее 6 символов';
                    errorMessage.style.display = 'block';
                }
                return;
            }

            // Validate password match
            if (password !== confirmPassword) {
                if (errorMessage) {
                    errorMessage.style.color = '#dc3545';
                    errorMessage.textContent = 'Пароли не совпадают';
                    errorMessage.style.display = 'block';
                }
                return;
            }

            // Show loading state
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner"></span> Загрузка...';
            }

            try {
                const result = await auth.register({
                    name,
                    email,
                    phone,
                    password,
                    gender,
                    birthdate
                });

                if (result.success) {
                    // Show success message
                    if (errorMessage) {
                        errorMessage.style.color = '#28a745';
                        errorMessage.textContent = 'Регистрация успешна! Вы будете перенаправлены.';
                        errorMessage.style.display = 'block';
                    }

                    // Redirect after a short delay
                    setTimeout(() => {
                        window.location.href = 'index.html#subscription';
                    }, 1500);
                } else {
                    // Show error message
                    if (errorMessage) {
                        errorMessage.style.color = '#dc3545';
                        errorMessage.textContent = result.error;
                        errorMessage.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Registration error:', error);
                if (errorMessage) {
                    errorMessage.style.color = '#dc3545';
                    errorMessage.textContent = 'Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.';
                    errorMessage.style.display = 'block';
                }
            } finally {
                // Restore button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Зарегистрироваться';
                }
            }
        });
    }

    // Reset password form
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = resetForm.querySelector('[name="email"]').value;
            const submitButton = resetForm.querySelector('button[type="submit"]');
            const errorMessage = resetForm.querySelector('.error-message') || document.createElement('div');

            // Show loading state
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner"></span> Загрузка...';
            }

            try {
                const result = await auth.resetPassword(email);

                if (result.success) {
                    // Show success message
                    errorMessage.className = 'success-message';
                    errorMessage.style.color = '#28a745';
                    errorMessage.textContent = result.message;
                    if (!resetForm.querySelector('.success-message')) {
                        resetForm.appendChild(errorMessage);
                    }
                } else {
                    // Show error message
                    errorMessage.className = 'error-message';
                    errorMessage.style.color = '#dc3545';
                    errorMessage.textContent = result.error;
                    if (!resetForm.querySelector('.error-message')) {
                        resetForm.appendChild(errorMessage);
                    }
                }
            } catch (error) {
                console.error('Password reset error:', error);
                errorMessage.className = 'error-message';
                errorMessage.style.color = '#dc3545';
                errorMessage.textContent = 'Произошла ошибка при сбросе пароля. Пожалуйста, попробуйте позже.';
                if (!resetForm.querySelector('.error-message')) {
                    resetForm.appendChild(errorMessage);
                }
            } finally {
                // Restore button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Сбросить пароль';
                }
            }
        });
    }
});

// Helper functions for displaying messages
function showError(form, message) {
    const errorDiv = form.querySelector('.error-message') || document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    if (!form.querySelector('.error-message')) {
        form.appendChild(errorDiv);
    }
}

function showSuccess(form, message) {
    const successDiv = form.querySelector('.success-message') || document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    if (!form.querySelector('.success-message')) {
        form.appendChild(successDiv);
    }

    // Remove success message after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}
