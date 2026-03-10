rwa-platform/                          # Monorepo root
│
├── apps/
│   ├── web/                           # Next.js frontend 
│   ├── webhooks/                      # Express webhook service 
│   └── blockchain/                    # Hardhat contracts
│
├── packages/
│   ├── types/                         # Shared TypeScript interfaces
│   ├── email/                         # React Email templates
│   ├── db/                            # Supabase client + queries + types
│   └── config/                        # Env var validation (shared)
│
├── turbo.json                         # Build pipeline
├── package.json                       # Root workspace
└── pnpm-workspace.yaml