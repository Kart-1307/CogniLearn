import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out benign TensorFlow Lite WASM runtime INFO messages from flooding console/logs
if (typeof window !== 'undefined') {
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);
  const originalLog = console.log.bind(console);
  const originalInfo = console.info.bind(console);

  const isTfLiteInfo = (args: any[]) => {
    return args.some(arg => 
      typeof arg === 'string' && (
        arg.includes('Created TensorFlow Lite XNNPACK delegate for CPU') ||
        arg.includes('XNNPACK delegate')
      )
    );
  };

  console.info = (...args) => {
    if (isTfLiteInfo(args)) return;
    originalInfo(...args);
  };

  console.log = (...args) => {
    if (isTfLiteInfo(args)) return;
    originalLog(...args);
  };

  console.warn = (...args) => {
    if (isTfLiteInfo(args)) return;
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (isTfLiteInfo(args)) return;
    originalError(...args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
