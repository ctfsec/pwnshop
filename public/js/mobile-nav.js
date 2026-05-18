/* ============================================================
   PwnShop — Mobile Navigation v4
   - Hamburger + full-width drawer (mobile ≤768px)
   - Fixed bottom nav (mobile ≤768px)
   - Sticky header (all screens)
   - Login split into Login + Sign Up on mobile
   ============================================================ */
(function () {
    'use strict';

    if (window.__pwNavLoaded) return;
    window.__pwNavLoaded = true;

    var _drawerOpen = false;

    function init() {
        var container = document.querySelector('.topbar .container');
        if (!container) return;

        injectStyles();
        enforceSticky();
        injectCartIcon(container);
        injectHamburger(container);
        injectDrawer(container);
        injectBottomNav(container);
    }

    /* ── Force fixed header on all pages ── */
    function enforceSticky() {
        var topbar = document.querySelector('.topbar');
        if (topbar) {
            topbar.style.setProperty('position', 'fixed', 'important');
            topbar.style.setProperty('top',      '0',     'important');
            topbar.style.setProperty('left',     '0',     'important');
            topbar.style.setProperty('right',    '0',     'important');
            topbar.style.setProperty('width',    '100%',  'important');
            topbar.style.setProperty('z-index',  '1000',  'important');
            /* Push body down so content isn't hidden under the fixed bar */
            document.body.style.paddingTop = topbar.offsetHeight + 'px';
        }
    }

    /* ── Cart icon in topbar (mobile only — icon + count, no label text) ── */
    function injectCartIcon(container) {
        var navRight = container.querySelector('.nav-right');
        if (!navRight) return;
        var cart = navRight.querySelector('.btn-cart');
        if (!cart) return;
        var badge = cart.querySelector('.badge');
        var count = badge ? parseInt(badge.textContent.trim(), 10) : 0;

        var c = document.createElement('a');
        c.id = 'pw-topbar-cart';
        c.href = '/cart';
        c.innerHTML = '🛒' + (count > 0 ? '<span class="pw-cart-count">' + count + '</span>' : '');
        container.appendChild(c);
    }

    /* ── Hamburger ── */
    function injectHamburger(container) {
        var btn = document.createElement('button');
        btn.id = 'pw-nav-toggle';
        btn.className = 'pw-hamburger';
        btn.setAttribute('aria-label', 'Open menu');
        btn.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(btn);
        btn.addEventListener('click', openDrawer);
    }

    /* ── Drawer ── */
    function injectDrawer(container) {
        var overlay = document.createElement('div');
        overlay.id = 'pw-overlay';
        overlay.addEventListener('click', closeDrawer);
        document.body.appendChild(overlay);

        var drawer = document.createElement('div');
        drawer.id = 'pw-drawer';
        drawer.innerHTML = buildDrawerHTML(container);
        document.body.appendChild(drawer);

        drawer.querySelector('#pw-drawer-close').addEventListener('click', closeDrawer);
        drawer.querySelectorAll('a').forEach(function(a) { a.addEventListener('click', closeDrawer); });
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeDrawer(); });
    }

    function buildDrawerHTML(container) {
        var authHTML   = getAuthHTML(container);
        var searchHTML = getSearchHTML(container);
        return [
            '<div class="pw-drawer-inner">',
            '<div class="pw-drawer-head">',
            '  <span class="pw-drawer-brand">Pwnshop<span class="pw-drawer-dot"></span></span>',
            '  <button id="pw-drawer-close" aria-label="Close">&#x2715;</button>',
            '</div>',
            authHTML   ? '<div class="pw-drawer-auth">'   + authHTML   + '</div>' : '',
            searchHTML ? '<div class="pw-drawer-search">' + searchHTML + '</div>' : '',
            '<div class="pw-drawer-section">',
            '  <div class="pw-drawer-section-title">Categories</div>',
            '  <a class="pw-drawer-link" href="/category/all"><i class="bi bi-grid-fill"></i> All Categories</a>',
            '  <a class="pw-drawer-link" href="/category/computers"><i class="bi bi-laptop"></i> Computers &amp; Accessories</a>',
            '  <a class="pw-drawer-link" href="/category/phones"><i class="bi bi-phone"></i> Phones &amp; Tablets</a>',
            '  <a class="pw-drawer-link" href="/category/electronics"><i class="bi bi-lightning-charge"></i> Electronics</a>',
            '  <a class="pw-drawer-link" href="/category/fashion"><i class="bi bi-bag"></i> Fashion</a>',
            '  <a class="pw-drawer-link" href="/category/home"><i class="bi bi-house"></i> Home &amp; Kitchen</a>',
            '  <a class="pw-drawer-link" href="/category/kids"><i class="bi bi-star"></i> Kids &amp; Toys</a>',
            '  <a class="pw-drawer-link" href="/category/beauty"><i class="bi bi-heart"></i> Beauty &amp; Health</a>',
            '</div>',
            '<div class="pw-drawer-section">',
            '  <div class="pw-drawer-section-title">Quick Links</div>',
            '  <a class="pw-drawer-link" href="/cart"><i class="bi bi-cart3"></i> My Cart</a>',
            '  <a class="pw-drawer-link" href="/track"><i class="bi bi-geo-alt"></i> Track My Order</a>',
            '  <a class="pw-drawer-link" href="/vulnerabilities"><i class="bi bi-shield-exclamation"></i> Vulnerabilities</a>',
            '</div>',
            '</div>'
        ].join('');
    }

    function getAuthHTML(container) {
        var navRight = container.querySelector('.nav-right');
        if (!navRight) return '';
        var login    = navRight.querySelector('.btn-login');
        var userChip = navRight.querySelector('.user-chip');
        var logout   = navRight.querySelector('.btn-logout');
        if (login) {
            return [
                '<div class="pw-drawer-auth-row">',
                '  <a href="/login" class="pw-drawer-btn-login">Login</a>',
                '  <a href="/register" class="pw-drawer-btn-signup">Sign Up</a>',
                '</div>'
            ].join('');
        }
        var html = '';
        if (userChip) html += '<div class="pw-drawer-user">' + userChip.textContent.trim() + '</div>';
        if (logout)   html += '<a href="/logout" class="pw-drawer-btn-logout">Logout</a>';
        return html;
    }

    function getSearchHTML(container) {
        var s = container.querySelector('.search-wrap');
        return s ? s.cloneNode(true).outerHTML : '';
    }

    /* ── Fixed bottom nav ── */
    function injectBottomNav(container) {
        var cartCount = getCartCount(container);
        var isLoggedIn = !!container.querySelector('.user-chip, .btn-logout');
        var profileHref = isLoggedIn ? '/profile' : '/login';
        var profileLabel = isLoggedIn ? 'Profile' : 'Login';

        var nav = document.createElement('nav');
        nav.id = 'pw-bottom-nav';
        nav.innerHTML = [
            '<a href="/" class="pw-bn-item' + (isCurrentPage('/') ? ' active' : '') + '">',
            '  <i class="bi bi-house-fill"></i>',
            '  <span>Home</span>',
            '</a>',
            '<a href="/cart" class="pw-bn-item' + (isCurrentPage('/cart') ? ' active' : '') + '">',
            '  <i class="bi bi-cart3"></i>',
            '  <span>Cart</span>',
            cartCount > 0 ? '<span class="pw-bn-badge">' + cartCount + '</span>' : '',
            '</a>',
            '<a href="' + profileHref + '" class="pw-bn-item' + (isCurrentPage('/profile') ? ' active' : '') + '">',
            '  <i class="bi bi-person-fill"></i>',
            '  <span>' + profileLabel + '</span>',
            '</a>',
            '<button class="pw-bn-item" id="pw-bn-menu" onclick="window.__pwOpenDrawer()">',
            '  <i class="bi bi-grid-2x2"></i>',
            '  <span>Menu</span>',
            '</button>'
        ].join('');

        document.body.appendChild(nav);

        /* Expose openDrawer for the bottom nav button */
        window.__pwOpenDrawer = openDrawer;
    }

    function getCartCount(container) {
        var badge = container.querySelector('.btn-cart .badge');
        if (!badge) return 0;
        var n = parseInt(badge.textContent.trim(), 10);
        return isNaN(n) ? 0 : n;
    }

    function isCurrentPage(path) {
        return window.location.pathname === path ||
               (path === '/' && window.location.pathname === '');
    }

    function openDrawer() {
        _drawerOpen = true;
        document.getElementById('pw-drawer').classList.add('open');
        document.getElementById('pw-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
        var btn = document.getElementById('pw-bn-menu');
        if (btn) btn.classList.add('active');
    }

    function closeDrawer() {
        _drawerOpen = false;
        var d = document.getElementById('pw-drawer');
        var o = document.getElementById('pw-overlay');
        if (d) d.classList.remove('open');
        if (o) o.classList.remove('open');
        document.body.style.overflow = '';
        var btn = document.getElementById('pw-bn-menu');
        if (btn) btn.classList.remove('active');
    }

    /* ── All CSS ── */
    function injectStyles() {
        if (document.getElementById('pw-nav-styles')) return;
        var s = document.createElement('style');
        s.id = 'pw-nav-styles';
        s.textContent = `

/* ── Fixed header — all screens ── */
.topbar { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; width: 100% !important; z-index: 1000 !important; }

/* ── Always hidden ── */
.pw-hamburger, #pw-topbar-cart, #pw-bottom-nav { display: none !important; }
#pw-drawer, #pw-overlay { display: none; }

/* ════════════════════════════════════════
   TABLET (769px – 992px)
   Normal nav, no hamburger, no bottom nav.
   Compress to fit single row. Keep sidebar layout.
════════════════════════════════════════ */
@media (min-width: 769px) and (max-width: 992px) {

    .topbar .container {
        flex-wrap: nowrap;
        padding: 8px 12px;
        gap: 6px;
        align-items: center;
        overflow: visible;
    }
    .navbar-brand {
        font-size: 1.1rem !important;
        flex-shrink: 0;
        gap: 4px;
    }
    .navbar-brand .dot { width: 6px; height: 6px; }

    /* Search shrinks */
    .search-wrap { flex: 1 1 0; min-width: 0; max-width: 240px; }
    .search-wrap input { font-size: 0.8rem; padding: 7px 10px; }
    .search-wrap button::after { display: none; }
    .search-wrap button { padding: 7px 12px; }

    /* Nav links smaller */
    .nav-links .nav-link,
    .nav-link-plain { font-size: 0.75rem; padding: 4px 6px; }

    /* Right nav tighter */
    .nav-right { gap: 4px; flex-shrink: 0; }
    .btn-cart, .btn-login, .btn-logout,
    .btn-seller, .btn-add-product, .btn-dashboard,
    .user-chip {
        font-size: 0.75rem !important;
        padding: 5px 8px !important;
        white-space: nowrap;
    }
    .btn-cart .badge { font-size: 0.65rem; }

    /* Keep two-col sidebar layout on tablet, just narrower */
    .two-col { grid-template-columns: 180px 1fr !important; gap: 16px !important; }
    /* Product image+info layout collapses to single column on tablet */
    .product-wrap { grid-template-columns: 1fr !important; gap: 16px !important; }
    /* Sidebar unsticks on tablet */
    .sidebar-col { position: static !important; top: auto !important; }
    .sidebar { position: static; top: auto; }
    /* Hide promo box on tablet to save space */
    .sidebar-promo { display: none; }

    .carousel-item img { height: 240px; }
    .carousel-caption { left: 20px; right: 20px; bottom: 20px; }
    .carousel-caption h2 { font-size: 1.4rem; }
    .product-actions, .cart-row { flex-wrap: wrap; }
}

/* ════════════════════════════════════════
   MOBILE (≤768px)
   Hamburger + drawer + bottom nav
════════════════════════════════════════ */
@media (max-width: 768px) {

    /* Extra padding at bottom for bottom nav */
    body { padding-bottom: 64px !important; }

    /* Show drawer/overlay elements */
    #pw-drawer { display: block; }
    #pw-overlay { display: block; }

    /* Hide original nav children */
    .topbar .container > .nav-links,
    .topbar .container > .search-wrap,
    .topbar .container > .nav-right { display: none !important; }

    /* Topbar */
    .topbar .container {
        flex-wrap: nowrap !important;
        padding: 10px 14px !important;
        gap: 8px !important;
        align-items: center !important;
    }
    .navbar-brand { flex: 1 !important; font-size: 1.2rem !important; white-space: nowrap; min-width: 0 !important; overflow: hidden; }

    /* Cart in topbar — icon only */
    #pw-topbar-cart {
        display: flex !important;
        align-items: center; justify-content: center;
        position: relative;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.2);
        color: #fff !important;
        border-radius: 8px; padding: 7px 11px;
        font-size: 1.1rem;
        text-decoration: none; flex-shrink: 0;
        line-height: 1;
    }
    .pw-cart-count {
        position: absolute;
        top: -5px; right: -5px;
        background: #A855F7;
        color: #fff;
        font-size: 0.6rem;
        font-weight: 700;
        border-radius: 50px;
        padding: 2px 5px;
        min-width: 16px;
        text-align: center;
        line-height: 14px;
        height: 16px;
    }

    /* Hamburger */
    .pw-hamburger {
        display: inline-flex !important;
        flex-direction: column; justify-content: center;
        align-items: center; gap: 5px;
        width: 38px; height: 38px;
        border: 1.5px solid rgba(255,255,255,0.35);
        background: rgba(255,255,255,0.1);
        border-radius: 8px; cursor: pointer; flex-shrink: 0; padding: 0;
    }
    .pw-hamburger span {
        display: block; width: 18px; height: 2px;
        background: #fff; border-radius: 2px; pointer-events: none;
    }

    /* Overlay */
    #pw-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.6); z-index: 9998;
        opacity: 0; pointer-events: none;
        transition: opacity 0.28s;
    }
    #pw-overlay.open { opacity: 1; pointer-events: auto; }

    /* Drawer */
    #pw-drawer {
        position: fixed; top: 0; right: 0;
        width: 100vw; height: 100dvh;
        background: #fff; z-index: 9999;
        transform: translateX(100%);
        transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
        overflow-y: auto;
    }
    #pw-drawer.open { transform: translateX(0); }
    .pw-drawer-inner { display: flex; flex-direction: column; min-height: 100%; }

    /* Drawer header */
    .pw-drawer-head {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 20px; background: #3B0764;
        position: sticky; top: 0; z-index: 1;
    }
    .pw-drawer-brand {
        font-family: 'Syne', sans-serif; font-weight: 800;
        font-size: 1.4rem; color: #fff;
        display: flex; align-items: center; gap: 5px;
    }
    .pw-drawer-dot {
        display: inline-block; width: 7px; height: 7px;
        background: #A855F7; border-radius: 50%; margin-bottom: 2px;
    }
    #pw-drawer-close {
        background: rgba(255,255,255,0.15); border: none; color: #fff;
        width: 34px; height: 34px; border-radius: 50%;
        font-size: 1rem; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
    }

    /* Auth */
    .pw-drawer-auth { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; border-bottom: 1px solid #EDE9F6; }
    .pw-drawer-auth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .pw-drawer-btn-login {
        display: block; background: #3B0764; color: #fff !important;
        border-radius: 10px; padding: 13px; font-size: 0.92rem; font-weight: 700;
        text-align: center; text-decoration: none; transition: background 0.2s;
    }
    .pw-drawer-btn-login:hover { background: #6D28D9; color: #fff !important; }
    .pw-drawer-btn-signup {
        display: block; background: transparent; color: #3B0764 !important;
        border: 2px solid #3B0764; border-radius: 10px; padding: 13px;
        font-size: 0.92rem; font-weight: 700; text-align: center; text-decoration: none;
        transition: all 0.2s;
    }
    .pw-drawer-btn-signup:hover { background: #3B0764; color: #fff !important; }
    .pw-drawer-user { background: #F3E8FF; color: #3B0764; border-radius: 10px; padding: 12px 16px; font-weight: 600; font-size: 0.9rem; text-align: center; }
    .pw-drawer-btn-logout { display: block; width: 100%; background: #fef2f2; color: #dc2626 !important; border: 1px solid #fecaca; border-radius: 10px; padding: 12px; font-size: 0.88rem; font-weight: 600; text-align: center; text-decoration: none; }

    /* Search */
    .pw-drawer-search { padding: 14px 20px; border-bottom: 1px solid #EDE9F6; }
    .pw-drawer-search .search-wrap { width: 100% !important; max-width: 100% !important; }
    .pw-drawer-search input { background: #F8F5FF !important; color: #0D0D0D !important; border-radius: 8px 0 0 8px; }
    .pw-drawer-search input::placeholder { color: #9CA3AF !important; }

    /* Sections */
    .pw-drawer-section { padding: 14px 20px; border-bottom: 1px solid #EDE9F6; }
    .pw-drawer-section-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #9CA3AF; margin-bottom: 8px; }
    .pw-drawer-link { display: flex; align-items: center; gap: 14px; padding: 13px 4px; color: #111827; text-decoration: none; font-size: 0.92rem; font-weight: 500; border-bottom: 1px solid #F8F5FF; transition: all 0.18s; }
    .pw-drawer-link:last-child { border-bottom: none; }
    .pw-drawer-link:hover { color: #6D28D9; padding-left: 10px; background: #F8F5FF; border-radius: 8px; }
    .pw-drawer-link i { color: #6D28D9; width: 20px; text-align: center; font-size: 1.05rem; }

    /* ── Fixed Bottom Nav ── */
    #pw-bottom-nav {
        display: flex !important;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        height: 60px;
        background: #fff;
        border-top: 1px solid #EDE9F6;
        z-index: 9990;
        box-shadow: 0 -2px 16px rgba(59,7,100,0.1);
    }
    .pw-bn-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        color: #6B7280;
        text-decoration: none;
        font-size: 0.65rem;
        font-weight: 600;
        font-family: 'DM Sans', sans-serif;
        background: none;
        border: none;
        cursor: pointer;
        position: relative;
        transition: color 0.18s;
        padding: 0;
    }
    .pw-bn-item i { font-size: 1.25rem; line-height: 1; }
    .pw-bn-item.active { color: #3B0764; }
    .pw-bn-item.active i { color: #3B0764; }
    .pw-bn-item:hover { color: #6D28D9; }
    .pw-bn-badge {
        position: absolute;
        top: 4px; right: calc(50% - 18px);
        background: #A855F7;
        color: #fff;
        font-size: 0.6rem;
        font-weight: 700;
        border-radius: 50px;
        padding: 1px 5px;
        min-width: 16px;
        text-align: center;
        line-height: 14px;
        height: 14px;
    }

    /* Page layout */
    .page-wrap, .product-wrap, .two-col { grid-template-columns: 1fr !important; gap: 16px !important; }
    .page-wrap > main { order: 1; }
    .page-wrap > aside { order: 2; }
    .sidebar { position: static; top: auto; }
    .carousel-item img { height: 220px; }
    .carousel-caption { left: 16px; right: 16px; bottom: 16px; }
    .carousel-caption h2 { font-size: 1.3rem; }
    .product-actions, .cart-row { flex-wrap: wrap; }
    .info-panel, .review-form-card, .review-card { padding: 14px; }
}

@media (max-width: 480px) {
    .carousel-item img { height: 190px; }
    .carousel-caption h2 { font-size: 1.1rem; }
}
        `;
        document.head.appendChild(s);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
