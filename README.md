<div align="center">

# 🍽️ MESS-MATE

### A Complete Mess Management System for Students

*Built with love during my CSE journey* ❤️

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-messmate--278f6.web.app-orange?style=for-the-badge)](https://messmate-278f6.web.app)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>

---

## 📖 About The Project

**MESS-MATE** is a full-stack web application designed to simplify the daily management of student messes and hostels. Managing a mess manually — tracking who ate how many meals, who paid what, who owes whom — is a nightmare. MESS-MATE solves all of that in one place.

This project was built as part of my **CSE academic journey**, applying real-world concepts like Firebase authentication, Firestore database design, role-based access control, and responsive UI/UX design.

> 💡 *From tracking daily bazar costs to calculating each member's exact balance — MESS-MATE handles it all automatically.*

---

## ✨ Features

### 🔐 Authentication & Mess Management
- Sign up with email & password
- Login with **Unique ID or Email**
- **Create a Mess** (become the Manager) or **Join an existing Mess** with a password
- Role-based access — Managers get extra controls that members don't

### 📊 Dashboard
- Live members overview with **real-time balance** for each member
- Quick access cards to all features
- Notice board for announcements
- Deposit form with history

### 👥 Members Management
- View all active mess members with avatars
- Manager can **remove members** from the mess
- Members can **edit their own name**

### 📋 Task Scheduler
- Create and assign tasks to specific members
- Set due dates and descriptions
- Mark tasks as **complete** or reopen them
- Delete tasks when done

### 🍛 Meal Planner
- Track daily meals — **Breakfast, Lunch, Dinner** per member
- Budget calculator with **Bangladeshi meal plan suggestions** (41 Tk to 150+ Tk per meal)
- View and delete meal history

### 💰 Expense Tracker
- Add daily **bazar/grocery costs**
- Track **meal counts** per member per day
- Add **shared expenses** (electricity, gas, WiFi, water)
- Auto-calculate **meal rate** (Total Expenses ÷ Total Meals)
- **Member-wise summary** showing deposits, meal cost, shared cost, and final balance
- Date-range based meal rate calculator

### 💵 Deposits Management
- Record deposits for any member
- View full deposit history
- Edit or delete any deposit entry

### 🧾 Debt Tracker
- Record who gave money to whom
- Track pending debt requests

### 📢 Notice Board
- Post announcements visible to all mess members
- Delete notices when no longer needed

### ⭐ Reviews
- Users can submit reviews about MESS-MATE
- Displayed publicly on the landing page

---

## 🗄️ Database Structure (Firestore)

```
users/
  └── {userId}  →  name, email, uniqueId, messId, role

messes/
  └── {messId}
        ├── members/       →  name, email
        ├── tasks/         →  name, assignedTo, dueDate, description, completed
        ├── meals/         →  memberId, date, breakfast, lunch, dinner
        ├── expenses/      →  date, description, category, amount
        ├── sharedExpenses/→  date, description, category, amount
        ├── deposits/      →  memberId, amount, date
        ├── notices/       →  text, createdAt
        └── debts/         →  from, amount, date

reviews/
  └── {reviewId}  →  name, university, text, time
```

---

## 🧮 How Balance is Calculated

```
Meal Rate       = Total Bazar Expenses ÷ Total Meals (all members)
My Meal Cost    = My Total Meals × Meal Rate
Shared Cost     = Total Shared Expenses ÷ Number of Members
My Total Cost   = My Meal Cost + My Shared Cost
My Balance      = My Total Deposits − My Total Cost
```

A **positive balance** means the member has extra money.
A **negative balance** means the member owes money to the mess.

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| **HTML5 / CSS3** | Structure & Styling |
| **Vanilla JavaScript (ES6+)** | Frontend Logic |
| **Firebase Authentication** | User login & signup |
| **Cloud Firestore** | Real-time database |
| **Firebase Hosting** | Deployment |
| **Font Awesome** | Icons |
| **Google Fonts (Inter)** | Typography |

---

## 🚀 Getting Started

### Run Locally

```bash
# Clone the repository
git clone https://github.com/<your-username>/messmate.git
cd messmate

# Serve locally (no build step needed)
python3 -m http.server 8000

# Visit
http://localhost:8000
```

### Deploy to Firebase

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

---

## 📁 Project Structure

```
messmate/
├── index.html              # Entry point (redirects to login)
├── login.html              # Signup / Login / Create or Join Mess
├── dashboard.html          # Main dashboard
├── members.html            # Members management
├── tasks.html              # Task scheduler
├── meals.html              # Meal planner & budget calculator
├── expenses.html           # Expense tracker & member summary
├── deposits.html           # Deposit history
├── profile.html            # Personal profile & balance
│
├── firebase-config.js      # Firebase initialization
├── index-firebase.js       # Dashboard logic
├── login-firebase.js       # Auth logic
├── members-firebase.js     # Members logic
├── tasks-firebase.js       # Tasks logic
├── meals-firebase.js       # Meals logic
├── expenses-firebase.js    # Expenses & summary logic
├── deposits-firebase.js    # Deposits logic
├── profile-firebase.js     # Profile logic
│
├── common.css              # Shared styles (variables, navbar, footer)
├── index.css               # Dashboard & landing styles
├── meals.css               # Meal planner styles
├── expenses.css            # Expense tracker styles
├── members.css             # Members page styles
└── tasks.css               # Task scheduler styles
```

---

## 🎓 What I Learned

Building MESS-MATE taught me a lot of real-world development skills:

- **Firebase Firestore** — designing NoSQL collections, subcollections, and real-time queries
- **Firebase Authentication** — email/password auth, session management, auth state listeners
- **Role-based access control** — manager vs member permissions using CSS and JS
- **Financial logic** — implementing meal rate calculations and per-member balance tracking
- **Responsive UI** — building a consistent design system with CSS variables across multiple pages
- **Vanilla JS ES Modules** — using `import/export` without any framework or bundler

---

## 🌐 Live Demo

🔗 **[https://messmate-278f6.web.app](https://messmate-278f6.web.app)**

You can sign up, create a mess, and explore all features live.

---

## 👨‍💻 Author

Made with ❤️ as a CSE project.

---

<div align="center">
  <i>If this project helped you or you found it interesting, consider giving it a ⭐ on GitHub!</i>
</div>
