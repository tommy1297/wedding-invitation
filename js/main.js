const el = id => document.getElementById(id);

/* =====================================
   1. GUEST NAME
===================================== */

const params = new URLSearchParams(window.location.search);
const guest = (params.get('to') || '').trim();
const guestName = guest || 'Tamu Undangan';

if (el('guest')) {
  el('guest').textContent = guestName;
}

if (el('name') && guest) {
  el('name').value = guestName;
}

/* =====================================
   2. RSVP ATTENDANCE
===================================== */

const attendanceInput = el('attendance');
const countInput = el('count');

function updateGuestCount() {
  if (!attendanceInput || !countInput) return;

  if (attendanceInput.value === 'Tidak hadir') {
    countInput.value = '0';
    countInput.disabled = true;
  } else {
    countInput.disabled = false;

    if (countInput.value === '0') {
      countInput.value = '1';
    }
  }
}

if (attendanceInput) {
  attendanceInput.addEventListener('change', updateGuestCount);
  updateGuestCount();
}

/* =====================================
   3. SCROLL REVEAL
===================================== */

let revealObserver = null;

function initializeScrollReveal() {
  const content = el('content');
  if (!content) return;

  if (revealObserver) {
    revealObserver.disconnect();
  }

  if (!('IntersectionObserver' in window)) {
    content.querySelectorAll('.reveal').forEach(item => {
      item.classList.add('visible');
    });

    content.querySelectorAll('.couple-grid img, .gallery button')
      .forEach(item => item.classList.add('visible'));

    return;
  }

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const target = entry.target;

      if (entry.isIntersecting) {
        target.classList.add('visible');

        if (target.classList.contains('gallery')) {
          target.querySelectorAll('button').forEach(button => {
            button.classList.add('visible');
          });
        }

        if (target.classList.contains('couple-grid')) {
          target.querySelectorAll('img').forEach(img => {
            img.classList.add('visible');
          });
        }
      } else {
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
  }, {
    root: content,
    threshold: 0.15,
    rootMargin: '0px 0px -30px 0px'
  });

  content.querySelectorAll('.reveal, .gallery, .couple-grid')
    .forEach(item => revealObserver.observe(item));
}

/* =====================================
   4. POWERPOINT-STYLE SLIDE NAVIGATION
===================================== */

let slideNavigationInitialized = false;

function initializeSlideNavigation() {
  const content = el('content');

  if (!content || slideNavigationInitialized) return;

  const slides = Array.from(content.children).filter(item => {
    return item.tagName === 'SECTION';
  });

  if (!slides.length) return;

  slideNavigationInitialized = true;

  let currentSlide = 0;
  let isMoving = false;
  let unlockTimer = null;
  let touchStartY = 0;

  function updateCurrentSlide() {
    const scrollPosition = content.scrollTop;

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.offsetTop - scrollPosition);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    currentSlide = nearestIndex;
  }

  function goToSlide(index) {
    if (isMoving) return;

    const nextIndex = Math.max(
      0,
      Math.min(index, slides.length - 1)
    );

    if (nextIndex === currentSlide) return;

    currentSlide = nextIndex;
    isMoving = true;

    content.scrollTo({
      top: slides[nextIndex].offsetTop,
      behavior: 'smooth'
    });

    clearTimeout(unlockTimer);

    unlockTimer = setTimeout(() => {
      isMoving = false;
      updateCurrentSlide();
    }, 900);
  }

  // Mouse wheel: one wheel gesture = one slide.
  content.addEventListener('wheel', event => {
    if (event.ctrlKey) return;

    const interactive = event.target.closest(
      'input, textarea, select, button, a, #lightbox'
    );

    if (interactive) return;

    event.preventDefault();

    if (isMoving || Math.abs(event.deltaY) < 12) return;

    goToSlide(
      currentSlide + (event.deltaY > 0 ? 1 : -1)
    );
  }, { passive: false });

  // Mobile swipe.
  content.addEventListener('touchstart', event => {
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  content.addEventListener('touchend', event => {
    const touchEndY = event.changedTouches[0].clientY;
    const distance = touchStartY - touchEndY;

    if (Math.abs(distance) < 55) return;

    goToSlide(
      currentSlide + (distance > 0 ? 1 : -1)
    );
  }, { passive: true });

  // Keyboard navigation.
  document.addEventListener('keydown', event => {
    if (content.hidden) return;

    if (event.target.matches(
      'input, textarea, select, button, a'
    )) return;

    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      goToSlide(currentSlide + 1);
    }

    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      goToSlide(currentSlide - 1);
    }
  });

  // Links inside the invitation.
  content.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);

      if (!target) return;

      const targetSlide = target.closest('#content > section');
      if (!targetSlide) return;

      event.preventDefault();

      const targetIndex = slides.indexOf(targetSlide);

      if (targetIndex !== -1) {
        goToSlide(targetIndex);
      }
    });
  });

  // Keep slide index synchronized with manual scrolling.
  content.addEventListener('scroll', () => {
    if (!isMoving) updateCurrentSlide();
  }, { passive: true });
}

