# Connectly — Real-Time Chat & Collaboration System

Connectly is a full-stack real-time chat and collaboration application built with the MERN stack.

The project demonstrates real-world implementation of authentication, private messaging, group conversations, file attachments, message reactions, message management, online presence, read receipts, typing indicators, responsive UI, and Socket.IO-based real-time communication.

## Features

### Authentication
- User registration
- User login
- JWT authentication
- Password hashing with bcrypt
- Protected routes
- Guest routes
- Authenticated Socket.IO connections
- Persistent authentication using local storage

### Private Messaging
- One-to-one conversations
- Real-time messages using Socket.IO
- Conversation list and history
- Typing indicators
- Read receipts
- Unread message counts
- Online/offline presence
- Last seen status

### Group Chat
- Create groups
- View group members
- Add/remove members
- Promote/remove admins
- Edit group information
- Leave group
- Group administration rules
- Online group-member count

### Message Features
- Text and emoji messages
- Advanced emoji picker
- File and image attachments
- Image preview
- File download/open
- Message reactions
- Full emoji reaction picker
- Edit own messages
- Edited indicator
- Delete own messages
- Soft-deleted message display
- Real-time message updates

### Profile
- Profile page
- Edit display name
- Edit bio/about
- Upload/remove profile photo
- Profile image preview
- Live online status
- Last seen information
- Responsive profile UI

### User Experience
- Responsive desktop/tablet/mobile UI
- Conversation sidebar
- Mobile chat navigation
- Auto-scroll to latest messages
- Responsive attachment cards
- Responsive emoji picker
- Custom group modals
- Custom delete confirmation
- Loading, empty and error states
- Font Awesome icons
- Bootstrap-based layout

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- React Router
- Bootstrap
- Font Awesome
- Fetch API
- Socket.IO Client
- React Context API
- React Hooks
- emoji-picker-react

### Backend
- Node.js
- Express.js
- MongoDB
- MongoDB Atlas
- Mongoose
- JWT
- bcrypt
- Socket.IO
- Multer
- REST APIs

## Project Structure

```text
realtime-chat-collaboration/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── conversationController.js
│   │   │   └── messageController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── uploadMiddleware.js
│   │   │   └── profileImageUploadMiddleware.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Conversation.js
│   │   │   └── Message.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── conversationRoutes.js
│   │   │   └── messageRoutes.js
│   │   └── sockets/
│   │       └── chatSocket.js
│   ├── uploads/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── .gitignore
└── README.md
```

## Installation

```bash
git clone <repository-url>
cd realtime-chat-collaboration
```

## Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Run:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Production Build

```bash
cd frontend
npm run build
```

## Authentication API

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Authenticated REST requests use:

```text
Authorization: Bearer <token>
```

## User API

```text
GET  /api/users
GET  /api/users/search?q=<query>
GET  /api/users/:id
PUT  /api/users/profile
POST /api/users/profile/image
```

## Socket.IO Events

```text
send_message
receive_message
typing
stop_typing
mark_messages_read
messages_read
conversation_updated
user_online
user_offline
edit_message
delete_message
react_message
message_updated
```

## File Attachments

Supported chat file types:

```text
jpg jpeg png webp gif
pdf txt csv
doc docx
xls xlsx
zip
```

Maximum chat attachment size: `10 MB`

Supported profile images:

```text
JPG PNG WEBP GIF
```

Maximum profile image size: `5 MB`

Uploaded files are stored under:

```text
backend/uploads/
```

## Real-Time Presence

Socket.IO manages:
- Online status
- Offline status
- Last seen
- Typing state
- Read receipts

## Security Notes

- JWT-protected REST APIs
- JWT-protected Socket.IO authentication
- bcrypt password hashing
- Authenticated conversation access
- Group admin authorization
- File type validation
- File size validation
- Protected profile updates

## Future Improvements

- Cloud file storage such as Amazon S3
- Browser notifications
- Voice messages
- Audio/video calls
- Reply/quote messages
- Forwarding
- Pinned messages
- Search
- Pagination/infinite scrolling
- Profile image cropping
- Password change
- Email verification
- Docker
- Automated tests
- CI/CD
- Production deployment

## Status

```text
Authentication              Complete
Private messaging           Complete
Group messaging             Complete
Group administration        Complete
Real-time messaging         Complete
Typing indicators           Complete
Read/unread status          Complete
Online presence             Complete
Last seen                   Complete
File attachments            Complete
Emoji picker                Complete
Message reactions           Complete
Edit messages               Complete
Delete messages             Complete
Profile management          Complete
Profile photo upload        Complete
Responsive UI               Complete
```

## Author

Built as a MERN full-stack learning and interview preparation project.
