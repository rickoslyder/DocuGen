import { Document, DocumentType, InsertDocument, InsertProject, InsertTemplate, InsertVersion, Project, Template, Version } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Project operations
export async function getProjects(): Promise<Project[]> {
  const res = await apiRequest("GET", "/api/projects");
  return await res.json();
}

export async function getProject(id: number): Promise<Project> {
  const res = await apiRequest("GET", `/api/projects/${id}`);
  return await res.json();
}

export async function createProject(project: InsertProject): Promise<Project> {
  const res = await apiRequest("POST", "/api/projects", project);
  return await res.json();
}

export async function updateProject(id: number, project: Partial<Project>): Promise<Project> {
  const res = await apiRequest("PATCH", `/api/projects/${id}`, project);
  return await res.json();
}

export async function deleteProject(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/projects/${id}`);
}

// Document operations
export async function getDocuments(projectId: number): Promise<Document[]> {
  const res = await apiRequest("GET", `/api/projects/${projectId}/documents`);
  return await res.json();
}

export async function getDocument(id: number): Promise<Document> {
  const res = await apiRequest("GET", `/api/documents/${id}`);
  return await res.json();
}

// Get document by project ID and type
export async function getDocumentByType(projectId: number, type: string): Promise<Document | undefined> {
  const documents = await getDocuments(projectId);
  return documents.find(doc => doc.type === type);
}

export async function createDocument(document: InsertDocument): Promise<Document> {
  const res = await apiRequest("POST", "/api/documents", document);
  return await res.json();
}

export async function updateDocument(id: number, document: Partial<Document>): Promise<Document> {
  const res = await apiRequest("PATCH", `/api/documents/${id}`, document);
  return await res.json();
}

// Version operations
export async function getVersions(documentId: number): Promise<Version[]> {
  const res = await apiRequest("GET", `/api/documents/${documentId}/versions`);
  return await res.json();
}

export async function createVersion(version: InsertVersion): Promise<Version> {
  const res = await apiRequest("POST", "/api/versions", version);
  return await res.json();
}

// Template operations
export async function getTemplates(): Promise<Template[]> {
  const res = await apiRequest("GET", "/api/templates");
  return await res.json();
}

export async function getTemplatesByType(type: string): Promise<Template[]> {
  const res = await apiRequest("GET", `/api/templates/type/${type}`);
  return await res.json();
}

export async function getDefaultTemplate(type: string): Promise<Template> {
  const res = await apiRequest("GET", `/api/templates/default/${type}`);
  return await res.json();
}

export async function createTemplate(template: InsertTemplate): Promise<Template> {
  const res = await apiRequest("POST", "/api/templates", template);
  return await res.json();
}

export async function updateTemplate(id: number, template: Partial<Template>): Promise<Template> {
  const res = await apiRequest("PATCH", `/api/templates/${id}`, template);
  return await res.json();
}

// Order of document types for sequential processing
export const DOCUMENT_TYPE_ORDER: DocumentType[] = [
  "project-request",
  "technical-spec",
  "prd",
  "user-flows",
  "ui-guide",
  "implementation-plan"
];

// Helper to get next document type in sequence
export function getNextDocumentType(currentType: DocumentType): DocumentType | null {
  const currentIndex = DOCUMENT_TYPE_ORDER.indexOf(currentType);
  if (currentIndex === -1 || currentIndex === DOCUMENT_TYPE_ORDER.length - 1) {
    return null;
  }
  return DOCUMENT_TYPE_ORDER[currentIndex + 1];
}

// Helper to get previous document type in sequence
export function getPreviousDocumentType(currentType: DocumentType): DocumentType | null {
  const currentIndex = DOCUMENT_TYPE_ORDER.indexOf(currentType);
  if (currentIndex <= 0) {
    return null;
  }
  return DOCUMENT_TYPE_ORDER[currentIndex - 1];
}

// Document type metadata
export const DOCUMENT_TYPE_INFO = {
  "project-request": {
    name: "Project Request",
    description: "Outlines the initial idea, goals, and scope."
  },
  "technical-spec": {
    name: "Technical Specification",
    description: "Includes detailed code snippets and technical requirements."
  },
  "prd": {
    name: "Product Requirements Document",
    description: "Defines product features, objectives, and constraints."
  },
  "user-flows": {
    name: "User Flows",
    description: "Provides text descriptions and diagrams of user journeys."
  },
  "ui-guide": {
    name: "UI and Styling Guide",
    description: "Details design elements and styling rules."
  },
  "implementation-plan": {
    name: "Implementation Plan",
    description: "Offers a step-by-step roadmap for development."
  }
};
