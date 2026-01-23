// I can't be bothered to figure out file:// stuff for css loading
// This will do! Out of sight, out of mind.

export const style = `
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
`
