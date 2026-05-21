# Fulcrum AI

Fulcrum AI is an advanced AI-powered application designed to streamline intelligent workflows and physics simulations.

## Technology Stack

### Core
- **Next.js 14 (App Router)** - React Framework
- **React 18** - UI Library
- **TypeScript** - Type Safety

### 3D Rendering & Physics
- **Three.js** - 3D Graphics
- **React Three Fiber** - React wrapper for Three.js
- **@react-three/drei** - Three.js helpers

### State Management & Database
- **Zustand** - Client-side state management
- **Prisma** - ORM for database access
- **SQLite** - Default database (configurable)

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animations
- **Monaco Editor** - Code editor integration

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
