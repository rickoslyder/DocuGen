import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProjectCard from "@/components/project/project-card";
import MainLayout from "@/components/layout/main-layout";

export default function Projects() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 1000 * 60, // 1 minute
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading projects",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleCreateNewProject = () => {
    navigate("/new-project");
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <Button onClick={handleCreateNewProject}>
            <PlusCircle className="h-5 w-5 mr-2" />
            New Project
          </Button>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {/* Projects List */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  All Projects
                </h3>
              </div>
              
              {isLoading ? (
                <div className="px-4 py-5 sm:p-6 flex justify-center">
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : projects.length > 0 ? (
                projects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onClick={() => navigate(`/projects/${project.id}`)} 
                  />
                ))
              ) : (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  No projects found. Create your first project to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}