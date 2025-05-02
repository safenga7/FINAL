// Form Validation and API Integration Script

document.addEventListener('DOMContentLoaded', () => {
    // Form validation patterns
    const patterns = {
        email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
        phone: /^\+?[1-9][0-9]{7,14}$/
    };

    // Error messages
    const errorMessages = {
        email: 'Пожалуйста, введите действительный адрес электронной почты',
        password: 'Пароль должен содержать минимум 8 символов, включая буквы и цифры',
        phone: 'Пожалуйста, введите действительный номер телефона',
        required: 'Это поле обязательно для заполнения'
    };

    function validateInput(input) {
        const field = input.getAttribute('name');
        const value = input.value.trim();
        
        // Required field validation
        if (input.hasAttribute('required') && !value) {
            showError(input, errorMessages.required);
            return false;
        }

        // Pattern validation
        if (patterns[field] && !patterns[field].test(value)) {
            showError(input, errorMessages[field]);
            return false;
        }

        // Password confirmation validation
        if (field === 'password_confirm') {
            const password = document.querySelector('input[name="password"]').value;
            if (value !== password) {
                showError(input, 'Пароли не совпадают');
                return false;
            }
        }

        clearError(input);
        return true;
    }

    function showError(input, message) {
        const errorElement = input.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            const error = document.createElement('div');
            error.className = 'error-message';
            error.textContent = message;
            input.parentNode.insertBefore(error, input.nextSibling);
        }
        input.classList.add('error');
    }

    function clearError(input) {
        const errorElement = input.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.style.display = 'none';
        }
        input.classList.remove('error');
    }

    // Form submission handler
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            let isValid = true;
            form.querySelectorAll('input, textarea, select').forEach(input => {
                if (!validateInput(input)) {
                    isValid = false;
                }
            });

            if (isValid) {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                try {
                    const response = await fetch(form.action, {
                        method: form.method || 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const result = await response.json();
                    
                    // Show success message
                    const successMessage = document.createElement('div');
                    successMessage.className = 'success-message';
                    successMessage.textContent = 'Форма успешно отправлена!';
                    form.appendChild(successMessage);

                    // Reset form
                    form.reset();

                    // Remove success message after 3 seconds
                    setTimeout(() => {
                        successMessage.remove();
                    }, 3000);

                } catch (error) {
                    console.error('Error:', error);
                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'error-message';
                    errorMessage.textContent = 'Произошла ошибка при отправке формы. Пожалуйста, попробуйте снова.';
                    form.appendChild(errorMessage);
                }
            }
        });

        // Real-time validation
        form.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('blur', () => validateInput(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    validateInput(input);
                }
            });
        });
    });
});
