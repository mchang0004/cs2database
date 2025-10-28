// ------------------------------------------
// similarCollections.js
// Manual JSON-based version
// ------------------------------------------

async function renderSimilarCollections(currentCollection) {
    const titleEl = document.getElementById("collection-title");
    if (!titleEl) return;

    // Remove existing bar
    const oldBar = document.getElementById("similar-collections-bar");
    if (oldBar) oldBar.remove();

    try {
        // Fetch the JSON
        const response = await fetch("Database/similarCollections.json");
        const data = await response.json();

        // Get related collections
        const related = data[currentCollection];
        if (!related || related.length === 0) {
            console.log(`ℹ️ No similar collections for ${currentCollection}`);
            return;
        }

        // Create bar
        const bar = document.createElement("div");
        bar.id = "similar-collections-bar";



        bar.style.display = "flex";
        bar.style.flexWrap = "wrap";
        bar.style.gap = "8px";
        bar.style.marginTop = "15px";
        bar.style.padding = "10px";
        bar.style.borderRadius = "8px";
        bar.style.background = "#1a1a1a";
        bar.style.border = "1px solid #333";
        bar.style.alignItems = "center";
        
        const label = document.createElement("strong");
        label.textContent = "Similar Collections:";
        label.style.color = "#eee";
        label.style.marginRight = "10px";
        bar.appendChild(label);

        // Add each similar collection as a clickable link
        related.forEach(name => {
            const link = document.createElement("a");
            link.textContent = name;
            link.href = `?collection=${encodeURIComponent(name)}`;
            link.style.color = "#9CA3AF";
            link.style.textDecoration = "none";
            link.style.padding = "4px 10px";
            link.style.border = "1px solid #444";
            link.style.borderRadius = "5px";
            link.style.background = "#1E1E1E";
            link.onmouseover = () => (link.style.background = "#333");
            link.onmouseout = () => (link.style.background = "#1E1E1E");

            link.addEventListener("click", e => {
                e.preventDefault();
                window.history.pushState(null, "", link.href);
                if (typeof handleRouting === "function") handleRouting();
            });

            bar.appendChild(link);
        });

        titleEl.insertAdjacentElement("afterend", bar);
        console.log(`✅ Rendered similar collections for ${currentCollection}`);

    } catch (err) {
        console.error("❌ Failed to load similarCollections.json:", err);
    }
}

// Hook into existing renderCollectionPage if it exists
const _oldRenderCollectionPage = window.renderCollectionPage;
window.renderCollectionPage = function(filteredSkins, collectionName) {
    if (typeof _oldRenderCollectionPage === "function") {
        _oldRenderCollectionPage(filteredSkins, collectionName);
    }
    setTimeout(() => renderSimilarCollections(collectionName), 100);
};
