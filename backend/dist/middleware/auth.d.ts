import { Request, Response, NextFunction } from 'express';
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
export declare const verifyToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const generateToken: (userId: string) => string;
export default verifyToken;
//# sourceMappingURL=auth.d.ts.map