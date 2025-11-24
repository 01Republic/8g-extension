import type { NodeTypes } from "@xyflow/react";
import GenericBlockNode from "./GenericBlockNode";
import { AllBlockSchemas } from "scordi-extension";
// 모든 블록 타입을 GenericBlockNode로 자동 등록
export const workflowNodeTypes: NodeTypes = Object.keys(AllBlockSchemas).reduce(
  (acc, blockName) => {
    acc[blockName] = GenericBlockNode;
    return acc;
  },
  {} as NodeTypes,
);

// Re-export block labels and field labels from shared package
export { blockLabels, fieldLabels } from "8g-shared";
