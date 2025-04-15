// Example file showing the correct import formats for Wasp

// ✓ Correct imports
import { useQuery, useAction } from 'wasp/client/operations';
import { getMenuById, publishMenu } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';

// ✗ Incorrect imports (don't use these)
// import { useQuery, useAction } from '@wasp/client/operations';
// import { getMenuById, publishMenu } from '@wasp/client/operations';
// import { useAuth } from '@wasp/client/auth';

// In main.wasp file, use:
// component: import { LoginPage } from "@src/client/pages/auth/LoginPage.tsx"
// Not: import { LoginPage } from "@client/pages/auth/LoginPage.tsx" 