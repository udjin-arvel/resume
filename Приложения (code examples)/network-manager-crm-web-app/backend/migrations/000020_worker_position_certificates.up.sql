-- Move job title IDs from specialization to position; add index on position.

UPDATE users
SET position = specialization
WHERE position = ''
  AND specialization IN (
    'site_manager',
    'site_supervisor',
    'team_lead',
    'fibre_engineer',
    'copper_engineer',
    'labourer',
    'containment_technician',
    'containment_labourer'
  );

UPDATE users
SET specialization = ''
WHERE position = specialization
  AND specialization IN (
    'site_manager',
    'site_supervisor',
    'team_lead',
    'fibre_engineer',
    'copper_engineer',
    'labourer',
    'containment_technician',
    'containment_labourer'
  );

CREATE INDEX IF NOT EXISTS idx_users_position ON users (position);
