import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    fdb,
    getDoc,
    doc,
} from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", function() {
    const logout = document.getElementById("logout");
    logout.addEventListener("click", () => {checkUserLoginStatus()});
    
});

function checkUserLoginStatus(){
    auth.signOut()
    .then(() => {
        console.log('User logged out successfully');
        sessionStorage.clear(); 
        localStorage.clear();
        auth.currentUser = null;
        window.location.href = '../html/login.html'; 
    })
    .catch((error) => {
        console.error('Error logging out:', error);
    });
}