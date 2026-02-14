import { Tool } from '@/types/schematic';
import {
  MousePointer2,
  Minus,
  Trash2,
  Move,
  Type,
  RotateCw,
  ZoomIn,
  ZoomOut,
  FileText,
  Download,
  Eraser,
} from 'lucide-react';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onRotate: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClear: () => void;
  zoom: number;
}

const tools: { tool: Tool; icon: React.ReactNode; label: string }[] = [
  { tool: 'select', icon: <MousePointer2 size={18} />, label: 'Select (V)' },
  { tool: 'move', icon: <Move size={18} />, label: 'Move (M)' },
  { tool: 'wire', icon: <Minus size={18} />, label: 'Wire (W)' },
  { tool: 'delete', icon: <Trash2 size={18} />, label: 'Delete (D)' },
];

export function Toolbar({
  activeTool,
  onToolChange,
  onRotate,
  onDelete,
  onZoomIn,
  onZoomOut,
  onClear,
  zoom,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-1 bg-muted px-3 py-1.5 border-b border-border">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4 pr-4 border-r border-border">
        <span className="text-primary font-mono font-bold text-sm">CADe</span>
        <span className="text-muted-foreground font-mono text-xs">SIMU</span>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-0.5 mr-3 pr-3 border-r border-border">
        {tools.map(({ tool, icon, label }) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            className={`p-2 rounded transition-colors ${
              activeTool === tool
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 mr-3 pr-3 border-r border-border">
        <button
          onClick={onRotate}
          className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Rotate (R)"
        >
          <RotateCw size={18} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
          title="Delete Selected"
        >
          <Eraser size={18} />
        </button>
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-1 mr-3 pr-3 border-r border-border">
        <button
          onClick={onZoomOut}
          className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-xs text-muted-foreground font-mono min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {/* File */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onClear}
          className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="New Schematic"
        >
          <FileText size={18} />
        </button>
      </div>

      {/* Spacer + Status */}
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-mono">Grid: 20px</span>
      </div>
    </div>
  );
}
