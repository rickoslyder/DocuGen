import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import DocumentTabs from "@/components/document/document-tabs";
import DocumentEditor from "@/components/document/document-editor";
import DocumentActions from "@/components/document/document-actions";
import VersionHistory from "@/components/document/version-history";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Download, Settings } from "lucide-react";
import { Document, DocumentType, DOCUMENT_TYPE_ORDER, Project } from "@shared/schema";
import { getDocuments, getNextDocumentType, getPreviousDocumentType, getProject, updateDocument } from "@/lib/database";
import { useDocument } from "@/hooks/use-document";
import { generateProjectDocument, agentModeGenerateDocument } from "@/lib/ai";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getTemplatesByType, updateTemplate } from "@/lib/database";
import { useTemplates } from "@/hooks/use-templates";

export default function DocumentEditing() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeDocumentType, setActiveDocumentType] = useState<DocumentType>("project-request");
  const [isCustomizingPrompt, setIsCustomizingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  
  // Fetch project data
  const { 
    data: project,
    isLoading: isLoadingProject,
    error: projectError
  } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !isNaN(projectId),
  });
  
  // Fetch all documents for this project
  const {
    data: allDocuments,
    isLoading: isLoadingDocuments,
    error: documentsError
  } = useQuery({
    queryKey: [`/api/projects/${projectId}/documents`],
    enabled: !isNaN(projectId),
  });
  
  // Current document state
  const { 
    document, 
    isLoading: isLoadingDocument,
    versions,
    saveDocument,
    regenerateDocument,
    isSaving
  } = useDocument(projectId, activeDocumentType);
  
  // Template hooks
  const { 
    templates,
    activeTemplate,
    isLoadingTemplates,
    saveTemplate 
  } = useTemplates(activeDocumentType);
  
  // Set custom prompt from template when dialog opens
  useEffect(() => {
    if (activeTemplate) {
      setCustomPrompt(activeTemplate.prompt);
    }
  }, [activeTemplate, isCustomizingPrompt]);
  
  // Handle errors
  useEffect(() => {
    if (projectError || documentsError) {
      toast({
        title: "Error loading project",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [projectError, documentsError, toast]);
  
  const handleGoBack = () => {
    navigate("/");
  };
  
  const handleSavePrompt = async () => {
    if (activeTemplate && customPrompt.trim()) {
      try {
        await saveTemplate(activeTemplate.id, { prompt: customPrompt });
        toast({
          title: "Prompt updated",
          description: "Your custom prompt has been saved successfully."
        });
        setIsCustomizingPrompt(false);
      } catch (error) {
        toast({
          title: "Error saving prompt",
          description: "There was an error saving your custom prompt.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleDocumentSelect = (type: DocumentType) => {
    setActiveDocumentType(type);
  };
  
  const handleNextDocument = async () => {
    if (!document) return;
    
    // Save current document
    await saveDocument();
    
    // Get next document type
    const nextType = getNextDocumentType(activeDocumentType);
    if (!nextType) return;
    
    // Check if next document exists
    const nextDocExists = allDocuments?.some(doc => doc.type === nextType);
    
    if (!nextDocExists && project) {
      // Generate the next document
      try {
        toast({
          title: "Generating document",
          description: `Generating ${nextType.replace(/-/g, ' ')}...`
        });
        
        if (project.generationMode === "agent") {
          // Use agent mode for more intelligent generation
          await agentModeGenerateDocument(project, nextType, allDocuments || []);
        } else {
          // Use standard mode for basic generation
          await generateProjectDocument(project, nextType, allDocuments || []);
        }
        
        // Refresh documents
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/documents`] });
      } catch (error) {
        console.error("Error generating next document:", error);
        toast({
          title: "Generation Failed",
          description: "There was an error generating the next document.",
          variant: "destructive",
        });
      }
    }
    
    // Navigate to next document type
    setActiveDocumentType(nextType);
  };
  
  const handlePreviousDocument = async () => {
    if (!document) return;
    
    // Save current document
    await saveDocument();
    
    // Get previous document type
    const prevType = getPreviousDocumentType(activeDocumentType);
    if (!prevType) return;
    
    // Navigate to previous document type
    setActiveDocumentType(prevType);
  };
  
  const exportProject = () => {
    if (!project || !allDocuments || allDocuments.length === 0) return;
    
    try {
      // Prepare project data for export
      const exportData = {
        project,
        documents: allDocuments
      };
      
      // Create JSON file and trigger download
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `${project.name.replace(/\s+/g, '-').toLowerCase()}-documentation.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Export Successful",
        description: "Your project documentation has been exported."
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your project.",
        variant: "destructive",
      });
    }
  };
  
  // Loading state
  if (isLoadingProject || isLoadingDocuments || isNaN(projectId)) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
            <p className="mt-4 text-lg text-gray-600">Loading project...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Error state
  if (!project || projectError || documentsError) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
            <p className="mt-2 text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={handleGoBack} className="mt-4">
              Go back to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500">
                <span className="mr-2">
                  {project.generationMode === "agent" ? "Agent Mode" : "Standard Mode"}
                </span>
                <span>•</span>
                <span className="ml-2">
                  Updated {new Date(project.updatedAt).toLocaleString()}
                </span>
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportProject}
                disabled={!allDocuments || allDocuments.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/projects/${projectId}/settings`)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Document Tabs */}
            <DocumentTabs 
              documents={allDocuments || []}
              activeType={activeDocumentType}
              onSelect={handleDocumentSelect}
            />
            
            {/* Document Content */}
            <div className="grid grid-cols-1 md:grid-cols-4">
              {/* Sidebar Actions/History */}
              <div className="border-r border-gray-200 bg-gray-50 p-4">
                {/* Document actions with immediate save for button click */}
                <DocumentActions 
                  onRegenerate={() => regenerateDocument(project, allDocuments || [])}
                  onSave={() => saveDocument(undefined, true)}
                  onCustomizePrompt={() => setIsCustomizingPrompt(true)}
                  isSaving={isSaving}
                />
                
                <VersionHistory 
                  versions={versions || []}
                  documentId={document?.id}
                  onRestoreVersion={(version) => {
                    if (document) {
                      // Use immediate save for version restoration
                      saveDocument(version.content, true);
                      toast({
                        title: "Version Restored",
                        description: "Document has been restored to a previous version."
                      });
                    }
                  }}
                />
              </div>
              
              {/* Document Editor */}
              <div className="col-span-3">
                <DocumentEditor 
                  document={document}
                  isLoading={isLoadingDocument}
                  onChange={(content) => {
                    if (document) {
                      // Use the debounced save for typing - this will not jump focus
                      saveDocument(content, false);
                    }
                  }}
                />
                
                {/* Action buttons for Standard Mode */}
                {project.generationMode === "standard" && (
                  <div className="flex justify-between p-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={handlePreviousDocument}
                      disabled={activeDocumentType === DOCUMENT_TYPE_ORDER[0] || !document}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handleNextDocument}
                      disabled={activeDocumentType === DOCUMENT_TYPE_ORDER[DOCUMENT_TYPE_ORDER.length - 1] || !document}
                      className="bg-primary-600 hover:bg-primary-700"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
                
                {/* Agent Mode Status */}
                {project.generationMode === "agent" && (
                  <div className="p-4 border-t border-gray-200 bg-primary-50">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <div className="h-5 w-5 text-primary-400">
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-primary-800">Agent Mode Active</h3>
                        <div className="mt-2 text-sm text-primary-700">
                          <p>AI is automatically generating and refining all documents. You can review and edit them at any time.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Customize Prompt Dialog */}
      <Dialog open={isCustomizingPrompt} onOpenChange={setIsCustomizingPrompt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customize Prompt Template</DialogTitle>
            <DialogDescription>
              Edit the prompt template used to generate this document type.
              Use placeholders like {`{{IDEA}}`} or {`{{PROJECT_REQUEST}}`} to reference other content.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSavePrompt}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
