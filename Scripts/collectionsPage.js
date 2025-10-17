// collectionsPage.js

const SKINS_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";
let skinsData = [];

// Global map to track which condensed groups are currently selected (open)
let selectedCondensedGroups = new Map();

// Rarity Color Map for the group headers
const RARITY_COLORS = {
    "Covert": "#EB4B4B",         // Red
    "Classified": "#D32CE6",     // Pink/Purple
    "Restricted": "#8847FF",     // Blue/Purple
    "Mil-Spec Grade": "#4B69FF", // Light Blue
    "Industrial Grade": "#5E98D9",// Darker Blue
    "Consumer Grade": "#B0C3D9",   // Gray/White
    "Extraordinary": "#DDAA00",  // Gold/Yellow for gloves/knives rarity if found here
    "Contraband": "#FFCC66"
};


// --------------------------
// Rarity sorting order
// --------------------------
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

// --------------------------
// Wait for DOM ready
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadSkins().then(() => {
        showCollectionFromURL();
    });
});

// --------------------------
// Fetch skins JSON
// --------------------------
async function loadSkins() {
    try {
        const res = await fetch(SKINS_URL);
        skinsData = await res.json();

        buildNavbar();
        renderHomeSkins();
    } catch (err) {
        console.error("Error loading skins:", err);
    }
}

// --------------------------
// Build navbar
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

    // Home button
    const homeBtn = document.createElement("a");
    homeBtn.href = "/";
    homeBtn.textContent = "Home";
    homeBtn.classList.add("button");
    nav.appendChild(homeBtn);

    // Collections dropdown
    const dropdown = document.createElement("div");
    dropdown.classList.add("button", "dropdown");
    dropdown.textContent = "Collections ▼";

    const dropContent = document.createElement("div");
    dropContent.classList.add("dropdown-content");
    dropdown.appendChild(dropContent);
    nav.appendChild(dropdown);

    // Extract unique collections (excluding souvenirs)
    const collectionsMap = {};
    skinsData.forEach(skin => {
        if (skin.crates && skin.crates.length > 0) {
            skin.crates.forEach(crate => {
                if (!crate.name.toLowerCase().includes("souvenir")) {
                    collectionsMap[crate.name] = true;
                }
            });
        }
    });

    Object.keys(collectionsMap).sort().forEach(collectionName => {
        const a = document.createElement("a");
        a.href = `?collection=${encodeURIComponent(collectionName)}`;
        a.textContent = collectionName;
        dropContent.appendChild(a);
    });

    // Search bar
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

    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        const results = skinsData.filter(skin =>
            skin.name.toLowerCase().includes(query) ||
            skin.weapon?.name?.toLowerCase().includes(query)
        );

        renderSkins(results, "collections-list");
    });

    // Dropdown hover/click behavior
    let timeout;
    dropdown.addEventListener("mouseenter", () => {
        clearTimeout(timeout);
        dropContent.style.display = "block";
    });
    dropdown.addEventListener("mouseleave", () => {
        timeout = setTimeout(() => {
            dropContent.style.display = "none";
        }, 300);
    });
    dropdown.addEventListener("click", () => {
        dropContent.style.display = dropContent.style.display === "block" ? "none" : "block";
    });
}

// --------------------------
// Render home skins
// --------------------------
function renderHomeSkins() {
    ensureCollectionElements();
    renderSkins(skinsData, "collections-list");
}

// --------------------------
// Ensure elements exist (FIXED PARENTING)
// --------------------------
function ensureCollectionElements() {
    const contentParent = document.getElementById("collections-page");

    if (!contentParent) {
        console.error("The #collections-page section is missing from the HTML.");
        return;
    }

    // 1. Handle the Title (h1)
    let titleEl = document.querySelector("h1");
    if (!titleEl) {
        titleEl = document.createElement("h1");
        contentParent.prepend(titleEl);
    }

    // 2. Handle the Skins Container (#collections-list)
    let container = document.getElementById("collections-list");
    if (!container) {
        container = document.createElement("div");
        container.id = "collections-list";
        contentParent.appendChild(container);
    }
}

// --------------------------
// Generic render function (UPDATED FOR TASKBAR)
// --------------------------
function renderSkins(skins, containerId) {
    ensureCollectionElements();

    const container = document.getElementById(containerId);
    container.innerHTML = ""; // Clear the main container

    // Clear and reset the global state map when loading a new collection
    selectedCondensedGroups.clear();

    if (!skins || skins.length === 0) {
        container.textContent = "No skins found.";
        return;
    }

    // Sort skins
    skins.sort((a, b) => {
        const aCategory = a.category?.name || "";
        const bCategory = b.category?.name || "";
        const aRarity = a.rarity?.name || "";
        const bRarity = b.rarity?.name || "";

        const aKey = rarityOrder[aCategory] ?? rarityOrder[aRarity] ?? 999;
        const bKey = rarityOrder[bCategory] ?? rarityOrder[bRarity] ?? 999;
        return aKey - bKey;
    });

    // Group skins
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

    // --- Separate Condensed Groups from Regular Groups ---
    const condensedGroups = {};
    const regularGroups = {};

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
    // Initial call to hide it if nothing is selected
    updateCentralDropdown();

    // 3. Render Regular Groups below (using old collapsible header logic)
    Object.keys(regularGroups).forEach(group => {
        renderRegularGroup(group, regularGroups[group], container);
    });
}

