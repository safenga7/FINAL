// Form Validation and API Integration Script

document.addEventListener('DOMContentLoaded', function() {
    // Get all forms on the page
    const forms = document.querySelectorAll('form');
    
    // Add submit event listener to each form
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            // Prevent the default form submission
            event.preventDefault();
            
            // Validate the form
            if (validateForm(form)) {
                // If validation passes, submit the form data
                submitFormData(form);
            }
        });
    });
    
    // Form validation function
    function validateForm(form) {
        let isValid = true;
        
        // Get all required inputs
        const requiredInputs = form.querySelectorAll('[required]');
        
        // Check each required input
        requiredInputs.forEach(input => {
            // Remove any existing error messages
            removeErrorMessage(input);
            
            // Check if the input is empty
            if (!input.value.trim()) {
                showErrorMessage(input, 'Это поле обязательно для заполнения');
                isValid = false;
                return;
            }
            
            // Validate email format if it's an email input
            if (input.type === 'email' && !validateEmail(input.value)) {
                showErrorMessage(input, 'Пожалуйста, введите корректный email');
                isValid = false;
                return;
            }
            
            // Validate password length if it's a password input
            if (input.type === 'password' && input.value.length < 8) {
                showErrorMessage(input, 'Пароль должен содержать не менее 8 символов');
                isValid = false;
                return;
            }
            
            // Check password confirmation if it exists
            if (input.id === 'confirm-password') {
                const password = form.querySelector('#password');
                if (password && input.value !== password.value) {
                    showErrorMessage(input, 'Пароли не совпадают');
                    isValid = false;
                    return;
                }
            }
        });
        
        return isValid;
    }
    
    // Email validation function
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Show error message function
    function showErrorMessage(input, message) {
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = '#dc3545';
        errorElement.style.fontSize = '12px';
        errorElement.style.marginTop = '5px';
        
        // Insert error message after the input
        input.parentNode.insertBefore(errorElement, input.nextSibling);
        
        // Add error class to the input
        input.classList.add('error-input');
        input.style.borderColor = '#dc3545';
    }
    
    // Remove error message function
    function removeErrorMessage(input) {
        // Remove error class from the input
        input.classList.remove('error-input');
        input.style.borderColor = '';
        
        // Remove any existing error messages
        const errorElement = input.nextElementSibling;
        if (errorElement && errorElement.className === 'error-message') {
            errorElement.parentNode.removeChild(errorElement);
        }
    }
    
    // Submit form data function
    function submitFormData(form) {
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Загрузка...';
        submitButton.disabled = true;
        
        // Get form data
        const formData = new FormData(form);
        const formDataObject = {};
        
        // Convert FormData to object
        formData.forEach((value, key) => {
            formDataObject[key] = value;
        });
        
        // Determine the API endpoint based on the form
        let apiEndpoint = '';
        
        if (form.closest('.auth-form-container')) {
            // Authentication forms
            if (form.querySelector('#confirm-password')) {
                apiEndpoint = '/api/users/register'; // Registration form
            } else if (form.querySelector('#password') && form.querySelector('#email')) {
                apiEndpoint = '/api/users/login'; // Login form
            } else if (form.querySelector('#email') && !form.querySelector('#password')) {
                apiEndpoint = '/api/users/reset-password'; // Password reset form
            }
        } else if (form.closest('.payment-form')) {
            apiEndpoint = '/api/payments/process'; // Payment form
        } else if (form.closest('.booking-container')) {
            apiEndpoint = '/api/sessions/book'; // Booking form
        }
        
        // If no endpoint was determined, use a default
        if (!apiEndpoint) {
            apiEndpoint = '/api/form-submit';
        }
        
        // Make API request
        fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formDataObject)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle successful response
            console.log('Success:', data);
            
            // Show success message
            showMessage('success', 'Операция выполнена успешно!');
            
            // Redirect if needed
            if (data.redirect) {
                window.location.href = data.redirect;
            }
            
            // Reset form
            form.reset();
        })
        .catch(error => {
            // Handle error
            console.error('Error:', error);
            
            // Show error message
            showMessage('error', 'Произошла ошибка. Пожалуйста, попробуйте еще раз.');
        })
        .finally(() => {
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        });
    }
    
    // Show message function
    function showMessage(type, message) {
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        // Style the message
        messageElement.style.position = 'fixed';
        messageElement.style.top = '20px';
        messageElement.style.right = '20px';
        messageElement.style.padding = '15px 20px';
        messageElement.style.borderRadius = '4px';
        messageElement.style.zIndex = '9999';
        
        if (type === 'success') {
            messageElement.style.backgroundColor = '#d4edda';
            messageElement.style.color = '#155724';
            messageElement.style.border = '1px solid #c3e6cb';
        } else {
            messageElement.style.backgroundColor = '#f8d7da';
            messageElement.style.color = '#721c24';
            messageElement.style.border = '1px solid #f5c6cb';
        }
        
        // Add close button
        const closeButton = document.createElement('span');
        closeButton.textContent = '×';
        closeButton.style.marginLeft = '10px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontWeight = 'bold';
        closeButton.onclick = function() {
            document.body.removeChild(messageElement);
        };
        
        messageElement.appendChild(closeButton);
        
        // Add to body
        document.body.appendChild(messageElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(messageElement)) {
                document.body.removeChild(messageElement);
            }
        }, 5000);
    }
});
