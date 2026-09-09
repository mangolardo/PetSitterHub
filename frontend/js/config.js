const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ||  window.location.hostname  === '';

const API_BASE_URL = isLocalhost
 ? 'http://localhost:3000/api'
   : '__BACKEND_URL__/api';
//window.API_BASE_URL = 'http://localhost:3000/api';