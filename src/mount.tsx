import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import { App } from './App';
import type { MountContext, Unmount } from './shell-contract';

setupIonicReact({ mode: 'md' });

/**
 * Exposed as './mount' (federation.config.cjs). The shell calls it with an empty element and the
 * MountContext when the user opens /appointments, and calls the returned function when they leave.
 */
export function mount(element: HTMLElement, context: MountContext): Unmount {
  const root = createRoot(element);
  root.render(
    <StrictMode>
      <App context={context} />
    </StrictMode>,
  );
  return () => root.unmount();
}

export default mount;
