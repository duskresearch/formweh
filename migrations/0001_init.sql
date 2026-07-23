-- Formweh schema. Three tables carry the whole product:
--   settings     — key/value config the dashboard writes (password, notify email, keys)
--   forms        — every form, waitlist, or survey (built here or bring-your-own)
--   submissions  — one row per response, with edge metadata and waitlist referral data

-- In-app settings. A row here can override the matching environment variable, so
-- the deploy-button flow (which sets no secrets) and env-var setups both work.
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- A form is anything that collects responses. `kind` tints the UI and defaults;
-- `mode` is whether Formweh renders it (hosted, built here) or you point your own
-- form's action at its endpoint (byo). `fields` is a JSON array of field defs used
-- only for hosted forms.
CREATE TABLE IF NOT EXISTS forms (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                  TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  kind                  TEXT NOT NULL DEFAULT 'form',    -- form | waitlist | survey
  mode                  TEXT NOT NULL DEFAULT 'hosted',  -- hosted | byo
  fields                TEXT NOT NULL DEFAULT '[]',      -- JSON: [{key,label,type,required,options}]
  intro_title           TEXT,
  intro_desc            TEXT,
  success_message       TEXT,
  redirect_url          TEXT,                            -- optional redirect after submit
  spam_protection       INTEGER NOT NULL DEFAULT 1,      -- Turnstile on this form
  notify                INTEGER NOT NULL DEFAULT 1,      -- email me on new submission
  autoresponder         INTEGER NOT NULL DEFAULT 0,      -- reply to the submitter
  autoresponder_subject TEXT,
  autoresponder_body    TEXT,
  referral              INTEGER NOT NULL DEFAULT 0,      -- waitlist referral loop
  closed                INTEGER NOT NULL DEFAULT 0,      -- stop accepting responses
  archived              INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One response. `data` is the submitted field->value map as JSON; `email` is the
-- submitter's email pulled out of it when present (for notifications and waitlists).
-- The ref_* columns power the waitlist "skip the line" referral loop.
CREATE TABLE IF NOT EXISTS submissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id     INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data        TEXT NOT NULL DEFAULT '{}',
  email       TEXT,
  spam        INTEGER NOT NULL DEFAULT 0,
  is_read     INTEGER NOT NULL DEFAULT 0,
  country     TEXT,
  device      TEXT,
  os          TEXT,
  referer     TEXT,
  ref_code    TEXT,                                       -- this signup's own share code
  referred_by TEXT,                                       -- code that referred them
  referrals   INTEGER NOT NULL DEFAULT 0,                 -- how many they've referred
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sub_form    ON submissions(form_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_refcode ON submissions(ref_code);
CREATE INDEX IF NOT EXISTS idx_sub_spam    ON submissions(form_id, spam);
