USE gsc_database;
-- Requires admin user id=1 to exist. Run create-admin script first.

-- ── Framework Pillars ─────────────────────────────────────────────────────────
INSERT INTO framework_pillars (title, description, tags, insight, display_order, status, created_by) VALUES
(
  'ESG Governance and Accountability',
  'Establish board-level ESG oversight with clear ownership, accountability frameworks, and escalation paths. Define roles across the organisation so sustainability decisions are traceable, auditable, and linked to business strategy.',
  '["GRI 2","CSRD ESRS G1","TCFD Governance"]',
  'Without named ESG accountability at board level, sustainability becomes a reporting exercise rather than a strategic function. Governance must come before measurement.',
  1, 'published', 1
),
(
  'Materiality Assessment',
  'Identify and prioritise ESG issues that matter most to your business and stakeholders. Apply double materiality assessing both financial impacts on the company and the company impacts on people and the environment in line with CSRD and GRI Standards.',
  '["CSRD ESRS","GRI 3","Double Materiality"]',
  'Double materiality is now mandatory under CSRD. Organisations still using single financial materiality will need to redo their assessments before first filing.',
  2, 'published', 1
),
(
  'Carbon and GHG Management',
  'Measure and manage greenhouse gas emissions across Scope 1, 2, and 3 aligned to the GHG Protocol. Set Science Based Targets, track progress against net-zero pathways, and establish carbon reduction roadmaps across the value chain.',
  '["GHG Protocol","SBTi","ISO 14064"]',
  'Scope 3 emissions represent 70 to 90 percent of most organisations footprint. Credible net-zero claims are impossible without a Scope 3 inventory, and regulators are noticing.',
  3, 'published', 1
),
(
  'ESG Disclosure and Reporting',
  'Produce transparent, audit-ready ESG disclosures aligned to mandatory and voluntary frameworks. Map reporting to CSRD/ESRS, GRI Standards, TCFD, ISSB IFRS S1 and S2, and CDP questionnaires with consistent data governance.',
  '["CSRD/ESRS","GRI Standards","ISSB IFRS S1 S2","CDP"]',
  'CSRD covers 50000 EU companies from 2025 to 2028. Non-EU companies in scope via VSME or EU subsidiaries must begin gap analyses now.',
  4, 'published', 1
),
(
  'Supply Chain Sustainability',
  'Extend sustainability standards into the value chain through supplier assessments, engagement programmes, and due diligence. Manage Scope 3 emissions, modern slavery risks, and social impacts across tier-1 and tier-2 suppliers.',
  '["CSDDD","Scope 3 Category 1","GRI 308 414"]',
  'The EU Corporate Sustainability Due Diligence Directive creates legal liability for supply chain sustainability failures. Companies with no supplier programme face regulatory and reputational exposure.',
  5, 'published', 1
),
(
  'Climate Risk and Resilience',
  'Assess physical and transition climate risks using TCFD-aligned scenario analysis. Quantify the financial impact of climate events, stranded assets, carbon pricing, and regulatory change on business operations and strategy.',
  '["TCFD","ISSB IFRS S2","Physical Risk","Transition Risk"]',
  'IFRS S2 requires disclosure of climate scenario analysis. Physical risk modelling is no longer optional for companies with material exposure to climate events.',
  6, 'published', 1
);

