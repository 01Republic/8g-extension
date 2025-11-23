import { type ReactNode, useRef } from "react";
import { useDrop, useDrag } from "react-dnd";

function Reorderable({
  index,
  move,
  isActive,
  onClick,
  className,
  children,
  dndType = "SECTION",
}: {
  index: number;
  move: (dragIndex: number, hoverIndex: number) => void;
  isActive: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
  dndType?: string | symbol;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [, drop] = useDrop<{ index: number }>({
    accept: dndType,
    hover(item) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      move(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: dndType,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));
  return (
    <div
      ref={ref}
      className={`${className || ""} rounded-md border p-4 space-y-4 cursor-pointer ${isActive ? "ring-1 ring-primary" : ""}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default Reorderable;
