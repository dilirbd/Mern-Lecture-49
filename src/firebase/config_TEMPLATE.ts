

// RENAME THIS FILE TO 'config.ts'

import { type FirebaseApp, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// put your own credentials here
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;