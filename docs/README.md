# VidShare - Short-Form Video Platform

VidShare is a prototype for a short-form video sharing platform, similar to TikTok. It is built using the T3 stack and features user authentication, video uploads, a scrolling video feed, and a like system.

This project was bootstrapped with [`create-t3-app`](https://create.t3.gg/).

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **API**: [tRPC](https://trpc.io/)
- **ORM**: [Prisma](https://prisma.io)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Schema Validation**: [Zod](https://zod.dev/)
- **Testing**: [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/)

## Project Setup

To get a local copy up and running, follow these steps.

### Prerequisites

- Node.js (v18 or later)
- npm
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```sh
   git clone <your-repository-url>
   cd video-platform
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up environment variables**
   - Copy the `.env.example` file to a new file named `.env`.
     ```sh
     cp .env.example .env
     ```
   - Update the `.env` file with your database URL and a secret for NextAuth.js.
     ```
     DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
     AUTH_SECRET="your-super-secret-auth-secret"
     ```

4. **Run database migrations**
   - This will create the necessary tables in your database based on the Prisma schema.
   ```sh
   npx prisma migrate dev
   ```

5. **(Optional) Seed the database**
   - To populate the database with some initial data for testing, you can run the seed script.
   ```sh
   npx prisma db seed
   ```

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts a production server.
- `npm run lint`: Lints the codebase.
- `npm run test`: Runs the test suite with Jest.

## API and Database

### Database Schema

The database schema is defined in `prisma/schema.prisma` and includes the following models:

- **User**: Stores user information, including credentials.
- **Video**: Stores metadata about uploaded videos, such as title, file path, and a reference to the user who uploaded it.
- **Like**: A join table that tracks which users have liked which videos.
- **Account, Session, VerificationToken**: Standard models required by NextAuth.js.

### API Endpoints

The application uses tRPC for most of its API, providing end-to-end type safety.

#### tRPC Procedures (in `src/server/api/routers/`)

- **`auth.register`**: (Mutation) Creates a new user.
- **`video.create`**: (Mutation) Creates a new video record in the database.
- **`video.getFeed`**: (Query) Fetches a paginated list of videos for the main feed.
- **`video.toggleLike`**: (Mutation) Allows a user to like or unlike a video.

#### REST Endpoints

- **`POST /api/upload`**: Handles the raw file upload of videos. It accepts `multipart/form-data` and stores the file on the server.