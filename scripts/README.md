One-time scripts to create users + assign roles
A) Register three users
Register-User -Email "owner@acme.io"  -Password "owner"
Register-User -Email "admin@acme.io"  -Password "admin"
Register-User -Email "viewer@acme.io" -Password "viewer"

B) Use your existing OWNER token (frank) to assign roles in org 1
Set-Jwt -Email "frank@gmail.com" -Password "frank"

Add-Member -Email "owner@acme.io"  -OrgId 1 -Role OWNER
Add-Member -Email "admin@acme.io"  -OrgId 1 -Role ADMIN
Add-Member -Email "viewer@acme.io" -OrgId 1 -Role VIEWER

List-Members -OrgId 1  # sanity check

Quick permission checks
Viewer (read-only)
Set-Jwt -Email "viewer@acme.io" -Password "viewer"
List-Tasks  -OrgId 1                    # ✅ should work
Create-Task -OrgId 1 -Title "blocked"   # ❌ should 403
Update-Task -Id 2 -Status done -OrgId 1 # ❌ should 403
Delete-Task -Id 2 -OrgId 1              # ❌ should 403
Audit-Log   -OrgId 1                    # ❌ (if you restrict audit to owner-only later)

Admin (full task CRUD + audit per current map)
Set-Jwt -Email "admin@acme.io" -Password "admin"
Create-Task -OrgId 1 -Title "Admin task"     # ✅
List-Tasks  -OrgId 1                         # ✅
Update-Task -Id 2 -Status in_progress -OrgId 1  # ✅
Delete-Task -Id 2 -OrgId 1                   # ✅
Audit-Log   -OrgId 1                         # ✅ (allowed in current ROLE_PERMS)

Owner (everything)
Set-Jwt -Email "owner@acme.io" -Password "owner"
List-Tasks  -OrgId 1                         # ✅
Create-Task -OrgId 1 -Title "Owner task"     # ✅
Update-Task -Id 2 -Status in_progress -OrgId 1  # ✅
Delete-Task -Id 2 -OrgId 1                   # ✅
List-Tasks  -OrgId 1                         # ✅
Audit-Log   -OrgId 1                         # ✅