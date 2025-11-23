import { z } from "zod";
import type { FormWorkflow } from "~/models/workflow/types";

/**
 * Zod Schema for FormWorkflow validation
 */
const WhenConditionSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    expr: z.string().optional(),
    equals: z.object({ left: z.string(), right: z.any() }).optional(),
    exists: z.string().optional(),
    regex: z.object({ value: z.string(), pattern: z.string() }).optional(),
    contains: z.object({ value: z.string(), search: z.string() }).optional(),
    and: z.array(WhenConditionSchema).optional(),
    or: z.array(WhenConditionSchema).optional(),
  }),
);

const WorkflowStepSchema = z.object({
  id: z.string(),
  block: z.record(z.any()),
  repeat: z
    .object({
      forEach: z.string().optional(),
      count: z.number().optional(),
    })
    .optional(),
  switch: z
    .array(
      z.object({
        when: WhenConditionSchema,
        next: z.string(),
      }),
    )
    .optional(),
  next: z.string().optional(),
  delayAfterMs: z.number().optional(),
  retry: z
    .object({
      attempts: z.number(),
    })
    .optional(),
  timeoutMs: z.number().optional(),
});

const FormWorkflowSchema = z.object({
  version: z.string(),
  start: z.string(),
  steps: z.array(WorkflowStepSchema),
  targetUrl: z.string().optional(),
  vars: z.record(z.any()).optional(),
});

/**
 * Export workflow to JSON file
 * @param workflow - FormWorkflow object to export
 * @param filename - Name of the file (without .json extension)
 */
export function exportWorkflowToJson(
  workflow: FormWorkflow,
  filename: string = "workflow",
): void {
  try {
    // FormWorkflow를 JSON 문자열로 변환 (pretty print)
    const jsonString = JSON.stringify(workflow, null, 2);

    // Blob 생성
    const blob = new Blob([jsonString], { type: "application/json" });

    // 다운로드 링크 생성 및 클릭
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();

    // 정리
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export workflow:", error);
    throw new Error("워크플로우 내보내기에 실패했습니다.");
  }
}

/**
 * Validation result type
 */
export interface ValidationResult {
  success: boolean;
  data?: FormWorkflow;
  error?: string;
}

/**
 * Validate imported workflow JSON
 * @param jsonData - Parsed JSON object
 * @returns Validation result with workflow data or error message
 */
export function validateWorkflowJson(jsonData: unknown): ValidationResult {
  try {
    // Zod 스키마로 검증
    const validatedData = FormWorkflowSchema.parse(jsonData);

    // 추가 비즈니스 로직 검증
    if (!validatedData.steps || validatedData.steps.length === 0) {
      return {
        success: false,
        error: "워크플로우에 최소 하나의 스텝이 필요합니다.",
      };
    }

    // start 스텝이 실제로 존재하는지 확인
    const startStepExists = validatedData.steps.some(
      (step) => step.id === validatedData.start,
    );
    if (!startStepExists) {
      return {
        success: false,
        error: `시작 스텝 '${validatedData.start}'을 찾을 수 없습니다.`,
      };
    }

    // 모든 next 참조가 유효한지 확인
    const stepIds = new Set(validatedData.steps.map((step) => step.id));
    for (const step of validatedData.steps) {
      if (step.next && !stepIds.has(step.next)) {
        return {
          success: false,
          error: `스텝 '${step.id}'의 next 참조 '${step.next}'를 찾을 수 없습니다.`,
        };
      }

      // switch 조건의 next 참조도 확인
      if (step.switch) {
        for (const switchCase of step.switch) {
          if (!stepIds.has(switchCase.next)) {
            return {
              success: false,
              error: `스텝 '${step.id}'의 switch 참조 '${switchCase.next}'를 찾을 수 없습니다.`,
            };
          }
        }
      }
    }

    return {
      success: true,
      data: validatedData as FormWorkflow,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: `유효하지 않은 워크플로우 형식입니다: ${firstError.path.join(".")} - ${firstError.message}`,
      };
    }

    return {
      success: false,
      error: "워크플로우 검증 중 오류가 발생했습니다.",
    };
  }
}

/**
 * Import workflow from JSON file
 * @param file - File object from input element
 * @returns Promise with validation result
 */
export async function importWorkflowFromJson(
  file: File,
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);

        // 검증 수행
        const validationResult = validateWorkflowJson(jsonData);
        resolve(validationResult);
      } catch (error) {
        resolve({
          success: false,
          error: "JSON 파일을 파싱할 수 없습니다. 파일 형식을 확인해주세요.",
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: "파일을 읽는 중 오류가 발생했습니다.",
      });
    };

    reader.readAsText(file);
  });
}

/**
 * Export workflow with metadata (including description and productId)
 */
export interface WorkflowExportData {
  workflow: FormWorkflow;
  metadata: {
    description: string;
    exportedAt: string;
    version: string;
  };
}

export function exportWorkflowWithMetadata(
  workflow: FormWorkflow,
  description: string,
  filename: string = "workflow",
): void {
  const exportData: WorkflowExportData = {
    workflow,
    metadata: {
      description,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    },
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import workflow with metadata
 */
export async function importWorkflowWithMetadata(
  file: File,
): Promise<ValidationResult & { metadata?: WorkflowExportData["metadata"] }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);

        // 메타데이터가 포함된 형식인지 확인
        if (jsonData.workflow && jsonData.metadata) {
          // 메타데이터 포함 형식
          const validationResult = validateWorkflowJson(jsonData.workflow);
          if (validationResult.success) {
            resolve({
              ...validationResult,
              metadata: jsonData.metadata,
            });
          } else {
            resolve(validationResult);
          }
        } else {
          // 순수 workflow 형식
          const validationResult = validateWorkflowJson(jsonData);
          resolve(validationResult);
        }
      } catch (error) {
        resolve({
          success: false,
          error: "JSON 파일을 파싱할 수 없습���다. 파일 형식을 확인해주세요.",
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: "파일을 읽는 중 오류가 발생했습니다.",
      });
    };

    reader.readAsText(file);
  });
}
