import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import React from "react";

export const settings = await ReactiveStore.getPluginStorage("UltimateTab", {
    enabled: true,
    autoRefresh: true,
    autoScroll: false,
});

export const Settings = () => {
    const [enabled, setEnabled] = React.useState(settings.enabled);
    const [autoRefresh, setAutoRefresh] = React.useState(settings.autoRefresh);
    const [autoScroll, setAutoScroll] = React.useState(settings.autoScroll);

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
                title="Automatically refresh"
                desc="Refresh tabs when the song changes"
                checked={autoRefresh}
                onChange={(_: any, checked: boolean) => {
                    setAutoRefresh(checked);
                    settings.autoRefresh = checked;
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
        </LunaSettings>
    );
};