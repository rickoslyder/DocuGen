import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProjectCard from "@/components/project/project-card";
import ProjectStats from "@/components/project/project-stats";
import MainLayout from "@/components/layout/main-layout";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects, isLoading, error } = useQuery({
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

  const getProjectStats = () => {
    if (!projects) return { count: 0, documents: 0, lastActivity: null };
    
    return {
      count: projects.length,
      documents: projects.reduce((total, p) => total + (p.metadata?.documentCount || 0), 0),
      lastActivity: projects.length > 0 ? projects[0].updatedAt : null
    };
  };

  const stats = getProjectStats();

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {/* Quick stats */}
            <ProjectStats 
              projectCount={stats.count}
              documentsCount={stats.documents}
              lastActivity={stats.lastActivity}
            />
            
            {/* Recent Projects */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Projects
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
              ) : projects && projects.length > 0 ? (
                projects.map((project: Project) => (
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

            {/* Create New Project */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
              <h3 className="text-xl font-medium text-primary-900 mb-3">Create a New Project</h3>
              <p className="text-primary-700 mb-4">Generate comprehensive documentation for your next AI project in minutes.</p>
              <Button 
                onClick={handleCreateNewProject}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
