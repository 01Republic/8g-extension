import { useState } from "react";
import { Button } from "~/components/ui/button";

interface ResultPanelProps {
  result: any;
  position?: "top-right" | "bottom-right";
}

export const ResultPanel = ({
  result,
  position = "bottom-right",
}: ResultPanelProps) => {
  const isTop = position === "top-right";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: isTop ? 12 : undefined,
        bottom: isTop ? undefined : 12,
        width: 420,
        maxHeight: collapsed ? undefined : "60%",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        padding: 12,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: collapsed ? 0 : 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
          Result
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {collapsed ? "펼치기" : "접기"}
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ overflow: "auto", flex: 1 }}>
          <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.4 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
