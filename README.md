# Task Tracker

A high-fidelity, desktop-restricted real-time Task Management System with integrated chat, role permissions (Admin, Manager, User), timesheet logging with geolocation, and encrypted file sharing.

## Deployment

### Architecture Diagram

```mermaid
graph TD
    Client[Vite React Frontend on Vercel] <-->|HTTPS / WebSockets| Server[Express.js Node Backend on Render.com]
    Server <-->|Mongoose ODM| DB[(MongoDB Atlas Cloud)]
    Client <-->|Optional| GoogleOAuth[Google Identity Provider]
```

### Environment Variables

#### Backend (Render.com / Local)
- `MONGO_URL`: MongoDB Atlas connection string.
- `JWT_SECRET`: Secret key for signing authentication JSON Web Tokens.
- `ADMIN_INVITE_TOKEN`: Token required to register an Admin account.
- `CLIENT_URL`: Deployment URL of the Vercel frontend (for CORS).
- `PORT`: Port the Express server listens on (defaults to `8080`).
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID for OAuth authentication.

#### Frontend (Vercel / Local)
- `VITE_API_URL`: URL of the deployed backend server.

---

### Local Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Nagapranav15/Task-manager.git
   cd Task-manager
   ```

2. **Setup the Backend**:
   ```bash
   cd backend
   cp .env.example .env
   # Fill in the environment variables in .env
   npm install
   npm run dev
   ```

3. **Setup the Frontend**:
   ```bash
   cd ../frontend/Task-manager
   cp .env.example .env
   # Set VITE_API_URL=http://localhost:8080 in .env
   npm install
   npm run dev
   ```

---

### Deployment Steps

#### 1. Backend Deployment (Render.com)
1. Go to [Render.com Dashboard](https://dashboard.render.com/) and log in.
2. Click **New** -> **Blueprint**.
3. Connect your GitHub repository: `Nagapranav15/Task-manager`.
4. Render will parse `render.yaml` and prompt you for the required environment variables (`MONGO_URL`, `CLIENT_URL`, etc.).
5. Provide your values and click **Approve / Apply**.
6. Render will build and deploy the backend automatically. Note down your backend URL (e.g. `https://task-tracker-backend.onrender.com`).

#### 2. Frontend Deployment (Vercel)
1. Install Vercel CLI: `npm i -g vercel`.
2. Navigate to the frontend directory: `cd frontend/Task-manager`.
3. Run `vercel --prod` to deploy.
4. Set the environment variable `VITE_API_URL` to your live backend Render URL.
5. Vercel will build and deploy the frontend (e.g. `https://task-tracker-frontend-np.vercel.app`).

### Production URLs
- **Frontend URL**: `https://task-tracker-frontend-np.vercel.app`
- **Backend URL**: `https://task-tracker-backend-np.onrender.com` (Set up on Render via `render.yaml` Blueprint)
