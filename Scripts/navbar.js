// --------------------------
// navbar.js (Updated Navigation - Confirmed Separation)
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

/**
 * Closes all currently open navigation dropdown menus.
 */
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(content => {
        content.style.display = 'none';
    });
}

/**
 * Main routing logic based on URL parameters.
 * This function is called on load, navigation, and history changes.
 */
function handleRouting() {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get("search");
    const collectionQuery = params.get("collection");

    // Close any open dropdowns upon navigation
    closeAllDropdowns();

    if (searchQuery) {
        // Handle Search Route
        setView('database-view');

        if (typeof performSearch === "function") {
            performSearch(searchQuery.toLowerCase());
            const input = document.querySelector("#nav-search-form input");
            if (input) input.value = searchQuery;
        }
    } else if (collectionQuery) {
        // Handle Collection Route (Cases, Collections, or Souvenirs)
        setView('database-view');

        if (typeof renderCollectionPage === "function") {
            // Standardize query for reliable matching (trimming for safety)
            const standardizedQuery = collectionQuery.trim();

            // Filter skins for the requested collection (Case, Non-Case, or Souvenir)
            const collectionSkins = skinsData.filter(skin => {

                // 1. Check Case Collections (Items found in crates)
                // The query is matched against the Crate Name (e.g., "Glove Case")
                const isCrateSkin = (skin.crates || []).some(crate => crate.name === standardizedQuery);

                // Determine collection name for filtering
                const skinCollection = skin.collection || (skin.collections && skin.collections[0]);

                // 2. Check Non-Case Collections AND Souvenir Collections
                // The query is matched against the Collection Name (e.g., "The Rising Sun Collection")
                const isCollectionSkin = skinCollection && skinCollection.name === standardizedQuery;

                return isCrateSkin || isCollectionSkin;
            });

            // Render the page
            if (collectionSkins.length > 0 || collectionQuery) {
                renderCollectionPage(collectionSkins, collectionQuery);
            }
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

        // Build the Navbar and immediately call routing
        buildNavbar();
        handleRouting();

        // Handle back/forward navigation
        window.addEventListener("popstate", handleRouting);

    } catch (err) {
        console.error("Failed to load skins:", err);
    }
}

/**
 * Builds the navbar with three distinct dropdowns: Cases, Collections, and Souvenirs.
 */
function buildNavbar() {
    let nav = document.getElementById("buttons-container");
    if (!nav) return; // Ensure container exists

    nav.innerHTML = ""; // Clear existing content

    // --- 1. Home Button ---
    const homeBtn = createNavButton("Home", "index.html");
    nav.appendChild(homeBtn);

    // --- Data Grouping ---
    const collectionsData = groupCollections(skinsData);

    // --- 2. Cases Dropdown ---
    // Contains individual Crate names (Case under Case)
    const caseDropdown = createDropdown("Cases ▼", collectionsData.caseCollectionsMap);
    nav.appendChild(caseDropdown);

    // --- 3. Collections Dropdown (Non-Case) ---
    // Contains general collection names that aren't crates or souvenirs (Other Collections under Collections)
    const otherCollectionsDropdown = createDropdown("Collections ▼", collectionsData.otherCollectionsMap);
    nav.appendChild(otherCollectionsDropdown);

    // --- 4. Souvenirs Dropdown ---
    // Contains Souvenir package collection names (Souvenirs under Souvenir)
    const souvenirDropdown = createDropdown("Souvenirs ▼", collectionsData.souvenirPackagesMap);
    nav.appendChild(souvenirDropdown);

    // --- 5. Search Form ---
    const searchForm = document.createElement("form");
    searchForm.id = "nav-search-form";
    searchForm.style.display = "flex";
    searchForm.style.alignItems = "center";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search skins/weapons...";

    const searchBtn = document.createElement("button");
    searchBtn.type = "submit";
    searchBtn.textContent = "Search";
    searchBtn.style.marginLeft = "5px";

    searchForm.appendChild(searchInput);
    searchForm.appendChild(searchBtn);
    nav.appendChild(searchForm);

    // Search Logic
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();

        if (!query) {
             window.history.pushState(null, "", "index.html");
             handleRouting();
             return;
        }

        const newUrl = `?search=${encodeURIComponent(query)}`;
        window.history.pushState({ search: query }, "", newUrl);
        handleRouting();
    });
}

/**
 * Helper function to create a standard navigation button.
 */
function createNavButton(text, href) {
    const btn = document.createElement("a");
    btn.href = href;
    btn.textContent = text;
    btn.classList.add("button");
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState(null, "", btn.getAttribute('href'));
        handleRouting();
    });
    return btn;
}

