import type { ParsedField } from "~/lib/schema-parser";
import { FieldBlockContentBox } from "./FieldBlockContentBox";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { autocompletion } from "@codemirror/autocomplete";

interface JavaScriptFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

export const JavaScriptFieldBlock = (props: JavaScriptFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name, defaultValue } = field;

  return (
    <FieldBlockContentBox key={name} label="JavaScript 코드" location="top">
      <div className="flex-1 space-y-2">
        <CodeMirror
          value={formData[name] ?? ""}
          onChange={(value) => updateFormField(name, value || undefined)}
          placeholder={
            defaultValue || "// JavaScript 코드를 입력하세요\ndocument.title"
          }
          extensions={[
            javascript(),
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
                      // document API
                      { label: "document", type: "variable" },
                      { label: "document.querySelector", type: "function" },
                      { label: "document.querySelectorAll", type: "function" },
                      { label: "document.getElementById", type: "function" },
                      { label: "document.getElementsByClassName", type: "function" },
                      { label: "document.getElementsByTagName", type: "function" },
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
                      { label: "querySelector", type: "function", apply: "document.querySelector('')" },
                      { label: "querySelectorAll", type: "function", apply: "document.querySelectorAll('')" },
                    ],
                  };
                },
              ],
            }),
          ]}
          height="200px"
          className="border-2 border-gray-300 rounded-md overflow-hidden"
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
    </FieldBlockContentBox>
  );
};
