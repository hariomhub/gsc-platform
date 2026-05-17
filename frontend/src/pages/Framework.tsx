import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, FileText, ClipboardList, ChevronRight, BookOpen, Download, Lock, Shield, Zap, Target, ShieldCheck, ExternalLink, Menu, X, Landmark, Search, BarChart, Lightbulb, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as frameworkAPI from '../api/framework.api';
import HeroBackground from '../components/common/HeroBackground.tsx';

// ─── Static Data ──────────────────────────────────────────────────────────────
const PILLARS = [
    { title: 'ESG Materiality & Risk Identification', description: 'Systematically identify and prioritise ESG issues that matter most — applying double materiality to assess both financial impact on the company and the company\'s impact on people and planet.', tags: ['GRI Standards', 'CSRD ESRS', 'Double Materiality'], insight: 'Double materiality is now mandatory under CSRD. Organisations still using single financial materiality need to redo their assessments before first filing.' },
    { title: 'Governance & Accountability', description: 'Establish clear ownership structures — from Board-level oversight to line-of-business accountability. Define roles, responsibilities, and escalation paths so AI decisions are traceable and auditable.', tags: ['RACI Matrix', 'Board Oversight', 'Escalation'], insight: 'Without named accountability, governance frameworks become documentation exercises. Ownership must be assigned before risk can be managed.' },
    { title: 'Model Risk Management', description: 'Apply systematic validation, testing, and monitoring to all AI models throughout their lifecycle. Implement SR 11-7 aligned model risk practices covering design, validation, deployment, and retirement.', tags: ['SR 11-7', 'Lifecycle Management', 'Validation'], insight: 'Model drift in production is the most common cause of undetected AI failures. Continuous monitoring is non-negotiable for high-risk systems.' },
    { title: 'ESG Disclosure & Reporting', description: 'Produce transparent, audit-ready ESG disclosures aligned to CSRD/ESRS, GRI Standards, TCFD, and ISSB IFRS S1 & S2. Maintain living compliance artefacts with automated control mapping and evidence collection.', tags: ['CSRD/ESRS', 'GRI Standards', 'ISSB'], insight: 'CSRD covers 50,000+ EU companies from 2025-2028. Non-EU companies in scope via VSME or EU subsidiaries must begin gap analyses now.' },
    { title: 'Ethical AI & Fairness', description: "Embed bias detection, explainability, and fairness controls into the AI development lifecycle. Ensure your systems do not cause disparate harm and are aligned to your organisation's responsible AI principles.", tags: ['Bias Detection', 'Explainability', 'XAI'], insight: 'Fairness is not binary. Define protected attributes and acceptable disparity thresholds before deployment — not after an incident.' },
    { title: 'Incident Response & Resilience', description: 'Develop and test AI-specific incident response playbooks. Establish detection, containment, communication, and learning processes for AI failures, adversarial attacks, and bias events.', tags: ['Playbooks', 'Adversarial Defence', 'Recovery'], insight: 'Average time-to-detect for AI bias incidents exceeds 80 days without dedicated monitoring infrastructure. Playbooks must be tested, not just written.' },
];

const MATURITY_LEVELS = [
    { level: 1, name: 'Foundational', color: '#64748B', lightBg: '#F8FAFC', borderColor: '#E2E8F0', description: 'Ad-hoc risk management with no formal ESG governance structure. Risks are addressed reactively and inconsistently.', characteristics: ['No dedicated ESG policy, owner, or committee', 'GHG emissions unmeasured or estimated informally', 'No materiality assessment conducted', 'ESG reporting limited to optional disclosures'], actions: ['Appoint an ESG Lead or Chief Sustainability Officer', 'Conduct a preliminary materiality assessment', 'Begin Scope 1 and Scope 2 GHG inventory'], pct: 25 },
    { level: 2, name: 'Defined', color: '#1A4731', lightBg: '#F0FDF4', borderColor: '#A7F3D0', description: 'Standardised definitions and baseline controls are documented. Governance exists but is not consistently applied.', characteristics: ['Formal ESG policy and governance structure documented', 'Scope 1 and 2 emissions tracked annually', 'Initial materiality assessment completed', 'Basic GRI or TCFD disclosure published'], actions: ['Extend GHG inventory to material Scope 3 categories', 'Set interim emissions reduction targets', 'Implement supplier ESG questionnaire process'], pct: 50 },
    { level: 3, name: 'Managed', color: '#7C3AED', lightBg: '#FAF5FF', borderColor: '#E9D5FF', description: 'Quantitative ESG metrics tracked and controls continuously monitored. Sustainability integrated into risk management and business strategy.', characteristics: ['Full Scope 1, 2, and 3 GHG inventory with third-party assurance', 'Science Based Target validated by SBTi', 'CSRD-aligned disclosure with external review', 'Supply chain due diligence programme operational'], actions: ['Integrate ESG KPIs into executive remuneration', 'Conduct annual TCFD scenario analysis', 'Submit to CDP questionnaire'], pct: 75 },
    { level: 4, name: 'Optimized', color: '#065F46', lightBg: '#ECFDF5', borderColor: '#A7F3D0', description: 'Adaptive governance with real-time feedback loops. sustainability management is embedded across the entire organisation.', characteristics: ['Real-time ESG dashboard available to board', 'Fully automated model validation pipeline', 'ESG governance integrated with enterprise ESG reporting', 'Continuous regulatory horizon scanning in place'], actions: ['Publish annual AI Transparency Report', 'Contribute to industry standards and working groups', 'Evolve governance to address agentic and generative AI'], pct: 100 },
];

