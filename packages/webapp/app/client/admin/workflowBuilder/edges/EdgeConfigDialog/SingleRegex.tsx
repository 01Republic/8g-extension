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
import type { RegexData } from "./edgeDataConverter";
import type { Dispatch, SetStateAction } from "react";

interface SingleRegexProps {
  targetNodeId: string;
  data: RegexData;
  onChange: Dispatch<SetStateAction<RegexData>>;
}

export const SingleRegex = ({
  targetNodeId,
  data,
  onChange,
}: SingleRegexProps) => {
  const { previousNodes, getNodeDisplayName } = usePreviousNodes(targetNodeId);

  const updateField = <K extends keyof RegexData>(
    field: K,
    value: RegexData[K],
  ) => {
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <EdgFieldContentBox label="비교할 노드">
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
          placeholder="result.data"
          value={data.path}
          onChange={(e) => updateField("path", e.target.value)}
        />
      </EdgFieldContentBox>

      <EdgFieldContentBox label="정규식 패턴">
        <Input
          placeholder="^OK$"
          value={data.pattern}
          onChange={(e) => updateField("pattern", e.target.value)}
        />
      </EdgFieldContentBox>
    </>
  );
};
