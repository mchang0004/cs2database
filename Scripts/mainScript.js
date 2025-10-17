// --------------------------
// mainScript.js (Consolidated and Refactored)
// --------------------------

// --- GLOBAL CONSTANTS & DATA ---

// Rarity Color Map for the group headers
const RARITY_COLORS = {
    "Covert": "#EB4B4B",         // Red
    "Classified": "#D32CE6",     // Pink/Purple
    "Restricted": "#8847FF",     // Blue/Purple
    "Mil-Spec Grade": "#4B69FF", // Light Blue
    "Industrial Grade": "#5E98D9",// Darker Blue
    "Consumer Grade": "#B0C3D9",   // Gray/White
    "Extraordinary": "#DDAA00",  // Gold/Yellow
    "Contraband": "#FFCC66"
};

// Rarity sorting order
const rarityOrder = {
    "Knives": 0,
    "Gloves": 1,
    "Extraordinary": 2,
    "Contraband": 3,
    "Covert": 4,
    "Classified": 5,
    "Restricted": 6,
    "Mil-Spec Grade": 7,
    "Industrial Grade": 8,
    "Consumer Grade": 9
};

// Global map to track which condensed groups are currently selected (open)
let selectedCondensedGroups = new Map();

// --- GLOBAL EXPOSED RENDERING FUNCTIONS ---
// These functions are called by navbar.js's handleRouting logic.

/**
 * Renders the Home View: Two columns of collection links.
 * This replaces the logic previously in homeCollections.js.
 * @param {Array} skinsData - The full skins data array.
 */
function renderAllCollectionsHome(skinsData) {
    ensureViewElements('home-view'); // Ensure necessary containers are ready

    const mainContainer = document.getElementById("allcollections-list");
    if (!mainContainer) return;

    // 1. CLEAR AND STYLE THE MAIN CONTAINER
    mainContainer.innerHTML = "";
    mainContainer.style.display = "flex";
    mainContainer.style.justifyContent = "space-around";
    mainContainer.style.gap = "40px";
    mainContainer.style.padding = "20px 0";

    // 2. CREATE THE TWO COLUMN CONTAINERS
    const caseColumn = document.createElement('div');
    caseColumn.style.flex = "1";
    caseColumn.innerHTML = "<h2>Case Collections</h2>";
    const caseListContainer = document.createElement('div');
    caseListContainer.style.display = "flex";
    caseListContainer.style.flexDirection = "column";
    caseListContainer.style.gap = "15px";
    caseColumn.appendChild(caseListContainer);

    const nonCaseColumn = document.createElement('div');
    nonCaseColumn.style.flex = "1";
    nonCaseColumn.innerHTML = "<h2>Other Collections</h2>";
    const nonCaseListContainer = document.createElement('div');
    nonCaseListContainer.style.display = "flex";
    nonCaseListContainer.style.flexDirection = "column";
    nonCaseListContainer.style.gap = "15px";
    nonCaseColumn.appendChild(nonCaseListContainer);

    // 3. DATA FILTERING
    const caseCollectionsMap = {};
    const nonCaseCollectionsMap = {};

    skinsData.forEach(skin => {
        // --- CASE COLLECTIONS (Items found in crates) ---
        if (skin.crates && skin.crates.length > 0 && !skin.souvenir) {
            skin.crates.forEach(crate => {
                if (!caseCollectionsMap[crate.name]) {
                    caseCollectionsMap[crate.name] = crate.image;
                }
            });
        }

        // --- NON-CASE COLLECTIONS (Items with a collection array, but no crates) ---
        if (skin.collections && skin.collections.length > 0 && (!skin.crates || skin.crates.length === 0)) {
            skin.collections.forEach(collection => {
                const name = collection.name;
                const img = collection.image || skin.image;

                if (!nonCaseCollectionsMap[name]) {
                    nonCaseCollectionsMap[name] = img;
                }
            });
        }
    });

    // 4. RENDERING HELPER FUNCTION (Modified to use single-page routing)
    const renderList = (map, container) => {
        Object.entries(map).forEach(([name, img]) => {
            const link = document.createElement("a");
            // Use query parameters for routing on the single page
            link.href = `?collection=${encodeURIComponent(name)}`;

            // Add click handler for SPA navigation (called by navbar.js or handleRouting)
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.pushState(null, "", link.getAttribute('href'));
                // Call the router function exposed by navbar.js
                if (typeof handleRouting === 'function') handleRouting();
            });

            link.style.display = "flex";
            link.style.alignItems = "center";
            link.style.textDecoration = "none";
            link.style.color = "#8aa89e";
            link.style.border = "1px solid #333";
            link.style.borderRadius = "10px";
            link.style.padding = "10px";
            link.style.backgroundColor = "#111";

            const image = document.createElement("img");
            image.src = img;
            image.alt = name;
            image.style.width = "190px";
            image.style.height = "150px";
            image.style.borderRadius = "5px";
            image.style.marginRight = "20px";
            image.style.objectFit = "cover";
            image.loading = "lazy";

            const title = document.createElement("p");
            title.textContent = name;
            title.style.fontSize = "16px";
            title.style.fontWeight = "bold";

            link.appendChild(image);
            link.appendChild(title);
            container.appendChild(link);
        });
    };

    // 5. EXECUTE RENDERING
    renderList(caseCollectionsMap, caseListContainer);
    renderList(nonCaseCollectionsMap, nonCaseListContainer);

    // 6. ATTACH THE TWO COLUMNS TO THE MAIN CONTAINER
    mainContainer.appendChild(caseColumn);
    mainContainer.appendChild(nonCaseColumn);
}


