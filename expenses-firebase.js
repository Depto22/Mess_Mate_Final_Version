import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let messId = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists() || !userDoc.data().messId) { window.location.href = 'login.html'; return; }
  messId = userDoc.data().messId;
  
  // Check if user is manager
  if (userDoc.data().role === 'manager') {
    document.body.classList.add('is-manager');
  }
  
  await loadData();
});

async function loadData() {
  await loadMembers();
  await loadExpenses();
  await loadMeals();
  await loadSharedExpenses();
  await loadSummary();
}

async function loadMembers() {
  const members = await getDocs(collection(db, `messes/${messId}/members`));
  const users = await getDocs(collection(db, 'users'));
  const select = document.getElementById('member-select');
  select.innerHTML = '<option value="">Select Member</option>';
  
  const memberEmails = new Set();
  members.forEach(d => { memberEmails.add(d.data().email); });
  
  const seenEmails = new Set();
  users.forEach(d => {
    const u = d.data();
    if (u.messId === messId && u.email && memberEmails.has(u.email) && !seenEmails.has(u.email)) {
      seenEmails.add(u.email);
      select.innerHTML += `<option value="${d.id}">${u.name}</option>`;
    }
  });
}

async function loadExpenses() {
  const expenses = await getDocs(collection(db, `messes/${messId}/expenses`));
  const tbody = document.getElementById('expense-list');
  tbody.innerHTML = '';
  
  let total = 0;
  expenses.forEach(d => {
    const e = d.data();
    total += e.amount || 0;
    tbody.innerHTML += `<tr><td>${e.date}</td><td>${e.description}</td><td>${e.category}</td><td>${e.amount} BDT</td><td><button class="edit-btn manager-only" onclick="editExpense('${d.id}', '${e.date}', ${e.amount}, '${e.description}', '${e.category}')">Edit</button> <button class="delete-btn manager-only" onclick="deleteExpense('${d.id}')">Delete</button></td></tr>`;
  });
  
  document.getElementById('total-expenses').textContent = `${total.toFixed(2)} BDT`;
}

async function loadMeals() {
  const meals = await getDocs(collection(db, `messes/${messId}/meals`));
  const members = await getDocs(collection(db, `messes/${messId}/members`));
  const users = await getDocs(collection(db, 'users'));
  
  const memberMap = {};
  members.forEach(d => { memberMap[d.id] = d.data().name; });
  users.forEach(d => { memberMap[d.id] = d.data().name; });
  
  const tbody = document.getElementById('meal-count-list');
  tbody.innerHTML = '';
  
  let totalMeals = 0;
  meals.forEach(d => {
    const m = d.data();
    const total = (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0);
    totalMeals += total;
    tbody.innerHTML += `<tr><td>${m.date}</td><td>${memberMap[m.memberId] || 'Unknown'}</td><td>${m.breakfast || 0}</td><td>${m.lunch || 0}</td><td>${m.dinner || 0}</td><td>${total}</td><td><button class="edit-btn manager-only" onclick="editMealCount('${d.id}', '${m.memberId}', '${m.date}', ${m.breakfast}, ${m.lunch}, ${m.dinner})">Edit</button> <button class="delete-btn manager-only" onclick="deleteMeal('${d.id}')">Delete</button></td></tr>`;
  });
  
  document.getElementById('total-meals').textContent = totalMeals;
}

