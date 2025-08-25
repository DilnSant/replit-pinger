
import { storage } from "./storage";

export class AdminService {
  static async promoteUserToAdmin(userId: string): Promise<void> {
    await storage.updateUserPermissions(userId, true, "admin");
  }

  static async setUserType(userId: string, userType: "fornecedor" | "solicitante" | "visualizador"): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    await storage.updateUserPermissions(userId, user.isAdmin || false, userType);
  }

  static async revokeAdminAccess(userId: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    await storage.updateUserPermissions(userId, false, user.userType || undefined);
  }
}