/**
 * Renders the Database View for a specific collection.
 * This replaces the logic previously in collectionsPage.js/showCollectionFromURL.
 * NOTE: The array is passed already filtered by navbar.js
 * * @param {Array} filteredSkins - The skins array already filtered by collection.
 * @param {string} collectionName - The name of the collection/search query.
 */
function renderCollectionPage(filteredSkins, collectionName) {
    ensureViewElements('database-view');

    const titleEl = document.getElementById("collection-title");
    const container = document.getElementById("items-container");

    container.innerHTML = ""; // Clear the content

    // Determine the title based on the context
    let titleText = collectionName.startsWith("Search") ? collectionName : `Collection: ${collectionName}`;
    titleEl.textContent = titleText;

    if (!filteredSkins || filteredSkins.length === 0) {
        titleEl.textContent = `No items found for "${collectionName}"`;
        return;
    }

    // Call the generic renderer
    renderSkins(filteredSkins, "items-container");
}

/**
 * Generic function to render a list of skins, called by both search and collection views.
 * Renamed to renderSkins (used by renderCollectionPage/performSearch logic).
 * * @param {Array} skins - The array of skins to display.
 * @param {string} containerId - The ID of the container element.
 */
function renderSkins(skins, containerId) {
    ensureViewElements('database-view');

    const container = document.getElementById(containerId);
    container.innerHTML = "";
    selectedCondensedGroups.clear(); // Reset condensed group state

    if (!skins || skins.length === 0) {
        container.textContent = "No skins found.";
        return;
    }

    // --- SORTING ---
    skins.sort((a, b) => {
        const aCategory = a.category?.name || "";
        const bCategory = b.category?.name || "";
        const aRarity = a.rarity?.name || "";
        const bRarity = b.rarity?.name || "";

        const aKey = rarityOrder[aCategory] ?? rarityOrder[aRarity] ?? 999;
        const bKey = rarityOrder[bCategory] ?? rarityOrder[bRarity] ?? 999;
        return aKey - bKey;
    });

    // --- GROUPING ---
    const grouped = {};
    skins.forEach(skin => {
        let groupName;
        const category = skin.category?.name;

        // Group Knives/Gloves by Weapon Name, others by Rarity
        if (category === "Knives" || category === "Gloves") {
            groupName = skin.weapon?.name || category;
        } else {
            groupName = skin.rarity?.name || "Unknown";
        }

        if (!grouped[groupName]) grouped[groupName] = [];
        grouped[groupName].push(skin);
    });

    const condensedGroups = {}; // Knives/Gloves (Taskbar)
    const regularGroups = {};   // Others (Dropdown)

    Object.keys(grouped).forEach(group => {
        const isCondensed = grouped[group][0].category?.name === "Knives" || grouped[group][0].category?.name === "Gloves";

        if (isCondensed) {
            condensedGroups[group] = grouped[group];
        } else {
            regularGroups[group] = grouped[group];
        }
    });

    // 1. Render the Taskbar for Knives/Gloves
    renderTaskbarGroup(condensedGroups, container);

    // 2. Render the Central Dropdown Container
    let dropdownContainer = document.getElementById("central-skins-dropdown");
    if (!dropdownContainer) {
        dropdownContainer = document.createElement("div");
        dropdownContainer.id = "central-skins-dropdown";
        container.appendChild(dropdownContainer);
    }
    updateCentralDropdown(); // Initial call

    // 3. Render Regular Groups below
    Object.keys(regularGroups).forEach(group => {
        renderRegularGroup(group, regularGroups[group], container);
    });
}


