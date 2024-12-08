import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    fdb,
    getDoc,
    doc,
} from './firebaseConfig.js';

let selectedRole = ""; 
let unsubscribe;

document.addEventListener("DOMContentLoaded", function () {
    initializeLoginEvent();
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
                    console.log("selectedRole: "+selectedRole);

                    // Redirect or validate based on role
                    if (selectedRole != "" && role === selectedRole) {
                        handleRoleRedirection(role, user.email);
                    } else if (selectedRole != "" && role != selectedRole) {
                        Swal.fire({
                            title: 'Error!',
                            text: `User role mismatch: User not found in ${selectedRole}.`,
                            icon: 'error',
                            confirmButtonText: 'OK',
                        }).then(() => {
                            console.log("User got logged out.");
                            auth.signOut();
                            initializeLoginEvent();
                        });
                    } else {initializeLoginEvent();}
                } else {
                    console.error("No user data found.");
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
            }
        } else {
            console.log("User not logged in.");
            initializeLoginEvent(); // Attach login button event
        }
    });
}

function initializeLoginEvent() {
    const login_button = document.getElementById("login_button");
    login_button.addEventListener("click", () => {
        selectedRole = document.getElementById("role_selected").textContent.toUpperCase().trim();
        let username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        if (!username.includes("@pos.com")) {
            username += "@pos.com";
        }

        console.log(`Attempting login as: ${username} for role: ${selectedRole}`);

        // Set persistence before signing in
        signInWithEmailAndPassword(auth, username, password)
            .then(async (userCredential) => {
                console.log("Login successful.");
                const user = userCredential.user;
                try {
                    // Fetch user role from Firestore
                    const userDocRef = doc(fdb, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);
    
                    if (userDoc.exists()) {
                        const role = userDoc.data().role;
                        console.log("role: "+role);
                        console.log("selectedRole: "+selectedRole);
    
                        // Redirect or validate based on role
                        if (selectedRole != "" && role === selectedRole) {
                            handleRoleRedirection(role, user.email);
                        } else if (selectedRole != "" && role != selectedRole) {
                            Swal.fire({
                                title: 'Error!',
                                text: `User role mismatch: User not found in ${selectedRole}.`,
                                icon: 'error',
                                confirmButtonText: 'OK',
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    console.log("User got logged out.");
                                    auth.signOut();
                                    initializeLoginEvent();
                                }
                            });
                        } else {initializeLoginEvent();}
                    } else {
                        console.error("No user data found.");
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }
            })
            .catch((error) => {
                Swal.fire({
                    title: "Error!",
                    text: `${error.code}: ${error.message}`,
                    icon: "error",
                    confirmButtonText: "OK",
                });
            });
    });
}

function handleRoleRedirection(role, email) {
    const rolePages = {
        ADMIN: "../html/sales.html",
        EMPLOYEE: "../html/transaction.html",
    };

    if (rolePages[role]) {
        Swal.fire({
            title: 'Success!',
            text: `Logged in as ${email}`,
            icon: 'success',
            confirmButtonText: 'OK',
        }).then((result) => {
            if (result.isConfirmed) { 
                console.log(`Redirecting to: ${rolePages[role]}`);
                window.location.href = rolePages[role];
            }
        });
    } else {
        Swal.fire({
            title: 'Error!',
            text: 'Unknown role, cannot redirect.',
            icon: 'error',
            confirmButtonText: 'OK',
        }).then((result) => {
            if (result.isConfirmed) {
                auth.signOut();
            }
        });
    }
}
