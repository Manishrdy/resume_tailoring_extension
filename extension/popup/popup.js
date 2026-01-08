// popup/popup.js - Main Application Logic

// State
let currentResume = null;
let tailoredResume = null;
let currentProfileId = null;
let editingResumeId = null;
let editingResumeSnapshot = null;

// Resume form draft autosave
const RESUME_DRAFT_VERSION = 1;
const DRAFT_DEBOUNCE_MS = 400;
let draftSaveTimer = null;

// DOM Elements
const elements = {
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Resume tab
    resumeSelect: document.getElementById('resume-select'),
    newResumeBtn: document.getElementById('new-resume-btn'),
    resumePreview: document.getElementById('resume-preview'),
    previewName: document.getElementById('preview-name'),
    previewEmail: document.getElementById('preview-email'),
    expCount: document.getElementById('exp-count'),
    eduCount: document.getElementById('edu-count'),
    projCount: document.getElementById('proj-count'),
    editResumeBtn: document.getElementById('edit-resume-btn'),
    deleteResumeBtn: document.getElementById('delete-resume-btn'),
    exportJsonBtn: document.getElementById('export-json-btn'),

    // Backup / import
    exportAllBtn: document.getElementById('export-all-btn'),
    importResumesBtn: document.getElementById('import-resumes-btn'),
    importFileInput: document.getElementById('import-file-input'),
    clearStorageBtn: document.getElementById('clear-storage-btn'),

    // Tailor tab
    currentResumeName: document.getElementById('current-resume-name'),
    scrapeBtn: document.getElementById('scrape-btn'),
    jobDescription: document.getElementById('job-description'),
    tailorBtn: document.getElementById('tailor-btn'),
    loading: document.getElementById('loading'),
    results: document.getElementById('results'),
    atsScore: document.getElementById('ats-score'),
    matchedCount: document.getElementById('matched-count'),
    matchedKeywords: document.getElementById('matched-keywords'),
    missingCount: document.getElementById('missing-count'),
    missingKeywords: document.getElementById('missing-keywords'),
    downloadPdfBtn: document.getElementById('download-pdf-btn'),
    errorMsg: document.getElementById('error-msg'),
    successMsg: document.getElementById('success-msg'),

    // History tab
    historyList: document.getElementById('history-list'),

    // Settings tab
    apiUrl: document.getElementById('api-url'),
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    testConnectionBtn: document.getElementById('test-connection-btn'),
    connectionStatus: document.getElementById('connection-status'),

    // Footer
    currentProfileFooter: document.getElementById('current-profile-footer'),

    // Modal
    modal: document.getElementById('resume-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalClose: document.getElementById('modal-close'),
    clearDraftBtn: document.getElementById('clear-draft-btn'),
    resumeForm: document.getElementById('resume-form'),
    cancelBtn: document.getElementById('cancel-btn'),
    exportDraftJsonBtn: document.getElementById('export-draft-json-btn'),

    // Form containers
    experienceContainer: document.getElementById('experience-container'),
    educationContainer: document.getElementById('education-container'),
    projectsContainer: document.getElementById('projects-container'),
    skillsContainer: document.getElementById('skills-container'),

    // Add buttons
    addExperience: document.getElementById('add-experience'),
    addEducation: document.getElementById('add-education'),
    addProject: document.getElementById('add-project'),
    addSkill: document.getElementById('add-skill')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadResumes();
    await loadSettings();
    await loadHistory();
    setupEventListeners();
    updateCurrentProfileDisplay();
});

// Tab Navigation
function setupEventListeners() {
    // Tab switching
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Resume tab
    elements.resumeSelect.addEventListener('change', handleResumeSelect);
    elements.newResumeBtn.addEventListener('click', () => openModal());
    elements.editResumeBtn.addEventListener('click', () => openModal(currentResume));
    elements.deleteResumeBtn.addEventListener('click', handleDeleteResume);
    elements.exportJsonBtn.addEventListener('click', handleExportJson);

    // Backup / import
    if (elements.exportAllBtn) elements.exportAllBtn.addEventListener('click', handleExportAll);
    if (elements.importResumesBtn) elements.importResumesBtn.addEventListener('click', handleImportResumes);
    if (elements.importFileInput) elements.importFileInput.addEventListener('change', handleImportFileChange);
    if (elements.clearStorageBtn) elements.clearStorageBtn.addEventListener('click', handleClearStorage);

    // Tailor tab
    elements.scrapeBtn.addEventListener('click', handleScrape);
    elements.jobDescription.addEventListener('input', updateTailorButton);
    elements.tailorBtn.addEventListener('click', handleTailor);
    elements.downloadPdfBtn.addEventListener('click', handleDownloadPdf);

    // Settings tab
    elements.saveSettingsBtn.addEventListener('click', handleSaveSettings);
    elements.testConnectionBtn.addEventListener('click', handleTestConnection);

    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.cancelBtn.addEventListener('click', closeModal);
    elements.clearDraftBtn.addEventListener('click', handleClearDraft);
    if (elements.exportDraftJsonBtn) {
        elements.exportDraftJsonBtn.addEventListener('click', handleExportDraftJson);
    }
    elements.resumeForm.addEventListener('submit', handleSaveResume);

    // Autosave resume form draft (persists even when popup closes)
    elements.resumeForm.addEventListener('input', queueSaveDraft);
    // Capture remove clicks (inline onclick removes the node; save after)
    elements.resumeForm.addEventListener('click', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('remove-btn')) {
            setTimeout(queueSaveDraft, 0);
        }
    });



    // Close when clicking outside the editor card
    elements.modal.addEventListener('click', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.modal.classList.contains('hidden')) {
            closeModal();
        }
    });
    // Dynamic form buttons
    elements.addExperience.addEventListener('click', () => addExperienceEntry());
    elements.addEducation.addEventListener('click', () => addEducationEntry());
    elements.addProject.addEventListener('click', () => addProjectEntry());
    elements.addSkill.addEventListener('click', () => addSkillEntry());
}

// Tab Switching
function switchTab(tabName) {
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}



// -------- Normalization helpers (must match backend resume.py schema) --------
function _asStr(v) {
    return (v === undefined || v === null) ? '' : String(v);
}
function _trim(v) {
    return _asStr(v).trim();
}
function _nullIfEmpty(v) {
    const s = _trim(v);
    return s ? s : null;
}
function _dedupe(arr) {
    const out = [];
    const seen = new Set();
    for (const item of arr) {
        const s = _trim(item);
        if (!s) continue;
        const key = s.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(s);
    }
    return out;
}

