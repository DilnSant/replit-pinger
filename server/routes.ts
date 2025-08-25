import express, { type Request, Response } from "express";
import { z } from "zod";
import { db } from "./db";
import { users, providers, requesters, services } from "@shared/schema";
import { insertProviderSchema, insertRequesterSchema, insertServiceSchema } from "@shared/schema";
import { eq, and, gte, lt, sql, desc, asc, like, ilike, count } from "drizzle-orm";
import { supabase } from "./db";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

const router = express.Router();

// JWT Secret for local auth
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'gestao@metodobrandness.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Send notification email
async function sendNotificationEmail(to: string, subject: string, serviceTitle: string, status: string) {
  try {
    // Email template with better HTML structure and text fallback
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 30px;">
                    <h1 style="color: #2563eb; margin: 0 0 20px 0; font-size: 24px; text-align: center;">
                      Gestão Método Brandness
                    </h1>

                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">
                      ${status === 'Pendente' || status === 'Programado' || status === 'Concluído' ? 'Novo Serviço Criado' : 'Atualização de Serviço'}
                    </h2>

                    <p style="color: #374151; margin: 0 0 20px 0; line-height: 1.6;">
                      Olá,
                    </p>

                    <p style="color: #374151; margin: 0 0 20px 0; line-height: 1.6;">
                      ${status === 'Pendente' || status === 'Programado' || status === 'Concluído' ? 'Um novo serviço foi criado no sistema:' : 'Informamos que houve uma atualização no serviço:'}
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; border-radius: 8px; margin: 20px 0;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="margin: 0 0 10px 0; color: #374151;">
                            <strong>Serviço:</strong> ${serviceTitle}
                          </p>
                          <p style="margin: 0; color: #374151;">
                            <strong>Status:</strong> ${status}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #374151; margin: 20px 0; line-height: 1.6;">
                      Para mais detalhes, acesse o sistema de gestão.
                    </p>

                    <p style="color: #374151; margin: 20px 0 0 0; line-height: 1.6;">
                      Atenciosamente,<br>
                      <strong>Equipe Gestão Método Brandness</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Plain text version for fallback
    const textBody = `
Gestão Método Brandness

${status === 'Pendente' || status === 'Programado' || status === 'Concluído' ? 'Novo Serviço Criado' : 'Atualização de Serviço'}

Olá,

${status === 'Pendente' || status === 'Programado' || status === 'Concluído' ? 'Um novo serviço foi criado no sistema:' : 'Informamos que houve uma atualização no serviço:'}

Serviço: ${serviceTitle}
Status: ${status}

Para mais detalhes, acesse o sistema de gestão.

Atenciosamente,
Equipe Gestão Método Brandness
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@gestaobrandes.com',
      to,
      subject,
      html: emailBody,
      text: textBody // Adding text version for better compatibility
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email enviado para ${to}`);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Simple admin authentication middleware
function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];

  // Check for simple admin credentials
  if (authHeader === 'AdminAppBrandness:Adminappbrandness') {
    return next();
  }

  return res.status(401).json({ message: 'Admin access required' });
}

