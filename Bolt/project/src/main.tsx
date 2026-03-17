import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Components
import App from './App';

// Styling
import './index.css';

// Render the main App component into the DOM root element
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);