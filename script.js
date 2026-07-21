(() => {
    const searchForm = document.querySelector('.search-box');
    const searchInput = document.querySelector('.search-box input');
    const heroButtons = document.querySelectorAll('.hero .btn, .hero .btn2');
    const wishlistLinks = document.querySelectorAll('a[href="wishlist.html"]');
    const cartLinks = document.querySelectorAll('a[href="cart.html"]');
    const userLinks = document.querySelectorAll('a[href="login.html"]');
    const cartContainer = document.querySelector('.cart-container');
    const checkoutForm = document.querySelector('.form-card');
    const productGrid = document.querySelector('#product-grid');
    const categoryFilter = document.querySelector('#category-filter');
    const priceFilter = document.querySelector('#price-filter');
    const sortFilter = document.querySelector('#sort-filter');
    const productSearch = document.querySelector('#product-search');
    const resultsCount = document.querySelector('#results-count');
    const toastContainer = document.createElement('div');
    const backToTopButton = document.createElement('button');

    toastContainer.className = 'toast-container';
    backToTopButton.className = 'back-to-top';
    backToTopButton.type = 'button';
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(toastContainer);
    document.body.appendChild(backToTopButton);

    const getCartItems = () => JSON.parse(localStorage.getItem('cartItems') || '[]');
    const saveCartItems = (items) => localStorage.setItem('cartItems', JSON.stringify(items));

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    };

    const updateCartCount = () => {
        const items = getCartItems();
        const count = items.reduce((total, item) => total + item.quantity, 0);
        const badge = document.querySelector('.cart-count');
        if (badge) {
            badge.textContent = count;
        }
        return count;
    };

    const createCartBadge = () => {
        const cartLink = document.querySelector('.header-icons a[href="cart.html"]');
        if (!cartLink) {
            return;
        }

        if (!document.querySelector('.cart-count')) {
            const badge = document.createElement('span');
            badge.className = 'cart-count';
            badge.textContent = '0';
            cartLink.appendChild(badge);
        }
    };

    const addToCart = (product, quantity = 1) => {
        const items = getCartItems();
        const existing = items.find((item) => item.id === product.id);
        if (existing) {
            existing.quantity += quantity;
        } else {
            items.push({ ...product, quantity });
        }
        saveCartItems(items);
        updateCartCount();
        showToast(`${product.name} added to cart.`);
    };

    const readProduct = (element) => {
        const card = element.closest('.product-card');
        if (!card) {
            return null;
        }

        const nameElement = card.querySelector('h3');
        const priceElement = card.querySelector('h4') || card.querySelector('p');
        const imageElement = card.querySelector('img');
        const name = nameElement ? nameElement.textContent.trim() : 'Product';
        const priceText = priceElement ? priceElement.textContent.replace(/[^\d]/g, '') : '0';
        const price = Number(priceText || 0);
        const image = imageElement ? imageElement.getAttribute('src') : 'images/placeholder.jpg';
        const id = card.getAttribute('data-id') || `${name}-${price}`;
        const category = card.getAttribute('data-category') || 'general';

        return { id, name, price, image, category };
    };

    const setupProductCards = () => {
        document.querySelectorAll('.product-card').forEach((card) => {
            const heading = card.querySelector('h3')?.textContent || '';
            const priceText = card.querySelector('h4')?.textContent || card.querySelector('p')?.textContent || '';
            const priceValue = Number(String(priceText).replace(/[^\d]/g, '') || 0);
            let category = 'general';
            const lowered = heading.toLowerCase();
            if (lowered.includes('mobile') || lowered.includes('iphone') || lowered.includes('galaxy')) {
                category = 'mobile';
            } else if (lowered.includes('laptop')) {
                category = 'laptop';
            } else if (lowered.includes('watch')) {
                category = 'watch';
            } else if (lowered.includes('shoe')) {
                category = 'shoe';
            } else if (lowered.includes('headphone')) {
                category = 'headphone';
            }
            card.setAttribute('data-category', category);
            card.setAttribute('data-price', String(priceValue));
            card.setAttribute('data-name', heading);
            card.setAttribute('data-id', heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        });
    };

    const renderCart = () => {
        if (!cartContainer) {
            return;
        }

        const items = getCartItems();
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shipping = subtotal > 0 ? 120 : 0;
        const total = subtotal + shipping;

        if (!items.length) {
            cartContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Your cart is empty</h3>
                    <p>Add a few products and they will appear here.</p>
                    <a href="products.html" class="btn">Continue shopping</a>
                </div>
            `;
            return;
        }

        cartContainer.innerHTML = `
            <div class="cart-list">
                ${items.map((item) => `
                    <article class="cart-item">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="cart-details">
                            <h3>${item.name}</h3>
                            <p>Price: ${item.price.toLocaleString('en-BD')}৳</p>
                            <div class="qty-controls">
                                <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
                                <span>${item.quantity}</span>
                                <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
                                <button class="remove-item" data-id="${item.id}">Remove</button>
                            </div>
                        </div>
                        <h3>${(item.price * item.quantity).toLocaleString('en-BD')}৳</h3>
                    </article>
                `).join('')}
            </div>
            <aside class="cart-summary">
                <h3>Order Summary</h3>
                <div class="summary-row"><span>Subtotal</span><strong>${subtotal.toLocaleString('en-BD')}৳</strong></div>
                <div class="summary-row"><span>Shipping</span><strong>${shipping.toLocaleString('en-BD')}৳</strong></div>
                <div class="summary-row"><span>Total</span><strong>${total.toLocaleString('en-BD')}৳</strong></div>
                <a href="checkout.html" class="btn">Proceed to Checkout</a>
            </aside>
        `;
    };

    const applyFilters = () => {
        if (!productGrid) {
            return;
        }

        const cards = Array.from(productGrid.querySelectorAll('.product-card'));
        const searchTerm = productSearch ? productSearch.value.trim().toLowerCase() : '';
        const categoryValue = categoryFilter ? categoryFilter.value : 'all';
        const priceValue = priceFilter ? priceFilter.value : 'all';
        const sortValue = sortFilter ? sortFilter.value : 'featured';

        let visibleCards = cards.filter((card) => {
            const name = (card.getAttribute('data-name') || '').toLowerCase();
            const category = card.getAttribute('data-category') || 'general';
            const price = Number(card.getAttribute('data-price') || 0);
            const matchesSearch = !searchTerm || name.includes(searchTerm);
            const matchesCategory = categoryValue === 'all' || category === categoryValue;
            let matchesPrice = true;
            if (priceValue === 'low') {
                matchesPrice = price < 10000;
            } else if (priceValue === 'mid') {
                matchesPrice = price >= 10000 && price <= 50000;
            } else if (priceValue === 'high') {
                matchesPrice = price > 50000;
            }
            return matchesSearch && matchesCategory && matchesPrice;
        });

        visibleCards.sort((a, b) => {
            const priceA = Number(a.getAttribute('data-price') || 0);
            const priceB = Number(b.getAttribute('data-price') || 0);
            if (sortValue === 'price-low') {
                return priceA - priceB;
            }
            if (sortValue === 'price-high') {
                return priceB - priceA;
            }
            return 0;
        });

        if (resultsCount) {
            resultsCount.textContent = `Showing ${visibleCards.length} product${visibleCards.length === 1 ? '' : 's'}`;
        }

        if (!visibleCards.length) {
            productGrid.innerHTML = '<div class="empty-state"><h3>No products matched your filters</h3><p>Try a broader search or another category.</p></div>';
            return;
        }

        productGrid.replaceChildren(...visibleCards);
    };

    const handleHeaderNavigation = (event) => {
        const link = event.target.closest('a');
        if (!link) {
            return;
        }

        const href = link.getAttribute('href');
        if (href === 'wishlist.html' || href === 'cart.html' || href === 'login.html') {
            event.preventDefault();
            window.location.href = href;
        }
    };

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const term = searchInput.value.trim();
            if (!term) {
                showToast('Please enter a product name.', 'error');
                return;
            }
            window.location.href = `products.html?search=${encodeURIComponent(term)}`;
        });
    }

    heroButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'products.html';
        });
    });

    document.addEventListener('click', (event) => {
        const button = event.target.closest('.product-card button');
        if (button) {
            event.preventDefault();
            const product = readProduct(button);
            if (product) {
                addToCart(product);
            }
        }

        const wishlistButton = event.target.closest('.product-card a[href="cart.html"]');
        if (wishlistButton) {
            event.preventDefault();
            const product = readProduct(wishlistButton);
            if (product) {
                addToCart(product);
                window.location.href = 'cart.html';
            }
        }
    });

    wishlistLinks.forEach((link) => link.addEventListener('click', handleHeaderNavigation));
    cartLinks.forEach((link) => link.addEventListener('click', handleHeaderNavigation));
    userLinks.forEach((link) => link.addEventListener('click', handleHeaderNavigation));

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (event) => {
            event.preventDefault();
            localStorage.removeItem('cartItems');
            updateCartCount();
            showToast('Order placed successfully! Thank you for shopping with ShopBangla.');
            checkoutForm.reset();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1600);
        });
    }

    if (cartContainer) {
        cartContainer.addEventListener('click', (event) => {
            const button = event.target.closest('.qty-btn');
            const removeButton = event.target.closest('.remove-item');
            const items = getCartItems();
            if (button) {
                const targetId = button.getAttribute('data-id');
                const item = items.find((entry) => entry.id === targetId);
                if (!item) {
                    return;
                }
                if (button.getAttribute('data-action') === 'increase') {
                    item.quantity += 1;
                } else if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    const filtered = items.filter((entry) => entry.id !== targetId);
                    saveCartItems(filtered);
                    updateCartCount();
                    renderCart();
                    return;
                }
                saveCartItems(items);
                updateCartCount();
                renderCart();
            }
            if (removeButton) {
                const targetId = removeButton.getAttribute('data-id');
                const filtered = items.filter((entry) => entry.id !== targetId);
                saveCartItems(filtered);
                updateCartCount();
                renderCart();
            }
        });
    }

    if (productGrid) {
        setupProductCards();
        const params = new URLSearchParams(window.location.search);
        const initialSearch = params.get('search');
        if (productSearch && initialSearch) {
            productSearch.value = initialSearch;
        }
        [categoryFilter, priceFilter, sortFilter, productSearch].forEach((element) => {
            if (element) {
                element.addEventListener('change', applyFilters);
                element.addEventListener('input', applyFilters);
            }
        });
        applyFilters();
    }

    createCartBadge();
    updateCartCount();
    if (cartContainer) {
        renderCart();
    }

    backToTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
        backToTopButton.classList.toggle('is-visible', window.scrollY > 400);
    });
})();

