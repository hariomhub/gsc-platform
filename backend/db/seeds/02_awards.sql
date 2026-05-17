USE gsc_database;

INSERT INTO awards (name, description, is_active) VALUES
  ('Top ESG Leaders Awards 2026', 'Recognising outstanding CSOs and ESG leaders driving measurable impact globally.', TRUE),
  ('Sustainability Excellence Awards 2026', 'Honouring professionals who contributed to net-zero frameworks, ESG governance, and climate action.', TRUE);

INSERT INTO award_categories (award_id, name, timeline) VALUES
  (1, 'Best ESG Leader',                      'quarterly'),
  (1, 'Outstanding Sustainability Innovation', 'half-yearly'),
  (1, 'ESG Governance Champion',              'yearly'),
  (2, 'Climate Action Excellence',            'quarterly'),
  (2, 'Sustainability Framework Pioneer',     'yearly');

INSERT INTO nominees (award_id, category_id, name, designation, company, linkedin_url, achievements, description, is_active) VALUES
(1, 1, 'Priya Mehta',          'Chief Sustainability Officer',  'GreenTech Global',             'https://linkedin.com', 'Led Scope 3 reduction 45%; CSRD compliance 18mo early; 3 published ESG frameworks',     'Priya Mehta pioneered net-zero transition at GreenTech Global, earning recognition from regulators across 12 countries.',             TRUE),
(1, 2, 'Dr. Kwame Asante',     'VP ESG and Climate Strategy',  'AfricaSustain Partners',       'https://linkedin.com', 'Pan-African carbon methodology; ISO 14064 for 50 orgs; Speaker COP29',              'His carbon accounting methodology has been adopted by 150+ organisations across Sub-Saharan Africa.',                                TRUE),
(1, 3, 'Sarah Lin',            'Director of ESG Governance',   'CapitalGreen Investments',     'https://linkedin.com', 'ESG framework for $8B portfolio; TCFD disclosure framework; GRI advisory board',    'Sarah Lin transformed how institutional investors assess sustainability risk. TCFD guidance downloaded 20,000 times.',                TRUE),
(2, 4, 'Marcus Osei',          'Head of Climate Action',       'NetZero Manufacturing',        'https://linkedin.com', 'SBTi pathway cutting emissions 60% by 2030; UN SDG Champion; TEDx speaker',         'His decarbonisation blueprint has been replicated across 30 manufacturing organisations.',                                          TRUE),
(2, 5, 'Dr. Ananya Krishnan',  'Chief Climate Risk Officer',   'GlobalBank Sustainable Finance','https://linkedin.com', 'TCFD climate stress testing; $2B green bond; Co-authored IFRS S2 guidance',        'Integrated physical and transition climate risks into financial risk management across Asia-Pacific.',                               TRUE);