import { auth, db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

let currentUser = null;
let messId = null;

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
  
  currentUser = { uid: user.uid, ...userDoc.data() };
  messId = currentUser.messId;
});

// Calculate budget - using window to make it globally accessible
window.calculateBudget = function() {
  const monthly = parseFloat(document.getElementById('monthly-budget').value) || 5000;
  const days = parseInt(document.getElementById('days-count').value) || 30;
  const mealsPerDay = parseInt(document.getElementById('meals-per-day').value) || 3;
  
  const daily = monthly / days;
  const perMeal = daily / mealsPerDay;
  
  document.getElementById('display-monthly').textContent = `৳${monthly}`;
  document.getElementById('display-daily').textContent = `৳${daily.toFixed(2)}`;
  document.getElementById('display-per-meal').textContent = `৳${perMeal.toFixed(2)}`;
  document.getElementById('budget-result').style.display = 'block';
  
  const plans = document.querySelectorAll('.meal-plan');
  plans.forEach(plan => {
    plan.classList.remove('highlighted-plan');
    if (plan.id !== 'plan-low') plan.style.display = 'block';
  });
  
  const lowPlan = document.getElementById('plan-low');
  if (lowPlan) lowPlan.style.display = 'none';
  
  let recommendedPlan = '';
  let planIndex = 0;
  
  if (perMeal < 41) {
    recommendedPlan = 'Budget Too Low - Please Increase Budget';
    planIndex = 'low';
  } else if (perMeal < 50) {
    recommendedPlan = 'Basic Survival Plan (41-50 Tk)';
    planIndex = 0;
  } else if (perMeal < 60) {
    recommendedPlan = 'Balanced Low-Cost Plan (51-60 Tk)';
    planIndex = 1;
  } else if (perMeal < 70) {
    recommendedPlan = 'Standard Student Plan (61-70 Tk)';
    planIndex = 2;
  } else if (perMeal < 80) {
    recommendedPlan = 'Better Nutrition Plan (71-80 Tk)';
    planIndex = 3;
  } else if (perMeal < 90) {
    recommendedPlan = 'Comfort Student Plan (81-90 Tk)';
    planIndex = 4;
  } else if (perMeal < 100) {
    recommendedPlan = 'Premium Student Plan (91-100 Tk)';
    planIndex = 5;
  } else if (perMeal < 120) {
    recommendedPlan = 'Deluxe Plan (101-120 Tk)';
    planIndex = 6;
  } else if (perMeal < 150) {
    recommendedPlan = 'Premium Home-Style Plan (121-150 Tk)';
    planIndex = 7;
  } else {
    recommendedPlan = 'Luxury Feast Plan (151+ Tk)';
    planIndex = 8;
  }
  
  document.getElementById('recommended-plan').textContent = recommendedPlan;
  document.getElementById('display-budget-range').textContent = `৳${perMeal.toFixed(2)}`;
  
  setTimeout(() => {
    const targetPlan = document.getElementById(`plan-${planIndex}`);
    if (targetPlan) {
      targetPlan.classList.add('highlighted-plan');
      targetPlan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 300);
};

// Attach event listener when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const calculateBtn = document.getElementById('calculate-budget');
  if (calculateBtn) {
    calculateBtn.addEventListener('click', window.calculateBudget);
  }
});
