import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    fdb,
    getDoc,
    doc,
    rdb,
    ref,
    set,
    onValue,
    child,
    get,
    push,
    update,
} from "./firebaseConfig.js";

import { connectToBluetoothPrinter, updateStatus, currentDevice, printCharacteristic,reconnectAutomatically } from './bluetooth.js';


document.addEventListener("DOMContentLoaded", function () {
    const logout = document.getElementById("logout");
    logout.addEventListener("click", () => { checkUserLoginStatus() });
    addEventListeners();
    addDataWeightListener();
    reconnectAutomatically();

});

function checkUserLoginStatus() {
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

function addEventListeners() {
    const weight_order = document.getElementById("weight_order");
    const price_order = document.getElementById("price_order");
    const add_order_btn = document.getElementById("add_order_btn");
    const added_items = document.getElementById("added_items");
    const subtotal_value = document.getElementById("subtotal_value");
    const add_discount_btn = document.getElementById("add_discount_btn");
    const add_vat_btn = document.getElementById("add_vat_btn");
    const total_price_value = document.getElementById("total_price_value");
    const goto_payment_btn = document.getElementById("goto_payment_btn");
    const finalize_sale_btn = document.getElementById("finalize_sale_btn");
    const pricePerGram = document.getElementById("price_per_gram");

    order_payment_container.innerHTML = '';
    let currentWeight = 0;
    let currentTotalPrice = 0;
    let subtotalPrice = 0;
    let finalTotalPrice = 0;
    let finalTotalWeight = 0;
    let totalOrdersCount = 0;
    let orderDetails = {
        order_list: [],
        order_itemType: 'UTENSILS',
        order_dateOrdered: '',
        order_itemID: 'hTh5A6r3FEvnRBIDtROo',
        order_itemName: 'Cups',
        order_paymentChange: 0,
        order_paymentMethod: '',
        order_paymentValue: 0,
        order_quantity: 0,
        order_timeOrdered: '',
        order_totalPrice: 0,
        order_weight: 0,
    };

    console.log("orderDetails: " + orderDetails);

    // set up and change data listener from firestore 
    // then compute the price when data changes 
    // then update the values
    weight_order.addEventListener("change", () => {
        const currentPricePerGram = document.getElementById("price_per_gram").value;
        currentWeight = parseFloat(weight_order.value);
        currentTotalPrice = (currentWeight * currentPricePerGram) / 100;
        price_order.value = currentTotalPrice.toFixed(2);
    });

    pricePerGram.addEventListener("change", () => {
        const currentPricePerGram = document.getElementById("price_per_gram").value;
        currentWeight = parseFloat(weight_order.value);
        currentTotalPrice = (currentWeight * currentPricePerGram) / 100;
        price_order.value = currentTotalPrice.toFixed(2);
    });

    add_order_btn.addEventListener("click", () => {
        if (currentTotalPrice > 0) {
            const uniqueId = Date.now();
            const itemDiv = document.createElement("div");
            itemDiv.classList.add(`orders_payment`);
            itemDiv.dataset.id = uniqueId;
            subtotalPrice += currentTotalPrice;
            finalTotalPrice += currentTotalPrice;
            finalTotalWeight += currentWeight;

            itemDiv.innerHTML = `
                <div class="orders">
                    <p>1 Cup</p>
                </div>
                <div class="grams">
                    <p>${currentWeight}g</p>
                </div>
                <div class="price">
                    <p>₱${currentTotalPrice.toFixed(2)}</p>
                </div>
                <div class="remove-item">
                    <p>x</p>
                </div>
            `;
            order_payment_container.appendChild(itemDiv);

            orderDetails.order_list.push({
                id: uniqueId,
                currentWeight: currentWeight,
                currentTotalPrice: currentTotalPrice
            });
            console.log("orderDetails:", orderDetails);
        }

        totalOrdersCount = document.querySelectorAll(".orders_payment").length;
        added_items.textContent = `${totalOrdersCount} items`;
        subtotal_value.textContent = `Subtotal: ₱${subtotalPrice.toFixed(2)}`;
        total_price_value.textContent = `₱${finalTotalPrice.toFixed(2)}`;
    });

    // Event Delegation for Removing Items
    order_payment_container.addEventListener("click", (event) => {
        if (event.target.closest(".remove-item")) {
            const itemToRemove = event.target.closest(".orders_payment");
            const itemPrice = event.target.closest(".orders_payment").querySelector(".price p").textContent;
            const itemGrams = event.target.closest(".orders_payment").querySelector(".grams p").textContent;
            console.log("itemPrice: " + itemPrice);
            console.log("itemGrams: " + itemGrams);

            const itemPriceNumber = parseFloat(itemPrice.replace(/[^\d.]/g, ''));
            const itemGramsValue = parseFloat(itemGrams.replace(/[^\d.]/g, ''));
            console.log("itemPrice (number): " + itemPriceNumber);
            console.log("itemGramsValue (number): " + itemGramsValue);

            subtotalPrice -= itemPriceNumber;
            finalTotalPrice -= itemPriceNumber;
            finalTotalWeight -= itemGramsValue;
            subtotal_value.textContent = `Subtotal: ₱${subtotalPrice.toFixed(2)}`;
            total_price_value.textContent = `₱${finalTotalPrice.toFixed(2)}`;

            const itemId = parseInt(itemToRemove.dataset.id);
            orderDetails.order_list = orderDetails.order_list.filter(order => order.id !== itemId);

            itemToRemove.remove();
            console.log("orderDetails:", orderDetails);

            // Update total orders count
            totalOrdersCount = document.querySelectorAll(".orders_payment").length;
            added_items.textContent = `${totalOrdersCount} items`;
        }

        if (event.target.closest(".remove-item-d")) {
            const itemToRemove = event.target.closest(".discount-offer");
            const itemPrice = event.target.closest(".discount-offer").querySelector(".price p").textContent;
            console.log("itemPrice: " + itemPrice);

            const itemPriceNumber = parseFloat(itemPrice.replace(/[^\d.]/g, ''));
            console.log("itemPrice (number): " + itemPriceNumber);

            finalTotalPrice += itemPriceNumber;
            total_price_value.textContent = `₱${finalTotalPrice.toFixed(2)}`;

            itemToRemove.remove();
        }
    });

    // adding discount
    add_discount_btn.addEventListener("click", () => {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add(`discount-offer`);
        let totalDiscount = subtotalPrice * 0.02;
        finalTotalPrice -= totalDiscount;

        itemDiv.innerHTML = `
            <div class="orders">
                <p><i>Discount</i></p>
            </div>
            <div class="grams">
                <p></p>
            </div>
            <div class="price">
                <p>₱${totalDiscount.toFixed(2)}</p>
            </div>
            <div class="remove-item-d">
                <p>x</p>
            </div>
        `;
        order_payment_container.appendChild(itemDiv);

        total_price_value.textContent = `₱${finalTotalPrice.toFixed(2)}`;
    });

    goto_payment_btn.addEventListener("click", () => {
        orderDetails.order_totalPrice = finalTotalPrice;
        orderDetails.order_weight = finalTotalWeight;
        orderDetails.order_quantity = totalOrdersCount;
        const serializedOrderDetails = encodeURIComponent(JSON.stringify(orderDetails));
        window.location.href = `../html/transaction_payment.html?orderDetails=${serializedOrderDetails}`;
    });

    finalize_sale_btn.addEventListener("click", () => {
        window.location.href = '../html/daily_sales_report.html';
    });
}

async function addDataWeightListener() {
    const weight_order = document.getElementById("weight_order");

    const starCountRef = ref(rdb, 'sensorval/currentweight');
    onValue(starCountRef, (snapshot) => {
        const data = snapshot.val();
        weight_order.value = data;
        weight_order.dispatchEvent(new Event('change'));
    });
}



document.getElementById('bluetooth').addEventListener('click', connectToBluetoothPrinter);

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