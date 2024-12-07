import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    fdb,
    getDoc,
    getDocs,
    doc,
    collection,
} from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", function() {
    const logout = document.getElementById("logout");
    logout.addEventListener("click", () => {logoutUser()});
    checkUserLoginStatus();
    updateInventoryValues();
    setEventListeners();
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
                    if (role === "ADMIN") {
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
            auth.signOut()
            console.log("User not logged in.");
            window.location.href = '../html/login.html'; 
        }
    });
}

function setEventListeners(){
    const item_stocks = document.getElementById("item_stocks");
    const popup1 = document.getElementById("popup1");
    const log_addition_btn = document.getElementById("log_addition_btn");
    const popup2 = document.getElementById("popup2");
    const toppings = document.querySelectorAll(".item1");

    toppings.forEach((topping) => {
        topping.addEventListener("click", () => {
            item_stocks.style.display = "none";
            popup1.style.display = "flex";
        });
    });

    log_addition_btn.addEventListener("click", () => {
        popup1.style.display = "none";
        popup2.style.display = "flex";
    });
}

async function updateInventoryValues(){
    const inventory_item_container = document.getElementById("inventory_item_container");
    inventory_item_container.innerHTML = "";

    try {
        // Query all documents in the inventory collection
        const inventorySnapshot = await getDocs(collection(fdb, "inventory"));

        if (!inventorySnapshot.empty) {
            let index = 1;

            inventorySnapshot.forEach((doc) => {
                const data = doc.data();

                // Create a dynamic HTML structure for each inventory item
                const itemDiv = document.createElement("div");
                itemDiv.classList.add(`topping1`);

                itemDiv.innerHTML = `
                    <div class="item1" id="topping${index}">
                        <p> ${data.item_name || "N/A"} </p>
                    </div>
                    <div class="stocks1">
                        <div class="stocks_container">
                            <p>${data.item_quantity || "N/A"}</p>
                        </div>
                    </div>
                `;

                if(data.item_name === "Cups"){
                    itemDiv.innerHTML = `
                        <div class="cup2">
                            <p> ${data.item_name || "N/A"} </p>
                        </div>
                        <div class="cup3">
                            <div class="stocks_container">
                                <p>${data.item_quantity || "N/A"}</p>
                            </div>
                        </div>
                    `;
                } 

                // Append the dynamic content to the container
                inventory_item_container.appendChild(itemDiv);
                index += 1;
            });
            setEventListeners();
        } else {
            Swal.fire({
                title: "No Data",
                text: "No inventory items found.",
                icon: "info",
                confirmButtonText: "OK",
            });
        }
    } catch (error) {
        console.error("Error retrieving inventory data: ", error);
        Swal.fire({
            title: "Error!",
            text: `Error retrieving inventory items: ${error.message}`,
            icon: "error",
            confirmButtonText: "OK",
        });
    }
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