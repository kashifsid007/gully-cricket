# Gully Cricket

A mobile-first React scorecard with shared, live data powered by Firebase Realtime Database.

## Real-time database setup

The app keeps a local cache so it continues to work offline. When Firebase is configured, match scores, match history, incomplete matches, players/photos, and tournament results are also synchronized to every connected phone.

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
2. Add a Web app to the project and copy its configuration values.
3. Open **Build → Realtime Database**, create a database, and choose the region closest to your users.
4. In the Realtime Database **Rules** tab, paste the contents of `database.rules.json` and publish them.
5. Copy `.env.example` to `.env.local` and replace every placeholder with the Web app values. The `databaseURL` must be copied from the Realtime Database page.
6. Restart the development server.

```powershell
Copy-Item .env.example .env.local
npm.cmd run dev
```

If the cloud database is empty, the first configured browser automatically uploads its existing local data. After that, Firebase is the shared source and each phone keeps an up-to-date local cache.

### GitHub Pages

The Firebase Web configuration is included in `.env.production`, so GitHub Pages automatically connects to the shared database on the next deployment.

Firebase Web configuration values identify the project; they are not server credentials. Access is controlled by Realtime Database rules. The included rules allow any visitor to this app to read and update Gully Cricket data, which is appropriate only for a trusted private group. Add Firebase Authentication and stricter rules before publishing the app broadly.

## Development

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```
