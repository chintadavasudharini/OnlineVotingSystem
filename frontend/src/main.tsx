import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './styles/themes.css';
import './styles/components.css';
import App from './App';

declare const __APP_RUN_ID__: string;

// Whenever `npm run dev` starts, Vite injects a new unique __APP_RUN_ID__.
// If the saved run ID does not match, all previous local storage is cleared so the project runs freshly.
const currentRunId = typeof __APP_RUN_ID__ !== 'undefined' ? __APP_RUN_ID__ : Date.now().toString();
const RUN_ID_STORAGE_KEY = 'voting_system_run_id';

if (localStorage.getItem(RUN_ID_STORAGE_KEY) !== currentRunId) {
  localStorage.clear();
  localStorage.setItem(RUN_ID_STORAGE_KEY, currentRunId);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
