
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { credentialsApi, Credential, Workflow } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Trash2, X, Settings, Loader2, Copy } from 'lucide-react';
import { Node } from 'reactflow';

interface NodeConfigPanelProps {
  node: Node;
  workflow: Workflow | null;
  onUpdateNode: (nodeId: string, newData: any) => void;
  onClose: () => void;
  onDeleteNode: (nodeId: string) => void;
}

export function NodeConfigPanel({ node, workflow, onUpdateNode, onClose, onDeleteNode }: NodeConfigPanelProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [formData, setFormData] = useState(node.data.inputs || {});
  const { toast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    loadCredentials();
  }, []);

  useEffect(() => {
    setFormData(node.data.inputs || {});
  }, [node]);

  const loadCredentials = async () => {
    setIsLoadingCredentials(true);
    try {
      const response = await credentialsApi.list();
      console.log(response.data)

      setCredentials(response.data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading credentials',
        description: 'Failed to load credentials for this node.',
      });
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    let processedValue: string | number = value;
    if (key === 'credentialId') {
      processedValue = parseInt(value, 10);
    }
    const newData = { ...formData, [key]: processedValue };
    setFormData(newData);
    onUpdateNode(node.id, newData);
  };

  const getRelevantCredentials = () => {
    const nodeType = node.data.nodeType;
    if (nodeType === 'telegram') {
      return credentials.filter(c => ['telegram', 'telegram_bot'].includes(c.type));

    } else if (nodeType === 'llm' || nodeType === 'langgraph') {
      return credentials.filter(c => ['openai', 'google_ai', 'gemini'].includes(c.type));
    }
    return credentials;
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard.",
    });
  };

  const renderTriggerConfig = () => {
    const nodeType = node.data.nodeType;
    if (nodeType === 'manual_trigger') {
      return (
        <div className="text-sm text-muted-foreground">
          This trigger starts the workflow manually. No configuration needed.
        </div>
      );
    }
    if (nodeType === 'webhook_trigger' && workflow) {
      const webhookUrl = `${API_BASE_URL}/webhooks/${workflow.webhook_token}`;
      return (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Trigger this workflow by sending a POST request to the URL below.
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <div className="flex items-center space-x-2">
              <Input id="webhookUrl" type="text" readOnly value={webhookUrl} className="font-mono" />
              <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(webhookUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The JSON body of your POST request will be available as the output of this node.
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderActionConfig = () => {
    const nodeType = node.data.nodeType;
    const relevantCredentials = getRelevantCredentials();
    const renderCredentialSelect = (placeholder: string) => (
      <div className="space-y-2">
        <Label htmlFor="credentialId">Credential</Label>
        {isLoadingCredentials ? (
          <div className="flex items-center space-x-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div>
        ) : (
          <Select
            value={String(formData.credentialId || '')}
            onValueChange={(value) => handleInputChange('credentialId', value)}
          >
            <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>
              {relevantCredentials.map((credential) => (
                // --- START: THIS IS THE KEY FIX FOR THE DROPDOWN ---
                <SelectItem key={credential.id} value={String(credential.id)}>
                  {credential.name}
                </SelectItem>
                // --- END: KEY FIX ---
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );

    if (nodeType === 'telegram') {
      return (
        <div className="space-y-4">
          {renderCredentialSelect("Select Telegram bot credential")}
          <div className="space-y-2">
            <Label htmlFor="chat_id">Chat ID</Label>
            <Input id="chat_id" placeholder="Enter chat ID or @username" value={formData.chat_id || ''} onChange={(e) => handleInputChange('chat_id', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message_text">Message</Label>
            <Textarea id="message_text" placeholder="Enter message to send..." value={formData.message_text || ''} onChange={(e) => handleInputChange('message_text', e.target.value)} rows={4} />
          </div>
        </div>
      );
    }
    if (nodeType === 'llm' || nodeType === 'langgraph') {
      return (
        <div className="space-y-4">
          {renderCredentialSelect("Select AI model credential")}
          <div className="space-y-2">
            <Label htmlFor="model_name">Model Name</Label>
            <Input id="model_name" placeholder="gemini-1.5-flash" value={formData.model_name || 'gemini-1.5-flash'} onChange={(e) => handleInputChange('model_name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">{nodeType === 'llm' ? 'Prompt' : 'Agent Instructions'}</Label>
            <Textarea id="prompt" placeholder={nodeType === 'llm' ? 'Enter your AI prompt...' : 'Enter instructions for the agent...'} value={formData.prompt || ''} onChange={(e) => handleInputChange('prompt', e.target.value)} rows={6} />
          </div>
        </div>
      );
    }
    return null;
  };

  const isTrigger = ['manual_trigger', 'webhook_trigger'].includes(node.data.nodeType);

  return (
    <div className="w-96 bg-card border-l border-border p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2"><Settings className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">Configure Node</h3></div>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base">{node.data.label}</CardTitle></CardHeader>
        <CardContent>{isTrigger ? renderTriggerConfig() : renderActionConfig()}</CardContent>
      </Card>
      <Separator />
      <div className="flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          <p><strong>Node ID:</strong> {node.id}</p>
          <p><strong>Type:</strong> {node.data.nodeType}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onDeleteNode(node.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
      </div>
    </div>
  );
}
