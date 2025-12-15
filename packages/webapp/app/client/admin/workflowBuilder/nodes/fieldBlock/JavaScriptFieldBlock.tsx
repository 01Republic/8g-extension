import type { ParsedField } from "~/lib/schema-parser";
import { FieldBlockContentBox } from "./FieldBlockContentBox";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { autocompletion } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";

interface JavaScriptFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

/**
 * 내장 헬퍼 함수 문서
 */
const HELPER_FUNCTIONS_DOC = `/**
 * 내장 헬퍼 함수
 *
 * wait(ms: number): Promise<void>
 *   - 지정된 밀리초 동안 대기합니다.
 *   - 예: await wait(1000);  // 1초 대기
 *
 * waitForElement(selector: string, options?: object): Promise<Element>
 *   - CSS 선택자에 해당하는 요소가 나타날 때까지 대기합니다.
 *   - options:
 *     - timeout: 최대 대기 시간 ms (기본값: 10000)
 *     - interval: 체크 간격 ms (기본값: 100)
 *     - visible: 요소가 실제로 보일 때까지 대기 (기본값: false)
 *   - 예: const el = await waitForElement('.modal', { visible: true });
 */

`;

export const JavaScriptFieldBlock = (props: JavaScriptFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name, defaultValue } = field;

  // 에디터에 표시할 값 (헬퍼 함수 문서 + 사용자 코드)
  const editorValue = formData[name] ?? "";
  const displayValue = editorValue
    ? editorValue
    : HELPER_FUNCTIONS_DOC;

  const handleChange = (value: string) => {
    // 헬퍼 함수 문서 부분을 제거하고 저장
    const cleanValue = value.startsWith(HELPER_FUNCTIONS_DOC)
      ? value.slice(HELPER_FUNCTIONS_DOC.length)
      : value;
    updateFormField(name, cleanValue || undefined);
  };

  return (
    <FieldBlockContentBox key={name} label="JavaScript 코드" location="top">
      <div className="flex-1 space-y-2 min-w-0 max-w-full">
        {/* 헬퍼 함수 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
          <p className="font-medium text-blue-800 mb-2">내장 헬퍼 함수</p>
          <ul className="text-blue-700 space-y-1 text-xs">
            <li>
              <code className="bg-blue-100 px-1 rounded">await wait(ms)</code> - 지정된 밀리초 동안 대기
            </li>
            <li>
              <code className="bg-blue-100 px-1 rounded">await waitForElement(selector, options?)</code> - 요소가 나타날 때까지 대기
              <ul className="ml-4 mt-1 text-blue-600">
                <li>• <code>timeout</code>: 최대 대기 시간 ms (기본: 10000)</li>
                <li>• <code>interval</code>: 체크 간격 ms (기본: 100)</li>
                <li>• <code>visible</code>: 실제로 보일 때까지 대기 (기본: false)</li>
              </ul>
            </li>
          </ul>
        </div>

        <div className="border-2 border-gray-300 rounded-md overflow-auto max-w-full">
          <CodeMirror
            value={editorValue}
            onChange={handleChange}
            placeholder={
              defaultValue ||
              `// JavaScript 코드를 입력하세요
// 예시:
await wait(1000);
const button = await waitForElement('.submit-btn', { visible: true });
button.click();
return document.title;`
            }
            extensions={[
              javascript(),
              EditorView.lineWrapping,
              autocompletion({
                override: [
                  // 브라우저 API 자동완성
                  (context) => {
                    const word = context.matchBefore(/\w*/);
                    if (!word || (word.from === word.to && !context.explicit))
                      return null;

                    return {
                      from: word.from,
                      options: [
                        // 🔥 내장 헬퍼 함수 (최상단에 배치)
                        {
                          label: "wait",
                          type: "function",
                          info: "지정된 밀리초 동안 대기",
                          apply: "await wait(1000)",
                          boost: 99,
                        },
                        {
                          label: "waitForElement",
                          type: "function",
                          info: "요소가 나타날 때까지 대기",
                          apply: "await waitForElement('')",
                          boost: 99,
                        },
                        {
                          label: "waitForElement with options",
                          type: "function",
                          info: "옵션과 함께 요소 대기",
                          apply:
                            "await waitForElement('', { timeout: 10000, visible: true })",
                          boost: 98,
                        },

                        // document API
                        { label: "document", type: "variable" },
                        { label: "document.querySelector", type: "function" },
                        {
                          label: "document.querySelectorAll",
                          type: "function",
                        },
                        { label: "document.getElementById", type: "function" },
                        {
                          label: "document.getElementsByClassName",
                          type: "function",
                        },
                        {
                          label: "document.getElementsByTagName",
                          type: "function",
                        },
                        { label: "document.title", type: "property" },
                        { label: "document.body", type: "property" },
                        { label: "document.createElement", type: "function" },

                        // window API
                        { label: "window", type: "variable" },
                        { label: "location", type: "variable" },
                        { label: "location.href", type: "property" },
                        { label: "location.pathname", type: "property" },
                        { label: "location.search", type: "property" },

                        // 일반 JavaScript
                        { label: "console.log", type: "function" },
                        { label: "Array.from", type: "function" },
                        { label: "Array.isArray", type: "function" },
                        { label: "Object.keys", type: "function" },
                        { label: "Object.values", type: "function" },
                        { label: "Object.entries", type: "function" },
                        { label: "JSON.parse", type: "function" },
                        { label: "JSON.stringify", type: "function" },

                        // Promise
                        { label: "Promise", type: "class" },
                        { label: "async", type: "keyword" },
                        { label: "await", type: "keyword" },

                        // 자주 쓰는 패턴
                        {
                          label: "querySelector",
                          type: "function",
                          apply: "document.querySelector('')",
                        },
                        {
                          label: "querySelectorAll",
                          type: "function",
                          apply: "document.querySelectorAll('')",
                        },
                      ],
                    };
                  },
                ],
              }),
            ]}
            height="250px"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              searchKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
          />
        </div>
      </div>
    </FieldBlockContentBox>
  );
};
