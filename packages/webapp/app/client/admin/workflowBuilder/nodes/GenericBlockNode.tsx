import { useMemo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { z } from "zod";
import type { Block, RepeatConfig } from "scordi-extension";
import { cn } from "~/lib/utils";
import { parseZodSchema } from "~/lib/schema-parser";
import { blockLabels, fieldLabels } from "./index";
import { BlockActionHandlerModal } from "./BlockActionHandlerModal";

type GenericBlockNodeData = {
  block: Block;
  title?: string;
  schema: z.ZodTypeAny;
  repeat?: RepeatConfig;
  executionResults?: Record<string, any>;
};

type GenericBlockNodeType = Node<GenericBlockNodeData>;

export default function GenericBlockNode({
  id,
  data,
  selected,
}: NodeProps<GenericBlockNodeType>) {
  const { block, schema, repeat, executionResults } = data;
  const previewRole = (data as any)
    ? ((data as any).__subtreePreviewRole as
        | "start"
        | "middle"
        | "end-neighbor"
        | undefined)
    : undefined;
  const blockName = block.name;
  const { title } = blockLabels[blockName];

  const parsedSchema = useMemo(() => parseZodSchema(schema), [schema]);

  // Repeat 뱃지 텍스트 생성
  const repeatBadgeText = useMemo(() => {
    if (!repeat) return null;
    const scopeSuffix = repeat.scope === "subtree" ? " · subtree" : "";
    if ("forEach" in repeat) {
      return `forEach${scopeSuffix}`;
    }
    if ("count" in repeat) {
      const count = typeof repeat.count === "string" ? "변수" : repeat.count;
      return `×${count}${scopeSuffix}`;
    }
    return null;
  }, [repeat]);

  const previewClass = previewRole
    ? previewRole === "start"
      ? "border-blue-500 bg-blue-50 shadow-md"
      : previewRole === "end-neighbor"
        ? "border-amber-500 bg-amber-50"
        : "border-blue-300 bg-blue-50/60"
    : "";

  return (
    <div
      className={cn(
        "border rounded-md bg-white shadow overflow-hidden transition-colors",
        selected ? "border-primary-700" : "border-gray-200",
        previewClass,
      )}
    >
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{title}</span>
          {(repeatBadgeText || previewRole) && (
            <span className="px-2 py-0.5 text-xxs bg-gray-100 text-gray-700 rounded border border-gray-300 font-medium">
              {repeatBadgeText}
              {repeatBadgeText && previewRole ? " · " : ""}
              {previewRole
                ? previewRole === "start"
                  ? "subtree-start"
                  : previewRole === "end-neighbor"
                    ? "subtree-end"
                    : "subtree"
                : null}
            </span>
          )}
        </div>

        {/* 수정 버튼 */}
        <BlockActionHandlerModal
          id={id}
          title={title}
          parsedSchema={parsedSchema}
          block={block}
          repeat={repeat}
          executionResults={executionResults}
        />
      </div>

      <div className="px-3 py-2 flex gap-1 flex-col">
        {Object.entries(block).map(([key, value]) => {
          if (key === "name") return null;
          if (key === "option") {
            return Object.entries(value as any).map(([optKey, optVal]) => (
              <Row
                key={`option.${optKey}`}
                label={fieldLabels[optKey] || optKey}
                value={String(optVal)}
              />
            ));
          }
          if (value === undefined || value === null || value === "")
            return null;

          const displayValue =
            typeof value === "object" ? JSON.stringify(value) : String(value);
          return (
            <Row
              key={key}
              label={fieldLabels[key] || key}
              value={displayValue}
            />
          );
        })}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ borderRadius: 4, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ borderRadius: 4, width: 8, height: 8 }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-10 items-center">
      <span className="text-xxs text-gray-500 whitespace-nowrap">{label}</span>
      <span className="text-sm text-gray-700 font-semibold">{value}</span>
    </div>
  );
}
