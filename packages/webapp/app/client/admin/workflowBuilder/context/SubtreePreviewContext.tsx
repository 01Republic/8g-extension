import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type SubtreeRole = "start" | "middle" | "end-neighbor";

export type SubtreePreviewPayload = {
  startId: string;
  subtreeEnd: string;
  roles: Record<string, SubtreeRole>;
};

type SubtreePreviewState = {
  previewId: string | null;
  roles: Record<string, SubtreeRole>;
};

type SubtreePreviewContextValue = {
  setPreview: (payload: SubtreePreviewPayload) => void;
  clearPreview: (startId: string) => void;
};

const defaultState: SubtreePreviewState = {
  previewId: null,
  roles: {},
};

const SubtreePreviewContext = createContext<SubtreePreviewContextValue>({
  setPreview: () => {},
  clearPreview: () => {},
});

export function SubtreePreviewProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preview, setPreviewState] = useState<SubtreePreviewState>(defaultState);

  const setPreview = useCallback((payload: SubtreePreviewPayload) => {
    setPreviewState({
      previewId: `${payload.startId}-${payload.subtreeEnd}`,
      roles: payload.roles,
    });
  }, []);

  const clearPreview = useCallback((startId: string) => {
    setPreviewState((prev) => {
      if (!prev.previewId) return prev;
      if (!prev.previewId.startsWith(`${startId}-`)) {
        return prev;
      }
      return defaultState;
    });
  }, []);

  return (
    <SubtreePreviewContext.Provider
      value={{ setPreview, clearPreview }}
    >
      {children}
    </SubtreePreviewContext.Provider>
  );
}

export function useSubtreePreview() {
  return useContext(SubtreePreviewContext);
}


