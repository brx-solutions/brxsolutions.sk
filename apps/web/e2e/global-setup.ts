import { execSync } from 'node:child_process';

// Build once before the preview server starts. The server command itself is a
// bare node process so Playwright can kill it reliably (a pnpm/shell wrapper
// leaves an orphaned preview holding the port).
export default function globalSetup() {
  execSync('pnpm build', { stdio: 'inherit' });
}
