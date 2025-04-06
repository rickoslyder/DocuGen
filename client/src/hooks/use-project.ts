import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { getProject, updateProject } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";

export function useProject(projectId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !isNaN(projectId),
  });
  
  const updateProjectMutation = useMutation({
    mutationFn: (updatedData: Partial<Project>) => updateProject(projectId, updatedData),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData([`/api/projects/${projectId}`], updatedProject);
      
      // Refresh the projects list
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating project:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your project.",
        variant: "destructive",
      });
    },
  });
  
  const updateProjectData = async (data: Partial<Project>) => {
    updateProjectMutation.mutate(data);
  };
  
  return {
    project,
    isLoading,
    error,
    updateProject: updateProjectData,
    isUpdating: updateProjectMutation.isPending,
  };
}
