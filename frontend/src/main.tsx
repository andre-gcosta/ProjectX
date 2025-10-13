import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';   // garante que o Tailwind CSS entre no build

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
