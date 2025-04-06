import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertDocumentSchema, insertProjectSchema, insertTemplateSchema, insertVersionSchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";

let apiKey = process.env.GEMINI_API_KEY || "";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Projects endpoints
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const updateData = req.body;
      const project = await storage.updateProject(id, updateData);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const success = await storage.deleteProject(id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Documents endpoints
  app.get("/api/projects/:projectId/documents", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID format" });
      }
      
      const documents = await storage.getDocuments(projectId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const updateData = req.body;
      const document = await storage.updateDocument(id, updateData);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  // Versions endpoints
  app.get("/api/documents/:documentId/versions", async (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: "Invalid document ID format" });
      }
      
      const versions = await storage.getVersions(documentId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch versions" });
    }
  });

  app.post("/api/versions", async (req, res) => {
    try {
      const versionData = insertVersionSchema.parse(req.body);
      const version = await storage.createVersion(versionData);
      res.status(201).json(version);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create version" });
    }
  });

  // Templates endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const templates = await storage.getTemplatesByType(type);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/default/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const template = await storage.getDefaultTemplate(type);
      if (!template) {
        return res.status(404).json({ error: "Default template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch default template" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const templateData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.patch("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const updateData = req.body;
      const template = await storage.updateTemplate(id, updateData);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  // AI Generation endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      // Validate input
      const { prompt, model } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      // Use Gemini API to generate content
      apiKey = process.env.GEMINI_API_KEY || apiKey;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key not found" });
      }
      
      // Validate that the model is one of the allowed models
      const allowedModels = ["gemini-2.5-pro-preview-03-25", "gemini-pro", "gemini-2.0-flash"];
      const selectedModel = model || "gemini-2.5-pro-preview-03-25";
      
      if (!allowedModels.includes(selectedModel)) {
        return res.status(400).json({ error: "Invalid model specified" });
      }
      
      // Initialize the Gemini API
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({ model: selectedModel });
      
      // Generate content
      const result = await geminiModel.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      res.json({ content: text });
    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  // Agent mode evaluation endpoint
  app.post("/api/evaluate", async (req, res) => {
    try {
      const { content, criteria } = req.body;
      
      if (!content || !criteria) {
        return res.status(400).json({ error: "Content and criteria are required" });
      }
      
      apiKey = process.env.GEMINI_API_KEY || apiKey;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key not found" });
      }
      
      // Initialize the Gemini API with the correct model for evaluation
      const genAI = new GoogleGenerativeAI(apiKey);
      const evaluationModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Create evaluation prompt
      const evaluationPrompt = `
        Evaluate the following content based on these criteria:
        ${criteria}
        
        Content to evaluate:
        ${content}
        
        Provide your evaluation as a JSON object with the following structure:
        {
          "score": [0-10 numerical score],
          "feedback": "Detailed feedback about the content",
          "meets_criteria": true/false,
          "improvement_suggestions": ["Suggestion 1", "Suggestion 2"]
        }
      `;
      
      // Generate evaluation
      const result = await evaluationModel.generateContent(evaluationPrompt);
      const response = result.response;
      const text = response.text();
      
      // Parse the result (expecting JSON)
      try {
        const evaluation = JSON.parse(text);
        res.json(evaluation);
      } catch (parseError) {
        res.json({ 
          score: 5,
          feedback: text,
          meets_criteria: false,
          improvement_suggestions: ["Could not parse structured evaluation. Please check the raw feedback."]
        });
      }
    } catch (error) {
      console.error("Evaluation error:", error);
      res.status(500).json({ error: "Failed to evaluate content" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
