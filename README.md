# EnrichProfile

EnrichProfile is a platform designed to collect visitor consent, gather email addresses, and enrich user profiles using a backend API. It consists of three main components:



## Demo Video
[Watch the demo video](https://drive.google.com/file/d/1LJejfz2LEo8jmBemL9aqd8CF0pPCH_6g/view?usp=drive_link)

1. **Frontend**: A React-based web application.
2. **Backend**: An Express.js server that handles profile enrichment and email notifications.
3. **Embed Script**: A lightweight JavaScript file to collect consent and email addresses on external websites.

---

## Table of Contents
- [Features](#features)
- [Setup Instructions](#setup-instructions)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Embed Script](#embed-script)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Notes](#notes)

---

## Features
- **Frontend**: Interactive React app for user interaction.
- **Backend**: Profile enrichment via ContactOut API and email notifications.
- **Embed Script**: Easy-to-integrate script for external websites.

---

## Setup Instructions

### Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

### Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory with the following variables:
   ```env
   PORT=5000
   EMAIL_USER=youremail@gmail.com
   EMAIL_APP_PASSWORD=your-email-password
   CONTACTOUT_API_KEY=your-contactout-api-key
   NOTIFY_EMAIL=notify@yourdomain.com
   ALLOWED_ORIGINS=http://localhost:3000
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   The server will run on [http://localhost:5000](http://localhost:5000).

### Embed Script
1. Update the `BACKEND_URL` in `embed/embed.js` to point to your backend server:
   ```javascript
   const BACKEND_URL = 'http://localhost:5000/enrich';
   ```
2. Include the script in your external website:
   ```html
   <script src="path/to/embed.js"></script>
   ```

---

## Environment Variables
The backend requires the following environment variables:
- `PORT`: The port the server will run on (default: 5000).
- `EMAIL_USER`: Your email address for sending notifications.
- `EMAIL_APP_PASSWORD`: App-specific password for your email.
- `CONTACTOUT_API_KEY`: API key for ContactOut.
- `NOTIFY_EMAIL`: Email address to receive notifications.
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS.

---

## Usage

### Frontend
- Open [http://localhost:3000](http://localhost:3000) in your browser.
- Interact with the app to test its functionality.

### Backend
- The backend exposes the following endpoint:
  - `POST /enrich`: Accepts an email address and enriches the profile.

### Embed Script
- Add the script to any external website to collect consent and email addresses.
- Emails are sent to the backend for enrichment.

---

## Notes
- Ensure you use HTTPS in production for both the frontend and backend.
- Update `BACKEND_URL` in `embed/embed.js` to point to your production backend.
- Follow best practices for securing environment variables and sensitive data.

---

## License
This project is licensed under the MIT License.
