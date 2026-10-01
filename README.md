# Customer app backend setup

The app uses the medical customer API in `../website`. Its local `.env.local` points to `http://localhost:8000`; the app appends `/api/v1/medical` automatically. Android emulators map that host to the PC through `10.0.2.2`. A physical phone must use the PC's LAN IP in `.env.local`, and both devices must be on the same network.

Start the backend from `AI/website` with `php -S 0.0.0.0:8000 -t public public/index.php`, then start the app from `AI/customerApp` with `npm start`. For browser development, open the Expo web app at a localhost URL; local CORS is enabled only for localhost and 127.0.0.1 origins while the backend `APP_ENV` is `local`.

For a deployed backend, set `EXPO_PUBLIC_API_BASE_URL` to its HTTPS origin (for example, `https://amedixmeds.com`) without `/api/v1/medical`. The deployment must allow the app's web origin if you run the web build from another domain.

Customer sign-in currently uses phone number and password. SMS OTP/Google sign-in, online payment checkout, and health-record storage need provider/backend configuration or endpoints before they can be enabled.

## Admin integration

The app uses the medical customer API in the website project. Admin-managed categories and medicines are served through the medical catalog API, and submitted orders appear under `/admin/medical/orders`. Live categories, stock, pricing, banners, and service areas load from the same backend when `EXPO_PUBLIC_API_BASE_URL` is set.
