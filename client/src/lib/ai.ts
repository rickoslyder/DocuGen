import { apiRequest } from "./queryClient";
import { Document, DOCUMENT_TYPE_ORDER, DocumentType, InsertDocument, Project } from "@shared/schema";
import { createDocument, createVersion, getDefaultTemplate, getDocument, getDocuments, updateDocument } from "./database";

// Define schemas for structured output
export const documentSchemas: Record<string, any> = {
  // Schema for project request
  "project-request": {
    type: "object",
    properties: {
      projectName: { type: "string", description: "The name of the project" },
      overview: { type: "string", description: "Brief overview of the project" },
      businessGoals: { type: "array", items: { type: "string" }, description: "Business goals the project aims to achieve" },
      targetAudience: { type: "string", description: "Description of the target audience" },
      keyFeatures: { type: "array", items: { type: "string" }, description: "Key features of the project" },
      mainContent: { type: "string", description: "The complete, formatted project request document" },
    },
    required: ["mainContent"]
  },
  // Schema for technical spec
  "technical-spec": {
    type: "object",
    properties: {
      architecture: { type: "string", description: "Description of the system architecture" },
      dataModel: { type: "string", description: "Data model description, including entities and relationships" },
      apiEndpoints: { type: "array", items: { type: "object", properties: {
        path: { type: "string" },
        method: { type: "string" },
        description: { type: "string" }
      }}},
      technologies: { type: "array", items: { type: "string" }, description: "List of technologies used" },
      mainContent: { type: "string", description: "The complete, formatted technical specification document" },
    },
    required: ["mainContent"]
  },
  // Schema for product requirements document
  "prd": {
    type: "object",
    properties: {
      vision: { type: "string", description: "The product vision statement" },
      objectives: { type: "array", items: { type: "string" }, description: "Key product objectives" },
      userStories: { type: "array", items: { type: "object", properties: {
        role: { type: "string" },
        goal: { type: "string" },
        benefit: { type: "string" }
      }}},
      features: { type: "array", items: { type: "object", properties: {
        name: { type: "string" },
        description: { type: "string" },
        priority: { type: "string" }
      }}},
      mainContent: { type: "string", description: "The complete, formatted PRD document" },
    },
    required: ["mainContent"]
  },
  // Schema for user flows
  "user-flows": {
    type: "object",
    properties: {
      flows: { type: "array", items: { type: "object", properties: {
        name: { type: "string" },
        steps: { type: "array", items: { type: "string" } },
        diagram: { type: "string" }
      }}},
      mainContent: { type: "string", description: "The complete, formatted user flows document" },
    },
    required: ["mainContent"]
  },
  // Schema for UI guide
  "ui-guide": {
    type: "object",
    properties: {
      colors: { type: "object", properties: {
        primary: { type: "string" },
        secondary: { type: "string" },
        accent: { type: "string" },
        background: { type: "string" },
        text: { type: "string" }
      }},
      typography: { type: "object", properties: {
        headings: { type: "string" },
        body: { type: "string" },
        sizing: { type: "string" }
      }},
      mainContent: { type: "string", description: "The complete, formatted UI style guide document" },
    },
    required: ["mainContent"]
  },
  // Schema for implementation plan
  "implementation-plan": {
    type: "object",
    properties: {
      phases: { type: "array", items: { type: "object", properties: {
        name: { type: "string" },
        tasks: { type: "array", items: { type: "string" } },
        duration: { type: "string" }
      }}},
      resources: { type: "array", items: { type: "string" } },
      risks: { type: "array", items: { type: "object", properties: {
        description: { type: "string" },
        mitigation: { type: "string" }
      }}},
      mainContent: { type: "string", description: "The complete, formatted implementation plan document" },
    },
    required: ["mainContent"]
  },
  // Default schema for any document type
  "default": {
    type: "object",
    properties: {
      mainContent: { type: "string", description: "The complete, formatted document content" },
      sections: { type: "array", items: { type: "object", properties: {
        title: { type: "string" },
        content: { type: "string" }
      }}},
    },
    required: ["mainContent"]
  }
};

// Generate a document using Gemini API
export async function generateDocumentContent(
  prompt: string,
  model: "gemini-2.5-pro-preview-03-25" | "gemini-pro" | "gemini-2.0-flash" = "gemini-2.5-pro-preview-03-25",
  documentType?: DocumentType
): Promise<string> {
  try {
    // If a document type is provided, use structured output
    if (documentType) {
      const schema = documentSchemas[documentType] || documentSchemas["default"];
      
      const res = await apiRequest("POST", "/api/generate", { 
        prompt, 
        model,
        schema
      });
      
      const data = await res.json();
      
      // If structured data is received, use the mainContent field
      if (data.mainContent) {
        return data.mainContent;
      } else if (data.content) {
        return data.content;
      } else {
        // Fallback for unexpected response format
        console.warn("Unexpected response format from AI generation:", data);
        return JSON.stringify(data);
      }
    } else {
      // Standard unstructured generation
      const res = await apiRequest("POST", "/api/generate", { prompt, model });
      const data = await res.json();
      return data.content;
    }
  } catch (error) {
    console.error("Error generating document content:", error);
    throw new Error("Failed to generate document content");
  }
}

// Evaluate content using model specified in server
export async function evaluateContent(content: string, criteria: string): Promise<{
  score: number;
  feedback: string;
  meets_criteria: boolean;
  improvement_suggestions: string[];
}> {
  try {
    const res = await apiRequest("POST", "/api/evaluate", { content, criteria });
    return await res.json();
  } catch (error) {
    console.error("Error evaluating content:", error);
    throw new Error("Failed to evaluate content");
  }
}

