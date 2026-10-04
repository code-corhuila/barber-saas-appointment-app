import type { MountContext } from './shell-contract';

/**
 * The appointment domain app (ADR-013). Everything it requests goes through context.api and it never
 * stores a token: the session is the shell's (norm 5.4.1). The screens come in the next changes.
 */
export function App({ context }: { context: MountContext }) {
  const user = context.session.user();
  return <p>{user ? 'Citas' : 'Inicia sesión para ver tus citas.'}</p>;
}
