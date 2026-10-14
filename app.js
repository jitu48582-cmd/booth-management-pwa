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
  } catch (_) {
    state = { booths: [], contacts: [] };
  }
}

async function loadFromSupabase() {
  const { data: { user }, error: userError } =
    await supabaseClient.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('लॉगिन नहीं है।');

  const { data: booths, error: boothError } =
    await supabaseClient
      .from('booths')
      .select('*')
      .eq('user_id', user.id);

  if (boothError) throw boothError;

  const { data: contacts, error: contactError } =
    await supabaseClient
      .from('contacts')
      .select('*')
      .eq('user_id', user.id);

  if (contactError) throw contactError;

  state.booths = booths.map(b => ({
    id: b.id,
    number: b.booth_number,
    area: b.area,
    createdAt: b.created_at
  }));

  state.contacts = contacts.map(c => ({
    id: c.id,
    boothId: c.booth_id,
    name: c.name,
    phone: c.phone,
    waConsent: c.wa_consent,
    smsConsent: c.sms_consent,
    consentAt: c.consent_at,
    createdAt: c.created_at
  }));

  localStorage.setItem(STORE, JSON.stringify(state));
}
async function save() {
  localStorage.setItem(STORE, JSON.stringify(state));

  try {
    const { data: { user }, error: userError } =
      await supabaseClient.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error('लॉगिन नहीं है।');

    const booths = state.booths.map(b => ({
      id: b.id,
      user_id: user.id,
      booth_number: b.number,
      area: b.area,
      created_at: b.createdAt
    }));

    if (booths.length) {
      const { error } = await supabaseClient
        .from('booths')
        .upsert(booths);

      if (error) throw error;
    }

    const contacts = state.contacts.map(c => ({
      id: c.id,
      user_id: user.id,
      booth_id: c.boothId,
      name: c.name,
      phone: c.phone,
      wa_consent: c.waConsent,
      sms_consent: c.smsConsent,
      consent_at: c.consentAt,
      created_at: c.createdAt
    }));

    if (contacts.length) {
      const { error } = await supabaseClient
        .from('contacts')
        .upsert(contacts);

      if (error) throw error;
    }

    alert('Supabase में सेव करने की प्रक्रिया पूरी हुई। अब Table Editor में जाँचें।');
  } catch (error) {
    alert('Supabase में सेव नहीं हुआ: ' + error.message);
  }

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


$('loginBtn').addEventListener('click', async () => {
  const email = $('email').value.trim();
  const password = $('password').value;
  const errorBox = $('loginError');

  errorBox.textContent = 'लॉगिन जाँचा जा रहा है...';

  try {
    if (!supabaseClient) {
      throw new Error('Supabase लोड नहीं हुआ।');
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    $('login').classList.add('hidden');
    $('app').classList.remove('hidden');
    try {
  await loadFromSupabase();
  render();
} catch (error) {
  alert('डेटा लोड नहीं हुआ: ' + error.message);
    }
    render();
  } catch (error) {
    errorBox.textContent = 'लॉगिन विफल: ' + error.message;
  }
});

$('boothForm').addEventListener('submit', async e => {
  e.preventDefault();
  const number = $('boothNo').value.trim(), area = $('boothArea').value.trim();
  if (state.booths.some(b => b.number.toLowerCase() === number.toLowerCase() && b.area.toLowerCase() === area.toLowerCase())) return alert('यह बूथ पहले से मौजूद है।');
  state.booths.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), number, area, createdAt: new Date().toISOString() });
  $('boothForm').reset();
await save();
alert('बूथ सेव करने की प्रक्रिया पूरी हुई।');
});
$('contactForm').addEventListener('submit', async e => {
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
  $('contactForm').reset();await save();
alert('संपर्क सेव करने की प्रक्रिया पूरी हुई।');
  });
$('searchContacts').addEventListener('input', renderContacts);

