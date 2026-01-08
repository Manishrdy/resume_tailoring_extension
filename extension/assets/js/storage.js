// assets/js/storage.js - Chrome Storage Wrapper (Prod)
// Persists data in chrome.storage.local (on-device, browser-managed).
// Adds: full backup export/import + clear stored data.

const storage = (() => {
    'use strict';

    const KEYS = Object.freeze({
        resumes: 'resumes',
        currentProfile: 'currentProfile',
        settings: 'settings',
        history: 'history',
        resumeDrafts: 'resumeDrafts'
    });

    const BACKUP_FORMAT_VERSION = 1;

    function nowISO() {
        return new Date().toISOString();
    }

    function safeString(x) {
        return (typeof x === 'string' ? x : '').trim();
    }

    function hasCryptoUUID() {
        return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
    }

    function newId() {
        return hasCryptoUUID()
            ? crypto.randomUUID()
            : `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }

    function normalizeResumeShape(resume) {
        // Make imports resilient across versions / partial data.
        // We won't "validate hard" here – we'll keep data and let the UI edit it.
        const r = (resume && typeof resume === 'object') ? resume : {};

        const personal = (r.personalInfo && typeof r.personalInfo === 'object') ? r.personalInfo : {};
        const experience = Array.isArray(r.experience) ? r.experience : [];
        const education = Array.isArray(r.education) ? r.education : [];
        const projects = Array.isArray(r.projects) ? r.projects : [];

        // Skills can be stored either as object {category:[...]} (current) or as array [{category, skills}]
        // OR as flat array (new backend format)
        let skills = r.skills;
        if (!skills) skills = {};

        // NEW: Handle flat array from backend
        if (Array.isArray(skills) && skills.length > 0 && typeof skills[0] === 'string') {
            // Flat array like ["Python", "JavaScript", "FastAPI"]
            // Group into categories for display
            const obj = {};
            const chunkSize = 5;
            for (let i = 0; i < skills.length; i += chunkSize) {
                const chunk = skills.slice(i, i + chunkSize);
                const categoryName = i === 0 ? 'Primary Skills' : `Skills ${Math.floor(i / chunkSize) + 1}`;
                obj[categoryName] = chunk;
            }
            skills = obj;
        } else if (Array.isArray(skills)) {
            // OLD: Array of objects like [{category: "Languages", skills: "Python, Java"}]
            const obj = {};
            for (const item of skills) {
                const cat = safeString(item?.category);
                const items = item?.skills;
                if (!cat) continue;
                if (Array.isArray(items)) obj[cat] = items.map(safeString).filter(Boolean);
                else obj[cat] = safeString(items).split(',').map(s => s.trim()).filter(Boolean);
            }
            skills = obj;
        } else if (typeof skills !== 'object') {
            skills = {};
        }

        return {
            id: safeString(r.id) || newId(),
            name: safeString(r.name) || safeString(r.resumeName) || safeString(personal.name) || 'Untitled Resume',
            createdAt: safeString(r.createdAt) || nowISO(),
            updatedAt: safeString(r.updatedAt) || nowISO(),
            personalInfo: {
                name: safeString(personal.name),
                email: safeString(personal.email),
                phone: safeString(personal.phone),
                location: safeString(personal.location),
                linkedin: safeString(personal.linkedin),
                portfolio: safeString(personal.portfolio) || safeString(personal.website),  // FIX: Accept both
                github: safeString(personal.github),
                summary: safeString(personal.summary)
            },
            experience: experience.map(e => ({
                employer: safeString(e?.employer) || safeString(e?.company),  // FIX: Accept both
                role: safeString(e?.role) || safeString(e?.position),         // FIX: Accept both
                startDate: safeString(e?.startDate),
                endDate: safeString(e?.endDate),
                description: Array.isArray(e?.description)
                    ? e.description.map(safeString).filter(Boolean)
                    : safeString(e?.description).split('\n').map(s => s.trim()).filter(Boolean)
            })),
            education: education.map(e => ({
                institution: safeString(e?.institution),
                degree: safeString(e?.degree),
                startDate: safeString(e?.startDate),
                endDate: safeString(e?.endDate),
                coursework: Array.isArray(e?.coursework) ? e.coursework.map(safeString).filter(Boolean) :
                    Array.isArray(e?.achievements) ? e.achievements.map(safeString).filter(Boolean) :  // FIX: Accept both
                        safeString(e?.coursework || e?.achievements).split(',').map(s => s.trim()).filter(Boolean)
            })),
            projects: projects.map(p => {
                // Handle description as string or array or from highlights
                let description = [];
                if (Array.isArray(p?.description)) {
                    description = p.description.map(safeString).filter(Boolean);
                } else if (typeof p?.description === 'string' && p.description) {
                    description = p.description.split('. ').map(s => s.trim()).filter(Boolean);
                } else if (Array.isArray(p?.highlights)) {
                    description = p.highlights.map(safeString).filter(Boolean);
                }

                return {
                    name: safeString(p?.name),
                    github: safeString(p?.github) || safeString(p?.link),  // FIX: Accept both
                    startDate: safeString(p?.startDate),
                    endDate: safeString(p?.endDate),
                    description: description
                };
            }),
            skills,
            certifications: Array.isArray(r.certifications) ? r.certifications : []
        };
    }

    function coerceImportedResumes(parsed) {
        // Accepts:
        // 1) Single resume object (old export)
        // 2) Backup wrapper { app, version, resumes: [...] | {id: resume} }
        // 3) Raw array of resumes
        if (!parsed) return [];

        if (Array.isArray(parsed)) return parsed;

        if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.resumes)) return parsed.resumes;
            if (parsed.resumes && typeof parsed.resumes === 'object') return Object.values(parsed.resumes);
            // Heuristic: looks like a resume
            if (parsed.personalInfo || parsed.experience || parsed.education || parsed.projects) return [parsed];
        }

        return [];
    }

    async function getObject(key) {
        const result = await chrome.storage.local.get(key);
        return result[key];
    }

    async function setObject(key, value) {
        await chrome.storage.local.set({ [key]: value });
    }

    // =========================
    // Public API
    // =========================
    return {
        KEYS,

        // -------- Resumes --------
        async getResumes() {
            return (await getObject(KEYS.resumes)) || {};
        },

        async saveResume(resume) {
            const resumes = await this.getResumes();
            const normalized = normalizeResumeShape(resume);

            normalized.updatedAt = nowISO();
            if (!normalized.createdAt) normalized.createdAt = normalized.updatedAt;

            resumes[normalized.id] = normalized;
            await setObject(KEYS.resumes, resumes);
            return normalized.id;
        },

        async deleteResume(id) {
            const resumes = await this.getResumes();
            delete resumes[id];
            await setObject(KEYS.resumes, resumes);

            const current = await this.getCurrentProfile();
            if (current === id) {
                await this.setCurrentProfile(null);
            }
        },

        // -------- Current profile --------
        async getCurrentProfile() {
            return (await getObject(KEYS.currentProfile)) || null;
        },

        async setCurrentProfile(id) {
            await setObject(KEYS.currentProfile, id || null);
        },

        // -------- Settings --------
        async getSettings() {
            return (await getObject(KEYS.settings)) || {
                apiUrl: 'http://localhost:8000',
                darkMode: false
            };
        },

        async saveSettings(settings) {
            await setObject(KEYS.settings, settings);
        },

        // -------- History --------
        async getHistory() {
            return (await getObject(KEYS.history)) || [];
        },

        async addToHistory(entry) {
            const history = await this.getHistory();
            history.unshift(entry);
            if (history.length > 50) history.splice(50);
            await setObject(KEYS.history, history);
        },

        async deleteFromHistory(id) {
            const history = await this.getHistory();
            await setObject(KEYS.history, history.filter(h => h.id !== id));
        },

        // -------- Single export --------
        async exportToJSON(resume) {
            const dataStr = JSON.stringify(resume, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            await chrome.downloads.download({
                url,
                filename: `${(resume?.name || 'resume').replace(/\s+/g, '_')}.json`,
                saveAs: true
            });

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },

        // -------- Backup export/import --------
        async exportAllResumesToJSON() {
            const resumes = await this.getResumes();
            const payload = {
                app: 'Resume Tailor AI',
                formatVersion: BACKUP_FORMAT_VERSION,
                exportedAt: nowISO(),
                resumes: Object.values(resumes)
            };

            const dataStr = JSON.stringify(payload, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const fname = `ResumeTailorAI_Backup_${new Date().toISOString().slice(0, 10)}.json`;

            await chrome.downloads.download({
                url,
                filename: fname,
                saveAs: true
            });

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },

        async importResumesFromJSONText(jsonText, { overwrite = false } = {}) {
            let parsed;
            try {
                parsed = JSON.parse(jsonText);
            } catch (e) {
                throw new Error('Invalid JSON file.');
            }

            const importedRaw = coerceImportedResumes(parsed);
            if (!importedRaw.length) {
                throw new Error('No resumes found in this JSON file.');
            }

            const imported = importedRaw.map(normalizeResumeShape);

            const existing = await this.getResumes();
            const next = { ...existing };

            let added = 0;
            let overwritten = 0;
            let deduped = 0;

            const existingIds = new Set(Object.keys(existing));

            for (const r of imported) {
                const incomingId = r.id || newId();

                if (!existingIds.has(incomingId)) {
                    next[incomingId] = { ...r, id: incomingId, updatedAt: nowISO() };
                    existingIds.add(incomingId);
                    added++;
                    continue;
                }

                if (overwrite) {
                    next[incomingId] = { ...r, id: incomingId, updatedAt: nowISO() };
                    overwritten++;
                    continue;
                }

                // Conflict and overwrite=false: create new ID (keep both)
                const newResumeId = newId();
                next[newResumeId] = { ...r, id: newResumeId, name: `${r.name} (imported)`, updatedAt: nowISO() };
                existingIds.add(newResumeId);
                deduped++;
            }

            await setObject(KEYS.resumes, next);

            // If there is no current profile, pick the first resume after import
            const current = await this.getCurrentProfile();
            if (!current) {
                const firstId = Object.keys(next)[0] || null;
                if (firstId) await this.setCurrentProfile(firstId);
            }

            return { total: imported.length, added, overwritten, deduped };
        },

        // -------- Drafts (autosave) --------
        async getResumeDrafts() {
            return (await getObject(KEYS.resumeDrafts)) || {};
        },

        async getResumeDraft(key) {
            const drafts = await this.getResumeDrafts();
            return drafts[key] || null;
        },

        async saveResumeDraft(key, draft) {
            const drafts = await this.getResumeDrafts();
            drafts[key] = draft;
            await setObject(KEYS.resumeDrafts, drafts);
        },

        async clearResumeDraft(key) {
            const drafts = await this.getResumeDrafts();
            if (drafts[key]) {
                delete drafts[key];
                await setObject(KEYS.resumeDrafts, drafts);
            }
        },

        async clearAllResumeDrafts() {
            await chrome.storage.local.remove(KEYS.resumeDrafts);
        },

        // -------- Clear app data --------
        async clearStoredData({ keepSettings = true } = {}) {
            const keysToRemove = [KEYS.resumes, KEYS.currentProfile, KEYS.history, KEYS.resumeDrafts];
            if (!keepSettings) keysToRemove.push(KEYS.settings);
            await chrome.storage.local.remove(keysToRemove);
        }
    };
})();