import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "~/lib/utils";
import type { WorkflowType } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";

interface Product {
  id: number;
  nameKo: string;
  nameEn: string;
  image?: string;
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
  workflowId?: number;
  publishedAt?: Date | null;
  onPublishClick?: () => void;
  onUnpublishClick?: () => void;
  isPublishing?: boolean;
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
  workflowId,
  publishedAt,
  onPublishClick,
  onUnpublishClick,
  isPublishing = false,
}: WorkflowBuilderHeaderProps) => {
  const [productComboboxOpen, setProductComboboxOpen] = useState(false);

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
      {publishedAt && (
        <Badge variant="default" className="bg-green-600 text-white whitespace-nowrap">
          ✅ Published
        </Badge>
      )}
      <Popover open={productComboboxOpen} onOpenChange={setProductComboboxOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={productComboboxOpen}
            style={{ width: 200 }}
            className="justify-between"
          >
            {products.find((p) => p.id === productId)?.nameKo ||
              products.find((p) => p.id === productId)?.nameEn ||
              "Select Product"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="제품 검색..." />
            <CommandList>
              <CommandEmpty>제품을 찾을 수 없습니다.</CommandEmpty>
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={`${product.nameKo} ${product.nameEn} ${product.id}`}
                    onSelect={() => {
                      onProductIdChange(product.id);
                      setProductComboboxOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        productId === product.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2">
                      {product.image && (
                        <img
                          src={product.image}
                          alt=""
                          className="w-4 h-4 rounded"
                        />
                      )}
                      <span>{product.nameKo || product.nameEn}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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
      {workflowId && (
        publishedAt ? (
          <Button
            variant="outline"
            onClick={onUnpublishClick}
            disabled={isPublishing}
          >
            {isPublishing ? "처리 중..." : "배포 취소"}
          </Button>
        ) : (
          <Button
            variant="default"
            onClick={onPublishClick}
            disabled={isPublishing}
          >
            {isPublishing ? "배포 중..." : "배포"}
          </Button>
        )
      )}
      <div style={{ marginLeft: "auto" }} />
    </>
  );
};
