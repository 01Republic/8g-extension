import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormWorkflow } from "~/models/integration/types";

const TYPE_ASSERTION_REGEX = /\s+as\s+[^,);\]}]+/g;
const PARAM_TYPE_REGEX = /(\(|,)\s*([A-Za-z_$][\w$]*)\s*:\s*([^,)=><]+)/g;
const NON_NULL_ASSERTION_REGEX = /([)\w\]])!/g;
const ARROW_RETURN_TYPE_REGEX = /(\))\s*:\s*[^=]+=>/g;

const DEFAULT_PLACEHOLDER_ERROR_MESSAGE =
  "FormWorkflow 표현식을 평가하는 중 오류가 발생했습니다.";

interface UseWorkflowConfigParams {
  index: number;
  withMeta: (updater: (draft: any) => void) => void;
  initialWorkflow?: FormWorkflow;
}

interface UseWorkflowConfigResult {
  workflowText: string;
  workflowError: string | null;
  workflow?: FormWorkflow;
  handleWorkflowChange: (text: string) => void;
}

function serializeWorkflow(workflow: FormWorkflow | undefined): string {
  if (!workflow) return "";
  return formatValue(workflow, 0);
}

function formatValue(value: unknown, depth: number): string {
  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);

  if (value === null) {
    return "null";
  }

  const valueType = typeof value;

  if (valueType === "string") {
    const stringValue = value as string;
    const needsTemplate =
      stringValue.includes("`") ||
      stringValue.includes("${") ||
      stringValue.includes("\n");
    if (needsTemplate) {
      return `\`${stringValue.replace(/`/g, "\\`")}\``;
    }
    return `'${stringValue.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  }

  if (valueType === "number" || valueType === "boolean") {
    return String(value);
  }

  if (valueType === "function") {
    const fnString = (value as (...args: unknown[]) => unknown).toString();
    if (!fnString.includes("\n")) {
      return fnString;
    }
    const lines = fnString.split("\n");
    return lines
      .map((line, index) => (index === 0 ? line : `${indent}${line}`))
      .join("\n");
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }

    const items = value
      .map((item) => `${nextIndent}${formatValue(item, depth + 1)}`)
      .join(",\n");

    return `[\n${items}\n${indent}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => typeof v !== "undefined",
    );

    if (entries.length === 0) {
      return "{}";
    }

    const body = entries
      .map(
        ([key, val]) => `${nextIndent}${key}: ${formatValue(val, depth + 1)}`,
      )
      .join(",\n");

    return `{
${body}
${indent}}`;
  }

  return "undefined";
}

function sanitizeExpression(source: string): string {
  let result = source;
  result = result.replace(TYPE_ASSERTION_REGEX, "");
  result = result.replace(NON_NULL_ASSERTION_REGEX, "$1");
  result = result.replace(ARROW_RETURN_TYPE_REGEX, "$1 =>");
  result = result.replace(PARAM_TYPE_REGEX, "$1 $2");
  return result;
}

function evaluateWorkflowExpression(raw: string): unknown {
  const sanitized = sanitizeExpression(raw);
  const trimmed = sanitized.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const body =
    trimmed.startsWith("{") || trimmed.startsWith("[")
      ? `return (${trimmed});`
      : `return ${trimmed};`;

  const factory = new Function('"use strict"; ' + body);
  return factory();
}

function toFormWorkflow(
  value: unknown,
  previous?: FormWorkflow,
): FormWorkflow | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const hasVersion = typeof candidate.version === "string";
  const hasStart = typeof candidate.start === "string";
  const hasSteps = Array.isArray(candidate.steps);

  if (!hasVersion || !hasStart || !hasSteps) {
    return null;
  }

  const targetUrl =
    typeof candidate.targetUrl === "string"
      ? candidate.targetUrl
      : previous?.targetUrl;

  return {
    ...(previous ?? ({} as FormWorkflow)),
    ...(candidate as FormWorkflow),
    version: candidate.version as string,
    start: candidate.start as string,
    steps: candidate.steps as FormWorkflow["steps"],
    targetUrl,
  };
}

export function useWorkflowConfig({
  index,
  withMeta,
  initialWorkflow,
}: UseWorkflowConfigParams): UseWorkflowConfigResult {
  const [workflowText, setWorkflowText] = useState<string>(() =>
    serializeWorkflow(initialWorkflow),
  );
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<FormWorkflow | undefined>(
    initialWorkflow,
  );

  const initialSerialized = useMemo(
    () => serializeWorkflow(initialWorkflow),
    [initialWorkflow],
  );

  useEffect(() => {
    setWorkflowText((prev) => {
      if (prev === initialSerialized) {
        return prev;
      }
      return initialSerialized;
    });
    setWorkflow(initialWorkflow);
  }, [initialSerialized, initialWorkflow]);

  const handleWorkflowChange = useCallback(
    (text: string) => {
      setWorkflowText(text);

      const trimmed = text.trim();
      if (trimmed.length === 0) {
        withMeta((draft) => {
          (draft.sections[index].uiSchema as any).workflow = undefined;
        });
        setWorkflow(undefined);
        setWorkflowError(null);
        return;
      }

      const applyWorkflow = (value: unknown) => {
        const normalized = toFormWorkflow(value, workflow ?? initialWorkflow);
        if (!normalized) {
          throw new Error("FormWorkflow 스키마와 일치하지 않습니다.");
        }
        setWorkflow(normalized);
        withMeta((draft) => {
          (draft.sections[index].uiSchema as any).workflow = normalized;
        });
        setWorkflowError(null);
      };

      try {
        const evaluated = evaluateWorkflowExpression(trimmed);
        applyWorkflow(evaluated);
      } catch (expressionError) {
        try {
          const parsed = JSON.parse(trimmed);
          applyWorkflow(parsed);
        } catch (_jsonError) {
          const message =
            expressionError instanceof Error
              ? expressionError.message
              : DEFAULT_PLACEHOLDER_ERROR_MESSAGE;
          setWorkflowError(message);
          setWorkflow(undefined);
        }
      }
    },
    [index, withMeta, workflow, initialWorkflow],
  );

  return {
    workflowText,
    workflowError,
    workflow,
    handleWorkflowChange,
  };
}
