import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, push } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAonmWFMz-NGLqGT6i4gDLyBkgZ4fHsS4Q",
    authDomain: "pollish-751f2.firebaseapp.com",
    databaseURL: "https://pollish-751f2-default-rtdb.firebaseio.com",
    projectId: "pollish-751f2",
    storageBucket: "pollish-751f2.firebasestorage.app",
    messagingSenderId: "818576769248",
    appId: "1:818576769248:web:e3ec53708bc4e40d5a5085"
};

// Initialize Firebase using the global `firebase` object provided by the compat SDKs
const app = firebase.initializeApp(firebaseConfig);
const database = getDatabase(app);

document.getElementById("subscribe-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;

    // Save email to Firebase
    push(ref(database, 'subscribers'), { email, timestamp: Date.now() })
        .then(() => {
            document.getElementById("result").innerHTML = "Thanks for subscribing!";
            document.getElementById("email").value = "";
        })
        .catch((error) => {
            document.getElementById("result").innerHTML = "Something went wrong.";
            console.error(error);
        });
});
