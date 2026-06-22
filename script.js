// ===== CONSTANTS =====
const START_DATE = new Date('2025-02-10T00:00:00');

// ===== DATE UTILITIES =====
function formatDate(date) {
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDayCount() {
  const today = new Date();
  return Math.max(1, Math.floor((today - START_DATE) / 86400000) + 1);
}

// ===== UPDATE DATES & COUNTERS =====
function updateDates() {
  const today = new Date();
  const days = getDayCount();

  const dayCounter = document.getElementById('day-counter');
  const dateStart = document.getElementById('date-start');
  const dateToday = document.getElementById('date-today');
  const statDays = document.getElementById('stat-days');

  if (dayCounter) dayCounter.textContent = days.toLocaleString('vi-VN');
  if (dateStart) dateStart.textContent = formatDate(START_DATE);
  if (dateToday) dateToday.textContent = formatDate(today);
  if (statDays) statDays.setAttribute('data-target', days);
}

// ===== NAVIGATION =====
function setupNavigation() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!nav) return;

  // Scroll effect
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });

  // Mobile toggle
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        mobileMenu.classList.remove('open');
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = nav.offsetHeight + 20;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ===== SCROLL REVEAL =====
function setupScrollReveal() {
  const elements = document.querySelectorAll('.reveal-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Stagger the animations
        const delay = index * 100;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

// ===== STAT COUNTER ANIMATION =====
function setupStatCounters() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (!statNumbers.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => observer.observe(el));
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-target'));
  if (isNaN(target)) return;

  const duration = 2000;
  const startTime = performance.now();

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutExpo(progress);
    const current = Math.floor(eased * target);

    element.textContent = current.toLocaleString('vi-VN');

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target.toLocaleString('vi-VN');
    }
  }

  requestAnimationFrame(update);
}

// ===== PARTICLES =====
function setupParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const particles = [];
  let width = 0;
  let height = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: height + 20,
      size: Math.random() * 10 + 6,
      speedY: Math.random() * 0.35 + 0.12,
      speedX: (Math.random() - 0.5) * 0.25,
      drift: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.25 + 0.05,
      symbol: ['♥', '♡', '✦', '·', '°'][Math.floor(Math.random() * 5)],
      color: [
        'rgba(232,81,106,',
        'rgba(249,168,184,',
        'rgba(240,192,96,',
        'rgba(160,160,184,'
      ][Math.floor(Math.random() * 4)],
    };
  }

  resize();
  window.addEventListener('resize', resize);

  // Initialize particles at random positions
  for (let i = 0; i < 35; i++) {
    const particle = createParticle();
    particle.y = Math.random() * height;
    particles.push(particle);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((particle, index) => {
      particle.drift += 0.008;
      particle.x += particle.speedX + Math.sin(particle.drift) * 0.18;
      particle.y -= particle.speedY;
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.font = `${particle.size}px serif`;
      ctx.fillStyle = `${particle.color}${particle.alpha})`;
      ctx.fillText(particle.symbol, particle.x, particle.y);
      ctx.restore();
      if (particle.y < -30) particles[index] = createParticle();
    });
    requestAnimationFrame(draw);
  }

  draw();
}

// ===== HEART BURST =====
function burstAt(x, y, count = 30) {
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('span');
    heart.className = 'burst-heart-particle';
    heart.textContent = ['♥', '♡', '✦', '💕', '💗'][Math.floor(Math.random() * 5)];
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.fontSize = `${Math.random() * 20 + 10}px`;
    heart.style.setProperty('--dx', `${(Math.random() - 0.5) * 350}px`);
    heart.style.setProperty('--dy', `${(Math.random() - 0.7) * 300}px`);
    heart.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`);
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1200);
  }
}

function setupHeartButton() {
  const heartBtn = document.getElementById('heart-btn');
  if (!heartBtn) return;

  heartBtn.addEventListener('click', () => {
    const rect = heartBtn.getBoundingClientRect();
    burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 36);
  });
}

// ===== COUNTER RING ANIMATION =====
function setupCounterRing() {
  const circle = document.getElementById('counter-circle');
  if (!circle) return;

  // Animate the ring to show progress (visual only)
  const circumference = 2 * Math.PI * 54; // r=54
  const days = getDayCount();
  // Map days to percentage (e.g., 500 days = 83% of ring)
  const percentage = Math.min((days / 600) * 100, 95);
  const offset = circumference - (percentage / 100) * circumference;

  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
  }, 500);
}

// ===== PARALLAX EFFECT ON HERO =====
function setupParallax() {
  const orbs = document.querySelectorAll('.hero-gradient-orb');
  if (!orbs.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    orbs.forEach((orb, i) => {
      const speed = (i + 1) * 8;
      orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  }, { passive: true });
}

// ===== HIDE SCROLL HINT ON SCROLL =====
function setupScrollHint() {
  const hint = document.querySelector('.hero-scroll-hint');
  if (!hint) return;

  let hidden = false;
  window.addEventListener('scroll', () => {
    if (!hidden && window.scrollY > 100) {
      hint.style.opacity = '0';
      hint.style.transform = 'translateX(-50%) translateY(20px)';
      hint.style.transition = 'opacity 0.5s, transform 0.5s';
      hidden = true;
    }
  }, { passive: true });
}

// ===== MUSIC CONTROL =====
function setupMusicControl() {
  const audio = document.getElementById('bg-music');
  const control = document.getElementById('music-control');
  if (!audio || !control) return;

  // Try to autoplay (will work if user has interacted with the site before)
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Autoplay blocked — wait for first user interaction
      const startAudio = () => {
        audio.play().catch(() => {});
        document.removeEventListener('click', startAudio);
        document.removeEventListener('touchstart', startAudio);
      };
      document.addEventListener('click', startAudio);
      document.addEventListener('touchstart', startAudio);
    });
  }

  // Toggle play/pause
  control.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {});
      control.classList.remove('is-paused');
    } else {
      audio.pause();
      control.classList.add('is-paused');
    }
  });

  // Listen for when audio is paused by browser (e.g., another tab plays media)
  audio.addEventListener('pause', () => {
    if (!audio.ended) {
      control.classList.add('is-paused');
    }
  });
  audio.addEventListener('play', () => {
    control.classList.remove('is-paused');
  });
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
  updateDates();
  setupNavigation();
  setupParticles();
  setupHeartButton();
  setupScrollReveal();
  setupStatCounters();
  setupCounterRing();
  setupParallax();
  setupScrollHint();
  setupMusicControl();
});
