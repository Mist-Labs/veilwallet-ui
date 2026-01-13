import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ApproveTransaction from './ApproveTransaction';
import '../styles/globals.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ApproveTransaction />
    </StrictMode>
  );
}

