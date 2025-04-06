import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentType, Template } from "@shared/schema";
import { getDefaultTemplate, getTemplatesByType, updateTemplate } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";

export function useTemplates(documentType: DocumentType) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get all templates for this document type
  const {
    data: templates,
    isLoading: isLoadingTemplates,
    error: templatesError,
  } = useQuery({
    queryKey: [`/api/templates/type/${documentType}`],
    queryFn: () => getTemplatesByType(documentType),
  });
  
  // Get the default template for this document type
  const {
    data: defaultTemplate,
    isLoading: isLoadingDefaultTemplate,
    error: defaultTemplateError,
  } = useQuery({
    queryKey: [`/api/templates/default/${documentType}`],
    queryFn: () => getDefaultTemplate(documentType),
  });
  
  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, template }: { id: number, template: Partial<Template> }) => 
      updateTemplate(id, template),
    onSuccess: (updatedTemplate) => {
      // Update the templates in the cache
      queryClient.setQueryData([`/api/templates/type/${documentType}`], (oldData: Template[] | undefined) => {
        if (!oldData) return [updatedTemplate];
        return oldData.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
      });
      
      // If we updated the default template, update that in the cache too
      if (updatedTemplate.isDefault) {
        queryClient.setQueryData([`/api/templates/default/${documentType}`], updatedTemplate);
      }
      
      toast({
        title: "Template updated",
        description: "Your template has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your template.",
        variant: "destructive",
      });
    },
  });
  
  // Save template function
  const saveTemplate = async (templateId: number, templateData: Partial<Template>) => {
    return updateTemplateMutation.mutate({ id: templateId, template: templateData });
  };
  
  return {
    templates,
    activeTemplate: defaultTemplate,
    isLoadingTemplates: isLoadingTemplates || isLoadingDefaultTemplate,
    saveTemplate,
    isSaving: updateTemplateMutation.isPending,
  };
}
