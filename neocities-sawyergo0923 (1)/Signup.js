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

const signupBtn = document.getElementById("signupBtn");
const signupUsername = document.getElementById("signupUsername");
const signupPassword = document.getElementById("signupPassword");

signupBtn.addEventListener("click", () => {
    const username = signupUsername.value.trim();
    const password = signupPassword.value;

    if (!username || !password) {
        alert("Please enter a username and password.");
        return;
    }

    // Check if account already exists or was deleted
    db.ref("users/" + username).once("value").then(snapshot => {
        const userData = snapshot.val();
        if (userData) {
            if (userData.deleted) {
                alert("This username was permanently deleted. You cannot use it.");
                return;
            } else {
                alert("Username already exists. Try logging in.");
                return;
            }
        }

        // Create new account
        db.ref("users/" + username).set({
            password: password,
            profilePic: "", // default blank
            deleted: false
        }).then(() => {
            localStorage.setItem("userUsername", username);
            window.location.href = "Main.html";
        }).catch(err => {
            console.error(err);
            alert("Error creating account. Try again.");
        });
    }).catch(err => {
        console.error(err);
        alert("Error connecting to server. Try again.");
    });
});
