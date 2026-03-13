// =====================
// i18n System
// =====================
let currentLang = localStorage.getItem('lang') || 'en';
let translations = {};

async function loadTranslations(lang) {
    const res = await fetch(`i18n/${lang}.json`);
    return res.json();
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o || {})[k], obj);
}

function applyTranslations() {
    const t = translations[currentLang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const val = getNestedValue(t, el.dataset.i18n);
        if (val) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-list]').forEach(ul => {
        const items = getNestedValue(t, ul.dataset.i18nList);
        if (!items || !Array.isArray(items)) return;
        ul.innerHTML = items.map(item => `<li>${item}</li>`).join('');
    });

    document.documentElement.lang = currentLang === 'ja' ? 'ja' : 'en';

    const toggle = document.getElementById('langToggle');
    if (toggle) {
        toggle.textContent = currentLang === 'ja' ? 'EN' : 'JP';
    }
}

async function initI18n() {
    translations.en = await loadTranslations('en');
    translations.ja = await loadTranslations('ja');
    applyTranslations();
}

function switchLang() {
    currentLang = currentLang === 'en' ? 'ja' : 'en';
    localStorage.setItem('lang', currentLang);
    applyTranslations();
}

// =====================
// Navigation
// =====================
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

function closeMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}

const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(n => n.addEventListener('click', closeMenu));

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Active nav highlighting
window.addEventListener('scroll', () => {
    let current = '';
    document.querySelectorAll('section').forEach(section => {
        if (scrollY >= section.offsetTop - 200) {
            current = section.getAttribute('id');
        }
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// =====================
// Animations
// =====================
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, observerOptions);

const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.skill-progress').forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => { bar.style.width = width; }, 500);
            });
        }
    });
}, observerOptions);

// =====================
// Contact Form
// =====================
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 100);

    const dismiss = () => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => notification.remove(), 300);
    };

    notification.querySelector('.notification-close').addEventListener('click', dismiss);
    setTimeout(() => { if (notification.parentNode) dismiss(); }, 5000);
}

// =====================
// Scroll Progress
// =====================
function createScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.innerHTML = '<div class="scroll-progress-bar"></div>';
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
        const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        bar.querySelector('.scroll-progress-bar').style.width = pct + '%';
    });
}

// =====================
// Init
// =====================
document.addEventListener('DOMContentLoaded', () => {
    // i18n
    initI18n();

    // Language toggle
    document.getElementById('langToggle').addEventListener('click', switchLang);

    // Fade-in animations
    document.querySelectorAll('.timeline-item, .project-card, .skill-category, .stat').forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // Skill bar animation
    const skillsSection = document.querySelector('.skills');
    if (skillsSection) skillObserver.observe(skillsSection);

    // Scroll progress
    createScrollProgress();

    // Contact form
    const form = document.querySelector('.contact-form form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const fd = new FormData(this);
            const t = translations[currentLang] || {};

            if (!fd.get('name') || !fd.get('email') || !fd.get('message')) {
                showNotification(getNestedValue(t, 'contact.notification_error_fields') || 'Please fill in all fields', 'error');
                return;
            }
            if (!isValidEmail(fd.get('email'))) {
                showNotification(getNestedValue(t, 'contact.notification_error_email') || 'Please enter a valid email', 'error');
                return;
            }
            showNotification(getNestedValue(t, 'contact.notification_success') || 'Message sent!', 'success');
            this.reset();
        });
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
            const n = document.querySelector('.notification');
            if (n) { n.style.transform = 'translateX(120%)'; setTimeout(() => n.remove(), 300); }
        }
    });
});