function render() {
    const wardList = $('wardList');
  if (wardList) {
    wardList.innerHTML = Array.from({ length: 9 }, (_, i) => `
      <div class="record">
        <strong>वार्ड संख्या ${i + 1}</strong>
        <div class="muted">ग्राम पंचायत: कोटड़ी कलां</div>
      </div>
    `).join('');
  }
  $('mBooths').textContent = state.booths.length;
  $('mContacts').textContent = state.contacts.length;
  $('mWa').textContent = state.contacts.filter(c => c.waConsent).length;
  $('mSms').textContent = state.contacts.filter(c => c.smsConsent).length;
  $('boothList').innerHTML = state.booths.length ? state.booths.map(b =>
  `<div class="record">
    <strong>बूथ ${safeText(b.number)}</strong>
    <div class="muted">${safeText(b.area)}</div>
    <button class="secondary" data-view-booth="${safeText(b.id)}" style="margin-top:8px">विवरण देखें</button>
    <button class="secondary" data-delete-booth="${safeText(b.id)}" style="margin-top:8px">बूथ हटाएँ</button>
  </div>`).join('') : '<p class="muted">अभी बूथ नहीं हैं।</p>';

$('boothList').querySelectorAll('[data-view-booth]').forEach(btn => btn.addEventListener('click', () => {
  const b = state.booths.find(x => x.id === btn.dataset.viewBooth);
  if (!b) return;
  const count = state.contacts.filter(c => c.boothId === b.id).length;
  alert(`बूथ संख्या: ${b.number}\nक्षेत्र: ${b.area}\nकुल संपर्क: ${count}`);
}));
  $('boothList').querySelectorAll('[data-delete-booth]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.deleteBooth;
    if (state.contacts.some(c => c.boothId === id)) return alert('इस बूथ में संपर्क हैं। पहले संपर्क हटाएँ या उन्हें दूसरे बूथ में स्थानांतरित करें।');
    if (confirm('क्या आप यह बूथ हटाना चाहते हैं?')) { state.booths = state.booths.filter(b => b.id !== id); save(); }
  }));
  $('contactBooth').innerHTML = state.booths.map(b => `<option value="${safeText(b.id)}">${safeText(b.number)} — ${safeText(b.area)}</option>`).join('');
  $('reportContent').innerHTML = `
  <div class="grid">
    <div class="metric"><span>कुल बूथ</span><strong>${state.booths.length}</strong></div>
    <div class="metric"><span>कुल संपर्क</span><strong>${state.contacts.length}</strong></div>
    <div class="metric"><span>WhatsApp सहमति</span><strong>${state.contacts.filter(c => c.waConsent).length}</strong></div>
    <div class="metric"><span>SMS सहमति</span><strong>${state.contacts.filter(c => c.smsConsent).length}</strong></div>
  </div>
  <h3>बूथ के अनुसार रिपोर्ट</h3>
  ${state.booths.length ? state.booths.map(b => `
    <div class="record">
      <strong>बूथ ${safeText(b.number)}</strong>
      <div class="muted">क्षेत्र: ${safeText(b.area)}</div>
      <div>कुल संपर्क: ${state.contacts.filter(c => c.boothId === b.id).length}</div>
    </div>
  `).join('') : '<p class="muted">अभी कोई बूथ नहीं है।</p>'}
`;
renderContacts();
}
function renderContacts() {
  const q = ($('searchContacts')?.value || '').trim().toLowerCase();
  const rows = state.contacts.filter(c => (c.name + ' ' + c.phone).toLowerCase().includes(q));
  $('contactList').innerHTML = rows.length ? rows.map(c => {
    const b = state.booths.find(x => x.id === c.boothId);
    return `<div class="record"><strong>${safeText(c.name)}</strong><div>${safeText(c.phone)}</div>
    <label>
  <input type="checkbox" class="select-contact" value="${safeText(c.id)}">
  यह संपर्क चुनें
</label>
    <div class="muted">बूथ ${safeText(b?.number || '-')} • ${safeText(b?.area || '')}</div>
  <a class="secondary" href="https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent('नमस्ते ' + c.name + ',\n' + ($('messageText')?.value || ''))}" target="_blank" rel="noopener">WhatsApp मैसेज भेजें</a>
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
