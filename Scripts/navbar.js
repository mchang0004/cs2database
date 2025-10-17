// --------------------------
// navbar.js (FIXED for GitHub Pages)
// --------------------------

const SKINS_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";
let skinsData = [];

// Detect if we are on /database/index.html page
// Use the full path for a more reliable check on GitHub Pages
const currentPath = window.location.pathname;
const isDatabasePage = currentPath.toLowerCase().includes("/database/index.html");

async function loadSkins() {
    try {
        const res = await fetch(SKINS_URL);
        skinsData = await res.json();
        buildNavbar();

        // Handle ?search= query if user opened /database/index.html?search=...
        const params = new URLSearchParams(window.location.search);
        const searchQuery = params.get("search");
        const collectionQuery = params.get("collection");

        if (isDatabasePage) {
            if (searchQuery && typeof performSearch === "function") {
                performSearch(searchQuery.toLowerCase());
                const input = document.querySelector("#nav-search-form input");
                if (input) input.value = searchQuery;
            } else if (typeof renderCollectionPage === "function") {
                renderCollectionPage(skinsData, collectionQuery);
            }
        } else if (typeof renderAllCollectionsHome === "function") {
            renderAllCollectionsHome(skinsData);
        }

        // Handle back/forward navigation
        window.addEventListener("popstate", () => {
            const params = new URLSearchParams(window.location.search);
            const query = params.get("search");
            const collection = params.get("collection");

            if (query && typeof performSearch === "function") {
                performSearch(query.toLowerCase());
                const input = document.querySelector("#nav-search-form input");
                if (input) input.value = query;
            } else if (isDatabasePage && typeof renderCollectionPage === "function") {
                renderCollectionPage(skinsData, collection);
            } else if (typeof renderAllCollectionsHome === "function") {
                renderAllCollectionsHome(skinsData);
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

    const rootPrefix = isDatabasePage ? "../" : "";

    // Home Button
    const homeBtn = document.createElement("a");
    homeBtn.href = `${rootPrefix}index.html`;
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

    Object.keys(collectionsMap).sort().forEach(name => {
        const a = document.createElement("a");
        // FIX 1: Explicitly include index.html for GitHub Pages routing
        a.href = `/database/index.html?collection=${encodeURIComponent(name)}`;
        a.textContent = name;
        dropContent.appendChild(a);
    });

    // Hover delay
    let timeout;
    dropdown.addEventListener("mouseenter", () => {
        clearTimeout(timeout);
        dropContent.style.display = "block";
    });
    dropdown.addEventListener("mouseleave", () => {
        timeout = setTimeout(() => dropContent.style.display = "none", 300);
    });

    dropdown.addEventListener("click", e => {
        if (window.matchMedia("(hover: none)").matches) {
            e.preventDefault();
            dropContent.style.display = (dropContent.style.display === "block") ? "none" : "block";
        }
    });

    // Search form
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
    // Search Logic (Updated)
    // --------------------------
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        // Construct the new URL path, explicitly using index.html
        const newUrlPath = `/database/index.html?search=${encodeURIComponent(query)}`;

        if (!isDatabasePage) {
            // If not on the database page, navigate there
            window.location.href = newUrlPath;
            return;
        }

        // FIX 2: Use pushState to update the URL for sequential searches
        window.history.pushState({ search: query }, "", newUrlPath);

        // This is necessary to immediately render results without relying on popstate
        performSearch(query);
    });

}

// --------------------------
// Perform Search
// --------------------------
function performSearch(query) {
    const results = skinsData.filter(skin =>
        skin.name.toLowerCase().includes(query) ||
        skin.weapon?.name?.toLowerCase().includes(query)
    );

    if (typeof renderSkins === "function") {
        renderSkins(results, "items-container"); // Ensure container is database page container
    }
}

loadSkins();
