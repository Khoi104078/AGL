const API = 'http://localhost:5000/api/events';

function v(id) {
  return document.getElementById(id).value.trim();
}

function setErr(id, hintId, bad, msg) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('err', bad);
  const h = document.getElementById(hintId);
  if (msg) h.textContent = msg;
  h.classList.toggle('on', bad);
  return bad;
}

function validate() {
  let ok = true;
  if (setErr('name',      'e-name',  !v('name')))      ok = false;
  if (setErr('startTime', 'e-start', !v('startTime'))) ok = false;
  if (setErr('location',  'e-loc',   !v('location')))  ok = false;

  const s = v('startTime'), e = v('endTime');
  const endBad = !e || (s && e <= s);
  if (setErr('endTime', 'e-end', endBad,
    !e ? 'Chọn thời gian kết thúc' : 'Phải sau thời gian bắt đầu')) ok = false;

  return ok;
}

async function submitForm() {
  if (!validate()) return;

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Đang tạo...';

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:        v('name'),
        startTime:   v('startTime'),
        endTime:     v('endTime'),
        location:    v('location'),
        description: v('description')
      })
    });

    if (res.ok) {
      toast('🌸 Tạo sự kiện thành công!', 'ok');
      clearForm();
    } else {
      const err = await res.json().catch(() => ({}));
      toast('❌ ' + (err.message || 'Có lỗi xảy ra'), 'bad');
    }
  } catch {
    toast('❌ Không kết nối được với server', 'bad');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🌸 Tạo sự kiện';
  }
}

function clearForm() {
  ['name', 'startTime', 'endTime', 'location', 'description'].forEach(id =>
    document.getElementById(id).value = '');
  ['name', 'startTime', 'endTime', 'location'].forEach(id =>
    document.getElementById(id).classList.remove('err'));
  ['e-name', 'e-start', 'e-end', 'e-loc'].forEach(id =>
    document.getElementById(id).classList.remove('on'));
}

function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  setTimeout(() => t.className = '', 3400);
}

['name', 'startTime', 'endTime', 'location'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById(id).classList.remove('err');
    const map = { name:'e-name', startTime:'e-start', endTime:'e-end', location:'e-loc' };
    document.getElementById(map[id]).classList.remove('on');
  });
});