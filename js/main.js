
const el = id => document.getElementById(id);

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
// 2. OPEN INVITATION + MUSIC
// =====================================
el('open').addEventListener('click', async () => {
  const cover = el('cover');
  const content = el('content');
  const music = el('music');
  const audio = el('audio');

  // Tampilkan undangan dahulu
  cover.hidden = true;
  content.hidden = false;
  content.style.display = 'block';
  content.style.visibility = 'visible';

  // Paksa semua teks dan section terlihat
  content.querySelectorAll('.reveal').forEach(node => {
    node.classList.add('visible');
    node.style.opacity = '1';
    node.style.visibility = 'visible';
    node.style.transform = 'none';
  });

  music.hidden = false;

  window.scrollTo(0, 0);

  // Mulai musik setelah interaksi pengguna
  audio.loop = true;
  audio.volume = 0.8;

  try {
    await audio.play();
    music.classList.add('playing');
    console.log('Music playing');
  } catch (error) {
    console.error('Music playback failed:', error);
    alert('Musik belum bisa diputar. Periksa file wedding.mp3 dan lokasi file.');
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
