import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentMessId = null;
let currentUserData = null;

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || !userDoc.data().messId) {
      window.location.href = 'login.html';
      return;
    }

    currentUserData = userDoc.data();
    currentMessId = currentUserData.messId;

    await loadDashboard();
  });

  document.getElementById('get-started-btn')?.addEventListener('click', () => {
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
  });
});

window.logout = async () => {
  await signOut(auth);
  window.location.href = 'login.html';
};

async function loadDashboard() {
  document.getElementById('current-user-name').textContent = currentUserData.name;
  document.getElementById('current-user-email').textContent = currentUserData.email;
  document.getElementById('current-user-role').textContent = currentUserData.role || 'member';
  document.getElementById('current-mess-id').textContent = currentMessId;

  await loadMembers();
  await loadDeposits();
  await loadNotices();
  initDepositForm();
  initNoticeForm();
  await loadDebts();
  initDebtForm();
  await loadDebtsList();
  await loadReviews();
  initReviewForm();
}

async function loadMembers() {
  const membersSnap = await getDocs(collection(db, `messes/${currentMessId}/members`));
  const members = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const allUsers = await getDocs(collection(db, 'users'));
  const activeUserEmails = new Set();
  allUsers.forEach(u => {
    const userData = u.data();
    if (userData.messId === currentMessId) {
      activeUserEmails.add(userData.email);
    }
  });
  
  const activeMembers = members.filter(m => activeUserEmails.has(m.email));
  
  const uniqueMembers = [];
  const seenEmails = new Set();
  activeMembers.forEach(m => {
    if (!seenEmails.has(m.email)) {
      seenEmails.add(m.email);
      uniqueMembers.push(m);
    }
  });
  
  const list = document.getElementById('members-overview-list');
  list.innerHTML = '';
  
  const depositsSnap = await getDocs(collection(db, `messes/${currentMessId}/deposits`));
  const deposits = depositsSnap.docs.map(d => d.data());
  
  const expensesSnap = await getDocs(collection(db, `messes/${currentMessId}/expenses`));
  const expenses = expensesSnap.docs.map(d => d.data());
  
  const mealsSnap = await getDocs(collection(db, `messes/${currentMessId}/meals`));
  const meals = mealsSnap.docs.map(d => d.data());
  
  const sharedExpensesSnap = await getDocs(collection(db, `messes/${currentMessId}/sharedExpenses`));
  const sharedExpenses = sharedExpensesSnap.docs.map(d => d.data());
  
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalSharedCost = sharedExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalMeals = meals.reduce((s, m) => s + (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0), 0);
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
  const sharedCostPerMember = uniqueMembers.length > 0 ? totalSharedCost / uniqueMembers.length : 0;
  
  const userMap = {};
  allUsers.forEach(u => { if (u.data().email) userMap[u.data().email] = u.id; });
  
  uniqueMembers.forEach(m => {
    const userId = userMap[m.email];
    const memberDeposits = deposits.filter(d => d.memberId === m.id || d.memberId === userId).reduce((s, d) => s + (d.amount || 0), 0);
    const memberMeals = meals.filter(ml => ml.memberId === m.id || ml.memberId === userId).reduce((s, ml) => s + (ml.breakfast || 0) + (ml.lunch || 0) + (ml.dinner || 0), 0);
    const mealCost = memberMeals * mealRate;
    const totalCost = mealCost + sharedCostPerMember;
    const balance = memberDeposits - totalCost;
    
    const li = document.createElement('li');
    li.className = 'members-overview-row';
    li.innerHTML = `<span class="member-name">${m.name}</span><span class="member-balance ${balance < 0 ? 'negative' : ''}">${balance.toFixed(2)} BDT</span>`;
    list.appendChild(li);
  });
}

async function loadDeposits() {
  const members = await getDocs(collection(db, `messes/${currentMessId}/members`));
  const users = await getDocs(collection(db, 'users'));
  const select = document.getElementById('deposit-member');
  select.innerHTML = '<option value="">Select member</option>';
  
  const memberEmails = new Set();
  members.forEach(d => { memberEmails.add(d.data().email); });
  
  const seenEmails = new Set();
  users.forEach(d => {
    const u = d.data();
    if (u.messId === currentMessId && u.email && memberEmails.has(u.email) && !seenEmails.has(u.email)) {
      seenEmails.add(u.email);
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = u.name;
      select.appendChild(opt);
    }
  });
}

