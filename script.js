// =======================================
// ShopBangla JavaScript
// =======================================

console.log("ShopBangla Loaded Successfully");

// ===============================
// Search Button
// ===============================

const searchBtn = document.querySelector(".search-box button");
const searchInput = document.querySelector(".search-box input");

if (searchBtn && searchInput) {

    searchBtn.addEventListener("click", function () {

        if (searchInput.value.trim() === "") {

            alert("Please enter a product name.");

        } else {

            alert("Searching for: " + searchInput.value);

        }

    });

}

// ===============================
// Hero Buttons
// ===============================

const shopBtn = document.querySelector(".btn");
const offerBtn = document.querySelector(".btn2");

if (shopBtn) {

    shopBtn.addEventListener("click", function (e) {

        e.preventDefault();

        alert("Welcome to ShopBangla!");

    });

}

if (offerBtn) {

    offerBtn.addEventListener("click", function (e) {

        e.preventDefault();

        alert("Today's Best Offers!");

    });

}// ===============================
// Product Buttons
// ===============================

const cartButtons = document.querySelectorAll(".product-card button");

cartButtons.forEach(function(button){

    button.addEventListener("click", function(){

        alert("Product Added To Cart!");

    });

});

// ===============================
// Wishlist Icon
// ===============================

const wishlistIcon = document.querySelector(".fa-heart");

if (wishlistIcon) {

    wishlistIcon.addEventListener("click", function () {

        window.location.href = "wishlist.html";

    });

}

// ===============================
// Cart Icon
// ===============================

const cartIcon = document.querySelector(".fa-shopping-cart");

if (cartIcon) {

    cartIcon.addEventListener("click", function () {

        window.location.href = "cart.html";

    });

}

// ===============================
// User Icon
// ===============================

const userIcon = document.querySelector(".fa-user");

if (userIcon) {

    userIcon.addEventListener("click", function () {

        window.location.href = "login.html";

    });

}// ===============================
// Cart Counter
// ===============================

let cartCount = localStorage.getItem("cartCount") || 0;

const cartCountElement = document.querySelector(".cart-count");

if (cartCountElement) {

    cartCountElement.textContent = cartCount;

}

// ===============================
// Add Product To Cart
// ===============================

cartButtons.forEach(function (