import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/layout/navbar';
import { WorkflowNodesSidebar } from '@/components/workflow/nodes-sidebar';
import { NodeConfigPanel } from '@/components/workflow/node-config-panel';
import { workflowsApi, Workflow } from '@/lib/api';
import { Save, Play, ArrowLeft, Loader2 } from 'lucide-react';

const nodeTypes = {
  // We'll define custom node types here
};

export default function WorkflowEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (id) {
      loadWorkflow();
    }
  }, [id]);


  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleDeleteNode = (nodeId: string) => {
    // Remove the node itself
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    // Remove any edges connected to the node
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    // Close the config panel
    setSelectedNode(null);
  };


  const loadWorkflow = async () => {
    if (!id) return;

    try {
      const response = await workflowsApi.get(id);
      const workflowData = response.data;
      setWorkflow(workflowData);

      if (workflowData.json_content) {
        const nodesForCanvas = (workflowData.json_content.nodes || []).map(node => {
          // --- START: ROBUSTNESS FIX ---
          // This ensures that older, saved workflows without the 'type' in inputs are fixed on load.
          const inputs = node.data.inputs || {};
          if (!inputs.type) {
            inputs.type = node.type;
          }
          // --- END: ROBUSTNESS FIX ---

          return {
            ...node,
            type: 'default',
            data: {
              ...node.data,
              inputs: inputs, // Use the potentially fixed inputs object
              nodeType: node.type,
            },
          };
        });
        setNodes(nodesForCanvas);
        setEdges(workflowData.json_content.edges || []);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading workflow',
        description: error.response?.data?.detail || 'Failed to load workflow.',
      });
      navigate('/workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    const startNode = nodes.find(n =>
      n.data.nodeType === 'manual_trigger' || n.data.nodeType === 'webhook_trigger'
    );

    if (!startNode) {
      toast({
        variant: 'destructive',
        title: 'Cannot save workflow',
        description: 'A workflow must have a trigger node (Manual or Webhook).',
      });
      return;
    }

    const nodesRequiringCredentials = ['telegram', 'llm', 'langgraph'];
    for (const node of nodes) {
      if (nodesRequiringCredentials.includes(node.data.nodeType)) {
        if (!node.data.inputs?.credentialId) {
          toast({
            variant: 'destructive',
            title: 'Incomplete Configuration',
            description: `The node "${node.data.label}" requires a credential to be selected.`,
          });
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const nodesForApi = nodes.map(node => ({
        ...node,
        type: node.data.nodeType,
      }));

      const workflowContent = {
        startNodeId: startNode.id,
        nodes: nodesForApi,
        edges,
      };

      await workflowsApi.update(id, {
        name: workflow?.name,
        json_content: workflowContent,
      });

      toast({
        title: 'Workflow saved!',
        description: 'Your workflow has been saved successfully.',
      });
    } catch (error: any) {
      // --- START: THIS IS THE KEY FIX FOR THE UI CRASH ---
      let errorMessage = 'Something went wrong.';
      if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
        // Handle FastAPI's detailed validation errors
        errorMessage = `${error.response.data.detail[0].msg} (in ${error.response.data.detail[0].loc.join(' -> ')})`;
      } else if (error.response?.data?.detail) {
        // Handle simple string errors
        errorMessage = error.response.data.detail;
      }

      toast({
        variant: 'destructive',
        title: 'Failed to save workflow',
        description: errorMessage, // Now this is always a safe string
      });
      // --- END: KEY FIX ---
    } finally {
      setIsSaving(false);
    }
  };
  const handleExecute = async () => {
    if (!id) return;

    setIsExecuting(true);
    try {
      await workflowsApi.execute(id);

      toast({
        title: 'Workflow executed!',
        description: 'Your workflow has been started. Check the runs page for status.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to execute workflow',
        description: error.response?.data?.detail || 'Something went wrong.',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddNode = (nodeType: string, position: { x: number; y: number }) => {
    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: 'default',
      position,
      data: {
        label: getNodeLabel(nodeType),
        nodeType,
        inputs: getDefaultInputs(nodeType),
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const getNodeLabel = (nodeType: string) => {
    const labels: Record<string, string> = {
      manual_trigger: 'Manual Trigger',
      webhook_trigger: 'Webhook Trigger',
      telegram: 'Telegram Message',
      llm: 'LLM Prompt',
      langgraph: 'LangGraph Agent',
    };
    return labels[nodeType] || nodeType;
  };

  const getDefaultInputs = (nodeType: string) => {
    const defaults: Record<string, any> = {
      telegram: {
        type: 'telegram', // <-- ADD THIS
        credentialId: '',
        chat_id: '',
        message_text: '',
      },
      llm: {
        type: 'llm', // <-- ADD THIS
        credentialId: '',
        model_name: 'gemini-1.5-flash',
        prompt: '',
      },
      langgraph: {
        type: 'langgraph', // <-- ADD THIS
        credentialId: '',
        model_name: 'gemini-1.5-flash',
        prompt: '',
      },
      manual_trigger: { // <-- ADD THIS
        type: 'manual_trigger',
      },
      webhook_trigger: { // <-- ADD THIS
        type: 'webhook_trigger',
      },
    };
    return defaults[nodeType] || {};
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, inputs: newData } }
          : node
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Workflow not found</h2>
            <Button
              onClick={() => navigate('/workflows')}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workflows
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        {/* Nodes Sidebar */}
        <WorkflowNodesSidebar onAddNode={handleAddNode} />

        {/* Main Editor */}
        <div className="flex-1 relative">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-card border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/workflows')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-xl font-bold">{workflow.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    Workflow Editor
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="gradient-primary hover:opacity-90"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* React Flow Canvas */}
          <div className="h-full pt-16">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background variant={BackgroundVariant.Dots} />
              <Controls />
            </ReactFlow>
          </div>
        </div>

        {/* Node Configuration Panel */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdateNode={updateNodeData}
            onClose={() => setSelectedNode(null)}
            onDeleteNode={handleDeleteNode} // <-- PASS THE FUNCTION HERE
          />
        )}
      </div>
    </div>
  );
}
