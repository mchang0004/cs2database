// --------------------------
// homeCollections.js
// --------------------------

// Render two columns of collections (Cases and Other Collections)
function renderAllCollectionsHome(skinsData) {
    // The single available target container in your HTML
    const mainContainer = document.getElementById("allcollections-list");
    if (!mainContainer) return;

    // 1. CLEAR AND STYLE THE MAIN CONTAINER FOR FLEX LAYOUT
    mainContainer.innerHTML = "";
    // Apply Flexbox to the #allcollections-list section to hold the two columns side-by-side
    mainContainer.style.display = "flex";
    mainContainer.style.justifyContent = "space-around"; // Distribute space
    mainContainer.style.gap = "40px"; // Space between the two columns
    mainContainer.style.padding = "20px 0";

    // 2. CREATE THE TWO COLUMN CONTAINERS (Case and Non-Case)

    // LEFT COLUMN: Case Collections
    const caseColumn = document.createElement('div');
    caseColumn.style.flex = "1";
    caseColumn.innerHTML = "<h2>Case Collections</h2>";
    const caseListContainer = document.createElement('div');
    caseListContainer.style.display = "flex";
    caseListContainer.style.flexDirection = "column";
    caseListContainer.style.gap = "15px";
    caseColumn.appendChild(caseListContainer);

    // RIGHT COLUMN: Other Collections
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
        // Exclude skins that are souvenirs
        if (skin.crates && skin.crates.length > 0 && !skin.souvenir) {
            skin.crates.forEach(crate => {
                if (!caseCollectionsMap[crate.name]) {
                    caseCollectionsMap[crate.name] = crate.image;
                }
            });
        }

        // --- NON-CASE COLLECTIONS (Items with a collection array, but no crates) ---
        // 🔴 CRITICAL FIX HERE: Iterate over the collections array
        if (skin.collections && skin.collections.length > 0 && (!skin.crates || skin.crates.length === 0)) {

            skin.collections.forEach(collection => {
                 const name = collection.name;
                 const img = collection.image || skin.image; // Use collection image or skin image as fallback

                 // Only add if it's not already mapped
                 if (!nonCaseCollectionsMap[name]) {
                     nonCaseCollectionsMap[name] = img;
                 }
            });
        }
    });

    // 4. RENDERING HELPER FUNCTION (Remains the same)
    const renderList = (map, container) => {
        Object.entries(map).forEach(([name, img]) => {
            const link = document.createElement("a");
            link.href = `/database/?collection=${encodeURIComponent(name)}`;
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
