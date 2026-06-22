function formatDate(dateStr) {
  if (!dateStr) return '';
  if (!dateStr.toString().includes('-')) return `Ngày ${dateStr}`;
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

let memories = [];
let slides = [];
let current = 0;
let isPlaying = true;
let startTime = null;
let rafId = null;
let photoInterval = null;
let idleTimeout = null;
let controlsVisible = true;
let isTransitioning = false;

const dotsEl = document.getElementById('dots');
const progressBar = document.getElementById('progress-bar');
const progressWrap = document.querySelector('.progress-bar-wrap');
const counter = document.getElementById('slide-counter');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnPlay = document.getElementById('btn-playpause');
const slidesWrapper = document.getElementById('slides-wrapper');
const keyboardHint = document.getElementById('keyboard-hint');
const swipeIndicator = document.getElementById('swipe-indicator');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function getSlideDuration() {
  const mem = memories[current];
  const secs = mem && mem.duration ? parseFloat(mem.duration) : 5;
  return (Number.isNaN(secs) || secs <= 0 ? 5 : secs) * 1000;
}

function getDayNumber(dayStr) {
  if (!dayStr) return '';
  const start = new Date('2025-10-02');
  const end = new Date(dayStr);
  const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? `+${diff}` : '';
}

// ===== PARTICLES ENGINE =====
function initParticles() {
  const canvas = document.getElementById('journey-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId = null;
  let mouseX = -1000;
  let mouseY = -1000;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    const count = Math.min(60, Math.floor(window.innerWidth / 20));
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.4 + 0.1,
        hue: 340 + Math.random() * 30,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now() * 0.001;

    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += 0.02;

      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;

      const pulseAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let repulsion = 1;
      if (dist < 120) {
        repulsion = dist / 120;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * repulsion, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 60%, 65%, ${pulseAlpha * repulsion})`;
      ctx.fill();

      // Connection lines
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx2 = p.x - q.x;
        const dy2 = p.y - q.y;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (dist2 < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `hsla(340, 40%, 50%, ${0.06 * (1 - dist2 / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });

    animId = requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  return () => {
    if (animId) cancelAnimationFrame(animId);
  };
}

// ===== FLOATING HEARTS =====
function initFloatingHearts() {
  const container = document.querySelector('.floating-hearts');
  if (!container) return;
  const symbols = ['♥', '❤', '💕', '♡'];
  let heartCount = 0;
  const maxHearts = 15;

  function createHeart() {
    if (heartCount >= maxHearts) return;
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    heart.style.left = Math.random() * 100 + '%';
    heart.style.fontSize = (Math.random() * 16 + 12) + 'px';
    heart.style.animationDuration = (Math.random() * 15 + 15) + 's';
    heart.style.animationDelay = (Math.random() * 5) + 's';
    container.appendChild(heart);
    heartCount++;

    heart.addEventListener('animationend', () => {
      heart.remove();
      heartCount--;
    });
  }

  // Create initial batch
  for (let i = 0; i < 8; i++) {
    setTimeout(createHeart, i * 800);
  }

  // Continuously create hearts
  const interval = setInterval(() => {
    if (heartCount < maxHearts) createHeart();
  }, 3000);

  return () => clearInterval(interval);
}

// ===== SLIDE MANAGEMENT =====
async function initJourney() {
  memories = await getMemoriesFromDB();
  slidesWrapper.innerHTML = '';

  memories.forEach((item, index) => {
    const hue = (index * 45 + 340) % 360;
    const hasImages = item.images && item.images.length > 0;
    const slide = document.createElement('div');
    slide.className = `slide ${index === 0 ? 'active' : ''}`;
    const dayNum = getDayNumber(item.day);

    slide.innerHTML = `
      <div class="slide-bg" style="--hue:${hue}"></div>
      <div class="slide-content">
        <div class="polaroid-frame">
          ${hasImages ? `
            <div class="polaroid-photos">
              ${item.images.map((img, imgIndex) => `
                <div class="slide-photo-item ${imgIndex === 0 ? 'active' : ''}">
                  <img src="${img}" alt="Ảnh kỷ niệm" loading="lazy" />
                </div>
              `).join('')}
            </div>
            <div class="photo-indicators">
              ${item.images.map((_, imgIndex) => `
                <span class="photo-dot ${imgIndex === 0 ? 'active' : ''}"></span>
              `).join('')}
            </div>
          ` : '<div class="fallback-heart">💖</div>'}
          <div class="polaroid-caption">${formatDate(item.day)} 💕</div>
        </div>
        <div class="slide-text-content">
          <div class="slide-tag">
            <span class="slide-tag-icon">📅</span>
            ${formatDate(item.day)}
          </div>
          <h2 class="slide-title">${escapeHtml(item.title)}</h2>
          <p class="slide-text">${escapeHtml(item.description)}</p>
          <div class="slide-deco">
            <span class="slide-deco-line"></span>
            <span class="slide-deco-heart">♥</span>
            <span class="slide-deco-line"></span>
          </div>
          ${dayNum ? `
            <div class="day-badge">
              <span class="day-number">${dayNum}</span>
              <span class="day-label">ngày</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    slidesWrapper.appendChild(slide);
  });

  slides = [...document.querySelectorAll('.slide')];
  updateCounter();
  buildDots();
  startPhotoCycling(0);
  resetProgress();

  // Show hints after a moment
  setTimeout(() => {
    if (keyboardHint) keyboardHint.classList.add('visible');
    if (swipeIndicator) swipeIndicator.classList.add('visible');
  }, 3000);

  // Hide hints after 8 seconds
  setTimeout(() => {
    if (keyboardHint) keyboardHint.classList.remove('visible');
    if (swipeIndicator) swipeIndicator.classList.remove('visible');
  }, 10000);
}

function updateCounter() {
  if (!counter) return;
  counter.innerHTML = `
    <span class="slide-counter-current">${current + 1}</span>
    <span class="slide-counter-divider">/</span>
    <span class="slide-counter-total">${slides.length}</span>
  `;
}

function buildDots() {
  dotsEl.innerHTML = '';
  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = `dot ${index === 0 ? 'active' : ''}`;
    dot.type = 'button';
    dot.setAttribute('aria-label', `Chuyển đến slide ${index + 1}`);
    dot.addEventListener('click', () => goTo(index));
    dotsEl.appendChild(dot);
  });
}

function updateDots() {
  dotsEl.querySelectorAll('.dot').forEach((dot, dotIndex) => {
    dot.classList.toggle('active', dotIndex === current);
  });
}

function startPhotoCycling(index) {
  clearInterval(photoInterval);
  const photos = slides[index]?.querySelectorAll('.slide-photo-item') || [];
  const indicators = slides[index]?.querySelectorAll('.photo-dot') || [];
  if (photos.length <= 1) return;

  let photoIndex = 0;
  photoInterval = setInterval(() => {
    photos[photoIndex].classList.remove('active');
    if (indicators[photoIndex]) indicators[photoIndex].classList.remove('active');
    photoIndex = (photoIndex + 1) % photos.length;
    photos[photoIndex].classList.add('active');
    if (indicators[photoIndex]) indicators[photoIndex].classList.add('active');
  }, 1500);
}

function goTo(index, direction) {
  if (isTransitioning || !slides.length) return;
  isTransitioning = true;

  const prevSlide = slides[current];
  current = (index + slides.length) % slides.length;
  const nextSlide = slides[current];

  // Apply exit direction
  if (prevSlide) {
    prevSlide.classList.remove('active');
    if (direction === 'next') {
      prevSlide.classList.add('exit-left');
      setTimeout(() => prevSlide.classList.remove('exit-left'), 900);
    } else if (direction === 'prev') {
      prevSlide.classList.add('exit-right');
      setTimeout(() => prevSlide.classList.remove('exit-right'), 900);
    }
  }

  nextSlide.classList.add('active');
  updateCounter();
  updateDots();
  startPhotoCycling(current);
  resetProgress();

  setTimeout(() => {
    isTransitioning = false;
  }, 900);
}

function next() {
  if (isTransitioning) return;
  if (current === slides.length - 1) {
    // Navigate to birthday page with a nice effect
    slidesWrapper.style.opacity = '0';
    slidesWrapper.style.transition = 'opacity 0.6s ease';
    setTimeout(() => {
      window.location.href = 'birthday.html';
    }, 600);
    return;
  }
  goTo(current + 1, 'next');
}

function prev() {
  if (isTransitioning) return;
  goTo(current - 1, 'prev');
}

function resetProgress() {
  cancelAnimationFrame(rafId);
  startTime = null;
  if (progressBar) progressBar.style.width = '0%';
  if (isPlaying) rafId = requestAnimationFrame(tickProgress);
}

function tickProgress(timestamp) {
  if (!isPlaying) return;
  if (!startTime) startTime = timestamp;
  const pct = Math.min(((timestamp - startTime) / getSlideDuration()) * 100, 100);
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (pct >= 100) {
    next();
    return;
  }
  rafId = requestAnimationFrame(tickProgress);
}

// ===== CONTROLS =====
btnPlay.addEventListener('click', () => {
  isPlaying = !isPlaying;
  btnPlay.textContent = isPlaying ? '⏸' : '▶';
  btnPlay.setAttribute('aria-label', isPlaying ? 'Tạm dừng' : 'Phát');
  if (isPlaying) resetProgress();
  else cancelAnimationFrame(rafId);
  resetIdleTimer();
});

btnNext.addEventListener('click', () => {
  next();
  resetIdleTimer();
});

btnPrev.addEventListener('click', () => {
  prev();
  resetIdleTimer();
});

// Progress bar click to seek
if (progressWrap) {
  progressWrap.addEventListener('click', (e) => {
    const rect = progressWrap.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const duration = getSlideDuration();
    const elapsed = duration * pct;
    startTime = performance.now() - elapsed;
    if (progressBar) progressBar.style.width = `${pct * 100}%`;
    resetIdleTimer();
  });
}

// ===== KEYBOARD NAVIGATION =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault();
    next();
    resetIdleTimer();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    prev();
    resetIdleTimer();
  } else if (e.key === 'Escape') {
    window.location.href = 'index.html';
  }
});

