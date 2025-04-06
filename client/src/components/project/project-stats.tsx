import { Card } from "@/components/ui/card";
import { FileText, Calendar, Layers } from "lucide-react";

interface ProjectStatsProps {
  projectCount: number;
  documentsCount: number;
  lastActivity: Date | null;
}

export default function ProjectStats({ projectCount, documentsCount, lastActivity }: ProjectStatsProps) {
  // Format the date for last activity
  const formatDate = (date: Date | null) => {
    if (!date) return "None";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return "Today";
    } else if (diffHours < 24) {
      return "Today";
    } else if (diffDays < 2) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
      <Card>
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Projects
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{projectCount}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Recent Activity
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{formatDate(lastActivity)}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Layers className="h-6 w-6 text-secondary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Documents Created
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{documentsCount}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
