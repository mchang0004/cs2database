
const rarityColors = {
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

let selectedCondensedGroups = new Map();
let persistedTargetFloat = "";

function expandDopplerVariants(skins) {
    const phaseMap = {
        "ruby": "Ruby",
        "sapphire": "Sapphire",
        "black pearl": "Black Pearl",
        "phase 1": "Phase 1",
        "phase 2": "Phase 2",
        "phase 3": "Phase 3",
        "phase 4": "Phase 4",
        "emerald": "Emerald"
    };

    return skins.map(skin => {
        const lowerName = skin.name?.toLowerCase() || "";
        const lowerFinish = (skin.finish || skin.finish_name || skin.phase || "").toLowerCase();
        let phase = "";

        if (!lowerName.includes("doppler")) return { ...skin, display_name: skin.name };

        for (const key in phaseMap) {
            if (lowerFinish.includes(key)) {
                phase = phaseMap[key];
                break;
            }
        }

        if (!phase) phase = "Unknown Variant";

        return {
            ...skin,
            display_name: `${skin.name} | ${phase}`,
            phase_name: phase,
            image: skin.image
        };
    });
}

async function renderSimilarCasesBar(collectionName, containerId) {
    if (!collectionName) return;

    try {
        const response = await fetch("Database/similarCollections.json");
        const data = await response.json();

        const caseKey = Object.keys(data).find(k => k.toLowerCase() === collectionName.toLowerCase().trim());
        const similarCases = caseKey ? data[caseKey] : null;

        document.getElementById("similar-cases-wrapper")?.remove();
        document.getElementById("similar-cases-bar")?.remove();

        if (!similarCases?.length) return;

        const parent = document.getElementById(containerId);
        if (!parent) return;

        const bar = document.createElement("div");
        bar.id = "similar-cases-bar";

        const title = document.createElement("h3");
        title.textContent = "Similar Collections:";
        bar.appendChild(title);

        similarCases.forEach(caseName => {
            const link = document.createElement("a");
            link.textContent = caseName;
            link.href = `?collection=${encodeURIComponent(caseName)}`;
            link.className = "similar-case-link";
            link.addEventListener("click", e => {
                e.preventDefault();
                window.history.pushState(null, "", link.href);
                handleRouting();
            });
            bar.appendChild(link);
        });

        const wrapper = document.createElement("div");
        wrapper.id = "similar-cases-wrapper";
        wrapper.className = "similar-bar-wrapper";
        wrapper.appendChild(bar);

        const titleEl = document.getElementById("collection-title");
        if (titleEl) titleEl.insertAdjacentElement("afterend", wrapper);
        else parent.insertBefore(wrapper, parent.firstChild);
    } catch (err) {
        document.getElementById("similar-cases-wrapper")?.remove();
    }
}

function renderAllCollectionsHome(skinsData) {
    window.scrollTo(0, 0);
    const mainContainer = document.getElementById("allcollections-list");
    if (!mainContainer) return;
    mainContainer.innerHTML = "";

    const caseMap = {}, otherMap = {}, souvenirMap = {};

    skinsData.forEach(skin => {
        const isCase = (skin.crates || []).length > 0;
        const collection = skin.collection || (skin.collections && skin.collections[0]);
        const colName = collection?.name;
        const colImage = collection?.image || skin.image;

        if (isCase) {
            skin.crates.forEach(crate => {
                if (crate.name === "DreamHack 2013 Souvenir Package") return;
                if (crate.name.toLowerCase().includes("x-ray")) {
                    if (!otherMap[crate.name]) otherMap[crate.name] = crate.image || skin.image || "";
                } else if (!crate.name.toLowerCase().includes("souvenir")) {
                    if (!caseMap[crate.name]) caseMap[crate.name] = crate.image || "";
                }
            });
        }

        if (!colName) return;

        const isSouvenir = (skin.souvenir || colName.toLowerCase().includes("souvenir")) && colName !== "The Bank Collection";
        if (isSouvenir) {
            if (!souvenirMap[colName]) souvenirMap[colName] = colImage;
            return;
        }
        if (colName.toLowerCase().includes("x-ray")) {
            if (!otherMap[colName]) otherMap[colName] = colImage;
            return;
        }
        if (!isCase && !otherMap[colName]) otherMap[colName] = colImage;
    });

    function buildColumn(heading, map) {
        const col = document.createElement("div");
        col.className = "collections-column";

        const h2 = document.createElement("h2");
        h2.textContent = heading;
        col.appendChild(h2);

        const list = document.createElement("div");
        list.className = "collections-list";

        Object.keys(map).sort().forEach(name => {
            const link = document.createElement("a");
            link.href = `?collection=${encodeURIComponent(name)}`;
            link.className = "collection-entry";
            link.addEventListener("click", e => {
                e.preventDefault();
                window.history.pushState(null, "", link.href);
                handleRouting();
            });

            const img = document.createElement("img");
            img.src = map[name];
            img.alt = name;
            img.loading = "lazy";

            const label = document.createElement("p");
            label.textContent = name;

            link.appendChild(img);
            link.appendChild(label);
            list.appendChild(link);
        });

        col.appendChild(list);
        return col;
    }

    const casesCol    = buildColumn("Case Collections", caseMap);
    const otherCol    = buildColumn("Other Collections", otherMap);
    const souvenirCol = buildColumn("Souvenir Collections", souvenirMap);

    const filterBar = document.createElement("div");
    filterBar.id = "home-filters";

    [["All", "all"], ["Cases", "cases"], ["Collections", "collections"], ["Souvenirs", "souvenirs"]].forEach(([label, key]) => {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.className = "home-filter-btn" + (key === "all" ? " active" : "");
        btn.addEventListener("click", () => {
            filterBar.querySelectorAll(".home-filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            casesCol.style.display    = (key === "all" || key === "cases")       ? "" : "none";
            otherCol.style.display    = (key === "all" || key === "collections") ? "" : "none";
            souvenirCol.style.display = (key === "all" || key === "souvenirs")   ? "" : "none";
        });
        filterBar.appendChild(btn);
    });

    const grid = document.createElement("div");
    grid.className = "collections-grid";
    grid.appendChild(casesCol);
    grid.appendChild(otherCol);
    grid.appendChild(souvenirCol);

    mainContainer.appendChild(filterBar);
    mainContainer.appendChild(grid);
}

function renderCollectionPage(filteredSkins, collectionName) {
    window.scrollTo(0, 0);

    const titleEl = document.getElementById("collection-title");
    const container = document.getElementById("items-container");
    container.innerHTML = "";

    let collectionImage = "";
    let isCase = false;

    for (const skin of filteredSkins) {
        if (skin.crates && skin.crates.length > 0) {
            isCase = true;
            const match = skin.crates.find(c => c.name.toLowerCase() === collectionName.toLowerCase());
            if (match?.image) { collectionImage = match.image; break; }
        }
    }

    if (!collectionImage) {
        if (isCase) {
            const crateSkin = filteredSkins.find(s => (s.crates || []).length > 0);
            if (crateSkin?.crates[0]?.image) collectionImage = crateSkin.crates[0].image;
        } else if (filteredSkins[0]) {
            const col = filteredSkins[0].collection || (filteredSkins[0].collections && filteredSkins[0].collections[0]);
            collectionImage = col?.image || filteredSkins[0].image || "";
        }
    }

    titleEl.innerHTML = "";
    titleEl.className = "collection-header";

    if (collectionImage) {
        const img = document.createElement("img");
        img.src = collectionImage;
        img.alt = collectionName;
        titleEl.appendChild(img);
    }

    const nameEl = document.createElement("div");
    nameEl.className = "collection-header-name";
    nameEl.textContent = collectionName;
    titleEl.appendChild(nameEl);

    const marketBtn = document.createElement("a");
    marketBtn.textContent = "Search on Steam Market";
    marketBtn.href = `https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(collectionName)}`;
    marketBtn.target = "_blank";
    marketBtn.className = "collection-market-btn";
    titleEl.appendChild(marketBtn);

    const floatRow = document.createElement("div");     

    floatRow.className = "float-row";

    const floatLabel = document.createElement("label");
    floatLabel.textContent = "Acquired Float:";
    floatLabel.htmlFor = "tradeup-float-input";

    const floatInput = document.createElement("input");
    floatInput.type = "number";
    floatInput.step = "0.0001";
    floatInput.min = "0";
    floatInput.max = "1";
    floatInput.placeholder = " ";
    floatInput.id = "tradeup-float-input";
    floatInput.value = persistedTargetFloat;

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "\u2715";
    clearBtn.className = "float-clear-btn";
    clearBtn.addEventListener("click", () => {
        floatInput.value = "";
        persistedTargetFloat = "";
        floatInput.dispatchEvent(new Event("input"));
    });

    floatRow.appendChild(floatLabel);
    floatRow.appendChild(floatInput);
    floatRow.appendChild(clearBtn);
    titleEl.appendChild(floatRow);

    floatInput.addEventListener("input", () => {
        persistedTargetFloat = floatInput.value;
        const val = parseFloat(floatInput.value);
        document.querySelectorAll(".skin-card-normalized").forEach(el => el.remove());
        if (isNaN(val) || floatInput.value === "") return;

        document.querySelectorAll(".skin-card").forEach(card => {
            const floatEl = card.querySelector(".skin-card-float");
            if (!floatEl) return;
            const m = floatEl.textContent.match(/Float:\s*([\d.]+)\s*-\s*([\d.]+)/);
            if (!m) return;
            const minF = parseFloat(m[1]);
            const maxF = parseFloat(m[2]);
            if (maxF === minF) return;

            const normalized = (val - minF) / (maxF - minF);
            const display = document.createElement("p");
            display.className = "skin-card-normalized";
            display.textContent = `Normalized: ${normalized.toFixed(10)}`;
            display.style.color = (normalized < 0 || normalized > 1) ? "#ff4444" : "#4fc3f7";
            floatEl.insertAdjacentElement("beforebegin", display);
        });
    });

    titleEl.parentElement.style.textAlign = "center";

    if (!filteredSkins?.length) {
        titleEl.textContent = `No items found for "${collectionName}"`;
        return;
    }

    setTimeout(() => {
        renderSimilarCasesBar(collectionName, "database-view").catch(() => {});
    }, 100);

    renderSkins(filteredSkins, "items-container");

    if (persistedTargetFloat !== "") {
        document.getElementById("tradeup-float-input")?.dispatchEvent(new Event("input"));
    }
}

function renderSkins(skins, containerId) {
    skins = expandDopplerVariants(skins);

    const container = document.getElementById(containerId);
    container.innerHTML = "";
    selectedCondensedGroups.clear();

    if (!skins?.length) {
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
        const cat = skin.category?.name;
        const groupName = (cat === "Knives" || cat === "Gloves")
            ? (skin.weapon?.name || cat)
            : (skin.rarity?.name || "Unknown");
        if (!grouped[groupName]) grouped[groupName] = [];
        grouped[groupName].push(skin);
    });

    const condensedGroups = {}, regularGroups = {};
    for (const group in grouped) {
        const cat = grouped[group][0].category?.name;
        if (cat === "Knives" || cat === "Gloves") condensedGroups[group] = grouped[group];
        else regularGroups[group] = grouped[group];
    }

    renderTaskbarGroup(condensedGroups, container);

    let dropdown = document.getElementById("central-skins-dropdown");
    if (!dropdown) {
        dropdown = document.createElement("div");
        dropdown.id = "central-skins-dropdown";
        container.appendChild(dropdown);
    } else {
        dropdown.innerHTML = "";
        dropdown.style.display = "none";
    }

    updateCentralDropdown();
    for (const group in regularGroups) renderRegularGroup(group, regularGroups[group], container);
}

function renderTaskbarGroup(condensedGroups, mainContainer) {
    document.getElementById("condensed-taskbar")?.remove();

    const groupNames = Object.keys(condensedGroups);
    if (!groupNames.length) return;

    const taskbar = document.createElement("div");
    taskbar.id = "condensed-taskbar";

    groupNames.forEach(groupName => {
        const groupSkins = condensedGroups[groupName];

        const btn = document.createElement("div");
        btn.className = "condensed-btn";
        if (selectedCondensedGroups.has(groupName)) btn.classList.add("selected");

        const img = document.createElement("img");
        img.src = groupSkins[0].image;
        img.alt = groupName;
        img.loading = "lazy";

        const label = document.createElement("span");
        label.textContent = `${groupName} (${groupSkins.length})`;

        btn.appendChild(img);
        btn.appendChild(label);

        btn.addEventListener("click", () => {
            if (selectedCondensedGroups.has(groupName)) selectedCondensedGroups.delete(groupName);
            else selectedCondensedGroups.set(groupName, groupSkins);
            btn.classList.toggle("selected", selectedCondensedGroups.has(groupName));
            updateCentralDropdown();
        });

        taskbar.appendChild(btn);
    });

    mainContainer.prepend(taskbar);
}

function updateCentralDropdown() {
    let dropdown = document.getElementById("central-skins-dropdown");
    if (!dropdown) {
        dropdown = document.createElement("div");
        dropdown.id = "central-skins-dropdown";
        const container = document.getElementById("items-container");
        if (!container) return;
        const taskbar = document.getElementById("condensed-taskbar");
        if (taskbar?.nextSibling) container.insertBefore(dropdown, taskbar.nextSibling);
        else container.appendChild(dropdown);
    }

    dropdown.innerHTML = "";
    const allSkins = [];
    selectedCondensedGroups.forEach(skins => allSkins.push(...skins));

    if (!allSkins.length) {
        dropdown.style.display = "none";
        return;
    }

    dropdown.style.display = "";
    const skinsList = document.createElement("div");
    skinsList.className = "skins-flex-list";
    allSkins.forEach(skin => skinsList.appendChild(createSkinCard(skin)));
    dropdown.appendChild(skinsList);
}

function renderRegularGroup(groupName, groupSkins, container) {
    const section = document.createElement("div");
    section.className = "rarity-group";

    const header = document.createElement("div");
    header.className = "rarity-group-header";
    header.textContent = `${groupName} (${groupSkins.length})`;
    header.style.color = rarityColors[groupName] || "#CCCCCC";

    const skinsList = document.createElement("div");
    skinsList.className = "rarity-skins-list";
    groupSkins.forEach(skin => skinsList.appendChild(createSkinCard(skin)));

    header.addEventListener("click", () => {
        skinsList.style.display = skinsList.style.display === "none" ? "" : "none";
    });

    section.appendChild(header);
    section.appendChild(skinsList);
    container.appendChild(section);
}

function createSkinCard(skin) {
    const card = document.createElement("div");
    card.className = "skin-card";

    const img = document.createElement("img");
    img.className = "skin-card-img";
    img.src = skin.image;
    img.alt = skin.name;
    img.loading = "lazy";

    const name = document.createElement("p");
    name.className = "skin-card-name";
    name.textContent = skin.display_name || skin.name;
    name.style.color = skin.rarity?.color || "#ccc";

    const tags = document.createElement("div");
    tags.className = "skin-tags";

    if (skin.souvenir) {
        const tag = document.createElement("span");
        tag.className = "skin-tag skin-tag-s";
        tag.textContent = "S";
        tags.appendChild(tag);
    }
    if (skin.stattrak) {
        const tag = document.createElement("span");
        tag.className = "skin-tag skin-tag-st";
        tag.textContent = "ST";
        tags.appendChild(tag);
    }

    const minFloat = typeof skin.min_float === "number" ? skin.min_float.toFixed(2) : "0.00";
    const maxFloat = typeof skin.max_float === "number" ? skin.max_float.toFixed(2) : "1.00";
    const floatRange = document.createElement("p");
    floatRange.className = "skin-card-float";
    floatRange.textContent = `Float: ${minFloat} - ${maxFloat}`;

    const cardContent = document.createElement("div");
    cardContent.className = "skin-card-content";
    cardContent.appendChild(img);
    cardContent.appendChild(name);
    if (tags.children.length > 0) cardContent.appendChild(tags);
    cardContent.appendChild(floatRange);
    card.appendChild(cardContent);

    const buttons = document.createElement("div");
    buttons.className = "skin-card-buttons";

    const isSearchPage     = window.location.search.includes("search=");
    const isCollectionPage = window.location.search.includes("collection=");

    if (isSearchPage && !isCollectionPage) {
        const isGold = skin.category?.name === "Knives" || skin.category?.name === "Gloves"
            || skin.rarity?.name === "Extraordinary" || skin.rarity?.name === "Contraband";

        let targetName = "";
        let collectionsCount = 0;
        let buttonText = "Go to Collection";

        if (skin.crates?.length > 0) {
            collectionsCount = skin.crates.length;
            targetName = skin.crates[Math.floor(Math.random() * collectionsCount)].name;
        } else {
            const cols = skin.collections || (skin.collection ? [skin.collection] : []);
            if (cols.length && cols[0]) {
                collectionsCount = cols.length;
                targetName = cols[Math.floor(Math.random() * collectionsCount)]?.name || "";
            }
        }

        if (isGold && collectionsCount > 0) {
            buttonText = collectionsCount > 1 ? `Collection (${collectionsCount})` : "Collection";
        }

        if (targetName) {
            const colBtn = document.createElement("button");
            colBtn.textContent = buttonText;
            colBtn.className = "skin-btn-collection";
            colBtn.addEventListener("click", () => {
                window.history.pushState(null, "", `?collection=${encodeURIComponent(targetName)}`);
                handleRouting();
            });
            buttons.appendChild(colBtn);
        }
    }

    const marketBtn = document.createElement("a");
    marketBtn.textContent = "Steam Market";
    marketBtn.href = `https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(skin.name.replace(" | ", " "))}`;
    marketBtn.target = "_blank";
    marketBtn.className = "skin-btn-market";
    buttons.appendChild(marketBtn);

    card.appendChild(buttons);
    return card;
}
