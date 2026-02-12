# APIFlows Server

A robust Node.js & Express backend for APIFlows, an API testing and management platform.

## Overview / Purpose

APIFlows Server solves the challenge of managing, organizing, and executing API requests in a
collaborative environment. It serves as the backbone for the APIFlows platform, handling user
authentication, data storage for API collections (similar to Postman), and acting as a "Cloud Agent"
to execute HTTP requests server-side to bypass CORS headers and manage request configurations
centrally.

## Features

- **Cloud Agent Engine**: Acts as a proxy to execute upstream API requests with configurable options
  (timeouts, redirects, SSL validation).
- **Collection Management**: Organize API requests into a structural hierarchy of Collections and
  Folders.
- **Request Management**: detailed modeling of API requests including Headers, Query Params,
  JSON/Raw Bodies, and HTTP methods.
- **User Authentication**: Secure user management using JWT, bcrypt, and cookies.
- **Robust Validation**: Strict runtime schema validation using Zod for both API requests and
  environment variables.
- **Security**: Implements Helmet, CORS, and secure HTTP headers.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (using native driver)
- **Utilities**: Zod (validation), Got (HTTP client), Bcrypt, JWT.

## Installation & Setup

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd apiflows-server
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Configure Environment Variables** Create a `.env` file in the root directory (see "Environment
   Variables" section below).

4. **Run the application**

    _Development Mode:_

    ```bash
    npm run dev
    ```

    _Production Build:_

    ```bash
    npm run build
    npm start
    ```

## Usage

Once the server is running (defaulting to port 8080), it provides RESTful endpoints for the client
application.

- **Cloud Agent**: Send a valid request object to the agent endpoint, and the server will execute it
  and return the response.
- **Collections**: Use the API to create, read, update, and delete collections and folders.
- **Authentication**: Endpoints for signing up and logging in users.

## Environment Variables

The application requires the following environment variables to be set in a `.env` file:

```env
# Environment Configuration
NODE_ENV=development
HOST=0.0.0.0
PORT=8080

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Database Configuration
DB_CONNECTION_STRING=mongodb+srv://<username>:<password>@cluster.mongodb.net/apiflows
DB_PASSWORD=<your_db_password>

# Security / JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```