/**
 * Helper function to create a dropdown menu.
 */
function createDropdown(title, map) {
    const dropdown = document.createElement("div");
    dropdown.classList.add("button", "dropdown");
    dropdown.textContent = title;
    const dropContent = document.createElement("div");
    dropContent.classList.add("dropdown-content");
    dropdown.appendChild(dropContent);

    // Populate the dropdown links
    Object.keys(map).sort().forEach(name => {
        const a = document.createElement("a");
        a.href = `?collection=${encodeURIComponent(name)}`;
        a.textContent = name;

        a.addEventListener('click', (e) => {
            e.preventDefault();
            const newUrl = a.getAttribute('href');
            window.history.pushState(null, "", newUrl);
            handleRouting();
            // Hide dropdown after selection (optional, but good UX)
            dropContent.style.display = "none";
        });
        dropContent.appendChild(a);
    });

    // Hover delay logic
    let timeout;
    dropdown.addEventListener("mouseenter", () => {
        // --- MUTUAL EXCLUSIVITY: Close others before opening this one ---
        closeAllDropdowns();
        clearTimeout(timeout);
        dropContent.style.display = "block";
    });

    dropdown.addEventListener("mouseleave", () => {
        // --- SHORTENED DELAY: 300ms -> 100ms ---
        timeout = setTimeout(() => {
            dropContent.style.display = "none";
        }, 100);
    });

    // Fallback click behavior for touch/non-hover devices
    dropdown.addEventListener("click", e => {
        if (e.target === dropdown) {
            e.preventDefault();
            const isCurrentlyOpen = dropContent.style.display === "block";

            // --- MUTUAL EXCLUSIVITY: Close all others ---
            closeAllDropdowns();

            // Only open if it was previously closed
            if (!isCurrentlyOpen) {
                dropContent.style.display = "block";
            }
        }
    });

    return dropdown;
}

/**
 * Filters the skin data into three distinct collection types: Cases (Crates),
 * Other Collections (General), and Souvenir Packages (Souvenir-specific collections).
 */
function groupCollections(skins) {
    const caseCollectionsMap = {}; // Case names (Glove Case, etc.)
    const otherCollectionsMap = {}; // Non-Case, Non-Souvenir Collection names (The Rising Sun Collection, etc.)
    const souvenirPackagesMap = {}; // Souvenir Package collection names (Souvenir Cobblestone Collection, etc.)

    skins.forEach(skin => {
        const isCase = (skin.crates || []).length > 0;
        const isSouvenirFlag = skin.souvenir;

        // Prioritize the singular 'collection' object, but fall back to the first item in the 'collections' array
        const collection = skin.collection || (skin.collections && skin.collections[0]);
        const collectionName = collection?.name;

        // Must have a collection name to proceed to Collection/Souvenir grouping
        if (!collectionName) return;

        // Determine Collection Type: Check flag OR check if the name contains "Souvenir" (case-insensitive)
        const isCollectionSouvenir = isSouvenirFlag || collectionName.toLowerCase().includes('souvenir');


        // 1. Souvenirs: Skins that belong to a Souvenir Collection. (Highest Priority)
        if (isCollectionSouvenir) {
             if (!souvenirPackagesMap[collectionName]) {
                 // Use the determined 'collection' object for the image
                 souvenirPackagesMap[collectionName] = collection.image || skin.image || '';
             }
             // Exclude from all other categories
             return;
        }

        // 2. Cases: Items that drop from a crate.
        if (isCase) {
            skin.crates.forEach(crate => {
                if (!caseCollectionsMap[crate.name]) {
                    caseCollectionsMap[crate.name] = crate.image || '';
                }
            });
        }

        // 3. Other Collections: Items that belong to a collection but are NOT Souvenirs AND NOT Case Drops.
        // We ensure exclusivity by checking for !isCase.
        if (!isCase && !otherCollectionsMap[collectionName]) {
             // Use the determined 'collection' object for the image
            otherCollectionsMap[collectionName] = collection.image || skin.image || '';
        }
    });

    return { caseCollectionsMap, otherCollectionsMap, souvenirPackagesMap };
}


/**
 * Performs a simple search on skin/weapon name and renders the results.
 */
function performSearch(query) {
    const results = skinsData.filter(skin =>
        skin.name.toLowerCase().includes(query) ||
        skin.weapon?.name?.toLowerCase().includes(query)
    );

    // This calls the rendering function exported by mainScript.js
    if (typeof renderSkins === "function" && typeof renderCollectionPage === "function") {
        renderCollectionPage(results, `Search Results for "${query}"`);
    }
}

loadSkins();
