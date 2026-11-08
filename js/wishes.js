(function () {
  const result = {
    configLoaded: typeof window.WEDDING !== 'undefined',
    supabaseLoaded: typeof window.supabase !== 'undefined',
    createClientAvailable:
      typeof window.supabase?.createClient === 'function',
    urlAvailable: !!window.WEDDING?.supabaseUrl,
    keyAvailable: !!window.WEDDING?.supabasePublishableKey
  };

  console.log('SUPABASE DIAGNOSTIC:', result);

  const box = document.getElementById('wishes');

  if (box) {
    box.textContent =
      'DIAGNOSTIC: ' + JSON.stringify(result);
  }
})();
// =====================================
// SUPABASE WEDDING GUESTBOOK
// =====================================

// 1. SUPABASE CONNECTION


// =====================================
// SUPABASE CONNECTION DIAGNOSTIC
// =====================================

const config = window.WEDDING;

let db = null;
let connectionProblem = '';

if (!config) {
  connectionProblem = 'config.js tidak berhasil dimuat.';
} else if (!config.supabaseUrl) {
  connectionProblem = 'Supabase URL kosong.';
} else if (!config.supabasePublishableKey) {
  connectionProblem = 'Supabase Publishable Key kosong.';
} else if (!window.supabase) {
  connectionProblem = 'Library Supabase tidak berhasil dimuat.';
} else if (typeof window.supabase.createClient !== 'function') {
  connectionProblem = 'Supabase createClient tidak tersedia.';
} else {
  try {
    db = window.supabase.createClient(
      config.supabaseUrl,
      config.supabasePublishableKey
    );

    console.log('Supabase client initialized successfully.');
  } catch (error) {
    connectionProblem = error.message;
    console.error('Supabase initialization error:', error);
  }
}

console.log('Supabase diagnostic:', {
  configLoaded: !!config,
  urlAvailable: !!config?.supabaseUrl,
  keyAvailable: !!config?.supabasePublishableKey,
  libraryAvailable: !!window.supabase,
  clientAvailable: !!db,
  problem: connectionProblem
});

// 2. ELEMENT REFERENCES
const wishForm = el('wishForm');
const nameInput = el('name');
const attendanceInput = el('attendance');
const countInput = el('count');
const messageInput = el('message');
const statusBox = el('status');
const submitButton = el('submitWish');


// 3. ATTENDANCE AND GUEST COUNT

function updateGuestCount() {
  const notAttending =
    attendanceInput.value === 'Tidak hadir';

  // Jika tidak hadir, tampilkan hanya 0 orang
  if (notAttending) {
    countInput.innerHTML = '';
    
    const option = document.createElement('option');
    option.value = '0';
    option.textContent = '0 orang';
    countInput.appendChild(option);

    countInput.value = '0';
    countInput.disabled = true;

  } else {
    // Jika hadir, tampilkan pilihan 1 sampai 4
    countInput.disabled = false;
    countInput.innerHTML = `
      <option value="1">1 orang</option>
      <option value="2">2 orang</option>
      <option value="3">3 orang</option>
      <option value="4">4 orang</option>
    `;

    countInput.value = '1';
  }
}

attendanceInput.addEventListener(
  'change',
  updateGuestCount
);

// Set kondisi awal
updateGuestCount();


// 4. LOAD WISHES FROM SUPABASE
async function loadWishes() {
  const box = el('wishes');

  if (!db) {
  box.textContent = connectionProblem ||
    'Koneksi Supabase belum tersedia.';

  console.error('Supabase connection:', connectionProblem);
  return;
}

  const { data, error } = await db
    .from('wedding_wishes')
    .select(
      'guest_name,attendance,guest_count,message,created_at'
    )
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    box.textContent =
      'Gagal memuat ucapan. Periksa RLS dan konfigurasi.';
    console.error('Load wishes error:', error);
    return;
  }

  box.replaceChildren();

  if (!data || data.length === 0) {
    box.textContent =
      'Belum ada ucapan. Jadilah yang pertama!';
    return;
  }

  data.forEach(w => {
    const card = document.createElement('article');
    card.className = 'wish';

    const title = document.createElement('strong');
    title.textContent = w.guest_name;

    const meta = document.createElement('small');

    // Tidak hadir tetap ditampilkan dengan 0 tamu
    meta.textContent =
      `${w.attendance} · ${w.guest_count} tamu`;

    const message = document.createElement('p');
    message.textContent = w.message;

    card.append(title, meta, message);
    box.append(card);
  });
}


// 5. SUBMIT RSVP AND WISHES
wishForm.addEventListener('submit', async event => {
  event.preventDefault();

  if (!db) {
    statusBox.textContent =
      'Hubungkan Supabase terlebih dahulu.';
    return;
  }

  // Ambil status kehadiran
  const attendance = attendanceInput.value;

  // Jika tidak hadir, jumlah tamu wajib 0
  const guest_count =
    attendance === 'Tidak hadir'
      ? 0
      : Number(countInput.value);

  // Siapkan data
  const payload = {
    guest_name: nameInput.value.trim(),
    attendance: attendance,
    guest_count: guest_count,
    message: messageInput.value.trim()
  };

  // Validasi
  if (!payload.guest_name || !payload.message) {
    statusBox.textContent =
      'Nama dan ucapan wajib diisi.';
    return;
  }

  if (
    attendance === 'Hadir' &&
    (guest_count < 1 || guest_count > 4)
  ) {
    statusBox.textContent =
      'Jumlah tamu harus antara 1 sampai 4.';
    return;
  }

  if (
    attendance === 'Tidak hadir' &&
    guest_count !== 0
  ) {
    statusBox.textContent =
      'Jumlah tamu tidak hadir harus 0.';
    return;
  }

  // Kirim ke Supabase
  submitButton.disabled = true;
  statusBox.textContent = 'Mengirim ucapan...';

  try {
    const { error } = await db
      .from('wedding_wishes')
      .insert(payload);

    if (error) {
      console.error('Submit error:', error);
      statusBox.textContent =
        'Gagal mengirim. Periksa koneksi dan database.';
      return;
    }

    statusBox.textContent =
      'Terima kasih, ucapan berhasil dikirim!';

    // Reset form
    wishForm.reset();

    // Pulihkan nama tamu dari URL setelah reset
    const params = new URLSearchParams(
      window.location.search
    );

    const guest = (params.get('to') || '').trim();

    if (guest) {
      nameInput.value = guest.slice(0, 100);
    }

    // Pulihkan kondisi jumlah tamu
    updateGuestCount();

    // Perbarui daftar ucapan
    await loadWishes();

  } catch (error) {
    console.error('Unexpected error:', error);
    statusBox.textContent =
      'Terjadi kesalahan. Silakan coba kembali.';

  } finally {
    submitButton.disabled = false;
  }
});


// 6. INITIALIZE
loadWishes();
