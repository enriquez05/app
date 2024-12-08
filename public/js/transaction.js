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
    addEventListeners();
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

function addEventListeners(){
    const weight_order = document.getElementById("weight_order");
    const price_order = document.getElementById("price_order");
    const add_order_btn = document.getElementById("add_order_btn");
    const added_items = document.getElementById("added_items");
    const subtotal_value = document.getElementById("subtotal_value");
    const add_discount_btn = document.getElementById("add_discount_btn");
    const add_vat_btn = document.getElementById("add_vat_btn");
    const total_price_value = document.getElementById("total_price_value");
    
    order_payment_container.innerHTML = '';
    let currentWeight = 0;
    let currentTotalPrice = 0;
    let subtotalPrice = 0;
    let finalTotalPrice = 0;

    // set up and change data listener from firestore 
    // then compute the price when data changes 
    // then update the values
    weight_order.addEventListener("change", () => {
        currentWeight = parseFloat(weight_order.value); 
        currentTotalPrice = (currentWeight * 35) / 100;
        price_order.value = currentTotalPrice.toFixed(2);
    });

    add_order_btn.addEventListener("click", () => {
        if(currentTotalPrice > 0){
            const itemDiv = document.createElement("div");
            itemDiv.classList.add(`orders_payment`);
            subtotalPrice += currentTotalPrice;
            finalTotalPrice = subtotalPrice;
    
            itemDiv.innerHTML = `
                <div class="orders">
                    <p>1 Cup</p>
                </div>
                <div class="grams">
                    <p>${currentWeight}g</p>
                </div>
                <div class="price">
                    <p>₱${currentTotalPrice}</p>
                </div>
                <div class="remove-item">
                    <p>x</p>
                </div>
            `;
            order_payment_container.appendChild(itemDiv);
        }
        
        const totalOrdersCount = document.querySelectorAll(".orders_payment").length;
        added_items.textContent = `${totalOrdersCount} items`;
        subtotal_value.textContent = `Subtotal: ₱${subtotalPrice}`;
        total_price_value.textContent = `₱${finalTotalPrice}`;
    });

    // Event Delegation for Removing Items
    order_payment_container.addEventListener("click", (event) => {
        if (event.target.closest(".remove-item")) {
            const itemToRemove = event.target.closest(".orders_payment");
            const itemPrice = event.target.closest(".orders_payment").querySelector(".price p").textContent;
            console.log("itemPrice: "+itemPrice);
            
            const itemPriceNumber = parseFloat(itemPrice.replace(/[^\d.]/g, ''));
            console.log("itemPrice (number): " + itemPriceNumber);

            subtotalPrice -= itemPriceNumber;
            finalTotalPrice = subtotalPrice;
            subtotal_value.textContent = `Subtotal: ₱${subtotalPrice}`;
            total_price_value.textContent = `₱${finalTotalPrice}`;

            itemToRemove.remove();

            // Update total orders count
            const totalOrdersCount = document.querySelectorAll(".orders_payment").length;
            added_items.textContent = `${totalOrdersCount} items`;
        }
    });

    // adding discount
    add_discount_btn.addEventListener("click", () => {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add(`discount-offer`);
        let totalDiscount = subtotalPrice * 0.02;

        itemDiv.innerHTML = `
            <div class="orders">
                <p><i>Discount</i></p>
            </div>
            <div class="grams">
                <p></p>
            </div>
            <div class="price">
                <p>₱${totalDiscount}</p>
            </div>
            <div class="remove-item">
                <p>x</p>
            </div>
        `;
        order_payment_container.appendChild(itemDiv);
    });
}