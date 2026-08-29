-- RazorStitch recovery schema

create table if not exists recovery_cases (
  id uuid primary key default gen_random_uuid(),
  case_id text unique not null,
  amount_paise int not null,
  currency text default 'INR',
  method text,
  error_source text,
  error_reason text,
  payment_status text,
  hours_since_failure float default 0,
  contacts_used int default 0,
  contacts_max int default 3,
  customer_checkout_state text,
  recovered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists policy_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id text references recovery_cases(case_id),
  policy_version text not null,
  selected_action text not null,
  q_values jsonb,
  expected_value_inr float,
  constraints_passed int,
  constraints_total int,
  created_at timestamptz default now()
);

create table if not exists audit_entries (
  id uuid primary key default gen_random_uuid(),
  case_id text,
  event_type text not null,
  policy_version text,
  payload jsonb,
  hash text not null,
  prev_hash text,
  reward float,
  razorpay_event_id text unique,
  created_at timestamptz default now()
);

create index if not exists idx_audit_case on audit_entries(case_id, created_at);
create index if not exists idx_cases_status on recovery_cases(payment_status);
