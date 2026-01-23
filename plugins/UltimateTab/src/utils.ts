export const decodeHTML = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

export const safeDecode = (str: string) => {
    try {
        const decodedHtml = str
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#039;/g, "'");
        return decodeURIComponent(decodedHtml.replace(/%(?![0-9a-fA-F]{2})/g, "%25"));
    } catch {
        return str;
    }
};

export const fetchTabContent = async (artist: string, title: string): Promise<string> => {
    const query = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(`https://www.ultimate-guitar.com/search.php?search_type=title&value=${query}`);
    const html = await res.text();
    
    const storeMatch = html.match(/class="js-store" data-content="([^"]+)"/);
    if (!storeMatch) throw new Error("No store data found");

    const data = JSON.parse(safeDecode(storeMatch[1]));
    const results = data?.store?.page?.data?.results;
    const match = results?.find((r: any) => r.type === "Chords" || r.type === "Tabs") || results?.[0];

    if (!match?.tab_url) throw new Error("No match found");

    const tabRes = await fetch(match.tab_url);
    const tabHtml = await tabRes.text();
    const tabStoreMatch = tabHtml.match(/class="js-store" data-content="([^"]+)"/);
    
    if (!tabStoreMatch) throw new Error("No tab store data found");

    const tabData = JSON.parse(safeDecode(tabStoreMatch[1]));
    const rawContent = tabData?.store?.page?.data?.tab_view?.wiki_tab?.content;
    
    if (!rawContent) return "Empty tab.";

    return decodeHTML(rawContent.replace(/\[\/?tab\]/g, "").replace(/\[\/?ch\]/g, ""));
};