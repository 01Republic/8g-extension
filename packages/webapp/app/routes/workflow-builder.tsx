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
} from "~/.server/services";
import type { WorkflowType } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";

export async function loader({ params }: Route.LoaderArgs) {
  const workflowId = params.workflowId
    ? parseInt(params.workflowId)
    : undefined;

  // Fetch products from API
  const productsResponse = await fetchProducts({ itemsPerPage: 100 });

  if (workflowId) {
    const workflow = await findWorkflowMetadata(workflowId);
    return {
      workflowId,
      workflow: workflow
        ? {
            id: workflow.id,
            description: workflow.description,
            meta: workflow.meta,
            type: workflow.type,
            productId: workflow.productId,
          }
        : null,
      products: productsResponse.items,
    };
  }

  return {
    workflowId: undefined,
    workflow: null,
    products: productsResponse.items,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const workflowIdStr = formData.get("workflowId")?.toString();
  const workflowId = workflowIdStr ? parseInt(workflowIdStr) : undefined;
  const productIdStr = formData.get("productId")!.toString();
  const productId = parseInt(productIdStr);
  const description = formData.get("description")!.toString();
  const meta = JSON.parse(formData.get("meta")!.toString()) as FormWorkflow;
  const typeStr = formData.get("type")?.toString() as WorkflowType | undefined;

  return await upsertWorkflowMetadata({
    workflowId,
    productId,
    description,
    meta,
    type: typeStr || "WORKFLOW",
  });
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
  }) => {
    const { workflowId, productId, description, meta, type } = payload;

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
      onSave={onSave}
      isSaving={isSaving}
      type={loaderData.workflow?.type as WorkflowType | undefined}
      products={loaderData.products}
    />
  );
}
