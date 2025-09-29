import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/layout/navbar';
import { credentialsApi, Credential } from '@/lib/api';
import { Plus, Trash2, Key, Loader2 } from 'lucide-react';

const CREDENTIAL_TYPES = [
  { value: 'telegram', label: 'Telegram Bot Token' },
  { value: 'openai', label: 'OpenAI API Key' },
  { value: 'gemini', label: 'Google Gemini API Key' },
  { value: 'webhook', label: 'Webhook URL' },
];

export default function Credentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    value: '',
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await credentialsApi.list();
      setCredentials(response.data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading credentials',
        description: error.response?.data?.detail || 'Failed to load credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCredential = async () => {
    if (!formData.name.trim() || !formData.type || !formData.value.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all fields.',
      });
      return;
    }

    setIsCreating(true);
    try {
      await credentialsApi.create(formData);
      
      toast({
        title: 'Credential added!',
        description: `"${formData.name}" has been added to your credentials.`,
      });
      
      setFormData({ name: '', type: '', value: '' });
      setIsDialogOpen(false);
      loadCredentials();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to add credential',
        description: error.response?.data?.detail || 'Something went wrong.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCredential = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await credentialsApi.delete(id);
      toast({
        title: 'Credential deleted',
        description: `"${name}" has been deleted.`,
      });
      loadCredentials();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete credential',
        description: error.response?.data?.detail || 'Something went wrong.',
      });
    }
  };

  const getTypeLabel = (type: string) => {
    return CREDENTIAL_TYPES.find(t => t.value === type)?.label || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
            <p className="text-muted-foreground">
              Manage API keys and tokens for your workflow integrations
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary hover:opacity-90 transition-smooth">
                <Plus className="mr-2 h-4 w-4" />
                Add Credential
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Credential</DialogTitle>
                <DialogDescription>
                  Add API keys, tokens, or other credentials for your workflow integrations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., My Telegram Bot"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credential type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDENTIAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    type="password"
                    placeholder="Enter your API key or token"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your credentials are stored securely and encrypted.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCredential}
                  disabled={isCreating}
                  className="gradient-primary hover:opacity-90"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Credential'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-primary" />
              <span>Your Credentials</span>
            </CardTitle>
            <CardDescription>
              Manage the credentials used in your workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : credentials.length === 0 ? (
              <div className="text-center py-12">
                <div className="gradient-accent rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Key className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No credentials yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Add API keys and tokens to connect your workflows with external services like Telegram, OpenAI, and more.
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary hover:opacity-90 transition-smooth">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Credential
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Credential</DialogTitle>
                      <DialogDescription>
                        Add API keys, tokens, or other credentials for your workflow integrations.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., My Telegram Bot"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select 
                          value={formData.type} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select credential type" />
                          </SelectTrigger>
                          <SelectContent>
                            {CREDENTIAL_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="value">Value</Label>
                        <Input
                          id="value"
                          type="password"
                          placeholder="Enter your API key or token"
                          value={formData.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Your credentials are stored securely and encrypted.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateCredential}
                        disabled={isCreating}
                        className="gradient-primary hover:opacity-90"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Credential'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.map((credential) => (
                    <TableRow key={credential.id}>
                      <TableCell className="font-medium">{credential.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {getTypeLabel(credential.type)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(credential.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCredential(credential.id, credential.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}