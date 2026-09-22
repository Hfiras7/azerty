// Configuration Firebase
// IMPORTANT: Remplacez ces valeurs par vos propres clés Firebase
// Obtenez-les depuis: https://console.firebase.google.com/

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT_ID.appspot.com",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

export default firebaseConfig;

/*
INSTRUCTIONS POUR CONFIGURER FIREBASE:

1. Allez sur https://console.firebase.google.com/
2. Créez un nouveau projet ou utilisez un existant
3. Activez Authentication (Email/Password)
4. Activez Firestore Database
5. Copiez la configuration et remplacez les valeurs ci-dessus
6. Dans Firestore Rules, ajoutez les règles de sécurité (voir firestore.rules)
*/
