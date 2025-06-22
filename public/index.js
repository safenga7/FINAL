// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const navbarBtn = document.querySelector('.navbar-btn');
    const navbarCol = document.querySelector('.navbar-col:last-child');
    
    if (navbarBtn && navbarCol) {
        navbarBtn.addEventListener('click', function() {
            navbarCol.classList.toggle('show');
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (navbarCol.classList.contains('show')) {
                    navbarCol.classList.remove('show');
                }
            }
        });
    });
    
    // Library filtering
    const filterContent = () => {
        const searchInput = document.getElementById('searchInput');
        const filter = searchInput.value.toLowerCase();
        const items = document.querySelectorAll('.library-item');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(filter)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    };
    
    // Category filtering
    window.filterCategory = function(category) {
        const items = document.querySelectorAll('.library-item');
        const buttons = document.querySelectorAll('.category-btn');
        
        // Update active button
        buttons.forEach(btn => {
            if (btn.textContent.toLowerCase().includes(category) || 
                (category === 'all' && btn.textContent.toLowerCase().includes('все'))) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Show/hide items
        if (category === 'all') {
            items.forEach(item => {
                item.style.display = '';
            });
        } else {
            items.forEach(item => {
                if (item.classList.contains(category)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        }
    };
    
    // Attach search event
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', filterContent);
    }
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.padding = '0.5rem 0';
                navbar.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
            } else {
                navbar.style.padding = '1rem 0';
                navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            }
        });
    }
    
    // Animate elements on scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.subscription-plan, .about-container, .library-item, .doctor-card');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };
    
    // Set initial state for animated elements
    const elementsToAnimate = document.querySelectorAll('.subscription-plan, .about-container, .library-item, .doctor-card');
    elementsToAnimate.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.6s ease';
    });
    
    // Run animation on load and scroll
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);
});
