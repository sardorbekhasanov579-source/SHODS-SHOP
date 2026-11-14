import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import {Capacitor} from '@capacitor/core';
import './style.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
if(!Capacitor.isNativePlatform() && 'serviceWorker' in navigator && import.meta.env.PROD){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
