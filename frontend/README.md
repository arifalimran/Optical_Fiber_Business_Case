# Optical Fiber Business Case - Frontend

A modern Next.js application for managing optical fiber projects with comprehensive cost calculation and business management features.

## Features

- 🎨 Modern UI with Next.js 15 and React 19
- 💅 Styled with Tailwind CSS v4
- 🎯 Type-safe with TypeScript
- 🧩 Component library with shadcn/ui
- 📱 Fully responsive layout with:
  - Collapsible sidebar navigation
  - Top navigation bar with search and notifications
  - Professional footer
  - Mobile-friendly drawer menu

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with MainLayout
│   ├── page.tsx           # Dashboard page
│   └── globals.css        # Global styles
├── components/
│   ├── layout/            # Layout components
│   │   ├── Sidebar.tsx    # Sidebar navigation
│   │   ├── TopBar.tsx     # Top navigation bar
│   │   ├── Footer.tsx     # Footer component
│   │   └── MainLayout.tsx # Main layout wrapper
│   └── ui/                # shadcn/ui components
├── lib/
│   └── utils.ts          # Utility functions
└── public/               # Static assets
```

## Available Pages

- `/` - Dashboard (implemented)
- `/projects` - Projects list (placeholder)
- `/calculator` - Cost calculator (placeholder)
- `/reports` - Reports (placeholder)
- `/analytics` - Analytics (placeholder)
- `/financial` - Financial overview (placeholder)
- `/team` - Team management (placeholder)
- `/settings` - Settings (placeholder)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui
- **Icons:** Lucide React
- **Fonts:** Geist Sans & Geist Mono

## Design System

The application uses a consistent design system with:
- Professional color palette
- Responsive typography
- Consistent spacing
- Accessible components
- Dark mode support (via Tailwind)

## Next Steps

1. Install remaining dependencies if needed:
   ```bash
   npm install clsx tailwind-merge lucide-react
   ```

2. Create additional pages for:
   - Projects management
   - Cost calculator
   - Reports generation
   - Analytics dashboard

3. Connect to the backend API (located in `../backend/`)

4. Implement authentication and user management

## License

Private - Optical Fiber Business Case Project

