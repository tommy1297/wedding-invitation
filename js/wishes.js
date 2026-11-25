
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

  const prevButton = el('wishesPrev');
  const nextButton = el('wishesNext');
  const pageInfo = el('wishesPageInfo');

  if (!wishForm || !nameInput || !attendanceInput ||
      !countInput || !messageInput || !submitButton) {
    box.textContent = 'ERROR: Ada elemen form RSVP yang tidak ditemukan.';
    return;
  }

  if (!prevButton || !nextButton || !pageInfo) {
    box.textContent = 'ERROR: Tombol pagination Wishes tidak ditemukan.';
    return;
  }

  // =====================================
  // 4. PAGINATION SETTINGS
  // =====================================
  const ITEMS_PER_PAGE = 3;
  let currentPage = 0;

  function updatePagination() {
    const items = Array.from(box.querySelectorAll(':scope > .wish'));

    const totalPages = Math.max(
      1,
      Math.ceil(items.length / ITEMS_PER_PAGE)
    );

    currentPage = Math.min(currentPage, totalPages - 1);

    items.forEach((item, index) => {
      const start = currentPage * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;

      item.hidden = index < start || index >= end;
    });

    pageInfo.textContent =
      `${currentPage + 1} / ${totalPages}`;

    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage >= totalPages - 1;
  }

  prevButton.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      updatePagination();
    }
  });

  nextButton.addEventListener('click', () => {
    const totalPages = Math.max(
      1,
      Math.ceil(
        box.querySelectorAll(':scope > .wish').length /
        ITEMS_PER_PAGE
      )
    );

    if (currentPage < totalPages - 1) {
      currentPage++;
      updatePagination();
    }
  });

  // =====================================
  // 5. GUEST COUNT
  // =====================================
 
const attendanceSelect = document.getElementById("attendance");
const countSelect = document.getElementById("count");
const attendanceButtons = document.querySelectorAll(".attendance-button");

function updateGuestCount() {
  const isAttending = attendanceSelect.value === "Hadir";

  countSelect.disabled = !isAttending;

  if (!isAttending) {
    // Database saat ini membatasi guest_count minimal 1
    countSelect.value = "1";
  }
}

attendanceButtons.forEach(button => {
  button.addEventListener("click", () => {
    const selectedValue = button.dataset.value;

    attendanceSelect.value = selectedValue;

    attendanceButtons.forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });

    updateGuestCount();
  });
});

// Inisialisasi saat halaman dibuka
updateGuestCount();

  // =====================================
  // 6. LOAD WISHES
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
        currentPage = 0;
        updatePagination();
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

      currentPage = 0;
      updatePagination();

    } catch (error) {
      console.error('Load error:', error);
      box.textContent = 'CONNECTION ERROR: ' + error.message;
    }
  }

  // =====================================
  // 7. SUBMIT RSVP
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
  // 8. START
  // =====================================
  loadWishes();

})();
