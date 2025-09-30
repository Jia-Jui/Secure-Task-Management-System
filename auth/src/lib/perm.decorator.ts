import { SetMetadata } from '@nestjs/common';
export const REQ_PERM = 'req_perm';
export const RequirePermission = (perm: string) => SetMetadata(REQ_PERM, perm);
