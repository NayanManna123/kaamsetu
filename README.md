# 🏗️ KaamSetu — Real-Time Daily Job Marketplace

> **Find Work. Hire Workers. Instantly.**
> India's #1 platform connecting daily-wage workers with companies in real-time.

KaamSetu (काम सेतु — "Bridge to Work") is a full-stack web application that connects blue-collar workers (construction, electricians, plumbers, drivers, cleaners, etc.) with companies looking to hire — instantly and locally.

---

## ✨ Features

### 👷 For Workers
- **Browse Jobs** — Discover daily, contract, and instant jobs near you
- **Smart Recommendations** — AI-powered job feed based on your skills and location
- **Apply Instantly** — One-tap job applications with real-time status updates
- **Track My Jobs** — View active applications, hire requests, and job history
- **Profile & Ratings** — Showcase your skills, experience, and work ratings
- **Real-Time Chat** — Communicate directly with employers

### 🏢 For Companies
- **Post Jobs** — Create daily, contract, or instant job postings with details
- **Search Workers** — Find skilled workers filtered by skill, location, and availability
- **Hire Workers** — Send hire requests individually or in bulk
- **Dashboard** — Track posted jobs, applications, and hired workers at a glance
- **Worker Ratings** — Rate workers after job completion
- **Real-Time Chat** — Chat with workers in real-time via Socket.io

### 🔧 Platform Features
- **Authentication** — Phone + password login and registration with JWT tokens
- **Role-Based Access** — Separate dashboards for Workers and Companies
- **Real-Time Notifications** — Powered by Socket.io for live updates
- **Demo Mode** — Try the app instantly without backend using built-in demo accounts
- **Responsive Design** — Mobile-first UI optimized for all screen sizes
- **GeoJSON Location** — Location-based job and worker search with MongoDB 2dsphere indexes

---

## 🛠️ Tech Stack

### Frontend (Client)
| Technology | Purpose |
|---|---|
| **React 18** | UI library |
| **Vite 5** | Build tool & dev server |
| **React Router v6** | Client-side routing |
| **Framer Motion** | Animations & transitions |
| **Tailwind CSS 3** | Utility-first styling |
| **Axios** | HTTP client with interceptors |
| **Lucide React** | Icon library |
| **React Hot Toast** | Toast notifications |

### Backend (Server)
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express 4** | REST API framework |
| **MongoDB + Mongoose** | Database & ODM |
| **Socket.io** | Real-time bidirectional communication |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **express-validator** | Request validation |
| **dotenv** | Environment config |

---

## 📁 Project Structure

