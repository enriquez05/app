import {
    auth,
    onAuthStateChanged,
    fdb,
    getDoc,
    getDocs,
    doc,
    collection,
    updateDoc,
    addDoc,
    query,
    orderBy,
    deleteDoc,
} from "./firebaseConfig.js";

let currentClickDataContent = null;

document.addEventListener("DOMContentLoaded", function() {
    const logout = document.getElementById("logout");
    const current_date = document.getElementById("current_date");
    
    logout.addEventListener("click", () => {logoutUser()});
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    current_date.textContent = `DATE: ${month}/${day}/${year}`;
    
    checkUserLoginStatus();
    updateInventoryValues();
    //setEventListeners();
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
    console.trace("setEventListeners is initialized.");
    const item_stocks = document.getElementById("item_stocks");
    const popup1 = document.getElementById("popup1");
    const log_addition_btn = document.getElementById("log_addition_btn");
    const popup2 = document.getElementById("popup2");
    const toppings = document.querySelectorAll(".item1");
    const cup2 = document.querySelectorAll(".cup2");
    const back_btn1 = document.getElementById("back_btn1");
    const back_btn2 = document.getElementById("back_btn2");
    const back_btn3 = document.getElementById("back_btn3");
    const add_item_button = document.getElementById("add_item_button");
    const addItemPopup = document.getElementById("addItemPopup");

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

    log_addition_btn.addEventListener("click", (event) => {
        event.stopPropagation();
        popup1.style.display = "none";
        popup2.style.display = "flex";
        displayLogClickedContent();
    });

    back_btn2.addEventListener("click", () => {
        popup1.style.display = "flex";
        popup2.style.display = "none";
    });

    back_btn3.addEventListener("click", () => {
        item_stocks.style.display = "flex";
        addItemPopup.style.display = "none";
        currentClickDataContent = null;
    });

    cup2.forEach((topping) => {
        topping.addEventListener("click", () => {
            // display cups
            item_stocks.style.display = "none";
            log_addition_btn.style.display = "none";
            popup1.style.display = "flex";
            
            // Parse the data-content attribute of the clicked element
            const dataContent = JSON.parse(topping.getAttribute("data-content").replace(/&quot;/g, '"'));
            console.log("dataContent: "+dataContent);
            currentClickDataContent = dataContent;
            displayClickedContent(dataContent);
        });
    });

    add_item_button.addEventListener("click", () => {
        item_stocks.style.display = "none";
        addItemPopup.style.display = "flex";
        displayAddItemForm();
    });
}

async function updateInventoryValues(){
    console.trace("updateInventoryValues is called.");
    const inventory_item_container = document.getElementById("inventory_item_container");
    inventory_item_container.innerHTML = "";

    try {
        // Query all documents in the inventory collection
        const inventoryCollection = collection(fdb, "inventory");
        const inventoryQuery = query(inventoryCollection, orderBy("item_name"));
        const inventorySnapshot = await getDocs(inventoryQuery);

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
                            <p>${data.item_quantity + " g" || "N/A"} </p>
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
                                <p>${data.item_quantity + " pcs" || "N/A"}</p>
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
    const rename_popup = document.getElementById("rename_popup");
    const overlay = document.getElementById("overlay");
    const rename_product = document.getElementById("rename_product");
    const cancel_btn = document.getElementById("cancel_btn");
    const confirm_btn = document.getElementById("confirm_btn");
    const delete_item_btn1 = document.getElementById("delete_item_btn1");

    popup1_name.innerHTML = `<p>${dataContent.item_name}</p>`;
    stocks_value.innerHTML = `<p>${dataContent.item_quantity} g</p>`;
    price_value.innerHTML = `<p>₱${dataContent.item_sellingPrice}</p>`;

    console.log("dataContent.item_id: "+dataContent.item_id);

    if(dataContent.item_id != "hTh5A6r3FEvnRBIDtROo"){
        // Remove any existing click listeners to prevent duplicates
        const popup1ClickListener = () => {
            rename_popup.style.display = "flex";
            overlay.style.display = "flex";
            rename_product.value = dataContent.item_name;
        };
        popup1_name.removeEventListener("click", popup1ClickListener);
        popup1_name.addEventListener("click", popup1ClickListener);
    }
    
    const addStocksListener = () => {
        const add_stocks = parseInt(document.getElementById("add_stocks").value, 10);
        if (add_stocks > 0) {
            dataContent.item_quantity = parseInt(dataContent.item_quantity, 10) + add_stocks;
            stocks_value.innerHTML = `<p>${dataContent.item_quantity} PCS</p>`;
            document.getElementById("add_stocks").value = "";
            updateItemInFirestore(dataContent, 1);
        } else {
            Swal.fire({
                title: "Error!",
                text: `Please enter a valid stock value: ${add_stocks}`,
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    };
    add_stocks_btn.replaceWith(add_stocks_btn.cloneNode(true));
    document.getElementById("add_stocks_btn").addEventListener("click", addStocksListener);

    const addStocksPriceListener = () => {
        const add_stocks_price = parseInt(document.getElementById("add_stocks_price").value, 10);
        if (add_stocks_price > 0) {
            dataContent.item_sellingPrice = add_stocks_price;
            price_value.innerHTML = `<p>₱${dataContent.item_sellingPrice}</p>`;
            document.getElementById("add_stocks_price").value = "";
            updateItemInFirestore(dataContent, 1);
        } else {
            Swal.fire({
                title: "Error!",
                text: `Please enter a valid price value: ${add_stocks_price}`,
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    };
    add_stocks_price_btn.replaceWith(add_stocks_price_btn.cloneNode(true));
    document.getElementById("add_stocks_price_btn").addEventListener("click", addStocksPriceListener);

    const renameConfirmListener = () => {
        const currentProductName = rename_product.value;
        if (currentProductName.trim() !== "") {
            dataContent.item_name = currentProductName;
            popup1_name.innerHTML = `<p>${dataContent.item_name}</p>`;
            updateItemInFirestore(dataContent, 1);
            rename_popup.style.display = "none";
            overlay.style.display = "none";
        } else {
            Swal.fire({
                title: "Error!",
                text: "Please enter a valid name.",
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    };
    confirm_btn.replaceWith(confirm_btn.cloneNode(true));
    document.getElementById("confirm_btn").addEventListener("click", renameConfirmListener);

    const cancelListener = () => {
        rename_popup.style.display = "none";
        overlay.style.display = "none";
    };
    cancel_btn.replaceWith(cancel_btn.cloneNode(true));
    document.getElementById("cancel_btn").addEventListener("click", cancelListener);

    const removeListener = async () => {
        try {
            // Reference to the specific item document
            const removeItemReference = doc(fdb, "inventory", dataContent.item_id);
    
            // Delete the document
            await deleteDoc(removeItemReference);
    
            console.log(`Item with ID ${dataContent.item_id} successfully removed from the inventory.`);
    
            // Optionally, show a success message or update the UI
            Swal.fire({
                title: 'Item Removed!',
                text: `The item ${dataContent.item_name} has been removed successfully.`,
                icon: 'success',
                confirmButtonText: 'OK',
            }).then((result) => {
                if (result.isConfirmed) {
                    updateInventoryValues();
                    location.reload();
                }
            });
        } catch (error) {
            console.error("Error removing item:", error);
            Swal.fire({
                title: 'Error!',
                text: `Failed to remove item: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'OK',
            });
        }
    };
    delete_item_btn1.replaceWith(delete_item_btn1.cloneNode(true));
    document.getElementById("delete_item_btn1").addEventListener("click", removeListener);
}

function displayLogClickedContent(){
    const grams_weightValue = document.getElementById("grams_weightValue");
    const addedWeightInput = document.getElementById("added_weight");
    const grams_totalWeightValue = document.getElementById("grams_totalWeightValue");

    grams_weightValue.placeholder = `${currentClickDataContent.item_currentWeight} G`;
    grams_weightValue.value = `${currentClickDataContent.item_currentWeight}`;
    grams_totalWeightValue.placeholder = `${currentClickDataContent.item_currentWeight} G`;

    grams_totalWeightValue.addEventListener("input", () => {
        // Get the current total weight and the added weight
        const currentWeight = parseInt(grams_weightValue.value, 10) || 0;
        const totalWeight = parseInt(grams_totalWeightValue.value, 10) || 0;

        // Update the total weight dynamically
        addedWeightInput.value = totalWeight - currentWeight;
    });

    const add_weight_btn = document.getElementById("add_weight_btn");
    console.trace("Adding event listener to add_weight_btn");
    add_weight_btn.addEventListener("click", (event) => {
        event.stopPropagation(); 
        const currentWeight = parseInt(grams_weightValue.value, 10) || 0;
        const totalWeightValue = parseInt(grams_totalWeightValue.value || 0, 10);

        console.log("Current Weight:", currentWeight);
        console.log("totalWeightValue:", totalWeightValue);
        
        if (currentWeight > 0){
            if (totalWeightValue >= currentWeight){
                currentClickDataContent.item_currentWeight = totalWeightValue;
                grams_weightValue.placeholder = `${currentClickDataContent.item_currentWeight} G`;
                grams_weightValue.value = `${currentClickDataContent.item_currentWeight}`;
                updateItemInFirestore(currentClickDataContent, 2);
            } else {
                Swal.fire({
                    title: 'Error',
                    text: `Invalid value of total weight.`,
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            }
        } else {
            Swal.fire({
                title: 'Error',
                text: `Invalid value of current weight.`,
                icon: 'error',
                confirmButtonText: 'OK',
            });
        }
    });
}

async function updateItemInFirestore(dataContent, flag) {
    try {
        if (flag === 2){
            // setup inventory sales
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();

            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            let currentWeight = dataContent.item_currentWeight;
            let currentTotalPrice = (currentWeight * dataContent.item_sellingPrice);

            let orderDetails = {
                order_list: [],
                order_itemType: 'TOPPINGS',
                order_dateOrdered: `${month}/${day}/${year}`,
                order_itemID: dataContent.item_id,
                order_itemName: dataContent.item_name,
                order_paymentChange: 0,
                order_paymentMethod: 'inventory',
                order_paymentValue: 0,
                order_quantity: 1,
                order_timeOrdered: `${hours}:${minutes}:${seconds}`,
                order_totalPrice: parseInt(currentTotalPrice),
                order_weight: document.getElementById("added_weight").value,
            };

            const transactionCollection = collection(fdb, "transactions");
            await addDoc(transactionCollection, orderDetails)
                .then(async (docRef) => {
                    console.log("Transaction added with ID:", docRef.id);
                    // updae the total quantity of the current item purchased
                    try {
                        // Reference to the inventory item document
                        const inventoryDocRef = doc(fdb, 'inventory', orderDetails.order_itemID);
                        
                        // Get the current item details
                        const inventoryDocSnapshot = await getDoc(inventoryDocRef);
                        
                        if (inventoryDocSnapshot.exists()) {
                            // Get the current item quantity
                            const currentData = inventoryDocSnapshot.data();
                            const currentQuantity = currentData.item_quantity;
                            const addedWeightInput = document.getElementById("added_weight").value;
                            console.log("addedWeightInput: ",addedWeightInput);
                
                            // Check if sufficient inventory is available
                            if (currentQuantity >= addedWeightInput) {
                                // Update the item quantity
                                const updatedQuantity = currentQuantity - addedWeightInput;
                
                                // Save the updated quantity
                                await updateDoc(inventoryDocRef, { item_quantity: updatedQuantity });
                                console.log(`Inventory updated successfully. New quantity: ${updatedQuantity}`);

                                Swal.fire({
                                    title: 'Success!',
                                    text: `Item added to the inventory sales.`,
                                    icon: 'success',
                                    confirmButtonText: 'OK',
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        updateInventoryValues();
                                        location.reload();
                                    }
                                });
                            } else {
                                console.error('Not enough inventory to fulfill the order.');
                            }
                        } else {
                            console.error('Inventory item does not exist.');
                        }
                    } catch (error) {
                        console.error('Error updating inventory:', error);
                    }
                })
                .catch((error) => {
                    Swal.fire({
                        title: 'Error!',
                        text: `Error adding transaction: ${error}`,
                        icon: 'error',
                        confirmButtonText: 'OK',
                    }).then((result) => {
                        if (result.isConfirmed) {
                            console.error("Error adding transaction:", error);
                        }
                    });
                });
        } else {
            try {
                const docRef = doc(fdb, "inventory", dataContent.item_id);
                await updateDoc(docRef, {
                    item_name: dataContent.item_name,
                    item_quantity: dataContent.item_quantity,
                    item_sellingPrice: dataContent.item_sellingPrice,
                    item_currentWeight: dataContent.item_currentWeight,
                });
                Swal.fire({
                    title: 'Success!',
                    text: `Item updated to the inventory.`,
                    icon: 'success',
                    confirmButtonText: 'OK',
                }).then((result) => {
                    if (result.isConfirmed) {
                        console.log("Inventory updated successfully.");
                        updateInventoryValues();
                    }
                });
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

function displayAddItemForm(){
    const add_new_item_button = document.getElementById("add_new_item_button");
    
    add_new_item_button.addEventListener("click", async () => {
        const add_item_name_value = document.getElementById("add_item_name_value").value;
        const add_item_quantity_value = document.getElementById("add_item_quantity_value").value;
        const add_item_sellingPrice_value = document.getElementById("add_item_sellingPrice_value").value;
        // const add_item_currentWeight_value = document.getElementById("add_item_currentWeight_value").value;
        let errorMessage = "";

        if (add_item_name_value.length === 0) {
            errorMessage += "Please input a valid item name.\n";
        }else if (add_item_quantity_value <= 0 || isNaN(add_item_quantity_value)) {
            errorMessage += "Please input a valid item quantity.\n";
        }else if (add_item_sellingPrice_value <= 0 || isNaN(add_item_sellingPrice_value)) {
            errorMessage += "Please input a valid item selling price.\n";
        }
        // else if (add_item_currentWeight_value <= 0 || isNaN(add_item_currentWeight_value)) {
        //     errorMessage += "Please input a valid item current weight.\n";
        // }
    
        // If there's an error, show a Swal alert
        if (errorMessage) {
            Swal.fire({
                title: 'Error!',
                text: `${errorMessage}`,
                icon: 'error',
                confirmButtonText: 'OK',
            }).then((result) => {
                if (result.isConfirmed) {
                    console.error("Error adding transaction:", errorMessage);
                }
            });
        } else {
            const itemDetails = {
                item_currentWeight: 0,
                item_id: "",
                item_name: add_item_name_value,
                item_purchaseCount: 0,
                item_quantity: add_item_quantity_value,
                item_sellingPrice: add_item_sellingPrice_value,
                item_totalSales: 0,
                item_type: "TOPPINGS",
            }

            try {
                // Reference to the inventory collection
                const inventoryReference = collection(fdb, "inventory");
        
                // Add the itemDetails to the Firestore collection
                const docRef = await addDoc(inventoryReference, itemDetails);
        
                console.log("Item added to inventory with ID:", docRef.id);
        
                // Update the item_id field with the generated document ID
                const itemDocRef = doc(fdb, "inventory", docRef.id);
                await updateDoc(itemDocRef, { item_id: docRef.id });
        
                console.log("Item ID updated successfully.");
                Swal.fire({
                    title: 'Success!',
                    text: 'Item added to inventory successfully.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                }).then((result) => {
                    if (result.isConfirmed) {
                        updateInventoryValues();
                        location.reload();
                    }
                });
            } catch (error) {
                console.error("Error adding item to inventory:", error);
                Swal.fire({
                    title: 'Error!',
                    text: `Failed to add item to inventory: ${error.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            }
        }
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