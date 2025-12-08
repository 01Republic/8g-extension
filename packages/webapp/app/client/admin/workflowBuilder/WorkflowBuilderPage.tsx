import React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./styles/workflow-builder.css";
import { workflowNodeTypes } from "~/client/admin/workflowBuilder/nodes";
import type { Workflow, Block } from "scordi-extension";
import { AllBlockSchemas } from "scordi-extension";
import { Button } from "~/components/ui/button";
import { PaletteSheet } from "./PaletteSheet";
import { ResultPanel } from "./ResultPanel";
import { WorkflowBuilderHeader } from "./WorkflowBuilderHeader";
import { blockLabels } from "./nodes";
import { runWorkflow } from "~/models/workflow/WorkflowRunner";
import type { WorkflowType } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";
import { buildWorkflowJson } from "~/models/workflow/WorkflowBuilder";
import type { WorkflowEdge, SwitchEdgeData } from "~/models/workflow/types";
import { ConditionalEdge } from "./edges/ConditionalEdge";

import { getLayoutedElements } from "./utils/autoLayout";
import type { FormWorkflow } from "~/models/integration/types";
import { SaveDialog } from "./SaveDialog";
import {
  convertWorkflowToNodesAndEdges,
  type NodePositionsMap,
} from "./utils/workflowConverter";
import type {
  NodeGroupsMap,
  NodeAliasesMap,
} from "~/.server/db/entities/WorkflowNodePositions";
import { GroupDialog, GROUP_COLORS } from "./GroupDialog";
import { useNodesState } from "@xyflow/react";
import { VariablesDialog } from "./VariablesDialog";
import { VariablesPreviewPanel } from "./VariablesPreviewPanel";
import { EdgeConfigDialog } from "./edges/EdgeConfigDialog";
import { WorkflowParametersDialog } from "./WorkflowParametersDialog";
import {
  exportWorkflowWithMetadata,
  importWorkflowWithMetadata,
} from "./utils/exportImport";
import {
  SubtreePreviewProvider,
  type SubtreePreviewPayload,
} from "./context/SubtreePreviewContext";
import { useFetcher } from "react-router";
import { toast } from "sonner";

interface Product {
  id: number;
  nameKo: string;
  nameEn: string;
}

interface WorkflowBuilderPageProps {
  workflowId?: number;
  initialWorkflow?: {
    id: number;
    description: string;
    meta: FormWorkflow;
    productId: number;
    publishedAt?: Date | null;
  } | null;
  initialNodePositions?: NodePositionsMap | null;
  initialNodeGroups?: NodeGroupsMap | null;
  initialNodeAliases?: NodeAliasesMap | null;
  onSave: (payload: {
    workflowId?: number;
    productId: number;
    description: string;
    meta: FormWorkflow;
    type?: WorkflowType;
    nodePositions?: NodePositionsMap;
    nodeGroups?: NodeGroupsMap | null;
    nodeAliases?: NodeAliasesMap | null;
  }) => void;
  isSaving: boolean;
  type?: WorkflowType; // Workspace API 타입 지정
  products: Product[];
}

