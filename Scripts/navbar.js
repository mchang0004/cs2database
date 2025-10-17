// --------------------------
// navbar.js (Consolidated Routing) - FIXED HOVER DELAY
// --------------------------

const SKINS_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";
let skinsData = [];

// Helper function to show the correct content section
function setView(viewId) {
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('database-view').style.display = 'none';
    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.style.display = 'block';
    }
}

function handleRouting() {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get("search");
    const collectionQuery = params.get("collection");

    if (searchQuery) {
        // Show database view for search results
        setView('database-view');

        if (typeof performSearch === "function") {
            performSearch(searchQuery.toLowerCase());
            const input = document.querySelector("#nav-search-form input");
            if (input) input.value = searchQuery;
        }
    } else if (collectionQuery) {
        // Show database view for collection
        setView('database-view');

        if (typeof renderCollectionPage === "function") {
            // Filter skins for the requested collection
            const collectionSkins = skinsData.filter(skin =>
                skin.collection?.name === collectionQuery ||
                (skin.crates || []).some(crate => crate.name === collectionQuery)
            );
            renderCollectionPage(collectionSkins, collectionQuery);
        }
    } else {
        // Default to home view (all collections list)
        setView('home-view');
        if (typeof renderAllCollectionsHome === "function") {
            renderAllCollectionsHome(skinsData);
        }
    }
}

async function loadSkins() {
    try {
        const res = await fetch(SKINS_URL);
        skinsData = await res.json();
        buildNavbar();

        // Initial routing setup
        handleRouting();

        // Handle back/forward navigation
        window.addEventListener("popstate", () => {
            handleRouting();
            // Clear search input if not on a search query
            const params = new URLSearchParams(window.location.search);
            if (!params.get("search")) {
                const input = document.querySelector("#nav-search-form input");
                if (input) input.value = '';
            }
        });

    } catch (err) {
        console.error("Failed to load skins:", err);
    }
}

// --------------------------
// Build Navbar
// --------------------------
function buildNavbar() {
    let nav = document.getElementById("buttons-container");
    if (!nav) {
        nav = document.createElement("div");
        nav.id = "buttons-container";
        document.body.prepend(nav);
    } else {
        nav.innerHTML = "";
    }

    // Home Button
    const homeBtn = document.createElement("a");
    homeBtn.href = "index.html"; // Link back to the clean root URL
    homeBtn.textContent = "Home";
    homeBtn.classList.add("button");
    nav.appendChild(homeBtn);

    // Collections Dropdown
    const dropdown = document.createElement("div");
    dropdown.classList.add("button", "dropdown");
    dropdown.textContent = "Collections ▼";
    const dropContent = document.createElement("div");
    dropContent.classList.add("dropdown-content");
    dropdown.appendChild(dropContent);
    nav.appendChild(dropdown);

    const collectionsMap = {};
    // ... (logic to populate collectionsMap remains the same)
    skinsData.forEach(skin => {
        if (skin.crates && skin.crates.length > 0 && !skin.souvenir) {
            skin.crates.forEach(crate => {
                collectionsMap[crate.name] = crate.image;
            });
        }
        if (skin.collection && skin.collection.name) {
            const name = skin.collection.name;
            if (!collectionsMap[name]) {
                collectionsMap[name] = skin.collection.image || '';
            }
        }
    });

    // ... (logic to create collection links remains the same)
    Object.keys(collectionsMap).sort().forEach(name => {
        const a = document.createElement("a");
        // Link to the homepage with a collection query
        a.href = `?collection=${encodeURIComponent(name)}`;

        // Add a click handler to intercept and use pushState for SPA feel
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const newUrl = a.getAttribute('href');
            window.history.pushState(null, "", newUrl);
            handleRouting(); // Reroute immediately
        });

        a.textContent = name;
        dropContent.appendChild(a);
    });

    // --------------------------
    // HOVER DELAY FIX START
    // --------------------------
    let timeout;
    dropdown.addEventListener("mouseenter", () => {
        clearTimeout(timeout); // Clear any pending hide operation
        dropContent.style.display = "block";
    });

    dropdown.addEventListener("mouseleave", () => {
        // Set a timeout to hide the dropdown after 300ms
        timeout = setTimeout(() => {
            dropContent.style.display = "none";
        }, 300); // 300 milliseconds delay
    });
    // --------------------------
    // HOVER DELAY FIX END
    // --------------------------

    // Fallback click behavior for touch/non-hover devices
    dropdown.addEventListener("click", e => {
        // Prevent navigating on click if it's a touch device or the link is just a toggle
        if (window.matchMedia("(hover: none)").matches || e.target === dropdown) {
            e.preventDefault();
            dropContent.style.display = (dropContent.style.display === "block") ? "none" : "block";
        }
    });


    // Search form elements remain the same
    const searchForm = document.createElement("form");
    searchForm.id = "nav-search-form";
    searchForm.style.display = "flex";
    searchForm.style.alignItems = "center";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search...";

    const searchBtn = document.createElement("button");
    searchBtn.type = "submit";
    searchBtn.textContent = "Search";
    searchBtn.style.marginLeft = "5px";

    searchForm.appendChild(searchInput);
    searchForm.appendChild(searchBtn);
    nav.appendChild(searchForm);

    // --------------------------
    // Search Logic
    // --------------------------
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();

        // If query is empty, treat it as a request to go home
        if (!query) {
             window.history.pushState(null, "", "index.html");
             handleRouting();
             return;
        }

        const newUrl = `?search=${encodeURIComponent(query)}`;

        window.history.pushState({ search: query }, "", newUrl);
        handleRouting(); // Reroute immediately
    });
}

// --------------------------
// Perform Search (Logic remains the same)
// --------------------------
function performSearch(query) {
    const results = skinsData.filter(skin =>
        skin.name.toLowerCase().includes(query) ||
        skin.weapon?.name?.toLowerCase().includes(query)
    );

    // renderSkins should target the 'items-container' within the 'database-view'
    if (typeof renderSkins === "function") {
        renderSkins(results, "items-container");
    }
}

loadSkins();
