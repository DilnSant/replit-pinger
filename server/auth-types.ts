import { Request } from 'express';

export interface LocalAuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    userType?: 'viewer' | 'requester' | 'admin';
  };
}