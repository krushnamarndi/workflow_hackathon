# Weavy AI

A visual workflow builder for creating and executing AI-powered workflows. Build complex AI pipelines using a drag-and-drop interface with support for LLM nodes, text processing, and image handling.

## 🚀 Features

- **Visual Workflow Builder**: Intuitive drag-and-drop interface powered by React Flow
- **AI Integration**: Connect to Google Gemini models
- **Node Types**:
  - **Text Nodes**: Input and process text data
  - **Image Nodes**: Handle image inputs and outputs
  - **LLM Nodes**: Execute AI model calls with custom prompts and parameters
- **Folder Organization**: Organize workflows in a hierarchical folder structure
- **Real-time Execution**: Execute workflows and see results in real-time
- **Authentication**: Secure user authentication with Clerk
- **Database**: PostgreSQL with Prisma ORM for data persistence

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **UI Components**: 
  - [React Flow](https://reactflow.dev/) for workflow canvas
  - [Radix UI](https://www.radix-ui.com/) primitives
  - [Tailwind CSS](https://tailwindcss.com/) for styling
  - [Framer Motion](https://www.framer.com/motion/) for animations
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **API Layer**: [tRPC](https://trpc.io/) for type-safe API calls
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/)
- **AI**: [Google Generative AI](https://ai.google.dev/) (Gemini models)

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- [Clerk](https://clerk.com/) account for authentication
- [Google AI API key](https://ai.google.dev/) for AI features

## 🏁 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd weavy-ai
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/weavy_ai"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key

# Optional
PORT=3000
```

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view your data
npx prisma studio
```

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
weavy-ai/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   ├── dashboard/            # Dashboard page
│   ├── folder/[id]/          # Folder view page
│   ├── workflow/[id]/        # Workflow editor page
│   └── sso-callback/         # SSO callback page
├── components/               # React components
│   ├── sections/             # Layout sections
│   ├── ui/                   # Reusable UI components
│   └── workflow/             # Workflow-specific components
├── hooks/                    # Custom React hooks
├── lib/                      # Utility functions and configs
│   ├── trpc/                 # tRPC client setup
│   └── workflow-types.ts     # Workflow type definitions
├── prisma/                   # Database schema and migrations
│   ├── schema.prisma         # Prisma schema
│   └── migrations/           # Database migrations
├── server/                   # Backend logic
│   ├── routers/              # tRPC routers
│   └── schemas/              # Zod validation schemas
├── store/                    # Zustand state stores
└── types/                    # TypeScript type definitions
```

## 🎯 Usage

### Creating a Workflow

1. Navigate to the dashboard
2. Click "Create New Workflow" or use the "+ New" button
3. Choose a folder or create a new one
4. Start building your workflow by dragging nodes onto the canvas

### Building Workflows

1. **Add Nodes**: Drag nodes from the sidebar onto the canvas
   - Text Node: Input static text or connect text outputs
   - Image Node: Upload or reference images
   - LLM Node: Configure AI model calls

2. **Connect Nodes**: Drag from output handles to input handles
   - Text outputs can connect to text inputs, system prompts, or user messages
   - Image outputs connect to image inputs
   - LLM outputs can feed into other nodes

3. **Configure Nodes**: Click a node to open the configuration sidebar
   - Set model parameters (temperature, thinking mode, etc.)
   - Edit prompts and messages
   - Upload images or provide URLs

4. **Execute Workflow**: Click the play button to run your workflow
   - Results appear in real-time
   - View outputs in each node

### Organizing Workflows

- Create folders to organize your workflows
- Move workflows between folders using the context menu
- Rename and delete workflows and folders as needed

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run database migrations
- `npx prisma studio` - Open Prisma Studio

## 🗄️ Database Schema

### Folder
- Hierarchical folder structure for organizing workflows
- Supports nested folders with parent-child relationships

### Workflow
- Stores workflow metadata and React Flow data (nodes, edges, viewport)
- Can be organized in folders
- Tracks creation and update timestamps

### WorkflowExecution
- Logs workflow execution history
- Stores input/output data for each node execution
- Tracks execution status and errors

## 🔐 Authentication

The app uses Clerk for authentication:
- Email/password sign-in
- SSO support
- Protected routes for authenticated users
- User-specific data isolation

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:
- Database URL (consider using Supabase, Neon, or PlanetScale)
- Clerk keys
- Google AI API key

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Contributions are limited to authorized team members.

## 📧 Support

For issues or questions, please contact the development team.
