import { documents, insertDocumentSchema, insertProjectSchema, insertTemplateSchema, insertVersionSchema, projects, templates, versions, type Document, type InsertDocument, type InsertProject, type InsertTemplate, type InsertVersion, type Project, type Template, type Version } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Document operations
  getDocuments(projectId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentByType(projectId: number, type: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Version operations
  getVersions(documentId: number): Promise<Version[]>;
  createVersion(version: InsertVersion): Promise<Version>;
  
  // Template operations
  getTemplates(): Promise<Template[]>;
  getTemplatesByType(type: string): Promise<Template[]>;
  getDefaultTemplate(type: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined>;
  
  // User operations from default template
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
}

export class MemStorage implements IStorage {
  // Project storage
  private projects: Map<number, Project>;
  private documents: Map<number, Document>;
  private versions: Map<number, Version>;
  private templates: Map<number, Template>;
  private users: Map<number, any>;
  
  private currentProjectId: number;
  private currentDocumentId: number;
  private currentVersionId: number;
  private currentTemplateId: number;
  private currentUserId: number;

  constructor() {
    this.projects = new Map();
    this.documents = new Map();
    this.versions = new Map();
    this.templates = new Map();
    this.users = new Map();
    
    this.currentProjectId = 1;
    this.currentDocumentId = 1;
    this.currentVersionId = 1;
    this.currentTemplateId = 1;
    this.currentUserId = 1;
    
    // Initialize with default templates
    this.initializeDefaultTemplates();
  }
  
  private initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        name: "Default Project Request",
        type: "project-request",
        prompt: `I have a web app idea I'd like to develop. Here's my initial concept:\n\n{{IDEA}}\n\nI'm looking to collaborate with you to turn this into a detailed project request.`,
        isDefault: true
      },
      {
        name: "Default Technical Spec",
        type: "technical-spec",
        prompt: `Create a technical specification for the following project:\n\n{{PROJECT_REQUEST}}\n\nInclude system architecture, data models, API endpoints, and implementation details.`,
        isDefault: true
      },
      {
        name: "Default PRD",
        type: "prd",
        prompt: `Create a product requirements document for the following project:\n\n{{PROJECT_REQUEST}}\n\nInclude product objectives, user stories, feature requirements, and success metrics.`,
        isDefault: true
      },
      {
        name: "Default User Flows",
        type: "user-flows",
        prompt: `Create user flow diagrams and descriptions for the following project:\n\n{{PROJECT_REQUEST}}\n\nInclude text descriptions and mermaid diagrams for each primary user journey.`,
        isDefault: true
      },
      {
        name: "Default UI Guide",
        type: "ui-guide",
        prompt: `Create a UI styling guide for the following project:\n\n{{PROJECT_REQUEST}}\n\nInclude color palettes, typography, component design, and layout principles.`,
        isDefault: true
      },
      {
        name: "Default Implementation Plan",
        type: "implementation-plan",
        prompt: `Create an implementation plan for the following project:\n\n{{PROJECT_REQUEST}}\n\n{{TECHNICAL_SPEC}}\n\nInclude step-by-step development tasks, timeline estimates, and resource requirements.`,
        isDefault: true
      }
    ];
    
    defaultTemplates.forEach(template => {
      this.createTemplate({
        name: template.name,
        type: template.type,
        prompt: template.prompt,
        isDefault: template.isDefault
      });
    });
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort((a, b) => {
      // Sort by updated date descending
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const newProject: Project = {
      ...project,
      id,
      metadata: {},
      createdAt: now,
      updatedAt: now
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;
    
    const updatedProject: Project = {
      ...existingProject,
      ...project,
      updatedAt: new Date()
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    // Delete all documents and versions associated with this project first
    const projectDocuments = Array.from(this.documents.values()).filter(doc => doc.projectId === id);
    for (const doc of projectDocuments) {
      await this.deleteDocument(doc.id);
    }
    
    return this.projects.delete(id);
  }

  // Document operations
  async getDocuments(projectId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.projectId === projectId)
      .sort((a, b) => {
        // Sort by the document type order
        const typeOrder = ["project-request", "technical-spec", "prd", "user-flows", "ui-guide", "implementation-plan"];
        return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
      });
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentByType(projectId: number, type: string): Promise<Document | undefined> {
    return Array.from(this.documents.values()).find(
      doc => doc.projectId === projectId && doc.type === type
    );
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const now = new Date();
    const newDocument: Document = {
      ...document,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined> {
    const existingDocument = this.documents.get(id);
    if (!existingDocument) return undefined;
    
    const updatedDocument: Document = {
      ...existingDocument,
      ...document,
      updatedAt: new Date()
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    // Delete all versions associated with this document first
    const documentVersions = Array.from(this.versions.values()).filter(v => v.documentId === id);
    for (const version of documentVersions) {
      this.versions.delete(version.id);
    }
    
    return this.documents.delete(id);
  }

  // Version operations
  async getVersions(documentId: number): Promise<Version[]> {
    return Array.from(this.versions.values())
      .filter(version => version.documentId === documentId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async createVersion(version: InsertVersion): Promise<Version> {
    const id = this.currentVersionId++;
    const now = new Date();
    const newVersion: Version = {
      ...version,
      id,
      createdAt: now
    };
    this.versions.set(id, newVersion);
    return newVersion;
  }

  // Template operations
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplatesByType(type: string): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(template => template.type === type);
  }

  async getDefaultTemplate(type: string): Promise<Template | undefined> {
    return Array.from(this.templates.values()).find(
      template => template.type === type && template.isDefault
    );
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const id = this.currentTemplateId++;
    const now = new Date();
    const newTemplate: Template = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined> {
    const existingTemplate = this.templates.get(id);
    if (!existingTemplate) return undefined;
    
    const updatedTemplate: Template = {
      ...existingTemplate,
      ...template,
      updatedAt: new Date()
    };
    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  // User operations (from default template)
  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
