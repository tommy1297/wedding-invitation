const el = id => document.getElementById(id);
const guest = new URLSearchParams(location.search).get('to');
if(guest) el('guest').textContent = guest.slice(0,100);
el('open').onclick=()=>{el('cover').style.transition='opacity .85s';el('cover').style.opacity='0';setTimeout(()=>{el('cover').hidden=true;el('content').hidden=false;el('music').hidden=false;window.scrollTo(0,0);document.querySelectorAll('.reveal').forEach(node=>observer.observe(node));},850)};
const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.1});
function tick(){const diff=Math.max(0,new Date(WEDDING.date)-Date.now());const vals=[Math.floor(diff/86400000),Math.floor(diff/3600000)%24,Math.floor(diff/60000)%60,Math.floor(diff/1000)%60];['days','hours','minutes','seconds'].forEach((id,i)=>el(id).textContent=String(vals[i]).padStart(2,'0'))}tick();setInterval(tick,1000);
el('calendar').href=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(WEDDING.title)}&dates=${WEDDING.calendarStartUTC}/${WEDDING.calendarEndUTC}&location=${encodeURIComponent(WEDDING.venue)}`;
let toastTimer;function toast(s){el('toast').textContent=s;el('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el('toast').classList.remove('show'),2800)}
el('copyAccount').onclick=async()=>{try{await navigator.clipboard.writeText(el('account').textContent.trim());toast('Nomor rekening disalin')}catch{toast('Silakan salin nomor secara manual')}};
el('music').onclick=async()=>{const audio=el('audio');try{if(audio.paused){await audio.play();el('music').classList.add('playing')}else{audio.pause();el('music').classList.remove('playing')}}catch{toast('Tambahkan assets/music/wedding.mp3 terlebih dahulu')}};
document.querySelectorAll('.gallery button').forEach(button=>button.onclick=()=>{el('fullPhoto').src=button.querySelector('img').src;el('lightbox').hidden=false});el('closePhoto').onclick=()=>el('lightbox').hidden=true;el('lightbox').onclick=e=>{if(e.target.id==='lightbox')el('lightbox').hidden=true};
