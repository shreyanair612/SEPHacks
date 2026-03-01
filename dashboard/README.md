Velira Frontend — starter

Commands:
  npm install
  npm run dev

Notes:
- Uses exact backend API contract /api/status, /api/events, /api/trigger-drift.
- Polls every 5 seconds (implemented in AppContext).
- Font: uses 'SF Pro Display' if available on the host system; otherwise fallback to Inter/system fonts.
- To change API base, update .env VITE_API_BASE_URL.
