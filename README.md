# 🎬 MovieHub Frontend (React + Vite)

This is the **frontend** of the MovieHub application, built with **React** and powered by **Vite** for a lightning-fast development experience.

---

## 🚀 Features

- ⚡ **Vite** for fast builds and Hot Module Replacement (HMR)
- 🎨 **Tailwind CSS** for modern, responsive UI styling
- 🔐 **JWT-based Authentication** integration with the backend
- 🎭 User and Admin dashboards with role-based access
- 💬 Comments, votes, and movie details management

---

## 🛠️ Installation & Setup

### 1. Prerequisites

Make sure you have the following installed:

- **[Node.js](https://nodejs.org/)**
- **npm** (comes with Node.js)

Check versions:

```bash
node -v
npm -v
```

---

### 2. Clone the Repository

```bash
git clone https://github.com/MoteVinay/movieHubFrontend
cd movieHubFrontend
```

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Environment Variables

Create a `.env` file in the root directory and set the following variable:

```env
VITE_API_BASE_URL=http://localhost:5000 or backend URL you setup
```

you can download the backend files from **[movieHubBackend](https://github.com/MoteVinay/movieHubBackend)**

Replace the URL with your backend server’s address if different.

---

### 5. Run the Development Server

```bash
npm run dev
```

The frontend will start on **[http://localhost:5173](http://localhost:5173)** (default Vite port).

---

## 📂 Project Structure

```
movieHubFrontend/
│── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # App pages (Login, Home, Admin, etc.)
│   ├── hooks/         # Custom hooks (auth, API calls)
│   ├── api/           # Axios setup
│   ├── App.jsx        # Root component
│   └── main.jsx       # Entry point
│
│── public/            # Static assets
│── .env               # Environment variables
│── vite.config.js     # Vite configuration
```

---

## default accounts to use

**_ Admin account _**
eamil : bob@example.com
password : Bob@admin1

**_ User account _**
email : alice@example.com
password : Alice@user1

## ✅ You’re All Set!

Run the backend server, start this frontend, and enjoy the full **MovieHub experience** 🍿

---