// ===== TOUCH / SWIPE SUPPORT =====
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isSwiping = false;

document.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchEndX = touch.clientX;
  touchEndY = touch.clientY;
  isSwiping = true;
  resetIdleTimer();
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (!isSwiping) return;
  const touch = e.touches[0];
  touchEndX = touch.clientX;
  touchEndY = touch.clientY;
}, { passive: true });

document.addEventListener('touchend', () => {
  if (!isSwiping) return;
  isSwiping = false;
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx > 50 && absDx > absDy * 1.2) {
    if (dx > 0) prev();
    else next();
  }
}, { passive: true });

// ===== IDLE TIMER - Auto hide controls =====
function resetIdleTimer() {
  clearTimeout(idleTimeout);
  showControls();
  idleTimeout = setTimeout(hideControls, 4000);
}

function showControls() {
  if (controlsVisible) return;
  controlsVisible = true;
  const controls = document.querySelector('.controls');
  const topBar = document.querySelector('.top-bar');
  if (controls) controls.style.opacity = '1';
  if (topBar) topBar.style.opacity = '1';
}

function hideControls() {
  if (!isPlaying) return;
  controlsVisible = false;
  const controls = document.querySelector('.controls');
  const topBar = document.querySelector('.top-bar');
  if (controls) controls.style.opacity = '0';
  if (topBar) topBar.style.opacity = '0';
}

// Show controls on any interaction
document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('click', resetIdleTimer);

// Start idle timer
resetIdleTimer();

// ===== MUSIC CONTROL =====
function setupMusicControl() {
  const audio = document.getElementById('bg-music');
  const control = document.getElementById('music-control');
  if (!audio || !control) return;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      const startAudio = () => {
        audio.play().catch(() => {});
        document.removeEventListener('click', startAudio);
        document.removeEventListener('touchstart', startAudio);
      };
      document.addEventListener('click', startAudio);
      document.addEventListener('touchstart', startAudio);
    });
  }

  control.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {});
      control.classList.remove('is-paused');
    } else {
      audio.pause();
      control.classList.add('is-paused');
    }
    resetIdleTimer();
  });

  audio.addEventListener('pause', () => {
    if (!audio.ended) control.classList.add('is-paused');
  });
  audio.addEventListener('play', () => {
    control.classList.remove('is-paused');
  });
}

// ===== INIT =====
setupMusicControl();
const stopParticles = initParticles();
const stopHearts = initFloatingHearts();
initJourney();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (stopParticles) stopParticles();
  if (stopHearts) stopHearts();
  clearInterval(photoInterval);
  cancelAnimationFrame(rafId);
  clearTimeout(idleTimeout);
});