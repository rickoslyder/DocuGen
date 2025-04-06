import { Button } from "@/components/ui/button";
import { RefreshCw, Save, Edit } from "lucide-react";

interface DocumentActionsProps {
  onRegenerate: () => Promise<void>;
  onSave: () => void; // Changed return type to match our implementation
  onCustomizePrompt: () => void;
  isSaving: boolean;
}

export default function DocumentActions({ 
  onRegenerate, 
  onSave, 
  onCustomizePrompt,
  isSaving 
}: DocumentActionsProps) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Document Actions</h3>
      <div className="flex flex-col space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRegenerate}
          disabled={isSaving}
          className="justify-start text-left px-2 md:px-3"
          title="Regenerate document with AI"
        >
          <RefreshCw className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">Regenerate</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSave}
          disabled={isSaving}
          className="justify-start text-left px-2 md:px-3"
          title="Save current changes"
        >
          <Save className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">{isSaving ? "Saving..." : "Save Changes"}</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCustomizePrompt}
          disabled={isSaving}
          className="justify-start text-left px-2 md:px-3"
          title="Edit the AI prompt template"
        >
          <Edit className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">Customize Prompt</span>
        </Button>
      </div>
    </div>
  );
}
