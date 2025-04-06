import { useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, FileText, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onCloseMobile?: () => void;
}

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  const [location, navigate] = useLocation();
  
  const navigateTo = (path: string) => {
    navigate(path);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path === "/projects" && location.startsWith("/projects")) return true;
    if (path === "/templates" && location.startsWith("/templates")) return true;
    if (path === "/settings" && location.startsWith("/settings")) return true;
    return false;
  };

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
              D
            </div>
            <span className="ml-2 text-xl font-semibold">DocuGen AI</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-3 flex-1 px-2 space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start px-2 py-2 text-sm font-medium rounded-md",
              isActive("/") 
                ? "bg-primary-50 text-primary-700" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
            onClick={() => navigateTo("/")}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </Button>
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start px-2 py-2 text-sm font-medium rounded-md",
              isActive("/projects") 
                ? "bg-primary-50 text-primary-700" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
            onClick={() => navigateTo("/projects")}
          >
            <FolderKanban className="mr-3 h-5 w-5" />
            Projects
          </Button>
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start px-2 py-2 text-sm font-medium rounded-md",
              isActive("/templates") 
                ? "bg-primary-50 text-primary-700" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
            onClick={() => navigateTo("/templates")}
          >
            <FileText className="mr-3 h-5 w-5" />
            Templates
          </Button>
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start px-2 py-2 text-sm font-medium rounded-md",
              isActive("/settings") 
                ? "bg-primary-50 text-primary-700" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
            onClick={() => navigateTo("/settings")}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Button>
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <Button
          variant="ghost"
          className="w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          onClick={() => navigateTo("/new-project")}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="inline-flex h-8 w-8 rounded-full bg-gray-100 items-center justify-center text-sm font-medium text-gray-500">
                <Plus className="h-5 w-5" />
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">New Project</p>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}