-- ── Maturity Levels ───────────────────────────────────────────────────────────
INSERT INTO framework_maturity_levels (level, name, color, light_bg, border_color, description, characteristics, actions, percentage, status, created_by) VALUES
(
  1, 'Foundational', '#64748B', '#F8FAFC', '#E2E8F0',
  'Ad-hoc sustainability management with no formal ESG governance. Risks addressed reactively.',
  '["No dedicated ESG policy owner or committee","GHG emissions unmeasured or estimated informally","No materiality assessment conducted","ESG reporting limited to optional disclosures"]',
  '["Appoint an ESG Lead or Chief Sustainability Officer","Conduct a preliminary materiality assessment","Begin Scope 1 and Scope 2 GHG inventory"]',
  25, 'published', 1
),
(
  2, 'Defined', '#1A4731', '#ECFDF5', '#A7F3D0',
  'Standardised ESG definitions and baseline controls documented. Governance exists but not consistently applied.',
  '["Formal ESG policy and governance structure documented","Scope 1 and 2 emissions tracked annually","Initial materiality assessment completed","Basic GRI or TCFD disclosure published"]',
  '["Extend GHG inventory to material Scope 3 categories","Set interim emissions reduction targets","Implement supplier ESG questionnaire process"]',
  50, 'published', 1
),
(
  3, 'Managed', '#0D9B6E', '#ECFDF5', '#6EE7B7',
  'Quantitative ESG metrics tracked and controls continuously monitored. Sustainability integrated into risk management and business strategy.',
  '["Full Scope 1 2 and 3 GHG inventory with third-party assurance","Science Based Target validated by SBTi","CSRD-aligned disclosure with external review","Supply chain due diligence programme operational"]',
  '["Integrate ESG KPIs into executive remuneration","Conduct annual TCFD scenario analysis","Submit to CDP questionnaire"]',
  75, 'published', 1
),
(
  4, 'Optimized', '#065F46', '#ECFDF5', '#059669',
  'Adaptive sustainability management with real-time feedback loops. ESG embedded across the entire organisation.',
  '["Net-zero pathway with validated interim milestones on track","Real-time ESG dashboard available to board and stakeholders","CSRD/ESRS fully compliant with limited assurance or above","Nature-positive strategy and TNFD disclosure in place"]',
  '["Publish annual Sustainability Impact Report with ISSB alignment","Contribute to industry standards and policy working groups","Evolve strategy to address biodiversity and social equity"]',
  100, 'published', 1
);

-- ── Implementation Phases ─────────────────────────────────────────────────────
INSERT INTO framework_implementation_phases (phase_number, phase_label, title, duration, icon, display_order, status, created_by) VALUES
(1, 'Phase 1', 'ESG Governance Foundation', '0 to 3 months',  '🏛️', 1, 'published', 1),
(2, 'Phase 2', 'Measure and Baseline',      '3 to 6 months',  '📊', 2, 'published', 1),
(3, 'Phase 3', 'Targets and Disclosure',    '6 to 12 months', '🎯', 3, 'published', 1),
(4, 'Phase 4', 'Optimise and Lead',         'Ongoing',        '🌿', 4, 'published', 1);

-- ── Implementation Steps ──────────────────────────────────────────────────────
INSERT INTO framework_implementation_steps (phase_id, step_number, title, description, display_order, status, created_by) VALUES
(1,'1.1','Establish an ESG Committee',          'Form a cross-functional committee including Finance, Legal, Operations, HR, and Procurement. Define ESG charter, cadence, and board reporting lines.',                                                    1, 'published', 1),
(1,'1.2','Appoint an ESG Lead or CSO',          'Designate a senior accountable owner with direct board access and sufficient budget authority.',                                                                                                        2, 'published', 1),
(1,'1.3','Draft the ESG Policy',                'Document the organisation ESG commitments, material issues, governance approach, and stakeholder obligations. Align to UN SDGs.',                                                                     3, 'published', 1),
(1,'1.4','Conduct a Double Materiality Assessment','Identify ESG issues that are financially material to the company AND where the company has significant impact on people and planet. Required for CSRD compliance.',                                   4, 'published', 1),
(2,'2.1','Build the GHG Inventory',             'Measure Scope 1 and Scope 2 emissions using the GHG Protocol. Identify material Scope 3 categories and begin supplier data collection.',                                                               1, 'published', 1),
(2,'2.2','ESG Baseline Assessment',             'Benchmark current performance across E, S, and G dimensions against peers, regulations, and framework expectations.',                                                                                   2, 'published', 1),
(2,'2.3','Map Regulatory Obligations',          'Identify which sustainability regulations apply (CSRD, CSDDD, TCFD-aligned national rules) and map them to current practices and gaps.',                                                               3, 'published', 1),
(2,'2.4','Assess Supply Chain Sustainability',  'Survey tier-1 suppliers using an ESG questionnaire. Identify high-risk suppliers and map Scope 3 Category 1 emissions.',                                                                               4, 'published', 1),
(3,'3.1','Set Science Based Targets',           'Submit near-term and long-term emissions reduction targets to SBTi for validation. Align to 1.5 degree pathway.',                                                                                      1, 'published', 1),
(3,'3.2','Produce First ESG Disclosure',        'Publish a GRI-aligned or CSRD/ESRS-aligned sustainability report with third-party data verification.',                                                                                                 2, 'published', 1),
(3,'3.3','Implement Climate Risk Scenario Analysis','Conduct TCFD-aligned scenario analysis to quantify physical and transition risks. Integrate findings into financial planning.',                                                                     3, 'published', 1),
(4,'4.1','Track Net-Zero Milestones',           'Track and disclose progress against SBTi validated targets. Publish annual decarbonisation progress with verified GHG data.',                                                                          1, 'published', 1),
(4,'4.2','Expand to Nature and Social Strategies','Develop TNFD-aligned nature strategy. Integrate biodiversity into material risk assessment.',                                                                                                        2, 'published', 1),
(4,'4.3','Iterate the Framework',               'Update ESG strategy annually to reflect regulatory developments, stakeholder expectations, and science-based evidence.',                                                                               3, 'published', 1);

