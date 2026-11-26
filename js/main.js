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
   4. FULL PAGE CINEMATIC NAVIGATION
===================================== */

let slideNavigationInitialized = false;

function initializeSlideNavigation() {
  const content = el('content');

  if (!content || slideNavigationInitialized) return;

  const slides = Array.from(content.children).filter(item =>
    item.tagName === 'SECTION'
  );

  if (!slides.length) return;

  slideNavigationInitialized = true;

  let currentSlide = 0;
  let isMoving = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchTarget = null;

  // Disable native partial scrolling and snap
  content.style.scrollSnapType = 'none';
  content.style.scrollBehavior = 'auto';
  content.style.overflowY = 'hidden';

  function getCurrentSlide() {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    slides.forEach((slide, index) => {
      const distance = Math.abs(
        slide.offsetTop - content.scrollTop
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  function canScrollNested(target, direction) {
    if (!(target instanceof Element)) return false;

    const nested = target.closest(
      '#wishes, .lightbox, [data-independent-scroll]'
    );

    if (!nested || nested === content) return false;

    const style = getComputedStyle(nested);
    const canScroll =
      /(auto|scroll)/.test(style.overflowY) &&
      nested.scrollHeight > nested.clientHeight;

    if (!canScroll) return false;

    if (direction > 0) {
      return nested.scrollTop + nested.clientHeight <
        nested.scrollHeight - 2;
    }

    return nested.scrollTop > 2;
  }

  function goToSlide(index) {
    if (isMoving) return;

    const nextIndex = Math.max(
      0,
      Math.min(index, slides.length - 1)
    );

    if (nextIndex === currentSlide) return;

    isMoving = true;

    const startPosition = content.scrollTop;
    const targetPosition = slides[nextIndex].offsetTop;
    const distance = targetPosition - startPosition;

    const duration = 850;
    const startTime = performance.now();

    function animate(now) {
      const progress = Math.min(
        (now - startTime) / duration,
        1
      );

      // Smooth ease-in-out
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      content.scrollTop =
        startPosition + distance * eased;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        content.scrollTop = targetPosition;
        currentSlide = nextIndex;

        slides.forEach((slide, i) => {
          slide.classList.toggle(
            'page-active',
            i === nextIndex
          );
        });

        isMoving = false;
      }
    }

    requestAnimationFrame(animate);
  }

  // Mouse wheel: one gesture = one full page
  content.addEventListener('wheel', event => {
    if (content.hidden || isMoving) {
      event.preventDefault();
      return;
    }

    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
      return;
    }

    const direction = event.deltaY > 0 ? 1 : -1;

    if (canScrollNested(event.target, direction)) {
      return;
    }

    event.preventDefault();

    if (Math.abs(event.deltaY) > 5) {
      goToSlide(currentSlide + direction);
    }
  }, { passive: false });

  // Touch start
  content.addEventListener('touchstart', event => {
    const touch = event.touches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchTarget = event.target;
  }, { passive: true });

  // Prevent native partial page movement
  content.addEventListener('touchmove', event => {
    if (content.hidden) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);

    if (deltaY > deltaX + 5) {
      const direction =
        touch.clientY < touchStartY ? 1 : -1;

      if (!canScrollNested(touchTarget, direction)) {
        event.preventDefault();
      }
    }
  }, { passive: false });

  // Touch end: one swipe = one full page
  content.addEventListener('touchend', event => {
    if (content.hidden || isMoving) return;

    const touch = event.changedTouches[0];

    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (
      Math.abs(deltaY) < 45 ||
      Math.abs(deltaY) < Math.abs(deltaX)
    ) return;

    const direction = deltaY < 0 ? 1 : -1;

    if (canScrollNested(touchTarget, direction)) return;

    goToSlide(currentSlide + direction);
  }, { passive: true });

  // Keyboard navigation
  document.addEventListener('keydown', event => {
    if (content.hidden || isMoving) return;

    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target;

    if (target && target.matches(
      'input, textarea, select, button, a, [contenteditable="true"]'
    )) return;

    if (
      event.key === 'ArrowDown' ||
      event.key === 'PageDown'
    ) {
      event.preventDefault();
      goToSlide(currentSlide + 1);
    }

    if (
      event.key === 'ArrowUp' ||
      event.key === 'PageUp'
    ) {
      event.preventDefault();
      goToSlide(currentSlide - 1);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      goToSlide(0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      goToSlide(slides.length - 1);
    }
  });

  // Internal links
  content.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.getElementById(
        link.getAttribute('href').slice(1)
      );

      if (!target) return;

      const targetSlide = target.closest('#content > section');

      if (!targetSlide) return;

      event.preventDefault();

      goToSlide(slides.indexOf(targetSlide));
    });
  });
}


/* =====================================
   5. OPEN INVITATION + MUSIC
===================================== */

const openButton = el('open');

if (openButton) {
  openButton.addEventListener('click', async function (event) {
    event.preventDefault();
    event.stopPropagation();

    const cover = el('cover');
    const content = el('content');
    const audio = el('audio');
    const musicButton = el('music');

    if (!cover || !content) {
      console.error('Cover atau content tidak ditemukan.');
      return;
    }

    if (openButton.disabled) return;

    openButton.disabled = true;

    // Mulai musik saat tombol ditekan
    if (audio) {
      audio.loop = true;
      audio.volume = 0.8;

      audio.play().then(() => {
        if (musicButton) {
          musicButton.classList.add('playing');
        }
      }).catch(error => {
        console.warn('Musik tidak dapat diputar:', error);
      });
    }

    // Animasi pembukaan
    cover.classList.add('is-opening');

    setTimeout(() => {
      // Sembunyikan cover
      cover.hidden = true;
      cover.classList.remove('is-opening');

      // Tampilkan undangan
      content.hidden = false;
      content.scrollTop = 0;

      requestAnimationFrame(() => {
        content.scrollTop = 0;
      });

      // Tampilkan tombol musik
      if (musicButton) {
        musicButton.hidden = false;
      }

      // Aktifkan sistem navigasi
      initializeScrollReveal();
      initializeSlideNavigation();

      openButton.disabled = false;

    }, 900);
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
async function copyBankAccount(accountId, showNotification = true) {
  const account = el(accountId);

  if (!account) return;

  try {
    await navigator.clipboard.writeText(
      account.textContent.trim()
    );

    if (showNotification) {
      toast('Nomor rekening disalin');
    }

  } catch (error) {
    if (showNotification) {
      toast('Silakan salin nomor secara manual');
    }
  }
}

// Tommy
if (el('copyAccount')) {
  el('copyAccount').addEventListener('click', () => {
    copyBankAccount('account');
  });
}

// Wini - copy without popup
if (el('copyAccountWini')) {
  el('copyAccountWini').addEventListener('click', event => {
    copyBankAccount('accountWini');
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
