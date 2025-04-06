import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { createProject } from "@/lib/database";
import { agentModeGenerateAllDocuments, generateProjectDocument } from "@/lib/ai";
import { InsertProject } from "@shared/schema";

export default function ProjectCreation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InsertProject>({
    name: "",
    description: "",
    generationMode: "standard",
    template: "default"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleModeChange = (value: string) => {
    setFormData({
      ...formData,
      generationMode: value
    });
  };

  const handleTemplateChange = (value: string) => {
    setFormData({
      ...formData,
      template: value
    });
  };

  const handleGoBack = () => {
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both project name and description",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the project
      const project = await createProject(formData);
      
      // Start document generation based on the selected mode
      if (formData.generationMode === "agent") {
        // For agent mode, we'll redirect and start the generation process in the background
        navigate(`/projects/${project.id}`);
        
        // Start agent mode generation in the background
        agentModeGenerateAllDocuments(project).catch(error => {
          console.error("Agent mode generation error:", error);
          toast({
            title: "Document Generation Error",
            description: "There was an error generating documents in agent mode.",
            variant: "destructive",
          });
        });
      } else {
        // For standard mode, just generate the first document
        await generateProjectDocument(project, "project-request");
        
        // Navigate to the project
        navigate(`/projects/${project.id}`);
      }
      
      // Invalidate the projects query to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Project Creation Failed",
        description: "There was an error creating your project.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Create New Project</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              className="inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </div>
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit}>
                  {/* Project Name */}
                  <div className="mb-6">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Enter project name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  
                  {/* Project Idea Description */}
                  <div className="mb-6">
                    <Label htmlFor="description">Project Idea Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={5}
                      placeholder="Describe your project idea in detail. This will be used to generate all documentation."
                      value={formData.description}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Be as detailed as possible. Include project goals, target audience, and key features.
                    </p>
                  </div>
                  
                  {/* Generation Mode */}
                  <div className="mb-6">
                    <Label className="block mb-2">Generation Mode</Label>
                    <RadioGroup 
                      defaultValue="standard" 
                      value={formData.generationMode}
                      onValueChange={handleModeChange}
                      className="flex items-center space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="standard" id="mode-standard" />
                        <Label htmlFor="mode-standard" className="cursor-pointer">Standard Mode</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="agent" id="mode-agent" />
                        <Label htmlFor="mode-agent" className="cursor-pointer">Agent Mode</Label>
                      </div>
                    </RadioGroup>
                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="bg-white px-4 py-3 border border-gray-200 rounded-md">
                        <h3 className="text-sm font-medium text-gray-800">Standard Mode</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          You review and edit each document before proceeding to the next one. More control, but requires more input.
                        </p>
                      </div>
                      <div className="bg-white px-4 py-3 border border-gray-200 rounded-md">
                        <h3 className="text-sm font-medium text-gray-800">Agent Mode</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          AI automatically generates and refines all documents. Faster, but less manual control over the process.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Template Selection (Optional) */}
                  <div className="mb-6">
                    <Label htmlFor="template">Template (Optional)</Label>
                    <Select 
                      value={formData.template} 
                      onValueChange={handleTemplateChange}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Template</SelectItem>
                        <SelectItem value="minimal">Minimal Documentation</SelectItem>
                        <SelectItem value="detailed">Detailed Specification</SelectItem>
                        <SelectItem value="agile">Agile Project Template</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-sm text-gray-500">
                      Select a template for your documentation. You can customize prompts later.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleGoBack}
                      className="mr-3"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary-600 hover:bg-primary-700"
                    >
                      {isSubmitting ? "Processing..." : "Start Generation"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
