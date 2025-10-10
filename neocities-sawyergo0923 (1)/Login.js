// Initialize Firebase (compat version)
const firebaseConfig = {
  apiKey: "AIzaSyDjsXXPJNdFYFk8gojRm3f3VcWvdiK1-4E",
  authDomain: "bliptube.firebaseapp.com",
  databaseURL: "https://bliptube-default-rtdb.firebaseio.com",
  projectId: "bliptube",
  storageBucket: "bliptube.firebasestorage.app",
  messagingSenderId: "940016176233",
  appId: "1:940016176233:web:1f69ea818400a763e2a6f8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const loginBtn = document.getElementById("loginBtn");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");

loginBtn.addEventListener("click", () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (!username || !password) {
        alert("Please enter your username and password.");
        return;
    }

    // Fetch global users from Firebase
    db.ref("users/" + username).once("value").then(snapshot => {
        const userData = snapshot.val();
        if (!userData) {
            alert("Incorrect username or password.");
            return;
        }

        if (userData.deleted) {
            alert("This account was permanently deleted! You cannot login.");
            return;
        }

        if (userData.password !== password) {
            alert("Incorrect username or password.");
            return;
        }

        // Successful login
        localStorage.setItem("userUsername", username);
        window.location.href = "Main.html";
    }).catch(err => {
        console.error(err);
        alert("Error connecting to server. Try again later.");
    });
});
