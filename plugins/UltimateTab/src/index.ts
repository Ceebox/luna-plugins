import { LunaUnload } from "@luna/core";
import { MediaItem } from "@luna/lib";
import { settings, Settings } from "./Settings";
import { fetchTabContent } from "./utils";

export { Settings };
export const unloads = new Set<LunaUnload>();

let scrollInterval: number | null = null;
const VIEW_STATE = "ultimate-tabs-open";

const styles = document.createElement("style");
styles.innerHTML = `
    .mainContent {
        position: relative;
    }
    .ut-view-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        color: white;
        padding: 40px 60px;
        box-sizing: border-box;
        background: #000;
        z-index: 1000; 
        overflow: hidden;
    }
    .ut-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 20px;
        flex-shrink: 0;
    }
    .ut-content {
        flex: 1;
        overflow-y: auto;
        font-family: monospace;
        font-size: 14px;
        white-space: pre-wrap;
        line-height: 1.5;
        scroll-behavior: smooth;
        padding-bottom: 400px;
    }
    .ut-controls {
        display: flex;
        gap: 12px;
    }
    .ut-close, .ut-toggle-scroll {
        background: white;
        color: black;
        border: none;
        padding: 8px 20px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
    }
    .ut-toggle-scroll.off {
        background: #333;
        color: #888;
    }
    .ut-btn {
        background: none;
        border: none;
        color: var(--wave-color-text-secondary);
        cursor: pointer;
        font-size: 11px;
        font-weight: bold;
        padding: 0 10px;
    }
`;
document.head.appendChild(styles);
unloads.add(() => styles.remove());

const decodeHTML = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

const safeDecode = (str: string) => {
    try {
        const decodedHtml = str
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#039;/g, "'");
        return decodeURIComponent(decodedHtml.replace(/%(?![0-9a-fA-F]{2})/g, "%25"));
    } catch {
        // We tried our best
        return str;
    }
};

const closeTabs = (isPopState = false) => {
    const tabView = document.getElementById("ut-view-container");
    if (tabView) {
        tabView.remove();
        if (!isPopState && window.history.state === VIEW_STATE) {
            window.history.back();
        }
    }
};

const handlePopState = (event: PopStateEvent) => {
    // Go back if the we hit the back button (duh)
    const tabView = document.getElementById("ut-view-container");
    if (tabView) {
        closeTabs(true);
    }
};

window.addEventListener("popstate", handlePopState);
unloads.add(() => window.removeEventListener("popstate", handlePopState));

const showTabs = async () => {
    const main = document.querySelector(".mainContent") as HTMLElement;
    if (!main || document.getElementById("ut-view-container")) {
        return;
    }

    const mediaItem = await MediaItem.fromPlaybackContext();
    if (!mediaItem) {
        return;
    }

    const title = await mediaItem.title();
    const artist = (await mediaItem.artist())?.name ?? "Unknown Artist";

    // Push a dummy state so the 'back' button triggers popstate instead of leaving the page
    window.history.pushState(VIEW_STATE, "");

    const utView = document.createElement("div");
    utView.id = "ut-view-container";
    utView.className = "ut-view-container";
    utView.innerHTML = `
        <div class="ut-header">
            <div>
                <div style="font-size: 24px; font-weight: bold;">${title}</div>
                <div style="color: #888;">${artist}</div>
            </div>
            <div class="ut-controls">
                <button class="ut-toggle-scroll ${settings.autoScroll ? '' : 'off'}" id="ut-scroll-toggle">
                    AUTO-SCROLL: ${settings.autoScroll ? 'ON' : 'OFF'}
                </button>
                <button class="ut-close" id="ut-close">CLOSE</button>
            </div>
        </div>
        <pre class="ut-content" id="ut-content">Searching Ultimate Guitar...</pre>
    `;

    main.appendChild(utView);
    document.getElementById("ut-close")!.onclick = () => closeTabs(false);
    
    const scrollToggle = document.getElementById("ut-scroll-toggle")!;
    scrollToggle.onclick = () => {
        settings.autoScroll = !settings.autoScroll;
        scrollToggle.innerText = `AUTO-SCROLL: ${settings.autoScroll ? 'ON' : 'OFF'}`;
        scrollToggle.classList.toggle('off', !settings.autoScroll);
    };

    if (!scrollInterval) {
        scrollInterval = window.setInterval(() => {
            if (!settings.autoScroll) {
                return;
            }

            const content = document.getElementById("ut-content");
            const luna = (window as any).luna;
            if (!content || !luna?.redux?.store) {
                return;
            }

            const state = luna.redux.store.getState();
            const progress = state.playbackControls?.playbackProgress;
            const duration = state.playbackControls?.duration;

            if (progress && duration) {
                const percentage = progress / duration;
                const totalHeight = content.scrollHeight - (content.clientHeight + 400);
                content.scrollTop = (totalHeight * percentage) - 150;
            }
        }, 100);
    }

    try {
        const finalContent = await fetchTabContent(artist, title);
        const textEl = document.getElementById("ut-content");
        if (textEl) {
            textEl.textContent = finalContent;
        }
    } catch (e) {
        const textEl = document.getElementById("ut-content");
        if (textEl) {
            textEl.textContent = "Failed to load tabs.";
        }
    }
};

const inject = () => {
    if (!settings.enabled) {
        document.getElementById("ut-btn")?.remove();
        return;
    }
    const container = document.querySelector('[class*="_moreContainer_"]') || document.querySelector('[data-test="footer-player"]');
    if (container && !document.getElementById("ut-btn")) {
        const btn = document.createElement("button");
        btn.id = "ut-btn";
        btn.className = "ut-btn";
        btn.innerText = "TABS";
        btn.onclick = showTabs;
        container.prepend(btn);
    }
};

const interval = setInterval(inject, 1000);
unloads.add(() => {
    clearInterval(interval);
    if (scrollInterval) clearInterval(scrollInterval);
    closeTabs(false);
    document.getElementById("ut-btn")?.remove();
});
