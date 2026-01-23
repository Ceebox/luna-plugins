import { LunaUnload } from "@luna/core";
import { MediaItem } from "@luna/lib";
import { settings, Settings } from "./Settings";
import { fetchTabContent } from "./utils";
import { style } from "./style";

export { Settings };
export const unloads = new Set<LunaUnload>();

let scrollInterval: number | null = null;
let lastTrackId: string | null = null;
let debounceTimeout: number | null = null;

const VIEW_STATE = "ultimate-tabs-open";

const styles = document.createElement("style");
styles.innerHTML = style;
document.head.appendChild(styles);
unloads.add(() => {
    styles.remove();
});

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
    const tabView = document.getElementById("ut-view-container");
    if (tabView) {
        closeTabs(true);
    }
};

window.addEventListener("popstate", handlePopState);
unloads.add(() => {
    window.removeEventListener("popstate", handlePopState);
});

const updateTabContent = async (artist: string, title: string) => {
    const textEl = document.getElementById("ut-content");
    if (!textEl) {
        return;
    }

    textEl.textContent = "Searching Ultimate Guitar...";
    textEl.scrollTop = 0;

    try {
        const finalContent = await fetchTabContent(artist, title);
        textEl.innerHTML = finalContent;
    } catch (e) {
        textEl.textContent = "Failed to load tabs.";
    }
};

const showTabs = async () => {
    const main = document.querySelector(".mainContent") as HTMLElement;
    if (!main) {
        return;
    }

    const mediaItem = await MediaItem.fromPlaybackContext();
    if (!mediaItem) {
        return;
    }

    const title = await mediaItem.title();
    const artist = (await mediaItem.artist())?.name ?? "Unknown Artist";

    let utView = document.getElementById("ut-view-container");

    if (!utView) {
        window.history.pushState(VIEW_STATE, "");
        utView = document.createElement("div");
        utView.id = "ut-view-container";
        utView.className = "ut-view-container";
        utView.innerHTML = `
            <div class="ut-header">
                <div>
                    <div id="ut-header-title" style="font-size: 24px; font-weight: bold;"></div>
                    <div id="ut-header-artist" style="color: #888;"></div>
                </div>
                <div class="ut-controls">
                    <button class="ut-toggle-scroll ${settings.autoScroll ? '' : 'off'}" id="ut-scroll-toggle">
                        AUTO-SCROLL: ${settings.autoScroll ? 'ON' : 'OFF'}
                    </button>
                    <button class="ut-close" id="ut-close">CLOSE</button>
                </div>
            </div>
            <pre class="ut-content" id="ut-content"></pre>
        `;
        main.appendChild(utView);

        document.getElementById("ut-close")!.onclick = () => {
            closeTabs(false);
        };
        
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
    }

    document.getElementById("ut-header-title")!.textContent = title;
    document.getElementById("ut-header-artist")!.textContent = artist;

    await updateTabContent(artist, title);
};

const inject = async () => {
    if (!settings.enabled) {
        document.getElementById("ut-btn")?.remove();
        return;
    }

    const mediaItem = await MediaItem.fromPlaybackContext();
    const currentTrackId = mediaItem ? `${await mediaItem.artist()}-${await mediaItem.title()}` : null;

    if (settings.autoRefresh && currentTrackId !== lastTrackId) {
        lastTrackId = currentTrackId;

        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        debounceTimeout = window.setTimeout(async () => {
            const tabView = document.getElementById("ut-view-container");
            if (tabView && mediaItem) {
                const title = await mediaItem.title();
                const artist = (await mediaItem.artist())?.name ?? "Unknown Artist";
                
                const titleEl = document.getElementById("ut-header-title");
                const artistEl = document.getElementById("ut-header-artist");
                
                if (titleEl) {
                    titleEl.textContent = title;
                }
                if (artistEl) {
                    artistEl.textContent = artist;
                }
                
                updateTabContent(artist, title);
            }
        }, 500);
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
    if (scrollInterval) {
        clearInterval(scrollInterval);
    }

    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
    }

    closeTabs(false);
    document.getElementById("ut-btn")?.remove();
});
