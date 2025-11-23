import axios from "axios";
import type { IntegrationAppWorkflowMetadata } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";
import { FindAllQueryDto } from "~/.server/dto/FindAllQueryDto";
import { PaginationMetaData } from "~/.server/dto/pagination-meta-data.dto";
import type { Paginated } from "~/.server/dto/paginated.dto";

const WORKFLOW_API_BASE_URL =
  process.env.WORKFLOW_API_BASE_URL || "http://localhost:8000";

export class FindAllIntegrationAppWorkflowQueryDto extends FindAllQueryDto<IntegrationAppWorkflowMetadata> {
  //
}

interface WorkflowMetadataResponse {
  items: IntegrationAppWorkflowMetadata[];
  pagination: PaginationMetaData;
}

export async function findAllWorkflows(
  query: FindAllIntegrationAppWorkflowQueryDto,
): Promise<WorkflowMetadataResponse> {
  const { page = 1, itemsPerPage = 10, where, order, relations = [] } = query;

  // Query parameters 구성
  const params: Record<string, any> = {
    page,
    itemsPerPage,
  };

  // Only add where if it has properties
  if (where && Object.keys(where).length > 0) {
    params.where = where;
  }

  // Only add order if it has properties
  if (order && Object.keys(order).length > 0) {
    params.order = order;
  }

  // Only add relations if it has items
  if (relations.length > 0) {
    params.relations = relations.join(",");
  }

  const { data } = await axios.get<Paginated<IntegrationAppWorkflowMetadata>>(
    `${WORKFLOW_API_BASE_URL}/8g/workflows`,
    { params },
  );

  const { items, pagination } = data;

  // 최신순 정렬 (API에서 정렬되지 않은 경우)
  return {
    items: items.sort((a, b) => b.id - a.id),
    pagination,
  };
}