```
FindWork/
├── client/                         # Frontend (React + Vite)
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js            # Axios instance with JWT interceptors
│   │   │   └── endpoints.js        # All API endpoint definitions
│   │   ├── components/
│   │   │   ├── AppLayout.jsx       # Main app layout wrapper
│   │   │   ├── BottomNav.jsx       # Mobile bottom navigation bar
│   │   │   ├── ChatBubble.jsx      # Chat message bubble component
│   │   │   ├── EmptyState.jsx      # Empty state placeholder
│   │   │   ├── FilterBar.jsx       # Job/worker filter controls
│   │   │   ├── JobCard.jsx         # Job listing card
│   │   │   ├── Navbar.jsx          # Top navigation bar
│   │   │   ├── NotificationBadge.jsx # Notification count badge
│   │   │   ├── Sidebar.jsx         # Desktop sidebar navigation
│   │   │   ├── SkeletonLoader.jsx  # Loading skeleton placeholders
│   │   │   ├── StarRating.jsx      # Star rating display/input
│   │   │   ├── StatCard.jsx        # Dashboard statistic card
│   │   │   └── WorkerCard.jsx      # Worker profile card
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Authentication context & provider
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── Login.jsx       # Login & Registration page
│   │   │   ├── chat/
│   │   │   │   └── ChatRoom.jsx    # Real-time chat interface
│   │   │   ├── company/
│   │   │   │   ├── CompanyDashboard.jsx  # Company home dashboard
│   │   │   │   ├── CompanyProfile.jsx    # Company profile management
│   │   │   │   ├── Hires.jsx             # Manage hire requests
│   │   │   │   ├── PostJob.jsx           # Job posting form
│   │   │   │   └── SearchWorkers.jsx     # Browse & search workers
│   │   │   └── worker/
│   │   │       ├── JobSearch.jsx         # Job search with filters
│   │   │       ├── MyJobs.jsx            # Applied/active jobs
│   │   │       ├── Requests.jsx          # Incoming hire requests
│   │   │       ├── WorkerHome.jsx        # Worker home dashboard
│   │   │       └── WorkerProfile.jsx     # Worker profile management
│   │   ├── utils/
│   │   │   └── helpers.js          # Utility/helper functions
│   │   ├── App.jsx                 # Root component with routing
│   │   ├── index.css               # Global styles & Tailwind
│   │   └── main.jsx                # App entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js              # Vite config with API proxy
│
├── server/                         # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── applicationController.js  # Job application logic
│   │   │   ├── authController.js         # Register, login, profile
│   │   │   ├── chatController.js         # Chat rooms & messages
│   │   │   ├── hireController.js         # Hire request management
│   │   │   ├── jobController.js          # Job CRUD & search
│   │   │   ├── notificationController.js # Notifications
│   │   │   ├── ratingController.js       # User ratings
│   │   │   └── workerController.js       # Worker search & profiles
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT auth & token generation
│   │   │   └── roleGuard.js        # Role-based access control
│   │   ├── models/
│   │   │   ├── Application.js      # Job application model
│   │   │   ├── Chat.js             # Chat room & message model
│   │   │   ├── HireRequest.js      # Hire request model
│   │   │   ├── Job.js              # Job posting model
│   │   │   ├── Notification.js     # Notification model
│   │   │   ├── Rating.js           # Rating/review model
│   │   │   └── User.js             # User model (worker/company/admin)
│   │   ├── routes/
│   │   │   ├── applications.js     # /api/applications
│   │   │   ├── auth.js             # /api/auth
│   │   │   ├── chat.js             # /api/chat
│   │   │   ├── hires.js            # /api/hires
│   │   │   ├── jobs.js             # /api/jobs
│   │   │   ├── notifications.js    # /api/notifications
│   │   │   ├── ratings.js          # /api/ratings
│   │   │   └── workers.js          # /api/workers
│   │   ├── utils/
│   │   │   ├── helpers.js          # Server utility functions
│   │   │   └── matchEngine.js      # Worker-job matching algorithm
│   │   └── seed.js                 # Database seeder script
│   ├── server.js                   # Express + Socket.io entry point
│   ├── .env                        # Environment variables
│   ├── .env.example                # Example env template
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v18 or higher) — [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) — [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Git** — [Download](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/FindWork.git
cd FindWork
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `server/` directory (or edit the existing one):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/kaamsetu
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=30d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 4. Seed the Database (Optional)

Populate the database with sample workers, companies, and jobs:

```bash
cd server
npm run seed
```

This creates:
- **6 Workers** with various skills (construction, electrician, plumber, driver, etc.)
- **3 Companies** (BuildRight Construction, CleanHome Services, FastLogistics)
- **8 Job Postings** across Mumbai, Delhi, Bangalore, and Ahmedabad

### 5. Start the Application

Open **two terminal windows**:

**Terminal 1 — Start the Backend:**
```bash
cd server
npm start
```
> Server runs at `http://localhost:5000`

**Terminal 2 — Start the Frontend:**
```bash
cd client
npm run dev
```
> Client runs at `http://localhost:5173`

### 6. Open in Browser

Navigate to **http://localhost:5173** to see the app.

---

## 🔑 Demo Credentials

After running the seed script, you can log in with these accounts:

| Role | Phone Number | Password |
|---|---|---|
| 👷 Worker | `9876543210` | `123456` |
| 🏢 Company | `9900000001` | `123456` |

