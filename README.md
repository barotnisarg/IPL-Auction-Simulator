# IPL Auction Simulator

A real-time, server-authoritative IPL-style player auction simulator built on the MERN stack with Socket.io. Multiple teams join a room, bid live on players across Marquee, Pool 1, Pool 2, and a secret-selection Mini-Auction round, all while the backend enforces every rule — budgets, squad composition, timers, and bid legality — with zero trust placed in the client.

## Features

- Real-time multiplayer auction rooms (2–5 teams per room)
- JWT-authenticated user accounts
- Host-only auction controls: start, pause, resume, restart, end
- Four-stage auction flow: Marquee → Pool 1 → Pool 2 → Unsold/Mini-Auction
- Server-authoritative bidding engine — all timers, increments, and sold/unsold outcomes are decided entirely on the backend; Socket.io is used purely to synchronize state, never to decide it
- Centralized squad-legality validation (100 Cr budget, 11-player squad cap, minimum 5 bowling options, minimum 1 wicketkeeper)
- Secret, time-boxed unsold-player selection round per team
- Live panels for budget, squad, bid history, auction history, and other teams
- Client-side PDF export of every team's final squad

## Tech Stack

**Frontend** — React (Vite), React Router, Redux Toolkit, Socket.io Client, Tailwind CSS, Axios, jsPDF

**Backend** — Node.js, Express.js, MongoDB, Mongoose, Socket.io, JWT Authentication, bcrypt

**Deployment** — Client on Vercel · Server on Render · Database on MongoDB Atlas

## Project Structure