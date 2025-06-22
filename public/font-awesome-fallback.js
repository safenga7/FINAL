// Font Awesome CDN Fallback Script
document.addEventListener('DOMContentLoaded', function() {
    // Check if Font Awesome is loaded
    function isFontAwesomeLoaded() {
        // Create a test element with a Font Awesome icon
        const testElement = document.createElement('i');
        testElement.className = 'fa fa-check';
        testElement.style.display = 'none';
        document.body.appendChild(testElement);
        
        // Check if the computed style has a different width than a regular element
        // This indicates that Font Awesome is loaded
        const isFALoaded = window.getComputedStyle(testElement).fontFamily.includes('FontAwesome') || 
                          window.getComputedStyle(testElement).fontFamily.includes('Font Awesome');
        
        // Clean up
        document.body.removeChild(testElement);
        
        return isFALoaded;
    }
    
    // If Font Awesome is not loaded, show a warning
    if (!isFontAwesomeLoaded()) {
        console.warn('Font Awesome could not be loaded from CDN. Some icons may not display correctly.');
        
        // Create a warning message for the user
        const warningElement = document.createElement('div');
        warningElement.style.position = 'fixed';
        warningElement.style.bottom = '10px';
        warningElement.style.right = '10px';
        warningElement.style.backgroundColor = '#fff3cd';
        warningElement.style.color = '#856404';
        warningElement.style.padding = '10px 15px';
        warningElement.style.borderRadius = '4px';
        warningElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        warningElement.style.zIndex = '9999';
        warningElement.style.fontSize = '14px';
        warningElement.innerHTML = 'Некоторые иконки могут отображаться некорректно. Проверьте подключение к интернету.';
        
        // Add a close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.marginLeft = '10px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '18px';
        closeButton.style.fontWeight = 'bold';
        closeButton.onclick = function() {
            document.body.removeChild(warningElement);
        };
        
        warningElement.appendChild(closeButton);
        document.body.appendChild(warningElement);
        
        // Try to load Font Awesome locally if available
        const localFallbackLink = document.createElement('link');
        localFallbackLink.rel = 'stylesheet';
        localFallbackLink.href = 'css/fontawesome-all.min.css'; // Assuming you have a local copy
        document.head.appendChild(localFallbackLink);
    }
});
