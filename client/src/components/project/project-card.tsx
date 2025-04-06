import { Project } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const documentCount = project.metadata?.documentCount || 0;
  const updatedAt = new Date(project.updatedAt);
  
  // Format the date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div 
      className="px-4 py-4 sm:px-6 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600 truncate">{project.name}</p>
          <p className="mt-1 flex items-center text-sm text-gray-500">
            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
            <span>Updated {formatDate(updatedAt)}</span>
          </p>
        </div>
        <div className="flex items-center">
          <div className="text-sm text-gray-500 mr-4">{documentCount} documents</div>
          <div className={cn(
            "text-xs px-2 py-1 rounded-full",
            project.generationMode === "agent" 
              ? "bg-primary-100 text-primary-800" 
              : "bg-amber-100 text-amber-800"
          )}>
            {project.generationMode === "agent" ? "Agent mode" : "Standard mode"}
          </div>
        </div>
      </div>
    </div>
  );
}
