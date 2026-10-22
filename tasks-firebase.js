import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let messId = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'login.html'; return; }
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists() || !userDoc.data().messId) { window.location.href = 'login.html'; return; }
  messId = userDoc.data().messId;
  await loadMembers();
  await loadTasks();
});

async function loadMembers() {
  const members = await getDocs(collection(db, `messes/${messId}/members`));
  const users = await getDocs(collection(db, 'users'));
  const select = document.getElementById('assigned-to');
  select.innerHTML = '<option value="">Select Member</option>';
  
  const memberEmails = new Set();
  members.forEach(d => { memberEmails.add(d.data().email); });
  
  const seenEmails = new Set();
  users.forEach(d => {
    const u = d.data();
    if (u.messId === messId && u.email && memberEmails.has(u.email) && !seenEmails.has(u.email)) {
      seenEmails.add(u.email);
      const opt = document.createElement('option');
      opt.value = u.name;
      opt.textContent = u.name;
      select.appendChild(opt);
    }
  });
}

async function loadTasks() {
  const tasks = await getDocs(collection(db, `messes/${messId}/tasks`));
  const container = document.getElementById('tasks-container');
  container.innerHTML = '';
  tasks.docs.forEach(d => {
    const task = d.data();
    const div = document.createElement('div');
    div.className = 'task-item';
    div.innerHTML = `<div><h3>${task.name}</h3><p>Assigned to: ${task.assignedTo}</p><p>Due: ${task.dueDate}</p>${task.description ? `<p>${task.description}</p>` : ''}</div><div class="task-actions"><button class="complete-btn" data-id="${d.id}">${task.status === 'completed' ? 'Reopen' : 'Complete'}</button><button class="edit-btn" onclick="editTask('${d.id}', '${task.name}', '${task.assignedTo}', '${task.dueDate}', '${task.description || ''}')">Edit</button><button class="delete-btn" data-id="${d.id}">Delete</button></div>`;
    container.appendChild(div);
  });
  document.querySelectorAll('.complete-btn').forEach(btn => btn.addEventListener('click', async () => {
    const taskDoc = await getDoc(doc(db, `messes/${messId}/tasks`, btn.dataset.id));
    await updateDoc(doc(db, `messes/${messId}/tasks`, btn.dataset.id), { status: taskDoc.data().status === 'completed' ? 'pending' : 'completed' });
    loadTasks();
  }));
  document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async () => {
    await deleteDoc(doc(db, `messes/${messId}/tasks`, btn.dataset.id));
    loadTasks();
  }));
}

window.editTask = (id, name, assignedTo, dueDate, description) => {
  document.getElementById('task-name').value = name;
  document.getElementById('assigned-to').value = assignedTo;
  document.getElementById('due-date').value = dueDate;
  document.getElementById('task-description').value = description;
  document.getElementById('task-form').dataset.editId = id;
  document.querySelector('#task-form button[type="submit"]').textContent = 'Update Task';
};

document.getElementById('task-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = e.target.dataset.editId;
  
  if (editId) {
    await updateDoc(doc(db, `messes/${messId}/tasks`, editId), {
      name: document.getElementById('task-name').value,
      assignedTo: document.getElementById('assigned-to').value,
      dueDate: document.getElementById('due-date').value,
      description: document.getElementById('task-description').value
    });
    delete e.target.dataset.editId;
    document.querySelector('#task-form button[type="submit"]').textContent = 'Add Task';
  } else {
    await addDoc(collection(db, `messes/${messId}/tasks`), {
      name: document.getElementById('task-name').value,
      assignedTo: document.getElementById('assigned-to').value,
      dueDate: document.getElementById('due-date').value,
      description: document.getElementById('task-description').value,
      status: 'pending',
      createdAt: new Date()
    });
  }
  e.target.reset();
  loadTasks();
});