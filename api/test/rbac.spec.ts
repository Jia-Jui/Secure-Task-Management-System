/// <reference types="jest" />
/**
 * RbacGuard unit tests
 * Focus: authorization rules (not JWT, not DB)
 *
 * What we mock:
 * - Reflector.get(...) to return the permission required by the route handler
 * - TypeORM repositories (Membership, Organization, Task) with .findOne stubs
 * - ExecutionContext: we provide switchToHttp().getRequest(), plus getHandler()/getClass()
 *
 * Policy under test:
 * - Admin: can update/delete any task in-scope
 * - Owner: can update any task; can delete only tasks they created
 * - Viewer: read-only
 * - 2-level org hierarchy (org + immediate parent)
 *
 * Important: We DO NOT pass a JWT token in unit tests. We simulate JwtGuard by
 * placing req.user = { sub: <userId> } on the mock request.
 */

import { RbacGuard } from '../src/auth/rbac.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

// Light repo mocks with only the methods RbacGuard calls
const repo = () => ({
  findOne: jest.fn(),
});

// Minimal Nest ExecutionContext shim for HTTP requests
// NOTE: We MUST provide getHandler() (and getClass()) since RbacGuard calls reflector.get(..., ctx.getHandler()).
const makeCtx = (req: any) =>
  ({
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({} as any),
    getClass: () => ({} as any),
  } as any);

