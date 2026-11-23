# NutriMentor — AI Nutrition Companion

NutriMentor is an AI-powered nutrition companion specifically engineered for Indian, homemade, and global meals. It combines machine vision food recognition with comprehensive nutritional datasets (NIN, IFCT, USDA) to track meals without tedious manual calorie counting.

---

## ✨ Features

- **AI Plate & Food Vision Scanner**: Point your device camera or upload a photo of your plate to automatically identify dishes, estimate portion sizes, and calculate calories, protein, carbs, fat, and fibre.
- **Bento Nutrition Breakdown**: Real-time daily macro breakdown with visual status chips and weekly trend analytics.
- **Interactive Meal Planner & Routine Checklist**: Plan meals across Breakfast, Mid-Morning, Lunch, Evening Snack, and Dinner with completion tracking.
- **Master Indian Food Database**: Pre-seeded with 22+ verified staple Indian foods (Rotis, Dals, Sabzis, Dairies, Grains, and Proteins).
- **Responsive & Safe-Area Aware**: Optimized for iOS Safari / Add to Home Screen PWA, mobile thumb zone navigation, and desktop web.

---

## 🚀 Quick Start & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure the following are set:
- `DATABASE_URL`: `file:./dev.db` (or PostgreSQL connection string for production)
- `AUTH_SECRET`: A secure random secret (`openssl rand -base64 32`)
- `GOOGLE_AI_API_KEY`: API key from [Google AI Studio](https://aistudio.google.com/)

### 3. Initialize Database & Seed Master Foods
```bash
npx prisma db push
npx tsx scripts/seed.ts
```

### 4. Start the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🚢 Production Deployment

### Option 1: Vercel (Recommended)
1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables in the Vercel Project Settings:
   - `DATABASE_URL` (e.g. Supabase, Neon, or Railway PostgreSQL)
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (Your production domain, e.g. `https://nutrimentor.vercel.app`)
   - `GOOGLE_AI_API_KEY`
4. Deploy!

### Option 2: Docker / Self-Hosted Node.js
```bash
npm run build
npm start
```

---

## 🔒 Security & Privacy
- Zero sample or dummy accounts in production.
- Passwords hashed with `bcryptjs`.
- Session management via JWT with NextAuth.
- Nutritional values are educational visual approximations.
