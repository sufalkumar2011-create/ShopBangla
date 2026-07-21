(() => {
    const state = {
        firebase: null,
        auth: null,
        db: null,
        storage: null,
        user: null,
        products: [],
        categories: [],
        brands: [],
        cart: [],
        wishlist: [],
        compare: [],
        orders: [],
        profile: null
    };

    const searchForm = document.querySelector('.search-box');
    const searchInput = document.querySelector('.search-box input');
    const heroButtons = document.querySelectorAll('.hero .btn, .hero .btn2');
    const wishlistLinks = document.querySelectorAll('a[href="wishlist.html"]');
    const cartLinks = document.querySelectorAll('a[href="cart.html"]');
    const userLinks = document.querySelectorAll('a[href="login.html"]');
    const cartContainer = document.querySelector('.cart-container');
    const checkoutForm = document.querySelector('.checkout-form');
    const productGrid = document.querySelector('#product-grid');
    const categoryFilter = document.querySelector('#category-filter');
    const priceFilter = document.querySelector('#price-filter');
    const sortFilter = document.querySelector('#sort-filter');
    const productSearch = document.querySelector('#product-search');
    const resultsCount = document.querySelector('#results-count');
    const header = document.querySelector('.site-header');
    const menuToggle = document.querySelector('.menu-toggle');
    const siteNav = document.querySelector('.site-nav');
    const toastContainer = document.createElement('div');
    const backToTopButton = document.createElement('button');
    const chatWidget = document.createElement('div');

    toastContainer.className = 'toast-container';
    backToTopButton.className = 'back-to-top';
    backToTopButton.type = 'button';
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(toastContainer);
    document.body.appendChild(backToTopButton);
    document.body.appendChild(chatWidget);

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    };

    const getStoredArray = (key, fallback = []) => {
        try {
            const data = JSON.parse(localStorage.getItem(key) || 'null');
            return Array.isArray(data) ? data : fallback;
        } catch (error) {
            return fallback;
        }
    };

    const saveStoredArray = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    const getCartItems = () => state.cart.length ? state.cart : getStoredArray('cartItems', []);
    const saveCartItems = (items) => {
        state.cart = items;
        saveStoredArray('cartItems', items);
        syncUserData();
        updateCartCount();
    };

    const getWishlistItems = () => state.wishlist.length ? state.wishlist : getStoredArray('wishlistItems', []);
    const saveWishlistItems = (items) => {
        state.wishlist = items;
        saveStoredArray('wishlistItems', items);
        syncUserData();
        updateWishlistCount();
    };

    const getCompareItems = () => state.compare.length ? state.compare : getStoredArray('compareItems', []);
    const saveCompareItems = (items) => {
        state.compare = items;
        saveStoredArray('compareItems', items);
        syncUserData();
        updateCompareCount();
    };

    const loadUserState = () => {
        state.cart = getStoredArray('cartItems', []);
        state.wishlist = getStoredArray('wishlistItems', []);
        state.compare = getStoredArray('compareItems', []);
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
        if (!cartLink || document.querySelector('.cart-count')) {
            return;
        }
        const badge = document.createElement('span');
        badge.className = 'cart-count';
        badge.textContent = '0';
        cartLink.appendChild(badge);
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
        const brand = card.getAttribute('data-brand') || 'ShopBangla';
        const stock = Number(card.getAttribute('data-stock') || 20);
        const discount = Number(card.getAttribute('data-discount') || 0);
        return { id, name, price, image, category, brand, stock, discount };
    };

    const createProductCard = (product) => {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.setAttribute('data-id', product.id);
        card.setAttribute('data-name', product.name);
        card.setAttribute('data-category', product.category || 'general');
        card.setAttribute('data-price', product.price || 0);
        card.setAttribute('data-brand', product.brand || 'ShopBangla');
        card.setAttribute('data-stock', product.stock || 0);
        card.setAttribute('data-discount', product.discount || 0);
        const badge = product.discount ? `<span class="product-badge">-${product.discount}%</span>` : '<span class="product-badge">Hot Deal</span>';
        const image = product.image || 'images/placeholder.jpg';
        const price = Number(product.price || 0).toLocaleString('en-BD');
        card.innerHTML = `
            ${badge}
            <img src="${image}" alt="${product.name}" loading="lazy">
            <h3>${product.name}</h3>
            <p>${product.description || product.category || 'Premium product'}</p>
            <h4>৳${price}</h4>
            <div class="card-actions">
                <button type="button">Add To Cart</button>
                <button class="icon-btn wishlist-toggle" type="button" aria-label="Save to wishlist"><i class="fas fa-heart"></i></button>
                <button class="icon-btn compare-toggle" type="button" aria-label="Compare product"><i class="fas fa-balance-scale"></i></button>
            </div>
        `;
        return card;
    };

    const renderProducts = () => {
        if (!productGrid) {
            return;
        }
        const term = (productSearch ? productSearch.value : '').trim().toLowerCase();
        const categoryValue = categoryFilter ? categoryFilter.value : 'all';
        const priceValue = priceFilter ? priceFilter.value : 'all';
        const sortValue = sortFilter ? sortFilter.value : 'featured';

        let filtered = state.products.filter((product) => {
            const name = (product.name || '').toLowerCase();
            const category = (product.category || 'general').toLowerCase();
            const price = Number(product.price || 0);
            const matchesSearch = !term || name.includes(term) || category.includes(term);
            const matchesCategory = categoryValue === 'all' || category === categoryValue;
            let matchesPrice = true;
            if (priceValue === 'low') matchesPrice = price < 10000;
            if (priceValue === 'mid') matchesPrice = price >= 10000 && price <= 50000;
            if (priceValue === 'high') matchesPrice = price > 50000;
            return matchesSearch && matchesCategory && matchesPrice;
        });

        filtered = filtered.sort((a, b) => {
            if (sortValue === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
            if (sortValue === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
            return 0;
        });

        if (resultsCount) resultsCount.textContent = `Showing ${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
        if (!filtered.length) {
            productGrid.innerHTML = '<div class="empty-state"><h3>No products matched your filters</h3><p>Try a broader search or another category.</p></div>';
            return;
        }

        productGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();
        filtered.forEach((product) => fragment.appendChild(createProductCard(product)));
        productGrid.appendChild(fragment);
    };

    const renderHomeSections = () => {
        const featuredContainers = document.querySelectorAll('.flash-sale .product-container, .featured .product-container');
        featuredContainers.forEach((container, index) => {
            const productsToShow = state.products.slice(index * 4, index * 4 + 4);
            if (!productsToShow.length) return;
            container.innerHTML = '';
            const fragment = document.createDocumentFragment();
            productsToShow.forEach((product) => fragment.appendChild(createProductCard(product)));
            container.appendChild(fragment);
        });
    };

    const renderCart = () => {
        if (!cartContainer) return;
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

    const renderWishlist = () => {
        const container = document.getElementById('wishlist-grid');
        if (!container) return;
        const items = getWishlistItems();
        if (!items.length) {
            container.innerHTML = '<div class="empty-state"><h3>Your wishlist is empty</h3><p>Save products you love and come back anytime.</p><a href="products.html" class="btn">Browse products</a></div>';
            return;
        }
        container.innerHTML = `
            <div class="product-container">
                ${items.map((item) => `
                    <article class="product-card" data-id="${item.id}" data-name="${item.name}" data-category="${item.category || 'general'}" data-price="${item.price}">
                        <span class="product-badge">Saved</span>
                        <img src="${item.image}" alt="${item.name}" loading="lazy">
                        <h3>${item.name}</h3>
                        <p>Ready to buy</p>
                        <h4>৳${item.price.toLocaleString('en-BD')}</h4>
                        <button type="button">Add To Cart</button>
                    </article>
                `).join('')}
            </div>
        `;
    };

    const renderCompare = () => {
        const container = document.getElementById('compare-grid');
        if (!container) return;
        const items = getCompareItems();
        if (!items.length) {
            container.innerHTML = '<div class="empty-state"><h3>No products selected for comparison</h3><p>Choose up to four products from the catalog to compare them side by side.</p><a href="products.html" class="btn">Explore products</a></div>';
            return;
        }
        const rows = [
            { label: 'Image', values: items.map((item) => `<img src="${item.image}" alt="${item.name}" style="width:90px; height:90px; object-fit:cover; border-radius:12px;">`) },
            { label: 'Price', values: items.map((item) => `৳${item.price.toLocaleString('en-BD')}`) },
            { label: 'Category', values: items.map((item) => item.category || 'general') },
            { label: 'Availability', values: items.map(() => 'In Stock') }
        ];
        container.innerHTML = `
            <div class="compare-card">
                <table class="compare-table">
                    <thead><tr><th>Feature</th>${items.map((item) => `<th>${item.name}</th>`).join('')}</tr></thead>
                    <tbody>${rows.map((row) => `<tr><td>${row.label}</td>${row.values.map((value) => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody>
                </table>
            </div>
        `;
    };

    const updateWishlistCount = () => {
        const count = getWishlistItems().length;
        const badge = document.querySelector('.wishlist-count');
        if (badge) badge.textContent = count;
    };

    const updateCompareCount = () => {
        const count = getCompareItems().length;
        const badge = document.querySelector('.compare-count');
        if (badge) badge.textContent = count;
    };

    const createWishlistBadge = () => {
        const wishlistLink = document.querySelector('.header-icons a[href="wishlist.html"]');
        if (!wishlistLink || document.querySelector('.wishlist-count')) return;
        const badge = document.createElement('span');
        badge.className = 'wishlist-count';
        badge.textContent = '0';
        wishlistLink.appendChild(badge);
    };

    const createUtilityLinks = () => {
        const headerIcons = document.querySelector('.header-icons');
        if (!headerIcons) return;
        if (!headerIcons.querySelector('a[href="compare.html"]')) {
            const compareLink = document.createElement('a');
            compareLink.href = 'compare.html';
            compareLink.setAttribute('aria-label', 'Compare products');
            compareLink.innerHTML = '<i class="fas fa-balance-scale"></i>';
            const badge = document.createElement('span');
            badge.className = 'compare-count';
            badge.textContent = '0';
            compareLink.appendChild(badge);
            headerIcons.appendChild(compareLink);
        }
        if (!headerIcons.querySelector('a[href="track-order.html"]')) {
            const trackLink = document.createElement('a');
            trackLink.href = 'track-order.html';
            trackLink.setAttribute('aria-label', 'Track your order');
            trackLink.innerHTML = '<i class="fas fa-map-location-dot"></i>';
            headerIcons.appendChild(trackLink);
        }
    };

    const renderChatWidget = () => {
        chatWidget.className = 'chat-widget';
        chatWidget.innerHTML = `
            <div class="chat-panel" id="chat-panel">
                <div class="panel-card" style="margin:0; border-radius:0; border:0; box-shadow:none;">
                    <div class="quick-actions">
                        <button type="button" data-chat="faq">FAQ</button>
                        <button type="button" data-chat="products">Products</button>
                        <button type="button" data-chat="orders">Orders</button>
                    </div>
                    <div class="chat-body">
                        <div class="msg bot">Hi! I’m ShopBangla AI. I can help with product picks, orders, and support.</div>
                    </div>
                    <div class="chat-input">
                        <input id="chat-input" type="text" placeholder="Ask me anything...">
                        <button class="btn" type="button" id="chat-send"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
            <button class="chat-toggle" type="button" id="chat-toggle" aria-label="Open chat assistant"><i class="fas fa-comments"></i></button>
        `;
    };

    const getChatReply = (message) => {
        const lower = message.toLowerCase();
        if (lower.includes('order')) return 'You can track your order from the Track Order page or contact support for live help.';
        if (lower.includes('product') || lower.includes('recommend')) return 'Our best sellers are the Samsung Galaxy A55, HP Pavilion Laptop, and Wireless Headphones.';
        if (lower.includes('delivery')) return 'Most deliveries arrive in 1–3 business days depending on your location.';
        if (lower.includes('price')) return 'Prices vary by product and promotion. Browse the products page for the latest deals.';
        return 'I can help with orders, delivery, product recommendations, and support. Try asking about a product or order.';
    };

    const handleChat = (message) => {
        const panel = document.getElementById('chat-panel');
        const body = panel?.querySelector('.chat-body');
        if (!body) return;
        const userMsg = document.createElement('div');
        userMsg.className = 'msg user';
        userMsg.textContent = message;
        body.appendChild(userMsg);
        const botMsg = document.createElement('div');
        botMsg.className = 'msg bot';
        botMsg.textContent = getChatReply(message);
        body.appendChild(botMsg);
        body.scrollTop = body.scrollHeight;
    };

    const revealOnScroll = () => {
        document.querySelectorAll('.reveal').forEach((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.top < window.innerHeight - 80) {
                element.classList.add('is-visible');
            }
        });
    };

    const toggleMobileNav = () => {
        if (siteNav) siteNav.classList.toggle('is-open');
    };

    const handleHeaderNavigation = (event) => {
        const link = event.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href');
        if (href === 'wishlist.html' || href === 'cart.html' || href === 'login.html') {
            event.preventDefault();
            window.location.href = href;
        }
    };

    const loadScript = (src) => new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
    });

    const firebaseConfig = window.SHOPBANGLA_FIREBASE_CONFIG || {
        apiKey: 'AIzaSyD7v2F9s1mQwJj3_I6XqKQhOGr9M0c4JYQ',
        authDomain: 'shopbangla-demo.firebaseapp.com',
        projectId: 'shopbangla-demo',
        storageBucket: 'shopbangla-demo.appspot.com',
        messagingSenderId: '123456789012',
        appId: '1:123456789012:web:abc123def456'
    };

    async function initializeFirebase() {
        try {
            await loadScript('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
            await loadScript('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js');
            await loadScript('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js');
            await loadScript('https://www.gstatic.com/firebasejs/10.13.0/firebase-storage-compat.js');
            if (!window.firebase || !firebaseConfig.projectId || firebaseConfig.projectId.includes('your-project')) {
                return false;
            }
            state.firebase = firebase;
            state.auth = firebase.auth();
            state.db = firebase.firestore();
            state.storage = firebase.storage();
            state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            return true;
        } catch (error) {
            return false;
        }
    }

    const seedProducts = async () => {
        if (!state.db) return;
        const snapshot = await state.db.collection('products').limit(1).get();
        if (!snapshot.empty) return;
        const baseProducts = [
            { id: 'samsung-galaxy-a55', name: 'Samsung Galaxy A55', price: 42999, category: 'mobile', brand: 'Samsung', image: 'images/mobile.jpg', description: '6.6" AMOLED Display', stock: 24, discount: 10 },
            { id: 'hp-pavilion-laptop', name: 'HP Pavilion Laptop', price: 78500, category: 'laptop', brand: 'HP', image: 'images/laptop.jpg', description: 'Intel Core i5 • 16GB RAM', stock: 8, discount: 5 },
            { id: 'smart-watch', name: 'Smart Watch', price: 3999, category: 'watch', brand: 'Apple', image: 'images/watch.jpg', description: 'Heart Rate Monitor', stock: 36, discount: 0 },
            { id: 'sports-shoes', name: 'Sports Shoes', price: 2499, category: 'shoe', brand: 'Nike', image: 'images/shoe.jpg', description: 'Comfortable Running Shoes', stock: 18, discount: 0 },
            { id: 'wireless-headphone', name: 'Wireless Headphone', price: 4999, category: 'headphone', brand: 'Sony', image: 'images/headphone.jpg', description: 'Noise Cancelling', stock: 22, discount: 15 },
            { id: 'apple-iphone-15', name: 'Apple iPhone 15', price: 124999, category: 'mobile', brand: 'Apple', image: 'images/mobile.jpg', description: '128GB • Blue', stock: 16, discount: 0 }
        ];
        const batch = state.db.batch();
        baseProducts.forEach((product) => {
            const ref = state.db.collection('products').doc(product.id);
            batch.set(ref, product);
        });
        await batch.commit();
    };

    const loadProducts = async () => {
        if (!state.db) {
            state.products = getStoredArray('shopbangla-products', []);
            if (!state.products.length) {
                state.products = [
                    { id: 'samsung-galaxy-a55', name: 'Samsung Galaxy A55', price: 42999, category: 'mobile', brand: 'Samsung', image: 'images/mobile.jpg', description: '6.6" AMOLED Display', stock: 24, discount: 10 },
                    { id: 'hp-pavilion-laptop', name: 'HP Pavilion Laptop', price: 78500, category: 'laptop', brand: 'HP', image: 'images/laptop.jpg', description: 'Intel Core i5 • 16GB RAM', stock: 8, discount: 5 },
                    { id: 'smart-watch', name: 'Smart Watch', price: 3999, category: 'watch', brand: 'Apple', image: 'images/watch.jpg', description: 'Heart Rate Monitor', stock: 36, discount: 0 },
                    { id: 'sports-shoes', name: 'Sports Shoes', price: 2499, category: 'shoe', brand: 'Nike', image: 'images/shoe.jpg', description: 'Comfortable Running Shoes', stock: 18, discount: 0 },
                    { id: 'wireless-headphone', name: 'Wireless Headphone', price: 4999, category: 'headphone', brand: 'Sony', image: 'images/headphone.jpg', description: 'Noise Cancelling', stock: 22, discount: 15 },
                    { id: 'apple-iphone-15', name: 'Apple iPhone 15', price: 124999, category: 'mobile', brand: 'Apple', image: 'images/mobile.jpg', description: '128GB • Blue', stock: 16, discount: 0 }
                ];
                saveStoredArray('shopbangla-products', state.products);
            }
            return;
        }
        await seedProducts();
        const snapshot = await state.db.collection('products').orderBy('name').get();
        state.products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        saveStoredArray('shopbangla-products', state.products);
        if (productGrid) renderProducts();
        if (document.querySelector('.flash-sale .product-container, .featured .product-container')) renderHomeSections();
    };

    const loadCategoriesAndBrands = async () => {
        if (!state.db) return;
        const [categoriesSnap, brandsSnap] = await Promise.all([
            state.db.collection('categories').get(),
            state.db.collection('brands').get()
        ]);
        state.categories = categoriesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        state.brands = brandsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (state.categories.length === 0) {
            state.categories = [{ id: 'mobile', name: 'Mobile' }, { id: 'laptop', name: 'Laptop' }, { id: 'watch', name: 'Watch' }, { id: 'shoe', name: 'Shoe' }, { id: 'headphone', name: 'Headphone' }];
        }
        if (state.brands.length === 0) {
            state.brands = [{ id: 'samsung', name: 'Samsung' }, { id: 'hp', name: 'HP' }, { id: 'apple', name: 'Apple' }, { id: 'nike', name: 'Nike' }, { id: 'sony', name: 'Sony' }];
        }
    };

    const syncUserData = async () => {
        if (!state.user || !state.db) return;
        const ref = state.db.collection('users').doc(state.user.uid);
        await ref.set({
            uid: state.user.uid,
            displayName: state.user.displayName || '',
            email: state.user.email || '',
            cart: getCartItems(),
            wishlist: getWishlistItems(),
            compare: getCompareItems(),
            updatedAt: new Date()
        }, { merge: true });
    };

    const loadUserData = async () => {
        if (!state.user || !state.db) return;
        const doc = await state.db.collection('users').doc(state.user.uid).get();
        if (doc.exists) {
            const data = doc.data() || {};
            if (Array.isArray(data.cart)) state.cart = data.cart;
            if (Array.isArray(data.wishlist)) state.wishlist = data.wishlist;
            if (Array.isArray(data.compare)) state.compare = data.compare;
            saveStoredArray('cartItems', state.cart);
            saveStoredArray('wishlistItems', state.wishlist);
            saveStoredArray('compareItems', state.compare);
            if (document.getElementById('profile-content')) renderProfile();
        }
        updateCartCount();
        updateWishlistCount();
        updateCompareCount();
    };

    const uploadImage = async (file) => {
        if (!file || !state.storage) return '';
        const path = `products/${Date.now()}-${file.name}`;
        const ref = state.storage.ref(path);
        const snapshot = await ref.put(file);
        return await snapshot.ref.getDownloadURL();
    };

    const renderAdmins = async () => {
        const productsCount = document.getElementById('stats-products');
        const ordersCount = document.getElementById('stats-orders');
        const customersCount = document.getElementById('stats-customers');
        const revenueCount = document.getElementById('stats-revenue');
        const lowStockList = document.getElementById('low-stock-list');
        const recentOrdersTable = document.getElementById('recent-orders-table');
        const productAdminList = document.getElementById('product-admin-list');
        const orderAdminList = document.getElementById('order-admin-list');
        const inventoryAdminList = document.getElementById('inventory-admin-list');
        const customerAdminList = document.getElementById('customer-admin-list');

        if (!productsCount && !ordersCount && !recentOrdersTable) return;
        if (state.db) {
            const [productsSnap, ordersSnap, usersSnap] = await Promise.all([
                state.db.collection('products').get(),
                state.db.collection('orders').orderBy('createdAt', 'desc').limit(10).get(),
                state.db.collection('users').get()
            ]);
            state.products = productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            state.orders = ordersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            const customers = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            const revenue = state.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
            if (productsCount) productsCount.textContent = state.products.length;
            if (ordersCount) ordersCount.textContent = state.orders.length;
            if (customersCount) customersCount.textContent = customers.length;
            if (revenueCount) revenueCount.textContent = `৳${revenue.toLocaleString('en-BD')}`;
            if (lowStockList) {
                const lowStock = state.products.filter((product) => Number(product.stock || 0) < 10);
                lowStockList.innerHTML = lowStock.length ? lowStock.map((product) => `<li>${product.name} — ${product.stock} left</li>`).join('') : '<li>No low stock items</li>';
            }
            if (recentOrdersTable) {
                recentOrdersTable.innerHTML = state.orders.slice(0, 5).map((order) => `<tr><td>#${order.orderNumber || order.id}</td><td>${order.customerName || 'Guest'}</td><td>${order.status || 'Pending'}</td><td>৳${Number(order.total || 0).toLocaleString('en-BD')}</td></tr>`).join('');
            }
            if (productAdminList) {
                productAdminList.innerHTML = state.products.map((product) => `<tr><td>${product.name}</td><td>${product.category || 'general'}</td><td>৳${Number(product.price || 0).toLocaleString('en-BD')}</td><td>${product.stock || 0}</td><td><button class="btn2" data-edit-product="${product.id}" type="button">Edit</button></td></tr>`).join('');
            }
            if (orderAdminList) {
                orderAdminList.innerHTML = state.orders.map((order) => `<tr><td>#${order.orderNumber || order.id}</td><td>${order.customerName || 'Guest'}</td><td>${order.status || 'Pending'}</td><td>৳${Number(order.total || 0).toLocaleString('en-BD')}</td><td><button class="btn2" data-update-order="${order.id}" type="button">Update</button></td></tr>`).join('');
            }
            if (inventoryAdminList) {
                inventoryAdminList.innerHTML = state.products.map((product) => `<tr><td>${product.id}</td><td>${product.name}</td><td>${product.stock || 0}</td><td>${product.discount || 0}%</td></tr>`).join('');
            }
            if (customerAdminList) {
                customerAdminList.innerHTML = customers.map((customer) => `<tr><td>${customer.displayName || customer.email}</td><td>${customer.email}</td><td>Active</td><td>${(customer.orders || []).length}</td></tr>`).join('');
            }
        }
    };

    async function handleAuthStateChange(user) {
        state.user = user;
        if (user) {
            await loadUserData();
            await syncUserData();
        }
        updateAuthUi();
        if (document.getElementById('profile-content')) renderProfile();
        if (document.querySelector('.admin-shell')) renderAdmins();
    }

    const updateAuthUi = () => {
        const loginLinks = document.querySelectorAll('a[href="login.html"], a[href="register.html"]');
        loginLinks.forEach((link) => {
            if (state.user && link.getAttribute('href') === 'login.html') {
                link.textContent = 'Account';
                link.setAttribute('href', 'profile.html');
            }
        });
    };

    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        const form = document.getElementById('login-form');
        const email = document.getElementById('email')?.value || '';
        const password = document.getElementById('password')?.value || '';
        if (!state.auth) {
            showToast('Firebase is not configured. Please add your Firebase project settings.', 'error');
            return;
        }
        try {
            await state.auth.signInWithEmailAndPassword(email, password);
            showToast('Signed in successfully.');
            window.location.href = 'profile.html';
        } catch (error) {
            showToast(error.message || 'Unable to sign in.', 'error');
        }
    };

    const handleRegisterSubmit = async (event) => {
        event.preventDefault();
        const email = document.getElementById('register-email')?.value || '';
        const password = document.getElementById('password')?.value || '';
        const fullName = document.getElementById('full-name')?.value || '';
        const phone = document.getElementById('phone')?.value || '';
        const username = document.getElementById('username')?.value || '';
        if (!state.auth) {
            showToast('Firebase is not configured. Please add your Firebase project settings.', 'error');
            return;
        }
        try {
            const credential = await state.auth.createUserWithEmailAndPassword(email, password);
            await credential.user.updateProfile({ displayName: fullName });
            if (state.db) {
                await state.db.collection('users').doc(credential.user.uid).set({
                    uid: credential.user.uid,
                    displayName: fullName,
                    email,
                    phone,
                    username,
                    createdAt: new Date()
                }, { merge: true });
            }
            showToast('Account created. Welcome to ShopBangla!');
            window.location.href = 'profile.html';
        } catch (error) {
            showToast(error.message || 'Registration failed.', 'error');
        }
    };

    const handleForgotPassword = async () => {
        const email = document.getElementById('email')?.value || '';
        if (!email) {
            showToast('Enter your email address first.', 'error');
            return;
        }
        if (!state.auth) {
            showToast('Firebase is not configured.', 'error');
            return;
        }
        try {
            await state.auth.sendPasswordResetEmail(email);
            showToast('Password reset email sent.');
        } catch (error) {
            showToast(error.message || 'Unable to reset password.', 'error');
        }
    };

    const handleGoogleSignIn = async () => {
        if (!state.auth) {
            showToast('Firebase is not configured.', 'error');
            return;
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await state.auth.signInWithPopup(provider);
            showToast('Signed in successfully.');
            window.location.href = 'profile.html';
        } catch (error) {
            showToast(error.message || 'Google sign-in failed.', 'error');
        }
    };

    const renderProfile = async () => {
        const container = document.getElementById('profile-content');
        const profileForm = document.getElementById('profile-form');
        if (!container) return;
        if (!state.user) {
            container.innerHTML = '<div class="empty-state"><h3>Please sign in to view your dashboard</h3><p>Your profile, orders, wishlist, and cart will appear here once you are logged in.</p><a href="login.html" class="btn">Log in</a></div>';
            return;
        }
        const orders = state.orders.filter((order) => order.customerEmail === state.user.email || order.customerId === state.user.uid);
        const wishlist = getWishlistItems();
        const cart = getCartItems();
        container.innerHTML = `
            <div class="about-card">
                <p><strong>Name:</strong> ${state.user.displayName || 'Customer'}</p>
                <p><strong>Email:</strong> ${state.user.email || ''}</p>
                <p><strong>Orders:</strong> ${orders.length}</p>
                <p><strong>Wishlist Items:</strong> ${wishlist.length}</p>
                <p><strong>Cart Items:</strong> ${cart.reduce((total, item) => total + item.quantity, 0)}</p>
            </div>
            <div class="panel-card" style="margin-top:16px;">
                <h3>Recent Orders</h3>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>Order ID</th><th>Status</th><th>Total</th></tr></thead>
                        <tbody>${orders.length ? orders.slice(0, 4).map((order) => `<tr><td>#${order.orderNumber || order.id}</td><td>${order.status || 'Pending'}</td><td>৳${Number(order.total || 0).toLocaleString('en-BD')}</td></tr>`).join('') : '<tr><td colspan="3">No orders yet</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
            <div class="panel-card" style="margin-top:16px;">
                <h3>Account Settings</h3>
                <form id="profile-form" class="form-card">
                    <label>Name</label>
                    <input id="profile-name" value="${state.user.displayName || ''}" required>
                    <label>Email</label>
                    <input id="profile-email" value="${state.user.email || ''}" required readonly>
                    <button class="btn" type="submit">Save</button>
                </form>
            </div>
        `;
        if (profileForm) {
            profileForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (state.db) {
                    await state.db.collection('users').doc(state.user.uid).set({ displayName: document.getElementById('profile-name').value }, { merge: true });
                }
                showToast('Profile updated.');
            });
        }
    };

    const handleCheckoutSubmit = async (event) => {
        event.preventDefault();
        const items = getCartItems();
        if (!items.length) {
            showToast('Your cart is empty.', 'error');
            return;
        }
        const formData = new FormData(event.target);
        const customerName = formData.get('full-name') || document.getElementById('full-name')?.value || '';
        const customerEmail = formData.get('checkout-email') || document.getElementById('checkout-email')?.value || '';
        const phone = formData.get('phone') || document.getElementById('phone')?.value || '';
        const address = formData.get('address') || document.getElementById('address')?.value || '';
        const city = formData.get('city') || document.getElementById('city')?.value || '';
        const postalCode = formData.get('postal-code') || document.getElementById('postal-code')?.value || '';
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shipping = subtotal > 0 ? 120 : 0;
        const total = subtotal + shipping;
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        const order = {
            orderNumber,
            customerName,
            customerEmail,
            customerId: state.user?.uid || null,
            phone,
            address,
            city,
            postalCode,
            items,
            subtotal,
            shipping,
            total,
            status: 'Pending',
            createdAt: new Date()
        };
        if (state.db) {
            await state.db.collection('orders').doc(orderNumber).set(order);
        }
        saveCartItems([]);
        renderCart();
        showToast('Order placed successfully.');
        window.location.href = `track-order.html?order=${orderNumber}`;
    };

    const handleTrackSubmit = async (event) => {
        event.preventDefault();
        const orderId = document.getElementById('order-id')?.value || '';
        const target = document.getElementById('tracking-result');
        if (!target) return;
        if (!state.db) {
            target.innerHTML = '<p>Firebase is not configured. Please add a Firebase config to enable real order tracking.</p>';
            return;
        }
        const doc = await state.db.collection('orders').doc(orderId.replace('#', '')).get();
        if (!doc.exists) {
            target.innerHTML = '<p>Order not found. Please verify your order ID.</p>';
            return;
        }
        const order = doc.data();
        target.innerHTML = `
            <h3>Order Summary</h3>
            <p><strong>Order ID:</strong> #${order.orderNumber || orderId}</p>
            <p><strong>Customer:</strong> ${order.customerName || 'Guest'}</p>
            <p><strong>Status:</strong> <span class="badge-pill">${order.status || 'Pending'}</span></p>
            <p><strong>Total:</strong> ৳${Number(order.total || 0).toLocaleString('en-BD')}</p>
        `;
    };

    const handleAdminProductSubmit = async (event) => {
        event.preventDefault();
        const id = document.getElementById('product-id')?.value || '';
        const name = document.getElementById('product-name')?.value || '';
        const price = Number(document.getElementById('product-price')?.value || 0);
        const category = document.getElementById('product-category')?.value || 'general';
        const brand = document.getElementById('product-brand')?.value || 'ShopBangla';
        const stock = Number(document.getElementById('product-stock')?.value || 0);
        const discount = Number(document.getElementById('product-discount')?.value || 0);
        const description = document.getElementById('product-description')?.value || '';
        const imageFile = document.getElementById('product-image')?.files?.[0];
        let image = document.getElementById('product-image-url')?.value || '';
        if (imageFile) image = await uploadImage(imageFile);
        const payload = { name, price, category, brand, stock, discount, description, image };
        if (state.db) {
            const productId = id || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            await state.db.collection('products').doc(productId).set(payload, { merge: true });
            showToast('Product saved.');
        }
        await loadProducts();
        renderAdmins();
        event.target.reset();
    };

    const handleCategoryOrBrandSubmit = async (event, collection) => {
        event.preventDefault();
        const input = event.target.querySelector('input');
        const name = input?.value.trim();
        if (!name) return;
        if (state.db) {
            await state.db.collection(collection).doc(name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).set({ name });
        }
        await loadCategoriesAndBrands();
        renderAdmins();
        event.target.reset();
    };

    const attachListeners = () => {
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

        heroButtons.forEach((button) => button.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = 'products.html';
        }));

        document.addEventListener('click', (event) => {
            const button = event.target.closest('.product-card button:not(.icon-btn)');
            if (button) {
                event.preventDefault();
                const product = readProduct(button);
                if (product) addToCart(product);
            }
            const wishlistToggle = event.target.closest('.wishlist-toggle');
            if (wishlistToggle) {
                event.preventDefault();
                const product = readProduct(wishlistToggle);
                if (product) {
                    const items = getWishlistItems();
                    const exists = items.find((item) => item.id === product.id);
                    if (exists) {
                        saveWishlistItems(items.filter((item) => item.id !== product.id));
                        showToast('Removed from wishlist.');
                    } else {
                        items.push(product);
                        saveWishlistItems(items);
                        showToast('Added to wishlist.');
                    }
                    if (document.getElementById('wishlist-grid')) renderWishlist();
                }
            }
            const compareToggle = event.target.closest('.compare-toggle');
            if (compareToggle) {
                event.preventDefault();
                const product = readProduct(compareToggle);
                if (product) {
                    const items = getCompareItems();
                    const exists = items.find((item) => item.id === product.id);
                    if (exists) {
                        saveCompareItems(items.filter((item) => item.id !== product.id));
                        showToast('Removed from compare list.');
                    } else if (items.length < 4) {
                        items.push(product);
                        saveCompareItems(items);
                        showToast('Added to compare list.');
                    } else {
                        showToast('You can compare up to 4 products.');
                    }
                    if (document.getElementById('compare-grid')) renderCompare();
                }
            }
            const faqButton = event.target.closest('.faq-question');
            if (faqButton) {
                const item = faqButton.closest('.faq-item');
                if (item) item.classList.toggle('is-open');
            }
            const chatQuick = event.target.closest('[data-chat]');
            if (chatQuick) {
                const value = chatQuick.getAttribute('data-chat');
                let response = 'How can I assist you today?';
                if (value === 'faq') response = 'We offer secure checkout, fast delivery, and easy returns.';
                if (value === 'products') response = 'Our top recommendations are mobiles, laptops, headphones, and smart wearables.';
                if (value === 'orders') response = 'You can track your order using the Track Order page.';
                handleChat(response);
            }
            const chatOpen = event.target.closest('#chat-toggle');
            if (chatOpen) {
                const panel = document.getElementById('chat-panel');
                if (panel) panel.classList.toggle('is-open');
            }
            const chatSend = event.target.closest('#chat-send');
            if (chatSend) {
                const input = document.getElementById('chat-input');
                if (input && input.value.trim()) {
                    handleChat(input.value.trim());
                    input.value = '';
                }
            }
        });

        wishlistLinks.forEach((link) => link.addEventListener('click', handleHeaderNavigation));
        cartLinks.forEach((link) => link.addEventListener('click', handleHeaderNavigation));
        userLinks.forEach((link) => link.addEventListener('click', handleHeaderNavigation));

        if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);

        if (cartContainer) {
            cartContainer.addEventListener('click', (event) => {
                const button = event.target.closest('.qty-btn');
                const removeButton = event.target.closest('.remove-item');
                const items = getCartItems();
                if (button) {
                    const targetId = button.getAttribute('data-id');
                    const item = items.find((entry) => entry.id === targetId);
                    if (!item) return;
                    if (button.getAttribute('data-action') === 'increase') item.quantity += 1;
                    else if (item.quantity > 1) item.quantity -= 1;
                    else {
                        const filtered = items.filter((entry) => entry.id !== targetId);
                        saveCartItems(filtered);
                        renderCart();
                        return;
                    }
                    saveCartItems(items);
                    renderCart();
                }
                if (removeButton) {
                    const targetId = removeButton.getAttribute('data-id');
                    saveCartItems(items.filter((entry) => entry.id !== targetId));
                    renderCart();
                }
            });
        }

        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
        const registerForm = document.getElementById('register-form');
        if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);
        const forgotLink = document.getElementById('forgot-password');
        if (forgotLink) forgotLink.addEventListener('click', (event) => {
            event.preventDefault();
            handleForgotPassword();
        });
        const googleButton = document.getElementById('google-signin-btn');
        if (googleButton) googleButton.addEventListener('click', handleGoogleSignIn);

        const trackForm = document.getElementById('track-form');
        if (trackForm) trackForm.addEventListener('submit', handleTrackSubmit);

        const productForm = document.getElementById('product-form');
        if (productForm) productForm.addEventListener('submit', handleAdminProductSubmit);
        const categoryForm = document.getElementById('category-form');
        if (categoryForm) categoryForm.addEventListener('submit', (event) => handleCategoryOrBrandSubmit(event, 'categories'));
        const brandForm = document.getElementById('brand-form');
        if (brandForm) brandForm.addEventListener('submit', (event) => handleCategoryOrBrandSubmit(event, 'brands'));

        const adminLoginScreen = document.getElementById('admin-login-screen');
        const adminDashboard = document.getElementById('admin-dashboard');
        const adminLoginForm = document.getElementById('admin-login-form');
        const adminLogout = document.getElementById('admin-logout');
        const adminNavButtons = document.querySelectorAll('.admin-nav button[data-view]');
        const adminViews = document.querySelectorAll('.admin-view');
        const showAdminView = (viewName) => {
            adminViews.forEach((view) => {
                view.style.display = view.id === `view-${viewName}` ? 'block' : 'none';
            });
            adminNavButtons.forEach((button) => {
                button.classList.toggle('active', button.getAttribute('data-view') === viewName);
            });
        };
        const showAdminLogin = () => {
            if (adminLoginScreen) adminLoginScreen.style.display = 'grid';
            if (adminDashboard) adminDashboard.style.display = 'none';
        };
        const showAdminDashboard = () => {
            if (adminLoginScreen) adminLoginScreen.style.display = 'none';
            if (adminDashboard) adminDashboard.style.display = 'grid';
            showAdminView('home');
        };
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const email = document.getElementById('admin-email')?.value || '';
                const password = document.getElementById('admin-password')?.value || '';
                if (!state.auth) {
                    showToast('Firebase is not configured.', 'error');
                    return;
                }
                try {
                    await state.auth.signInWithEmailAndPassword(email, password);
                    showToast('Admin access granted.');
                    showAdminDashboard();
                } catch (error) {
                    showToast(error.message || 'Invalid admin credentials.', 'error');
                }
            });
        }
        if (adminLogout) {
            adminLogout.addEventListener('click', async () => {
                if (state.auth) await state.auth.signOut();
                localStorage.removeItem('shopbangla-admin-auth');
                showAdminLogin();
                showToast('Logged out.');
            });
        }
        adminNavButtons.forEach((button) => button.addEventListener('click', () => showAdminView(button.getAttribute('data-view'))));
    };

    const initPage = async () => {
        loadUserState();
        createCartBadge();
        createWishlistBadge();
        createUtilityLinks();
        updateCartCount();
        updateWishlistCount();
        updateCompareCount();
        renderChatWidget();
        attachListeners();
        const ready = await initializeFirebase();
        if (ready) {
            state.auth.onAuthStateChanged(handleAuthStateChange);
            await loadCategoriesAndBrands();
            await loadProducts();
            if (document.querySelector('.flash-sale .product-container, .featured .product-container')) renderHomeSections();
            if (productGrid) renderProducts();
            if (document.getElementById('wishlist-grid')) renderWishlist();
            if (document.getElementById('compare-grid')) renderCompare();
            if (cartContainer) renderCart();
            if (document.getElementById('profile-content')) renderProfile();
            if (document.querySelector('.admin-shell')) renderAdmins();
        } else {
            await loadProducts();
            if (productGrid) renderProducts();
            if (document.querySelector('.flash-sale .product-container, .featured .product-container')) renderHomeSections();
            if (document.getElementById('wishlist-grid')) renderWishlist();
            if (document.getElementById('compare-grid')) renderCompare();
            if (cartContainer) renderCart();
            if (document.getElementById('profile-content')) renderProfile();
            if (document.querySelector('.admin-shell')) renderAdmins();
        }
        revealOnScroll();
    };

    initPage();
})();

