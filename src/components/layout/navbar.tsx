import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';
import { LogOut, Settings, Workflow, Key } from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border bg-card shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/workflows" className="flex items-center space-x-2">
              <div className="gradient-primary rounded-lg p-2">
                <Workflow className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Hero API</span>
            </Link>
            
            <div className="flex space-x-1">
              <Button
                variant={isActive('/workflows') ? 'default' : 'ghost'}
                asChild
              >
                <Link to="/workflows" className="flex items-center space-x-2">
                  <Workflow className="h-4 w-4" />
                  <span>Workflows</span>
                </Link>
              </Button>
              
              <Button
                variant={isActive('/credentials') ? 'default' : 'ghost'}
                asChild
              >
                <Link to="/credentials" className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Credentials</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}