# Firebase Setup Instructions

## Step 1: Enable Authentication
1. Go to https://console.firebase.google.com/project/messmate-278f6/authentication
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. Click "Save"

## Step 2: Create Firestore Database
1. Go to https://console.firebase.google.com/project/messmate-278f6/firestore
2. Click "Create database"
3. Select "Start in production mode"
4. Choose location (asia-south1 for Bangladesh)
5. Click "Enable"

## Step 3: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

## Step 4: Test Locally
```bash
python3 -m http.server 8000
# Visit: http://localhost:8000/login.html
```

## Step 5: Deploy to Hosting
```bash
firebase deploy
```

## Data Structure:
```
users/
  {uid}/
    - name
    - email
    - uniqueId
    - createdAt

messes/
  {messId}/
    - messId
    - password
    - createdBy
    - createdAt
    
    members/
      {memberId}/
        - name
        - email
        - joinDate
    
    expenses/
      {expenseId}/
        - date
        - amount
        - description
        - category
    
    meals/
      {mealId}/
        - date
        - memberId
        - breakfast
        - lunch
        - dinner
    
    deposits/
      {depositId}/
        - memberId
        - amount
        - date
    
    tasks/
      {taskId}/
        - name
        - assignedTo
        - dueDate
        - status
    
    notices/
      {noticeId}/
        - text
        - createdAt
```

## Migration from LocalStorage:
আপনার existing data localStorage এ আছে। Firebase এ migrate করতে চাইলে একটা migration script লিখতে হবে।