import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  const showSignupBtn = document.getElementById('show-signup');
  const showLoginBtn = document.getElementById('show-login');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const authSection = document.getElementById('auth-section');
  const postAuthSection = document.getElementById('post-auth-section');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.messId) {
          window.location.href = 'dashboard.html';
        } else {
          authSection.style.display = 'none';
          postAuthSection.style.display = '';
        }
      }
    }
  });

  showSignupBtn?.addEventListener('click', () => {
    signupForm.style.display = '';
    loginForm.style.display = 'none';
  });

  showLoginBtn?.addEventListener('click', () => {
    signupForm.style.display = 'none';
    loginForm.style.display = '';
  });

  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const uniqueId = document.getElementById('signup-id').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!name || !uniqueId || !email || password.length < 6) {
      document.getElementById('signup-error').textContent = 'Please fill all fields. Password must be at least 6 characters.';
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name,
        email,
        uniqueId,
        createdAt: new Date()
      });
      authSection.style.display = 'none';
      postAuthSection.style.display = '';
    } catch (error) {
      const msg = error.code === 'auth/email-already-in-use' ? 'Email already exists' : error.message;
      document.getElementById('signup-error').textContent = msg;
    }
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginId = document.getElementById('login-id').value;
    const password = document.getElementById('login-password').value;
    let email = loginId;

    try {
      if (!loginId.includes('@')) {
        const q = query(collection(db, 'users'), where('uniqueId', '==', loginId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          email = snapshot.docs[0].data().email;
        } else {
          throw new Error('User not found');
        }
      }
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      document.getElementById('login-error').textContent = error.message;
    }
  });

  document.getElementById('choose-create')?.addEventListener('click', () => {
    document.getElementById('create-mess-form').style.display = '';
    document.getElementById('join-mess-form').style.display = 'none';
  });

  document.getElementById('choose-join')?.addEventListener('click', () => {
    document.getElementById('create-mess-form').style.display = 'none';
    document.getElementById('join-mess-form').style.display = '';
  });

  document.getElementById('create-mess-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messId = document.getElementById('create-mess-id').value;
    const messPassword = document.getElementById('create-mess-password').value;

    try {
      const user = auth.currentUser;
      await setDoc(doc(db, 'messes', messId), {
        messId,
        password: messPassword,
        createdBy: user.uid,
        createdAt: new Date()
      });
      await setDoc(doc(db, 'users', user.uid), { messId, role: 'manager' }, { merge: true });
      await setDoc(doc(db, `messes/${messId}/members`, user.uid), {
        name: (await getDoc(doc(db, 'users', user.uid))).data().name,
        email: user.email,
        joinDate: new Date()
      });
      window.location.href = 'dashboard.html';
    } catch (error) {
      document.getElementById('create-mess-error').textContent = error.message;
    }
  });

  document.getElementById('join-mess-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messId = document.getElementById('join-mess-id').value;
    const messPassword = document.getElementById('join-mess-password').value;

    try {
      const user = auth.currentUser;
      const messDoc = await getDoc(doc(db, 'messes', messId));
      if (!messDoc.exists()) throw new Error('Mess not found');
      if (messDoc.data().password !== messPassword) throw new Error('Invalid password');
      
      await setDoc(doc(db, 'users', user.uid), { messId, role: 'member' }, { merge: true });
      await setDoc(doc(db, `messes/${messId}/members`, user.uid), {
        name: (await getDoc(doc(db, 'users', user.uid))).data().name,
        email: user.email,
        joinDate: new Date()
      });
      window.location.href = 'dashboard.html';
    } catch (error) {
      document.getElementById('join-mess-error').textContent = error.message;
    }
  });
});