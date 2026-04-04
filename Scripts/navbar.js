const SKINS_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";
let skinsData = [];

function setView(viewId) {
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('database-view').style.display = 'none';
    const active = document.getElementById(viewId);
    if (active) active.style.display = 'block';
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.button.active').forEach(el => el.classList.remove('active'));
}

function handleRouting() {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get("search");
    const collectionQuery = params.get("collection");

    closeAllDropdowns();

    if (searchQuery) {
        setView('database-view');
        performSearch(searchQuery.toLowerCase());
        const input = document.querySelector("#nav-search-form input");
        if (input) input.value = searchQuery;
    } else if (collectionQuery) {
        setView('database-view');
        const q = collectionQuery.trim();
        const collectionSkins = skinsData.filter(skin => {
            const inCrate = (skin.crates || []).some(c => c.name === q);
            const col = skin.collection || (skin.collections && skin.collections[0]);
            return inCrate || (col && col.name === q);
        });
        renderCollectionPage(collectionSkins, collectionQuery);
    } else {
        setView('home-view');
        renderAllCollectionsHome(skinsData);
    }
}

async function loadSkins() {
    try {
        const res = await fetch(SKINS_URL);
        skinsData = await res.json();
        buildNavbar();
        handleRouting();
        window.addEventListener("popstate", handleRouting);
    } catch (err) {
        console.error("Failed to load skin data:", err);
    }
}

function buildNavbar() {
    const nav = document.getElementById("buttons-container");
    if (!nav) return;
    nav.innerHTML = "";

    nav.appendChild(createNavButton("Home", "index.html"));

    const collections = groupCollections(skinsData);
    nav.appendChild(createDropdown("Cases \u25BC", collections.caseMap));
    nav.appendChild(createDropdown("Collections \u25BC", collections.otherMap));
    nav.appendChild(createDropdown("Souvenirs \u25BC", collections.souvenirMap));

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

    searchForm.addEventListener("submit", e => {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            window.history.pushState(null, "", "index.html");
            handleRouting();
            return;
        }
        window.history.pushState({ search: query }, "", `?search=${encodeURIComponent(query)}`);
        handleRouting();
    });
}

function createNavButton(text, href) {
    const btn = document.createElement("a");
    btn.href = href;
    btn.textContent = text;
    btn.classList.add("button");
    btn.addEventListener('click', e => {
        e.preventDefault();
        window.history.pushState(null, "", btn.getAttribute('href'));
        handleRouting();
    });
    return btn;
}

function createDropdown(title, map) {
    const dropdown = document.createElement("div");
    dropdown.classList.add("dropdown");

    const btn = document.createElement("div");
    btn.classList.add("button");
    btn.textContent = title;

    const content = document.createElement("div");
    content.classList.add("dropdown-content");

    dropdown.appendChild(btn);
    dropdown.appendChild(content);

    Object.keys(map).sort().forEach(name => {
        const a = document.createElement("a");
        a.href = `?collection=${encodeURIComponent(name)}`;
        a.textContent = name;
        a.addEventListener('click', e => {
            e.preventDefault();
            window.history.pushState(null, "", a.getAttribute('href'));
            handleRouting();
            content.style.display = "none";
        });
        content.appendChild(a);
    });

    let closeTimer;
    dropdown.addEventListener("mouseenter", () => {
        closeAllDropdowns();
        clearTimeout(closeTimer);
        content.style.display = "block";
    });
    dropdown.addEventListener("mouseleave", () => {
        closeTimer = setTimeout(() => content.style.display = "none", 100);
    });

    btn.addEventListener("click", e => {
        e.preventDefault();
        const wasOpen = content.style.display === "block";
        closeAllDropdowns();
        if (!wasOpen) {
            content.style.display = "block";
            btn.classList.add("active");
        }
    });

    return dropdown;
}

const _origCloseDropdowns = window.closeAllDropdowns;
window.closeAllDropdowns = function() {
    if (typeof _origCloseDropdowns === "function") _origCloseDropdowns();
    document.querySelectorAll(".dropdown-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".button.active").forEach(el => el.classList.remove("active"));
};

function groupCollections(skins) {
    const caseMap = {};
    const otherMap = {};
    const souvenirMap = {};

    skins.forEach(skin => {
        if (skin.crates && skin.crates.length > 0) {
            skin.crates.forEach(crate => {
                if (crate.name === 'DreamHack 2013 Souvenir Package') return;
                if (crate.name.toLowerCase().includes('x-ray')) {
                    if (!otherMap[crate.name]) otherMap[crate.name] = crate.image || skin.image || '';
                } else if (!crate.name.toLowerCase().includes('souvenir')) {
                    if (!caseMap[crate.name]) caseMap[crate.name] = crate.image || skin.image || '';
                }
            });
        }

        const colName = skin.collection?.name || (skin.collections && skin.collections[0]?.name);
        if (!colName) return;

        const colImage = skin.collection?.image || (skin.collections && skin.collections[0]?.image) || skin.image || '';
        const isSouvenir = (skin.souvenir || colName.toLowerCase().includes('souvenir')) && colName !== "The Bank Collection";

        if (isSouvenir) {
            if (!souvenirMap[colName]) souvenirMap[colName] = colImage;
            if (otherMap[colName]) delete otherMap[colName];
        } else if (colName.toLowerCase().includes('x-ray')) {
            if (!otherMap[colName]) otherMap[colName] = colImage;
        } else {
            const isRegularCase = skin.crates && skin.crates.some(c =>
                !c.name.toLowerCase().includes('souvenir') && !c.name.toLowerCase().includes('x-ray')
            );
            if (!isRegularCase && !souvenirMap[colName] && !otherMap[colName]) {
                otherMap[colName] = colImage;
            }
        }
    });

    return { caseMap, otherMap, souvenirMap };
}

function performSearch(query) {
    const isGoldSearch = query === "gold";

    const results = skinsData.filter(skin => {
        if (isGoldSearch) {
            const cat = skin.category?.name;
            const rar = skin.rarity?.name;
            if (cat === "Knives" || cat === "Gloves" || rar === "Extraordinary" || rar === "Contraband") return true;
        }
        return (skin.name && skin.name.toLowerCase().includes(query)) ||
               (skin.weapon?.name && skin.weapon.name.toLowerCase().includes(query)) ||
               (skin.rarity?.name && skin.rarity.name.toLowerCase().includes(query)) ||
               (skin.category?.name && skin.category.name.toLowerCase().includes(query));
    });

    renderCollectionPage(results, `Search Results for "${query}"`);
}

loadSkins();
