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
          prompt: `I have a web app idea I'd like to develop. Here's my initial concept:

{{IDEA}}

I'm looking to collaborate with you to turn this into a detailed project request. Let's iterate together until we have a complete request.

After each of our exchanges, please return the current state of the request in this format:

\`\`\`request
# Project Name
## Project Description
[Description]

## Target Audience
[Target users]

## Desired Features
### [Feature Category]
- [ ] [Requirement]
    - [ ] [Sub-requirement]

## Design Requests
- [ ] [Design requirement]
    - [ ] [Design detail]

## Technical Considerations
- [Technical requirements]

## Other Notes
- [Additional considerations]
\`\`\`

Please:
1. Ask me questions about any areas that need more detail
2. Suggest features or considerations I might have missed
3. Help me organize requirements logically
4. Show me the current state of the spec after each exchange
5. Flag any potential technical challenges or important decisions

The goal is to create a comprehensive project request that can be used as a foundation for technical specifications and implementation planning.`,
          isDefault: true
        },
        {
          name: "Default Technical Spec",
          type: "technical-spec",
          prompt: `You are an expert software architect tasked with creating a detailed technical specification for the following project request:

{{PROJECT_REQUEST}}

Your specification will be used as direct input for planning & code generation, so it must be precise, structured, and comprehensive.

Begin by analyzing the project requirements and planning your approach. Consider:
1. Core system architecture and key workflows
2. Project structure and organization
3. Detailed feature specifications
4. Database schema design
5. Server actions and API endpoints
6. Component architecture and state management
7. Authentication and authorization implementation
8. Error handling and edge cases

Generate the technical specification using the following markdown structure:

\`\`\`markdown
# Technical Specification

## 1. System Overview
- Core purpose and value proposition
- Key workflows
- System architecture diagram (use mermaid)

## 2. Project Structure
- Detailed breakdown of project structure & organization

## 3. Feature Specification
For each feature:
### 3.1 [Feature Name]
- User story and requirements
- Detailed implementation steps
- Error handling and edge cases

## 4. Database Schema
### 4.1 Tables
For each table:
- Complete table schema (field names, types, constraints)
- Relationships and indexes
- ER diagram (use mermaid)

## 5. API & Server Actions
### 5.1 API Endpoints
For each endpoint:
- HTTP method and route
- Request parameters and body schema
- Response format and status codes
- Authentication requirements

### 5.2 Server Actions
- Data processing workflows
- External integrations

## 6. Frontend Architecture
### 6.1 Component Structure
- Layout components
- Page components
- Shared components with props interface

### 6.2 State Management
- State organization
- Data flow between components

## 7. Authentication & Authorization
- Authentication strategy
- User roles and permissions
- Protected resources

## 8. Testing Strategy
- Unit testing approach
- Integration testing plan
- Key test cases

## 9. Deployment & DevOps
- Environment configuration
- Build and deployment workflow
- Monitoring and logging
\`\`\`

Ensure your specification is extremely detailed, providing specific implementation guidance. Include concrete examples for complex features and clearly define interfaces between components.`,
          isDefault: true
        },
        {
          name: "Default PRD",
          type: "prd",
          prompt: `You are a senior product manager tasked with creating a comprehensive Product Requirements Document (PRD) for the following project:

{{PROJECT_REQUEST}}

Your PRD should serve as the definitive reference for what will be built, for whom, and why. It should bridge technical and business requirements while keeping focus on user needs.

Generate a detailed PRD using the following structure:

\`\`\`markdown
# Product Requirements Document

## 1. Product Overview
### 1.1 Problem Statement
- What problem does this product solve?
- Who experiences this problem?
- Why is solving this problem important?

### 1.2 Product Vision
- Brief description of the product
- Key value propositions
- Strategic alignment with business goals

## 2. User Analysis
### 2.1 Target Audience
- Detailed user personas with demographics, goals, and pain points
- Primary and secondary user segments

### 2.2 User Research Insights
- Key findings from user research (if available)
- User behavior patterns and preferences

## 3. Product Goals and Success Metrics
### 3.1 Business Goals
- Primary business objectives
- Revenue or growth targets

### 3.2 User Goals
- What users should be able to accomplish
- How the product improves user experience

### 3.3 Success Metrics
- Key Performance Indicators (KPIs)
- Methods for measuring success

## 4. Product Features and Requirements
### 4.1 Core Features
For each feature:
- Feature description
- User story: "As a [user type], I want to [action] so that [benefit]"
- Acceptance criteria
- Priority level (Must have, Should have, Could have, Won't have)

### 4.2 Feature Dependencies
- Relationships between features
- Critical path for implementation

## 5. User Flows
- Step-by-step user journeys through the product
- Key interaction points and decision trees

## 6. Non-Functional Requirements
### 6.1 Performance Requirements
- Load time expectations
- Concurrent user support

### 6.2 Security Requirements
- Data protection measures
- Authentication and authorization needs

### 6.3 Accessibility Requirements
- Compliance standards (e.g., WCAG)
- Assistive technology support

## 7. Constraints and Assumptions
- Technical constraints
- Business constraints
- Key assumptions made during planning

## 8. Future Considerations
- Potential enhancements for future releases
- Scalability considerations
\`\`\`

Ensure your PRD is clear, specific, and actionable. Focus on the "what" and "why" rather than the "how" of implementation. Use precise language and avoid ambiguity.`,
          isDefault: true
        },
        {
          name: "Default User Flows",
          type: "user-flows",
          prompt: `You are a UX designer tasked with documenting comprehensive user flows for the following project:

{{PROJECT_REQUEST}}

Create detailed user flow documentation that maps out the complete journey users will take through the application. For each significant user journey, include both text descriptions and visual mermaid diagrams.

Use the following structure:

\`\`\`markdown
# User Flow Documentation

## 1. Introduction
- Brief overview of the application
- Purpose of the user flow documentation
- How to read the flow diagrams

## 2. Key User Personas
For each persona:
- Name and role
- Goals and motivations
- Pain points and needs

## 3. Core User Flows

### 3.1 [Flow Name] (e.g., "User Registration Process")
#### Overview
- Description of the flow
- Entry points and exit points
- Success criteria

#### Step-by-Step Flow
1. [Step description]
   - User action
   - System response
   - Decision points and alternatives
2. [Next step...]

#### Flow Diagram
\`\`\`mermaid
flowchart TD
    A[Start] --> B[Step 1]
    B --> C{Decision Point}
    C -->|Option 1| D[Step 2a]
    C -->|Option 2| E[Step 2b]
    D --> F[End Success]
    E --> G[End Alternative]
\`\`\`

#### Edge Cases and Error Handling
- [Edge case description]
- [Error scenario and resolution]

### 3.2 [Next Flow Name]
...

## 4. Cross-Flow Interactions
- How different flows connect
- Transition points between journeys

## 5. UX Considerations
- Feedback mechanisms
- Loading states
- Success and error states
- Accessibility notes
\`\`\`

Focus on creating detailed, comprehensive flows that cover all possible paths users might take, including edge cases and error scenarios. Make your diagrams clear and easy to understand. For complex interactions, break them down into smaller sub-flows.`,
          isDefault: true
        },
        {
          name: "Default UI Guide",
          type: "ui-guide",
          prompt: `You are a UI/UX designer tasked with creating a comprehensive UI styling guide for the following project:

{{PROJECT_REQUEST}}

Create a detailed UI guide that establishes consistent design patterns across the application. This guide will serve as the reference for all visual elements and interactions.

Use the following structure:

\`\`\`markdown
# UI Styling Guide

## 1. Design Principles
- Core design philosophy
- Brand personality
- Key principles that guide design decisions

## 2. Color Palette
### 2.1 Primary Colors
- Primary brand colors with hex codes
- Usage guidelines

### 2.2 Secondary Colors
- Supporting colors with hex codes
- Usage contexts

### 2.3 Functional Colors
- Success, warning, error, info states
- Background and surface colors
- Text colors

### 2.4 Color Accessibility
- Contrast ratios
- Accessibility considerations

## 3. Typography
### 3.1 Font Families
- Primary and secondary fonts
- Fallback strategies

### 3.2 Type Scale
- Heading sizes (h1-h6)
- Body text sizes
- Caption and specialized text sizes

### 3.3 Font Weights
- Weight usage guidelines
- Emphasized text treatment

### 3.4 Line Heights and Spacing
- Line height specifications
- Paragraph spacing

## 4. Layout System
### 4.1 Grid System
- Column structure
- Margins and gutters
- Breakpoints for responsive design

### 4.2 Spacing System
- Spacing scale
- Padding and margin conventions
- Spacing between elements

## 5. Components
### 5.1 Buttons
- Button types (primary, secondary, tertiary)
- States (default, hover, active, disabled)
- Sizing and spacing
- Icon usage

### 5.2 Form Elements
- Input fields
- Checkboxes and radio buttons
- Select menus
- Form layout

### 5.3 Cards
- Card structures
- Content hierarchy
- Card variations

### 5.4 Navigation Elements
- Menus
- Breadcrumbs
- Pagination
- Tabs

### 5.5 Feedback Components
- Modals and dialogs
- Toasts and notifications
- Loading states
- Error states

## 6. Icons and Imagery
### 6.1 Icon System
- Icon style guidelines
- Usage contexts
- Sizing

### 6.2 Imagery Guidelines
- Image style and treatment
- Image aspect ratios
- Alt text standards

## 7. Motion and Animation
- Transition principles
- Animation timing
- Appropriate usage contexts

## 8. Accessibility Standards
- WCAG compliance level
- Keyboard navigation
- Screen reader considerations
- Focus indicators
\`\`\`

Include visual examples wherever possible, especially for components in different states. Provide specific implementation details for developers (such as CSS variables, padding values, etc.). The guide should be both visually appealing and technically precise.`,
          isDefault: true
        },
        {
          name: "Default Implementation Plan",
          type: "implementation-plan",
          prompt: `You are a senior technical project manager tasked with creating a detailed implementation plan for the following project:

{{PROJECT_REQUEST}}

{{TECHNICAL_SPEC}}

Break down the development process into manageable steps that can be executed sequentially. Each step should focus on a specific aspect of the application and should be concrete enough to implement in a single iteration.

Present your plan using the following format:

\`\`\`markdown
# Implementation Plan

## 1. Project Setup and Foundation
- [ ] Step 1.1: [Brief title]
  - **Task**: [Detailed explanation of what needs to be implemented]
  - **Files**: 
    - \`path/to/file1\`: [Description of changes]
    - \`path/to/file2\`: [Description of changes]
  - **Dependencies**: [Any prerequisites]
  - **Completion Criteria**: [How to verify this step is complete]

## 2. Database and Data Model Implementation
- [ ] Step 2.1: [Brief title]
  - **Task**: [Detailed explanation]
  - **Files**: [Files to be modified]
  - **Dependencies**: [Any prerequisites]
  - **Completion Criteria**: [Verification steps]

## 3. Core Backend Functionality
- [ ] Step 3.1: [Brief title]
  - **Task**: [Detailed explanation]
  - **Files**: [Files to be modified]
  - **Dependencies**: [Any prerequisites]
  - **Completion Criteria**: [Verification steps]

## 4. Frontend Foundation and Shared Components
- [ ] Step 4.1: [Brief title]
  - **Task**: [Detailed explanation]
  - **Files**: [Files to be modified]
  - **Dependencies**: [Any prerequisites]
  - **Completion Criteria**: [Verification steps]

## 5. Feature Implementation
- [ ] Step 5.1: [Feature 1 Name]
  - **Task**: [Detailed explanation]
  - **Files**: [Files to be modified]
  - **Dependencies**: [Any prerequisites]
  - **Completion Criteria**: [Verification steps]

## 6. Integration and Authentication
- [ ] Step 6.1: [Brief title]
  - **Task**: [Detailed explanation]
  - **Files**: [Files to be modified]
  - **Dependencies**: [Any prerequisites]
  - **Completion Criteria**: [Verification steps]

## 7. Testing and Quality Assurance
- [ ] Step 7.1: [Brief title]
  - **Task**: [Detailed explanation]
  - **Files**: [Files to be modified]
  - **Dependencies**: [Any prerequisites]
  - **Completion Criteria**: [Verification steps]

## 8. Deployment and DevOps
- [ ] Step 8.1: [Brief title]
  - **Task**: [Detailed explanation]
  - **Files**: [Files to be modified]
  - **Dependencies**: [Any prerequisites]
  - **Completion Criteria**: [Verification steps]

## 9. Final Polishing and Optimization
- [ ] Step 9.1: [Brief title]
  - **Task**: [Detailed explanation]
  - **Files**: [Files to be modified]
  - **Dependencies**: [Any prerequisites]
  - **Completion Criteria**: [Verification steps]
\`\`\`

In your plan:
- Ensure logical ordering with dependencies clearly identified
- Break down complex features into smaller, manageable tasks
- Include specific implementation details and file paths
- Provide verification steps for each task
- Consider error handling and edge cases
- Include testing and quality assurance steps

The implementation plan should be comprehensive enough that developers can follow it step-by-step to build the complete application.`,
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