// Replace placeholders in prompt template
export function replacePromptPlaceholders(
  promptTemplate: string,
  replacements: Record<string, string>
): string {
  let result = promptTemplate;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

// Generate document for a project
export async function generateProjectDocument(
  project: Project,
  documentType: DocumentType,
  existingDocuments: Document[] = []
): Promise<Document> {
  // Get the template for this document type
  const template = await getDefaultTemplate(documentType);
  
  // Build replacements for prompt placeholders
  const replacements: Record<string, string> = {
    IDEA: project.description
  };
  
  // Add content from previous documents
  for (const doc of existingDocuments) {
    const typeKey = doc.type.toUpperCase().replace(/-/g, '_');
    replacements[typeKey] = doc.content;
  }
  
  // Replace placeholders in the prompt template
  const prompt = replacePromptPlaceholders(template.prompt, replacements);
  
  // Generate the content with structured output using document type
  const content = await generateDocumentContent(prompt, "gemini-2.5-pro-preview-03-25", documentType);
  
  // Create or update the document
  const existingDoc = existingDocuments.find(doc => doc.type === documentType);
  
  if (existingDoc) {
    // Save the previous version
    await createVersion({
      documentId: existingDoc.id,
      content: existingDoc.content,
      source: "ai-generator"
    });
    
    // Update the document
    return await updateDocument(existingDoc.id, {
      content,
      status: "draft",
      updatedAt: new Date()
    });
  } else {
    // Create a new document
    return await createDocument({
      projectId: project.id,
      type: documentType,
      content,
      status: "draft"
    });
  }
}

// Criteria for evaluating different document types
const EVALUATION_CRITERIA = {
  "project-request": `
    Evaluate this Project Request document on these criteria:
    1. Clarity of project description
    2. Completeness of scope definition
    3. Clear identification of target audience
    4. Well-defined goals and objectives
    5. Appropriate level of detail for initial requirements
  `,
  "technical-spec": `
    Evaluate this Technical Specification document on these criteria:
    1. Clear system architecture description
    2. Comprehensive data model definition
    3. Detailed API endpoints and interfaces
    4. Appropriate error handling considerations
    5. Technical feasibility assessment
    6. Inclusion of relevant code snippets or pseudocode
  `,
  "prd": `
    Evaluate this Product Requirements Document on these criteria:
    1. Clear product vision and objectives
    2. Well-defined user stories or jobs-to-be-done
    3. Comprehensive feature requirements
    4. Detailed functional specifications
    5. Clear success metrics and acceptance criteria
    6. Prioritization of requirements
  `,
  "user-flows": `
    Evaluate this User Flows document on these criteria:
    1. Clear identification of key user journeys
    2. Step-by-step flow descriptions
    3. Inclusion of diagrams (Mermaid or otherwise)
    4. Coverage of edge cases and alternate paths
    5. User-centric perspective
  `,
  "ui-guide": `
    Evaluate this UI Style Guide document on these criteria:
    1. Comprehensive color palette definition
    2. Clear typography guidelines
    3. Component styling patterns and rules
    4. Layout principles and guidelines
    5. Consistency across elements
    6. Accessibility considerations
  `,
  "implementation-plan": `
    Evaluate this Implementation Plan document on these criteria:
    1. Clear breakdown of tasks and subtasks
    2. Logical sequencing of development steps
    3. Realistic timeline estimates
    4. Resource allocation and requirements
    5. Risk identification and mitigation strategies
    6. Testing and deployment considerations
  `
};

// Agent mode document generation with refinement
export async function agentModeGenerateDocument(
  project: Project,
  documentType: DocumentType,
  existingDocuments: Document[] = [],
  maxIterations: number = 3
): Promise<Document> {
  // Initial document generation
  let document = await generateProjectDocument(project, documentType, existingDocuments);
  
  // Get criteria for this document type
  const criteria = EVALUATION_CRITERIA[documentType] || "Evaluate for completeness, clarity, and usefulness.";
  
  for (let i = 0; i < maxIterations; i++) {
    try {
      // Evaluate the current document
      const evaluation = await evaluateContent(document.content, criteria);
      
      // If it meets criteria, we're done
      if (evaluation.meets_criteria) {
        break;
      }
      
      // Otherwise, refine the document
      const improvementPrompt = `
        Please improve the following ${DOCUMENT_TYPE_ORDER.indexOf(documentType) + 1}. ${documentType.replace(/-/g, ' ')} based on this feedback:
        
        ${evaluation.feedback}
        
        Suggested improvements:
        ${evaluation.improvement_suggestions.join('\n')}
        
        Current content:
        ${document.content}
        
        Please provide a complete, revised version addressing the feedback.
      `;
      
      // Generate improved content using the original model
      const improvedContent = await generateDocumentContent(improvementPrompt, "gemini-2.5-pro-preview-03-25");
      
      // Save the previous version
      await createVersion({
        documentId: document.id,
        content: document.content,
        source: "agent-refinement"
      });
      
      // Update the document
      document = await updateDocument(document.id, {
        content: improvedContent,
        status: "draft",
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error in agent refinement iteration:", error);
      // If we encounter an error during refinement, we'll exit the loop
      // and return what we have so far
      break;
    }
  }
  
  // Final update to mark as completed by agent
  return await updateDocument(document.id, {
    status: "completed",
    updatedAt: new Date()
  });
}

// Generate all documents in sequence using agent mode
export async function agentModeGenerateAllDocuments(project: Project): Promise<Document[]> {
  const documents: Document[] = [];
  
  for (const documentType of DOCUMENT_TYPE_ORDER) {
    // Get existing documents to use as context
    const existingDocs = await getDocuments(project.id);
    
    // Generate and refine this document
    const document = await agentModeGenerateDocument(project, documentType, existingDocs);
    documents.push(document);
  }
  
  return documents;
}
