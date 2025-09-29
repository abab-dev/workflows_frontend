import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Zap, Webhook, MessageSquare, Brain, Bot, ChevronRight, ChevronDown } from 'lucide-react';

interface NodeType {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'trigger' | 'action';
}

const nodeTypes: NodeType[] = [
  {
    id: 'manual_trigger',
    label: 'Manual Trigger',
    description: 'Start workflow manually',
    icon: Zap,
    category: 'trigger',
  },
  {
    id: 'webhook_trigger',
    label: 'Webhook Trigger',
    description: 'Start workflow via HTTP webhook',
    icon: Webhook,
    category: 'trigger',
  },
  {
    id: 'telegram',
    label: 'Telegram Message',
    description: 'Send message via Telegram bot',
    icon: MessageSquare,
    category: 'action',
  },
  {
    id: 'llm',
    label: 'LLM Prompt',
    description: 'Process text with AI language model',
    icon: Brain,
    category: 'action',
  },
  {
    id: 'langgraph',
    label: 'LangGraph Agent',
    description: 'Execute complex AI agent workflow',
    icon: Bot,
    category: 'action',
  },
];

interface WorkflowNodesSidebarProps {
  onAddNode: (nodeType: string, position: { x: number; y: number }) => void;
}

export function WorkflowNodesSidebar({ onAddNode }: WorkflowNodesSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['trigger', 'action'])
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleNodeClick = (nodeType: string) => {
    // Add node at center of canvas
    onAddNode(nodeType, { x: 300, y: 200 });
  };

  const triggerNodes = nodeTypes.filter(node => node.category === 'trigger');
  const actionNodes = nodeTypes.filter(node => node.category === 'action');

  return (
    <div className="w-80 bg-card border-r border-border p-4 space-y-4 overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold mb-2">Workflow Nodes</h2>
        <p className="text-sm text-muted-foreground">
          Drag nodes onto the canvas to build your workflow
        </p>
      </div>
      
      <Separator />
      
      {/* Triggers Section */}
      <div>
        <Button
          variant="ghost"
          onClick={() => toggleCategory('trigger')}
          className="w-full justify-between p-2 h-auto text-left"
        >
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium">Triggers</span>
          </div>
          {expandedCategories.has('trigger') ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        
        {expandedCategories.has('trigger') && (
          <div className="space-y-2 mt-2">
            {triggerNodes.map((node) => (
              <Card
                key={node.id}
                className="cursor-pointer hover:shadow-card transition-smooth border-border/50 hover:border-primary/20"
                onClick={() => handleNodeClick(node.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="gradient-primary rounded-lg p-2 flex-shrink-0">
                      <node.icon className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium truncate">{node.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {node.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Actions Section */}
      <div>
        <Button
          variant="ghost"
          onClick={() => toggleCategory('action')}
          className="w-full justify-between p-2 h-auto text-left"
        >
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4 text-accent" />
            <span className="font-medium">Actions</span>
          </div>
          {expandedCategories.has('action') ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        
        {expandedCategories.has('action') && (
          <div className="space-y-2 mt-2">
            {actionNodes.map((node) => (
              <Card
                key={node.id}
                className="cursor-pointer hover:shadow-card transition-smooth border-border/50 hover:border-accent/20"
                onClick={() => handleNodeClick(node.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="gradient-accent rounded-lg p-2 flex-shrink-0">
                      <node.icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium truncate">{node.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {node.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}