async function loadSummary() {
  const expenses = await getDocs(collection(db, `messes/${messId}/expenses`));
  const meals = await getDocs(collection(db, `messes/${messId}/meals`));
  const deposits = await getDocs(collection(db, `messes/${messId}/deposits`));
  const sharedExpenses = await getDocs(collection(db, `messes/${messId}/sharedExpenses`));
  const members = await getDocs(collection(db, `messes/${messId}/members`));
  const users = await getDocs(collection(db, 'users'));
  
  const memberMap = {};
  members.forEach(d => { memberMap[d.id] = d.data().name; });
  users.forEach(d => { memberMap[d.id] = d.data().name; });
  
  const totalExpenses = expenses.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
  const totalSharedCost = sharedExpenses.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
  const totalMeals = meals.docs.reduce((s, d) => s + (d.data().breakfast || 0) + (d.data().lunch || 0) + (d.data().dinner || 0), 0);
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
  
  document.getElementById('meal-rate').textContent = `${mealRate.toFixed(2)} BDT`;
  
  const membersByName = {};
  const userIdMap = {};
  
  const memberEmails = new Set();
  members.forEach(d => { memberEmails.add(d.data().email); });
  
  users.forEach(d => {
    const u = d.data();
    if (u.messId === messId && u.name && u.email && memberEmails.has(u.email)) {
      if (!membersByName[u.name]) {
        membersByName[u.name] = { name: u.name, deposits: 0, meals: 0, ids: [] };
      }
      membersByName[u.name].ids.push(d.id);
      userIdMap[d.id] = u.name;
    }
  });
  
  const memberCount = Object.keys(membersByName).length;
  const sharedCostPerMember = memberCount > 0 ? totalSharedCost / memberCount : 0;
  
  deposits.forEach(d => {
    const dep = d.data();
    const memberName = userIdMap[dep.memberId];
    if (memberName && membersByName[memberName]) {
      membersByName[memberName].deposits += dep.amount || 0;
    }
  });
  
  meals.forEach(d => {
    const m = d.data();
    const memberName = userIdMap[m.memberId];
    if (memberName && membersByName[memberName]) {
      membersByName[memberName].meals += (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0);
    }
  });
  
  const tbody = document.getElementById('member-summary-list');
  tbody.innerHTML = '';
  
  let totalDeposits = 0;
  Object.values(membersByName).forEach(m => {
    const mealCost = m.meals * mealRate;
    const totalCost = mealCost + sharedCostPerMember;
    const balance = m.deposits - totalCost;
    totalDeposits += m.deposits;
    tbody.innerHTML += `<tr><td>${m.name}</td><td>${m.deposits.toFixed(2)} BDT</td><td>${mealCost.toFixed(2)} BDT</td><td>${sharedCostPerMember.toFixed(2)} BDT</td><td>${totalCost.toFixed(2)} BDT</td><td class="${balance < 0 ? 'negative' : ''}">${balance.toFixed(2)} BDT</td></tr>`;
  });
  
  const messTotalMealCost = document.getElementById('mess-total-meal-cost');
  const messTotalSharedCost = document.getElementById('mess-total-shared-cost');
  const messTotalCost = document.getElementById('mess-total-cost');
  const messTotalMeals = document.getElementById('mess-total-meals');
  const messMealRate = document.getElementById('mess-meal-rate');
  const messRemainingBalance = document.getElementById('mess-remaining-balance');
  
  if (messTotalMealCost) messTotalMealCost.textContent = `${totalExpenses.toFixed(2)} BDT`;
  if (messTotalSharedCost) messTotalSharedCost.textContent = `${totalSharedCost.toFixed(2)} BDT`;
  if (messTotalCost) messTotalCost.textContent = `${(totalExpenses + totalSharedCost).toFixed(2)} BDT`;
  if (messTotalMeals) messTotalMeals.textContent = totalMeals;
  if (messMealRate) messMealRate.textContent = `${mealRate.toFixed(2)} BDT`;
  if (messRemainingBalance) messRemainingBalance.textContent = `${(totalDeposits - totalExpenses - totalSharedCost).toFixed(2)} BDT`;
}

document.getElementById('expense-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = e.target.dataset.editId;
  
  if (editId) {
    await updateDoc(doc(db, `messes/${messId}/expenses`, editId), {
      date: document.getElementById('expense-date').value,
      amount: parseFloat(document.getElementById('expense-amount').value),
      description: document.getElementById('expense-description').value,
      category: document.getElementById('expense-category').value
    });
    delete e.target.dataset.editId;
    document.querySelector('#expense-form button[type="submit"]').textContent = 'Add Expense';
  } else {
    await addDoc(collection(db, `messes/${messId}/expenses`), {
      date: document.getElementById('expense-date').value,
      amount: parseFloat(document.getElementById('expense-amount').value),
      description: document.getElementById('expense-description').value,
      category: document.getElementById('expense-category').value,
      createdAt: new Date()
    });
  }
  e.target.reset();
  loadData();
});

document.getElementById('meal-count-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = e.target.dataset.editId;
  
  if (editId) {
    await updateDoc(doc(db, `messes/${messId}/meals`, editId), {
      date: document.getElementById('meal-date').value,
      memberId: document.getElementById('member-select').value,
      breakfast: parseInt(document.getElementById('breakfast').value) || 0,
      lunch: parseInt(document.getElementById('lunch').value) || 0,
      dinner: parseInt(document.getElementById('dinner').value) || 0
    });
    delete e.target.dataset.editId;
    document.querySelector('#meal-count-form button[type="submit"]').textContent = 'Add Meal Count';
  } else {
    await addDoc(collection(db, `messes/${messId}/meals`), {
      date: document.getElementById('meal-date').value,
      memberId: document.getElementById('member-select').value,
      breakfast: parseInt(document.getElementById('breakfast').value) || 0,
      lunch: parseInt(document.getElementById('lunch').value) || 0,
      dinner: parseInt(document.getElementById('dinner').value) || 0,
      createdAt: new Date()
    });
  }
  e.target.reset();
  loadData();
});

window.deleteExpense = async (id) => {
  if (confirm('Delete this expense?')) {
    await deleteDoc(doc(db, `messes/${messId}/expenses`, id));
    loadData();
  }
};

window.deleteMeal = async (id) => {
  if (confirm('Delete this meal record?')) {
    await deleteDoc(doc(db, `messes/${messId}/meals`, id));
    loadData();
  }
};

