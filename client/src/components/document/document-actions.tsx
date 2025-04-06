import { Button } from "@/components/ui/button";
import { RefreshCw, Save, Edit } from "lucide-react";

interface DocumentActionsProps {
  onRegenerate: () => Promise<void>;
  onSave: () => Promise<void>;
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
          className="justify-start"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Regenerate
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSave}
          disabled={isSaving}
          className="justify-start"
        >
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCustomizePrompt}
          disabled={isSaving}
          className="justify-start"
        >
          <Edit className="h-4 w-4 mr-1" />
          Customize Prompt
        </Button>
      </div>
    </div>
  );
}
