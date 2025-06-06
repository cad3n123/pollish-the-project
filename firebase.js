// Assumes the compat SDKs are loaded via script tags in index.html.

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
const database = firebase.database();

document.getElementById("subscribe-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;

    // Save email to Firebase
    database.ref("subscribers").push({ email: email, timestamp: Date.now() })
        .then(() => {
            document.getElementById("result").innerHTML = "Thanks for subscribing!";
            document.getElementById("email").value = "";
        })
        .catch((error) => {
            document.getElementById("result").innerHTML = "Something went wrong.";
            console.error(error);
        });
});
