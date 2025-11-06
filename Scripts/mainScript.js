// --------------------------
// mainScript.js (Consolidated, Refactored, with "Go to Collection" button)
// --------------------------



const RARITY_COLORS = {
    "Covert": "#EB4B4B",
    "Classified": "#D32CE6",
    "Restricted": "#8847FF",
    "Mil-Spec Grade": "#4B69FF",
    "Industrial Grade": "#5E98D9",
    "Consumer Grade": "#B0C3D9",
    "Extraordinary": "#DDAA00",
    "Contraband": "#FFCC66"
};

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

// List of golds skelected
let selectedCondensedGroups = new Map();



function expandDopplerVariants(skins) {
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

        const isDoppler = lowerName.includes("doppler");
        if (!isDoppler) return { ...skin, display_name: skin.name };

        for (const key in variantMap) {
            if (lowerFinish.includes(key)) {
                variant = variantMap[key];
                break;
            }
        }

        if (!variant && skin.pattern && patternIdMap[skin.pattern]) {
            variant = patternIdMap[skin.pattern];
        }

        if (!variant) variant = "Unknown Variant";

        const displayName = `${skin.name} | ${variant}`;
        let image = skin.image;
        const variantImagePath = `/database/variants/${skin.name.replace(/\s+/g, "_")}_${variant.replace(/\s+/g, "_")}.png`;

        return {
            ...skin,
            display_name: displayName,
            variant_name: variant,
            image
        };
    });
}

function ensureViewElements(viewId) {
    const container = document.getElementById(viewId);
    if (!container) console.error(`Missing view section #${viewId}`);
}

// --- SIMILAR CASES BAR ---

