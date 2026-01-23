import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import React from "react";

export const settings = await ReactiveStore.getPluginStorage("UltimateTab", {
    enabled: true,
    autoScroll: true,
    autoRefresh: true,
});

export const Settings = () => {
    const [enabled, setEnabled] = React.useState(settings.enabled);
    const [autoScroll, setAutoScroll] = React.useState(settings.autoScroll);
    const [autoRefresh, setAutoRefresh] = React.useState(settings.autoRefresh);

    // TODO: Make auto-scroll work
    return (
        <LunaSettings>
            <LunaSwitchSetting
                title="Ultimate Guitar Tabs"
                desc="Show TABS button in player footer"
                checked={enabled}
                onChange={(_: any, checked: boolean) => {
                    setEnabled(checked);
                    settings.enabled = checked;
                }}
            />
            <LunaSwitchSetting
                title="Auto-scroll"
                desc="Automatically scroll tabs based on song progress"
                checked={autoScroll}
                onChange={(_: any, checked: boolean) => {
                    setAutoScroll(checked);
                    settings.autoScroll = checked;
                }}
            />
            <LunaSwitchSetting
                title="Automatically refresh"
                desc="Refresh tabs when the song changes"
                checked={autoRefresh}
                onChange={(_: any, checked: boolean) => {
                    setAutoRefresh(checked);
                    settings.autoRefresh = checked;
                }}
            />
        </LunaSettings>
    );
};