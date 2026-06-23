# 🔥 Firebase Setup Guide for Dayfie

Follow these steps to connect your Firebase backend. Everything here is **free** using Firebase's Spark (free) plan.

---

## Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter a project name (e.g. `dayfie-blog`)
4. Disable Google Analytics (optional, saves a step)
5. Click **"Create project"** → wait a few seconds → **"Continue"**

---

## Step 2 — Register a Web App

1. On your project dashboard, click the **`</>`** (Web) icon
2. Enter an App nickname: `dayfie`
3. **Do NOT** check "Firebase Hosting" (unless you want to deploy there later)
4. Click **"Register app"**
5. You'll see a `firebaseConfig` block like this:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "dayfie-blog.firebaseapp.com",
  projectId: "dayfie-blog",
  storageBucket: "dayfie-blog.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123...:web:abc..."
};
```

<!-- // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfLc-Jc8VNy8AisASREfprwBC9ul64c1U",
  authDomain: "dayfie-blog.firebaseapp.com",
  projectId: "dayfie-blog",
  storageBucket: "dayfie-blog.firebasestorage.app",
  messagingSenderId: "679265143813",
  appId: "1:679265143813:web:5ce063071590d5ee6e606c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig); -->

6. Copy these values — you'll need them in Step 6.

---

## Step 3 — Enable Authentication

1. In the left sidebar, go to **Build → Authentication**
2. Click **"Get started"**
3. Under **Sign-in method**, enable:
   - ✅ **Email/Password** → toggle on → Save
   - ✅ **Google** → toggle on → enter a support email → Save

---

## Step 4 — Set Up Firestore Database

1. In the sidebar, go to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (you'll add security rules next)
4. Select a location closest to you (e.g. `asia-southeast1` for Philippines)
5. Click **"Enable"**

### Security Rules (important!)

After Firestore is created, go to the **Rules** tab and paste this:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Anyone can read posts
    match /posts/{postId} {
      allow read: if true;
      // Only authenticated users can create
      allow create: if request.auth != null;
      // Only the author can update/delete
      allow update: if request.auth != null
        && (request.auth.uid == resource.data.authorId
            || request.resource.data.diff(resource.data).affectedKeys()
               .hasOnly(['reactions', 'reactedBy']));
      allow delete: if request.auth != null
        && request.auth.uid == resource.data.authorId;
    }

    // Users can read any profile, only write their own
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **"Publish"**.

---

## Step 5 — Set Up Firebase Storage

1. In the sidebar, go to **Build → Storage**
2. Click **"Get started"**
3. Choose **"Start in test mode"** → Next
4. Select the same location as Firestore → **"Done"**

### Storage Rules

Go to the **Rules** tab and paste:

```storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Anyone can view images
    match /posts/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 8 * 1024 * 1024  // 8MB max
        && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

Click **"Publish"**.

---

## Step 6 — Add Config to Your Project

1. In the `dayfie` folder, copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase values:
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=dayfie-blog.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=dayfie-blog
   VITE_FIREBASE_STORAGE_BUCKET=dayfie-blog.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123...:web:abc...
   ```

---

## Step 7 — Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — Dayfie is live! 🎉

---

## Free Tier Limits (Spark Plan)

| Service       | Free Limit                          |
|--------------|-------------------------------------|
| Firestore    | 1 GB storage, 50K reads/day, 20K writes/day |
| Storage      | 5 GB total, 1 GB/day download       |
| Auth         | Unlimited users                     |

This is more than enough for a personal blog. You won't hit these limits unless you go viral 🚀

---

## Optional: Enable Google Sign-In on Live Domain

If you deploy Dayfie to a custom domain (e.g. Vercel, Netlify), you need to add it to Firebase Auth:

1. Go to **Authentication → Settings → Authorized domains**
2. Click **"Add domain"** and enter your domain (e.g. `dayfie.vercel.app`)

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `auth/unauthorized-domain` | Add your domain to Auth → Settings → Authorized domains |
| `permission-denied` on Firestore | Check your security rules are published |
| Images not loading | Check Storage rules and bucket name in `.env` |
| `Firebase: No Firebase App '[DEFAULT]'` | Make sure `.env` values are correct and start with `VITE_` |
