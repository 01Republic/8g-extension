import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/sidepanel.css';

const container = document.getElementById('app');
if (!container) throw new Error('App container not found');

const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);