-- ── Audit Templates ───────────────────────────────────────────────────────────
INSERT INTO framework_audit_templates (template_id, title, category, format, description, fields, display_order, status, created_by) VALUES
('T-01','ESG Governance and Policy Assessment','ESG Governance','Word / PDF',
 'Structured review of board-level ESG oversight, policy documentation, accountability structures, and stakeholder engagement.',
 '["Board ESG Oversight Structure","ESG Policy Coverage and Gaps","Roles and Accountability","Stakeholder Engagement Approach","ESG in Executive Remuneration","Governance Recommendations"]',
 1, 'published', 1),
('T-02','Double Materiality Assessment Template','Materiality','Excel / Notion',
 'CSRD-compliant double materiality assessment covering financial and impact materiality with stakeholder survey template.',
 '["Universe of ESG Topics","Impact Materiality Scoring","Financial Materiality Scoring","Stakeholder Input Matrix","Final Materiality Matrix","ESRS Topic Mapping"]',
 2, 'published', 1),
('T-03','GHG Emissions Inventory Workbook','Carbon Management','Excel',
 'Full Scope 1, 2, and 3 GHG inventory workbook aligned to GHG Protocol Corporate Standard with emissions factor library.',
 '["Scope 1 Direct Emissions","Scope 2 Market and Location Based","Scope 3 Categories 1 to 15","Emissions Factor Sources","Year-on-Year Comparison","Assurance Readiness Checklist"]',
 3, 'published', 1),
('T-04','CSRD and ESRS Compliance Checklist','Regulatory Compliance','Excel / PDF',
 'Clause-mapped checklist covering all mandatory ESRS disclosure requirements under CSRD with compliance status and evidence tracker.',
 '["ESRS 1 General Requirements","ESRS 2 General Disclosures","ESRS E1 to E5 Environmental","ESRS S1 to S4 Social","ESRS G1 Governance","Compliance Status and Evidence Tracker"]',
 4, 'published', 1),
('T-05','Supplier ESG Due Diligence Questionnaire','Supply Chain','Excel / Online Form',
 '35-question ESG assessment for tier-1 suppliers covering environment, labour, human rights, and ethics. Aligned to CSDDD.',
 '["Supplier ESG Policy","GHG Emissions and Targets","Labour Practices and Human Rights","Environmental Compliance","Business Ethics","Overall Risk Rating"]',
 5, 'published', 1),
('T-06','TCFD Climate Risk Scenario Analysis','Climate Risk','Word / PowerPoint',
 'Board-ready TCFD scenario analysis covering physical and transition risks with financial impact quantification methodology.',
 '["Scenario Selection","Physical Risk by Asset and Region","Transition Risk by Driver","Financial Impact Quantification","Strategic Response Options","Board Disclosure Narrative"]',
 6, 'published', 1);