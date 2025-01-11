import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    fdb,
    getDoc,
    doc,
    collection,
    addDoc,
    updateDoc,
} from "./firebaseConfig.js";

import { connectToBluetoothPrinter, updateStatus, currentDevice, printCharacteristic,reconnectAutomatically } from './bluetooth.js';

document.addEventListener("DOMContentLoaded", function () {
    const logout = document.getElementById("logout");
    const back_btn1 = document.getElementById("back_btn1");
    const back_btn2 = document.getElementById("back_btn2");
    logout.addEventListener("click", () => { logoutUser() });


    back_btn1.addEventListener("click", () => {window.location.href="/html/transaction.html"});
    back_btn2.addEventListener("click", () => {window.location.href="/html/transaction.html"});

    
    checkUserLoginStatus();

    reconnectAutomatically();
    
    retrieveOrderDetails();
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
                    console.log("role: " + role);

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
            auth.signOut();
            console.log("User not logged in.");
            window.location.href = '../html/login.html';
        }
    });
}

function retrieveOrderDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderDetailsString = urlParams.get("orderDetails");
    let orderDetails = null;

    if (orderDetailsString) {
        orderDetails = JSON.parse(decodeURIComponent(orderDetailsString));
        console.log("Retrieved orderDetails:", orderDetails);
    }

    // payment form
    const total = document.getElementById("total");
    const pvalue = document.getElementById("pvalue");
    const change1 = document.getElementById("change1");
    const pay_btn = document.getElementById("pay_btn");

    let totalPrice = orderDetails.order_totalPrice.toFixed(2);
    let currentChange = 0;
    let currentPaymentValue = 0;
    total.value = totalPrice;

    pvalue.addEventListener("input", () => {
        currentPaymentValue = document.getElementById("pvalue").value;
        currentChange = currentPaymentValue - totalPrice;
        change1.value = currentChange;
    });

    pay_btn.addEventListener("click", async () => {
        const payment_method = document.getElementById("payment_method");
        const paymentValue = parseFloat(currentPaymentValue);
        const priceValue = parseFloat(totalPrice);

        if (paymentValue >= priceValue) {
            const transactionCollection = collection(fdb, "transactions");
            orderDetails.order_paymentChange = currentChange;
            orderDetails.order_paymentMethod = payment_method.value;
            orderDetails.order_paymentValue = paymentValue;

            // Get the current date and time
            const now = new Date();

            // Format the date as DD/MM/YYYY
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            orderDetails.order_dateOrdered = `${month}/${day}/${year}`;

            // Format the time as HH:mm:ss (24-hour format)
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            orderDetails.order_timeOrdered = `${hours}:${minutes}:${seconds}`;

            // Add the orderDetails to Firestore
            addDoc(transactionCollection, orderDetails)
                .then(async (docRef) => {
                    console.log("Transaction added with ID:", docRef.id);
                    // update the number of items in the inventory
                    // 1. get the item in the inventory 
                    // 2. update the 'item_quantity' inventory field by inventoryItem.item_quantity -= orderDetails.order_quantity
                    // 3. save the current value of the inventory item quantity
                    try {
                        // Reference to the inventory item document
                        const inventoryDocRef = doc(fdb, 'inventory', orderDetails.order_itemID);
                        
                        // Get the current item details
                        const inventoryDocSnapshot = await getDoc(inventoryDocRef);
                        
                        if (inventoryDocSnapshot.exists()) {
                            // Get the current item quantity
                            const currentData = inventoryDocSnapshot.data();
                            const currentQuantity = currentData.item_quantity;
                
                            // Check if sufficient inventory is available
                            if (currentQuantity >= orderDetails.order_quantity) {
                                // Update the item quantity
                                const updatedQuantity = currentQuantity - orderDetails.order_quantity;
                
                                // Save the updated quantity
                                await updateDoc(inventoryDocRef, { item_quantity: updatedQuantity });
                                console.log(`Inventory updated successfully. New quantity: ${updatedQuantity}`);

                                // Show success modal
                                showSuccessModal(orderDetails, docRef.id);
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
        }
        console.log("orderDetails:", orderDetails);
    });
}

function showSuccessModal(orderDetails, id) {
    const payment_container = document.getElementById("payment_container");
    const payment_modal = document.getElementById("payment_modal");
    const print_receipt = document.getElementById("print_receipt");

    payment_container.style.display = 'none';
    payment_modal.style.display = 'flex';

    print_receipt.addEventListener("click", async () => {
        // Check if Bluetooth device is connected
        if (currentDevice) {
            printReceiptViaBluetooth(orderDetails, id);
        } else {
            console.error("No Bluetooth device connected.");
            alert("Please connect to a Bluetooth printer first.");
        }
        // if (!device.gatt.connected) {
        //     await device.gatt.connect();
        // }
    });
}

async function printReceiptViaBluetooth(orderDetails, id) {
    if (!printCharacteristic) {
        console.error("No writable Bluetooth characteristic available.");
        updateStatus("No printer connected.");
        return;
    }

    // Check if the characteristic is writable
    if (!printCharacteristic.writeValue) {
        console.error("Characteristic does not support write operations.");
        updateStatus("Printer doesn't support write operations.");
        return;
    }

    // Continue with printing if the characteristic is valid

    const receiptData = buildReceiptData(orderDetails, id);
    const printData = new Uint8Array([0x1B, 0x40, 0x1B, 0x61, 0x01, ...new TextEncoder().encode(receiptData), 0x0A]);

    try {
        await printCharacteristic.writeValue(printData);
        console.log('Receipt sent to printer.');
        updateStatus('Printing receipt...');
        setTimeout(() => {
            updateStatus('Ready to print');
        }, 2000);
    } catch (error) {
        console.error('Error printing receipt:', error);
        updateStatus(`Failed to print: ${error.message}`);
    }
}
function buildReceiptData(orderDetails, id) {
    let receiptData = "Receipt\n";
    receiptData += `Order ID: ${id}\n\n`;  // Added space after Order ID
    receiptData += "Order Details:\n";

    let totalPrice = 0; // To calculate the total price

    // Loop through order items and calculate total
    orderDetails.order_list.forEach((item, index) => {
        receiptData += `${index + 1}. ${item.currentWeight}g - P${item.currentTotalPrice}\n`;
        totalPrice += item.currentTotalPrice; // Sum up the total price
    });

    receiptData += `\nTotal Price: P${totalPrice}\n\n`;  // Added space after Order Details

    // Calculate balance
    const cash = orderDetails.order_paymentValue;
    const balance = totalPrice - cash;

    receiptData += `Cash: P${cash}\n`;
    receiptData += `Payment Method: ${orderDetails.order_paymentMethod}\n`;


    // Add the balance (remaining amount) to the receipt
    if (balance > 0) {
        receiptData += `Balance: P${balance}\n\n\n`; // Customer owes this amount
    } else if (balance < 0) {
        receiptData += `Change: P${Math.abs(balance)}\n\n\n`; // Customer gets this amount as change
    } else {
        receiptData += "Exact payment received. No balance.\n\n\n"; // No remaining balance
    }
    receiptData += `Date: ${orderDetails.order_dateOrdered}\n\n\n`;


    receiptData += `Time: ${orderDetails.order_timeOrdered}\n\n\n`;  // Added space before Balance/Change


    return receiptData;
}
function logoutUser() {
    auth.signOut()
        .then(() => {
            console.log('User logged out successfully');
            window.location.href = '../html/login.html';
        })
        .catch((error) => {
            console.error('Error logging out:', error);
        });
}

document.getElementById('connect_btn').addEventListener('click', connectToBluetoothPrinter);

document.addEventListener("DOMContentLoaded", function () {
    // Check if there is a saved Bluetooth device in localStorage
    const storedDevice = localStorage.getItem('bluetoothDevice');
    if (storedDevice) {
        const deviceInfo = JSON.parse(storedDevice);
        // reconnectToBluetoothDevice(deviceInfo);
        reconnectAutomatically();
    }
    // Continue with your other initializations
});