// --- INTERNAL RENDERING/HELPER FUNCTIONS ---

/**
 * Ensures the necessary parent elements for the active view exist (not strictly needed
 * now since they are in the HTML, but good for dynamic rendering).
 * @param {string} viewId - 'home-view' or 'database-view'
 */
function ensureViewElements(viewId) {
    // Since the required sections/divs are now hardcoded in index.html,
    // this function primarily serves as a placeholder to confirm structure.
    const container = document.getElementById(viewId);
    if (!container) {
        console.error(`Required view section #${viewId} is missing from the HTML.`);
    }
}

/**
 * Renders the horizontal taskbar for Knives/Gloves.
 */
function renderTaskbarGroup(condensedGroups, mainContainer) {
    let taskbar = document.getElementById("condensed-taskbar");
    if (taskbar) taskbar.remove();

    const groupNames = Object.keys(condensedGroups);
    if (groupNames.length === 0) return;

    taskbar = document.createElement("div");
    taskbar.id = "condensed-taskbar";
    // Apply styling
    taskbar.style.display = "flex";
    taskbar.style.flexWrap = "wrap";
    taskbar.style.gap = "10px";
    taskbar.style.padding = "10px";
    taskbar.style.marginBottom = "20px";
    taskbar.style.backgroundColor = "#1a1a1a";
    taskbar.style.borderRadius = "5px";

    Object.keys(condensedGroups).forEach(groupName => {
        const groupSkins = condensedGroups[groupName];
        const representativeSkin = groupSkins[0];

        const btn = document.createElement("div");
        btn.classList.add("button", "taskbar-button");
        // Apply styling
        btn.style.cursor = "pointer";
        btn.style.padding = "8px";
        btn.style.borderRadius = "5px";
        btn.style.backgroundColor = "#333";
        btn.style.transition = "background-color 0.2s, color 0.2s";
        btn.style.display = "flex";
        btn.style.flexDirection = "column";
        btn.style.alignItems = "center";
        btn.style.width = "140px";
        btn.style.height = "120px";

        const img = document.createElement("img");
        img.src = representativeSkin.image;
        img.alt = groupName;
        img.style.width = "80px";
        img.style.height = "auto";
        img.style.borderRadius = "3px";
        img.style.marginBottom = "5px";
        img.loading = "lazy";

        const label = document.createElement("span");
        label.textContent = `${groupName} (${groupSkins.length})`;
        label.style.fontSize = "12px";
        label.style.textAlign = "center";
        label.style.color = "#ccc";

        btn.appendChild(img);
        btn.appendChild(label);

        if (selectedCondensedGroups.has(groupName)) {
            btn.style.backgroundColor = "#555";
        }

        btn.addEventListener("click", () => {
            if (selectedCondensedGroups.has(groupName)) {
                selectedCondensedGroups.delete(groupName);
                btn.style.backgroundColor = "#333";
            } else {
                selectedCondensedGroups.set(groupName, groupSkins);
                btn.style.backgroundColor = "#555";
            }
            updateCentralDropdown();
        });

        taskbar.appendChild(btn);
    });

    // Insert before the main content
    mainContainer.prepend(taskbar);
}

