import { SchematicComponent } from '@/types/schematic';
import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface PropertiesPanelProps {
  selectedComponent: SchematicComponent | null;
  onUpdateLabel: (id: string, label: string) => void;
}

export function PropertiesPanel({ selectedComponent, onUpdateLabel }: PropertiesPanelProps) {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');

  const startEdit = () => {
    if (!selectedComponent) return;
    setEditLabel(selectedComponent.label);
    setEditing(true);
  };

  const confirmEdit = () => {
    if (selectedComponent && editLabel.trim()) {
      onUpdateLabel(selectedComponent.id, editLabel.trim());
    }
    setEditing(false);
  };

  if (!selectedComponent) {
    return (
      <div className="w-56 bg-card border-l border-border flex flex-col">
        <div className="px-3 py-2 border-b border-border">
          <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            Propriedades
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">
            Selecione um componente para ver suas propriedades
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 bg-card border-l border-border flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
          Propriedades
        </h2>
      </div>
      <div className="p-3 space-y-3 text-xs">
        <div>
          <label className="text-muted-foreground block mb-1">Tipo</label>
          <div className="text-foreground font-mono bg-secondary px-2 py-1 rounded">
            {selectedComponent.type.replace(/_/g, ' ')}
          </div>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">Rótulo</label>
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
                className="flex-1 bg-secondary text-foreground font-mono px-2 py-1 rounded border border-primary outline-none text-xs"
                autoFocus
              />
              <button onClick={confirmEdit} className="text-success p-0.5"><Check size={14} /></button>
              <button onClick={() => setEditing(false)} className="text-destructive p-0.5"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="flex-1 text-foreground font-mono bg-secondary px-2 py-1 rounded">
                {selectedComponent.label}
              </div>
              <button onClick={startEdit} className="text-muted-foreground hover:text-foreground p-0.5">
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">Posição</label>
          <div className="text-foreground font-mono bg-secondary px-2 py-1 rounded">
            ({selectedComponent.position.x}, {selectedComponent.position.y})
          </div>
        </div>
        <div>
          <label className="text-muted-foreground block mb-1">Rotação</label>
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
        {selectedComponent.simState && (
          <div>
            <label className="text-muted-foreground block mb-1">Estado (Simulação)</label>
            <div className={`font-mono px-2 py-1 rounded text-xs font-bold ${
              selectedComponent.simState === 'on' ? 'bg-success/20 text-success' :
              selectedComponent.simState === 'fault' ? 'bg-destructive/20 text-destructive' :
              'bg-secondary text-muted-foreground'
            }`}>
              {selectedComponent.simState === 'on' ? 'LIGADO' :
               selectedComponent.simState === 'fault' ? 'FALHA' : 'DESLIGADO'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
