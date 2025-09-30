import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      path: req.path,
      method: req.method,
      user: (req as any).user?.sub ?? null
    }));
    next();
  }
}
