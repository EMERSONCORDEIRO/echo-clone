import { useState } from 'react';
import { componentCategories } from '@/lib/componentCategories';
import { ComponentType } from '@/types/schematic';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ComponentPaletteProps {
  onSelectComponent: (type: ComponentType) => void;
  selectedComponentType: ComponentType | null;
}

export function ComponentPalette({ onSelectComponent, selectedComponentType }: ComponentPaletteProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(componentCategories.map(c => c.name))
  );

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="w-56 bg-card border-r border-border flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
          Components
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {componentCategories.map(category => (
          <div key={category.name}>
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              {expandedCategories.has(category.name) ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
            {expandedCategories.has(category.name) && (
              <div className="pl-4">
                {category.components.map(comp => (
                  <button
                    key={comp.type}
                    onClick={() => onSelectComponent(comp.type)}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors rounded-sm mx-1 ${
                      selectedComponentType === comp.type
                        ? 'bg-primary/20 text-primary border-l-2 border-primary'
                        : 'text-secondary-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {comp.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