/**
 * Consolidates and renders all selected skins in the central dropdown area.
 */
function updateCentralDropdown() {
    let dropdownContainer = document.getElementById("central-skins-dropdown");
    if (!dropdownContainer) return;

    dropdownContainer.innerHTML = "";

    const allSkinsToDisplay = [];
    selectedCondensedGroups.forEach(skins => {
        allSkinsToDisplay.push(...skins);
    });

    if (allSkinsToDisplay.length === 0) {
        dropdownContainer.style.display = "none";
        return;
    }

    // Configure the dropdown's appearance
    dropdownContainer.style.display = "block";
    dropdownContainer.style.marginTop = "15px";
    dropdownContainer.style.marginBottom = "30px";
    dropdownContainer.style.padding = "10px";
    dropdownContainer.style.backgroundColor = "#111";
    dropdownContainer.style.border = "1px solid #444";
    dropdownContainer.style.borderRadius = "10px";

    const skinsList = document.createElement("div");
    skinsList.style.display = "flex";
    skinsList.style.flexWrap = "wrap";
    skinsList.style.gap = "10px";
    skinsList.style.justifyContent = "flex-start";

    // Re-use the card rendering logic
    allSkinsToDisplay.forEach(skin => {
        const card = document.createElement("div");
        // Card styling
        card.style.border = "1px solid #333";
        card.style.padding = "8px";
        card.style.backgroundColor = "#222";
        card.style.borderRadius = "10px";
        card.style.color = "#8aa89e";
        card.style.width = "180px";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.alignItems = "center";

        const img = document.createElement("img");
        img.src = skin.image;
        img.alt = skin.name;
        img.style.width = "160px";
        img.style.borderRadius = "5px";
        img.loading = "lazy";

        const name = document.createElement("p");
        name.textContent = skin.name;
        name.style.textAlign = "center";
        name.style.fontSize = "14px";
        name.style.color = skin.rarity?.color || "#ccc";

        card.appendChild(img);
        card.appendChild(name);
        skinsList.appendChild(card);
    });

    dropdownContainer.appendChild(skinsList);
}

/**
 * Renders regular (non-condensed) groups with collapsible headers.
 */
function renderRegularGroup(groupName, groupSkins, container) {
    const section = document.createElement("div");
    section.style.marginBottom = "15px";

    const header = document.createElement("div");
    header.textContent = groupName;
    // Header styling
    header.style.cursor = "pointer";
    header.style.fontWeight = "bold";
    header.style.color = RARITY_COLORS[groupName] || "#CCCCCC";
    header.style.backgroundColor = "#222";
    header.style.padding = "8px 12px";
    header.style.borderRadius = "5px";

    const skinsList = document.createElement("div");
    // List styling (Default to visible here for simplicity, or set to 'none' and toggle)
    skinsList.style.display = "flex";
    skinsList.style.marginTop = "5px";
    skinsList.style.flexWrap = "wrap";
    skinsList.style.gap = "10px";

    groupSkins.forEach(skin => {
        const card = document.createElement("div");
        // Card styling
        card.style.border = "1px solid #333";
        card.style.padding = "8px";
        card.style.backgroundColor = "#111";
        card.style.borderRadius = "10px";
        card.style.color = "#8aa89e";
        card.style.width = "180px";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.alignItems = "center";

        const img = document.createElement("img");
        img.src = skin.image;
        img.alt = skin.name;
        img.style.width = "160px";
        img.style.borderRadius = "5px";
        img.loading = "lazy";

        const name = document.createElement("p");
        name.textContent = skin.name;
        name.style.textAlign = "center";
        name.style.fontSize = "14px";
        name.style.color = skin.rarity?.color || "#ccc";

        card.appendChild(img);
        card.appendChild(name);
        skinsList.appendChild(card);
    });

    // Toggle display on click
    header.addEventListener("click", () => {
        skinsList.style.display = skinsList.style.display === "none" ? "flex" : "none";
    });

    section.appendChild(header);
    section.appendChild(skinsList);
    container.appendChild(section);
}
