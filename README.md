# Crisis Management & Alert System

A full-stack web application for managing crisis situations, alerts, incidents, and emergency contacts.

## 🚀 Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time Communication:** Socket.io (WebSocket)

## 📁 Project Structure

```
SE/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── alerts.js          # Alert management routes
│   │   ├── incidents.js       # Incident management routes
│   │   └── contacts.js        # Emergency contacts routes
│   ├── .env                   # Environment variables
│   ├── database.sql           # Database schema & sample data
│   ├── package.json           # Backend dependencies
│   └── server.js              # Express server entry point
│
└── frontend/
    ├── public/
    │   └── index.html         # HTML template
    ├── src/
    │   ├── components/        # React components
    │   │   ├── Login.js
    │   │   ├── Layout.js
    │   │   ├── Dashboard.js
    │   │   ├── Alerts.js
    │   │   ├── AlertModal.js
    │   │   ├── Incidents.js
    │   │   ├── IncidentModal.js
    │   │   ├── Contacts.js
    │   │   ├── ContactModal.js
    │   │   └── RealTimeNotification.js  # Real-time toast notifications
    │   ├── services/
    │   │   ├── api.js         # API service layer
    │   │   └── socket.js      # WebSocket service layer
    │   ├── styles/            # CSS stylesheets
    │   ├── App.js             # Main App component
    │   ├── App.css
    │   ├── index.js           # React entry point
    │   └── index.css
    └── package.json           # Frontend dependencies
```

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MySQL** (v5.7 or higher)

## 📦 Installation

### 1. Clone or Navigate to the Project Directory

```bash
cd "SE"
```

### 2. Database Setup

**Create the MySQL database:**

```bash
mysql -u root -p
```

Then run the SQL schema:

```sql
source backend/database.sql
```

Or execute the SQL file directly:

```bash
mysql -u root -p < backend/database.sql
```

### 3. Backend Setup

**Navigate to the backend folder:**

```bash
cd backend
```

**Install dependencies (includes Socket.io for real-time features):**

```bash
npm install
```

**Configure environment variables:**

Edit the `.env` file and update your MySQL credentials:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crisis_management
JWT_SECRET=your_secret_key_change_this_in_production
```

**Start the backend server:**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend API will run on `http://localhost:5000`

### 4. Frontend Setup

**Open a new terminal and navigate to the frontend folder:**

```bash
cd frontend
```

**Install dependencies (includes Socket.io client for real-time features):**

```bash
npm install
```

**Start the React development server:**

```bash
npm start
```

The frontend will run on `http://localhost:3000`

## 🔐 Default Login Credentials

- **Username:** `admin`
- **Password:** `admin123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Alerts ⚡️ (Real-time enabled)
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/:id` - Get single alert
- `POST /api/alerts` - Create new alert *(emits `alert:created`)*
- `PUT /api/alerts/:id` - Update alert *(emits `alert:updated`)*
- `DELETE /api/alerts/:id` - Delete alert *(emits `alert:deleted`)*
- `GET /api/alerts/stats/summary` - Get alert statistics

### Incidents ⚡️ (Real-time enabled)
- `GET /api/incidents` - Get all incidents
- `GET /api/incidents/:id` - Get single incident
- `POST /api/incidents` - Create new incident *(emits `incident:created`)*
- `PUT /api/incidents/:id` - Update incident *(emits `incident:updated`)*
- `DELETE /api/incidents/:id` - Delete incident *(emits `incident:deleted`)*

### Emergency Contacts
- `GET /api/contacts` - Get all contacts
- `GET /api/contacts/:id` - Get single contact
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact (soft delete)

## ✨ Features

### 🎯 Core Features
- ✅ User authentication with JWT
- ✅ Dashboard with real-time statistics
- ✅ Alert management (Create, Read, Update, Delete)
- ✅ Incident reporting and tracking
- ✅ Emergency contacts directory
- ✅ Role-based access control
- ✅ Activity logging
- ✅ Responsive design
- ✅ **Real-time updates via WebSocket (Socket.io)**
- ✅ **Live notifications for alerts and incidents**
- ✅ **Multi-user synchronization without page refresh**

