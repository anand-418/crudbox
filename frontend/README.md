# Crudbox Frontend

This Next.js application powers the Crudbox dashboard. It works alongside the Golang backend in this monorepo to let teams create organisations, projects, and mocked endpoints through a web interface.

## Features

- **User Authentication**: Sign up and login with email/password
- **Organisation Management**: Create and manage organisations
- **Project Management**: Create projects with unique 5-character codes
- **Endpoint Management**: Create, edit, and delete API endpoints with custom responses
- **Real-time Testing**: Test endpoints directly from the interface
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with the App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **State Management**: React Context

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or another Node package manager)
- Crudbox backend running locally or reachable over the network

### Installation

1. Install dependencies from the repository root:
   ```bash
   cd frontend
   npm install
   ```

2. Create `.env.local` with the backend URL (adjust the hostname or port if needed):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── organisation/     # Organisation creation
│   ├── projects/         # Project management
│   └── globals.css       # Global styles
├── components/            # Reusable React components
│   ├── Layout.tsx        # Main layout component
│   ├── ui/              # UI components
├── contexts/             # React Context providers
│   └── AuthContext.tsx  # Authentication context
└── lib/                  # Utility libraries
    ├── api.ts           # API service layer
    └── utils.ts         # Utility functions
```

## User Journey

1. **Sign Up**: Create a new account with email and password
2. **Create Organisation**: Set up an organisation to manage projects
3. **Create Projects**: Add projects with unique 5-character codes
4. **Define Endpoints**: Create API endpoints with custom responses
5. **Test APIs**: Use the generated URLs to test mock responses


## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Create API functions in `src/lib/api.ts`
2. Add pages in `src/app/` following the App Router convention
3. Use the AuthContext for authentication state
4. Follow the existing component patterns and styling
