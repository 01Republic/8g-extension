import type { Route } from "./+types/workflows";
import WorkflowsPage from "~/client/admin/workflows/WorkflowsPage";
import { useFetcher } from "react-router";
import { deleteWorkflows } from "~/.server/services/workflow/delete-workflows.service";
import { findAllWorkflows } from "~/.server/services/workflow/find-all-workflows.service";
import { publishWorkflow, unpublishWorkflow } from "~/.server/services/workflow";
import { fetchProducts } from "~/.server/services";
import { IsNull, Not } from "typeorm";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const itemsPerPage = parseInt(url.searchParams.get("itemsPerPage") || "10");
  const productId = url.searchParams.get("productId");
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");

  // where 조건 구성 (데이터베이스 컬럼명은 스네이크 케이스)
  const where: any = {};
  if (productId && productId !== "all") {
    where.productId = parseInt(productId);
  }
  if (type && type !== "all") {
    where.type = type;
  }
  if (status === "published") {
    where.publishedAt = Not(IsNull());
  } else if (status === "draft") {
    where.publishedAt = IsNull();
  }

  const workflowsResponse = await findAllWorkflows({
    page,
    itemsPerPage,
    where,
    order: { id: "DESC" },
    relations: [],
    limit: itemsPerPage,
    offset: (page - 1) * itemsPerPage,
  });

  const productsResponse = await fetchProducts({ itemsPerPage: 100 });

  return {
    workflows: workflowsResponse.items,
    pagination: workflowsResponse.pagination,
    products: productsResponse.items,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("_action")?.toString();
  const workflowId = parseInt(formData.get("workflowId")!.toString());

  switch (actionType) {
    case "delete":
      await deleteWorkflows(workflowId);
      return { success: true, action: "delete" };

    case "publish":
      const published = await publishWorkflow(workflowId);
      return { success: true, action: "publish", workflow: published };

    case "unpublish":
      const unpublished = await unpublishWorkflow(workflowId);
      return { success: true, action: "unpublish", workflow: unpublished };

    default:
      throw new Error("Invalid action type");
  }
}

export default function Workflows({ loaderData }: Route.ComponentProps) {
  const { workflows, pagination, products } = loaderData;
  const fetcher = useFetcher();

  const onDelete = async (workflowId: number) => {
    const formData = new FormData();
    formData.append("_action", "delete");
    formData.append("workflowId", workflowId.toString());
    fetcher.submit(formData, { method: "POST" });
  };

  const onPublish = async (workflowId: number) => {
    const formData = new FormData();
    formData.append("_action", "publish");
    formData.append("workflowId", workflowId.toString());
    fetcher.submit(formData, { method: "POST" });
  };

  const onUnpublish = async (workflowId: number) => {
    const formData = new FormData();
    formData.append("_action", "unpublish");
    formData.append("workflowId", workflowId.toString());
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <WorkflowsPage
      workflows={workflows as any}
      pagination={pagination}
      deleteWorkflows={onDelete}
      publishWorkflow={onPublish}
      unpublishWorkflow={onUnpublish}
      products={products}
    />
  );
}
