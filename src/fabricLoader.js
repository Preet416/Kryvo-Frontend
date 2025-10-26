// fabricLoader.js
// Ensures fabric is attached to window.fabric for Vite / modern bundlers.
// Place this file in src/ and import it from Whiteboard.jsx.

import * as fabric from "fabric";
window.fabric = fabric;
export default fabric;
