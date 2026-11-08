
const el = id => document.getElementById(id);


/* =====================================
   SCROLL REVEAL SYSTEM
===================================== */

function initializeScrollReveal() {
  const content = el('content');

  if (!content) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const target = entry.target;

        if (entry.isIntersecting) {
          target.classList.add('visible');

          // Reveal gallery images
          if (target.classList.contains('gallery')) {
            target.querySelectorAll('button').forEach(button => {
              button.classList.add('visible');
            });
          }

          // Reveal couple images
          if (target.classList.contains('couple-grid')) {
            target.querySelectorAll('img').forEach(img => {
              img.classList.add('visible');
            });
          }

        } else {
          // Reset when scrolling away
          target.classList.remove('visible');

          if (target.classList.contains('gallery')) {
            target.querySelectorAll('button').forEach(button => {
              button.classList.remove('visible');
            });
          }

          if (target.classList.contains('couple-grid')) {
            target.querySelectorAll('img').forEach(img => {
              img.classList.remove('visible');
            });
          }
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  content.querySelectorAll('.reveal, .gallery, .couple-grid')
    .forEach(element => observer.observe(element));
}


// =====================================
// 1. GUEST NAME
// =====================================
const params = new URLSearchParams(window.location.search);
const guest = (params.get('to') || '').trim();
const guestName = guest || 'Tamu Undangan';

if (el('guest')) {
  el('guest').textContent = guestName;
}

if (el('name') && guest) {
  el('name').value = guestName;
}


// =====================================
// RSVP ATTENDANCE & GUEST COUNT
// =====================================

const attendanceInput = el('attendance');
const countInput = el('count');

function updateGuestCount() {
  if (!attendanceInput || !countInput) return;

  const notAttending = attendanceInput.value === 'Tidak hadir';

  if (notAttending) {
    countInput.value = '0';
    countInput.disabled = true;
  } else {
    countInput.disabled = false;

    if (countInput.value === '0') {
      countInput.value = '1';
    }
  }
}

attendanceInput.addEventListener('change', updateGuestCount);

// Set kondisi awal
updateGuestCount();


// =====================================
// 2. OPEN INVITATION + MUSIC
// =====================================

el('open').addEventListener('click', async () => {
  const cover = el('cover');
  const content = el('content');
  const music = el('music');
  const audio = el('audio');
  const openButton = el('open');

  // Prevent double click
  if (cover.classList.contains('is-opening')) return;

  openButton.disabled = true;
  cover.classList.add('is-opening');

  // Wait for opening animation
  await new Promise(resolve => setTimeout(resolve, 900));

  cover.hidden = true;
  cover.classList.remove('is-opening');

  content.hidden = false;
  content.style.display = 'block';
  content.style.visibility = 'visible';
  initializeScrollReveal();
  initializeSlideScroll();
   
  music.hidden = false;
  window.scrollTo(0, 0);

  // Start background music after user interaction
  audio.loop = true;
  audio.volume = 0.8;

  try {
    await audio.play();
    music.classList.add('playing');
  } catch (error) {
    console.error('Music playback failed:', error);
    alert('Musik belum bisa diputar. Periksa file wedding.mp3 dan lokasinya.');
  }
});

// =====================================
// 3. COUNTDOWN
// =====================================
function tick() {
  const diff = Math.max(0, new Date(WEDDING.date) - Date.now());

  const vals = [
    Math.floor(diff / 86400000),
    Math.floor(diff / 3600000) % 24,
    Math.floor(diff / 60000) % 60,
    Math.floor(diff / 1000) % 60
  ];

  ['days', 'hours', 'minutes', 'seconds'].forEach((id, i) => {
    if (el(id)) {
      el(id).textContent = String(vals[i]).padStart(2, '0');
    }
  });
}

tick();
setInterval(tick, 1000);

// =====================================
// 4. GOOGLE CALENDAR
// =====================================
if (el('calendar')) {
  el('calendar').href =
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(WEDDING.title)}&dates=${WEDDING.calendarStartUTC}/${WEDDING.calendarEndUTC}&location=${encodeURIComponent(WEDDING.venue)}`;
}

// =====================================
// 5. TOAST
// =====================================
let toastTimer;

function toast(message) {
  if (!el('toast')) return;

  el('toast').textContent = message;
  el('toast').classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    el('toast').classList.remove('show');
  }, 2800);
}

// =====================================
// 6. COPY BANK ACCOUNT
// =====================================
if (el('copyAccount')) {
  el('copyAccount').onclick = async () => {
    try {
      await navigator.clipboard.writeText(
        el('account').textContent.trim()
      );
      toast('Nomor rekening disalin');
    } catch {
      toast('Silakan salin nomor secara manual');
    }
  };
}

// =====================================
// 7. VINYL RECORD - NO STOP BUTTON
// =====================================
const audio = el('audio');

audio.addEventListener('ended', () => {
  audio.play().catch(error => console.log(error));
});

audio.addEventListener('error', () => {
  console.error('Audio file could not be loaded:', audio.error);
});

// =====================================
// 8. PHOTO GALLERY
// =====================================
document.querySelectorAll('.gallery button').forEach(button => {
  button.onclick = () => {
    el('fullPhoto').src = button.querySelector('img').src;
    el('lightbox').hidden = false;
  };
});

if (el('closePhoto')) {
  el('closePhoto').onclick = () => {
    el('lightbox').hidden = true;
  };
}

if (el('lightbox')) {
  el('lightbox').onclick = event => {
    if (event.target.id === 'lightbox') {
      el('lightbox').hidden = true;
    }
  };
}



```javascript
/* =====================================
   POWERPOINT-LIKE PAGE TRANSITION
===================================== */

function initializeSlideScroll() {
  const content = el('content');

  if (!content) return;

  const sections = Array.from(content.children).filter(section =>
    section.tagName === 'SECTION'
  );

  if (sections.length < 2) {
    console.warn('Slide sections not found. Check HTML structure.');
    return;
  }

  let currentSlide = 0;
  let isAnimating = false;
  let touchStartY = 0;

  function goToSlide(index) {
    if (isAnimating) return;

    const nextSlide = Math.max(
      0,
      Math.min(index, sections.length - 1)
    );

    if (nextSlide === currentSlide) return;

    currentSlide = nextSlide;
    isAnimating = true;

    sections[currentSlide].scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    setTimeout(() => {
      isAnimating = false;
    }, 1100);
  }

  // Mouse wheel
  window.addEventListener('wheel', event => {
    if (event.target.closest(
      'input, textarea, select, button, a, #lightbox'
    )) return;

    event.preventDefault();

    if (isAnimating || Math.abs(event.deltaY) < 10) return;

    goToSlide(currentSlide + (event.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  // Keyboard
  window.addEventListener('keydown', event => {
    if (event.target.matches('input, textarea, select')) return;

    if (['ArrowDown', 'PageDown'].includes(event.key)) {
      event.preventDefault();
      goToSlide(currentSlide + 1);
    }

    if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      goToSlide(currentSlide - 1);
    }
  });

  // Touch / mobile swipe
  window.addEventListener('touchstart', event => {
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', event => {
    const touchEndY = event.changedTouches[0].clientY;
    const difference = touchStartY - touchEndY;

    if (Math.abs(difference) < 50) return;

    goToSlide(currentSlide + (difference > 0 ? 1 : -1));
  }, { passive: true });
}
```

















