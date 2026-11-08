const el = id => document.getElementById(id);

/* =====================================
   1. SCROLL REVEAL SYSTEM
===================================== */

let revealObserver = null;

function initializeScrollReveal() {
  const content = el('content');

  if (!content) return;

  if (!('IntersectionObserver' in window)) {
    content.querySelectorAll('.reveal').forEach(node => {
      node.classList.add('visible');
    });

    content.querySelectorAll('.couple-grid img, .gallery button').forEach(node => {
      node.classList.add('visible');
    });

    return;
  }

  if (revealObserver) {
    revealObserver.disconnect();
  }

  revealObserver = new IntersectionObserver(
    entries => {
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
    },
    {
      root: content,
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  content.querySelectorAll('.reveal, .gallery, .couple-grid')
    .forEach(element => {
      revealObserver.observe(element);
    });
}


/* =====================================
   2. GUEST NAME
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
   3. RSVP ATTENDANCE & GUEST COUNT
===================================== */

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

if (attendanceInput) {
  attendanceInput.addEventListener('change', updateGuestCount);
  updateGuestCount();
}


/* =====================================
   4. POWERPOINT-LIKE SLIDE NAVIGATION
===================================== */

let slideNavigationInitialized = false;

function initializeSlideNavigation() {
  const content = el('content');

  if (!content || slideNavigationInitialized) return;

  // Each section is one slide.
  // Footer is also treated as the final slide.
  const slides = Array.from(content.children).filter(element => {
    return element.tagName === 'SECTION' || element.tagName === 'FOOTER';
  });

  if (slides.length < 2) {
    console.warn('Slide navigation: not enough sections found.');
    return;
  }

  slideNavigationInitialized = true;

  let currentSlide = 0;
  let isMoving = false;
  let unlockTimer = null;
  let touchStartY = 0;

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
    }, 1000);
  }

  // Mouse wheel: one gesture moves one slide.
  content.addEventListener('wheel', event => {
    if (event.target.closest(
      'input, textarea, select, button, a, #lightbox'
    )) {
      return;
    }

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
    )) {
      return;
    }

    if (['ArrowDown', 'PageDown'].includes(event.key)) {
      event.preventDefault();
      goToSlide(currentSlide + 1);
    }

    if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      goToSlide(currentSlide - 1);
    }
  });

  // Internal links, for example SCROLL TO EXPLORE.
  content.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);

      if (!target) return;

      const targetSlide = target.closest('#content > section');

      if (!targetSlide) return;

      event.preventDefault();

      const targetIndex = slides.indexOf(targetSlide);

      if (targetIndex >= 0) {
        goToSlide(targetIndex);
      }
    });
  });
}


/* =====================================
   5. OPEN INVITATION + MUSIC
===================================== */

const openButton = el('open');

if (openButton) {
  openButton.addEventListener('click', async () => {
    const cover = el('cover');
    const content = el('content');
    const musicButton = el('music');
    const audio = el('audio');

    if (!cover || !content || openButton.disabled) return;

    openButton.disabled = true;

    // Start audio immediately from the user's click.
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

    // Hide opening cover.
    cover.hidden = true;
    cover.classList.remove('is-opening');

    // Show invitation.
    content.hidden = false;
    content.style.display = 'block';
    content.style.visibility = 'visible';
    content.scrollTop = 0;

    if (musicButton) {
      musicButton.hidden = false;
    }

    // Initialize scroll and reveal systems.
    initializeScrollReveal();
    initializeSlideNavigation();

    // Update music button state.
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

  const diff = Math.max(
    0,
    new Date(WEDDING.date).getTime() - Date.now()
  );

  const values = [
    Math.floor(diff / 86400000),
    Math.floor(diff / 3600000) % 24,
    Math.floor(diff / 60000) % 60,
    Math.floor(diff / 1000) % 60
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
  el('copyAccount').addEventListener('click', async () => {
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
    console.error(
      'Audio file could not be loaded:',
      audio.error
    );
  });
}

if (musicButton && audio) {
  musicButton.addEventListener('click', async () => {
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
  button.addEventListener('click', () => {
    const image = button.querySelector('img');
    const fullPhoto = el('fullPhoto');
    const lightbox = el('lightbox');

    if (!image || !fullPhoto || !lightbox) return;

    fullPhoto.src = image.src;
    lightbox.hidden = false;
  });
});

if (el('closePhoto')) {
  el('closePhoto').addEventListener('click', () => {
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