const IMPLEMENTATION_GUIDE = [
    { phase: 'Phase 1', title: 'Governance Foundation', duration: '0–3 months', icon: '🏛️', steps: [{ step: '1.1', title: 'Establish an ESG Committee', desc: 'Form a cross-functional committee including Finance, Legal, Operations, HR, and Procurement. Define ESG charter, meeting cadence, and board reporting lines.' }, { step: '1.2', title: 'Appoint an ESG Lead or CSO', desc: 'Designate a senior accountable owner (Chief Sustainability Officer or equivalent) with direct board access and sufficient budget authority.' }, { step: '1.3', title: 'Draft the ESG Policy', desc: 'Document the organisation\'s ESG commitments, material issues, governance approach, and stakeholder obligations. Align to UN SDGs.' }, { step: '1.4', title: 'Conduct a Double Materiality Assessment', desc: 'Identify ESG issues that are financially material to the company AND where the company has significant impact on people and planet. Required for CSRD compliance.' }] },
    { phase: 'Phase 2', title: 'Measure & Baseline', duration: '3–6 months', icon: '🔍', steps: [{ step: '2.1', title: 'Build the GHG Inventory', desc: 'Measure Scope 1 and Scope 2 emissions using the GHG Protocol. Identify material Scope 3 categories and begin data collection from suppliers.' }, { step: '2.2', title: 'ESG Baseline Assessment', desc: 'Benchmark current performance across E, S, and G dimensions against peers, regulations, and framework expectations.' }, { step: '2.3', title: 'Assess Supply Chain Sustainability', desc: 'Identify which sustainability regulations apply (CSRD, CSDDD, TCFD-aligned national rules) and map to current practices and gaps.' }, { step: '2.4', title: 'Assess Supply Chain Sustainability', desc: 'Survey tier-1 suppliers using an ESG questionnaire. Identify high-risk suppliers and map Scope 3 Category 1 emissions.' }] },
    { phase: 'Phase 3', title: 'Controls & Monitoring', duration: '6–12 months', icon: '🛡️', steps: [{ step: '3.1', title: 'Implement Technical Controls', desc: 'Deploy model explainability tools, drift detection, differential privacy where required, and adversarial robustness testing.' }, { step: '3.2', title: 'Establish Continuous Monitoring', desc: 'Define KRIs, KPIs, and alert thresholds for all high-risk AI systems. Integrate with existing SIEM and risk dashboards.' }, { step: '3.3', title: 'Build an AI Incident Response Plan', desc: 'Define roles, escalation paths, communication protocols, and remediation playbooks for AI-specific incidents including bias events and model failures.' }] },
    { phase: 'Phase 4', title: 'Audit & Optimisation', duration: 'Ongoing', icon: '📊', steps: [{ step: '4.1', title: 'Conduct Annual AI Governance Audit', desc: 'Assess adherence to the framework, control effectiveness, and regulatory changes. Produce a formal audit report for the Board.' }, { step: '4.2', title: 'Publish an AI Transparency Report', desc: 'Disclose material AI use cases, governance posture, and risk mitigations to stakeholders. Align to emerging disclosure standards.' }, { step: '4.3', title: 'Iterate the Framework', desc: 'Update the framework annually to reflect new AI capabilities (agents, multimodal models), regulatory developments, and lessons learned.' }] },
];

const AUDIT_TEMPLATES = [
    { id: 'T-01', title: 'AI System Intake & Classification Form', category: 'Governance', format: 'Excel / PDF', description: 'Used at the point of procuring or deploying any new AI system. Captures system purpose, owner, data inputs, intended user base, and initial risk classification.', fields: ['System Name & Owner', 'Business Use Case', 'Data Sources & Sensitivity', 'Regulatory Applicability', 'Initial Risk Tier (High / Medium / Low)', 'Approval Signatures'] },
    { id: 'T-02', title: 'Double Materiality Assessment Template', category: 'Risk Assessment', format: 'Word / Notion', description: 'CSRD-compliant double materiality assessment covering financial and impact materiality with stakeholder survey template.', fields: ['Model Purpose & Scope', 'Training Data Lineage', 'Validation Methodology & Results', 'Known Limitations & Risks', 'Monitoring Controls', 'Residual Risk Rating & Sign-off'] },
    { id: 'T-03', title: 'AI Vendor Due Diligence Questionnaire', category: 'Third-Party Risk', format: 'Excel', description: 'A 40-question structured questionnaire for assessing external AI vendors and SaaS providers embedding AI. Covers transparency, data handling, bias controls, security, and contractual protections.', fields: ['Company & Product Overview', 'Data Privacy & Processing', 'Model Transparency & Explainability', 'Bias & Fairness Controls', 'Security Certifications (SOC 2, ISO 27001)', 'Contractual AI Obligations'] },
    { id: 'T-04', title: 'CSRD and ESRS Compliance Checklist', category: 'Regulatory', format: 'PDF / Excel', description: 'Clause-mapped checklist covering all mandatory ESRS disclosure requirements under CSRD with compliance status and evidence tracker.', fields: ['System Classification', 'Mandatory Documentation Requirements', 'Conformity Assessment Status', 'GPAI Obligations (if applicable)', 'Post-Market Monitoring Plan', 'Regulatory Submission Tracker'] },
    { id: 'T-05', title: 'AI Incident Report Template', category: 'Incident Response', format: 'Word / Jira', description: 'Standardised incident report for logging and investigating AI-related failures including bias events, adversarial attacks, data breaches, and model malfunctions.', fields: ['Incident Summary & Timeline', 'Systems & Data Affected', 'Root Cause Analysis', 'Regulatory Notification Required?', 'Remediation Actions & Owner', 'Lessons Learned & Framework Updates'] },
    { id: 'T-06', title: 'Annual ESG Disclosure Report', category: 'Audit', format: 'Word / PowerPoint', description: 'A board-ready annual ESG report template assessing sustainability programme health, CSRD compliance, and net-zero progress.', fields: ['Scope & Methodology', 'AI System Portfolio Review', 'Control Effectiveness Ratings', 'Regulatory Compliance Status', 'Key Findings & Risk Ratings', 'Management Action Plan'] },
];

