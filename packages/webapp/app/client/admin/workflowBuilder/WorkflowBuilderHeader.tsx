import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { WorkflowType } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";

interface Product {
  id: number;
  nameKo: string;
  nameEn: string;
}

interface WorkflowBuilderHeaderProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  runWorkflow: () => void;
  isRunning: boolean;
  onSaveClick: () => void;
  onParametersClick: () => void;
  onExportClick: () => void;
  onImportClick: () => void;
  type?: WorkflowType;
  onApiTypeChange?: (type: WorkflowType) => void;
  productId: number;
  onProductIdChange: (id: number) => void;
  products: Product[];
}

export const WorkflowBuilderHeader = ({
  targetUrl,
  setTargetUrl,
  runWorkflow,
  isRunning,
  onSaveClick,
  onParametersClick,
  onExportClick,
  onImportClick,
  type = "WORKFLOW",
  onApiTypeChange,
  productId,
  onProductIdChange,
  products,
}: WorkflowBuilderHeaderProps) => {
  const typeLabels: Record<WorkflowType, string> = {
    WORKFLOW: "⚡ Data Collection",
    WORKSPACE: "🏢 Get Workspaces",
    WORKSPACE_DETAIL: "🏢 Get Workspace Detail",
    MEMBERS: "👥 Get Members",
    ADD_MEMBERS: "➕ Add Members",
    DELETE_MEMBERS: "➖ Delete Members",
    BILLING: "💳 Billing",
    BILLING_HISTORIES: "📊 Billing Histories",
  };

  // 파라미터가 필요한 타입인지 확인
  const needsParameters = [
    "WORKSPACE_DETAIL",
    "MEMBERS",
    "ADD_MEMBERS",
    "DELETE_MEMBERS",
    "BILLING",
    "BILLING_HISTORIES",
  ].includes(type);

  return (
    <>
      <Select
        value={productId.toString()}
        onValueChange={(value) => onProductIdChange(parseInt(value))}
      >
        <SelectTrigger style={{ width: 200 }}>
          <SelectValue placeholder="Select Product" />
        </SelectTrigger>
        <SelectContent>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id.toString()}>
              {product.nameKo || product.nameEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={type}
        onValueChange={(value) => onApiTypeChange?.(value as WorkflowType)}
      >
        <SelectTrigger style={{ width: 200 }}>
          <SelectValue placeholder="Select Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="WORKFLOW">{typeLabels.WORKFLOW}</SelectItem>
          <SelectItem value="WORKSPACE">{typeLabels.WORKSPACE}</SelectItem>
          <SelectItem value="WORKSPACE_DETAIL">
            {typeLabels.WORKSPACE_DETAIL}
          </SelectItem>
          <SelectItem value="MEMBERS">{typeLabels.MEMBERS}</SelectItem>
          <SelectItem value="ADD_MEMBERS">{typeLabels.ADD_MEMBERS}</SelectItem>
          <SelectItem value="DELETE_MEMBERS">
            {typeLabels.DELETE_MEMBERS}
          </SelectItem>
          <SelectItem value="BILLING">{typeLabels.BILLING}</SelectItem>
          <SelectItem value="BILLING_HISTORIES">
            {typeLabels.BILLING_HISTORIES}
          </SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder="Target URL (기본: 현재 탭)"
        value={targetUrl}
        onChange={(e) => setTargetUrl(e.target.value)}
        style={{ maxWidth: 480 }}
      />
      <Button onClick={runWorkflow} disabled={isRunning}>
        {isRunning ? "Running…" : "Run Workflow"}
      </Button>
      <Button variant="outline" onClick={onExportClick}>
        Export JSON
      </Button>
      <Button variant="outline" onClick={onImportClick}>
        Import JSON
      </Button>
      <Button variant="outline" onClick={onSaveClick}>
        저장
      </Button>
      <div style={{ marginLeft: "auto" }} />
    </>
  );
};