export default function WorkflowBuilderPage({
  workflowId,
  initialWorkflow,
  initialNodePositions,
  initialNodeGroups,
  initialNodeAliases,
  onSave,
  isSaving,
  type: initialApiType,
  products,
}: WorkflowBuilderPageProps) {
  // 초기 노드/엣지 변환 (저장된 위치 정보가 있으면 적용)
  const initialData = React.useMemo(() => {
    if (initialWorkflow?.meta) {
      return convertWorkflowToNodesAndEdges(
        initialWorkflow.meta as Workflow,
        initialNodePositions,
        initialNodeGroups,
        initialNodeAliases,
      );
    }
    return { nodes: [], edges: [] };
  }, [
    initialWorkflow,
    initialNodePositions,
    initialNodeGroups,
    initialNodeAliases,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>(
    initialData.edges,
  );
  const [selectedEdge, setSelectedEdge] = React.useState<WorkflowEdge | null>(
    null,
  );
  const [edgeDialogOpen, setEdgeDialogOpen] = React.useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [parametersDialogOpen, setParametersDialogOpen] = React.useState(false);
  const [description, setDescription] = React.useState(
    initialWorkflow?.description || "",
  );
  const [type, setApiType] = React.useState<WorkflowType>(
    initialApiType || "WORKFLOW",
  );
  const [productId, setProductId] = React.useState<number>(
    initialWorkflow?.productId || 1, // 기본값 1 (나중에 UI에서 선택 가능하도록)
  );

  // Variables 관리
  const [variables, setVariables] = React.useState<Record<string, any>>(
    initialWorkflow?.meta?.vars || {},
  );
  const [variablesDialogOpen, setVariablesDialogOpen] = React.useState(false);

  // Group 관리
  const [nodeGroups, setNodeGroups] = React.useState<NodeGroupsMap>(
    initialNodeGroups || {},
  );
  const [selectedNodesForGroup, setSelectedNodesForGroup] = React.useState<
    Node[]
  >([]);
  const [groupDialogOpen, setGroupDialogOpen] = React.useState(false);
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(
    null,
  );

  // Workspace Key 관리 (MEMBERS, ADD_MEMBERS, DELETE_MEMBERS, BILLING, BILLING_HISTORIES, WORKSPACE_DETAIL 타입에서 사용)
  const [workspaceKey, setWorkspaceKey] = React.useState<string>("");
  // Slug 관리 (WORKSPACE_DETAIL, MEMBERS, ADD_MEMBERS, DELETE_MEMBERS, BILLING, BILLING_HISTORIES 타입에서 사용)
  const [slug, setSlug] = React.useState<string>("");
  // Emails 관리 (ADD_MEMBERS, DELETE_MEMBERS 타입에서 사용)
  const [emails, setEmails] = React.useState<string>("");
  // Role 관리 (ADD_MEMBERS 타입에서 사용)
  const [role, setRole] = React.useState<string>("");

  const onConnect = React.useCallback(
    (connection: Connection) => {
      const newEdge: WorkflowEdge = {
        ...connection,
        id: `${connection.source}-${connection.target}-${Date.now()}`,
        type: "conditional",
        data: {
          isDefault: true,
          conditionLabel: "default",
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

  // 노드 선택 변경 핸들러 (Shift+드래그로 다중 선택)
  const onSelectionChange = React.useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      // 그룹 노드는 제외하고 일반 노드만 선택 (위치 정보 포함)
      const nonGroupNodes = selectedNodes.filter((n) => n.type !== "group");
      setSelectedNodesForGroup(nonGroupNodes as Node[]);
    },
    [],
  );

  // 그룹 생성 핸들러 (노드가 없어도 생성 가능)
  const handleCreateGroup = React.useCallback(
    (label: string, color: string) => {
      const padding = 40;
      const groupId = `group_${Date.now()}`;

      let groupX: number,
        groupY: number,
        groupWidth: number,
        groupHeight: number;
      let nodeIds: string[] = [];

      if (selectedNodesForGroup.length > 0) {
        // 선택된 노드들의 바운딩 박스 계산
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        selectedNodesForGroup.forEach((node) => {
          const nodeWidth = node.measured?.width ?? 200;
          const nodeHeight = node.measured?.height ?? 80;
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + nodeWidth);
          maxY = Math.max(maxY, node.position.y + nodeHeight);
        });

        groupWidth = maxX - minX + padding * 2;
        groupHeight = maxY - minY + padding * 2;
        groupX = minX - padding;
        groupY = minY - padding;
        nodeIds = selectedNodesForGroup.map((n) => n.id);
      } else {
        // 노드가 없으면 뷰포트 중앙에 기본 크기로 생성
        const inst: any = rfRef.current as any;
        const vp = inst?.getViewport?.();
        groupX = vp ? -vp.x / vp.zoom + 100 : 100;
        groupY = vp ? -vp.y / vp.zoom + 100 : 100;
        groupWidth = 300;
        groupHeight = 200;
      }

      // 그룹 노드 생성 (nodeIds도 data에 포함 - 정렬 시 사용)
      const groupNode: Node = {
        id: groupId,
        type: "group",
        position: { x: groupX, y: groupY },
        style: { width: groupWidth, height: groupHeight },
        data: { label, color, nodeIds },
      };

      // 그룹 정보 저장
      const newGroup = {
        label,
        color,
        position: { x: groupX, y: groupY },
        width: groupWidth,
        height: groupHeight,
        nodeIds,
      };

      setNodeGroups((prev) => ({ ...prev, [groupId]: newGroup }));

      // 그룹 노드를 맨 앞에 추가 (z-index가 가장 낮게)
      setNodes((nds) => [groupNode, ...nds]);

      // 선택 해제
      setSelectedNodesForGroup([]);
    },
    [selectedNodesForGroup, setNodes],
  );

  // 그룹 수정 핸들러
  const handleEditGroup = React.useCallback(
    (label: string, color: string) => {
      if (!editingGroupId) return;

      setNodeGroups((prev) => ({
        ...prev,
        [editingGroupId]: { ...prev[editingGroupId], label, color },
      }));

      setNodes((nds) =>
        nds.map((n) =>
          n.id === editingGroupId
            ? { ...n, data: { ...n.data, label, color } }
            : n,
        ),
      );

      setEditingGroupId(null);
    },
    [editingGroupId, setNodes],
  );

  // 그룹 삭제 핸들러
  const handleDeleteGroup = React.useCallback(
    (groupId: string) => {
      setNodeGroups((prev) => {
        const { [groupId]: _, ...rest } = prev;
        return rest;
      });
      setNodes((nds) => nds.filter((n) => n.id !== groupId));
    },
    [setNodes],
  );

  // 그룹 노드 더블클릭 핸들러
  const onNodeDoubleClick = React.useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === "group") {
        setEditingGroupId(node.id);
        setGroupDialogOpen(true);
      }
    },
    [],
  );

  const [targetUrl, setTargetUrl] = React.useState<string>(
    initialWorkflow?.meta?.targetUrl ||
      (typeof window !== "undefined" ? window.location.href : ""),
  );
  const [isRunning, setIsRunning] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [executionResults, setExecutionResults] = React.useState<any>(null);
  const rfRef = React.useRef<unknown>(null);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  // Clipboard for copy/paste functionality
  const clipboardRef = React.useRef<{
    nodes: Node[];
    edges: WorkflowEdge[];
  } | null>(null);
  const pasteCountRef = React.useRef<number>(0);

  // Publish/Unpublish state
  const fetcher = useFetcher();
  const [isPublishing, setIsPublishing] = React.useState(false);

  const buildWorkflow = React.useCallback((): FormWorkflow => {
    const workflow = buildWorkflowJson(nodes, edges, targetUrl);

    const formWorkflow: FormWorkflow = {
      version: workflow.version,
      start: workflow.start,
      steps: workflow.steps,
      targetUrl: workflow.targetUrl,
      vars: variables,
    };

    return formWorkflow;
  }, [nodes, edges, targetUrl, variables]);

  const run = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const workflow = buildWorkflow();

      // targetUrl에서 variables 치환
      let evaluatedUrl =
        targetUrl ||
        (typeof window !== "undefined" ? window.location.href : "");
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\$\\{vars\\.${key}\\}`, "g");
          const replacement =
            typeof value === "string" ? value : JSON.stringify(value);
          evaluatedUrl = evaluatedUrl.replace(regex, replacement);
        });
      }

      // type에 따라 runWorkflow 파라미터 구성
      const runParams: any = {
        evaluatedUrl,
        workflow,
        closeTabAfterCollection: true,
        activateTab: true,
        variables,
        type,
      };

      // MEMBERS, PLAN, BILLING 타입일 때 workspaceKey 추가
      if (
        type === "MEMBERS" ||
        type === "BILLING" ||
        type === "BILLING_HISTORIES" ||
        type === "WORKSPACE_DETAIL"
      ) {
        runParams.workspaceKey = workspaceKey;
        runParams.slug = slug;
      }

      // ADD_MEMBERS 타입일 때 workspaceKey, slug, emails, role 추가
      if (type === "ADD_MEMBERS") {
        runParams.workspaceKey = workspaceKey;
        runParams.slug = slug;
        runParams.role = role;
        // 쉼표로 구분된 이메일을 배열로 변환
        runParams.emails = emails
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e.length > 0);
      }

      // DELETE_MEMBERS 타입일 때 workspaceKey, slug, emails 추가
      if (type === "DELETE_MEMBERS") {
        runParams.workspaceKey = workspaceKey;
        runParams.slug = slug;
        // 쉼표로 구분된 이메일을 배열로 변환
        runParams.emails = emails
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e.length > 0);
      }

      const res = await runWorkflow(runParams);
      setResult(res);
      setExecutionResults(res);

      // nodes의 data에 executionResults 추가
      setNodes((nds) => {
        const updatedNodes = nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            executionResults: res,
          },
        }));
        console.log("🔄 Updated nodes with executionResults:", updatedNodes);
        return updatedNodes;
      });
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setIsRunning(false);
    }
  };

  // Publish/Unpublish handlers
  const handlePublish = () => {
    if (!workflowId) return;
    setIsPublishing(true);
    const formData = new FormData();
    formData.append("_action", "publish");
    formData.append("workflowId", workflowId.toString());
    fetcher.submit(formData, { method: "POST" });
  };

  const handleUnpublish = () => {
    if (!workflowId) return;
    setIsPublishing(true);
    const formData = new FormData();
    formData.append("_action", "unpublish");
    formData.append("workflowId", workflowId.toString());
    fetcher.submit(formData, { method: "POST" });
  };

  // Monitor fetcher state for publish/unpublish
  React.useEffect(() => {
    if (fetcher.state === "idle" && isPublishing) {
      setIsPublishing(false);
      if (fetcher.data?.action === "publish") {
        toast.success("워크플로우가 배포되었습니다.");
        // Reload page to update publishedAt
        window.location.reload();
      } else if (fetcher.data?.action === "unpublish") {
        toast.success("배포가 취소되었습니다.");
        // Reload page to update publishedAt
        window.location.reload();
      }
    }
  }, [fetcher.state, fetcher.data, isPublishing]);

  const addNode = React.useCallback(
    (type: string, data: any) => {
      const inst: any = rfRef.current as any;
      const vp = inst?.getViewport?.();
      const position = vp
        ? { x: -vp.x / vp.zoom + 120, y: -vp.y / vp.zoom + 80 }
        : { x: 120, y: 80 };
      const id = `node_${Date.now()}`;
      const newNode = { id, type, position, data };
      setNodes((nds) => nds.concat(newNode));
      setPaletteOpen(false);
    },
    [setNodes],
  );

  const onEdgeDoubleClick = React.useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge as WorkflowEdge);
      setEdgeDialogOpen(true);
    },
    [],
  );

  const handleEdgeSave = React.useCallback(
    (data: SwitchEdgeData) => {
      if (selectedEdge) {
        setEdges((eds) =>
          eds.map((e) => (e.id === selectedEdge.id ? { ...e, data } : e)),
        );
      }
    },
    [selectedEdge, setEdges],
  );

  const edgeTypes = React.useMemo(
    () => ({
      conditional: ConditionalEdge,
    }),
    [],
  );

  const setSubtreePreview = React.useCallback(
    ({ startId, roles }: SubtreePreviewPayload) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          const role = roles[node.id];
          const data = node.data as any;
          if (role) {
            return {
              ...node,
              data: {
                ...data,
                __subtreePreviewRole: role,
                __subtreePreviewOwner: startId,
              },
            };
          }
          if (data?.__subtreePreviewOwner === startId) {
            const { __subtreePreviewRole, __subtreePreviewOwner, ...restData } =
              data || {};
            return {
              ...node,
              data: restData,
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const handleClearSubtreePreview = React.useCallback(
    (startId: string) => {
      if (!startId) return;
      setNodes((nodes) =>
        nodes.map((node) => {
          const data = node.data as any;
          if (data?.__subtreePreviewOwner === startId) {
            const { __subtreePreviewRole, __subtreePreviewOwner, ...restData } =
              data || {};
            return {
              ...node,
              data: restData,
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const subtreePreviewHandlers = React.useMemo(
    () => ({
      setPreview: setSubtreePreview,
      clearPreview: handleClearSubtreePreview,
    }),
    [setSubtreePreview, handleClearSubtreePreview],
  );

  const onAutoLayout = React.useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      "TB",
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // 레이아웃 후 자동 fit
    setTimeout(() => {
      (rfRef.current as any)?.fitView({ padding: 0.2 });
    }, 0);
  }, [nodes, edges, setNodes, setEdges]);

  const handleSave = React.useCallback(
    (desc: string) => {
      const workflow = buildWorkflow();
      const workflowWithUrl = {
        ...workflow,
        targetUrl: targetUrl || undefined,
      } as FormWorkflow;

      // 현재 노드들의 위치 정보 추출 (그룹 노드 제외)
      const nodePositions: NodePositionsMap = {};
      nodes.forEach((node) => {
        if (node.type !== "group") {
          nodePositions[node.id] = {
            x: node.position.x,
            y: node.position.y,
          };
        }
      });

      // 그룹 노드 위치 및 크기 업데이트
      // NodeResizer는 node.measured 또는 node.width/height에 크기를 저장함
      const updatedGroups: NodeGroupsMap = {};
      nodes.forEach((node) => {
        if (node.type === "group") {
          // 크기 우선순위: measured > width/height > style > 기존값 > 기본값
          const width =
            node.measured?.width ??
            node.width ??
            (node.style?.width as number) ??
            nodeGroups[node.id]?.width ??
            300;
          const height =
            node.measured?.height ??
            node.height ??
            (node.style?.height as number) ??
            nodeGroups[node.id]?.height ??
            200;

          updatedGroups[node.id] = {
            label:
              (node.data as any)?.label || nodeGroups[node.id]?.label || "",
            color:
              (node.data as any)?.color ||
              nodeGroups[node.id]?.color ||
              "#ef4444",
            position: { x: node.position.x, y: node.position.y },
            width,
            height,
            nodeIds: nodeGroups[node.id]?.nodeIds || [],
          };
        }
      });

      // 노드들의 alias 추출
      const nodeAliases: NodeAliasesMap = {};
      nodes.forEach((node) => {
        if (node.type !== "group") {
          const alias = (node.data as any)?.alias;
          if (alias) {
            nodeAliases[node.id] = alias;
          }
        }
      });

      onSave({
        workflowId,
        productId,
        description: desc,
        meta: workflowWithUrl,
        type,
        nodePositions,
        nodeGroups:
          Object.keys(updatedGroups).length > 0 ? updatedGroups : null,
        nodeAliases: Object.keys(nodeAliases).length > 0 ? nodeAliases : null,
      });
      setDescription(desc);
    },
    [
      workflowId,
      productId,
      buildWorkflow,
      onSave,
      targetUrl,
      type,
      nodes,
      nodeGroups,
    ],
  );

  const handleExport = React.useCallback(() => {
    const workflow = buildWorkflow();
    // 파일명 생성: 한글/영문 유지, 특수문자만 언더스코어로 치환
    const filename = description
      ? description
          .replace(/[<>:"/\\|?*]/g, "_") // 파일명에 사용 불가능한 문자만 치환
          .replace(/\s+/g, "_") // 공백을 언더스코어로
          .replace(/_{2,}/g, "_") // 연속된 언더스코어는 하나로
          .trim()
      : `workflow_${Date.now()}`;
    exportWorkflowWithMetadata(workflow, description, filename);
  }, [buildWorkflow, description]);

  const handleImport = React.useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const result = await importWorkflowWithMetadata(file);
      if (result.success && result.data) {
        // 워크플로우를 nodes/edges로 변환
        const { nodes: importedNodes, edges: importedEdges } =
          convertWorkflowToNodesAndEdges(result.data as Workflow);

        // 상태 업데이트
        setNodes(importedNodes);
        setEdges(importedEdges);
        setTargetUrl(result.data.targetUrl || "");
        setVariables(result.data.vars || {});

        // 메타데이터가 있으면 description도 업데이트
        if (result.metadata?.description) {
          setDescription(result.metadata.description);
        }

        // 자동 레이아웃 적용
        setTimeout(() => {
          const { nodes: layoutedNodes, edges: layoutedEdges } =
            getLayoutedElements(importedNodes, importedEdges, "TB");
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          setTimeout(() => {
            (rfRef.current as any)?.fitView({ padding: 0.2 });
          }, 0);
        }, 0);

        alert("워크플로우를 성공적으로 불러왔습니다.");
      } else {
        alert(`워크플로우 불러오기 실패: ${result.error}`);
      }
    };
    input.click();
  }, [setNodes, setEdges, setTargetUrl, setVariables]);

  // Copy selected nodes to system clipboard (supports cross-tab paste)
  const handleCopy = React.useCallback(async () => {
    const selectedNodes = nodes.filter(
      (node) => node.selected && node.type !== "group",
    );

    if (selectedNodes.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    // Copy only internal edges (edges between selected nodes)
    const internalEdges = edges.filter(
      (edge) =>
        selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target),
    );

    const clipboardData = {
      type: "8g-workflow-nodes",
      nodes: selectedNodes,
      edges: internalEdges,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(clipboardData));
      // Also store in ref for same-tab paste offset tracking
      clipboardRef.current = {
        nodes: JSON.parse(JSON.stringify(selectedNodes)),
        edges: JSON.parse(JSON.stringify(internalEdges)),
      };
      pasteCountRef.current = 0;
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, [nodes, edges]);

  // Paste nodes from system clipboard (supports cross-tab paste)
  const handlePaste = React.useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clipboardData = JSON.parse(text);

      // Validate clipboard data
      if (
        clipboardData.type !== "8g-workflow-nodes" ||
        !Array.isArray(clipboardData.nodes) ||
        clipboardData.nodes.length === 0
      ) {
        return;
      }

      const { nodes: copiedNodes, edges: copiedEdges } = clipboardData;

      pasteCountRef.current += 1;
      const offset = pasteCountRef.current * 50;

      // Create ID mapping: old ID -> new ID
      const idMapping = new Map<string, string>();
      const timestamp = Date.now();

      copiedNodes.forEach((node: Node, index: number) => {
        idMapping.set(node.id, `node_${timestamp}_${index}`);
      });

      // Create new nodes with updated IDs and positions
      const newNodes = copiedNodes.map((node: Node) => ({
        ...node,
        id: idMapping.get(node.id)!,
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
        selected: true,
        data: {
          ...node.data,
          executionResults: undefined,
        },
      }));

      // Create new edges with remapped IDs
      const newEdges = (copiedEdges || []).map((edge: WorkflowEdge) => ({
        ...edge,
        id: `${idMapping.get(edge.source)}-${idMapping.get(edge.target)}-${Date.now()}`,
        source: idMapping.get(edge.source)!,
        target: idMapping.get(edge.target)!,
      }));

      // Deselect existing nodes, then add new nodes
      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        ...newNodes,
      ]);

      setEdges((eds) => [...eds, ...newEdges]);
    } catch (err) {
      // Clipboard read failed or invalid data - silently ignore
      console.error("Failed to paste from clipboard:", err);
    }
  }, [setNodes, setEdges]);

  // 키보드 단축키: Ctrl+S, Ctrl+C, Ctrl+V
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is in an input element
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key === "s") {
        e.preventDefault();
        setSaveDialogOpen(true);
        return;
      }

      if (isCtrlOrCmd && e.key === "c") {
        e.preventDefault();
        handleCopy();
        return;
      }

      if (isCtrlOrCmd && e.key === "v") {
        e.preventDefault();
        handlePaste();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCopy, handlePaste]);
  //1500
  return (
    <SubtreePreviewProvider>
      <div
        style={{
          height: "100vh",
          width: "100%",
          display: "grid",
          gridTemplateRows: "auto 1fr",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderBottom: "1px solid #eee",
          }}
        >
          <WorkflowBuilderHeader
            targetUrl={targetUrl}
            setTargetUrl={setTargetUrl}
            runWorkflow={run}
            isRunning={isRunning}
            onSaveClick={() => setSaveDialogOpen(true)}
            onParametersClick={() => setParametersDialogOpen(true)}
            onExportClick={handleExport}
            onImportClick={handleImport}
            type={type}
            onApiTypeChange={setApiType}
            productId={productId}
            onProductIdChange={setProductId}
            products={products}
            workflowId={workflowId}
            publishedAt={initialWorkflow?.publishedAt}
            onPublishClick={handlePublish}
            onUnpublishClick={handleUnpublish}
            isPublishing={isPublishing}
          />

          <PaletteSheet
            paletteOpen={paletteOpen}
            setPaletteOpen={setPaletteOpen}
            addNode={addNode}
            blocks={Object.entries(AllBlockSchemas).map(
              ([blockName, schema]) => {
                const info = blockLabels[blockName] || {
                  title: blockName,
                  description: "",
                };

                // 각 블록의 기본 데이터 생성
                const defaultBlock: any = {
                  name: blockName,
                  selector: "#selector",
                  findBy: "cssSelector" as const,
                  option: {},
                };

                // 블록별 특수 필드 추가
                if (blockName === "data-extract") {
                  defaultBlock.code = "";
                  delete defaultBlock.selector;
                  delete defaultBlock.findBy;
                  delete defaultBlock.option;
                } else if (blockName === "attribute-value") {
                  defaultBlock.attributeName = "href";
                } else if (blockName === "set-value-form") {
                  defaultBlock.setValue = "";
                  defaultBlock.type = "text-field";
                } else if (
                  blockName === "get-value-form" ||
                  blockName === "clear-value-form"
                ) {
                  defaultBlock.type = "text-field";
                }

                return {
                  title: info.title,
                  description: info.description,
                  type: blockName,
                  data: {
                    title: info.title,
                    block: defaultBlock as Block,
                    schema,
                  },
                };
              },
            )}
          />
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            gap: "8px",
            height: "100%",
          }}
        >
          {/* 왼쪽: ReactFlow */}
          <div style={{ flex: 1, position: "relative" }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeDoubleClick={onEdgeDoubleClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onSelectionChange={onSelectionChange}
              nodeTypes={workflowNodeTypes}
              edgeTypes={edgeTypes}
              onInit={(inst) => {
                rfRef.current = inst;
              }}
              fitView
              selectionOnDrag
              selectionKeyCode="Shift"
              multiSelectionKeyCode="Shift"
            >
              <Background />
              <Controls />

              {/* 플로팅 버튼들 */}
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  right: 20,
                  zIndex: 5,
                  display: "flex",
                  gap: 8,
                }}
              >
                {/* 그룹 만들기 버튼 (항상 표시) */}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingGroupId(null);
                    setGroupDialogOpen(true);
                  }}
                  style={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  그룹 만들기
                  {selectedNodesForGroup.length > 0
                    ? ` (${selectedNodesForGroup.length}개 선택)`
                    : ""}
                </Button>
                <Button
                  variant="default"
                  onClick={onAutoLayout}
                  style={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  정렬
                </Button>
              </div>

              <EdgeConfigDialog
                open={edgeDialogOpen}
                onOpenChange={setEdgeDialogOpen}
                edgeData={selectedEdge?.data}
                onSave={handleEdgeSave}
                targetNodeId={selectedEdge?.target || ""}
              />

              <SaveDialog
                open={saveDialogOpen}
                onOpenChange={setSaveDialogOpen}
                onSave={handleSave}
                initialDescription={description}
              />

              <VariablesDialog
                open={variablesDialogOpen}
                onOpenChange={setVariablesDialogOpen}
                variables={variables}
                onVariablesChange={setVariables}
              />

              <WorkflowParametersDialog
                open={parametersDialogOpen}
                onOpenChange={setParametersDialogOpen}
                type={type}
                workspaceKey={workspaceKey}
                setWorkspaceKey={setWorkspaceKey}
                slug={slug}
                setSlug={setSlug}
                emails={emails}
                setEmails={setEmails}
                role={role}
                setRole={setRole}
              />

              <GroupDialog
                open={groupDialogOpen}
                onOpenChange={setGroupDialogOpen}
                onSave={editingGroupId ? handleEditGroup : handleCreateGroup}
                initialLabel={
                  editingGroupId ? nodeGroups[editingGroupId]?.label : ""
                }
                initialColor={
                  editingGroupId
                    ? nodeGroups[editingGroupId]?.color
                    : GROUP_COLORS[0].value
                }
                mode={editingGroupId ? "edit" : "create"}
              />
            </ReactFlow>
            {result && <ResultPanel result={result} position="top-right" />}
          </div>

          {/* 오른쪽: Variables Preview */}
          <div style={{ width: "300px", overflow: "auto" }}>
            <VariablesPreviewPanel
              type={type}
              workspaceKey={workspaceKey}
              slug={slug}
              emails={emails}
              role={role}
              variables={variables}
              onAddVariables={() => setVariablesDialogOpen(true)}
              onAddParameters={() => setParametersDialogOpen(true)}
            />
          </div>
        </div>
      </div>
    </SubtreePreviewProvider>
  );
}