// Convert free-form bullet text to a clean list of bullets.
// - Handles: one bullet per line, inline "•" bullets, "-" "*" "1." bullets
// - Merges wrapped lines (e.g., line-breaks inserted mid-sentence)
function parseBullets(raw) {
    if (raw === undefined || raw === null) return [];
    const text = Array.isArray(raw) ? raw.join('\n') : _asStr(raw);
    const normalized = text
        .replace(/\r\n/g, '\n')
        .replace(/\u2022/g, '•')   // unicode bullet → •
        .replace(/\t/g, ' ')
        .trim();

    if (!normalized) return [];

    // Expand inline bullets: "Intro.. • Bullet A.. • Bullet B"
    const baseLines = normalized.split('\n').map(l => l.trim()).filter(Boolean);
    const lines = [];
    for (const line of baseLines) {
        if (line.includes('•')) {
            const parts = line.split('•');
            if (parts[0] && parts[0].trim()) lines.push(parts[0].trim());
            for (const p of parts.slice(1)) {
                const t = p.trim();
                if (t) lines.push('• ' + t);
            }
        } else {
            lines.push(line);
        }
    }

    const bullets = [];
    const bulletStart = /^\s*(?:[•\-\*\u2013\u2014]|\d+[\.\)])\s+/;

    for (const line0 of lines) {
        const line = line0.trim();
        const isBullet = bulletStart.test(line);

        if (isBullet) {
            const cleaned = line.replace(bulletStart, '').trim();
            if (cleaned) bullets.push(cleaned);
            continue;
        }

        if (!bullets.length) {
            bullets.push(line);
            continue;
        }

        // Heuristics to merge wrapped lines:
        // - starts with lowercase (likely continuation)
        // - very short fragments (likely line-wrap artifacts) if prev doesn't end a sentence
        const prev = bullets[bullets.length - 1];
        const prevEndsSentence = /[.!?;:]$/.test(prev.trim());
        const startsLower = /^[a-z]/.test(line);
        const shortFrag = line.length < 20;

        if (startsLower || (shortFrag && !prevEndsSentence)) {
            bullets[bullets.length - 1] = (prev + ' ' + line).replace(/\s+/g, ' ').trim();
        } else {
            bullets.push(line);
        }
    }

    return bullets
        .map(b => b.replace(/^[•\-\*]\s*/, '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
}

function normalizeSkills(v) {
    if (v === undefined || v === null) return [];

    // Legacy: object map (category -> list or comma string)
    if (typeof v === 'object' && !Array.isArray(v)) {
        const out = [];
        for (const val of Object.values(v)) {
            if (Array.isArray(val)) out.push(...val);
            else out.push(..._asStr(val).split(/[,;\n]/));
        }
        return _dedupe(out);
    }

    // Array forms:
    if (Array.isArray(v)) {
        // Legacy: [{category, skills:"a,b"}]
        const out = [];
        if (v.every(x => x && typeof x === 'object' && !Array.isArray(x))) {
            for (const item of v) {
                const raw = item.skills ?? item.items ?? '';
                out.push(..._asStr(raw).split(/[,;\n]/));
            }
            return _dedupe(out);
        }
        return _dedupe(v);
    }

    // String form
    if (typeof v === 'string') {
        return _dedupe(v.split(/[,;\n]/));
    }

    return [];
}

function parseProjectText(raw) {
    const text = Array.isArray(raw) ? raw.join('\n') : _asStr(raw);
    const trimmed = text.trim();
    if (!trimmed) return { description: '', highlights: [] };

    if (trimmed.includes('•')) {
        const idx = trimmed.indexOf('•');
        const preface = trimmed.slice(0, idx).replace(/\s+/g, ' ').trim();
        const highlights = parseBullets(trimmed.slice(idx));
        const description = (preface || (highlights.length ? highlights.join(' ') : trimmed))
            .replace(/\s+/g, ' ')
            .trim();
        return { description, highlights };
    }

    const highlights = parseBullets(trimmed);
    const description = (highlights.length ? highlights.join(' ') : trimmed).replace(/\s+/g, ' ').trim();
    return { description, highlights };
}

// Build a Resume JSON object that STRICTLY matches backend resume.py schema.
function normalizeResume(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const now = new Date().toISOString();
    const id = _trim(raw.id) || newResumeId();
    const piRaw = raw.personalInfo || raw.personal_info || {};

    const website = _nullIfEmpty(piRaw.website ?? piRaw.portfolio ?? raw.website ?? raw.portfolio);

    const personalInfo = {
        name: _trim(piRaw.name),
        email: _trim(piRaw.email),
        phone: _nullIfEmpty(piRaw.phone),
        location: _nullIfEmpty(piRaw.location),
        linkedin: _nullIfEmpty(piRaw.linkedin),
        github: _nullIfEmpty(piRaw.github),
        website: website,
        summary: _nullIfEmpty(piRaw.summary)
    };

    const education = Array.isArray(raw.education) ? raw.education : [];
    const normalizedEducation = education.map((e) => {
        const achievements = Array.isArray(e.achievements)
            ? e.achievements
            : (Array.isArray(e.coursework) ? e.coursework : parseBullets(e.coursework));

        return {
            institution: _trim(e.institution),
            degree: _trim(e.degree),
            field: _nullIfEmpty(e.field),
            startDate: _trim(e.startDate),
            endDate: _trim(e.endDate),
            gpa: _nullIfEmpty(e.gpa),
            achievements: achievements.map(a => _trim(a)).filter(Boolean)
        };
    }).filter(e => e.institution && e.degree);

    const experience = Array.isArray(raw.experience) ? raw.experience : [];
    const normalizedExperience = experience.map((x) => {
        const company = _trim(x.company ?? x.employer);
        const position = _trim(x.position ?? x.role);
        const description = parseBullets(x.description);
        return {
            company,
            position,
            location: _nullIfEmpty(x.location),
            startDate: _trim(x.startDate),
            endDate: _trim(x.endDate),
            description
        };
    }).filter(x => x.company && x.position && Array.isArray(x.description) && x.description.length > 0);

    const projects = Array.isArray(raw.projects) ? raw.projects : [];
    const normalizedProjects = projects.map((p) => {
        const { description, highlights } = parseProjectText(p.description ?? p.highlights ?? '');
        const finalDesc = (description || '').slice(0, 1000);
        return {
            name: _trim(p.name),
            description: finalDesc,
            technologies: Array.isArray(p.technologies) ? p.technologies.map(t => _trim(t)).filter(Boolean) : [],
            link: _nullIfEmpty(p.link ?? p.github),
            highlights: Array.isArray(p.highlights) && p.highlights.length
                ? p.highlights.map(h => _trim(h)).filter(Boolean)
                : highlights,
            startDate: _nullIfEmpty(p.startDate),
            endDate: _nullIfEmpty(p.endDate)
        };
    }).filter(p => p.name && p.description);

    const skills = normalizeSkills(raw.skills);
    const certifications = Array.isArray(raw.certifications) ? raw.certifications : [];

    const name = _trim(raw.name ?? raw.resumeName) || personalInfo.name || 'Untitled Resume';

    return {
        id,
        name,
        personalInfo,
        education: normalizedEducation,
        experience: normalizedExperience,
        skills: skills.length ? skills : ['General Skills'],
        projects: normalizedProjects,
        certifications,
        createdAt: raw.createdAt ?? now,
        updatedAt: raw.updatedAt ?? now
    };
}

function isLegacyResume(r) {
    if (!r || typeof r !== 'object') return false;
    if (r.personalInfo && typeof r.personalInfo === 'object' && 'portfolio' in r.personalInfo) return true;
    if (Array.isArray(r.experience) && r.experience.some(x => ('employer' in x) || ('role' in x))) return true;
    if (Array.isArray(r.projects) && r.projects.some(p => ('github' in p) || Array.isArray(p.description))) return true;
    if (r.skills && !Array.isArray(r.skills)) return true;
    if (Array.isArray(r.education) && r.education.some(e => 'coursework' in e)) return true;
    return false;
}
// ---------------------------------------------------------------------------

// Load Resumes
async function loadResumes() {
    const resumesRaw = await storage.getResumes();
    const savedProfileId = await storage.getCurrentProfile();

    // Normalize + (optionally) migrate any legacy resumes in storage
    const resumes = {};
    for (const [id, r] of Object.entries(resumesRaw || {})) {
        const normalized = normalizeResume(r) || r;
        resumes[id] = normalized;

        if (isLegacyResume(r)) {
            try {
                await storage.saveResume(normalized);
            } catch (err) {
                console.warn('Resume migration failed:', err);
            }
        }
    }

    elements.resumeSelect.innerHTML = '<option value="">Select resume...</option>';

    const orderedResumes = Object.values(resumes).sort((a, b) => {
        const ta = Date.parse(a.updatedAt || a.createdAt || 0) || 0;
        const tb = Date.parse(b.updatedAt || b.createdAt || 0) || 0;
        return tb - ta;
    });

    orderedResumes.forEach(resume => {
        const option = document.createElement('option');
        option.value = resume.id;
        option.textContent = resume.name;
        if (resume.id === savedProfileId) {
            option.selected = true;
        }
        elements.resumeSelect.appendChild(option);
    });

    if (savedProfileId && resumes[savedProfileId]) {
        currentResume = resumes[savedProfileId];
        currentProfileId = savedProfileId;
        displayResumePreview(currentResume);
    }
}

// Handle Resume Selection
async function handleResumeSelect(e) {
    const resumeId = e.target.value;

    if (!resumeId) {
        currentResume = null;
        currentProfileId = null;
        elements.resumePreview.classList.add('hidden');
        await storage.setCurrentProfile(null);
        updateCurrentProfileDisplay();
        return;
    }

    const resumes = await storage.getResumes();
    const raw = resumes[resumeId];
    currentResume = normalizeResume(raw) || raw;
    currentProfileId = resumeId;

    // migrate legacy record for future operations
    if (raw && isLegacyResume(raw)) {
        try {
            await storage.saveResume(currentResume);
        } catch (err) {
            console.warn('Resume migration failed:', err);
        }
    }

    await storage.setCurrentProfile(resumeId);
    displayResumePreview(currentResume);
    updateCurrentProfileDisplay();
}

// Display Resume Preview
function displayResumePreview(resume) {
    elements.previewName.textContent = resume.personalInfo.name;
    elements.previewEmail.textContent = resume.personalInfo.email;
    elements.expCount.textContent = resume.experience?.length || 0;
    elements.eduCount.textContent = resume.education?.length || 0;
    elements.projCount.textContent = resume.projects?.length || 0;
    elements.resumePreview.classList.remove('hidden');
}

// Update Current Profile Display
function updateCurrentProfileDisplay() {
    const name = currentResume ? currentResume.name : 'None';
    elements.currentProfileFooter.textContent = `Current: ${name}`;
    elements.currentResumeName.textContent = name;
    updateTailorButton();
}

// Open Modal (New or Edit)
function openModal(resume = null) {
    // Track whether we're editing an existing resume or creating a new one
    editingResumeId = resume?.id || null;
    editingResumeSnapshot = resume ? JSON.parse(JSON.stringify(resume)) : null;

    if (resume) {
        elements.modalTitle.textContent = 'Edit Resume';
        // Prefer draft (if any) over saved resume when editing
        restoreDraftOrPopulate(resume);
    } else {
        elements.modalTitle.textContent = 'Create New Resume';
        // Prefer draft (if any) for new resume creation
        restoreDraftOrReset();
    }

    // Fullscreen editor inside the popup for easier writing/editing
    elements.modal.classList.remove('hidden');
    elements.modal.classList.add('modal--fullscreen');
    document.body.classList.add('modal-open');

    // Focus the first meaningful input for faster editing
    const firstField = elements.modal.querySelector('input, textarea, select');
    if (firstField) firstField.focus();
}

// Close Modal
function closeModal() {
    elements.modal.classList.add('hidden');
    elements.modal.classList.remove('modal--fullscreen');
    document.body.classList.remove('modal-open');
}

function getDraftKey() {
    return editingResumeId ? `edit:${editingResumeId}` : 'new';
}

function queueSaveDraft() {
    // Only save when the editor is open (prevents background writes)
    if (elements.modal.classList.contains('hidden')) return;

    if (draftSaveTimer) clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(async () => {
        try {
            const state = collectResumeFormState();
            const hasMeaningfulContent = hasDraftContent(state);

            if (!hasMeaningfulContent) {
                // If user cleared everything, don't keep stale draft
                await storage.clearResumeDraft(getDraftKey());
                return;
            }

            await storage.saveResumeDraft(getDraftKey(), {
                version: RESUME_DRAFT_VERSION,
                updatedAt: new Date().toISOString(),
                editingResumeId: editingResumeId,
                data: state
            });
        } catch (err) {
            // Draft save failures should never break the UX
            console.warn('Draft save failed:', err);
        }
    }, DRAFT_DEBOUNCE_MS);
}

async function restoreDraftOrReset() {
    // New resume mode
    clearDynamicContainers();
    elements.resumeForm.reset();

    try {
        const draft = await storage.getResumeDraft('new');
        if (draft?.version === RESUME_DRAFT_VERSION && draft?.data) {
            applyResumeFormState(draft.data);
        }
    } catch (err) {
        console.warn('Draft restore (new) failed:', err);
    }
}

async function restoreDraftOrPopulate(resume) {
    clearDynamicContainers();
    elements.resumeForm.reset();

    try {
        const draft = await storage.getResumeDraft(getDraftKey());
        if (draft?.version === RESUME_DRAFT_VERSION && draft?.data) {
            applyResumeFormState(draft.data);
            return;
        }
    } catch (err) {
        console.warn('Draft restore (edit) failed:', err);
    }

    // Fallback to saved resume
    populateForm(resume);
}

function hasDraftContent(state) {
    if (!state) return false;
    const s = JSON.stringify(state);
    // cheap check to avoid storing completely blank drafts
    return s.replace(/[\s"{}\[\]:,]/g, '').length > 0;
}

function collectResumeFormState() {
    const get = (name) => (document.querySelector(`[name="${name}"]`)?.value || '').trim();
    const getEither = (a, b) => {
        const va = (document.querySelector(`[name="${a}"]`)?.value || '').trim();
        if (va) return va;
        return (document.querySelector(`[name="${b}"]`)?.value || '').trim();
    };

    const state = {
        resumeName: get('resumeName'),
        personalInfo: {
            name: get('name'),
            email: get('email'),
            phone: get('phone'),
            location: get('location'),
            linkedin: get('linkedin'),
            website: getEither('website', 'portfolio'),
            github: get('github'),
            summary: (document.querySelector('[name="summary"]')?.value || '').trim()
        },
        experience: [],
        education: [],
        projects: [],
        skills: []
    };

    // Experience
    const expItems = Array.from(elements.experienceContainer.querySelectorAll('.entry-item'));
    for (const item of expItems) {
        const employer = (item.querySelector('[name="exp-employer[]"]')?.value || '').trim();
        const role = (item.querySelector('[name="exp-role[]"]')?.value || '').trim();
        const startDate = (item.querySelector('[name="exp-start[]"]')?.value || '').trim();
        const endDate = (item.querySelector('[name="exp-end[]"]')?.value || '').trim();
        const descRaw = (item.querySelector('[name="exp-desc[]"]')?.value || '').trim();
        const description = parseBullets(descRaw);
        state.experience.push({ employer, role, startDate, endDate, description });
    }

    // Education
    const eduItems = Array.from(elements.educationContainer.querySelectorAll('.entry-item'));
    for (const item of eduItems) {
        const institution = (item.querySelector('[name="edu-institution[]"]')?.value || '').trim();
        const degree = (item.querySelector('[name="edu-degree[]"]')?.value || '').trim();
        const startDate = (item.querySelector('[name="edu-start[]"]')?.value || '').trim();
        const endDate = (item.querySelector('[name="edu-end[]"]')?.value || '').trim();
        const cwRaw = (item.querySelector('[name="edu-coursework[]"]')?.value || '').trim();
        const achievements = cwRaw
            ? cwRaw.split(/[,;\n]/).map(c => c.trim()).filter(Boolean)
            : [];
        state.education.push({ institution, degree, startDate, endDate, achievements });
    }

    // Projects
    const projItems = Array.from(elements.projectsContainer.querySelectorAll('.entry-item'));
    for (const item of projItems) {
        const name = (item.querySelector('[name="proj-name[]"]')?.value || '').trim();
        const github = (item.querySelector('[name="proj-github[]"]')?.value || '').trim();
        const startDate = (item.querySelector('[name="proj-start[]"]')?.value || '').trim();
        const endDate = (item.querySelector('[name="proj-end[]"]')?.value || '').trim();
        const descRaw = (item.querySelector('[name="proj-desc[]"]')?.value || '').trim();
        const description = parseBullets(descRaw);
        state.projects.push({ name, github, startDate, endDate, description });
    }

    // Skills
    const skillItems = Array.from(elements.skillsContainer.querySelectorAll('.skill-category'));
    for (const item of skillItems) {
        const category = (item.querySelector('[name="skill-category[]"]')?.value || '').trim();
        const skills = (item.querySelector('[name="skill-items[]"]')?.value || '').trim();
        state.skills.push({ category, skills });
    }

    return state;
}

function applyResumeFormState(state) {
    if (!state) return;

    // Basic fields
    document.querySelector('[name="resumeName"]').value = state.resumeName || '';

    const pi = state.personalInfo || {};
    document.querySelector('[name="name"]').value = pi.name || '';
    document.querySelector('[name="email"]').value = pi.email || '';
    document.querySelector('[name="phone"]').value = pi.phone || '';
    document.querySelector('[name="location"]').value = pi.location || '';
    document.querySelector('[name="linkedin"]').value = pi.linkedin || '';
    document.querySelector('[name="portfolio"]').value = pi.portfolio || pi.website || '';  // FIX
    document.querySelector('[name="github"]').value = pi.github || '';
    document.querySelector('[name="summary"]').value = pi.summary || '';

    // Dynamic sections
    clearDynamicContainers();

    (state.experience || []).forEach(exp => addExperienceEntry({
        employer: exp.employer || exp.company || '',  // FIX
        role: exp.role || exp.position || '',          // FIX
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        description: Array.isArray(exp.description) ? exp.description : []
    }));

    (state.education || []).forEach(edu => addEducationEntry({
        institution: edu.institution || '',
        degree: edu.degree || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
        coursework: Array.isArray(edu.coursework) ? edu.coursework : 
                   Array.isArray(edu.achievements) ? edu.achievements : []  // FIX
    }));

    (state.projects || []).forEach(proj => {
        let description = [];
        if (typeof proj.description === 'string') {
            description = proj.description.split('. ').filter(s => s.trim());
        } else if (Array.isArray(proj.description)) {
            description = proj.description;
        } else if (Array.isArray(proj.highlights)) {
            description = proj.highlights;
        }
        
        addProjectEntry({
            name: proj.name || '',
            github: proj.github || proj.link || '',  // FIX
            startDate: proj.startDate || '',
            endDate: proj.endDate || '',
            description: description
        });
    });

    // Skills - handle both formats
    if (state.skills) {
        if (typeof state.skills === 'object' && !Array.isArray(state.skills)) {
            Object.entries(state.skills).forEach(([category, skills]) => {
                const skillsStr = Array.isArray(skills) ? skills.join(', ') : String(skills);
                addSkillEntry({ category, skills: skillsStr });
            });
        } else if (Array.isArray(state.skills)) {
            const chunkSize = 5;
            for (let i = 0; i < state.skills.length; i += chunkSize) {
                const chunk = state.skills.slice(i, i + chunkSize);
                const category = i === 0 ? 'Primary Skills' : `Skills ${Math.floor(i / chunkSize) + 1}`;
                addSkillEntry({ category, skills: chunk.join(', ') });
            }
        } else {
            (state.skills || []).forEach(s => addSkillEntry({
                category: s.category || '',
                skills: s.skills || ''
            }));
        }
    }
}

async function handleClearDraft() {
    try {
        await storage.clearResumeDraft(getDraftKey());

        // Reset editor to a sane state
        clearDynamicContainers();
        elements.resumeForm.reset();

        if (editingResumeSnapshot) {
            populateForm(editingResumeSnapshot);
        } else {
            editingResumeId = null;
            editingResumeSnapshot = null;
        }

        showSuccess('Draft cleared');
    } catch (err) {
        console.warn('Clear draft failed:', err);
        showError('Could not clear draft');
    }
}
// Clear Dynamic Containers
function clearDynamicContainers() {
    elements.experienceContainer.innerHTML = '';
    elements.educationContainer.innerHTML = '';
    elements.projectsContainer.innerHTML = '';
    elements.skillsContainer.innerHTML = '';
}

// Populate Form (for editing)
// Populate Form (for editing)
function populateForm(resume) {
    // Resume name
    document.querySelector('[name="resumeName"]').value = resume.name || '';

    // Personal info - handle both old and new field names
    const pi = resume.personalInfo || {};
    document.querySelector('[name="name"]').value = pi.name || '';
    document.querySelector('[name="email"]').value = pi.email || '';
    document.querySelector('[name="phone"]').value = pi.phone || '';
    document.querySelector('[name="location"]').value = pi.location || '';
    document.querySelector('[name="linkedin"]').value = pi.linkedin || '';
    document.querySelector('[name="portfolio"]').value = pi.portfolio || pi.website || '';  // FIX: Accept both
    document.querySelector('[name="github"]').value = pi.github || '';
    document.querySelector('[name="summary"]').value = pi.summary || '';

    // Clear containers first
    clearDynamicContainers();

    // Experience - handle both old (employer/role) and new (company/position) field names
    if (resume.experience && Array.isArray(resume.experience)) {
        resume.experience.forEach(exp => {
            addExperienceEntry({
                employer: exp.employer || exp.company || '',  // FIX: Accept both
                role: exp.role || exp.position || '',          // FIX: Accept both
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                description: Array.isArray(exp.description) ? exp.description : []
            });
        });
    }

    // Education - handle both coursework and achievements
    if (resume.education && Array.isArray(resume.education)) {
        resume.education.forEach(edu => {
            addEducationEntry({
                institution: edu.institution || '',
                degree: edu.degree || '',
                startDate: edu.startDate || '',
                endDate: edu.endDate || '',
                coursework: Array.isArray(edu.coursework) ? edu.coursework : 
                           Array.isArray(edu.achievements) ? edu.achievements : []  // FIX: Accept both
            });
        });
    }

    // Projects - handle both github and link field names
    if (resume.projects && Array.isArray(resume.projects)) {
        resume.projects.forEach(proj => {
            // Handle description as both string and array
            let description = [];
            if (typeof proj.description === 'string') {
                description = proj.description.split('. ').filter(s => s.trim());
            } else if (Array.isArray(proj.description)) {
                description = proj.description;
            } else if (Array.isArray(proj.highlights)) {
                description = proj.highlights;
            }
            
            addProjectEntry({
                name: proj.name || '',
                github: proj.github || proj.link || '',  // FIX: Accept both
                startDate: proj.startDate || '',
                endDate: proj.endDate || '',
                description: description
            });
        });
    }

    // Skills - handle both object (old) and array (new) formats
    if (resume.skills) {
        if (typeof resume.skills === 'object' && !Array.isArray(resume.skills)) {
            // Old format: {"Category": ["skill1", "skill2"]}
            Object.entries(resume.skills).forEach(([category, skills]) => {
                const skillsStr = Array.isArray(skills) ? skills.join(', ') : String(skills);
                addSkillEntry({ category, skills: skillsStr });
            });
        } else if (Array.isArray(resume.skills)) {
            // New format: ["skill1", "skill2", "skill3"]
            // Group into categories of ~5 skills each for display
            const chunkSize = 5;
            for (let i = 0; i < resume.skills.length; i += chunkSize) {
                const chunk = resume.skills.slice(i, i + chunkSize);
                const category = i === 0 ? 'Primary Skills' : `Skills ${Math.floor(i / chunkSize) + 1}`;
                addSkillEntry({ 
                    category: category, 
                    skills: chunk.join(', ') 
                });
            }
        }
    }
}

// Add Experience Entry
function addExperienceEntry(data = null) {
    const div = document.createElement('div');
    div.className = 'entry-item';

    const employerVal = data?.employer || data?.company || '';
    const roleVal = data?.role || data?.position || '';
    const descLines = Array.isArray(data?.description) ? data.description : parseBullets(data?.description);

    div.innerHTML = `
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Remove</button>
        <div class="form-group">
            <label>Employer</label>
            <input type="text" name="exp-employer[]" class="form-control" placeholder="Company Name" value="${employerVal}">
        </div>
        <div class="form-group">
            <label>Role</label>
            <input type="text" name="exp-role[]" class="form-control" placeholder="Job Title" value="${roleVal}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Start Date</label>
                <input type="text" name="exp-start[]" class="form-control" placeholder="MMM YYYY" value="${data?.startDate || ''}">
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="text" name="exp-end[]" class="form-control" placeholder="MMM YYYY or Present" value="${data?.endDate || ''}">
            </div>
        </div>
        <div class="form-group">
            <label>Description (one bullet per line)</label>
            <textarea name="exp-desc[]" class="form-control" rows="4" placeholder="• Built secure backend microservices...
- Designed scalable data ingestion...">${descLines.join('\\n')}</textarea>
        </div>
    `;
    elements.experienceContainer.appendChild(div);
}

// Add Education Entry
function addEducationEntry(data = null) {
    const div = document.createElement('div');
    div.className = 'entry-item';

    const achievements = Array.isArray(data?.achievements)
        ? data.achievements
        : (Array.isArray(data?.coursework) ? data.coursework : []);

    div.innerHTML = `
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Remove</button>
        <div class="form-group">
            <label>Institution</label>
            <input type="text" name="edu-institution[]" class="form-control" placeholder="University Name" value="${data?.institution || ''}">
        </div>
        <div class="form-group">
            <label>Degree</label>
            <input type="text" name="edu-degree[]" class="form-control" placeholder="e.g., Masters in Computer Science - 3.8 GPA" value="${data?.degree || ''}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Start Date</label>
                <input type="text" name="edu-start[]" class="form-control" placeholder="MMM YYYY" value="${data?.startDate || ''}">
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="text" name="edu-end[]" class="form-control" placeholder="MMM YYYY" value="${data?.endDate || ''}">
            </div>
        </div>
        <div class="form-group">
            <label>Achievements / Coursework (one per line)</label>
            <textarea name="edu-coursework[]" class="form-control" rows="3" placeholder="Artificial Intelligence
Theory of Algorithms
Modern Computer Architecture">${achievements.join('\\n')}</textarea>
        </div>
    `;
    elements.educationContainer.appendChild(div);
}

// Add Project Entry
function addProjectEntry(data = null) {
    const div = document.createElement('div');
    div.className = 'entry-item';

    const linkVal = data?.github || data?.link || '';
    const descLines = Array.isArray(data?.description) ? data.description : parseBullets(data?.description);

    div.innerHTML = `
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Remove</button>
        <div class="form-group">
            <label>Project Name</label>
            <input type="text" name="proj-name[]" class="form-control" placeholder="Project Title" value="${data?.name || ''}">
        </div>
        <div class="form-group">
            <label>Link (GitHub / Demo)</label>
            <input type="url" name="proj-github[]" class="form-control" placeholder="https://github.com/username/repo" value="${linkVal}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Start Date</label>
                <input type="text" name="proj-start[]" class="form-control" placeholder="Winter 2025" value="${data?.startDate || ''}">
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="text" name="proj-end[]" class="form-control" placeholder="Winter 2025" value="${data?.endDate || ''}">
            </div>
        </div>
        <div class="form-group">
            <label>Highlights (one bullet per line)</label>
            <textarea name="proj-desc[]" class="form-control" rows="4" placeholder="• Designed an end-to-end distributed backend...
- Implemented a queue-driven pipeline...">${descLines.join('\\n')}</textarea>
        </div>
    `;
    elements.projectsContainer.appendChild(div);
}

// Add Skill Entry
function addSkillEntry(data = null) {
    const div = document.createElement('div');
    div.className = 'skill-category';
    div.innerHTML = `
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Remove</button>
        <div class="form-group">
            <label>Category</label>
            <input type="text" name="skill-category[]" class="form-control" placeholder="e.g., Programming Languages" value="${data?.category || ''}">
        </div>
        <div class="form-group">
            <label>Skills (comma-separated)</label>
            <input type="text" name="skill-items[]" class="form-control" placeholder="Python, JavaScript, Java" value="${data?.skills || ''}">
        </div>
    `;
    elements.skillsContainer.appendChild(div);
}

// Handle Save Resume
// Build a normalized resume object from the editor form.
// Used for both Save and Export Draft.
function newResumeId() {
    return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildResumeFromFormData(formData) {
    const now = new Date().toISOString();
    const createdAt = (editingResumeSnapshot && editingResumeSnapshot.createdAt) ? editingResumeSnapshot.createdAt : now;

    const resumeName = (formData.get('resumeName') || '').trim();
    const personalName = (formData.get('name') || '').trim();

    // Build resume object matching backend schema EXACTLY
    const resume = {
        id: editingResumeId || newResumeId(),
        name: resumeName || personalName || 'Untitled Resume',
        createdAt,
        updatedAt: now,
        personalInfo: {
            name: formData.get('name') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            location: formData.get('location') || '',
            linkedin: formData.get('linkedin') || '',
            github: formData.get('github') || '',
            website: formData.get('portfolio') || '',  // Maps portfolio → website
            summary: formData.get('summary') || ''
        },
        experience: [],
        education: [],
        projects: [],
        skills: [],
        certifications: []
    };

    // Experience - Backend expects: company, position, location, description (required)
    const expEmployers = formData.getAll('exp-employer[]');
    expEmployers.forEach((employer, i) => {
        const company = (employer || '').trim();
        const position = (formData.getAll('exp-role[]')[i] || '').trim();

        // Only add if BOTH company AND position are non-empty (backend validation)
        if (company && position) {
            const desc = formData.getAll('exp-desc[]')[i] || '';
            const description = desc.split('\n')
                .map(line => line.trim())
                .filter(line => line)
                .map(line => line.replace(/^[•\-\*]\s*/, ''));

            // Backend requires min_items=1 for description
            if (description.length > 0) {
                resume.experience.push({
                    company: company,
                    position: position,
                    location: '',  // Optional but included
                    startDate: formData.getAll('exp-start[]')[i] || '',
                    endDate: formData.getAll('exp-end[]')[i] || '',
                    description: description
                });
            }
        }
    });

    // Education - Backend expects: institution, degree, startDate, endDate (required)
    const eduInstitutions = formData.getAll('edu-institution[]');
    eduInstitutions.forEach((institution, i) => {
        const inst = (institution || '').trim();
        const deg = (formData.getAll('edu-degree[]')[i] || '').trim();

        if (inst && deg) {
            const coursework = (formData.getAll('edu-coursework[]')[i] || '')
                .split(',')
                .map(s => s.trim())
                .filter(s => s);

            resume.education.push({
                institution: inst,
                degree: deg,
                field: '',  // Optional
                startDate: formData.getAll('edu-start[]')[i] || '',
                endDate: formData.getAll('edu-end[]')[i] || '',
                gpa: '',  // Optional
                achievements: coursework  // Backend accepts "coursework" via alias
            });
        }
    });

    // Projects - Backend expects: name, description (string, min 1 char)
    const projNames = formData.getAll('proj-name[]');
    projNames.forEach((name, i) => {
        const projName = (name || '').trim();

        if (projName) {
            const desc = formData.getAll('proj-desc[]')[i] || '';
            const descLines = desc.split('\n')
                .map(line => line.trim())
                .filter(line => line)
                .map(line => line.replace(/^[•\-\*]\s*/, ''));

            // Backend coerces array → string, but let's send string directly
            const description = descLines.join(' ') || 'Project description';

            resume.projects.push({
                name: projName,
                description: description,  // String (backend validates min_length=1)
                technologies: [],  // Optional
                link: formData.getAll('proj-github[]')[i] || null,  // Backend accepts "github" alias
                highlights: descLines,  // Optional
                startDate: formData.getAll('proj-start[]')[i] || null,
                endDate: formData.getAll('proj-end[]')[i] || null
            });
        }
    });

    // Skills - Backend expects: List[str] with min 1 item
    // Backend coerces dict/object → List[str] automatically
    const skillCategories = formData.getAll('skill-category[]');
    const allSkills = [];

    skillCategories.forEach((category, i) => {
        if ((category || '').trim()) {
            const items = formData.getAll('skill-items[]')[i] || '';
            items.split(',')
                .map(s => s.trim())
                .filter(s => s)
                .forEach(skill => allSkills.push(skill));
        }
    });

    // Backend validates: at least 1 skill required
    resume.skills = allSkills.length > 0 ? allSkills : ['General Skills'];

    return resume;
}

async function handleSaveResume(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    const resume = buildResumeFromFormData(formData);

    // Save
    await storage.saveResume(resume);
    await storage.setCurrentProfile(resume.id);

    // Clear any autosaved draft now that the resume is saved
    await storage.clearResumeDraft(getDraftKey());

    closeModal();
    await loadResumes();
    showSuccess('Resume saved successfully!');
}

// Handle Delete Resume
async function handleDeleteResume() {
    if (!currentResume) return;

    if (confirm(`Delete resume "${currentResume.name}"?`)) {
        await storage.deleteResume(currentResume.id);
        currentResume = null;
        currentProfileId = null;
        await storage.setCurrentProfile(null);
        await loadResumes();
        elements.resumePreview.classList.add('hidden');
        updateCurrentProfileDisplay();
        showSuccess('Resume deleted');
    }
}

// Handle Export JSON
async function handleExportDraftJson() {
    try {
        const state = collectResumeFormState();
        if (!hasDraftContent(state)) {
            showError('Nothing to export yet');
            return;
        }

        const resume = buildResumeFromFormData(new FormData(elements.resumeForm));
        await storage.exportToJSON(resume);
        showSuccess('Draft exported!');
    } catch (err) {
        console.error('Export draft failed:', err);
        showError(err?.message || 'Could not export draft');
    }
}

async function handleExportJson() {
    if (!currentResume) return;
    await storage.exportToJSON(currentResume);
    showSuccess('Resume exported!');
}

// Handle Export All (Backup)
async function handleExportAll() {
    try {
        const resumes = await storage.getResumes();
        if (!resumes || Object.keys(resumes).length === 0) {
            showError('No resumes to export');
            return;
        }
        await storage.exportAllResumesToJSON();
        showSuccess('Backup exported!');
    } catch (err) {
        console.error('Export all failed:', err);
        showError('Could not export backup');
    }
}

// Handle Import (Backup)
async function handleImportResumes() {
    // Reset input so selecting the same file again still triggers change
    elements.importFileInput.value = '';
    elements.importFileInput.click();
}

async function handleImportFileChange(e) {
    const file = e.target?.files?.[0];
    if (!file) return;

    try {
        const text = await file.text();
        const summary = await storage.importResumesFromJSONText(text, { overwrite: false });

        await loadResumes();
        updateCurrentProfileDisplay();

        const msgParts = [
            `${summary.added} added`,
            summary.deduped ? `${summary.deduped} kept as copies` : null,
            summary.overwritten ? `${summary.overwritten} overwritten` : null
        ].filter(Boolean);

        showSuccess(`Import complete: ${msgParts.join(', ')}`);
    } catch (err) {
        console.error('Import failed:', err);
        showError(err?.message || 'Import failed');
    } finally {
        elements.importFileInput.value = '';
    }
}

// Clear stored resumes/history/drafts from this browser
async function handleClearStorage() {
    const ok = confirm('This will delete all resumes, tailoring history, and drafts stored in this browser. Continue?');
    if (!ok) return;

    try {
        await storage.clearStoredData({ keepSettings: true });

        currentResume = null;
        tailoredResume = null;
        currentProfileId = null;

        elements.resumePreview.classList.add('hidden');
        elements.jobDescription.value = '';
        updateTailorButton();

        await loadResumes();
        await loadHistory();
        updateCurrentProfileDisplay();

        showSuccess('Local data cleared');
    } catch (err) {
        console.error('Clear storage failed:', err);
        showError('Could not clear local data');
    }
}


// Handle Scrape
async function handleScrape() {
    try {
        elements.scrapeBtn.disabled = true;
        elements.scrapeBtn.textContent = '🔄 Scraping...';

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrape' });

        if (response && response.jobDescription) {
            elements.jobDescription.value = response.jobDescription;
            showSuccess('Job description scraped!');
        } else {
            showError('Could not scrape. Please paste manually.');
        }
    } catch (error) {
        console.error('Scrape error:', error);
        showError('Scraping failed. Please paste manually.');
    } finally {
        elements.scrapeBtn.disabled = false;
        elements.scrapeBtn.textContent = '🔍 Scrape from Current Page';
        updateTailorButton();
    }
}

// Update Tailor Button
function updateTailorButton() {
    const hasResume = currentResume !== null;
    const hasJD = elements.jobDescription.value.trim().length > 0;
    elements.tailorBtn.disabled = !(hasResume && hasJD);
}

// Handle Tailor
async function handleTailor() {
    if (!currentResume) {
        showError('Please select a resume first');
        return;
    }

    const jobDesc = elements.jobDescription.value.trim();
    if (!jobDesc) {
        showError('Please provide job description');
        return;
    }

    console.log('=== DEBUG: Current Resume Structure ===');
    console.log(JSON.stringify(currentResume, null, 2));
    console.log('=== END DEBUG ===');

    try {
        // Show loading
        elements.loading.classList.remove('hidden');
        elements.results.classList.add('hidden');
        elements.tailorBtn.disabled = true;
        hideMessages();

        // Call API
        const result = await api.tailorResume(currentResume, jobDesc);
        console.log('=== DEBUG: Tailoring Result ===');
        console.log(JSON.stringify(result, null, 2));
        console.log('=== END DEBUG ===');

        // Store tailored resume
        tailoredResume = result.tailoredResume;

        // Display results
        displayResults(result);

        elements.loading.classList.add('hidden');
        elements.results.classList.remove('hidden');
        showSuccess(`ATS Score: ${result.atsScore}/100`);

    } catch (error) {
        console.error('Tailor error:', error);
        elements.loading.classList.add('hidden');
        showError(error.message || 'Tailoring failed. Check backend connection.');
    } finally {
        elements.tailorBtn.disabled = false;
    }
}

// Display Results
function displayResults(result) {
    // ATS Score
    elements.atsScore.textContent = result.atsScore;

    // Matched Keywords
    elements.matchedCount.textContent = result.matchedKeywords.length;
    elements.matchedKeywords.innerHTML = '';
    result.matchedKeywords.forEach(keyword => {
        const span = document.createElement('span');
        span.className = 'keyword matched';
        span.textContent = keyword;
        elements.matchedKeywords.appendChild(span);
    });

    // Missing Keywords
    elements.missingCount.textContent = result.missingKeywords.length;
    elements.missingKeywords.innerHTML = '';
    result.missingKeywords.forEach(keyword => {
        const span = document.createElement('span');
        span.className = 'keyword missing';
        span.textContent = keyword;
        elements.missingKeywords.appendChild(span);
    });
}

// Handle Download PDF
async function handleDownloadPdf() {
    if (!tailoredResume) {
        showError('No tailored resume available');
        return;
    }

    try {
        elements.downloadPdfBtn.disabled = true;
        elements.downloadPdfBtn.textContent = '⏳ Generating PDF...';

        const pdfBlob = await api.generatePDF(tailoredResume);

        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const filename = `${currentResume.name.replace(/\s+/g, '_')}_${timestamp}.pdf`;

        await api.downloadPDF(pdfBlob, filename);

        // Add to history
        await storage.addToHistory({
            id: crypto.randomUUID(),
            resumeName: currentResume.name,
            jobTitle: 'Job Application',
            company: 'Company',
            atsScore: parseInt(elements.atsScore.textContent),
            timestamp: new Date().toISOString(),
            filename: filename
        });

        await loadHistory();
        showSuccess('PDF downloaded!');

    } catch (error) {
        console.error('PDF error:', error);
        showError(error.message || 'PDF generation failed');
    } finally {
        elements.downloadPdfBtn.disabled = false;
        elements.downloadPdfBtn.textContent = '📄 Download Tailored PDF';
    }
}

// Load History
async function loadHistory() {
    const history = await storage.getHistory();

    if (history.length === 0) {
        elements.historyList.innerHTML = '<p class="empty">No tailored resumes yet</p>';
        return;
    }

    elements.historyList.innerHTML = '';

    history.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'history-item';

        const date = new Date(entry.timestamp).toLocaleDateString();

        div.innerHTML = `
            <div class="history-info">
                <h4>${entry.resumeName}</h4>
                <p class="history-meta">Score: ${entry.atsScore}/100 • ${date}</p>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteHistory('${entry.id}')">Delete</button>
        `;

        elements.historyList.appendChild(div);
    });
}

// Delete History (global function for onclick)
window.deleteHistory = async function (id) {
    await storage.deleteFromHistory(id);
    await loadHistory();
    showSuccess('Deleted from history');
};

// Load Settings
async function loadSettings() {
    const settings = await storage.getSettings();
    elements.apiUrl.value = settings.apiUrl;
    elements.darkModeToggle.checked = settings.darkMode;

    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.add('dark');
    }
}

// Handle Save Settings
async function handleSaveSettings() {
    const settings = {
        apiUrl: elements.apiUrl.value,
        darkMode: elements.darkModeToggle.checked
    };

    await storage.saveSettings(settings);
    await api.init();

    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.remove('dark');
    }

    showSuccess('Settings saved!');
}