Or simply click the **Worker Demo** / **Company Demo** buttons on the login page to use the offline demo mode (no backend required).

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login with phone + password |
| `GET` | `/api/auth/me` | Get current user profile |
| `PUT` | `/api/auth/profile` | Update user profile |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/jobs/:id` | Get job by ID |
| `POST` | `/api/jobs` | Create a new job (Company only) |
| `PUT` | `/api/jobs/:id` | Update a job |
| `DELETE` | `/api/jobs/:id` | Delete a job |
| `GET` | `/api/jobs/search` | Search jobs with filters |
| `GET` | `/api/jobs/urgent` | Get urgent jobs |
| `GET` | `/api/jobs/nearby` | Get nearby jobs (geo-based) |
| `GET` | `/api/jobs/feed/recommended` | Get recommended jobs for worker |
| `GET` | `/api/jobs/manage/my` | Get company's own posted jobs |

### Workers
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workers` | List all workers |
| `GET` | `/api/workers/:id` | Get worker by ID |
| `PUT` | `/api/workers/:id` | Update worker profile |
| `GET` | `/api/workers/search` | Search workers with filters |
| `GET` | `/api/workers/suggested/:jobId` | Get suggested workers for a job |

### Applications
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/applications` | Apply to a job |
| `GET` | `/api/applications/my` | Get worker's applications |
| `GET` | `/api/applications/job/:jobId` | Get applications for a job |
| `PUT` | `/api/applications/:id/status` | Update application status |

### Hire Requests
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/hires` | Send a hire request |
| `POST` | `/api/hires/bulk` | Bulk hire multiple workers |
| `GET` | `/api/hires/worker` | Get hire requests for worker |
| `GET` | `/api/hires/company` | Get hire requests by company |
| `PUT` | `/api/hires/:id/respond` | Respond to hire request |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/chat/rooms` | Get user's chat rooms |
| `POST` | `/api/chat/room` | Get or create a chat room |
| `GET` | `/api/chat/room/:roomId/messages` | Get messages in a room |
| `POST` | `/api/chat/room/:roomId/messages` | Send a message |

### Ratings
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ratings` | Submit a rating |
| `GET` | `/api/ratings/user/:userId` | Get ratings for a user |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get all notifications |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read |
| `PUT` | `/api/notifications/read-all` | Mark all as read |
| `GET` | `/api/notifications/unread-count` | Get unread count |

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health status |

---

## 🔌 Real-Time Events (Socket.io)

| Event | Direction | Description |
|---|---|---|
| `join` | Client → Server | Join personal notification room |
| `joinChat` | Client → Server | Join a chat room |
| `sendMessage` | Client → Server | Send a chat message |
| `newMessage` | Server → Client | Broadcast new message to chat room |

---

## 🗃️ Database Models

### User
- Supports 3 roles: `worker`, `company`, `admin`
- Embedded sub-documents for `workerProfile` and `companyProfile`
- GeoJSON `location` field with 2dsphere index for proximity queries
- Password hashed with bcryptjs (salt rounds: 10)

### Job
- Work types: `daily`, `contract`, `instant`
- Pay types: `per_day`, `fixed`
- Urgency levels: `normal`, `urgent`
- Status: `open`, `in_progress`, `completed`, `cancelled`
- GeoJSON location for geo-based search

### Application, HireRequest, Chat, Rating, Notification
- Full relational references to User and Job models
- Timestamps for audit trails

---

## 🧪 Development

### Run in Development Mode

```bash
# Server with auto-restart on file changes
cd server
npm run dev

# Client with HMR (Hot Module Replacement)
cd client
npm run dev
```

### Build for Production

```bash
cd client
npm run build
```

The production build will be output to `client/dist/`.

---

## 📝 Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/kaamsetu` | MongoDB connection string |
| `JWT_SECRET` | — | Secret key for JWT signing (change in production!) |
| `JWT_EXPIRE` | `30d` | JWT token expiration time |
| `NODE_ENV` | `development` | Environment (`development` / `production`) |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for CORS |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ for India's workforce
  <br/>
  <strong>KaamSetu</strong> — काम सेतु — Bridge to Work
</p>
