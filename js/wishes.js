
(() => {
  // =====================================
  // 1. DIAGNOSTIC
  // =====================================
  const box = document.getElementById('wishes');

  if (!box) {
    console.error('Element #wishes tidak ditemukan.');
    return;
  }

  box.textContent = 'Memeriksa koneksi Supabase...';

  const config = window.WEDDING;

  if (!config) {
    box.textContent = 'ERROR: config.js tidak berhasil dimuat.';
    return;
  }

  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    box.textContent = 'ERROR: URL atau Publishable Key kosong.';
    return;
  }

  if (!window.supabase?.createClient) {
    box.textContent = 'ERROR: Library Supabase tidak berhasil dimuat.';
    return;
  }

  // =====================================
  // 2. INITIALIZE SUPABASE
  // =====================================
  let db;

  try {
    db = window.supabase.createClient(
      config.supabaseUrl,
      config.supabasePublishableKey
    );
  } catch (error) {
    box.textContent = 'ERROR membuat koneksi: ' + error.message;
    return;
  }

  box.textContent = 'Supabase berhasil diinisialisasi. Memuat ucapan...';

  // =====================================
  // 3. ELEMENT REFERENCES
  // =====================================
  const el = id => document.getElementById(id);

  const wishForm = el('wishForm');
  const nameInput = el('name');
  const attendanceInput = el('attendance');
  const countInput = el('count');
  const messageInput = el('message');
  const statusBox = el('status');
  const submitButton = el('submitWish');

  if (!wishForm || !nameInput || !attendanceInput ||
      !countInput || !messageInput || !submitButton) {
    box.textContent = 'ERROR: Ada elemen form RSVP yang tidak ditemukan.';
    return;
  }

  // =====================================
  // 4. GUEST COUNT
  // =====================================
  function updateGuestCount() {
    if (attendanceInput.value === 'Tidak hadir') {
      countInput.innerHTML = '<option value="0">0 orang</option>';
      countInput.value = '0';
      countInput.disabled = true;
    } else {
      countInput.innerHTML = `
        <option value="1">1 orang</option>
        <option value="2">2 orang</option>
        <option value="3">3 orang</option>
        <option value="4">4 orang</option>
      `;
      countInput.disabled = false;
      countInput.value = '1';
    }
  }

  attendanceInput.addEventListener('change', updateGuestCount);
  updateGuestCount();

  // =====================================
  // 5. LOAD WISHES
  // =====================================
  async function loadWishes() {
    box.textContent = 'Menghubungi database...';

    try {
      const { data, error } = await db
        .from('wedding_wishes')
        .select('guest_name, attendance, guest_count, message, created_at')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Supabase SELECT error:', error);
        box.textContent =
          'DATABASE ERROR: ' + error.message +
          ' (Code: ' + error.code + ')';
        return;
      }

      box.replaceChildren();

      if (!data || data.length === 0) {
        box.textContent = 'Belum ada ucapan. Jadilah yang pertama!';
        return;
      }

      data.forEach(w => {
        const card = document.createElement('article');
        card.className = 'wish';

        const title = document.createElement('strong');
        title.textContent = w.guest_name;

        const meta = document.createElement('small');
        meta.textContent = `${w.attendance} · ${w.guest_count} tamu`;

        const message = document.createElement('p');
        message.textContent = w.message;

        card.append(title, meta, message);
        box.appendChild(card);
      });

    } catch (error) {
      console.error('Load error:', error);
      box.textContent = 'CONNECTION ERROR: ' + error.message;
    }
  }

  // =====================================
  // 6. SUBMIT RSVP
  // =====================================
  wishForm.addEventListener('submit', async event => {
    event.preventDefault();

    const attendance = attendanceInput.value;
    const guest_count = attendance === 'Tidak hadir'
      ? 0
      : Number(countInput.value);

    const payload = {
      guest_name: nameInput.value.trim(),
      attendance,
      guest_count,
      message: messageInput.value.trim()
    };

    if (!payload.guest_name || !payload.message) {
      statusBox.textContent = 'Nama dan ucapan wajib diisi.';
      return;
    }

    if (attendance === 'Hadir' && (guest_count < 1 || guest_count > 4)) {
      statusBox.textContent = 'Jumlah tamu harus 1 sampai 4.';
      return;
    }

    submitButton.disabled = true;
    statusBox.textContent = 'Mengirim ucapan...';

    try {
      const { error } = await db
        .from('wedding_wishes')
        .insert(payload);

      if (error) {
        console.error('INSERT error:', error);
        statusBox.textContent =
          'Gagal mengirim: ' + error.message;
        return;
      }

      statusBox.textContent = 'Terima kasih, ucapan berhasil dikirim!';

      wishForm.reset();

      const guest = (
        new URLSearchParams(window.location.search).get('to') || ''
      ).trim();

      if (guest) nameInput.value = guest.slice(0, 100);

      updateGuestCount();
      await loadWishes();

    } catch (error) {
      console.error('Submit error:', error);
      statusBox.textContent = 'Kesalahan: ' + error.message;

    } finally {
      submitButton.disabled = false;
    }
  });

  // =====================================
  // 7. START
  // =====================================
  loadWishes();

})();