const CATEGORY_COLORS = {
    Governance: { 'color': '#1A4731', 'bg': '#F0FDF4' },
    'Risk Assessment': { 'color': '#7C3AED', 'bg': '#FAF5FF' },
    'Third-Party Risk': { 'color': '#D97706', 'bg': '#FFFBEB' },
    Regulatory: { 'color': '#059669', 'bg': '#ECFDF5' },
    'Incident Response': { 'color': '#DC2626', 'bg': '#FEF2F2' },
    Audit: { 'color': '#0284C7', 'bg': '#F0FDF4' },
};

const SECURITY_TOOLS = [
    { name: 'Watershed', company: 'Watershed Technology', category: 'Carbon Accounting', color: '#1A4731', description: 'Enterprise carbon accounting platform for measuring, reducing, and reporting Scope 1, 2, and 3 emissions. Used by Fortune 500 companies for CSRD-ready GHG disclosures.', capabilities: ['Automated Scope 1, 2 & 3 data collection', 'GHG Protocol and PCAF alignment', 'CSRD/ESRS reporting templates', 'Supply chain emissions tracking', 'Net-zero pathway modelling'], frameworkAlignment: 'Directly supports CSRD/ESRS E1 (Climate), GHG Protocol Corporate Standard, and SBTi target validation.' },
  { name: 'Workiva', company: 'Workiva Inc.', category: 'ESG Reporting Software', color: '#0D9B6E', description: 'Cloud-based ESG reporting and disclosure management platform used by 6,000+ organisations globally. Enables CSRD/ESRS-aligned reporting with built-in audit trails and assurance readiness.', capabilities: ['CSRD/ESRS disclosure workflows', 'TCFD and GRI Standards mapping', 'Integrated financial and sustainability reporting', 'Third-party assurance workflows', 'Real-time collaboration and version control'], frameworkAlignment: 'Leading platform for CSRD/ESRS compliance, TCFD implementation, and integrated annual report production.' },
  { name: 'Salesforce Net Zero Cloud', company: 'Salesforce', category: 'Sustainability Analytics', color: '#1A4731', description: 'Comprehensive sustainability management platform connecting carbon data, supplier engagement, and ESG reporting in a single system. Enables organisations to track progress against science-based targets.', capabilities: ['Scope 1, 2 & 3 emissions tracking', 'Supplier sustainability engagement', 'SBTi progress monitoring', 'ESG data visualisation', 'CDP and GRI reporting templates'], frameworkAlignment: 'Supports SBTi Corporate Net-Zero Standard, CDP disclosure, and CSRD ESRS E1 climate reporting requirements.' },
  { name: 'MSCI ESG Manager', company: 'MSCI', category: 'ESG Data & Reporting', color: '#7C3AED', description: "Institutional-grade ESG data, ratings, and analytics platform used by the world's largest asset managers and corporations. Provides TCFD-aligned climate risk quantification and portfolio ESG analysis.", capabilities: ['ESG ratings and research', 'TCFD climate risk metrics', 'Physical and transition risk modelling', 'Regulatory reporting support', 'Controversy and controversy alerts'], frameworkAlignment: 'Industry standard for TCFD-aligned climate scenario analysis, ISSB IFRS S2 disclosure, and institutional ESG risk assessment.' },
  { name: 'EcoVadis', company: 'EcoVadis', category: 'Supply Chain Sustainability', color: '#D97706', description: "The world's most trusted business sustainability ratings platform, assessing 130,000+ companies across 175+ countries on environment, labour, ethics, and sustainable procurement.", capabilities: ['Supplier ESG scorecards', 'CSDDD due diligence support', 'Corrective action plans', 'Sector and country benchmarking', 'UN SDG alignment reporting'], frameworkAlignment: 'Directly supports CSDDD supply chain due diligence, CSRD ESRS S2 (Workers in the Value Chain), and GRI 308/414 supplier assessments.' },
  { name: 'Cervest EarthScan', company: 'Cervest', category: 'Climate Risk Assessment', color: '#0369A1', description: 'AI-powered climate intelligence platform providing asset-level physical climate risk assessment for real estate, infrastructure, and supply chain portfolios. Supports TCFD and ISSB S2 disclosure.', capabilities: ['Physical climate risk scoring by asset', 'TCFD scenario analysis (1.5°C, 2°C, 4°C)', 'Transition risk assessment', 'Portfolio-level aggregation', 'Regulatory disclosure report generation'], frameworkAlignment: 'Purpose-built for TCFD Pillar 3 (Risk Management) and ISSB IFRS S2 physical risk disclosure requirements.' },

];