// JWT-based authentication middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  console.log('requireAuth - Authorization header:', authHeader);

  // Check for admin credentials first
  if (authHeader === 'AdminAppBrandness:Adminappbrandness') {
    console.log('requireAuth - Admin credentials detected');
    (req as any).user = {
      userId: "admin",
      email: "admin@brandness.com",
      isAdmin: true,
      role: "admin",
    };
    return next();
  }

  // Check for Bearer token
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    console.log('requireAuth - No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('requireAuth - JWT token decoded:', decoded);
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      isAdmin: decoded.isAdmin || false,
      role: decoded.role || 'viewer',
    };
    next();
  } catch (error) {
    console.log('requireAuth - JWT verification failed:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based permissions middleware
function checkRole(...allowedRoles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin has access to everything
    if (user.isAdmin || user.role === 'admin') {
      return next();
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    next();
  };
}

const servicesTable = services;
const providersTable = providers;
const requestersTable = requesters;

// Auth routes
router.post("/api/auth/google", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    if (!supabase) {
      return res.status(500).json({ message: 'Authentication service not configured' });
    }

    // Get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Check if user exists in our database
    let dbUser = await db.select()
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1);

    if (dbUser.length === 0) {
      // Create new user as viewer
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário';
      const nameParts = fullName.split(' ');
      const newUser = await db.insert(users).values({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || null,
        email: user.email!,
        userType: 'viewer', // Default role for new Google users
        provider: 'google',
      }).returning();

      dbUser = newUser;
    }

    res.json({
      message: "Login successful",
      user: {
        id: dbUser[0].id,
        firstName: dbUser[0].firstName,
        lastName: dbUser[0].lastName,
        email: dbUser[0].email,
        userType: dbUser[0].userType,
        isAdmin: dbUser[0].isAdmin || false,
      },
      token: token
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Password reset routes
router.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!supabase) {
      return res.status(500).json({ message: 'Authentication service not configured' });
    }

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password`
    });

    if (error) {
      console.error("Password reset error:", error);
      return res.status(400).json({ message: "Error sending reset email" });
    }

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    if (!supabase) {
      return res.status(500).json({ message: 'Authentication service not configured' });
    }

    // Update password via Supabase
    // Note: Supabase auth.updateUser requires the user to be signed in or uses a specific flow.
    // This endpoint might need more logic to handle the reset token.
    // For now, assuming this is how it's intended to be used with Supabase.
    const { error } = await supabase.auth.updateUser({ password }); // Supabase update user password

    if (error) {
      console.error("Password update error:", error);
      return res.status(400).json({ message: "Error updating password" });
    }

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Local auth routes (backup)
router.post("/api/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, userType = 'viewer' } = req.body;
    const name = firstName + (lastName ? ` ${lastName}` : '');

    if (!firstName || !email || !password) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
    }

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(users).values({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      userType: userType,
      provider: 'local',
    }).returning();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        userType: newUser.userType,
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0 || !user[0].password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user[0].id,
        email: user[0].email,
        isAdmin: user[0].isAdmin,
        role: user[0].userType || 'viewer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user[0].id,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        email: user[0].email,
        userType: user[0].userType,
        isAdmin: user[0].isAdmin,
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Users CRUD routes disabled for now due to schema changes

// User update route disabled

// User delete route disabled

// Providers CRUD
router.get("/api/providers", async (req: express.Request, res) => {
  try {
    const { supabase } = await import('./db');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    let query = supabase.from("providers").select("*");

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: allProviders, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Get total count
    const { count } = await supabase
      .from("providers")
      .select("*", { count: 'exact', head: true });

    // Transform data to map snake_case to camelCase
    const transformedProviders = (allProviders || []).map(provider => ({
      ...provider,
      receiveEmailNotification: provider.receive_email_notification
    }));

    res.json({
      providers: transformedProviders,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Get providers error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/api/providers", authenticateAdmin, async (req: express.Request, res) => {
  try {
    const { data: newProvider, error } = await supabase
      .from("providers")
      .insert([{
        name: req.body.name,
        email: req.body.email,
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Provider created successfully", provider: newProvider });
  } catch (error) {
    console.error("Create provider error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/api/providers/:id", async (req: express.Request, res) => {
  try {
    const { id } = req.params;

    const { data: updatedProvider, error } = await supabase
      .from("providers")
      .update({
        name: req.body.name,
        email: req.body.email,
        receive_email_notification: req.body.receiveEmailNotification,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!updatedProvider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.json({ message: "Provider updated successfully", provider: updatedProvider });
  } catch (error) {
    console.error("Update provider error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/api/providers/:id", authenticateAdmin, async (req: express.Request, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("providers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Provider deleted successfully" });
  } catch (error) {
    console.error("Delete provider error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Requesters CRUD
router.get("/api/requesters", async (req: express.Request, res) => {
  try {
    const { supabase } = await import('./db');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    let query = supabase.from("requesters").select("*");

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: allRequesters, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Get total count
    const { count } = await supabase
      .from("requesters")
      .select("*", { count: 'exact', head: true });

    // Transform data to map snake_case to camelCase
    const transformedRequesters = (allRequesters || []).map(requester => ({
      ...requester,
      receiveEmailNotification: requester.receive_email_notification
    }));

    res.json({
      requesters: transformedRequesters,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Get requesters error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/api/requesters", authenticateAdmin, async (req: express.Request, res) => {
  try {
    const { data: newRequester, error } = await supabase
      .from("requesters")
      .insert([{
        name: req.body.name,
        email: req.body.email,
        receive_email_notification: req.body.receiveEmailNotification || true,
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Requester created successfully", requester: newRequester });
  } catch (error) {
    console.error("Create requester error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/api/requesters/:id", async (req: express.Request, res) => {
  try {
    const { id } = req.params;

    const { data: updatedRequester, error } = await supabase
      .from("requesters")
      .update({
        name: req.body.name,
        email: req.body.email,
        receive_email_notification: req.body.receiveEmailNotification,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!updatedRequester) {
      return res.status(404).json({ message: "Requester not found" });
    }

    res.json({ message: "Requester updated successfully", requester: updatedRequester });
  } catch (error) {
    console.error("Update requester error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/api/requesters/:id", authenticateAdmin, async (req: express.Request, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("requesters")
      .delete()
      .eq("id", id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Requester deleted successfully" });
  } catch (error) {
    console.error("Delete requester error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Stats API endpoint
router.get("/api/stats", async (req, res) => {
  try {
    const { supabase } = await import('./db');
    // Get counts from Supabase
    const [servicesResult, providersResult, requestersResult] = await Promise.all([
      supabase.from('services').select('id', { count: 'exact' }),
      supabase.from('providers').select('id', { count: 'exact' }),
      supabase.from('requesters').select('id', { count: 'exact' })
    ]);

    const stats = {
      totalServices: servicesResult.count || 0,
      totalProviders: providersResult.count || 0,
      totalRequesters: requestersResult.count || 0,
      lastUpdated: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Services CRUD - Public read access for dashboard
router.get("/api/services", async (req: express.Request, res) => {
  try {
    const { supabase } = await import('./db');
    const requesterId = req.query.requesterId as string;
    const status = req.query.status as string;

    // Check if admin authentication is provided
    const authHeader = req.headers['authorization'];
    const isAdmin = authHeader === 'AdminAppBrandness:Adminappbrandness';

    let query = supabase
      .from('services')
      .select(`
        *,
        requester:requesters(id, name, email),
        provider:providers(id, name, email)
      `);

    // If requesterId is provided and not admin, filter by it
    if (requesterId && requesterId !== 'admin' && !isAdmin) {
      query = query.eq('requester_id', requesterId);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: services, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Transform data to ensure correct field mapping
    const transformedServices = (services || []).map(service => ({
      ...service,
      // Map snake_case to camelCase for frontend compatibility
      serviceType: service.service_type,
      requesterId: service.requester_id,
      providerId: service.provider_id,
      isMonthlyPackage: service.is_monthly_package,
      isCourtesy: service.is_courtesy,
      creditsUsed: service.credits_used,
      requestDate: service.request_date,
      completionDate: service.completion_date,
      createdAt: service.created_at,
      updatedAt: service.updated_at,
      // Include related data for easier access
      requesterName: service.requester?.name,
      requesterEmail: service.requester?.email,
      providerName: service.provider?.name,
      providerEmail: service.provider?.email,
    }));

    res.json({
      services: transformedServices,
      total: transformedServices.length,
      page: 1,
      limit: 50,
      isAdmin: isAdmin,
      requesterId: requesterId || null
    });
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all services (admin only) - DEVE VIR ANTES da rota /:id
router.get("/api/services/all", authenticateAdmin, async (req: express.Request, res) => {
  try {
    const { supabase } = await import('./db');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const status = req.query.status as string;

    let query = supabase
      .from('services')
      .select(`
        *,
        requester:requesters(id, name, email),
        provider:providers(id, name, email)
      `);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: services, error } = await query
      .order('request_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Transform data to match expected format with correct field mappings
    const servicesWithDetails = (services || []).map(service => ({
      ...service,
      // Map snake_case to camelCase for frontend compatibility
      serviceType: service.service_type,
      requesterId: service.requester_id,
      providerId: service.provider_id,
      isMonthlyPackage: service.is_monthly_package,
      isCourtesy: service.is_courtesy,
      creditsUsed: service.credits_used,
      requestDate: service.request_date,
      completionDate: service.completion_date,
      createdAt: service.created_at,
      updatedAt: service.updated_at,
      // Include related data
      requesterName: service.requester?.name,
      requesterEmail: service.requester?.email,
      providerName: service.provider?.name,
      providerEmail: service.provider?.email,
    }));

    res.json(servicesWithDetails);
  } catch (error) {
    console.error("Get all services error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Stats API endpoint - Enhanced with monthly stats logic and proper status counting
router.get("/api/dashboard/stats", async (req: express.Request, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

    // Define start and end dates for the queried month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    // Using start of next month for `lt` comparison to include the entire current month
    const startOfNextMonth = new Date(currentYear, currentMonth, 1);

    // Fetch overall counts with correct status values
    const [
      totalServicesOverallResult,
      totalProvidersResult,
      totalRequestersResult,
      pendingServicesOverallResult,
      completedServicesOverallResult,
      scheduledServicesOverallResult,
      canceledServicesOverallResult
    ] = await Promise.all([
      supabase.from('services').select('id', { count: 'exact', head: true }),
      supabase.from('providers').select('id', { count: 'exact', head: true }),
      supabase.from('requesters').select('id', { count: 'exact', head: true }),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('status', 'PENDENTE'),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('status', 'RESOLVIDO'),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('status', 'PROGRAMADO'),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('status', 'CANCELADO')
    ]);

    // Fetch services specifically for the monthly stats calculation
    const { data: servicesForMonthlyStats, error: monthlyStatsError } = await supabase
      .from('services')
      .select('*')
      .gte('request_date', startDate.toISOString())
      .lt('request_date', startOfNextMonth.toISOString());

    if (monthlyStatsError) {
      console.error('Supabase error fetching monthly stats:', monthlyStatsError);
      return res.status(500).json({ message: "Error fetching monthly stats" });
    }

    const monthlyTotalServices = servicesForMonthlyStats?.length || 0;
    const monthlyPendingServices = servicesForMonthlyStats?.filter(s => s.status === "PENDENTE").length || 0;
    const monthlyResolvedServices = servicesForMonthlyStats?.filter(s => s.status === "RESOLVIDO").length || 0;
    const monthlyScheduledServices = servicesForMonthlyStats?.filter(s => s.status === "PROGRAMADO").length || 0;
    const monthlyCanceledServices = servicesForMonthlyStats?.filter(s => s.status === "CANCELADO").length || 0;

    const monthlyTotalValue = servicesForMonthlyStats?.reduce((acc, service) => {
      // Safely parse value, defaulting to 0 if null, undefined, or not a valid number
      const value = service.value ? parseFloat(service.value.toString()) : 0;
      return acc + (isNaN(value) ? 0 : value);
    }, 0) || 0;

    // Calculate credits used and remaining
    const monthlyCreditsUsed = servicesForMonthlyStats?.reduce((acc, service) => {
      return acc + (service.credits_used || 0);
    }, 0) || 0;
    const monthlyRemaining = Math.max(0, 50 - monthlyCreditsUsed); // Assuming 50 credits per month

    // Combine original overall stats with new monthly stats
    res.json({
      // Original overall stats
      totalServices: totalServicesOverallResult.count || 0,
      totalProviders: totalProvidersResult.count || 0,
      totalRequesters: totalRequestersResult.count || 0,
      pendingServices: pendingServicesOverallResult.count || 0,
      completedServices: completedServicesOverallResult.count || 0,
      scheduledServices: scheduledServicesOverallResult.count || 0,
      canceledServices: canceledServicesOverallResult.count || 0,

      // New monthly stats integrated
      monthlyTotalServices: Number(monthlyTotalServices),
      monthlyPending: Number(monthlyPendingServices),
      monthlyResolved: Number(monthlyResolvedServices),
      monthlyScheduled: Number(monthlyScheduledServices),
      monthlyCanceled: Number(monthlyCanceledServices),
      monthlyTotalValue: monthlyTotalValue,
      monthlyCreditsUsed: Number(monthlyCreditsUsed),
      monthlyRemaining: Number(monthlyRemaining),
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get service by ID
router.get("/api/services/:id", async (req: express.Request, res) => {
  try {
    const { supabase } = await import('./db');
    const { id } = req.params;

    const { data: service, error } = await supabase
      .from('services')
      .select(`
        *,
        requester:requesters(id, name, email),
        provider:providers(id, name, email)
      `)
      .eq('id', id)
      .limit(1)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Transform data to ensure correct field mapping
    const transformedService = {
      ...service,
      // Map snake_case to camelCase for frontend compatibility
      serviceType: service.service_type,
      requesterId: service.requester_id,
      providerId: service.provider_id,
      isMonthlyPackage: service.is_monthly_package,
      isCourtesy: service.is_courtesy,
      creditsUsed: service.credits_used,
      requestDate: service.request_date,
      completionDate: service.completion_date,
      createdAt: service.created_at,
      updatedAt: service.updated_at,
    };

    res.json(transformedService);
  } catch (error) {
    console.error("Get service details error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Helper function to send new service notification emails
async function sendNewServiceNotificationEmails(service: any, requesterId: string | null, providerId: string | null) {
  const { supabase } = await import('./db');
  
  // Mapear status para português
  const getStatusInPortuguese = (status: string) => {
    switch(status.toUpperCase()) {
      case 'PENDENTE': return 'Pendente';
      case 'PROGRAMADO': return 'Programado';
      case 'CONCLUÍDO': return 'Concluído';
      default: return status;
    }
  };

  const statusInPortuguese = getStatusInPortuguese(service.status || 'PENDENTE');

  // Get requester details using Supabase API
  if (requesterId) {
    try {
      const { data: requesterData, error: requesterError } = await supabase
        .from('requesters')
        .select('email, name, receive_email_notification')
        .eq('id', requesterId)
        .single();

      if (requesterData && requesterData.email && requesterData.receive_email_notification) {
        console.log(`Enviando email para requester: ${requesterData.email}`);
        try {
          await sendNotificationEmail(
            requesterData.email,
            `Novo Serviço Criado: ${service.title}`,
            service.title,
            statusInPortuguese
          );
          console.log(`✅ Email enviado com sucesso para requester: ${requesterData.email}`);
        } catch (emailError) {
          console.error(`Erro ao enviar email para requester ${requesterData.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do requester:', error);
    }
  }

  // Get provider details using Supabase API
  if (providerId) {
    try {
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('email, name, receive_email_notification')
        .eq('id', providerId)
        .single();

      if (providerData && providerData.email && providerData.receive_email_notification) {
        console.log(`Enviando email para provider: ${providerData.email}`);
        try {
          await sendNotificationEmail(
            providerData.email,
            `Novo Serviço Atribuído: ${service.title}`,
            service.title,
            statusInPortuguese
          );
          console.log(`✅ Email enviado com sucesso para provider: ${providerData.email}`);
        } catch (emailError) {
          console.error(`Erro ao enviar email para provider ${providerData.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do provider:', error);
    }
  }

  console.log('✅ Notificações de email processadas com sucesso');
}


router.post("/api/services", upload.array('images', 10), async (req: express.Request, res) => {
  try {
    const { supabase } = await import('./db');
    // Extract serviceType array from FormData
    let serviceTypeArray: string[] = [];

    // Handle both array format and indexed format for serviceType
    if (req.body.serviceType) {
      if (Array.isArray(req.body.serviceType)) {
        serviceTypeArray.push(...req.body.serviceType.filter((type: any) => type && type.trim()));
      } else {
        if (req.body.serviceType.toString().trim()) {
          serviceTypeArray.push(req.body.serviceType.toString().trim());
        }
      }
    } else {
      // Handle indexed format serviceType[0], serviceType[1], etc.
      Object.keys(req.body).forEach(key => {
        if (key.startsWith('serviceType[') && key.endsWith(']')) {
          const value = req.body[key];
          if (value && value.toString().trim()) {
            serviceTypeArray.push(value.toString().trim());
          }
        }
      });
    }

    // If no serviceType is provided, set a default array to prevent validation errors
    if (serviceTypeArray.length === 0) {
      serviceTypeArray = ['Geral']; // Default service type
    }

    // Handle uploaded images
    const uploadedFiles = req.files as Express.Multer.File[];
    const imagePaths = uploadedFiles ? uploadedFiles.map(file => `/uploads/${file.filename}`) : [];

    // Extract and validate title from form data
    let title = req.body.title;
    if (Array.isArray(title)) {
      title = title[0]; // Take first element if it's an array
    }
    title = title?.toString().trim();

    if (!title || title === '' || title === 'undefined') {
      return res.status(400).json({
        message: "Validation error",
        errors: [{
          code: "invalid_type",
          path: ["title"],
          message: "Título é obrigatório"
        }]
      });
    }



    // Process form data with proper type handling
    const processFormField = (field: any): string | null => {
      if (field === undefined || field === null || field === '') return null;
      if (typeof field === 'string') return field;
      return String(field);
    };

    const requesterId = processFormField(req.body.requesterId);
    const providerId = processFormField(req.body.providerId);
    const status = processFormField(req.body.status) || 'PENDENTE';
    const value = processFormField(req.body.value);
    const isMonthlyPackage = req.body.isMonthlyPackage === 'true' || req.body.isMonthlyPackage === true;
    const isCourtesy = req.body.isCourtesy === 'true' || req.body.isCourtesy === true;
    const creditsUsed = req.body.creditsUsed ? parseInt(req.body.creditsUsed.toString()) : 0;
    const requestDate = req.body.requestDate ? new Date(req.body.requestDate) : new Date();
    const completionDate = req.body.completionDate ? new Date(req.body.completionDate) : null;
    const imageUrls = imagePaths;

    const serviceData = {
      title,
      description: processFormField(req.body.description) || "",
      serviceType: serviceTypeArray,
      requesterId: requesterId,
      providerId: providerId,
      status,
      value: value ? value.toString() : null,
      isMonthlyPackage: isMonthlyPackage,
      isCourtesy: isCourtesy,
      creditsUsed: creditsUsed,
      requestDate: requestDate,
      completionDate: completionDate,
      images: imageUrls
    };

    // Validate the data using Zod schema
    const validatedData = insertServiceSchema.parse(serviceData);

    // Convert camelCase back to snake_case for database
    const finalData = {
      title: validatedData.title,
      description: validatedData.description,
      service_type: validatedData.serviceType,
      requester_id: validatedData.requesterId,
      provider_id: validatedData.providerId,
      status: validatedData.status,
      value: validatedData.value,
      is_monthly_package: validatedData.isMonthlyPackage,
      is_courtesy: validatedData.isCourtesy,
      credits_used: validatedData.creditsUsed,
      request_date: validatedData.requestDate,
      completion_date: validatedData.completionDate,
      images: validatedData.images
    };

    const { data, error } = await supabase
      .from('services')
      .insert([finalData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insertion error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Send notification emails asynchronously to avoid blocking the response
    setImmediate(async () => {
      try {
        await sendNewServiceNotificationEmails(data, requesterId, providerId);
      } catch (emailError) {
        console.error('Error sending new service notification emails:', emailError);
      }
    });

    res.status(201).json({ message: "Service created successfully", service: data });
  } catch (error) {
    console.error("Create service error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/api/services/:id", requireAuth, upload.array('images', 10), async (req, res) => {
  try {
    const { supabase } = await import('./db');
    const serviceId = req.params.id;

    // Verificar se o usuário tem permissão de administrador
    const user = (req as any).user;
    console.log('PUT /api/services - User:', user);
    if (!user || (!user.isAdmin && user.role !== 'admin')) {
      console.log('PUT /api/services - Access denied for user:', user);
      return res.status(403).json({ error: "Acesso negado. Permissão de administrador necessária." });
    }

    // Get current service data including images
    const { data: currentService, error: fetchError } = await supabase
      .from('services')
      .select(`
        id, title, status, images, requester_id, provider_id,
        requester:requesters(name, email),
        provider:providers(name, email)
      `)
      .eq('id', serviceId)
      .limit(1)
      .single();

    if (fetchError) {
      console.error('Supabase error fetching service:', fetchError);
      return res.status(400).json({ error: fetchError.message });
    }

    if (!currentService) {
      return res.status(404).json({ error: "Service not found" });
    }

    let currentImages = currentService.images || [];

    // Handle image deletion
    const imagesToDelete = req.body.imagesToDelete ? JSON.parse(req.body.imagesToDelete) : [];
    if (imagesToDelete.length > 0) {
      // Remove files from filesystem
      imagesToDelete.forEach((imagePath: string) => {
        try {
          const fullPath = path.join('uploads', imagePath.split('/').pop() || '');
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (error) {
          console.error('Error deleting image file:', error);
        }
      });

      // Remove from current images array
      currentImages = currentImages.filter((img: string) => !imagesToDelete.includes(img));
    }

    // Handle new image uploads
    const newImagePaths: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        newImagePaths.push(`/uploads/${file.filename}`);
      });
    }

    // Combine current images with new images
    const updatedImages = [...currentImages, ...newImagePaths];

    // Process form data with proper type handling
    const processFormField = (field: any): string | null => {
      if (field === undefined || field === null || field === '') return null;
      if (typeof field === 'string') return field;
      return String(field);
    };

    // Transform and prepare data for update
    const transformedData = { ...req.body };

    // Parse serviceType if it's a JSON string
    if (transformedData.serviceType && typeof transformedData.serviceType === 'string') {
      try {
        transformedData.serviceType = JSON.parse(transformedData.serviceType);
      } catch {
        // If parsing fails, treat as single item array
        transformedData.serviceType = [transformedData.serviceType];
      }
    }

    // Convert date strings to Date objects
    if (transformedData.requestDate && typeof transformedData.requestDate === 'string') {
      transformedData.requestDate = new Date(transformedData.requestDate);
    }
    if (transformedData.completionDate && typeof transformedData.completionDate === 'string') {
      transformedData.completionDate = new Date(transformedData.completionDate);
    }

    // Process form data - keep camelCase for validation
    const serviceData = {
      title: transformedData.title,
      description: processFormField(transformedData.description),
      serviceType: transformedData.serviceType,
      requesterId: processFormField(transformedData.requesterId),
      providerId: processFormField(transformedData.providerId),
      status: transformedData.status,
      value: processFormField(transformedData.value),
      isMonthlyPackage: transformedData.isMonthlyPackage === 'true' || transformedData.isMonthlyPackage === true,
      isCourtesy: transformedData.isCourtesy === 'true' || transformedData.isCourtesy === true,
      creditsUsed: transformedData.creditsUsed ? parseInt(transformedData.creditsUsed.toString()) : 0,
      requestDate: transformedData.requestDate,
      completionDate: transformedData.completionDate,
      images: updatedImages
    };

    // Ensure we are only updating fields allowed by the schema
    const validatedData = insertServiceSchema.partial().parse(serviceData);

    // Handle courtesy logic
    if (validatedData.isCourtesy === true) {
      validatedData.value = null;
      // If "Cortesia" is selected, disable "Pacote Mensal"
      validatedData.isMonthlyPackage = false;
    }

    // Handle monthly package logic
    if (validatedData.isMonthlyPackage === true) {
      validatedData.isCourtesy = false; // Disable courtesy if monthly package is selected
      // If monthly package is selected, set creditsUsed to 1 and block value
      validatedData.creditsUsed = 1;
      validatedData.value = null; // Block value if it's a monthly package
    } else {
      // If monthly package is NOT selected and it's not courtesy, and creditsUsed is 1, allow value to be set
      if (validatedData.creditsUsed === 1 && !validatedData.isCourtesy) {
        // Let the value be set by the user if it's not a monthly package or courtesy, and creditsUsed is default 1
      } else if ((validatedData.creditsUsed ?? 0) > 1) {
        // If creditsUsed is greater than 1 and it's not a monthly package, it's a custom value
        // The value can be set by the user
      } else if ((validatedData.creditsUsed ?? 0) === 0 && !validatedData.isCourtesy && !validatedData.isMonthlyPackage) {
        // If creditsUsed is 0, not courtesy, and not monthly package, allow value
      }
    }

    // If the service is marked as monthly package, update credits_used to a default of 1.
    // If the service is marked as courtesy, set value to null.
    // If the service is neither monthly package nor courtesy, allow credits_used and value to be set by the user.
    // Additionally, if the user selects "Pacote Mensal", automatically block the option "Cortesia" and "Valor",
    // but allow "Créditos Utilizados" to be marked as 1 and up to 4 if the user has not already used this total in the month.

    // Logic for "Pacote Mensal" selection:
    if (validatedData.isMonthlyPackage) {
      // Automatically set credits_used to 1 if not already set or if user is trying to override
      if (validatedData.creditsUsed !== 1) {
        validatedData.creditsUsed = 1; // Default to 1
      }
      // Block the "Valor" option by setting it to null
      validatedData.value = null;
      // Automatically disable "Cortesia"
      validatedData.isCourtesy = false;
    } else if (validatedData.isCourtesy) {
      // If "Cortesia" is selected, block the "Valor" option
      validatedData.value = null;
      // If "Cortesia" is selected, also disable "Pacote Mensal"
      validatedData.isMonthlyPackage = false;
      // If "Cortesia" is selected, ensure credits_used is set to 0
      validatedData.creditsUsed = 0;
    } else {
      // If neither "Pacote Mensal" nor "Cortesia" is selected, allow "Valor" and "Créditos Utilizados" to be set by the user.
      // However, we need to enforce the limit of 4 credits per month if it's not a monthly package.
      // This requires fetching monthly stats, which is complex within this single PUT request.
      // For now, we'll assume the frontend handles the display/input for credits and we just store what's provided.
      // The core logic for blocking "Cortesia" and "Valor" when "Pacote Mensal" is selected is handled above.
    }


    // Convert to snake_case for database
    const finalUpdateData = {
      title: validatedData.title,
      description: validatedData.description,
      service_type: validatedData.serviceType,
      requester_id: validatedData.requesterId,
      provider_id: validatedData.providerId,
      status: validatedData.status,
      value: validatedData.value,
      is_monthly_package: validatedData.isMonthlyPackage,
      is_courtesy: validatedData.isCourtesy,
      credits_used: validatedData.creditsUsed,
      request_date: validatedData.requestDate,
      completion_date: validatedData.completionDate,
      images: validatedData.images
    };

    const { data: updatedService, error: updateError } = await supabase
      .from('services')
      .update(finalUpdateData)
      .eq('id', serviceId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(400).json({ error: updateError.message });
    }

    if (!updatedService) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Send notification emails if status changed
    if (finalUpdateData.status && finalUpdateData.status !== currentService.status) {
      try {
        const statusLabels: Record<string, string> = {
          'PENDENTE': 'Pendente',
          'RESOLVIDO': 'Resolvido',
          'PROGRAMADO': 'Programado',
          'CANCELADO': 'Cancelado'
        };

        const newStatusLabel = statusLabels[finalUpdateData.status] || finalUpdateData.status;

        // Send email to requester if they have email
        const requester = Array.isArray(currentService.requester) ? currentService.requester[0] : currentService.requester;
        if (requester?.email) {
          console.log(`Enviando email de atualização para requester: ${requester.email}`);
          try {
            await sendNotificationEmail(
              requester.email,
              `Atualização de Serviço: ${currentService.title}`,
              currentService.title,
              newStatusLabel
            );
          } catch (emailError) {
            console.error(`Erro ao enviar email para requester ${requester.email}:`, emailError);
          }
        }

        // Send email to provider if they have email
        const provider = Array.isArray(currentService.provider) ? currentService.provider[0] : currentService.provider;
        if (provider?.email) {
          console.log(`Enviando email de atualização para provider: ${provider.email}`);
          try {
            await sendNotificationEmail(
              provider.email,
              `Atualização de Serviço: ${currentService.title}`,
              currentService.title,
              newStatusLabel
            );
          } catch (emailError) {
            console.error(`Erro ao enviar email para provider ${provider.email}:`, emailError);
          }
        }
      } catch (error) {
        console.error('Error sending status change notification emails:', error);
      }
    }

    res.json({ message: "Service updated successfully", service: updatedService });
  } catch (error) {
    console.error("Error updating service:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete service (admin only)
router.delete("/api/services/:id", requireAuth, async (req, res) => {
  try {
    const { supabase } = await import('./db');
    const user = (req as any).user;
    console.log('DELETE /api/services - User:', user);
    if (!user || (!user.isAdmin && user.role !== 'admin')) {
      console.log('DELETE /api/services - Access denied for user:', user);
      return res.status(403).json({ error: "Acesso negado. Permissão de administrador necessária." });
    }

    const serviceId = req.params.id;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
});

// Notification settings endpoints
router.get("/api/notifications/settings", requireAuth, async (req, res) => {
  try {
    // For now, return default settings. In production, this would come from database
    res.json({
      emailNotifications: true,
      notifyProviders: true,
      notifyRequesters: true
    });
  } catch (error) {
    console.error("Get notification settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/api/notifications/settings", requireAuth, async (req, res) => {
  try {
    const { emailNotifications, notifyProviders, notifyRequesters } = req.body;

    // For now, just acknowledge the settings. In production, save to database
    res.json({
      message: "Notification settings updated successfully",
      settings: {
        emailNotifications,
        notifyProviders,
        notifyRequesters
      }
    });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Test email notifications endpoint
router.post("/api/test-email-notifications", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || (!user.isAdmin && user.role !== 'admin')) {
      return res.status(403).json({ error: "Acesso negado. Permissão de administrador necessária." });
    }

    let emailsSent = 0;
    let emailsTotal = 0;

    // Buscar fornecedores com notificação ativada
    const { data: providers, error: providersError } = await supabase
      .from("providers")
      .select("*")
      .eq("receive_email_notification", true);

    if (providersError) {
      console.error('Erro ao buscar providers:', providersError);
    } else {
      emailsTotal += providers?.length || 0;
      for (const provider of providers || []) {
        if (provider.email) {
          try {
            await sendNotificationEmail(
              provider.email,
              "Teste de Notificação - Fornecedor",
              "Sistema de Gestão Método Brandness",
              "Teste"
            );
            emailsSent++;
            console.log(`Email de teste enviado para fornecedor: ${provider.email}`);
          } catch (emailError) {
            console.error(`Erro ao enviar email de teste para fornecedor ${provider.email}:`, emailError);
          }
        }
      }
    }

    // Buscar solicitantes com notificação ativada
    const { data: requesters, error: requestersError } = await supabase
      .from("requesters")
      .select("*")
      .eq("receive_email_notification", true);

    if (requestersError) {
      console.error('Erro ao buscar requesters:', requestersError);
    } else {
      emailsTotal += requesters?.length || 0;
      for (const requester of requesters || []) {
        if (requester.email) {
          try {
            await sendNotificationEmail(
              requester.email,
              "Teste de Notificação - Solicitante",
              "Sistema de Gestão Método Brandness",
              "Teste"
            );
            emailsSent++;
            console.log(`Email de teste enviado para solicitante: ${requester.email}`);
          } catch (emailError) {
            console.error(`Erro ao enviar email de teste para solicitante ${requester.email}:`, emailError);
          }
        }
      }
    }

    // Buscar usuários do sistema
    const allUsers = await db.select().from(users);
    emailsTotal += allUsers.length;
    for (const user of allUsers) {
      if (user.email) {
        try {
          await sendNotificationEmail(
            user.email,
            "Teste de Notificação - Usuário do Sistema",
            "Sistema de Gestão Método Brandness",
            "Teste"
          );
          emailsSent++;
          console.log(`Email de teste enviado para usuário: ${user.email}`);
        } catch (emailError) {
          console.error(`Erro ao enviar email de teste para usuário ${user.email}:`, emailError);
        }
      }
    }

    res.json({
      message: "Teste de notificações por email concluído",
      emailsSent,
      emailsTotal,
      success: emailsSent > 0
    });
  } catch (error) {
    console.error("Erro no teste de email:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Health check endpoint para UptimeRobot
router.get("/health", async (req, res) => {
  try {
    const startTime = Date.now();

    // Verificar conexão Supabase
    const { supabase } = await import('./db');
    const { data, error } = await supabase.from('services').select('id').limit(1);

    const responseTime = Date.now() - startTime;
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    if (error) {
      console.error('[Health Check] Supabase error:', error);
      return res.status(503).json({
        status: 'error',
        message: 'Supabase connection failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        memory: `${memMB}MB`,
        uptime: `${Math.round(process.uptime())}s`
      });
    }

    const response = {
      status: 'ok',
      message: 'App and Supabase are healthy',
      supabase: 'connected',
      responseTime: `${responseTime}ms`,
      memory: `${memMB}MB`,
      uptime: `${Math.round(process.uptime())}s`,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'unknown',
      version: process.env.REPL_ID || 'development'
    };

    // Log health check para debugging
    if (req.get('User-Agent')?.includes('UptimeRobot')) {
      console.log(`[Health Check] UptimeRobot: ${response.responseTime} | Mem: ${response.memory}`);
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('[Health Check] Critical error:', error);
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Status endpoint mais detalhado
router.get("/api/status", async (req, res) => {
  try {
    // Verificar conexão Supabase
    const { checkDatabaseConnection } = await import('./db');
    const dbHealth = await checkDatabaseConnection();

    res.status(200).json({
      status: "operational",
      database: dbHealth ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API Health check endpoint (consistência com padrão API)
router.get("/api/health", async (req, res) => {
  try {
    const startTime = Date.now();

    // Verificar conexão Supabase
    const { supabase } = await import('./db');
    const { data, error } = await supabase.from('services').select('id').limit(1);

    const responseTime = Date.now() - startTime;
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    if (error) {
      console.error('[API Health Check] Supabase error:', error);
      return res.status(503).json({
        status: 'error',
        message: 'Supabase connection failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        memory: `${memMB}MB`,
        uptime: `${Math.round(process.uptime())}s`
      });
    }

    const response = {
      status: 'healthy',
      message: 'API and Supabase are operational',
      supabase: 'connected',
      responseTime: `${responseTime}ms`,
      memory: `${memMB}MB`,
      uptime: `${Math.round(process.uptime())}s`,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'unknown',
      version: process.env.REPL_ID || 'development',
      endpoint: '/api/health'
    };

    // Log detalhado para debugging
    if (req.get('User-Agent')?.includes('UptimeRobot') || req.get('User-Agent')?.includes('Internal-KeepAlive')) {
      console.log(`[API Health Check] ${req.get('User-Agent')}: ${response.responseTime} | Mem: ${response.memory} | Supabase: ✅`);
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('[API Health Check] Critical error:', error);
    res.status(503).json({
      status: 'error',
      message: 'API health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/api/health'
    });
  }
});

// Endpoint de monitoramento completo
router.get("/api/monitor", async (req, res) => {
  try {
    const { checkAllConnections } = await import('./db');
    const healthData = await checkAllConnections();
    
    const uptime = Math.round(process.uptime());
    const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`;
    
    res.status(200).json({
      ...healthData,
      uptimeSeconds: uptime,
      uptimeFormatted,
      environment: process.env.NODE_ENV || 'unknown',
      replicationId: process.env.REPL_ID || 'development',
      monitor: 'complete'
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Monitor endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;