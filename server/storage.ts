import { documents, insertDocumentSchema, insertProjectSchema, insertTemplateSchema, insertVersionSchema, projects, templates, versions, users, type Document, type InsertDocument, type InsertProject, type InsertTemplate, type InsertVersion, type Project, type Template, type Version, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, asc } from "drizzle-orm";
import { DOCUMENT_TYPE_ORDER } from "@shared/schema";

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
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // Project operations
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.updatedAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    // Delete associated documents first
    const projectDocuments = await db.select().from(documents).where(eq(documents.projectId, id));
    
    for (const doc of projectDocuments) {
      await this.deleteDocument(doc.id);
    }
    
    await db.delete(projects).where(eq(projects.id, id));
    return true;
  }

  // Document operations
  async getDocuments(projectId: number): Promise<Document[]> {
    // Get all documents for the project
    const result = await db.select().from(documents).where(eq(documents.projectId, projectId));
    
    // Sort by document type order
    return result.sort((a, b) => {
      const aIndex = DOCUMENT_TYPE_ORDER.indexOf(a.type as any);
      const bIndex = DOCUMENT_TYPE_ORDER.indexOf(b.type as any);
      return aIndex - bIndex;
    });
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentByType(projectId: number, type: string): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.projectId, projectId),
        eq(documents.type, type)
      ));
    
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    // Delete associated versions first
    await db.delete(versions).where(eq(versions.documentId, id));
    
    await db.delete(documents).where(eq(documents.id, id));
    return true;
  }

  // Version operations
  async getVersions(documentId: number): Promise<Version[]> {
    return db
      .select()
      .from(versions)
      .where(eq(versions.documentId, documentId))
      .orderBy(desc(versions.createdAt));
  }

  async createVersion(version: InsertVersion): Promise<Version> {
    const [newVersion] = await db.insert(versions).values(version).returning();
    return newVersion;
  }

  // Template operations
  async getTemplates(): Promise<Template[]> {
    return db.select().from(templates);
  }

  async getTemplatesByType(type: string): Promise<Template[]> {
    return db.select().from(templates).where(eq(templates.type, type));
  }

  async getDefaultTemplate(type: string): Promise<Template | undefined> {
    const [template] = await db
      .select()
      .from(templates)
      .where(and(
        eq(templates.type, type),
        eq(templates.isDefault, true)
      ));
    
    return template;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined> {
    const [updatedTemplate] = await db
      .update(templates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    
    return updatedTemplate;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Method to initialize default templates if they don't exist
  async initializeDefaultTemplates() {
    const existingTemplates = await this.getTemplates();
    if (existingTemplates.length === 0) {
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
      
      for (const template of defaultTemplates) {
        await this.createTemplate({
          name: template.name,
          type: template.type,
          prompt: template.prompt,
          isDefault: template.isDefault
        });
      }
    }
  }
}

// Initialize the DatabaseStorage and set up default templates
const dbStorage = new DatabaseStorage();
dbStorage.initializeDefaultTemplates()
  .catch(err => console.error("Failed to initialize default templates:", err));

export const storage = dbStorage;