// ─── Section components ───────────────────────────────────────────────────────
const CorePillarsSection = ({ pillars = PILLARS }) => {
    const [expanded, setExpanded] = useState(null);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: 'clamp(1.2rem,2.5vw,1.6rem)', fontWeight: '800', color: '#1E293B', marginBottom: '6px' }}>Core Pillars of Oversight</h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.65', maxWidth: '600px' }}>The six foundational pillars every enterprise sustainability programme must address.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {pillars.map((pillar, idx) => {
                    const isOpen = expanded === idx;
                    const isHovered = hoveredIdx === idx;
                    return (
                        <div key={idx} onClick={() => setExpanded(isOpen ? null : idx)} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}
                            style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', padding: '1.4rem 1rem', borderBottom: '1px solid #E2E8F0', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s', background: isOpen || isHovered ? '#F0FDF4' : 'transparent', borderLeft: isOpen ? '3px solid #1A4731' : (isHovered ? '3px solid #A7F3D0' : '3px solid transparent'), marginLeft: '-3px' }}>
                            <div style={{ fontSize: '2.2rem', fontWeight: '900', color: isOpen || isHovered ? '#1A4731' : '#E2E8F0', lineHeight: 1, minWidth: '48px', transition: 'color 0.2s', fontFamily: 'var(--font-serif,Georgia,serif)' }}>{String(idx + 1).padStart(2, '0')}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', gap: '8px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1E293B', margin: 0 }}>{pillar.title}</h3>
                                    <ChevronRight size={15} color={isOpen || isHovered ? '#1A4731' : '#94A3B8'} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s,color 0.2s', flexShrink: 0 }} />
                                </div>
                                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.65', margin: '0 0 10px' }}>{pillar.description}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: isOpen ? '12px' : 0 }}>
                                    {pillar.tags.map(t => <span key={t} style={{ fontSize: '0.7rem', fontWeight: '600', color: '#1A4731', background: '#F0FDF4', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '4px' }}>{t}</span>)}
                                </div>
                                {isOpen && <div style={{ background: '#1A4731', borderRadius: '8px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}><span style={{ fontSize: '14px', marginTop: '1px' }}>💡</span><p style={{ fontSize: '0.825rem', color: '#CBD5E1', lineHeight: '1.65', margin: 0 }}>{pillar.insight}</p></div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const MaturityLevelsSection = ({ maturityLevels = MATURITY_LEVELS }) => {
    const [active, setActive] = useState(0);
    const ml = MATURITY_LEVELS[active];
    return (
        <div>
            <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: 'clamp(1.2rem,2.5vw,1.6rem)', fontWeight: '800', color: '#1E293B', marginBottom: '6px' }}>AI Governance Maturity Model</h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.65', maxWidth: '600px' }}>Four progressive maturity levels to assess and improve your organisation's sustainability maturity.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {maturityLevels.map((m, i) => (
                    <button key={i} onClick={() => setActive(i)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.15s', background: active === i ? m.color : 'white', color: active === i ? 'white' : '#64748B', boxShadow: active === i ? `0 2px 8px ${m.color}40` : '0 1px 3px rgba(0,0,0,0.08)', outline: active === i ? 'none' : '1px solid #E2E8F0' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: active === i ? 'rgba(255,255,255,0.6)' : m.color, flexShrink: 0 }} />L{m.level}: {m.name}
                    </button>
                ))}
            </div>
            <div key={active} style={{ border: `1.5px solid ${ml.borderColor}`, borderRadius: '14px', overflow: 'hidden', background: 'white' }}>
                <div style={{ background: ml.color, padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem', color: 'white', fontFamily: 'var(--font-serif,Georgia,serif)', flexShrink: 0 }}>{ml.level}</div>
                        <div style={{ minWidth: 0 }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Level {ml.level}: {ml.name}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.72)', margin: '3px 0 0', fontSize: '0.82rem', lineHeight: '1.5' }}>{ml.description}</p>
                        </div>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${ml.pct}%`, background: 'rgba(255,255,255,0.6)', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>Governance Maturity</span>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>{ml.pct}%</span>
                    </div>
                </div>
                <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap: '1.5rem' }}>
                    <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: '700', color: ml.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Characteristics</p>
                        {ml.characteristics.map((c, i) => <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '9px' }}><div style={{ width: '16px', height: '16px', borderRadius: '50%', background: `${ml.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}><span style={{ fontSize: '8px', color: ml.color }}>●</span></div><span style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.55' }}>{c}</span></div>)}
                    </div>
                    <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Next Actions</p>
                        {ml.actions.map((a, i) => <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '9px' }}><CheckCircle size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: '1px' }} /><span style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.55' }}>{a}</span></div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const getPhaseIcon = (phaseStr, size = 18, color = "currentColor") => {
    const s = String(phaseStr || '').toLowerCase();
    if (s.includes('1') || s.includes('🏛️') || s.includes('fÅ')) return <Landmark size={size} color={color} />;
    if (s.includes('2') || s.includes('🔍') || s.includes('fö')) return <Search size={size} color={color} />;
    if (s.includes('3') || s.includes('🛡️') || s.includes('fA')) return <Shield size={size} color={color} />;
    if (s.includes('4') || s.includes('📊') || s.includes('fB')) return <BarChart size={size} color={color} />;
    return <Landmark size={size} color={color} />;
};

const ImplementationGuideSection = ({ implementationGuide = IMPLEMENTATION_GUIDE }) => {
    const [activePhase, setActivePhase] = useState(0);
    const [checked, setChecked] = useState({});
    const phase = IMPLEMENTATION_GUIDE[activePhase];
    const toggle = (key, e) => { e.stopPropagation(); setChecked(p => ({ ...p, [key]: !p[key] })); };
    const doneInPhase = phase.steps.filter(s => checked[s.step]).length;
    const totalDone = Object.values(checked).filter(Boolean).length;
    const totalAll = IMPLEMENTATION_GUIDE.reduce((a, p) => a + p.steps.length, 0);
    return (
        <div>
            <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: 'clamp(1.2rem,2.5vw,1.6rem)', fontWeight: '800', color: '#1E293B', marginBottom: '6px' }}>Implementation Guide</h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.65', maxWidth: '600px' }}>A phased roadmap for embedding ESG governance across your organisation.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {implementationGuide.map((p, i) => {
                        const phaseName = p.phase || p.phase_label || `Phase ${i+1}`;
                        return (
                            <button key={i} onClick={() => setActivePhase(i)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.15s', background: activePhase === i ? '#1A4731' : 'white', color: activePhase === i ? 'white' : '#64748B', border: activePhase === i ? 'none' : '1px solid #E2E8F0', boxShadow: activePhase === i ? '0 2px 8px rgba(0,51,102,0.25)' : 'none' }}>
                                <span>{typeof p.icon === 'string' ? getPhaseIcon(phaseName, 18, activePhase === i ? 'white' : '#64748B') : p.icon}</span>{phaseName}
                            </button>
                        );
                    })}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'monospace', background: '#F8FAFC', padding: '5px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{totalDone}/{totalAll} completed</span>
            </div>
            <div key={activePhase} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ background: '#1A4731', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.6rem', flexShrink: 0, display: 'flex', alignItems: 'center', color: 'white' }}>
                        {typeof phase.icon === 'string' ? getPhaseIcon(phase.phase || phase.phase_label, 24, 'white') : phase.icon}
                    </span>
                    <div><span style={{ color: '#6EE7B7', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{phase.phase || phase.phase_label} · {phase.duration}</span><h3 style={{ color: 'white', margin: '2px 0 0', fontSize: '1rem', fontWeight: '700' }}>{phase.title}</h3></div>
                </div>
                {phase.steps.map(s => {
                    const done = checked[s.step];
                    return (
                        <div key={s.step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', background: done ? 'rgba(5,150,105,0.03)' : 'white', transition: 'background 0.15s' }}>
                            <span style={{ background: done ? '#059669' : '#F0FDF4', color: done ? 'white' : '#1A4731', fontSize: '0.7rem', fontWeight: '700', padding: '4px 7px', borderRadius: '5px', flexShrink: 0, marginTop: '2px', minWidth: '32px', textAlign: 'center', transition: 'all 0.2s' }}>{s.step}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: '700', color: done ? '#94A3B8' : '#1E293B', margin: '0 0 3px', fontSize: '0.88rem', textDecoration: done ? 'line-through' : 'none' }}>{s.title}</p>
                                <p style={{ color: '#64748B', margin: 0, fontSize: '0.82rem', lineHeight: '1.6' }}>{s.desc}</p>
                            </div>
                            <div onClick={e => toggle(s.step, e)} style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '2px', border: done ? 'none' : '2px solid #CBD5E1', background: done ? '#059669' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                {done && <span style={{ fontSize: '11px', color: 'white', fontWeight: '700' }}>✓</span>}
                            </div>
                        </div>
                    );
                })}
                <div style={{ padding: '10px 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '4px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${phase.steps.length ? (doneInPhase / phase.steps.length) * 100 : 0}%`, background: '#059669', borderRadius: '99px', transition: 'width 0.4s ease' }} /></div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{doneInPhase}/{phase.steps.length} in this phase</span>
                </div>
            </div>
        </div>
    );
};

const AuditTemplatesSection = ({ auditTemplates = AUDIT_TEMPLATES }) => {
    const [filter, setFilter] = useState('All');
    const [expanded, setExpanded] = useState(null);
    const categories = ['All', ...Object.keys(CATEGORY_COLORS)];
    const filtered = filter === 'All' ? auditTemplates : auditTemplates.filter(t => t.category === filter);
    return (
        <div>
            <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: 'clamp(1.2rem,2.5vw,1.6rem)', fontWeight: '800', color: '#1E293B', marginBottom: '6px' }}>Audit Templates</h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.65', maxWidth: '600px' }}>Production-ready templates for ESG governance, materiality assessment, CSRD compliance, and sustainability reporting.</p>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {categories.map(cat => { const isActive = filter === cat; const catStyle = CATEGORY_COLORS[cat]; return <button key={cat} onClick={() => { setFilter(cat); setExpanded(null); }} style={{ padding: '6px 13px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.15s', background: isActive ? (catStyle?.color || '#1A4731') : 'white', color: isActive ? 'white' : '#64748B', border: isActive ? 'none' : '1px solid #E2E8F0', boxShadow: isActive ? `0 2px 8px ${catStyle?.color || '#1A4731'}35` : 'none', whiteSpace: 'nowrap' }}>{cat}</button>; })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map(t => {
                    const cs = CATEGORY_COLORS[t.category] || { color: '#1A4731', bg: '#F0FDF4' }; const isOpen = expanded === t.id; return (
                        <div key={t.id} onClick={() => setExpanded(isOpen ? null : t.id)} style={{ border: `1.5px solid ${isOpen ? cs.color : '#E2E8F0'}`, borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.18s,box-shadow 0.18s', boxShadow: isOpen ? `0 2px 12px ${cs.color}18` : 'none', background: 'white' }}
                            onMouseOver={e => { if (!isOpen) e.currentTarget.style.borderColor = '#CBD5E1'; }} onMouseOut={e => { if (!isOpen) e.currentTarget.style.borderColor = '#E2E8F0'; }}>
                            <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: cs.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ClipboardList size={17} color={cs.color} /></div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748B', background: '#F1F5F9', padding: '2px 7px', borderRadius: '4px' }}>{t.id}</span>
                                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'white', background: cs.color, padding: '2px 8px', borderRadius: '4px' }}>{t.category}</span>
                                        <span style={{ fontSize: '0.68rem', color: '#94A3B8', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '3px' }}><FileText size={10} />{t.format}</span>
                                    </div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1E293B', margin: 0 }}>{t.title}</h3>
                                </div>
                                <ChevronRight size={14} color="#94A3B8" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginTop: '12px' }} />
                            </div>
                            {isOpen && <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid #F1F5F9' }}><p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.65', margin: '14px 0 12px' }}>{t.description}</p><p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Key Fields</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{t.fields.map(f => <span key={f} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', padding: '4px 9px', borderRadius: '5px' }}>{f}</span>)}</div></div>}
                        </div>
                    );
                })}
            </div>
            <div style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg,#002855 0%,#003d80 100%)', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Lock size={18} color="#6EE7B7" /></div>
                <div style={{ flex: 1, minWidth: '160px' }}><p style={{ fontWeight: '700', color: 'white', margin: '0 0 3px', fontSize: '0.88rem' }}>Full templates available to Chapter Leads</p><p style={{ margin: 0, fontSize: '0.78rem', color: '#6EE7B7' }}>Join the Global Sustainability Council to download editable versions in Excel, Word, and PDF formats.</p></div>
                <Link to="/membership" style={{ textDecoration: 'none', background: '#D97706', color: '#1A4731', border: 'none', padding: '9px 18px', borderRadius: '7px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-block' }}>Join the Council</Link>
            </div>
        </div>
    );
};

const SecurityToolsSection = () => {
    const [expanded, setExpanded] = useState(null);
    return (
        <div>
            <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: 'clamp(1.2rem,2.5vw,1.6rem)', fontWeight: '800', color: '#1E293B', marginBottom: '6px' }}>Security Tools & Solutions</h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.65', maxWidth: '600px' }}>Enterprise-grade security tools organisations can leverage alongside our governance playbooks.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SECURITY_TOOLS.map((tool, idx) => {
                    const isOpen = expanded === idx; return (
                        <div key={idx} style={{ border: `1.5px solid ${isOpen ? tool.color : '#E2E8F0'}`, borderRadius: '12px', overflow: 'hidden', background: 'white', transition: 'border-color 0.18s,box-shadow 0.18s', boxShadow: isOpen ? `0 3px 16px ${tool.color}18` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem 1.25rem', cursor: 'pointer', borderBottom: isOpen ? '1px solid #F1F5F9' : 'none' }} onClick={() => setExpanded(isOpen ? null : idx)} onMouseOver={e => { if (!isOpen) e.currentTarget.parentElement.style.borderColor = '#CBD5E1'; }} onMouseOut={e => { if (!isOpen) e.currentTarget.parentElement.style.borderColor = '#E2E8F0'; }}>
                                <div style={{ width: '4px', height: '36px', background: tool.color, borderRadius: '99px', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1E293B' }}>{tool.name}</h3>
                                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'white', background: tool.color, padding: '2px 8px', borderRadius: '4px' }}>{tool.company}</span>
                                        <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', marginLeft: 'auto' }}>{tool.category}</span>
                                    </div>
                                </div>
                                <ChevronRight size={14} color="#94A3B8" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                            </div>
                            {isOpen && <div style={{ padding: '1.1rem 1.25rem' }}>
                                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.65', margin: '0 0 1rem' }}>{tool.description}</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap: '1rem' }}>
                                    <div><p style={{ fontSize: '0.68rem', fontWeight: '700', color: tool.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Key Capabilities</p>{tool.capabilities.map((c, i) => <div key={i} style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', marginBottom: '7px' }}><CheckCircle size={12} color={tool.color} style={{ flexShrink: 0, marginTop: '2px' }} /><span style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.5' }}>{c}</span></div>)}</div>
                                    <div><p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Framework Alignment</p><div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 12px' }}><p style={{ fontSize: '0.82rem', color: '#166534', lineHeight: '1.6', margin: 0 }}>{tool.frameworkAlignment}</p></div></div>
                                </div>
                            </div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PlaybooksSection = () => {
    const { token, isLoggedIn, canDownloadFramework } = useAuth();
    const [playbooks, setPlaybooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/playbooks').then(r => r.json()).then(data => { setPlaybooks(data); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const handleDownload = async (pb) => {
        if (!isLoggedIn) { alert('Please sign in to download playbooks.'); return; }
        if (!canDownloadFramework?.()) { alert('Framework playbook downloads are available for Chapter Lead and Founding Member plans.'); return; }
        try {
            const res = await fetch(`/api/playbooks/${pb.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = pb.file_name || `${pb.title}.${pb.file_type}`; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Download failed. Please try again.'); }
    };

    const FRAMEWORK_COLORS = { 'CSRD': { bg: '#F0FDF4', color: '#1A4731', border: '#A7F3D0' }, 'GRI Standards': { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' }, 'TCFD': { bg: '#FAF5FF', color: '#7C3AED', border: '#E9D5FF' }, 'GDPR': { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' }, 'General': { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' } };
    const CATEGORY_ICONS = { Guide: '📖', Checklist: '✅', Template: '📋', Policy: '📜' };
    const grouped = playbooks.reduce((acc, pb) => { const fw = pb.framework || 'General'; if (!acc[fw]) acc[fw] = []; acc[fw].push(pb); return acc; }, {});

    return (
        <div>
            <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: 'clamp(1.2rem,2.5vw,1.6rem)', fontWeight: '800', color: '#1E293B', marginBottom: '6px' }}>Governance Playbooks</h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.65', maxWidth: '600px' }}>Download comprehensive sustainability playbooks aligned with major ESG reporting frameworks.</p>
                {isLoggedIn && !canDownloadFramework?.() && <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '7px', padding: '7px 12px' }}><Lock size={12} color="#DC2626" /><span style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: '600' }}>Framework downloads require a Chapter Lead or Founding Member plan. <a href="/membership" style={{ color: '#DC2626', textDecoration: 'underline' }}>Upgrade →</a></span></div>}
                {!isLoggedIn && <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '7px', padding: '7px 12px' }}><Lock size={12} color="#D97706" /><span style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: '600' }}>Sign in to download — available for Chapter Lead &amp; Founding Member plans.</span></div>}
            </div>
            {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}><BookOpen size={32} style={{ marginBottom: '8px', opacity: 0.4 }} /><p style={{ margin: 0, fontSize: '0.875rem' }}>Loading playbooks...</p></div>}
            {!loading && Object.entries(grouped).map(([framework, items]) => {
                const fwStyle = FRAMEWORK_COLORS[framework] || FRAMEWORK_COLORS['General']; return (
                    <div key={framework} style={{ marginBottom: '1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ background: fwStyle.bg, color: fwStyle.color, border: `1px solid ${fwStyle.border}`, padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700' }}>{framework}</span>
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{items.length} playbook{items.length > 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {items.map(pb => <div key={pb.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', transition: 'box-shadow 0.18s,border-color 0.18s', flexWrap: 'wrap' }} onMouseOver={e => { e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = '#CBD5E1'; }} onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
                                <div style={{ flex: 1, minWidth: '160px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '1rem' }}>{CATEGORY_ICONS[pb.category] || '📄'}</span>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#1E293B' }}>{pb.title}</h4>
                                        <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#475569', background: '#F1F5F9', padding: '2px 7px', borderRadius: '4px' }}>{pb.category}</span>
                                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748B', background: '#E2E8F0', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>{pb.file_type}</span>
                                    </div>
                                    {pb.brief && <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', lineHeight: '1.55' }}>{pb.brief}</p>}
                                </div>
                                <button onClick={() => handleDownload(pb)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: canDownloadFramework?.() ? '#1A4731' : '#94A3B8', color: 'white', border: 'none', borderRadius: '7px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s', whiteSpace: 'nowrap' }} onMouseOver={e => { if (canDownloadFramework?.()) e.currentTarget.style.background = '#002147'; }} onMouseOut={e => { if (canDownloadFramework?.()) e.currentTarget.style.background = '#1A4731'; }}>
                                    {canDownloadFramework?.() ? <><Download size={13} />Download</> : isLoggedIn ? <><Lock size={13} />Council Only</> : <><Lock size={13} />Sign In</>}
                                </button>
                            </div>)}
                        </div>
                    </div>
                );
            })}
            {!loading && playbooks.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}><BookOpen size={36} color="#CBD5E1" style={{ marginBottom: '10px' }} /><p style={{ color: '#94A3B8', margin: 0, fontSize: '0.875rem' }}>No playbooks available yet. Check back soon!</p></div>}
        </div>
    );
};

