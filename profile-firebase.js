import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data();
  const messId = userData.messId;
  
  document.getElementById('detail-name').textContent = userData.name;
  document.getElementById('detail-email').textContent = userData.email;
  document.getElementById('detail-mess').textContent = messId;
  
  const deposits = await getDocs(collection(db, `messes/${messId}/deposits`));
  const meals = await getDocs(collection(db, `messes/${messId}/meals`));
  const expenses = await getDocs(collection(db, `messes/${messId}/expenses`));
  const sharedExpenses = await getDocs(collection(db, `messes/${messId}/sharedExpenses`));
  const members = await getDocs(collection(db, `messes/${messId}/members`));
  const users = await getDocs(collection(db, 'users'));
  
  // Get active member count
  const memberEmails = new Set();
  members.docs.forEach(m => memberEmails.add(m.data().email));
  
  const activeMemberCount = users.docs.filter(u => {
    const uData = u.data();
    return uData.messId === messId && uData.email && memberEmails.has(uData.email);
  }).length;
  
  const myMemberId = members.docs.find(m => m.data().email === userData.email)?.id || user.uid;
  
  const myDeposits = deposits.docs.filter(d => d.data().memberId === myMemberId || d.data().memberId === user.uid).reduce((s, d) => s + (d.data().amount || 0), 0);
  const myMeals = meals.docs.filter(d => d.data().memberId === myMemberId || d.data().memberId === user.uid).reduce((s, d) => s + (d.data().breakfast || 0) + (d.data().lunch || 0) + (d.data().dinner || 0), 0);
  const totalExpenses = expenses.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
  const totalMeals = meals.docs.reduce((s, d) => s + (d.data().breakfast || 0) + (d.data().lunch || 0) + (d.data().dinner || 0), 0);
  const totalSharedCost = sharedExpenses.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
  
  const sharedCostPerMember = activeMemberCount > 0 ? totalSharedCost / activeMemberCount : 0;
  
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
  const myMealCost = myMeals * mealRate;
  const myTotalCost = myMealCost + sharedCostPerMember;
  const balance = myDeposits - myTotalCost;
  
  document.getElementById('profile-total-deposits').textContent = myDeposits.toFixed(2) + ' BDT';
  document.getElementById('profile-total-meal-count').textContent = myMeals;
  document.getElementById('profile-meal-rate').textContent = mealRate.toFixed(2) + ' BDT';
  document.getElementById('profile-meal-cost').textContent = myMealCost.toFixed(2) + ' BDT';
  document.getElementById('profile-shared-cost').textContent = sharedCostPerMember.toFixed(2) + ' BDT';
  document.getElementById('profile-total-cost').textContent = myTotalCost.toFixed(2) + ' BDT';
  document.getElementById('profile-remaining-balance').textContent = balance.toFixed(2) + ' BDT';
});
