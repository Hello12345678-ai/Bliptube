// ============================
// script.js
// ============================

// Check login status on any page
const loggedInUsername = localStorage.getItem("userUsername");

// Redirect logic
if (!loggedInUsername && 
    !window.location.href.includes("Login.html") && 
    !window.location.href.includes("Signup.html")) {
    // Not logged in → go to Login page
    window.location.href = "Login.html";
} else if (loggedInUsername && 
           !window.location.href.includes("Main.html") && 
           !window.location.href.includes("Signup.html") && 
           !window.location.href.includes("Login.html")) {
    // Logged in → go to Main page
    window.location.href = "Main.html";
}

// ============================
// Firebase initialization
// ============================
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

// ============================
// Helper functions
// ============================

// Get user data from Firebase
async function getUserData(username) {
    try {
        const snapshot = await db.ref("users/" + username).once("value");
        return snapshot.val();
    } catch (err) {
        console.error("Error fetching user data:", err);
        return null;
    }
}

// Log out user
function logout() {
    localStorage.removeItem("userUsername");
    window.location.href = "Login.html";
}

// Example: use this in Main.html to load profile pic dynamically
async function loadProfilePic(imgElement) {
    if (!loggedInUsername) return;
    const userData = await getUserData(loggedInUsername);
    if (userData?.profilePic) {
        imgElement.src = userData.profilePic;
    }
}

// Example: dynamic channel loading
async function loadChannelFor(username) {
    const userData = await getUserData(username);
    if (!userData) {
        alert("User not found!");
        return;
    }
    const contentArea = document.getElementById("contentArea");
    contentArea.innerHTML = `
        <h2>${username}'s Channel</h2>
        <p>Videos: ${userData.videos ? userData.videos.length : 0}</p>
        <p>Profile Pic:</p>
        <img src="${userData.profilePic || ''}" alt="Profile Pic" style="width:150px; border-radius:10px;" />
    `;
}

// Export functions globally if needed
window.loadChannelFor = loadChannelFor;
window.logout = logout;
window.loadProfilePic = loadProfilePic;
window.loggedInUsername = loggedInUsername;
