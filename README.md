# FlipDF setup

## Build production styles

Install the project dependencies with `npm install`, then run `npm run build:css` before deploying. This generates `styles.css` from `src/tailwind.css` and removes the development-only Tailwind CDN dependency. Run the build again whenever Tailwind classes or custom styles change.

## Firebase share links

1. Create a Firebase project and register a Web app. Copy its web configuration into the `firebaseConfig` object near the top of the application script in [index.html](index.html).
2. In Firebase Console, enable **Authentication → Sign-in method → Anonymous**.
3. Create a Cloud Firestore database and enable Firebase Storage.
4. Install/use the Firebase CLI, select the project, then deploy the included Firestore and Storage rules and Firebase Hosting site with `firebase use --add` followed by `firebase deploy`.
5. Host the app over HTTPS. Share links use the hosted page URL with a `#book=...` identifier. Shared books and their custom music are stored in Firebase Storage; book settings and asset URLs are stored in Firestore.

The rules intentionally allow public reads so recipients can view a book from its link. Only the anonymous owner can upload or modify assets. Anyone with a share link should be treated as able to view that book.

## Page-turn sound

Put the licensed page-turn audio asset named `flip.mp3` beside `index.html` in the hosted site. The reader loads this file for page turns and uses the browser-generated rustle only as a fallback if the file is unavailable. Browsers may require a user gesture before starting background music.
