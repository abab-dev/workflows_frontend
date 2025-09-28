import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { credentialsApi, Credential } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { X, Settings, Loader2 } from 'lucide-react';
import { Node } from 'reactflow';

interface NodeConfigPanelProps {
  node: Node;
  onUpdateNode: (nodeId: string, newData: any) => void;
  onClose: () => void;
}

export function NodeConfigPanel({ node, onUpdateNode, onClose }: NodeConfigPanelProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [formData, setFormData] = useState(node.data.inputs || {});
  const { toast } = useToast();

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
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    onUpdateNode(node.id, newData);
  };

  const getRelevantCredentials = () => {
    const nodeType = node.data.nodeType;
    
    if (nodeType === 'telegram') {
      return credentials.filter(c => c.type === 'telegram');
    } else if (nodeType === 'llm' || nodeType === 'langgraph') {
      return credentials.filter(c => ['openai', 'gemini'].includes(c.type));
    }
    
    return credentials;
  };

  const renderTriggerConfig = () => {
    const nodeType = node.data.nodeType;
    
    if (nodeType === 'manual_trigger') {
      return (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This trigger starts the workflow manually. No configuration needed.
          </div>
        </div>
      );
    }
    
    if (nodeType === 'webhook_trigger') {
      return (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This trigger starts the workflow when a webhook is received. The webhook URL will be generated automatically.
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderActionConfig = () => {
    const nodeType = node.data.nodeType;
    const relevantCredentials = getRelevantCredentials();
    
    if (nodeType === 'telegram') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credentialId">Bot Credential</Label>
            {isLoadingCredentials ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading credentials...</span>
              </div>
            ) : (
              <Select
                value={formData.credentialId || ''}
                onValueChange={(value) => handleInputChange('credentialId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Telegram bot credential" />
                </SelectTrigger>
                <SelectContent>
                  {relevantCredentials.map((credential) => (
                    <SelectItem key={credential.id} value={credential.id}>
                      {credential.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="chat_id">Chat ID</Label>
            <Input
              id="chat_id"
              placeholder="Enter chat ID or @username"
              value={formData.chat_id || ''}
              onChange={(e) => handleInputChange('chat_id', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message_text">Message</Label>
            <Textarea
              id="message_text"
              placeholder="Enter message to send..."
              value={formData.message_text || ''}
              onChange={(e) => handleInputChange('message_text', e.target.value)}
              rows={4}
            />
          </div>
        </div>
      );
    }
    
    if (nodeType === 'llm') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credentialId">AI Credential</Label>
            {isLoadingCredentials ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading credentials...</span>
              </div>
            ) : (
              <Select
                value={formData.credentialId || ''}
                onValueChange={(value) => handleInputChange('credentialId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model credential" />
                </SelectTrigger>
                <SelectContent>
                  {relevantCredentials.map((credential) => (
                    <SelectItem key={credential.id} value={credential.id}>
                      {credential.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model_name">Model Name</Label>
            <Input
              id="model_name"
              placeholder="gemini-1.5-flash"
              value={formData.model_name || 'gemini-1.5-flash'}
              onChange={(e) => handleInputChange('model_name', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your AI prompt..."
              value={formData.prompt || ''}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              rows={6}
            />
          </div>
        </div>
      );
    }
    
    if (nodeType === 'langgraph') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credentialId">AI Credential</Label>
            {isLoadingCredentials ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading credentials...</span>
              </div>
            ) : (
              <Select
                value={formData.credentialId || ''}
                onValueChange={(value) => handleInputChange('credentialId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model credential" />
                </SelectTrigger>
                <SelectContent>
                  {relevantCredentials.map((credential) => (
                    <SelectItem key={credential.id} value={credential.id}>
                      {credential.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model_name">Model Name</Label>
            <Input
              id="model_name"
              placeholder="gemini-1.5-flash"
              value={formData.model_name || 'gemini-1.5-flash'}
              onChange={(e) => handleInputChange('model_name', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prompt">Agent Instructions</Label>
            <Textarea
              id="prompt"
              placeholder="Enter instructions for the LangGraph agent..."
              value={formData.prompt || ''}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              rows={6}
            />
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
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Configure Node</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">{node.data.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {isTrigger ? renderTriggerConfig() : renderActionConfig()}
        </CardContent>
      </Card>
      
      <Separator />
      
      <div className="text-xs text-muted-foreground">
        <p><strong>Node ID:</strong> {node.id}</p>
        <p><strong>Type:</strong> {node.data.nodeType}</p>
      </div>
    </div>
  );
}