// Handle Test Connection
async function handleTestConnection() {
    try {
        elements.testConnectionBtn.disabled = true;
        elements.testConnectionBtn.textContent = 'Testing...';

        const isHealthy = await api.checkHealth();

        if (isHealthy) {
            elements.connectionStatus.className = 'alert success';
            elements.connectionStatus.textContent = '✅ Backend connection successful!';
        } else {
            elements.connectionStatus.className = 'alert error';
            elements.connectionStatus.textContent = '❌ Cannot connect to backend';
        }

        elements.connectionStatus.classList.remove('hidden');

    } catch (error) {
        elements.connectionStatus.className = 'alert error';
        elements.connectionStatus.textContent = '❌ Connection failed';
        elements.connectionStatus.classList.remove('hidden');
    } finally {
        elements.testConnectionBtn.disabled = false;
        elements.testConnectionBtn.textContent = 'Test Connection';

        setTimeout(() => {
            elements.connectionStatus.classList.add('hidden');
        }, 5000);
    }
}

// Show Success Message
function showSuccess(message) {
    elements.successMsg.textContent = message;
    elements.successMsg.classList.remove('hidden');
    elements.errorMsg.classList.add('hidden');

    setTimeout(() => {
        elements.successMsg.classList.add('hidden');
    }, 5000);
}

// Show Error Message
function showError(message) {
    elements.errorMsg.textContent = message;
    elements.errorMsg.classList.remove('hidden');
    elements.successMsg.classList.add('hidden');

    setTimeout(() => {
        elements.errorMsg.classList.add('hidden');
    }, 5000);
}

// Hide Messages
function hideMessages() {
    elements.errorMsg.classList.add('hidden');
    elements.successMsg.classList.add('hidden');
}