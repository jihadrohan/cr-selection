# ClassVote — CR Election System

A starter CR voting app built with **Next.js App Router, TypeScript, and Tailwind CSS**. It uses a local JSON file for storage and no Prisma, Firebase, PostgreSQL, MySQL, or third-party UI framework.

## Requirements
- Node.js 20.9 or newer
- npm

## Run in VS Code
1. Extract the ZIP file.
2. Open the `classvote` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:

   ```bash
   npm install
   ```

5. Copy `.env.example` to `.env.local`.
6. Open `.env.local` and set a strong admin password:

   ```env
   ADMIN_PASSWORD=your-strong-private-password
   ```

7. Start the app:

   ```bash
   npm run dev
   ```

8. Open http://localhost:3000

## First-time setup
1. Open **Admin Panel** and enter the password from `.env.local`.
2. Save the election title and class/department.
3. Add at least two candidates.
4. Register voters. Use one line per student in `Name, StudentID` format.
5. Click **Start voting**.
6. Students open the same app URL, select one candidate, enter their registered Student ID, and submit.
7. Click **End election & publish results** to reveal the result.

## Storage
All election data is stored in `data/db.json`. Back up this file before making changes. Do not delete or edit it while the app is running.

## Important limitations — read before a real election
- This is a local/small-class starter, not a production-grade election platform.
- Student ID is an identifier, not proof of identity. Anyone who knows another student's ID may try to vote as them. For a real election, add verified student login/OTP or an approved identity-verification process.
- The JSON file is suitable for a single Node.js server and small class use. It is not suitable for multi-instance/serverless hosting, where local files may be ephemeral or not shared.
- Back up `data/db.json`. Resetting the election clears all votes.
- Use HTTPS if you expose the app outside your local computer/network.
- Admin password is stored as an environment variable. Never commit `.env.local` to GitHub.

## Tech used
- Next.js
- TypeScript / TSX
- Tailwind CSS
- Node.js built-in `fs` and `crypto` modules for local JSON storage and IDs

No database or additional application framework is used.
