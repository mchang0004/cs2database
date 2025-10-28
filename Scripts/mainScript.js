// --------------------------
// mainScript.js (Consolidated and Refactored)
// --------------------------

// --- GLOBAL CONSTANTS & DATA ---

// Rarity Color Map for the group headers
const RARITY_COLORS = {
    "Covert": "#EB4B4B",           // Red
    "Classified": "#D32CE6",       // Pink/Purple
    "Restricted": "#8847FF",       // Blue/Purple
    "Mil-Spec Grade": "#4B69FF", // Light Blue
    "Industrial Grade": "#5E98D9",// Darker Blue
    "Consumer Grade": "#B0C3D9",     // Gray/White
    "Extraordinary": "#DDAA00",   // Gold/Yellow
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


function expandDopplerVariants(skins) {
    // Variant recognition by pattern/phase text
    const variantMap = {
        "ruby": "Ruby",
        "sapphire": "Sapphire",
        "black pearl": "Black Pearl",
        "phase 1": "Phase 1",
        "phase 2": "Phase 2",
        "phase 3": "Phase 3",
        "phase 4": "Phase 4",
        "emerald": "Emerald"
    };

    // Optional pattern ID fallback mapping (used by CS2 data)
    const patternIdMap = {
        415: "Phase 1",
        416: "Phase 2",
        417: "Phase 3",
        418: "Phase 4",
        419: "Ruby",
        420: "Sapphire",
        421: "Black Pearl",
        568: "Emerald"
    };

    return skins.map(skin => {
        const lowerName = skin.name?.toLowerCase() || "";
        const lowerFinish = (skin.finish || skin.finish_name || skin.phase || "").toLowerCase();
        let variant = "";

        // Check if it's a Doppler-type skin
        const isDoppler = lowerName.includes("doppler");
        if (!isDoppler) return { ...skin, display_name: skin.name };

        // Try to detect from finish text
        for (const key in variantMap) {
            if (lowerFinish.includes(key)) {
                variant = variantMap[key];
                break;
            }
        }

        // Try pattern id fallback
        if (!variant && skin.pattern && patternIdMap[skin.pattern]) {
            variant = patternIdMap[skin.pattern];
        }

        // If still nothing, leave it as plain Doppler
        if (!variant) variant = "Unknown Variant";

        // Build new display name
        const displayName = `${skin.name} | ${variant}`;

        // Optionally adjust the image if variant-specific images exist
        // e.g., /database/collections/Doppler/img/Doppler_Ruby.png
        let image = skin.image;
        const variantImagePath = `/database/variants/${skin.name.replace(/\s+/g, "_")}_${variant.replace(/\s+/g, "_")}.png`;
        // if that path exists in your hosting setup, you can enable this:
        // image = variantImagePath;

        return {
            ...skin,
            display_name: displayName,
            variant_name: variant,
            image
        };
    });
}

/**
 * Renders a "Similar Cases" bar above the collection view
 * showing all other cases that contain the same knives.
 * @param {Array} allSkins - The full dataset (needed for case comparison).
 * @param {Array} currentSkins - The skins in the current collection.
 * @param {string} containerId - The ID of the database-view container.
 */
 function renderSimilarCasesBar(allSkins, currentSkins, containerId) {
     const currentKnifeNames = new Set(
         currentSkins
             .filter(s => s.category?.name === "Knives")
             .map(s => s.weapon?.name || s.name)
     );

     if (currentKnifeNames.size === 0) return;

     // Map of caseName -> knifeNames
     const caseMap = {};
     allSkins.forEach(skin => {
         if (skin.crates && skin.category?.name === "Knives") {
             skin.crates.forEach(crate => {
                 if (!caseMap[crate.name]) caseMap[crate.name] = new Set();
                 caseMap[crate.name].add(skin.weapon?.name || skin.name);
             });
         }
     });

     // Find cases with shared knives
     const similarCases = [];
     for (const [caseName, knives] of Object.entries(caseMap)) {
         const overlap = [...knives].some(k => currentKnifeNames.has(k));
         if (overlap) similarCases.push(caseName);
     }

     if (similarCases.length <= 1) return;

     const parent = document.getElementById(containerId);
     if (!parent) return;

     let existingBar = document.getElementById("similar-cases-bar");
     if (existingBar) existingBar.remove();

     const bar = document.createElement("div");
     bar.id = "similar-cases-bar";
     bar.style.display = "flex";
     bar.style.flexWrap = "wrap";
     bar.style.gap = "10px";
     bar.style.padding = "8px";
     bar.style.margin = "12px 0 20px";
     bar.style.background = "#151515";
     bar.style.borderRadius = "8px";
     bar.style.border = "1px solid #333";

     const title = document.createElement("h3");
     title.textContent = "Similar Cases:";
     title.style.color = "#eee";
     title.style.fontSize = "1rem";
     title.style.marginRight = "8px";
     bar.appendChild(title);

     similarCases.sort().forEach(caseName => {
         const link = document.createElement("a");
         link.textContent = caseName;
         link.href = `?collection=${encodeURIComponent(caseName)}`;
         link.style.color = "#9CA3AF";
         link.style.textDecoration = "none";
         link.style.padding = "4px 10px";
         link.style.border = "1px solid #444";
         link.style.borderRadius = "5px";
         link.style.background = "#1E1E1E";
         link.onmouseover = () => link.style.background = "#333";
         link.onmouseout = () => link.style.background = "#1E1E1E";

         link.addEventListener("click", e => {
             e.preventDefault();
             window.history.pushState(null, "", link.href);
             if (typeof handleRouting === "function") handleRouting();
         });

         bar.appendChild(link);
     });

     parent.prepend(bar);
 }





// Global map to track which condensed groups are currently selected (open)
let selectedCondensedGroups = new Map();

// --- GLOBAL EXPOSED RENDERING FUNCTIONS ---
// These functions are called by navbar.js's handleRouting logic.

/**
 * Renders the Home View: Three distinct columns (Case, Other Collections, Souvenir).
 * @param {Array} skinsData - The full skins data array.
 */
function renderAllCollectionsHome(skinsData) {
    ensureViewElements('home-view'); // Ensure necessary containers are ready

    const mainContainer = document.getElementById("allcollections-list");
    if (!mainContainer) return;

    //Setup
    mainContainer.innerHTML = "";
    mainContainer.style.display = "flex";
    mainContainer.style.flexWrap = "wrap"; // Allows columns to stack on mobile
    mainContainer.style.justifyContent = "space-around";
    mainContainer.style.gap = "20px"; // Adjusted gap for three columns
    mainContainer.style.padding = "20px 0";

    // Home Page Coloumns

    //Cases
    const caseColumnDiv = document.createElement('div');
    caseColumnDiv.style.flex = "1";
    caseColumnDiv.style.minWidth = "300px";
    caseColumnDiv.innerHTML = "<h2 style='font-size: 24px; color: #E5E7EB; border-bottom: 2px solid #374151; padding-bottom: 5px;'>Case Collections</h2>";
    const caseListContainer = document.createElement('div');
    caseListContainer.style.display = "flex";
    caseListContainer.style.flexDirection = "column";
    caseListContainer.style.gap = "15px";
    caseColumnDiv.appendChild(caseListContainer);

    //Other Collections
    const otherCollectionColumnDiv = document.createElement('div'); // Renamed
    otherCollectionColumnDiv.style.flex = "1";
    otherCollectionColumnDiv.style.minWidth = "300px";
    otherCollectionColumnDiv.innerHTML = "<h2 style='font-size: 24px; color: #E5E7EB; border-bottom: 2px solid #374151; padding-bottom: 5px;'>Other Collections</h2>"; // Updated title
    const otherListContainer = document.createElement('div'); // Renamed
    otherListContainer.style.display = "flex";
    otherListContainer.style.flexDirection = "column";
    otherListContainer.style.gap = "15px";
    otherCollectionColumnDiv.appendChild(otherListContainer);

    //Souvenir Packages
    const souvenirColumnDiv = document.createElement('div');
    souvenirColumnDiv.style.flex = "1";
    souvenirColumnDiv.style.minWidth = "300px";
    souvenirColumnDiv.innerHTML = "<h2 style='font-size: 24px; color: #E5E7EB; border-bottom: 2px solid #374151; padding-bottom: 5px;'>Souvenir Packages</h2>";
    const souvenirListContainer = document.createElement('div');
    souvenirListContainer.style.display = "flex";
    souvenirListContainer.style.flexDirection = "column";
    souvenirListContainer.style.gap = "15px";
    souvenirColumnDiv.appendChild(souvenirListContainer);


    const caseCollectionsMap = {};
    const otherCollectionsMap = {};
    const souvenirPackagesMap = {};

    skinsData.forEach(skin => {
        const isCase = (skin.crates || []).length > 0;

        const collection = skin.collection || (skin.collections && skin.collections[0]);
        const collectionName = collection?.name;
        const collectionImage = collection?.image || skin.image;

        if (!collectionName) return;

        // Determine Collection Type / if the name has Souvenir
        const isSouvenirFlag = skin.souvenir;
        const isCollectionSouvenir = isSouvenirFlag || collectionName.toLowerCase().includes('souvenir');

        // --- Mutually Exclusive Grouping ---

        //Souvenirs
        if (isCollectionSouvenir) {
             if (!souvenirPackagesMap[collectionName]) {
                 souvenirPackagesMap[collectionName] = collectionImage;
             }
             // Exclude from all other categories
             return;
        }

        if (isCase) {
            skin.crates.forEach(crate => {
                if (!caseCollectionsMap[crate.name]) {
                    // Cases are grouped by Crate name, not collection name
                    caseCollectionsMap[crate.name] = crate.image || '';
                }
            });
        }

        if (!isCase && !otherCollectionsMap[collectionName]) {
            otherCollectionsMap[collectionName] = collectionImage;
        }
    });


    // 4. RENDERING HELPER FUNCTION (remains the same)
    const renderList = (map, container) => {
        Object.entries(map).forEach(([name, img]) => {
            const link = document.createElement("a");
            // Use query parameters for routing on the single page
            link.href = `?collection=${encodeURIComponent(name)}`;

            // Add click handler for SPA navigation
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.pushState(null, "", link.getAttribute('href'));
                // Call the router function (exposed globally by navbar.js)
                if (typeof handleRouting === 'function') handleRouting();
            });

            link.style.display = "flex";
            link.style.alignItems = "center";
            link.style.textDecoration = "none";
            link.style.color = "#E5E7EB";
            link.style.border = "1px solid #374151";
            link.style.borderRadius = "10px";
            link.style.padding = "10px";
            link.style.backgroundColor = "#1F2937";
            link.style.transition = "background-color 0.2s, border-color 0.2s";
            link.onmouseover = () => link.style.backgroundColor = "#374151";
            link.onmouseout = () => link.style.backgroundColor = "#1F2937";


            const image = document.createElement("img");
            image.src = img;
            image.alt = name;
            image.style.width = "100px";
            image.style.height = "75px";
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


    // Sort keys alphabetically before rendering
    const sortedCaseKeys = Object.keys(caseCollectionsMap).sort();
    const sortedOtherKeys = Object.keys(otherCollectionsMap).sort();
    const sortedSouvenirKeys = Object.keys(souvenirPackagesMap).sort();

    sortedCaseKeys.forEach(key => renderList({ [key]: caseCollectionsMap[key] }, caseListContainer));
    sortedOtherKeys.forEach(key => renderList({ [key]: otherCollectionsMap[key] }, otherListContainer));
    sortedSouvenirKeys.forEach(key => renderList({ [key]: souvenirPackagesMap[key] }, souvenirListContainer));

    mainContainer.appendChild(caseColumnDiv);
    mainContainer.appendChild(otherCollectionColumnDiv); // Using the renamed variable
    mainContainer.appendChild(souvenirColumnDiv);
}



//HOME PAGE END


/**
  Collection Page Setup
 */
 function renderCollectionPage(filteredSkins, collectionName) {
     ensureViewElements('database-view');

     const titleEl = document.getElementById("collection-title");
     const container = document.getElementById("items-container");

     container.innerHTML = ""; // Clear content

     let collectionImage = "";

     // Need to filter out cases, because it will default to the "collection" image of the case.
     const isCase = filteredSkins.some(skin => (skin.crates || []).length > 0);

     if (isCase) {
         const crateSkin = filteredSkins.find(skin => (skin.crates || []).length > 0);
         if (crateSkin && crateSkin.crates[0]?.image) {
             collectionImage = crateSkin.crates[0].image;
         }
     } else {
         // non-cases, don't have a case image. so it uses the collection image as default
         const collectionObj = filteredSkins[0].collection || (filteredSkins[0].collections && filteredSkins[0].collections[0]);
         if (collectionObj && collectionObj.image) {
             collectionImage = collectionObj.image;
         } else if (filteredSkins[0].image) {
             collectionImage = filteredSkins[0].image;
         }
     }

     titleEl.innerHTML = "";
     titleEl.style.textAlign = "center"; // Center text
     titleEl.style.marginBottom = "10px"; // Reduce gap

     if (collectionImage) {
         const img = document.createElement("img");
         img.src = collectionImage;
         img.alt = collectionName;
         img.style.width = "15%";
         img.style.height = "13%";
         img.style.objectFit = "cover";
         img.style.display = "block";
         img.style.margin = "0 auto 6px"; // Center and spacing
         titleEl.appendChild(img);
     }

     // Render collection name text
     const textNode = document.createElement("span");
     textNode.textContent = collectionName;
     titleEl.appendChild(textNode);

     if (!filteredSkins || filteredSkins.length === 0) {
         titleEl.textContent = `No items found for "${collectionName}"`;
         return;
     }

     // Render the "Similar Cases" bar
     if (typeof allSkinsData !== "undefined") {
         renderSimilarCasesBar(allSkinsData, filteredSkins, "database-view");
     }

     // Then render the skins
     renderSkins(filteredSkins, "items-container");
 }



/**
 * Generic function to render a list of skins, called by both search and collection views.
 * @param {Array} skins - The array of skins to display.
 * @param {string} containerId - The ID of the container element.
 */
function renderSkins(skins, containerId) {

    skins = expandDopplerVariants(skins);

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
    const regularGroups = {};    // Others (Dropdown)

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
 * Ensures the necessary parent elements for the active view exist.
 */
function ensureViewElements(viewId) {
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
        btn.onmouseover = () => btn.style.backgroundColor = selectedCondensedGroups.has(groupName) ? "#555" : "#444";
        btn.onmouseout = () => btn.style.backgroundColor = selectedCondensedGroups.has(groupName) ? "#555" : "#333";


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
                // Highlight the button when selected
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
        card.style.color = "#E5E7EB";
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
        name.textContent = skin.display_name || skin.name;
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
    header.textContent = `${groupName} (${groupSkins.length})`;
    // Header styling
    header.style.cursor = "pointer";
    header.style.fontWeight = "bold";
    header.style.color = RARITY_COLORS[groupName] || "#CCCCCC";
    header.style.backgroundColor = "#222";
    header.style.padding = "8px 12px";
    header.style.borderRadius = "5px";
    header.style.transition = "background-color 0.2s";
    header.onmouseover = () => header.style.backgroundColor = "#333";
    header.onmouseout = () => header.style.backgroundColor = "#222";


    const skinsList = document.createElement("div");
    // List styling (Default to flex/visible)
    skinsList.style.display = "flex";
    skinsList.style.marginTop = "10px";
    skinsList.style.flexWrap = "wrap";
    skinsList.style.gap = "10px";

    groupSkins.forEach(skin => {
        const card = document.createElement("div");
        // Card styling
        card.style.border = "1px solid #333";
        card.style.padding = "8px";
        card.style.backgroundColor = "#111";
        card.style.borderRadius = "10px";
        card.style.color = "#E5E7EB";
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
        name.textContent = skin.display_name || skin.name;
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
