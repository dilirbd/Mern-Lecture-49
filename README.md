Use your own credentials in src/firebase/config.ts. Here's the template to follow:

```js
import { type FirebaseApp, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

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
```