function initDepositForm() {
  document.getElementById('deposit-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const memberId = document.getElementById('deposit-member').value;
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const date = document.getElementById('deposit-date').value;
    
    await addDoc(collection(db, `messes/${currentMessId}/deposits`), {
      memberId,
      amount,
      date,
      createdAt: new Date()
    });
    
    e.target.reset();
    alert('Deposit added!');
    loadMembers();
  });
  
  document.getElementById('view-deposit-history')?.addEventListener('click', () => {
    window.location.href = 'deposits.html';
  });
}

async function loadNotices() {
  try {
    const snapshot = await getDocs(collection(db, `messes/${currentMessId}/notices`));
    const container = document.querySelector('.notices-container');
    const ticker = document.querySelector('.ticker-track');
    
    if (!container) return;
    container.innerHTML = '';
    
    if (snapshot.empty) {
      container.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center;">No notices yet</p>';
      if (ticker) ticker.innerHTML = '';
      return;
    }
    
    // Populate notice board
    snapshot.docs.forEach(d => {
      const notice = d.data();
      const div = document.createElement('div');
      div.className = 'notice-item';
      div.innerHTML = `
        <div class="notice-content"><p>${notice.text}</p></div>
        <button class="delete-notice-btn" data-id="${d.id}">×</button>
      `;
      container.appendChild(div);
    });
    
    // Populate ticker with dynamic speed
    if (ticker) {
      const notices = snapshot.docs.map(d => d.data().text);
      const tickerText = notices.join(' • ');
      ticker.innerHTML = `<span>${tickerText} • ${tickerText}</span>`;
      
      // Calculate animation duration based on text length for constant speed
      const textLength = tickerText.length;
      const speed = 50; // pixels per second
      const duration = textLength / speed * 50; // adjust multiplier for desired speed
      ticker.querySelector('span').style.animationDuration = `${duration}s`;
    }
    
    document.querySelectorAll('.delete-notice-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Delete this notice?')) {
          await deleteDoc(doc(db, `messes/${currentMessId}/notices`, btn.dataset.id));
          loadNotices();
        }
      });
    });
  } catch (error) {
    console.error('Error loading notices:', error);
  }
}

function initNoticeForm() {
  const textarea = document.querySelector('#notice textarea');
  const button = document.querySelector('#notice button');
  
  button?.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;
    
    await addDoc(collection(db, `messes/${currentMessId}/notices`), {
      text,
      createdAt: new Date()
    });
    
    textarea.value = '';
    loadNotices();
  });
}

async function loadDebts() {
  const members = await getDocs(collection(db, `messes/${currentMessId}/members`));
  const users = await getDocs(collection(db, 'users'));
  const select = document.getElementById('debt-from');
  if (!select) return;
  
  const memberEmails = new Set();
  members.forEach(d => { memberEmails.add(d.data().email); });
  
  select.innerHTML = '<option value="">From whom money was received</option>';
  const seenEmails = new Set();
  
  users.forEach(d => {
    const u = d.data();
    if (u.messId === currentMessId && u.email && memberEmails.has(u.email) && !seenEmails.has(u.email)) {
      seenEmails.add(u.email);
      select.innerHTML += `<option value="${d.id}">${u.name}</option>`;
    }
  });
}

function initDebtForm() {
  document.getElementById('debt-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fromId = document.getElementById('debt-from').value;
    const amount = parseFloat(document.getElementById('debt-amount').value);
    
    await addDoc(collection(db, `messes/${currentMessId}/debts`), {
      fromId,
      toId: auth.currentUser.uid,
      amount,
      status: 'pending',
      createdAt: new Date()
    });
    
    e.target.reset();
    alert('Debt recorded!');
    loadDebtsList();
  });
}

async function loadDebtsList() {
  const debts = await getDocs(collection(db, `messes/${currentMessId}/debts`));
  const users = await getDocs(collection(db, 'users'));
  const currentUserId = auth.currentUser.uid;
  
  const userMap = {};
  users.forEach(d => { userMap[d.id] = d.data().name; });
  
  const list = document.getElementById('debt-requests-list');
  const count = document.getElementById('debt-request-count');
  
  if (!list || !count) return;
  
  list.innerHTML = '';
  let pendingCount = 0;
  
  debts.forEach(d => {
    const debt = d.data();
    if (debt.status === 'pending' && debt.fromId === currentUserId) {
      pendingCount++;
      const div = document.createElement('div');
      div.style.cssText = 'padding: 10px; margin: 5px 0; background: rgba(255,255,255,0.05); border-radius: 5px; display: flex; justify-content: space-between; align-items: center;';
      div.innerHTML = `
        <span>${userMap[debt.toId] || 'Unknown'} requested ${debt.amount} BDT from you</span>
        <div>
          <button onclick="acceptDebt('${d.id}', ${debt.amount}, '${debt.toId}')" style="background: #4caf50; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Accept</button>
          <button onclick="denyDebt('${d.id}')" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Deny</button>
        </div>
      `;
      list.appendChild(div);
    }
  });
  
  count.textContent = pendingCount;
}

