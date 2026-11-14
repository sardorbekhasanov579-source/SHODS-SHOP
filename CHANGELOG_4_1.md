# SHODS SHOP 4.1 — Android UI, API and Telegram fixes

- Native Android home reworked: marketplace header, search, automatic admin ads, categories, real catalogue cards, AI conversation, bottom navigation.
- Native registration opens Telegram link through Capacitor Browser plugin and offers manual reopen.
- Android API readiness handshake `/api/health`: shows an explicit incompatibility error if the public server is still on version 3.1.
- Android bearer session, CORS and same Neon data handled by server/index.mjs. Both APK and server MUST be deployed together.
- Native AI chat uses a server-side Gemini API integration, no API key embedded in APK.
- Site (desktop) unchanged, no database reset or migration. Real Click/Payme payments are NOT enabled.
- Prior Android APKs must be rebuilt and reinstalled after backend deploy.

**Security:** Render environment secrets stay on Render. No `.env` included. Deploy backend only after backup and checks.
