import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, getDocs, doc, deleteDoc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let messId = null;
let isManager = false;

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists() || !userDoc.data().messId) { window.location.href = 'login.html'; return; }
  messId = userDoc.data().messId;
  isManager = userDoc.data().role === 'manager';
  await loadMembers();
});

async function loadMembers() {
  const members = await getDocs(collection(db, `messes/${messId}/members`));
  const users = await getDocs(collection(db, 'users'));
  const currentUserId = auth.currentUser.uid;
  
  const userMap = {};
  users.forEach(d => { userMap[d.data().email] = d.id; });
  
  const container = document.getElementById('members-container');
  container.innerHTML = '';
  members.docs.forEach(d => {
    const member = d.data();
    const userId = userMap[member.email];
    const isCurrentUser = userId === currentUserId;
    const initials = member.name.split(' ').map(n => n[0]).join('');
    const div = document.createElement('div');
    div.className = 'member-item';
    div.innerHTML = `<div class="member-info"><div class="member-avatar">${initials}</div><div><h3>${member.name}</h3><p>${member.email}</p></div></div><div class="member-actions">${isCurrentUser ? `<button class="edit-btn" onclick="editMemberName('${userId}', '${member.name}')">Edit Name</button>` : ''}${isManager ? `<button class="delete-btn" data-id="${d.id}">Delete</button>` : ''}</div>`;
    container.appendChild(div);
  });
  document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async () => {
    if (confirm('Remove this member?')) {
      const memberDoc = await getDoc(doc(db, `messes/${messId}/members`, btn.dataset.id));
      const memberEmail = memberDoc.data().email;
      
      const usersSnap = await getDocs(collection(db, 'users'));
      const userDoc = usersSnap.docs.find(d => d.data().email === memberEmail);
      if (userDoc) {
        await updateDoc(doc(db, 'users', userDoc.id), { messId: null, role: null });
      }
      
      await deleteDoc(doc(db, `messes/${messId}/members`, btn.dataset.id));
      loadMembers();
    }
  }));
}

window.editMemberName = async (userId, currentName) => {
  const newName = prompt('Enter new name:', currentName);
  if (newName && newName.trim() && newName !== currentName) {
    try {
      await updateDoc(doc(db, 'users', userId), { name: newName.trim() });
      
      const members = await getDocs(collection(db, `messes/${messId}/members`));
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userEmail = userDoc.data().email;
      
      members.forEach(async (m) => {
        if (m.data().email === userEmail) {
          await updateDoc(doc(db, `messes/${messId}/members`, m.id), { name: newName.trim() });
        }
      });
      
      alert('Name updated successfully!');
      loadMembers();
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Failed to update name');
    }
  }
};