import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    fdb,
    getDoc,
    doc,
    reauthenticateWithCredential,
    updatePassword,
    EmailAuthProvider,
} from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", function() {
    const logout = document.getElementById("logout");
    logout.addEventListener("click", () => {logoutUser()});
    checkUserLoginStatus();
    initializeEventListener();
});

function checkUserLoginStatus() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Fetch user role from Firestore
                const userDocRef = doc(fdb, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const role = userDoc.data().role;
                    console.log("role: "+role);

                    // Redirect or validate based on role
                    if (role === "EMPLOYEE") {
                        const transaction_option = document.getElementById("transaction_option");
                        transaction_option.style.display = 'none';
                    }
                } else {
                    console.error("No user data found.");
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
            }
        } else {
            console.log("User not logged in.");
        }
    });
}

function initializeEventListener(){
    const change_password_btn = document.getElementById("change_password_btn");
    change_password_btn.addEventListener("click", () => {
        const currpass = document.getElementById("currpass").value;
        const newpass = document.getElementById("newpass").value;
        const conpass = document.getElementById("conpass").value;

        console.log("currpass: "+currpass);
        console.log("newpass: "+newpass);
        console.log("conpass: "+conpass);

        // Reauthenticate the user first (important if the session is not fresh)
        const user = auth.currentUser;
        const credential = EmailAuthProvider.credential(user.email, currpass);

        reauthenticateWithCredential(user, credential).then(() => {
            updatePassword(user, newpass).then(() => {
                console.log("Password updated successfully.");
                Swal.fire({
                    title: 'Success!',
                    text: `Password updated successfully.`,
                    icon: 'success',
                    confirmButtonText: 'OK',
                }).then(() => {
                    document.getElementById("currpass").textContent = "";
                    document.getElementById("newpass").textContent = "";
                    document.getElementById("conpass").textContent = "";
                });
            }).catch((error) => {
                console.error("Error updating password: ", error);
                Swal.fire({
                    title: 'Error!',
                    text: "Error updating password: "+ error,
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            });
        }).catch((error) => {
            console.error("Reauthentication failed: ", error);
            Swal.fire({
                title: 'Error!',
                text: "Reauthentication failed: "+ error,
                icon: 'error',
                confirmButtonText: 'OK',
            });
        });
    });
}

function logoutUser(){
    auth.signOut()
    .then(() => {
        console.log('User logged out successfully');
        window.location.href = '../html/login.html'; 
    })
    .catch((error) => {
        console.error('Error logging out:', error);
    });
}

// employee1password -> employee1passwordd