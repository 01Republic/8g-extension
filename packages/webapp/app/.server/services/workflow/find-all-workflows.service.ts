import { initializeDatabase } from "~/.server/db/config";
import { IntegrationAppWorkflowMetadata } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";
import { FindAllQueryDto } from "~/.server/dto/FindAllQueryDto";
import { PaginationMetaData } from "~/.server/dto/pagination-meta-data.dto";

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
  await initializeDatabase();

  const { page = 1, itemsPerPage = 10, where, order } = query;

  // Build TypeORM find options
  const skip = (page - 1) * itemsPerPage;
  const take = itemsPerPage;

  const [items, totalCount] = await IntegrationAppWorkflowMetadata.findAndCount({
    where,
    order: order || { id: "DESC" }, // Default to latest first
    skip,
    take,
  });

  const totalPage = Math.ceil(totalCount / itemsPerPage);

  const pagination: PaginationMetaData = {
    currentPage: page,
    itemsPerPage,
    totalItemCount: totalCount,
    currentItemCount: items.length,
    totalPage,
  };

  return {
    items,
    pagination,
  };
}
