const SUPABASE_URL =
'https://oomvafcwjzjwpvssmdmi.supabase.co';
const SUPABASE_KEY = 
'sb_publishable_MsuyDVKxDk50cemAWBNKhg_QIzKvroX';
let supabaseClient = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}
const $ = (id) => document.getElementById(id);
const STORE = 'boothManagerDemoV1';
let state = { booths: [], contacts: [] };

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) state = JSON.parse(raw);
  } catch (_) { state = { booths: [], contacts: [] }; }
}
function save() {
  localStorage.setItem(STORE, JSON.stringify(state));
  render();
}
function safeText(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function showTab(tab) {
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('hidden', el.id !== tab));
  document.querySelectorAll('.tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  if (tab === 'contacts') renderContacts();
}
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

$('loginBtn').addEventListener('click', () => {
  const pin = $('pin').value.trim();
  if (!/^\d{4,12}$/.test(pin)) return alert('कृपया कम से कम 4 अंकों का PIN लिखें।');
  // Demo-only gate, intentionally not represented as production authentication.
  $('login').classList.add('hidden');
  $('app').classList.remove('hidden');
  render();
});
$('lockBtn').addEventListener('click', () => {
  $('app').classList.add('hidden');
  $('login').classList.remove('hidden');
  $('pin').value = '';
});

$('boothForm').addEventListener('submit', e => {
  e.preventDefault();
  const number = $('boothNo').value.trim(), area = $('boothArea').value.trim();
  if (state.booths.some(b => b.number.toLowerCase() === number.toLowerCase() && b.area.toLowerCase() === area.toLowerCase())) return alert('यह बूथ पहले से मौजूद है।');
  state.booths.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), number, area, createdAt: new Date().toISOString() });
  $('boothForm').reset(); save(); alert('बूथ सेव हो गया।');
});

$('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!state.booths.length) return alert('पहले बूथ जोड़ें।');
  const name = $('contactName').value.trim();
  const phone = $('contactPhone').value.replace(/[^\d+]/g, '');
  const boothId = $('contactBooth').value;
  if (!/^\+?\d{10,15}$/.test(phone)) return alert('कृपया सही मोबाइल नंबर लिखें।');
  if (state.contacts.some(c => c.phone === phone)) return alert('यह मोबाइल नंबर पहले से सूची में है।');
  const wa = $('waConsent').checked, sms = $('smsConsent').checked;
  state.contacts.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name, phone, boothId, waConsent: wa, smsConsent: sms,
    consentAt: (wa || sms) ? new Date().toISOString() : null,
    createdAt: new Date().toISOString()
  });
  $('contactForm').reset(); save(); alert('संपर्क सेव हो गया।');
});
$('searchContacts').addEventListener('input', renderContacts);

function render() {
  $('mBooths').textContent = state.booths.length;
  $('mContacts').textContent = state.contacts.length;
  $('mWa').textContent = state.contacts.filter(c => c.waConsent).length;
  $('mSms').textContent = state.contacts.filter(c => c.smsConsent).length;
  $('boothList').innerHTML = state.booths.length ? state.booths.map(b =>
    `<div class="record"><strong>बूथ ${safeText(b.number)}</strong><div class="muted">${safeText(b.area)}</div>
    <button class="secondary" data-delete-booth="${safeText(b.id)}" style="margin-top:8px">बूथ हटाएँ</button></div>`).join('') : '<p class="muted">अभी बूथ नहीं हैं।</p>';
  $('boothList').querySelectorAll('[data-delete-booth]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.deleteBooth;
    if (state.contacts.some(c => c.boothId === id)) return alert('इस बूथ में संपर्क हैं। पहले संपर्क हटाएँ या उन्हें दूसरे बूथ में स्थानांतरित करें।');
    if (confirm('क्या आप यह बूथ हटाना चाहते हैं?')) { state.booths = state.booths.filter(b => b.id !== id); save(); }
  }));
  $('contactBooth').innerHTML = state.booths.map(b => `<option value="${safeText(b.id)}">${safeText(b.number)} — ${safeText(b.area)}</option>`).join('');
  $('reportContent').innerHTML = `<div class="grid">
    <div class="metric"><span>कुल बूथ</span><strong>${state.booths.length}</strong></div>
    <div class="metric"><span>कुल संपर्क</span><strong>${state.contacts.length}</strong></div>
    <div class="metric"><span>WhatsApp सहमति</span><strong>${state.contacts.filter(c=>c.waConsent).length}</strong></div>
    <div class="metric"><span>SMS सहमति</span><strong>${state.contacts.filter(c=>c.smsConsent).length}</strong></div></div>`;
  renderContacts();
}
function renderContacts() {
  const q = ($('searchContacts')?.value || '').trim().toLowerCase();
  const rows = state.contacts.filter(c => (c.name + ' ' + c.phone).toLowerCase().includes(q));
  $('contactList').innerHTML = rows.length ? rows.map(c => {
    const b = state.booths.find(x => x.id === c.boothId);
    return `<div class="record"><strong>${safeText(c.name)}</strong><div>${safeText(c.phone)}</div>
    <div class="muted">बूथ ${safeText(b?.number || '-')} • ${safeText(b?.area || '')}</div>
    <span class="pill">WhatsApp: ${c.waConsent ? 'सहमति दर्ज' : 'नहीं'}</span><span class="pill">SMS: ${c.smsConsent ? 'सहमति दर्ज' : 'नहीं'}</span>
    <button class="secondary" data-delete-contact="${safeText(c.id)}" style="margin-top:8px">संपर्क हटाएँ</button></div>`;
  }).join('') : '<p class="muted">कोई संपर्क नहीं मिला।</p>';
  $('contactList').querySelectorAll('[data-delete-contact]').forEach(btn => btn.addEventListener('click', () => {
    if (confirm('क्या आप यह संपर्क हटाना चाहते हैं?')) { state.contacts = state.contacts.filter(c => c.id !== btn.dataset.deleteContact); save(); }
  }));
}
$('exportBtn').addEventListener('click', () => {
  const rows = [['नाम','मोबाइल','बूथ संख्या','क्षेत्र','WhatsApp सहमति','SMS सहमति','सहमति दर्ज समय']];
  state.contacts.forEach(c => { const b = state.booths.find(x => x.id === c.boothId); rows.push([c.name,c.phone,b?.number||'',b?.area||'',c.waConsent?'हाँ':'नहीं',c.smsConsent?'हाँ':'नहीं',c.consentAt||'']); });
  download('contacts.csv', '\ufeff' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\r\n'), 'text/csv;charset=utf-8');
});
$('backupBtn').addEventListener('click', () => download('booth-backup.json', JSON.stringify(state, null, 2), 'application/json'));
$('restoreBtn').addEventListener('click', () => $('restoreFile').click());
$('restoreFile').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const parsed = JSON.parse(await f.text());
    if (!Array.isArray(parsed.booths) || !Array.isArray(parsed.contacts)) throw new Error('bad');
    if (confirm('बैकअप इम्पोर्ट करने से मौजूदा डेमो डेटा बदल जाएगा। जारी रखें?')) { state = parsed; save(); alert('बैकअप इम्पोर्ट हो गया।'); }
  } catch (_) { alert('यह सही बैकअप फाइल नहीं है।'); }
  e.target.value = '';
});
$('copyMessage').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('messageText').value); alert('संदेश कॉपी हो गया।'); }
  catch (_) { $('messageText').select(); alert('संदेश चुन लिया गया है; कॉपी करें।'); }
});
function download(name, text, type) {
  const blob = new Blob([text], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
load();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
