import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/layout/navbar';
import { workflowRunsApi } from '@/lib/api';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';

export default function WorkflowRunDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [runDetails, setRunDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadRunDetails();
    }
  }, [id]);

  const loadRunDetails = async () => {
    if (!id) return;

    try {
      const response = await workflowRunsApi.get(id);
      setRunDetails(response.data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading run details',
        description: error.response?.data?.detail || 'Failed to load run details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // FIX: Safely parse the logs string from the API response
  const parsedLogs = useMemo(() => {
    if (!runDetails?.logs || typeof runDetails.logs !== 'string') {
      return null;
    }
    try {
      // Attempt to parse the string as JSON
      const parsed = JSON.parse(runDetails.logs);
      // Pretty-print the JSON object for display
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      // If it's not valid JSON, it might be a plain error string. Display as is.
      return runDetails.logs;
    }
  }, [runDetails]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'SUCCESS':
        return 'bg-success/10 text-success border-success/20';
      case 'FAILED':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    if (!startDate) return 'N/A';
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);

    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    } else {
      return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
    }
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

  if (!runDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Run not found</h2>
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Run Details</h1>
              <p className="text-muted-foreground font-mono">
                {id}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Run Status */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Execution Summary</span>
                </div>
                <Badge className={getStatusColor(runDetails.status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(runDetails.status)}
                    <span className="capitalize">{runDetails.status.toLowerCase()}</span>
                  </div>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Started At</h4>
                  <p className="text-sm">{formatDate(runDetails.started_at)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Finished At</h4>
                  <p className="text-sm">{formatDate(runDetails.finished_at)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                  <p className="text-sm">
                    {calculateDuration(runDetails.started_at, runDetails.finished_at)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Workflow ID</h4>
                  <p className="text-sm font-mono">{runDetails.workflow_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execution Logs */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Execution Context & Output</CardTitle>
            </CardHeader>
            <CardContent>
              {parsedLogs ? (
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <pre className="whitespace-pre-wrap break-all">
                    {parsedLogs}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No logs available</h3>
                  <p className="text-muted-foreground">
                    Execution logs will appear here when available.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Details (if failed) */}
          {runDetails.status === 'FAILED' && parsedLogs && (
            <Card className="shadow-card border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-destructive/10 rounded-lg p-4 font-mono text-sm">
                  <pre className="whitespace-pre-wrap text-destructive">
                    {parsedLogs}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
