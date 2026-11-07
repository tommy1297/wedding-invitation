const el = id => document.getElementById(id);

// =====================================
// AUTOMATIC GUEST NAME
// =====================================
const params = new URLSearchParams(window.location.search);
const guest = (params.get('to') || '').trim();

const guestName = guest
  ? guest.replace(/\+/g, ' ').slice(0, 100)
  : 'Tamu Undangan';

// Nama di halaman cover
if (el('guest')) {
  el('guest').textContent = guestName;
}

// Nama otomatis di form RSVP
if (el('name')) {
  el('name').value = guest ? guestName : '';
}

// =====================================
// 2. OPEN INVITATION
// =====================================
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

el('open').onclick = () => {
  el('cover').style.transition = 'opacity .85s';
  el('cover').style.opacity = '0';

  setTimeout(() => {
    el('cover').hidden = true;
    el('content').hidden = false;
    el('music').hidden = false;

    // Aktifkan animasi elemen setelah halaman dibuka
    document.querySelectorAll('.reveal').forEach(node => {
      observer.observe(node);
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
