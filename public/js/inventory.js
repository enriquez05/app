import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    fdb,
    getDoc,
    getDocs,
    doc,
    collection,
    updateDoc,
} from "./firebaseConfig.js";

let currentClickDataContent = null;

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
    const cup2 = document.querySelectorAll(".item1");
    const back_btn1 = document.getElementById("back_btn1");
    const back_btn2 = document.getElementById("back_btn2");

    toppings.forEach((topping) => {
        topping.addEventListener("click", () => {
            item_stocks.style.display = "none";
            popup1.style.display = "flex";
            
            // Parse the data-content attribute of the clicked element
            const dataContent = JSON.parse(topping.getAttribute("data-content").replace(/&quot;/g, '"'));
            console.log("dataContent: "+dataContent);
            currentClickDataContent = dataContent;
            displayClickedContent(dataContent);
        });
    });

    back_btn1.addEventListener("click", () => {
        item_stocks.style.display = "flex";
        popup1.style.display = "none";
        currentClickDataContent = null;
    });

    log_addition_btn.addEventListener("click", () => {
        popup1.style.display = "none";
        popup2.style.display = "flex";
        displayLogClickedContent();
    });

    back_btn2.addEventListener("click", () => {
        popup1.style.display = "flex";
        popup2.style.display = "none";
    });

    cup2.forEach((topping) => {
        topping.addEventListener("click", () => {
            // display cups
        });
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
                const dataContent = JSON.stringify(data);

                // Create a dynamic HTML structure for each inventory item
                const itemDiv = document.createElement("div");
                itemDiv.classList.add(`topping1`);

                itemDiv.innerHTML = `
                    <div class="item1" id="topping${index}" data-content='${dataContent}'>
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
                        <div class="cup2" data-content='${dataContent}'>
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

function displayClickedContent(dataContent){
    const popup1_name = document.getElementById("popup1_name");
    const stocks_value = document.getElementById("stocks_value");
    const price_value = document.getElementById("price_value");
    const add_stocks_btn = document.getElementById("add_stocks_btn");
    const add_stocks_price_btn = document.getElementById("add_stocks_price_btn");

    popup1_name.innerHTML = `<p>${dataContent.item_name}</p>`;
    stocks_value.innerHTML = `<p>${dataContent.item_quantity} PCS</p>`;
    price_value.innerHTML = `<p>₱${dataContent.item_sellingPrice}</p>`;

    add_stocks_btn.addEventListener("click", () => {
        const add_stocks = parseInt(document.getElementById("add_stocks").value, 10);
        console.log("add_stocks: "+add_stocks);

        if (add_stocks > 0){
            // update dataContent base on the new value
            dataContent.item_quantity += add_stocks;
            stocks_value.innerHTML = `<p>${dataContent.item_quantity} PCS</p>`;
            updateItemInFirestore(dataContent);
        } else {
            Swal.fire({
                title: "Error!",
                text: `Error Please enter a valid stock value: ${add_stocks}`,
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    });

    add_stocks_price_btn.addEventListener("click", () => {
        const add_stocks_price = parseInt(document.getElementById("add_stocks_price").value, 10);
        console.log("add_stocks_price: " + add_stocks_price);

        if (add_stocks_price > 0) {
            dataContent.item_sellingPrice = add_stocks_price;
            price_value.innerHTML = `<p>₱${dataContent.item_sellingPrice}</p>`;
            updateItemInFirestore(dataContent);
        } else {
            Swal.fire({
                title: "Error!",
                text: `Error Please enter a valid price value: ${add_stocks_price}`,
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    });
}

function displayLogClickedContent(){
    const grams_weightValue = document.getElementById("grams_weightValue");
    const addedWeightInput = document.getElementById("added_weight");
    const grams_totalWeightValue = document.getElementById("grams_totalWeightValue");

    grams_weightValue.textContent = `${currentClickDataContent.item_currentWeight} G`;
    grams_totalWeightValue.textContent = `${currentClickDataContent.item_currentWeight} G`;

    addedWeightInput.addEventListener("input", () => {
        // Get the current total weight and the added weight
        const currentWeight = parseInt(grams_weightValue.textContent, 10) || 0;
        const addedWeight = parseInt(addedWeightInput.value, 10) || 0;

        // Update the total weight dynamically
        grams_totalWeightValue.textContent = currentWeight + addedWeight + " G";
    });

    const add_weight_btn = document.getElementById("add_weight_btn");
    add_weight_btn.addEventListener("click", () => {
        const currentWeight = parseInt(grams_totalWeightValue.textContent, 10) || 0;
        const itemCurrentWeight = parseInt(currentClickDataContent.item_currentWeight || 0, 10);

        console.log("Current Weight:", currentWeight);
        console.log("Item Current Weight:", itemCurrentWeight);
        console.log("Condition Check:", currentWeight !== itemCurrentWeight && currentWeight > 0);

        
        if (currentWeight != itemCurrentWeight && currentWeight > 0){
            currentClickDataContent.item_currentWeight = currentWeight;
            grams_weightValue.textContent = `${currentClickDataContent.item_currentWeight} G`;
            updateItemInFirestore(currentClickDataContent);
        }
    });
}

async function updateItemInFirestore(dataContent) {
    try {
        const docRef = doc(fdb, "inventory", dataContent.item_id);
        await updateDoc(docRef, {
            item_quantity: dataContent.item_quantity,
            item_sellingPrice: dataContent.item_sellingPrice,
            item_currentWeight: dataContent.item_currentWeight,
        });
        console.log("Inventory updated successfully.");
        updateInventoryValues();
    } catch (error) {
        console.error("Error updating inventory: ", error);
        Swal.fire({
            title: "Error!",
            text: `Error updating inventory: ${error.message}`,
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