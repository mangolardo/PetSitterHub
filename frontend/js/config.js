const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Il placeholder __BACKEND_URL__ verrÃ sovrascritto dalla pipeline su GitHub
const API_BASE_URL = isLocalhost
    ? 'http://localhost:3000/api'
    : '__BACKEND_URL__/api';