// --------------------------
// Renders the horizontal taskbar for Knives/Gloves (WITH EMPTY CHECK)
// --------------------------
function renderTaskbarGroup(condensedGroups, mainContainer) {
    let taskbar = document.getElementById("condensed-taskbar");
    if (taskbar) taskbar.remove(); // Remove old taskbar if switching collections

    // ⭐ START OF NEW LOGIC: Check if the condensedGroups object is empty
    const groupNames = Object.keys(condensedGroups);
    if (groupNames.length === 0) {
        return; // Exit the function, preventing the taskbar from being created.
    }
    // ⭐ END OF NEW LOGIC

    // Continue only if groups exist
    taskbar = document.createElement("div");
    taskbar.id = "condensed-taskbar";
    taskbar.style.display = "flex";
    taskbar.style.flexWrap = "wrap";
    taskbar.style.gap = "10px";
    taskbar.style.padding = "10px";
    taskbar.style.marginBottom = "20px";
    taskbar.style.backgroundColor = "#1a1a1a";
    taskbar.style.borderRadius = "5px";

    Object.keys(condensedGroups).forEach(groupName => {
        const groupSkins = condensedGroups[groupName];
        const representativeSkin = groupSkins[0]; // Get the first skin for the image

        const btn = document.createElement("div");
        btn.classList.add("button", "taskbar-button");
        btn.style.cursor = "pointer";
        btn.style.padding = "8px";
        btn.style.borderRadius = "5px";
        btn.style.backgroundColor = "#333";
        btn.style.transition = "background-color 0.2s, color 0.2s";
        btn.style.display = "flex";
        btn.style.flexDirection = "column"; // Stack image and text
        btn.style.alignItems = "center";
        btn.style.width = "140px"; // Fixed width
        btn.style.height = "120px"; // Fixed height


        // Add Image
        const img = document.createElement("img");
        img.src = representativeSkin.image;
        img.alt = groupName;
        img.style.width = "80px";
        img.style.height = "auto";
        img.style.borderRadius = "3px";
        img.style.marginBottom = "5px";
        img.loading = "lazy";

        // Add Text Label
        const label = document.createElement("span");
        label.textContent = `${groupName} (${groupSkins.length})`;
        label.style.fontSize = "12px";
        label.style.textAlign = "center";
        label.style.color = "#ccc";

        btn.appendChild(img);
        btn.appendChild(label);

        // Initial state check
        if (selectedCondensedGroups.has(groupName)) {
            btn.style.backgroundColor = "#555";
        }

        btn.addEventListener("click", () => {
            if (selectedCondensedGroups.has(groupName)) {
                selectedCondensedGroups.delete(groupName); // Deselect
                btn.style.backgroundColor = "#333";
            } else {
                selectedCondensedGroups.set(groupName, groupSkins); // Select
                btn.style.backgroundColor = "#555";
            }
            updateCentralDropdown();
        });

        taskbar.appendChild(btn);
    });

    // Insert the taskbar *before* the main container content
    mainContainer.prepend(taskbar);
}

// --------------------------
// Consolidates and renders all selected skins in the central area
// --------------------------
function updateCentralDropdown() {
    let dropdownContainer = document.getElementById("central-skins-dropdown");
    if (!dropdownContainer) return;

    dropdownContainer.innerHTML = "";

    const allSkinsToDisplay = [];
    selectedCondensedGroups.forEach(skins => {
        // Collect all skins from all currently selected groups
        allSkinsToDisplay.push(...skins);
    });

    if (allSkinsToDisplay.length === 0) {
        dropdownContainer.style.display = "none";
        return;
    }

    // 1. Configure the dropdown's appearance (pushes other content down)
    dropdownContainer.style.display = "block";
    dropdownContainer.style.marginTop = "15px";
    dropdownContainer.style.marginBottom = "30px"; // Extra space below dropdown
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

// --------------------------
// Renders regular (non-condensed) groups
// --------------------------
function renderRegularGroup(groupName, groupSkins, container) {
    const section = document.createElement("div");
    section.style.marginBottom = "15px";

    const header = document.createElement("div");
    header.textContent = groupName;
    header.style.cursor = "pointer";
    header.style.fontWeight = "bold";

    // Set color based on the rarity group name
    header.style.color = RARITY_COLORS[groupName] || "#CCCCCC";

    header.style.backgroundColor = "#222";
    header.style.padding = "8px 12px";
    header.style.borderRadius = "5px";

    const skinsList = document.createElement("div");
    skinsList.style.display = "none"; // hidden by default
    skinsList.style.marginTop = "5px";
    skinsList.style.display = "flex";
    skinsList.style.flexWrap = "wrap";
    skinsList.style.gap = "10px";

    groupSkins.forEach(skin => {
        const card = document.createElement("div");
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

// --------------------------
// Render collection from URL
// --------------------------
function showCollectionFromURL() {
    ensureCollectionElements();

    const params = new URLSearchParams(window.location.search);
    const collectionName = params.get("collection");
    const titleEl = document.querySelector("h1");

    if (!collectionName) {
        titleEl.textContent = "All Skins";
        renderSkins(skinsData, "collections-list");
        return;
    }

    const filtered = skinsData.filter(skin =>
        (skin.crates && skin.crates.some(c => c.name === collectionName)) ||
        (skin.collections && skin.collections.some(c => c.name === collectionName))
    );

    if (filtered.length === 0) {
        titleEl.textContent = `No items found for "${collectionName}"`;
        document.getElementById("collections-list").innerHTML = "";
        return;
    }

    titleEl.textContent = `Collection: ${collectionName}`;
    renderSkins(filtered, "collections-list");
}

ensureCollectionElements();
