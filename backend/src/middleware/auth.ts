import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.userId = (decoded as any).userId;
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || "secret";
  const options: SignOptions = { expiresIn: "7d" };
  return jwt.sign({ userId }, secret, options);
};

export default verifyToken;
