# Frontend Structure

This directory contains only essential frontend folders for the reimburse system.

## Directory Structure

```
src/
├── app/                    # Next.js app router (pages and layouts)
├── components/             # React components
│   ├── common/            # Reusable components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── ui/                # Shadcn/ui components
├── assets/                # Static assets
│   ├── icons/            # Icon files
│   └── images/           # Image files
├── constants/             # Application constants
├── context/               # React context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
└── types/                 # TypeScript type definitions
```

## Clean Frontend-Only Structure

- **No backend folders** - Removed services, stores, middleware
- **No unnecessary components** - Removed specific feature folders
- **Minimal and focused** - Only essential frontend development folders
- **Industry standard** - Follows modern React/Next.js best practices
