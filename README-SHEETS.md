# Google Sheets Sync Add-on

This folder contains the files you need to enable cloud sync with a Google Apps Script web app.

## Files
- src/lib/sheetsClient.js
- src/App.jsx (replace with integrated version from ChatGPT)
- .env.example

## Steps
1. Deploy your Apps Script as a Web App, copy its exec URL.
2. Set VITE_SHEETS_API_URL and VITE_SHEETS_TOKEN in .env and Vercel env vars.
3. Replace App.jsx with the integrated version provided.
4. Redeploy.
