import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, getDocs, doc, deleteDoc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let messId = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists() || !userDoc.data().messId) { window.location.href = 'login.html'; return; }
  messId = userDoc.data().messId;
  await loadDeposits();
});

async function loadDeposits() {
  const deposits = await getDocs(collection(db, `messes/${messId}/deposits`));
  const members = await getDocs(collection(db, `messes/${messId}/members`));
  const allUsers = await getDocs(collection(db, 'users'));
  
  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m.data().name; });
  allUsers.forEach(u => { memberMap[u.id] = u.data().name; });
  
  const select = document.getElementById('deposit-member');
  select.innerHTML = '<option value="">Select member</option>';
  members.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.data().name;
    select.appendChild(opt);
  });
  
  const tbody = document.querySelector('#deposit-table tbody');
  tbody.innerHTML = '';
  
  for (const d of deposits.docs) {
    const dep = d.data();
    const memberName = memberMap[dep.memberId] || 'Unknown';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${dep.date}</td><td>${memberName}</td><td>${dep.amount} BDT</td><td><button class="edit-btn" data-id="${d.id}" data-member="${dep.memberId}" data-amount="${dep.amount}" data-date="${dep.date}">Edit</button> <button class="delete-btn" data-id="${d.id}">Delete</button></td>`;
    tbody.appendChild(tr);
  }
  
  document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => {
    document.getElementById('edit-deposit-card').style.display = 'block';
    document.getElementById('deposit-member').value = btn.dataset.member;
    document.getElementById('deposit-amount').value = btn.dataset.amount;
    document.getElementById('deposit-date').value = btn.dataset.date;
    document.getElementById('deposit-form').dataset.editId = btn.dataset.id;
    document.getElementById('edit-deposit-card').scrollIntoView({ behavior: 'smooth' });
  }));
  
  document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async () => {
    if (confirm('Delete this deposit?')) {
      await deleteDoc(doc(db, `messes/${messId}/deposits`, btn.dataset.id));
      loadDeposits();
    }
  }));
}

document.getElementById('deposit-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = e.target.dataset.editId;
  const memberId = document.getElementById('deposit-member').value;
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  const date = document.getElementById('deposit-date').value;
  
  await updateDoc(doc(db, `messes/${messId}/deposits`, editId), { memberId, amount, date });
  
  e.target.reset();
  delete e.target.dataset.editId;
  document.getElementById('edit-deposit-card').style.display = 'none';
  loadDeposits();
});