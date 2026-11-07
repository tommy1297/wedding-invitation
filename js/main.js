
const el = id => document.getElementById(id);

function setGuestName() {
  const params = new URLSearchParams(window.location.search);
  const guest = (params.get('to') || '').trim();
  const guestName = guest || 'Tamu Undangan';

  // Nama pada cover
  const coverName = el('guest');
  if (coverName) {
    coverName.textContent = guestName;
  }

  // Nama pada RSVP
  const rsvpName = el('name');
  if (rsvpName && guest) {
    rsvpName.value = guestName;
  }
}

setGuestName();

// =====================================
// 2. OPEN INVITATION
// =====================================

el('open').onclick = () => {
  const cover = el('cover');
  const content = el('content');
  const music = el('music');

  // Hilangkan cover
  cover.style.transition = 'opacity .85s ease';
  cover.style.opacity = '0';

  setTimeout(() => {
    cover.hidden = true;

    // Paksa konten utama ditampilkan
    content.hidden = false;
    content.removeAttribute('hidden');
    content.style.display = 'block';
    content.style.visibility = 'visible';
    content.style.opacity = '1';

    music.hidden = false;

    // Tampilkan section pertama secara langsung
    const hero = content.querySelector('section.hero');
    if (hero) {
      hero.style.display = 'grid';
      hero.style.visibility = 'visible';
      hero.style.opacity = '1';
      hero.style.minHeight = '100vh';

      const inner = hero.querySelector('.inner');
      if (inner) {
        inner.classList.add('visible');
        inner.style.opacity = '1';
        inner.style.visibility = 'visible';
        inner.style.transform = 'none';
      }
    }

    // Aktifkan animasi untuk section berikutnya
    content.querySelectorAll('.reveal').forEach(node => {
      if (!hero || !hero.contains(node)) {
        observer.observe(node);
      }
    });

    window.scrollTo(0, 0);
  }, 850);
};

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
// 5. TOAST NOTIFICATION
// =====================================
let toastTimer;

function toast(s) {
  el('toast').textContent = s;
  el('toast').classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    el('toast').classList.remove('show');
  }, 2800);
}

// =====================================
// 6. COPY BANK ACCOUNT
// =====================================
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

// =====================================
// 7. BACKGROUND MUSIC
// =====================================
el('music').onclick = async () => {
  const audio = el('audio');

  try {
    if (audio.paused) {
      await audio.play();
      el('music').classList.add('playing');
    } else {
      audio.pause();
      el('music').classList.remove('playing');
    }
  } catch {
    toast('Tambahkan assets/music/wedding.mp3 terlebih dahulu');
  }
};

// =====================================
// 8. PHOTO GALLERY
// =====================================
document.querySelectorAll('.gallery button').forEach(button => {
  button.onclick = () => {
    el('fullPhoto').src = button.querySelector('img').src;
    el('lightbox').hidden = false;
  };
});

el('closePhoto').onclick = () => {
  el('lightbox').hidden = true;
};

el('lightbox').onclick = e => {
  if (e.target.id === 'lightbox') {
    el('lightbox').hidden = true;
  }
};
