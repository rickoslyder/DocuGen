import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document, DocumentType, InsertDocument, Project, Version } from "@shared/schema";
import { createDocument, createVersion, getDocument, getDocumentByType, getDocuments, getVersions, updateDocument } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { generateProjectDocument, agentModeGenerateDocument } from "@/lib/ai";

export function useDocument(projectId: number, documentType: DocumentType) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [lastSavedContent, setLastSavedContent] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<string | null>(null);
  
  // Get all documents for this project (for context when generating new documents)
  const { 
    data: allDocuments,
  } = useQuery({
    queryKey: [`/api/projects/${projectId}/documents`],
    enabled: !isNaN(projectId),
  });
  
  // Get this specific document from the project
  const {
    data: document,
    isLoading,
    error,
    refetch: refetchDocument,
  } = useQuery({
    queryKey: [`/api/projects/${projectId}/document/${documentType}`],
    queryFn: async () => {
      const docs = await getDocuments(projectId);
      const doc = docs.find(doc => doc.type === documentType);
      return doc || null; // Return null instead of undefined
    },
    enabled: !isNaN(projectId),
  });
  
  // Get version history for this document
  const {
    data: versions,
    isLoading: isLoadingVersions,
    refetch: refetchVersions,
  } = useQuery({
    queryKey: [`/api/documents/${document?.id}/versions`],
    queryFn: () => getVersions(document!.id),
    enabled: !!document?.id,
  });
  
  // When the document changes, update our local state
  useEffect(() => {
    if (document?.content) {
      setLastSavedContent(document.content);
      setPendingChanges(null);
    }
  }, [document]);
  
  // Save document mutation
  const saveDocumentMutation = useMutation({
    mutationFn: async (content?: string) => {
      // If we have a document, update it
      if (document) {
        // If we have content changes and they're different from the last saved content
        if (content && content !== lastSavedContent) {
          // First create a version of the current content
          await createVersion({
            documentId: document.id,
            content: document.content,
            source: "manual",
          });
          
          // Then update the document
          return await updateDocument(document.id, {
            content: content,
            updatedAt: new Date(),
          });
        }
        // If we have no changes, just return the current document
        return document;
      } 
      // If we don't have a document, it's a new one, so create it
      else if (content) {
        return await createDocument({
          projectId,
          type: documentType,
          content,
          status: "draft",
        });
      }
      return null;
    },
    onSuccess: (savedDocument) => {
      if (savedDocument) {
        // Update the document in the cache
        queryClient.setQueryData([`/api/projects/${projectId}/document/${documentType}`], savedDocument);
        
        // Refresh the versions list
        if (document?.id) {
          refetchVersions();
        }
        
        // Update our local state
        setLastSavedContent(savedDocument.content);
        setPendingChanges(null);
        
        toast({
          title: "Document saved",
          description: "Your changes have been saved successfully.",
        });
      }
    },
    onError: (error) => {
      console.error("Error saving document:", error);
      toast({
        title: "Save failed",
        description: "There was an error saving your document.",
        variant: "destructive",
      });
    },
  });
  
  // Regenerate document mutation
  const regenerateDocumentMutation = useMutation({
    mutationFn: async (context: { project: Project, documents: Document[] }) => {
      try {
        // Use agent mode for more intelligent document generation with refinement
        return await agentModeGenerateDocument(context.project, documentType, context.documents);
      } catch (error) {
        console.error("Error in agent mode generation:", error);
        // Fall back to basic generation if agent mode fails
        return await generateProjectDocument(context.project, documentType, context.documents);
      }
    },
    onSuccess: (regeneratedDocument) => {
      // Update the document in the cache
      queryClient.setQueryData([`/api/projects/${projectId}/document/${documentType}`], regeneratedDocument);
      
      // Refresh the versions list
      if (regeneratedDocument?.id) {
        refetchVersions();
      }
      
      // Update our local state
      setLastSavedContent(regeneratedDocument.content);
      setPendingChanges(null);
      
      toast({
        title: "Document regenerated",
        description: "Your document has been regenerated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error regenerating document:", error);
      toast({
        title: "Regeneration failed",
        description: "There was an error regenerating your document.",
        variant: "destructive",
      });
    },
  });
  
  // Debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a debounced version of the save function to avoid frequent saves
  const debouncedSave = useCallback((content: string) => {
    // Update the pendingChanges state immediately for UI feedback
    setPendingChanges(content);
    
    // Clear any existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Set a new timer
    saveTimerRef.current = setTimeout(() => {
      // Only save if the content is different from the last saved content
      if (content !== lastSavedContent) {
        saveDocumentMutation.mutate(content);
      }
    }, 2000); // 2-second debounce
  }, [lastSavedContent, saveDocumentMutation]);
  
  // Save document function - debounced for typing, immediate for explicit saves
  const saveDocument = useCallback((newContent?: string, immediate = false) => {
    // If we have pendingChanges (from typing) or provided newContent
    const contentToSave = newContent || pendingChanges || lastSavedContent;
    
    if (contentToSave) {
      if (immediate) {
        // For explicit saves (like clicking Save button), save immediately
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        saveDocumentMutation.mutate(contentToSave);
      } else {
        // For auto-saves from typing, use the debounced version
        debouncedSave(contentToSave);
      }
    }
  }, [pendingChanges, lastSavedContent, debouncedSave, saveDocumentMutation]);
  
  // Regenerate document function
  const regenerateDocument = async (project: Project, documents: Document[]) => {
    regenerateDocumentMutation.mutate({ project, documents });
  };
  
  return {
    document,
    versions,
    isLoading: isLoading || isLoadingVersions,
    error,
    saveDocument,
    regenerateDocument,
    isSaving: saveDocumentMutation.isPending || regenerateDocumentMutation.isPending,
    updateContent: (content: string) => setPendingChanges(content),
  };
}
