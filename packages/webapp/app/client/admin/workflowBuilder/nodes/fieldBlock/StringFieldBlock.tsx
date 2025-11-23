import type { ParsedField } from "~/lib/schema-parser";
import { Input } from "~/components/ui/input";
import { FieldBlockContentBox } from "./FieldBlockContentBox";
import { useState, useRef, useEffect } from "react";
import { usePreviousNodes } from "../../../../../hooks/use-previous-nodes";

interface StringFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
  currentNodeId?: string;
}

export const StringFieldBlock = (props: StringFieldBlockProps) => {
  const { field, formData, updateFormField, currentNodeId } = props;
  const { name, defaultValue } = field;

  const {
    previousNodes,
    getNodeDisplayName,
    createNodeReference,
    repeatContextVariables,
    createRepeatReference,
  } = usePreviousNodes(currentNodeId || "");

  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const currentValue = formData[name] ?? "";

  // Input 값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    updateFormField(name, newValue || undefined);
    setCursorPosition(cursorPos);

    // $. 감지 (현재 커서 위치 기준)
    if (
      newValue.slice(0, cursorPos).endsWith("$.") &&
      (previousNodes.length > 0 || repeatContextVariables.length > 0)
    ) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // 노드 선택 처리
  const handleNodeSelect = (nodeId: string) => {
    const nodeRef = createNodeReference(nodeId);
    const beforeCursor = currentValue.slice(0, cursorPosition - 2); // $. 제거
    const afterCursor = currentValue.slice(cursorPosition);
    const newValue = beforeCursor + nodeRef + afterCursor;

    updateFormField(name, newValue);
    setShowDropdown(false);

    // 커서 위치를 삽입된 참조 뒤로 이동
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = beforeCursor.length + nodeRef.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  // Repeat 컨텍스트 변수 선택 처리
  const handleRepeatContextSelect = (contextPath: string) => {
    const contextRef = createRepeatReference(contextPath);
    const beforeCursor = currentValue.slice(0, cursorPosition - 2); // $. 제거
    const afterCursor = currentValue.slice(cursorPosition);
    const newValue = beforeCursor + contextRef + afterCursor;

    updateFormField(name, newValue);
    setShowDropdown(false);

    // 커서 위치를 삽입된 참조 뒤로 이동
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = beforeCursor.length + contextRef.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <FieldBlockContentBox key={name} label={name}>
      <div className="relative w-full">
        <Input
          ref={inputRef}
          id={name}
          value={currentValue}
          onChange={handleInputChange}
          placeholder={defaultValue || "$.로 노드 참조"}
        />
        {showDropdown &&
          (previousNodes.length > 0 || repeatContextVariables.length > 0) && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {repeatContextVariables.length > 0 && (
                <>
                  <div className="p-2 text-xs text-gray-500 border-b">
                    반복 컨텍스트 변수
                  </div>
                  {repeatContextVariables.map((ctx) => (
                    <div
                      key={ctx.id}
                      onClick={() => handleRepeatContextSelect(ctx.id)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {ctx.label}
                    </div>
                  ))}
                </>
              )}
              {previousNodes.length > 0 && (
                <>
                  <div className="p-2 text-xs text-gray-500 border-b">
                    이전 노드 선택
                  </div>
                  {previousNodes.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => handleNodeSelect(node.id)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {getNodeDisplayName(node)}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
      </div>
    </FieldBlockContentBox>
  );
};
