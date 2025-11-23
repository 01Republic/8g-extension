import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export const PaletteSheet = ({
  paletteOpen,
  setPaletteOpen,
  addNode,
  blocks,
}: {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  addNode: (type: string, data: any) => void;
  blocks: { title: string; description: string; type: string; data: any }[];
}) => {
  return (
    <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary">+ Add Block</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Blocks</SheetTitle>
        </SheetHeader>
        <div
          style={{
            padding: 12,
            display: "grid",
            gap: 12,
            overflowY: "auto",
            maxHeight: "calc(100vh - 120px)",
          }}
        >
          {blocks.map((block) => (
            <PaletteItem
              title={block.title}
              description={block.description}
              type={block.type}
              data={block.data}
              onAdd={(t, d) => addNode(t, d)}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const PaletteItem = ({
  title,
  description,
  type,
  data,
  onAdd,
}: {
  title: string;
  description?: string;
  type: string;
  data: any;
  onAdd: (type: string, data: any) => void;
}) => {
  return (
    <div
      role="button"
      onClick={() => onAdd(type, data)}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 12,
        cursor: "pointer",
        background: "#fff",
      }}
      title="드래그하여 플로우에 추가"
    >
      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      {description ? (
        <div style={{ fontSize: 12, color: "#6b7280" }}>{description}</div>
      ) : null}
    </div>
  );
};
