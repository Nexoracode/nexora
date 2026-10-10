"use client";

import { useState, type ReactNode } from "react";
import { TabPanel, Tabs } from "@/components/tabs";

export type SettingsPanel = { id: string; label: string; content: ReactNode };

/** The settings sections as tabs; every section is its own form with its own save button. */
export function SettingsTabs({ panels }: { panels: SettingsPanel[] }) {
  const [tab, setTab] = useState(panels[0]?.id ?? "");
  return (
    <div className="space-y-5">
      <Tabs label="بخش‌های تنظیمات" idPrefix="settings" value={tab} onChange={setTab} tabs={panels.map(({ id, label }) => ({ id, label }))} />
      {panels.map((panel) => <TabPanel key={panel.id} id={panel.id} value={tab} idPrefix="settings">{panel.content}</TabPanel>)}
    </div>
  );
}
