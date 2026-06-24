-- Seed: system roles (is_system = true → cannot be deleted via API)
INSERT INTO roles (name, description, is_system) VALUES
  ('super-admin', 'Full system access',           true),
  ('admin',       'User and role management',     true),
  ('user',        'Default authenticated user',   true),
  ('viewer',      'Read-only access',             false),
  ('editor',      'Create and update content',    false),
  ('billing',     'Billing and subscription mgmt',false)
ON CONFLICT (name) DO NOTHING;

-- Seed: permissions (resource:action format)
INSERT INTO permissions (action, resource, description) VALUES
  -- Users
  ('users:read',   'users', 'View user list'),
  ('users:create', 'users', 'Create new users'),
  ('users:update', 'users', 'Update user details'),
  ('users:delete', 'users', 'Delete users'),
  -- Roles
  ('roles:read',   'roles', 'View roles and permissions'),
  ('roles:manage', 'roles', 'Create, edit, delete roles'),
  -- Content
  ('content:read',   'content', 'Read content'),
  ('content:create', 'content', 'Create content'),
  ('content:update', 'content', 'Update content'),
  ('content:delete', 'content', 'Delete content'),
  -- Billing
  ('billing:read',   'billing', 'View billing info'),
  ('billing:manage', 'billing', 'Manage subscriptions and payments')
ON CONFLICT (action) DO NOTHING;

-- Assign all permissions to super-admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super-admin'
ON CONFLICT DO NOTHING;

-- Admin: user + role management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
  AND p.action IN ('users:read','users:create','users:update','users:delete','roles:read','roles:manage')
ON CONFLICT DO NOTHING;

-- Viewer: read only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer'
  AND p.action IN ('users:read', 'content:read', 'billing:read')
ON CONFLICT DO NOTHING;

-- Editor: content CRUD
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'editor'
  AND p.action IN ('content:read','content:create','content:update','content:delete')
ON CONFLICT DO NOTHING;

-- Billing role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'billing'
  AND p.action IN ('billing:read', 'billing:manage')
ON CONFLICT DO NOTHING;
