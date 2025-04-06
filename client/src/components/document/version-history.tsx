import { Version } from "@shared/schema";
import { getVersions } from "@/lib/database";
import { useQuery } from "@tanstack/react-query";
import { Clock, Edit, FileOutput, Hourglass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface VersionHistoryProps {
  documentId?: number;
  versions: Version[];
  onRestoreVersion?: (version: Version) => void;
}

export default function VersionHistory({ documentId, versions, onRestoreVersion }: VersionHistoryProps) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Version History</h3>
      <div className="flow-root max-h-96 overflow-y-auto">
        {!documentId ? (
          <div className="text-center text-sm text-gray-500 py-4">
            No document selected
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4">
            No version history available
          </div>
        ) : (
          <ul role="list" className="-mb-8">
            {versions.map((version, idx) => (
              <VersionItem 
                key={version.id} 
                version={version} 
                isLast={idx === versions.length - 1}
                onRestore={onRestoreVersion}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface VersionItemProps {
  version: Version;
  isLast: boolean;
  onRestore?: (version: Version) => void;
}

function VersionItem({ version, isLast, onRestore }: VersionItemProps) {
  // Format the date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return diffMins === 1 ? '1m ago' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1h ago' : `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Get appropriate icon and styling based on version source
  const getVersionMeta = () => {
    switch (version.source) {
      case 'manual':
        return {
          icon: <Edit className="h-4 w-4 text-primary-500" />,
          bgColor: 'bg-primary-100',
          description: 'Edited manually'
        };
      case 'ai-generator':
        return {
          icon: <FileOutput className="h-4 w-4 text-amber-500" />,
          bgColor: 'bg-amber-100',
          description: 'Created by AI Generator'
        };
      case 'agent-refinement':
        return {
          icon: <Hourglass className="h-4 w-4 text-secondary-500" />,
          bgColor: 'bg-secondary-100',
          description: 'Refined by Agent'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 text-gray-500" />,
          bgColor: 'bg-gray-100',
          description: 'Version created'
        };
    }
  };
  
  const { icon, bgColor, description } = getVersionMeta();
  // Handle null date safely
  const createdAt = version.createdAt ? new Date(version.createdAt) : new Date();

  return (
    <li>
      <div className="relative pb-8">
        {!isLast && (
          <span 
            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
            aria-hidden="true"
          />
        )}
        <div className="relative flex space-x-3">
          <div>
            <span className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center ring-8 ring-white`}>
              {icon}
            </span>
          </div>
          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
            <div>
              <p className="text-sm text-gray-500">
                {description}
                {onRestore && (
                  <button 
                    className="ml-2 text-primary-600 hover:text-primary-800 text-xs underline focus:outline-none"
                    onClick={() => onRestore(version)}
                    title="Restore this version"
                  >
                    Restore
                  </button>
                )}
              </p>
            </div>
            <div className="text-right text-sm whitespace-nowrap text-gray-500">
              <time dateTime={createdAt.toISOString()}>{formatDate(createdAt)}</time>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
