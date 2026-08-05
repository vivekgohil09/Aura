# ChitChat Application

ChitChat is a complete one-to-one and group real-time chatting application.

## Tech Stack Used

**Client:** React JS

**Server:** Java Spring Boot, WebSockets (STOMP)

**Database:** H2 / PostgreSQL

## Run Locally

Clone the project:

```bash
git clone <repository-url>
```

Go to the project directory:

```bash
cd Chit_Chat
```

### Start Backend (Java Spring Boot)
```bash
cd backend
mvn spring-boot:run
```

### Start Frontend (React)
```bash
cd frontend
npm install
npm start
```

# Features

- **Authentication**: JWT Token based login & signup
- **Real-Time Chatting**: WebSockets (STOMP / SockJS)
- **One to One & Group Chats**: Dynamic group creation and management
- **User Search**: Search users by name or email

# Aura  
