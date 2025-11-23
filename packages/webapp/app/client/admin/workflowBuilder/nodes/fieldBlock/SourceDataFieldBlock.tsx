import { Label } from "~/components/ui/label";
import { FieldBlockContentBox } from "./FieldBlockContentBox";
import type { ParsedField } from "~/lib/schema-parser";
import { Checkbox } from "~/components/ui/checkbox";
import { useReactFlow } from "@xyflow/react";
import { blockLabels } from "../index";

interface SourceDataFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
  currentNodeId: string;
}

export const SourceDataFieldBlock = (props: SourceDataFieldBlockProps) => {
  const { field, formData, updateFormField, currentNodeId } = props;
  const { name } = field;
  const { getNodes, getEdges } = useReactFlow();

  // 현재 노드보다 이전에 있는 모든 노드들 찾기 (재귀적으로)
  const getPreviousNodes = () => {
    const allNodes = getNodes();
    const allEdges = getEdges();

    // BFS로 현재 노드 이전의 모든 노드 찾기
    const visited = new Set<string>();
    const queue: string[] = [];

    // 현재 노드로 들어오는 edge들의 source를 큐에 추가
    const incomingEdges = allEdges.filter(
      (edge) => edge.target === currentNodeId,
    );
    incomingEdges.forEach((edge) => {
      if (!visited.has(edge.source)) {
        visited.add(edge.source);
        queue.push(edge.source);
      }
    });

    // BFS로 모든 이전 노드 탐색
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const prevEdges = allEdges.filter((edge) => edge.target === nodeId);

      prevEdges.forEach((edge) => {
        if (!visited.has(edge.source)) {
          visited.add(edge.source);
          queue.push(edge.source);
        }
      });
    }

    // visited에 있는 노드들 반환
    return allNodes.filter((node) => visited.has(node.id));
  };

  const previousNodes = getPreviousNodes();

  // 현재 값 파싱 - 배열 또는 단일 string 지원
  const currentValue = formData[name] || "";

  // 선택된 노드 ID들을 Set으로 관리
  const getSelectedNodeIds = (): Set<string> => {
    const selectedIds = new Set<string>();

    if (Array.isArray(currentValue)) {
      // 배열인 경우
      currentValue.forEach((item: string) => {
        const match = item.match(/\$\{steps\.([^.}]+)\.result/);
        if (match) selectedIds.add(match[1]);
      });
    } else if (typeof currentValue === "string" && currentValue) {
      // 단일 string인 경우
      const match = currentValue.match(/\$\{steps\.([^.}]+)\.result/);
      if (match) selectedIds.add(match[1]);
    }

    return selectedIds;
  };

  const selectedNodeIds = getSelectedNodeIds();

  const handleNodeToggle = (nodeId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedNodeIds);

    if (checked) {
      newSelectedIds.add(nodeId);
    } else {
      newSelectedIds.delete(nodeId);
    }

    // 선택된 노드들을 배열로 변환
    if (newSelectedIds.size === 0) {
      updateFormField(name, undefined);
    } else if (newSelectedIds.size === 1) {
      // 단일 선택인 경우 string으로 (backward compatibility)
      const nodeId = Array.from(newSelectedIds)[0];
      updateFormField(name, `\${steps.${nodeId}.result.data}`);
    } else {
      // 다중 선택인 경우 배열로
      const selectedArray = Array.from(newSelectedIds).map(
        (id) => `\${steps.${id}.result.data}`,
      );
      updateFormField(name, selectedArray);
    }
  };

  return (
    <FieldBlockContentBox key={name} label="소스 데이터">
      <div className="space-y-2">
        {previousNodes.length === 0 ? (
          <div className="p-2 text-sm text-gray-500">이전 노드가 없습니다</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {previousNodes.map((node) => {
              const blockName = (node.data as any)?.block?.name || "";
              const displayName =
                blockName && blockLabels[blockName]
                  ? blockLabels[blockName].title
                  : blockName || node.id;
              const isChecked = selectedNodeIds.has(node.id);

              return (
                <div key={node.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`node-${node.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleNodeToggle(node.id, checked === true)
                    }
                  />
                  <label
                    htmlFor={`node-${node.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <span className="font-mono text-xs text-gray-600">
                      {node.id}
                    </span>
                    <span className="mx-1">-</span>
                    <span>{displayName}</span>
                  </label>
                </div>
              );
            })}
          </div>
        )}

        {selectedNodeIds.size > 0 && (
          <div className="mt-3 p-2 bg-gray-50 rounded border">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              선택된 노드 ({selectedNodeIds.size}개):
            </div>
            <div className="text-xs text-gray-600 font-mono space-y-0.5">
              {Array.isArray(currentValue) ? (
                currentValue.map((item: string, idx: number) => (
                  <div key={idx}>{item}</div>
                ))
              ) : (
                <div>{currentValue}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </FieldBlockContentBox>
  );
};