/* =====================================
   5. OPEN INVITATION + MUSIC
===================================== */

const openButton = el('open');

if (openButton) {
  openButton.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();

    const cover = el('cover');
    const content = el('content');
    const audio = el('audio');
    const musicButton = el('music');

    if (!cover || !content || openButton.disabled) return;

    openButton.disabled = true;

    // Start music directly during the click interaction.
    let musicPromise = Promise.resolve(false);

    if (audio) {
      audio.loop = true;
      audio.volume = 0.8;

      try {
        musicPromise = audio.play()
          .then(() => true)
          .catch(error => {
            console.warn('Music playback failed:', error);
            return false;
          });
      } catch (error) {
        console.warn('Music playback failed:', error);
      }
    }

    // Opening animation.
    cover.classList.add('is-opening');

    await new Promise(resolve => {
      setTimeout(resolve, 900);
    });

    // Hide opening page.
    cover.hidden = true;
    cover.classList.remove('is-opening');

    // Show main invitation.
    content.hidden = false;
    content.scrollTop = 0;

    if (musicButton) {
      musicButton.hidden = false;
    }

    // Initialize slide and reveal systems.
    initializeScrollReveal();
    initializeSlideNavigation();

    const musicStarted = await musicPromise;

    if (musicStarted && musicButton) {
      musicButton.classList.add('playing');
    }

    openButton.disabled = false;
  });
}

/* =====================================
   6. COUNTDOWN
===================================== */

function tick() {
  if (!window.WEDDING || !WEDDING.date) return;

  const difference = Math.max(
    0,
    new Date(WEDDING.date).getTime() - Date.now()
  );

  const values = [
    Math.floor(difference / 86400000),
    Math.floor(difference / 3600000) % 24,
    Math.floor(difference / 60000) % 60,
    Math.floor(difference / 1000) % 60
  ];

  ['days', 'hours', 'minutes', 'seconds'].forEach((id, index) => {
    if (el(id)) {
      el(id).textContent = String(values[index]).padStart(2, '0');
    }
  });
}

tick();
setInterval(tick, 1000);

/* =====================================
   7. GOOGLE CALENDAR
===================================== */

if (el('calendar') && window.WEDDING) {
  el('calendar').href =
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(WEDDING.title)}&dates=${WEDDING.calendarStartUTC}/${WEDDING.calendarEndUTC}&location=${encodeURIComponent(WEDDING.venue)}`;
}

/* =====================================
   8. TOAST
===================================== */

let toastTimer;

function toast(message) {
  const toastElement = el('toast');
  if (!toastElement) return;

  toastElement.textContent = message;
  toastElement.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toastElement.classList.remove('show');
  }, 2800);
}

/* =====================================
   9. COPY BANK ACCOUNT
===================================== */

if (el('copyAccount')) {
  el('copyAccount').addEventListener('click', async event => {
    event.preventDefault();

    const account = el('account');
    if (!account) return;

    try {
      await navigator.clipboard.writeText(
        account.textContent.trim()
      );

      toast('Nomor rekening disalin');
    } catch (error) {
      toast('Silakan salin nomor secara manual');
    }
  });
}

/* =====================================
   10. MUSIC CONTROL
===================================== */

const audio = el('audio');
const musicButton = el('music');

if (audio) {
  audio.addEventListener('ended', () => {
    audio.play().catch(error => {
      console.warn('Audio replay failed:', error);
    });
  });

  audio.addEventListener('error', () => {
    console.error('Audio file could not be loaded:', audio.error);
  });
}

if (musicButton && audio) {
  musicButton.addEventListener('click', async event => {
    event.preventDefault();

    if (audio.paused) {
      try {
        await audio.play();
        musicButton.classList.add('playing');
      } catch (error) {
        console.error('Music playback failed:', error);
        toast('Musik tidak dapat diputar');
      }
    } else {
      audio.pause();
      musicButton.classList.remove('playing');
    }
  });
}

/* =====================================
   11. PHOTO GALLERY
===================================== */

document.querySelectorAll('.gallery button').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();

    const image = button.querySelector('img');
    const fullPhoto = el('fullPhoto');
    const lightbox = el('lightbox');

    if (!image || !fullPhoto || !lightbox) return;

    fullPhoto.src = image.src;
    lightbox.hidden = false;
  });
});

if (el('closePhoto')) {
  el('closePhoto').addEventListener('click', event => {
    event.preventDefault();

    if (el('lightbox')) {
      el('lightbox').hidden = true;
    }
  });
}

if (el('lightbox')) {
  el('lightbox').addEventListener('click', event => {
    if (event.target.id === 'lightbox') {
      el('lightbox').hidden = true;
    }
  });
}