### 🔴 Real-Time Features
- **Instant Updates:** All connected users receive updates immediately
- **Live Badge:** Visual indicator showing active WebSocket connection
- **Toast Notifications:** Pop-up alerts for new events
- **Auto-sync:** Changes made by any user appear instantly across all sessions
- **WebSocket Events:**
  - `alert:created` - New alert created
  - `alert:updated` - Alert status changed
  - `alert:deleted` - Alert removed
  - `incident:created` - New incident reported
  - `incident:updated` - Incident status changed
  - `incident:deleted` - Incident removed

### 📊 Dashboard
- Critical alerts counter
- Warning alerts counter
- Active incidents tracker
- Resolved incidents today
- Recent alerts overview

### ⚠️ Alert Management
- Create alerts with severity levels (Critical, Warning, Info)
- Filter alerts by type
- Resolve or delete alerts
- Location tracking
- Timestamp tracking

### 🔥 Incident Management
- Report new incidents
- Track incident severity (High, Medium, Low)
- Update incident status
- Mark incidents as resolved
- Detailed incident information

### 📞 Emergency Contacts
- Add emergency contacts
- View contact details
- Department organization
- Quick access to phone and email

## 🧪 Testing the Application

1. **Start both backend and frontend servers**
2. **Open browser:** Navigate to `http://localhost:3000`
3. **Login:** Use the default credentials (admin/admin123)
4. **Explore features:**
   - View dashboard statistics
   - Create new alerts
   - Report incidents
   - Manage emergency contacts
5. **Test real-time updates:**
   - Open multiple browser windows/tabs
   - Create or update an alert in one window
   - Watch it appear instantly in all other windows
   - Look for the 🔴 LIVE badge indicating active connection
   - Notice toast notifications for new events

## 🔧 Configuration

### Backend (.env)
```env
PORT=5000                          # Backend server port
DB_HOST=localhost                  # MySQL host
DB_USER=root                       # MySQL username
DB_PASSWORD=your_password          # MySQL password
DB_NAME=crisis_management          # Database name
JWT_SECRET=your_secret_key         # JWT secret (change in production)
```

### Frontend
The frontend automatically proxies API requests to `http://localhost:5000` in development mode.

## 🎨 Customization

### Styling
All styles are located in `frontend/src/styles/`. Modify CSS files to customize the look and feel.

### Adding New Features
1. **Backend:** Add routes in `backend/routes/`
2. **Frontend:** Create components in `frontend/src/components/`
3. **API Service:** Update `frontend/src/services/api.js`
4. **Real-time Events (optional):**
   - Emit events in backend routes: `req.app.get('io').emit('event:name', data)`
   - Listen in frontend components using `socketService.on('event:name', callback)`
   - Add event listeners in `frontend/src/services/socket.js`

## 🐛 Troubleshooting

### Database Connection Error
- Verify MySQL is running: `mysql.server status`
- Check credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Port Already in Use
- Change the port in backend `.env` file
- Kill the process using the port: `lsof -ti:5000 | xargs kill`

### CORS Issues
- Ensure both servers are running
- Check CORS configuration in `backend/server.js`

### Real-time Connection Issues
- **No LIVE badge:** Check that backend Socket.io server is running
- **Updates not appearing:** Verify browser console for WebSocket errors
- **Connection drops:** Check network stability and firewall settings
- **Events not emitting:** Ensure `req.app.get('io')` is accessible in routes

## 📝 Database Schema

### Tables
- **users** - System users with authentication
- **alerts** - Crisis alerts and warnings
- **incidents** - Reported incidents
- **emergency_contacts** - Emergency contact directory
- **notifications** - User notifications
- **activity_logs** - System activity tracking

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Update JWT secret
3. Configure production database
4. Deploy to services like Heroku, AWS, or DigitalOcean

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to Netlify, Vercel, or serve from backend

## 📄 License

This project is open source and available under the MIT License.

## 👥 Support

For issues or questions, please create an issue in the project repository.

---

**Built with ❤️ for Crisis Management**
