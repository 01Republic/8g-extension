import { memo } from "react";
import { NodeResizer, type NodeProps, type Node } from "@xyflow/react";

export type GroupNodeData = {
  label: string;
  color: string;
  [key: string]: unknown;
};

type GroupNodeType = Node<GroupNodeData>;

function GroupNode({ data, selected }: NodeProps<GroupNodeType>) {
  const { label, color } = data;

  return (
    <div
      className="group-node-container"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: `${color}15`,
        border: `2px dashed ${color}`,
        borderRadius: 8,
        position: "relative",
        outline: "none",
        boxShadow: "none",
        cursor: "grab",
      }}
    >
      <NodeResizer
        minWidth={150}
        minHeight={100}
        isVisible={selected}
        lineClassName="!border-transparent"
        handleClassName="h-3 w-3 bg-white border-2 rounded"
      />
      {/* 라벨 */}
      <div
        style={{
          position: "absolute",
          top: -24,
          left: 8,
          backgroundColor: color,
          color: "white",
          padding: "2px 12px",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default memo(GroupNode);