window.acceptDebt = async (debtId, amount, toId) => {
  try {
    const fromId = auth.currentUser.uid;
    const today = new Date().toISOString().split('T')[0];
    
    await addDoc(collection(db, `messes/${currentMessId}/deposits`), {
      memberId: toId,
      amount: amount,
      date: today,
      createdAt: new Date()
    });
    
    await addDoc(collection(db, `messes/${currentMessId}/deposits`), {
      memberId: fromId,
      amount: -amount,
      date: today,
      createdAt: new Date()
    });
    
    await deleteDoc(doc(db, `messes/${currentMessId}/debts`, debtId));
    
    alert('Debt accepted! Deposits updated.');
    loadDebtsList();
    loadMembers();
  } catch (error) {
    console.error('Error accepting debt:', error);
    alert('Failed to accept debt');
  }
};

window.denyDebt = async (id) => {
  if (confirm('Deny this debt request?')) {
    await deleteDoc(doc(db, `messes/${currentMessId}/debts`, id));
    alert('Debt request denied');
    loadDebtsList();
  }
};

async function loadReviews() {
  const reviews = await getDocs(collection(db, 'reviews'));
  const container = document.getElementById('reviews-list');
  if (!container) return;
  
  const currentUserId = auth.currentUser?.uid;
  const currentUserEmail = auth.currentUser?.email;
  const userDoc = await getDoc(doc(db, 'users', currentUserId));
  const currentUserName = userDoc.data()?.name;
  
  container.innerHTML = '';
  reviews.forEach(d => {
    const r = d.data();
    // Check if owner by userId, email, or name
    const isOwner = r.userId === currentUserId || 
                    (r.email && r.email === currentUserEmail) ||
                    (r.name && r.name === currentUserName);
    const div = document.createElement('div');
    div.className = 'testimonial-card';
    const safeName = (r.name || '').replace(/'/g, "\\'");
    const safeUniversity = (r.university || '').replace(/'/g, "\\'");
    const safeText = (r.text || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    div.innerHTML = `
      <p>"${r.text}"</p>
      <div class="testimonial-author">
        <strong>${r.name}</strong>
        <span>${r.university}</span>
      </div>
      ${isOwner ? `
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button onclick="editReview('${d.id}', '${safeName}', '${safeUniversity}', '${safeText}')" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Edit</button>
          <button onclick="deleteReview('${d.id}')" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Delete</button>
        </div>
      ` : ''}
    `;
    container.appendChild(div);
  });
}

function initReviewForm() {
  document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = e.target.dataset.editId;
    
    if (editId) {
      await updateDoc(doc(db, 'reviews', editId), {
        name: document.getElementById('review-name').value,
        university: document.getElementById('review-university').value,
        text: document.getElementById('review-text').value,
        updatedAt: new Date()
      });
      delete e.target.dataset.editId;
      document.querySelector('#review-form button[type="submit"]').textContent = 'Submit Review';
      alert('Review updated!');
    } else {
      await addDoc(collection(db, 'reviews'), {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email,
        name: document.getElementById('review-name').value,
        university: document.getElementById('review-university').value,
        text: document.getElementById('review-text').value,
        createdAt: new Date()
      });
      alert('Review submitted!');
    }
    
    e.target.reset();
    loadReviews();
  });
  
  setInterval(() => {
    const timeInput = document.getElementById('review-time');
    if (timeInput) {
      timeInput.value = new Date().toLocaleString();
    }
  }, 1000);
}

window.editReview = (id, name, university, text) => {
  document.getElementById('review-name').value = name;
  document.getElementById('review-university').value = university;
  document.getElementById('review-text').value = text;
  document.getElementById('review-form').dataset.editId = id;
  document.querySelector('#review-form button[type="submit"]').textContent = 'Update Review';
  
  document.getElementById('review-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.deleteReview = async (id) => {
  if (confirm('Delete this review?')) {
    await deleteDoc(doc(db, 'reviews', id));
    alert('Review deleted!');
    loadReviews();
  }
};