const NAV_ITEMS = [
    { key: 'pillars', label: 'Core Pillars', component: CorePillarsSection },
    { key: 'maturity', label: 'Maturity Levels', component: MaturityLevelsSection },
    { key: 'implementation', label: 'Implementation Guide', component: ImplementationGuideSection },
    { key: 'audit', label: 'Audit Templates', component: AuditTemplatesSection },
    { key: 'tools', label: 'Security Tools', component: SecurityToolsSection },
    { key: 'playbooks', label: 'Governance Playbooks', component: PlaybooksSection },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
const Framework = () => {
    const [activeSection, setActiveSection] = useState('pillars');
    const [animKey, setAnimKey] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [pillars, setPillars] = useState([]);
    const [maturityLevels, setMaturityLevels] = useState([]);
    const [implementationGuide, setImplementationGuide] = useState([]);
    const [auditTemplates, setAuditTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const activeIdx = NAV_ITEMS.findIndex(n => n.key === activeSection);
    const ActiveComponent = NAV_ITEMS[activeIdx]?.component || CorePillarsSection;
    const activeItem = NAV_ITEMS[activeIdx];

    const handleNav = (key) => { setActiveSection(key); setAnimKey(p => p + 1); setMobileMenuOpen(false); };

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [pillarsRes, maturityRes, guideRes, templatesRes] = await Promise.all([
                    frameworkAPI.getFrameworkPillars(), frameworkAPI.getFrameworkMaturityLevels(),
                    frameworkAPI.getFrameworkImplementationGuide(), frameworkAPI.getFrameworkAuditTemplates()
                ]);
                setPillars(pillarsRes.data || []); setMaturityLevels(maturityRes.data || []);
                setImplementationGuide(guideRes.data || []); setAuditTemplates(templatesRes.data || []);
            } catch {
                setPillars(PILLARS); setMaturityLevels(MATURITY_LEVELS);
                setImplementationGuide(IMPLEMENTATION_GUIDE); setAuditTemplates(AUDIT_TEMPLATES);
            } finally { setLoading(false); }
        };
        load();
    }, []);

    useEffect(() => { document.title = 'Sustainability Framework | Global Sustainability Council (GSC)'; }, []);

    return (
        <>
            <style>{`
                @keyframes fadeSlideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
                @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                .arc-content-enter { animation: fadeSlideUp 0.3s cubic-bezier(.4,0,.2,1) both; }

                /* ── Sidebar nav — desktop only ── */
                .fw-sidebar {
                    display: block;
                    padding-top: 2.5rem;
                    border-right: 1px solid #E2E8F0;
                    padding-right: 2rem;
                    position: sticky;
                    top: 0;
                    height: fit-content;
                    width: 220px;
                    flex-shrink: 0;
                }

                /* ── Mobile nav bar ── */
                .fw-mobile-nav {
                    display: none;
                    background: white;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    margin-bottom: 1.25rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    overflow: hidden;
                }

                /* ── Body layout ── */
                .fw-body {
                    display: flex;
                    gap: 3rem;
                    max-width: 1100px;
                    margin: 0 auto;
                }
                .fw-content {
                    flex: 1;
                    min-width: 0;
                    padding-top: 2.5rem;
                    padding-bottom: 4rem;
                }

                /* ── Responsive ── */
                @media (max-width: 820px) {
                    .fw-sidebar     { display: none; }
                    .fw-mobile-nav  { display: block; }
                    .fw-body        { flex-direction: column; gap: 0; }
                    .fw-content     { padding-top: 1.25rem; }
                }
            `}</style>

            {/* ── Hero ── */}
            <div style={{ background: '#0A2B1D', padding: 'clamp(2.5rem,5vw,4rem) clamp(1rem,4vw,2rem) clamp(2rem,4vw,3.5rem)', position: 'relative', overflow: 'hidden' }}>
                <HeroBackground />
                <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(249,168,37,0.15)', border: '1px solid rgba(249,168,37,0.3)', color: '#D97706', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: '5px', marginBottom: '16px' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#D97706' }} />Global Sustainability Council (GSC) · Framework v1.0
                            </span>
                            <h1 style={{ color: 'white', fontSize: 'clamp(1.5rem,4vw,2.6rem)', fontWeight: '800', lineHeight: '1.1', margin: '0 0 12px', fontFamily: 'var(--font-serif,Georgia,serif)', letterSpacing: '-0.02em' }}>Sustainability Framework</h1>
                            <p style={{ color: '#CBD5E1', fontSize: 'clamp(0.875rem,1.5vw,1rem)', lineHeight: '1.7', margin: 0, maxWidth: '540px' }}>A structured approach to identifying, measuring, and managing ESG risks — aligned to CSRD/ESRS, GRI Standards, TCFD, and SBTi.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {[{ n: '6', label: 'Core Pillars' }, { n: '4', label: 'Maturity Levels' }, { n: '16+', label: 'Implementation Steps' }, { n: '6', label: 'Audit Templates' }].map(s => (
                                <div key={s.label} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '14px 18px', textAlign: 'center', minWidth: '80px' }}>
                                    <div style={{ fontSize: 'clamp(1.1rem,2vw,1.5rem)', fontWeight: '900', color: 'white', lineHeight: 1, fontFamily: 'var(--font-serif,Georgia,serif)' }}>{s.n}</div>
                                    <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '4px', lineHeight: '1.3' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div style={{ background: '#F8FAFC', minHeight: '60vh', padding: '0 clamp(1rem,3vw,2rem)' }}>
                <div className="fw-body">

                    {/* ── Desktop Sidebar ── */}
                    <div className="fw-sidebar">
                        <h4 style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Framework Modules</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                            {NAV_ITEMS.map(item => {
                                const isActive = activeSection === item.key;
                                return (
                                    <li key={item.key} onClick={() => handleNav(item.key)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.9rem', borderRadius: '8px', borderLeft: isActive ? '3px solid #1A4731' : '3px solid transparent', background: isActive ? '#F0FDF4' : 'transparent', color: isActive ? '#1A4731' : '#64748B', fontWeight: isActive ? '700' : '500', fontSize: '0.855rem', cursor: 'pointer', transition: 'all 0.15s', marginBottom: '2px' }}
                                        onMouseOver={e => { if (!isActive) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; } }}
                                        onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}>
                                        {item.label}
                                        {isActive && <ChevronRight size={14} color="#1A4731" />}
                                    </li>
                                );
                            })}
                        </ul>
                        <div style={{ paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                            <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '8px' }}>Framework Progress</p>
                            <div style={{ height: '5px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden', marginBottom: '6px' }}>
                                <div style={{ height: '100%', width: `${((activeIdx + 1) / NAV_ITEMS.length) * 100}%`, background: 'linear-gradient(90deg,#1A4731,#0369A1)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                            </div>
                            <p style={{ fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'monospace' }}>Section {activeIdx + 1} of {NAV_ITEMS.length}</p>
                        </div>
                    </div>

                    {/* ── Content ── */}
                    <div className="fw-content">

                        {/* ── Mobile nav dropdown ── */}
                        <div className="fw-mobile-nav">
                            <button onClick={() => setMobileMenuOpen(v => !v)}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.1rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: '700', color: '#1A4731' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1A4731' }} />
                                    {activeItem?.label}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {activeIdx + 1}/{NAV_ITEMS.length}
                                    <ChevronRight size={14} style={{ transform: mobileMenuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                                </span>
                            </button>
                            {mobileMenuOpen && (
                                <div style={{ borderTop: '1px solid #E2E8F0', padding: '0.5rem' }}>
                                    {NAV_ITEMS.map(item => {
                                        const isActive = activeSection === item.key;
                                        return (
                                            <button key={item.key} onClick={() => handleNav(item.key)}
                                                style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.9rem', border: 'none', borderRadius: '8px', background: isActive ? '#1A4731' : 'transparent', color: isActive ? 'white' : '#374151', fontWeight: isActive ? '700' : '500', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                {item.label}
                                                {isActive && <CheckCircle size={14} />}
                                            </button>
                                        );
                                    })}
                                    {/* Progress */}
                                    <div style={{ padding: '0.75rem 0.9rem 0.5rem', borderTop: '1px solid #F1F5F9', marginTop: '4px' }}>
                                        <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${((activeIdx + 1) / NAV_ITEMS.length) * 100}%`, background: '#1A4731', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                                        </div>
                                        <p style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '5px', marginBottom: 0 }}>Section {activeIdx + 1} of {NAV_ITEMS.length}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Active section content ── */}
                        <div key={animKey} className="arc-content-enter" style={{ minHeight: '500px' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
                                    <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #F0FDF4', borderTop: '4px solid #1A4731', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    <p style={{ marginTop: '16px' }}>Loading framework content...</p>
                                </div>
                            ) : (
                                <ActiveComponent pillars={pillars} maturityLevels={maturityLevels} implementationGuide={implementationGuide} auditTemplates={auditTemplates} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Framework;