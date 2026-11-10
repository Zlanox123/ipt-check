import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { setupPwa } from './pwa';
import './styles.css';

setupPwa();
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