function renderSimilarCasesBar(allSkins, currentSkins, containerId) {
    const currentKnifeNames = new Set(
        currentSkins
            .filter(s => s.category?.name === "Knives")
            .map(s => s.weapon?.name || s.name)
    );

    if (!currentKnifeNames.size) return;

    const caseMap = {};
    allSkins.forEach(skin => {
        if (skin.crates && skin.category?.name === "Knives") {
            skin.crates.forEach(crate => {
                if (!caseMap[crate.name]) caseMap[crate.name] = new Set();
                caseMap[crate.name].add(skin.weapon?.name || skin.name);
            });
        }
    });

    const similarCases = [];
    for (const [caseName, knives] of Object.entries(caseMap)) {
        if ([...knives].some(k => currentKnifeNames.has(k))) similarCases.push(caseName);
    }

    if (similarCases.length <= 1) return;

    const parent = document.getElementById(containerId);
    if (!parent) return;

    const existingBar = document.getElementById("similar-cases-bar");
    if (existingBar) existingBar.remove();

    const bar = document.createElement("div");
    bar.id = "similar-cases-bar";
    Object.assign(bar.style, {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        padding: "8px",
        margin: "12px 0 20px",
        background: "#151515",
        borderRadius: "8px",
        border: "1px solid #333"
    });

    const title = document.createElement("h3");
    title.textContent = "Similar Cases:";
    Object.assign(title.style, { color: "#eee", fontSize: "1rem", marginRight: "8px" });
    bar.appendChild(title);

    similarCases.sort().forEach(caseName => {
        const link = document.createElement("a");
        link.textContent = caseName;
        link.href = `?collection=${encodeURIComponent(caseName)}`;
        Object.assign(link.style, {
            color: "#9CA3AF",
            textDecoration: "none",
            padding: "4px 10px",
            border: "1px solid #444",
            borderRadius: "5px",
            background: "#1E1E1E"
        });
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

// --- HOME PAGE COLLECTIONS ---

function renderAllCollectionsHome(skinsData) {
    ensureViewElements('home-view');
    const mainContainer = document.getElementById("allcollections-list");
    if (!mainContainer) return;

    mainContainer.innerHTML = "";
    Object.assign(mainContainer.style, {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-around",
        gap: "20px",
        padding: "20px 0"
    });

    const caseColumnDiv = document.createElement('div');
    caseColumnDiv.style.flex = "1";
    caseColumnDiv.style.minWidth = "300px";
    caseColumnDiv.innerHTML = "<h2 style='font-size: 24px; color: #E5E7EB; border-bottom: 2px solid #374151; padding-bottom: 5px;'>Case Collections</h2>";
    const caseListContainer = document.createElement('div');
    Object.assign(caseListContainer.style, { display: "flex", flexDirection: "column", gap: "15px" });
    caseColumnDiv.appendChild(caseListContainer);

    const otherCollectionColumnDiv = document.createElement('div');
    otherCollectionColumnDiv.style.flex = "1";
    otherCollectionColumnDiv.style.minWidth = "300px";
    otherCollectionColumnDiv.innerHTML = "<h2 style='font-size: 24px; color: #E5E7EB; border-bottom: 2px solid #374151; padding-bottom: 5px;'>Other Collections</h2>";
    const otherListContainer = document.createElement('div');
    Object.assign(otherListContainer.style, { display: "flex", flexDirection: "column", gap: "15px" });
    otherCollectionColumnDiv.appendChild(otherListContainer);

    const souvenirColumnDiv = document.createElement('div');
    souvenirColumnDiv.style.flex = "1";
    souvenirColumnDiv.style.minWidth = "300px";
    souvenirColumnDiv.innerHTML = "<h2 style='font-size: 24px; color: #E5E7EB; border-bottom: 2px solid #374151; padding-bottom: 5px;'>Souvenir Packages</h2>";
    const souvenirListContainer = document.createElement('div');
    Object.assign(souvenirListContainer.style, { display: "flex", flexDirection: "column", gap: "15px" });
    souvenirColumnDiv.appendChild(souvenirListContainer);

    const caseCollectionsMap = {}, otherCollectionsMap = {}, souvenirPackagesMap = {};

    skinsData.forEach(skin => {
        const isCase = (skin.crates || []).length > 0;
        const collection = skin.collection || (skin.collections && skin.collections[0]);
        const collectionName = collection?.name;
        const collectionImage = collection?.image || skin.image;
        if (!collectionName) return;

        const isCollectionSouvenir = skin.souvenir || collectionName.toLowerCase().includes('souvenir');

        if (isCollectionSouvenir) {
            if (!souvenirPackagesMap[collectionName]) souvenirPackagesMap[collectionName] = collectionImage;
            return;
        }

        if (isCase) {
            skin.crates.forEach(crate => {
                if (!caseCollectionsMap[crate.name]) caseCollectionsMap[crate.name] = crate.image || '';
            });
        }

        if (!isCase && !otherCollectionsMap[collectionName]) otherCollectionsMap[collectionName] = collectionImage;
    });

    const renderList = (map, container) => {
        Object.entries(map).forEach(([name, img]) => {
            const link = document.createElement("a");
            link.href = `?collection=${encodeURIComponent(name)}`;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.pushState(null, "", link.href);
                if (typeof handleRouting === 'function') handleRouting();
            });
            Object.assign(link.style, {
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "#E5E7EB",
                border: "1px solid #374151",
                borderRadius: "10px",
                padding: "10px",
                backgroundColor: "#1F2937",
                transition: "background-color 0.2s, border-color 0.2s"
            });
            link.onmouseover = () => link.style.backgroundColor = "#374151";
            link.onmouseout = () => link.style.backgroundColor = "#1F2937";

            const image = document.createElement("img");
            image.src = img;
            image.alt = name;
            Object.assign(image.style, { width: "100px", height: "75px", borderRadius: "5px", marginRight: "20px", objectFit: "cover" });
            image.loading = "lazy";

            const title = document.createElement("p");
            title.textContent = name;
            Object.assign(title.style, { fontSize: "16px", fontWeight: "bold" });

            link.appendChild(image);
            link.appendChild(title);
            container.appendChild(link);
        });
    };

    Object.keys(caseCollectionsMap).sort().forEach(key => renderList({ [key]: caseCollectionsMap[key] }, caseListContainer));
    Object.keys(otherCollectionsMap).sort().forEach(key => renderList({ [key]: otherCollectionsMap[key] }, otherListContainer));
    Object.keys(souvenirPackagesMap).sort().forEach(key => renderList({ [key]: souvenirPackagesMap[key] }, souvenirListContainer));

    mainContainer.appendChild(caseColumnDiv);
    mainContainer.appendChild(otherCollectionColumnDiv);
    mainContainer.appendChild(souvenirColumnDiv);
}

// --- COLLECTION PAGE ---

function renderCollectionPage(filteredSkins, collectionName) {
    ensureViewElements('database-view');

    const titleEl = document.getElementById("collection-title");
    const container = document.getElementById("items-container");

    container.innerHTML = "";

    let collectionImage = "";
    const isCase = filteredSkins.some(skin => (skin.crates || []).length > 0);

    if (isCase) {
        const crateSkin = filteredSkins.find(skin => (skin.crates || []).length > 0);
        if (crateSkin && crateSkin.crates[0]?.image) collectionImage = crateSkin.crates[0].image;
    } else {
        const collectionObj = filteredSkins[0].collection || (filteredSkins[0].collections && filteredSkins[0].collections[0]);
        if (collectionObj && collectionObj.image) collectionImage = collectionObj.image;
        else if (filteredSkins[0].image) collectionImage = filteredSkins[0].image;
    }

    titleEl.innerHTML = "";
    titleEl.style.textAlign = "center";
    titleEl.style.marginBottom = "10px";

    if (collectionImage) {
        const img = document.createElement("img");
        img.src = collectionImage;
        img.alt = collectionName;
        Object.assign(img.style, { width: "15%", height: "13%", objectFit: "cover", display: "block", margin: "0 auto 6px" });
        titleEl.appendChild(img);
    }

    const textNode = document.createElement("span");
    textNode.textContent = collectionName;
    titleEl.appendChild(textNode);

    if (!filteredSkins || !filteredSkins.length) {
        titleEl.textContent = `No items found for "${collectionName}"`;
        return;
    }

    if (typeof allSkinsData !== "undefined") renderSimilarCasesBar(allSkinsData, filteredSkins, "database-view");

    renderSkins(filteredSkins, "items-container");
}

// --- SKINS RENDERING ---

function renderSkins(skins, containerId) {
    skins = expandDopplerVariants(skins);
    ensureViewElements('database-view');

    const container = document.getElementById(containerId);
    container.innerHTML = "";
    selectedCondensedGroups.clear();

    if (!skins || !skins.length) {
        container.textContent = "No skins found.";
        return;
    }

    skins.sort((a, b) => {
        const aKey = rarityOrder[a.category?.name] ?? rarityOrder[a.rarity?.name] ?? 999;
        const bKey = rarityOrder[b.category?.name] ?? rarityOrder[b.rarity?.name] ?? 999;
        return aKey - bKey;
    });

    const grouped = {};
    skins.forEach(skin => {
        let groupName = skin.category?.name === "Knives" || skin.category?.name === "Gloves" ? skin.weapon?.name || skin.category?.name : skin.rarity?.name || "Unknown";
        if (!grouped[groupName]) grouped[groupName] = [];
        grouped[groupName].push(skin);
    });

    const condensedGroups = {}, regularGroups = {};
    Object.keys(grouped).forEach(group => {
        const isCondensed = grouped[group][0].category?.name === "Knives" || grouped[group][0].category?.name === "Gloves";
        if (isCondensed) condensedGroups[group] = grouped[group];
        else regularGroups[group] = grouped[group];
    });

    renderTaskbarGroup(condensedGroups, container);

    let dropdownContainer = document.getElementById("central-skins-dropdown");
    if (!dropdownContainer) {
        dropdownContainer = document.createElement("div");
        dropdownContainer.id = "central-skins-dropdown";
        container.appendChild(dropdownContainer);
    }
    updateCentralDropdown();

    Object.keys(regularGroups).forEach(group => renderRegularGroup(group, regularGroups[group], container));
}

// --- TASKBAR / CENTRAL DROPDOWN ---

function renderTaskbarGroup(condensedGroups, mainContainer) {
    let taskbar = document.getElementById("condensed-taskbar");
    if (taskbar) taskbar.remove();

    const groupNames = Object.keys(condensedGroups);
    if (!groupNames.length) return;

    taskbar = document.createElement("div");
    taskbar.id = "condensed-taskbar";
    Object.assign(taskbar.style, { display: "flex", flexWrap: "wrap", gap: "10px", padding: "10px", marginBottom: "20px", backgroundColor: "#1a1a1a", borderRadius: "5px" });

    groupNames.forEach(groupName => {
        const groupSkins = condensedGroups[groupName];
        const representativeSkin = groupSkins[0];

        const btn = document.createElement("div");
        Object.assign(btn.style, { cursor: "pointer", padding: "8px", borderRadius: "5px", backgroundColor: "#333", display: "flex", flexDirection: "column", alignItems: "center", width: "140px", height: "120px", transition: "background-color 0.2s, color 0.2s" });
        btn.onmouseover = () => btn.style.backgroundColor = selectedCondensedGroups.has(groupName) ? "#555" : "#444";
        btn.onmouseout = () => btn.style.backgroundColor = selectedCondensedGroups.has(groupName) ? "#555" : "#333";

        const img = document.createElement("img");
        img.src = representativeSkin.image;
        img.alt = groupName;
        Object.assign(img.style, { width: "80px", height: "auto", borderRadius: "3px", marginBottom: "5px" });
        img.loading = "lazy";

        const label = document.createElement("span");
        label.textContent = `${groupName} (${groupSkins.length})`;
        Object.assign(label.style, { fontSize: "12px", textAlign: "center", color: "#ccc" });

        btn.appendChild(img);
        btn.appendChild(label);

        if (selectedCondensedGroups.has(groupName)) btn.style.backgroundColor = "#555";

        btn.addEventListener("click", () => {
            if (selectedCondensedGroups.has(groupName)) selectedCondensedGroups.delete(groupName);
            else selectedCondensedGroups.set(groupName, groupSkins);
            updateCentralDropdown();
        });

        taskbar.appendChild(btn);
    });

    mainContainer.prepend(taskbar);
}

function updateCentralDropdown() {
    const dropdownContainer = document.getElementById("central-skins-dropdown");
    if (!dropdownContainer) return;

    dropdownContainer.innerHTML = "";

    const allSkins = [];
    selectedCondensedGroups.forEach(skins => allSkins.push(...skins));

    if (!allSkins.length) {
        dropdownContainer.style.display = "none";
        return;
    }

    dropdownContainer.style.display = "block";
    Object.assign(dropdownContainer.style, { marginTop: "15px", marginBottom: "30px", padding: "10px", backgroundColor: "#111", border: "1px solid #444", borderRadius: "10px" });

    const skinsList = document.createElement("div");
    Object.assign(skinsList.style, { display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "flex-start" });

    allSkins.forEach(skin => {
        const card = createSkinCard(skin);
        skinsList.appendChild(card);
    });

    dropdownContainer.appendChild(skinsList);
}

function renderRegularGroup(groupName, groupSkins, container) {
    const section = document.createElement("div");
    section.style.marginBottom = "15px";

    const header = document.createElement("div");
    header.textContent = `${groupName} (${groupSkins.length})`;
    Object.assign(header.style, { cursor: "pointer", fontWeight: "bold", color: RARITY_COLORS[groupName] || "#CCCCCC", backgroundColor: "#222", padding: "8px 12px", borderRadius: "5px", transition: "background-color 0.2s" });
    header.onmouseover = () => header.style.backgroundColor = "#333";
    header.onmouseout = () => header.style.backgroundColor = "#222";

    const skinsList = document.createElement("div");
    Object.assign(skinsList.style, { display: "flex", marginTop: "10px", flexWrap: "wrap", gap: "10px" });

    groupSkins.forEach(skin => {
        const card = createSkinCard(skin);
        skinsList.appendChild(card);
    });

    header.addEventListener("click", () => {
        skinsList.style.display = skinsList.style.display === "none" ? "flex" : "none";
    });

    section.appendChild(header);
    section.appendChild(skinsList);
    container.appendChild(section);
}

//Skin "Card"

function createSkinCard(skin) {
    const card = document.createElement("div");
    Object.assign(card.style, {
        border: "1px solid #333",
        padding: "8px",
        backgroundColor: "#222",
        borderRadius: "10px",
        color: "#E5E7EB",
        width: "10%",
        height: "230px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
    });

    const img = document.createElement("img");
    img.src = skin.image;
    img.alt = skin.name;
    Object.assign(img.style, { width: "160px", borderRadius: "5px" });
    img.loading = "lazy";

    const name = document.createElement("p");
    name.textContent = skin.display_name || skin.name;
    Object.assign(name.style, { textAlign: "center", fontSize: "14px", color: skin.rarity?.color || "#ccc" });

    card.appendChild(img);
    card.appendChild(name);

    const skipCategories = ["Knives", "Gloves"];
    const skipRarities = ["Extraordinary", "Contraband"];
    const isSearchPage = window.location.search.includes("search=");
    const isCollectionPage = window.location.search.includes("collection=");

    if (isSearchPage && !isCollectionPage && !skipCategories.includes(skin.category?.name) && !skipRarities.includes(skin.rarity?.name)) {
        const btn = document.createElement("button");
        btn.textContent = "Go to Collection";
        Object.assign(btn.style, {
            marginTop: "auto",       // Pushes the button to the bottom
            padding: "4px 8px",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            backgroundColor: "#00f5ab",
            color: "#000",
            fontSize: "12px",
        });        btn.onmouseover = () => btn.style.backgroundColor = "#abffe6";
        btn.onmouseout = () => btn.style.backgroundColor = "#00f5ab";

        btn.addEventListener("click", () => {

            let targetName = "";

            // If skin has crates (cases), pick the first one
            if (skin.crates && skin.crates.length > 0) {
                targetName = skin.crates[0].name;
            } else {
                // fallback to collection
                targetName = skin.collection?.name || (skin.collections && skin.collections[0]?.name) || "";
            }

            if (!targetName) return;

            window.history.pushState(null, "", `?collection=${encodeURIComponent(targetName)}`);
            if (typeof handleRouting === "function") handleRouting();
        });

        card.appendChild(btn);
    }

    return card;
}
