import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { applyTheme, getInitialTheme } from './lib/theme';

// Apply the saved theme before React mounts so we don't flash the wrong colors.
applyTheme(getInitialTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
