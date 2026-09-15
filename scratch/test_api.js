import app from '../dist/server.cjs';
const handler = app.default || app;
console.log('Handler type:', typeof handler);
console.log('Handler is function/express app:', typeof handler === 'function' || typeof handler === 'object');
