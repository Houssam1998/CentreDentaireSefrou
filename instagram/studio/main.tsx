import '../brand/brand.css';
import '../templates/templates.css';
import './tokens.css';
import './studio.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('app')!).render(<App />);