describe('RbacGuard (Owner=update-any, delete-own; Admin=CRUD; Viewer=read-only)', () => {
  const memRepo = repo();
  const orgRepo = repo();
  const taskRepo = repo();

  // We mock Reflector.get to hand back the permission string we want to test.
  const reflector = { get: jest.fn() } as unknown as Reflector;

  // System under test
  const guard = new RbacGuard(
    reflector,
    memRepo as any,
    orgRepo as any,
    taskRepo as any
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------
  // BASIC: no permission metadata => allowed (public)
  // -------------------------------------------------
  it('allows when no @RequirePermission metadata is set (public route)', async () => {
    // Arrange: Reflector returns undefined (no permission required)
    (reflector.get as any).mockReturnValue(undefined);

    // Act
    const can = await guard.canActivate(makeCtx({ user: { sub: 1 } }));

    // Assert
    expect(can).toBe(true);
  });

  // --------------------------------------------
  // ORG SCOPE: must resolve orgId for any checks
  // --------------------------------------------
  it('throws if org scope cannot be resolved', async () => {
    (reflector.get as any).mockReturnValue('tasks:read');

    await expect(guard.canActivate(makeCtx({ user: { sub: 10 } })))
      .rejects.toThrow('Organization scope required');
  });

  it('resolves org scope from query/body when no :id (GET/POST)', async () => {
    (reflector.get as any).mockReturnValue('tasks:read');

    // Org #5 has no parent
    (orgRepo.findOne as any).mockResolvedValue({ id: 5, parent: null });

    // user is a VIEWER in org 5
    (memRepo.findOne as any).mockResolvedValue({ role: 'VIEWER' });

    const ctx = makeCtx({ user: { sub: 42 }, query: { orgId: '5' } });
    const can = await guard.canActivate(ctx);

    expect(can).toBe(true);
  });

  it('resolves org scope from task id for PUT/DELETE /tasks/:id', async () => {
    (reflector.get as any).mockReturnValue('tasks:update');

    // Task 7 belongs to org 1
    (taskRepo.findOne as any).mockResolvedValue({ id: 7, organization: { id: 1 } });

    // Org 1, no parent
    (orgRepo.findOne as any).mockResolvedValue({ id: 1, parent: null });

    // User is ADMIN at org 1 → update allowed
    (memRepo.findOne as any).mockResolvedValue({ role: 'ADMIN' });

    const can = await guard.canActivate(makeCtx({ user: { sub: 10 }, params: { id: '7' } }));

    expect(can).toBe(true);
  });

  // ----------------------------------------
  // HIERARCHY: parent org grants also apply
  // ----------------------------------------
  it('honors 2-level hierarchy (membership on immediate parent authorizes)', async () => {
    (reflector.get as any).mockReturnValue('tasks:read');

    // We pass orgId explicitly; its parent is 50
    (orgRepo.findOne as any).mockResolvedValue({
      id: 100,
      parent: { id: 50 },
    });

    // User is a VIEWER on the parent org
    (memRepo.findOne as any).mockResolvedValue({ role: 'VIEWER' });

    const ctx = makeCtx({ user: { sub: 7 }, query: { orgId: '100' } });
    const can = await guard.canActivate(ctx);

    expect(can).toBe(true);
  });

  // ---------------------------
  // ROLES: VIEWER (read-only)
  // ---------------------------
  it('blocks non-read perms for VIEWER', async () => {
    (reflector.get as any).mockReturnValue('tasks:create');

    (orgRepo.findOne as any).mockResolvedValue({ id: 1, parent: null });

    // Membership: VIEWER (read-only)
    (memRepo.findOne as any).mockResolvedValue({ role: 'VIEWER' });

    await expect(
      guard.canActivate(makeCtx({ user: { sub: 9 }, query: { orgId: '1' } }))
    ).rejects.toThrow(ForbiddenException);
  });

  // ---------------------------
  // ROLES: ADMIN (full CRUD)
  // ---------------------------
  it('ADMIN can update any task', async () => {
    (reflector.get as any).mockReturnValue('tasks:update');

    (taskRepo.findOne as any).mockResolvedValue({ id: 2, organization: { id: 1 } });
    (orgRepo.findOne as any).mockResolvedValue({ id: 1, parent: null });
    (memRepo.findOne as any).mockResolvedValue({ role: 'ADMIN' });

    const can = await guard.canActivate(makeCtx({ user: { sub: 22 }, params: { id: '2' } }));
    expect(can).toBe(true);
  });

  it('ADMIN can delete any task (no ownership requirement)', async () => {
    (reflector.get as any).mockReturnValue('tasks:delete');

    (taskRepo.findOne as any).mockResolvedValue({
      id: 3,
      organization: { id: 1 },
      creator: { id: 999 }, // someone else
    });
    (orgRepo.findOne as any).mockResolvedValue({ id: 1, parent: null });
    (memRepo.findOne as any).mockResolvedValue({ role: 'ADMIN' });

    const can = await guard.canActivate(makeCtx({ user: { sub: 22 }, params: { id: '3' } }));
    expect(can).toBe(true);
  });

  // ---------------------------------------------------------------
  // ROLES: OWNER (update any task; delete only tasks they created)
  // ---------------------------------------------------------------
  it('OWNER can UPDATE a task created by someone else (allowed by policy)', async () => {
    (reflector.get as any).mockReturnValue('tasks:update');

    (taskRepo.findOne as any).mockResolvedValue({
      id: 15,
      organization: { id: 1 },
      // (creator not needed for update path)
    });
    (orgRepo.findOne as any).mockResolvedValue({ id: 1, parent: null });
    (memRepo.findOne as any).mockResolvedValue({ role: 'OWNER' });

    const can = await guard.canActivate(makeCtx({ user: { sub: 100 }, params: { id: '15' } }));
    expect(can).toBe(true);
  });

  it('OWNER can DELETE their own task', async () => {
    (reflector.get as any).mockReturnValue('tasks:delete');

    (taskRepo.findOne as any).mockResolvedValue({
      id: 88,
      organization: { id: 1 },
      creator: { id: 100 }, // same as req.user.sub
    });
    (orgRepo.findOne as any).mockResolvedValue({ id: 1, parent: null });
    (memRepo.findOne as any).mockResolvedValue({ role: 'OWNER' });

    const can = await guard.canActivate(makeCtx({ user: { sub: 100 }, params: { id: '88' } }));
    expect(can).toBe(true);
  });

  it('OWNER cannot DELETE a task created by someone else (should 403)', async () => {
    (reflector.get as any).mockReturnValue('tasks:delete');

    (taskRepo.findOne as any).mockResolvedValue({
      id: 77,
      organization: { id: 1 },
      creator: { id: 999 }, // different owner
    });
    (orgRepo.findOne as any).mockResolvedValue({ id: 1, parent: null });
    (memRepo.findOne as any).mockResolvedValue({ role: 'OWNER' });

    await expect(
      guard.canActivate(makeCtx({ user: { sub: 100 }, params: { id: '77' } }))
    ).rejects.toThrow('Owners can only delete their own tasks');
  });

  // -----------------------------------------
  // SANITY: no membership => forbidden
  // -----------------------------------------
  it('forbids when user has no membership in org or parent', async () => {
    (reflector.get as any).mockReturnValue('tasks:read');

    (orgRepo.findOne as any).mockResolvedValue({ id: 1, parent: null });
    (memRepo.findOne as any).mockResolvedValue(null); // no membership

    await expect(
      guard.canActivate(makeCtx({ user: { sub: 55 }, query: { orgId: '1' } }))
    ).rejects.toThrow('Insufficient permission');
  });
});