document.getElementById('shared-expense-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = e.target.dataset.editId;
  
  try {
    if (editId) {
      await updateDoc(doc(db, `messes/${messId}/sharedExpenses`, editId), {
        date: document.getElementById('shared-expense-date').value,
        amount: parseFloat(document.getElementById('shared-expense-amount').value),
        description: document.getElementById('shared-expense-description').value,
        category: document.getElementById('shared-expense-category').value
      });
      delete e.target.dataset.editId;
      document.querySelector('#shared-expense-form button[type="submit"]').textContent = 'Add Shared Cost';
      alert('Shared cost updated!');
    } else {
      await addDoc(collection(db, `messes/${messId}/sharedExpenses`), {
        date: document.getElementById('shared-expense-date').value,
        amount: parseFloat(document.getElementById('shared-expense-amount').value),
        description: document.getElementById('shared-expense-description').value,
        category: document.getElementById('shared-expense-category').value,
        createdAt: new Date()
      });
      alert('Shared cost added!');
    }
    e.target.reset();
    await loadData();
  } catch (error) {
    console.error('Error saving shared expense:', error);
    alert('Failed to save shared cost: ' + error.message);
  }
});

async function loadSharedExpenses() {
  const sharedExpenses = await getDocs(collection(db, `messes/${messId}/sharedExpenses`));
  const tbody = document.getElementById('shared-expense-list');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  sharedExpenses.forEach(d => {
    const e = d.data();
    tbody.innerHTML += `<tr><td>${e.date}</td><td>${e.description}</td><td>${e.category}</td><td>${e.amount} BDT</td><td><button class="edit-btn manager-only" onclick="editSharedExpense('${d.id}', '${e.date}', ${e.amount}, '${e.description}', '${e.category}')">Edit</button> <button class="delete-btn manager-only" onclick="deleteSharedExpense('${d.id}')">Delete</button></td></tr>`;
  });
}

window.deleteSharedExpense = async (id) => {
  if (confirm('Delete this shared expense?')) {
    await deleteDoc(doc(db, `messes/${messId}/sharedExpenses`, id));
    loadData();
  }
};

window.editExpense = (id, date, amount, description, category) => {
  document.getElementById('expense-date').value = date;
  document.getElementById('expense-amount').value = amount;
  document.getElementById('expense-description').value = description;
  document.getElementById('expense-category').value = category;
  document.getElementById('expense-form').dataset.editId = id;
  document.querySelector('#expense-form button[type="submit"]').textContent = 'Update Expense';
  
  document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.editMealCount = (id, memberId, date, breakfast, lunch, dinner) => {
  document.getElementById('meal-date').value = date;
  document.getElementById('member-select').value = memberId;
  document.getElementById('breakfast').value = breakfast;
  document.getElementById('lunch').value = lunch;
  document.getElementById('dinner').value = dinner;
  document.getElementById('meal-count-form').dataset.editId = id;
  document.querySelector('#meal-count-form button[type="submit"]').textContent = 'Update Meal Count';
  
  document.getElementById('meal-count-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.editSharedExpense = (id, date, amount, description, category) => {
  document.getElementById('shared-expense-date').value = date;
  document.getElementById('shared-expense-amount').value = amount;
  document.getElementById('shared-expense-description').value = description;
  document.getElementById('shared-expense-category').value = category;
  document.getElementById('shared-expense-form').dataset.editId = id;
  document.querySelector('#shared-expense-form button[type="submit"]').textContent = 'Update Shared Cost';
  
  document.getElementById('shared-expense-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

document.getElementById('calculate-btn')?.addEventListener('click', async () => {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  
  if (!startDate || !endDate) {
    alert('Please select both start and end dates');
    return;
  }
  
  const expenses = await getDocs(collection(db, `messes/${messId}/expenses`));
  const meals = await getDocs(collection(db, `messes/${messId}/meals`));
  
  let totalExpenses = 0;
  let totalMeals = 0;
  
  expenses.forEach(d => {
    const e = d.data();
    if (e.date >= startDate && e.date <= endDate) {
      totalExpenses += e.amount || 0;
    }
  });
  
  meals.forEach(d => {
    const m = d.data();
    if (m.date >= startDate && m.date <= endDate) {
      totalMeals += (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0);
    }
  });
  
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
  
  document.getElementById('calc-total-expenses').textContent = `${totalExpenses.toFixed(2)} BDT`;
  document.getElementById('calc-total-meals').textContent = totalMeals;
  document.getElementById('calc-meal-rate').textContent = `${mealRate.toFixed(2)} BDT`;
});

const expenseDate = document.getElementById('expense-date');
const mealDate = document.getElementById('meal-date');
const sharedExpenseDate = document.getElementById('shared-expense-date');

if (expenseDate) expenseDate.valueAsDate = new Date();
if (mealDate) mealDate.valueAsDate = new Date();
if (sharedExpenseDate) sharedExpenseDate.valueAsDate = new Date();
