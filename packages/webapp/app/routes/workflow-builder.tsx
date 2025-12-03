import "@xyflow/react/dist/style.css";
import WorkflowBuilderPage from "~/client/admin/workflowBuilder/WorkflowBuilderPage";
import type { Route } from "./+types/workflow-builder";
import type { FormWorkflow } from "~/models/workflow/types";
import { useFetcher } from "react-router";
import React, { useEffect } from "react";
import { redirect } from "react-router";
import { toast } from "sonner";
import {
  findWorkflowMetadata,
  upsertWorkflowMetadata,
  fetchProducts,
  publishWorkflow,
  unpublishWorkflow,
  findNodePositions,
  upsertNodePositions,
} from "~/.server/services";
import type { WorkflowType } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";
import type {
  NodePositionsMap,
  NodeGroupsMap,
  NodeAliasesMap,
} from "~/.server/db/entities/WorkflowNodePositions";

export async function loader({ params }: Route.LoaderArgs) {
  const workflowId = params.workflowId
    ? parseInt(params.workflowId)
    : undefined;

  // Fetch products from API
  const productsResponse = await fetchProducts({ itemsPerPage: 100 });

  if (workflowId) {
    const [workflow, nodePositionsEntity] = await Promise.all([
      findWorkflowMetadata(workflowId),
      findNodePositions(workflowId),
    ]);
    return {
      workflowId,
      workflow: workflow
        ? {
            id: workflow.id,
            description: workflow.description,
            meta: workflow.meta,
            type: workflow.type,
            productId: workflow.productId,
            publishedAt: workflow.publishedAt,
          }
        : null,
      nodePositions: nodePositionsEntity?.positions ?? null,
      nodeGroups: nodePositionsEntity?.groups ?? null,
      nodeAliases: nodePositionsEntity?.aliases ?? null,
      products: productsResponse.items,
    };
  }

  return {
    workflowId: undefined,
    workflow: null,
    nodePositions: null,
    nodeGroups: null,
    nodeAliases: null,
    products: productsResponse.items,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("_action")?.toString();

  if (actionType === "publish") {
    const workflowId = parseInt(formData.get("workflowId")!.toString());
    const published = await publishWorkflow(workflowId);
    return { success: true, action: "publish", workflow: published };
  }

  if (actionType === "unpublish") {
    const workflowId = parseInt(formData.get("workflowId")!.toString());
    const unpublished = await unpublishWorkflow(workflowId);
    return { success: true, action: "unpublish", workflow: unpublished };
  }

  // Original save logic
  const workflowIdStr = formData.get("workflowId")?.toString();
  const workflowId = workflowIdStr ? parseInt(workflowIdStr) : undefined;
  const productIdStr = formData.get("productId")!.toString();
  const productId = parseInt(productIdStr);
  const description = formData.get("description")!.toString();
  const meta = JSON.parse(formData.get("meta")!.toString()) as FormWorkflow;
  const typeStr = formData.get("type")?.toString() as WorkflowType | undefined;
  const nodePositionsStr = formData.get("nodePositions")?.toString();
  const nodePositions = nodePositionsStr
    ? (JSON.parse(nodePositionsStr) as NodePositionsMap)
    : null;
  const nodeGroupsStr = formData.get("nodeGroups")?.toString();
  const nodeGroups = nodeGroupsStr
    ? (JSON.parse(nodeGroupsStr) as NodeGroupsMap)
    : null;
  const nodeAliasesStr = formData.get("nodeAliases")?.toString();
  const nodeAliases = nodeAliasesStr
    ? (JSON.parse(nodeAliasesStr) as NodeAliasesMap)
    : null;

  const savedWorkflow = await upsertWorkflowMetadata({
    workflowId,
    productId,
    description,
    meta,
    type: typeStr || "WORKFLOW",
  });

  // 노드 위치, 그룹, 별칭 정보 저장 (워크플로우 ID가 있어야 저장 가능)
  if (savedWorkflow && nodePositions) {
    await upsertNodePositions({
      workflowId: savedWorkflow.id,
      positions: nodePositions,
      groups: nodeGroups,
      aliases: nodeAliases,
    });
  }

  return savedWorkflow;
}

export default function WorkflowBuilder({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const isSaving = fetcher.state !== "idle";
  const prevFetcherState = React.useRef(fetcher.state);

  const onSave = (payload: {
    workflowId?: number;
    productId: number;
    description: string;
    meta: FormWorkflow;
    type?: WorkflowType;
    nodePositions?: NodePositionsMap;
    nodeGroups?: NodeGroupsMap | null;
    nodeAliases?: NodeAliasesMap | null;
  }) => {
    const {
      workflowId,
      productId,
      description,
      meta,
      type,
      nodePositions,
      nodeGroups,
      nodeAliases,
    } = payload;

    const formData = new FormData();
    if (workflowId) {
      formData.append("workflowId", workflowId.toString());
    }
    formData.append("productId", productId.toString());
    formData.append("description", description);
    formData.append("meta", JSON.stringify(meta));
    if (type) {
      formData.append("type", type);
    }
    if (nodePositions) {
      formData.append("nodePositions", JSON.stringify(nodePositions));
    }
    if (nodeGroups) {
      formData.append("nodeGroups", JSON.stringify(nodeGroups));
    }
    if (nodeAliases) {
      formData.append("nodeAliases", JSON.stringify(nodeAliases));
    }
    fetcher.submit(formData, { method: "POST" });
  };

  useEffect(() => {
    // 이전 상태가 submitting/loading이었고 현재가 idle이면 저장 완료
    const wasSubmitting =
      prevFetcherState.current === "submitting" ||
      prevFetcherState.current === "loading";
    const isNowIdle = fetcher.state === "idle";

    if (wasSubmitting && isNowIdle) {
      const data = fetcher.data as any;
      const hasError = data && typeof data === "object" && "error" in data;

      if (hasError) {
        toast.error("저장 중 오류가 발생했습니다.");
      } else {
        toast.success("워크플로우가 저장되었습니다.");
      }
    }

    prevFetcherState.current = fetcher.state;
  }, [fetcher.state, fetcher.data]);

  return (
    <WorkflowBuilderPage
      workflowId={loaderData.workflowId}
      initialWorkflow={loaderData.workflow}
      initialNodePositions={loaderData.nodePositions}
      initialNodeGroups={loaderData.nodeGroups}
      initialNodeAliases={loaderData.nodeAliases}
      onSave={onSave}
      isSaving={isSaving}
      type={loaderData.workflow?.type as WorkflowType | undefined}
      products={loaderData.products}
    />
  );
}
