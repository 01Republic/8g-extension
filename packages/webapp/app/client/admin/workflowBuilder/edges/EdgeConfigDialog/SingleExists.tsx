import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { EdgFieldContentBox } from "./EdgFieldContentBox";
import { Input } from "~/components/ui/input";
import { usePreviousNodes } from "~/hooks/use-previous-nodes";
import type { ExistsData } from "./edgeDataConverter";
import type { Dispatch, SetStateAction } from "react";

interface SingleExistsProps {
  targetNodeId: string;
  data: ExistsData;
  onChange: Dispatch<SetStateAction<ExistsData>>;
}

export const SingleExists = ({
  targetNodeId,
  data,
  onChange,
}: SingleExistsProps) => {
  const { previousNodes, getNodeDisplayName } = usePreviousNodes(targetNodeId);

  const updateField = <K extends keyof ExistsData>(
    field: K,
    value: ExistsData[K],
  ) => {
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <EdgFieldContentBox label="확인할 노드">
        <Select
          value={data.nodeId}
          onValueChange={(v) => updateField("nodeId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="노드 선택" />
          </SelectTrigger>
          <SelectContent>
            {previousNodes.map((node) => (
              <SelectItem key={node.id} value={node.id}>
                {getNodeDisplayName(node)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </EdgFieldContentBox>

      <EdgFieldContentBox
        label="결과 경로"
        helperText={`최종 경로: $.steps.${data.nodeId}.${data.path}`}
      >
        <Input
          placeholder="result"
          value={data.path}
          className="w-full flex-1"
          onChange={(e) => updateField("path", e.target.value)}
        />
      </EdgFieldContentBox>
    </>
  );
};
