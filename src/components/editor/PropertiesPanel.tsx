import { SchematicComponent } from '@/types/schematic';

interface PropertiesPanelProps {
  selectedComponent: SchematicComponent | null;
}

export function PropertiesPanel({ selectedComponent }: PropertiesPanelProps) {
  if (!selectedComponent) {
    return (
      <div className="w-52 bg-card border-l border-border flex flex-col">
        <div className="px-3 py-2 border-b border-border">
          <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            Properties
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">
            Select a component to view its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-52 bg-card border-l border-border flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
          Properties
        </h2>
      </div>
      <div className="p-3 space-y-3 text-xs">
        <div>
          <label className="text-muted-foreground block mb-1">Type</label>
          <div className="text-foreground font-mono bg-secondary px-2 py-1 rounded">
            {selectedComponent.type.replace(/_/g, ' ')}
          </div>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">Label</label>
          <div className="text-foreground font-mono bg-secondary px-2 py-1 rounded">
            {selectedComponent.label}
          </div>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">Position</label>
          <div className="text-foreground font-mono bg-secondary px-2 py-1 rounded">
            ({selectedComponent.position.x}, {selectedComponent.position.y})
          </div>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">Rotation</label>
          <div className="text-foreground font-mono bg-secondary px-2 py-1 rounded">
            {selectedComponent.rotation}°
          </div>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">ID</label>
          <div className="text-muted-foreground font-mono bg-secondary px-2 py-1 rounded text-[10px]">
            {selectedComponent.id}
          </div>
        </div>
      </div>
    </div>
  );
}
