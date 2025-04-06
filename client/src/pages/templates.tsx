import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getTemplates, updateTemplate, createTemplate } from "@/lib/database";
import { Template, DocumentType, DOCUMENT_TYPES, documentTypeSchema } from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PenLine, Plus, CheckCircle } from "lucide-react";

export default function Templates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DocumentType>("project-request");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: activeTab,
    prompt: "",
    isDefault: false
  });

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: getTemplates
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, template }: { id: number, template: Partial<Template> & { isDefault?: boolean } }) => 
      updateTemplate(id, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setEditDialogOpen(false);
      toast({
        title: "Template updated",
        description: "The template has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the template.",
        variant: "destructive",
      });
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (template: any) => createTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setCreateDialogOpen(false);
      setNewTemplate({
        name: "",
        type: activeTab,
        prompt: "",
        isDefault: false
      });
      toast({
        title: "Template created",
        description: "The new template has been successfully created.",
      });
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast({
        title: "Creation failed",
        description: "There was an error creating the template.",
        variant: "destructive",
      });
    }
  });

  // Filter templates by type
  const filteredTemplates = templates.filter(template => template.type === activeTab);

  // Handle template edit
  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setEditDialogOpen(true);
  };

  // Handle template update
  const handleUpdateTemplate = () => {
    if (!selectedTemplate) return;
    
    updateTemplateMutation.mutate({
      id: selectedTemplate.id,
      template: {
        name: selectedTemplate.name,
        prompt: selectedTemplate.prompt,
        isDefault: selectedTemplate.isDefault
      }
    });
  };

  // Handle template create
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplateMutation.mutate(newTemplate);
  };

  // Handle set default template
  const handleSetDefault = (template: Template) => {
    if (template.isDefault) return;
    
    updateTemplateMutation.mutate({
      id: template.id,
      template: {
        isDefault: true
      }
    });
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Document Templates</h1>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Template
            </Button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Manage document templates for AI generation. Templates define the structure and prompts used to generate documentation.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
          <Tabs defaultValue="project-request" value={activeTab} onValueChange={(value) => setActiveTab(value as DocumentType)}>
            <TabsList className="mb-4">
              {DOCUMENT_TYPES.map((type) => (
                <TabsTrigger key={type} value={type}>
                  {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            {DOCUMENT_TYPES.map((type) => (
              <TabsContent key={type} value={type}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {isLoading ? (
                    <p>Loading templates...</p>
                  ) : filteredTemplates.length === 0 ? (
                    <p>No templates found for this document type.</p>
                  ) : (
                    filteredTemplates.map((template) => (
                      <Card key={template.id} className="relative">
                        {template.isDefault && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle>{template.name}</CardTitle>
                          <CardDescription>
                            Created: {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'N/A'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {template.prompt.substring(0, 150)}...
                            </p>
                          </div>
                          <div className="flex justify-between">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditTemplate(template)}
                            >
                              <PenLine className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            {!template.isDefault && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSetDefault(template)}
                              >
                                Set as Default
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update the template details below.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input 
                  id="name" 
                  value={selectedTemplate.name} 
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="prompt">Prompt Template</Label>
                <Textarea 
                  id="prompt" 
                  value={selectedTemplate.prompt} 
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, prompt: e.target.value})}
                  className="mt-1 h-96 font-mono"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Use placeholders like {'{'}{'{'}'PROJECT_REQUEST'{'}'}{'}}'} to reference other document content.
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="isDefault" 
                  checked={selectedTemplate.isDefault || false} 
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, isDefault: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="isDefault">Set as default template for {selectedTemplate.type}</Label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTemplate}
              disabled={updateTemplateMutation.isPending}
            >
              {updateTemplateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new template for document generation.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateTemplate} className="space-y-4 py-2">
            <div>
              <Label htmlFor="newName">Template Name</Label>
              <Input 
                id="newName" 
                value={newTemplate.name} 
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="newType">Document Type</Label>
              <Select 
                value={newTemplate.type}
                onValueChange={(value) => setNewTemplate({...newTemplate, type: value as DocumentType})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="newPrompt">Prompt Template</Label>
              <Textarea 
                id="newPrompt" 
                value={newTemplate.prompt} 
                onChange={(e) => setNewTemplate({...newTemplate, prompt: e.target.value})}
                className="mt-1 h-72 font-mono"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Use placeholders like {'{'}{'{'}'PROJECT_REQUEST'{'}'}{'}}'} to reference other document content.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="newIsDefault" 
                checked={newTemplate.isDefault} 
                onChange={(e) => setNewTemplate({...newTemplate, isDefault: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="newIsDefault">Set as default template</Label>
            </div>
            
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createTemplateMutation.isPending}
              >
                {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}