import { Link, useNavigate, useSearchParams } from "react-router";
import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type {
  IntegrationAppWorkflowMetadata,
  WorkflowType,
} from "~/.server/db/entities/IntegrationAppWorkflowMetadata";
import type { PaginationMetaData } from "~/.server/dto/pagination-meta-data.dto";

interface Product {
  id: number;
  nameKo: string;
  nameEn: string;
  image?: string;
}

interface WorkflowsTableProps {
  workflows: IntegrationAppWorkflowMetadata[];
  pagination: PaginationMetaData;
  deleteWorkflows: (workflowId: number) => void;
  products: Product[];
}

const formatDate = (date: Date | null) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const getWorkflowTypeBadge = (type: WorkflowType) => {
  const badges: Record<WorkflowType, { label: string; className: string }> = {
    WORKFLOW: { label: "⚡ Data", className: "bg-blue-100 text-blue-800" },
    WORKSPACE: {
      label: "🏢 Workspaces",
      className: "bg-purple-100 text-purple-800",
    },
    WORKSPACE_DETAIL: {
      label: "🏢 Workspace Detail",
      className: "bg-purple-100 text-purple-800",
    },
    MEMBERS: { label: "👥 Members", className: "bg-green-100 text-green-800" },
    ADD_MEMBERS: {
      label: "➕ Add Members",
      className: "bg-green-100 text-green-800",
    },
    DELETE_MEMBERS: {
      label: "➖ Delete Members",
      className: "bg-red-100 text-red-800",
    },
    BILLING: {
      label: "💳 Billing",
      className: "bg-orange-100 text-orange-800",
    },
    BILLING_HISTORIES: {
      label: "📊 Billing_Histories",
      className: "bg-pink-100 text-pink-800",
    },
  };
  return badges[type] || badges.WORKFLOW;
};

export const WorkflowsTable = (props: WorkflowsTableProps) => {
  const { workflows, pagination, deleteWorkflows, products } = props;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentPage = pagination.currentPage;
  const totalPages = pagination.totalPage;
  const itemsPerPage = pagination.itemsPerPage;

  // URL에서 현재 필터 값 가져오기
  const selectedProductId = searchParams.get("productId") || "all";
  const selectedType = searchParams.get("type") || "all";

  // Product ID로 매핑
  const productMap = useMemo(() => {
    const map: Record<number, Product> = {};
    products.forEach((p) => (map[p.id] = p));
    return map;
  }, [products]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    navigate(`/?${params.toString()}`);
  };

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    params.set("itemsPerPage", newItemsPerPage);
    navigate(`/?${params.toString()}`);
  };

  const handleProductFilterChange = (productId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // 필터 변경 시 첫 페이지로
    if (productId === "all") {
      params.delete("productId");
    } else {
      params.set("productId", productId);
    }
    navigate(`/?${params.toString()}`);
  };

  const handleTypeFilterChange = (type: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // 필터 변경 시 첫 페이지로
    if (type === "all") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    navigate(`/?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* 필터 영역 */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Product:</span>
          <Select
            value={selectedProductId}
            onValueChange={handleProductFilterChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.nameKo || product.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Type:</span>
          <Select value={selectedType} onValueChange={handleTypeFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="WORKFLOW">⚡ Data</SelectItem>
              <SelectItem value="WORKSPACE">🏢 Workspaces</SelectItem>
              <SelectItem value="MEMBERS">👥 Members</SelectItem>
              <SelectItem value="PLAN">💳 Plan</SelectItem>
              <SelectItem value="BILLING">📊 Billing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto text-sm text-gray-600">
          {pagination.currentItemCount}개 / 전체 {pagination.totalItemCount}개
        </div>
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold text-gray-900">ID</TableHead>
              <TableHead className="font-semibold text-gray-900">
                Product
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Type
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                설명
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Steps 수
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                수정일
              </TableHead>
              <TableHead className="font-semibold text-gray-900 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  워크플로우가 없습니다. 새로운 워크플로우를 만들어보세요!
                </TableCell>
              </TableRow>
            ) : (
              workflows.map((workflow) => {
                const type = workflow.type as WorkflowType;
                const badge = getWorkflowTypeBadge(type);
                const product = productMap[workflow.productId];

                return (
                  <TableRow key={workflow.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      #{workflow.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {product?.image && (
                          <img
                            src={product.image}
                            alt=""
                            className="w-5 h-5 rounded"
                          />
                        )}
                        <span className="text-sm font-medium">
                          {product?.nameKo ||
                            product?.nameEn ||
                            `Product ${workflow.productId}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{workflow.description}</div>
                    </TableCell>
                    <TableCell>
                      {workflow.meta?.steps?.length || 0} steps
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(
                        workflow.updatedAt || workflow.createdAt || null,
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link to={`/workflow-builder/${workflow.id}`}>
                        <Button variant="outline" size="sm">
                          수정
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteWorkflows(workflow.id)}
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination 영역 */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">페이지당 항목:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-600">
            전체 {pagination.totalItemCount}개 중{" "}
            {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, pagination.totalItemCount)}개
            표시
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            «
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-9"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            »
          </Button>
        </div>
      </div>
    </div>
  );
};
