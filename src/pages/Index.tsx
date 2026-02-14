import { useState, useCallback, useEffect, useRef } from 'react';
import { useSchematicEditor } from '@/hooks/useSchematicEditor';
import { Toolbar } from '@/components/editor/Toolbar';
import { ComponentPalette } from '@/components/editor/ComponentPalette';
import { SchematicCanvas } from '@/components/editor/SchematicCanvas';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { ComponentType, Point } from '@/types/schematic';

const Index = () => {
  const editor = useSchematicEditor();
  const [placingComponent, setPlacingComponent] = useState<ComponentType | null>(null);

  const handleSelectComponent = useCallback((type: ComponentType) => {
    setPlacingComponent(type);
    editor.setTool('select');
  }, [editor]);

  const handleCanvasClick = useCallback((point: Point) => {
    if (placingComponent) {
      editor.addComponent(placingComponent, point);
    } else if (editor.state.activeTool === 'wire') {
      editor.addWirePoint(point);
    }
  }, [placingComponent, editor]);

  const handleCanvasRightClick = useCallback(() => {
    if (placingComponent) {
      setPlacingComponent(null);
    } else if (editor.state.activeTool === 'wire') {
      editor.finishWire();
    }
  }, [placingComponent, editor]);

  const handleComponentClick = useCallback((id: string) => {
    if (editor.state.activeTool === 'delete' && id) {
      editor.deleteItem(id);
    } else {
      editor.selectComponent(id || null);
    }
  }, [editor]);

  const handleWireClick = useCallback((id: string) => {
    if (editor.state.activeTool === 'delete') {
      editor.deleteItem(id);
    } else {
      editor.selectComponent(id);
    }
  }, [editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z': e.preventDefault(); editor.undo(); return;
          case 'y': e.preventDefault(); editor.redo(); return;
          case 'd': e.preventDefault(); editor.duplicateSelected(); return;
          case 's': e.preventDefault(); editor.saveProject(); return;
        }
      }

      switch (e.key.toLowerCase()) {
        case 'v': editor.setTool('select'); setPlacingComponent(null); break;
        case 'w': editor.setTool('wire'); setPlacingComponent(null); break;
        case 'd': editor.setTool('delete'); setPlacingComponent(null); break;
        case 'm': editor.setTool('move'); setPlacingComponent(null); break;
        case 'r': editor.rotateSelected(); break;
        case 'delete':
        case 'backspace': editor.deleteSelected(); break;
        case 'escape':
          setPlacingComponent(null);
          editor.finishWire();
          editor.selectComponent(null);
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editor]);

  const selectedComponent = editor.state.components.find(
    c => editor.state.selectedIds.includes(c.id)
  ) || null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Toolbar
        activeTool={editor.state.activeTool}
        onToolChange={(t) => { editor.setTool(t); setPlacingComponent(null); }}
        onRotate={editor.rotateSelected}
        onDelete={editor.deleteSelected}
        onZoomIn={() => editor.setZoom(editor.state.zoom * 1.2)}
        onZoomOut={() => editor.setZoom(editor.state.zoom / 1.2)}
        onClear={editor.clearAll}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onSave={editor.saveProject}
        onLoad={editor.loadProject}
        onSimToggle={editor.toggleSimulation}
        onDuplicate={editor.duplicateSelected}
        zoom={editor.state.zoom}
        canUndo={editor.state.undoStack.length > 0}
        canRedo={editor.state.redoStack.length > 0}
        simulating={editor.state.simulating}
      />
      <div className="flex flex-1 overflow-hidden">
        <ComponentPalette
          onSelectComponent={handleSelectComponent}
          selectedComponentType={placingComponent}
        />
        <SchematicCanvas
          components={editor.state.components}
          wires={editor.state.wires}
          selectedIds={editor.state.selectedIds}
          activeTool={editor.state.activeTool}
          zoom={editor.state.zoom}
          pan={editor.state.pan}
          placingComponent={placingComponent}
          wireInProgress={editor.getWireInProgress()}
          simulating={editor.state.simulating}
          onCanvasClick={handleCanvasClick}
          onCanvasRightClick={handleCanvasRightClick}
          onComponentClick={handleComponentClick}
          onComponentDrag={editor.moveComponent}
          onWireClick={handleWireClick}
          onPanChange={editor.setPan}
          onZoomChange={editor.setZoom}
        />
        <PropertiesPanel
          selectedComponent={selectedComponent}
          onUpdateLabel={editor.updateComponentLabel}
        />
      </div>
    </div>
  );
};

export default Index;
