/**
 * EduGrade — Academic & Grading Management System
 * Frontend Application Controller (Vanilla JS)
 */

const App = (() => {
    const state = {
        currentView: 'dashboard',
        sections: [],
        subjects: [],
        students: [],
        stats: {
            total_students: 0,
            total_sections: 0,
            total_subjects: 0,
            total_assignments: 0,
            total_grades: 0,
        },
        activeAssignSectionId: null,
        assignDraftMap: {},
        returnToModalAfterCreate: null,

        // Grading & Reports state
        gradingSectionId: null,
        gradingSubjectId: 'ALL',
        gradingQuarter: 'Q1',

        reportSectionId: null,
        reportQuarter: 'Q1',
    };

    const viewMeta = {
        dashboard: {
            title: 'Academic Overview',
            breadcrumb: 'Overview Dashboard',
        },
        sections: {
            title: 'Sections & Subject Assignments',
            breadcrumb: 'Sections & Curriculum',
        },
        subjects: {
            title: 'Subject Catalog Management',
            breadcrumb: 'Manage Subjects',
        },
        students: {
            title: 'Student Directory & Enrollment',
            breadcrumb: 'Manage Students',
        },
        grading: {
            title: 'Teacher Grade Input per Section',
            breadcrumb: 'Teacher Grade Sheet',
        },
        reports: {
            title: 'Quarterly Report, Weighted Ranking & Honor Pullout',
            breadcrumb: 'Automated Quarterly Ranking',
        },
    };

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatUnits(u) {
        const num = Number(u || 0);
        return Number.isInteger(num) ? String(num) : num.toFixed(1);
    }

    function excelColLetter(index) {
        // Starts at 'E' (ASCII 69) to match (((E21*4)+(F21*4)...)/28)
        const code = 69 + index;
        if (code <= 90) return String.fromCharCode(code);
        return 'C' + (index + 1);
    }

    function buildSectionFormulaString(assignedSubjects, rowNum = 21) {
        if (!assignedSubjects || assignedSubjects.length === 0) {
            return '(((E21*4)+(F21*4)+(G21*4)+(H21*4)+(I21*4)+(J21*3)+(K21*1)+(L21*4))/28)';
        }
        let totalUnits = 0;
        const terms = assignedSubjects.map((sub, idx) => {
            const col = excelColLetter(idx);
            const u = Number(sub.units || 0);
            totalUnits += u;
            return `(${col}${rowNum}*${formatUnits(u)})`;
        });
        return `((${terms.join('+')})/${formatUnits(totalUnits)})`;
    }

    /**
     * Computes student subject grades, weighted average, lowest grade, and honor qualification
     * for a given section and quarter ('Q1' | 'Q2' | 'Q3' | 'Q4' | 'FINAL').
     * Formula: SUM(SubjectGrade_i * Units_i) / SUM(Units_i)
     */
    function computeSectionStandings(sectionId, quarter = 'Q1') {
        const section = state.sections.find(s => s.id === Number(sectionId));
        if (!section) return null;

        const subjects = section.assigned_subjects || [];
        const totalSectionUnits = subjects.reduce((acc, s) => acc + Number(s.units || 0), 0);
        const sectionStudents = state.students.filter(st => st.section_id === section.id);

        const rows = sectionStudents.map((student, idx) => {
            const studentGradesObj = student.grades || {};
            const subjectResults = [];
            let weightedSum = 0;
            let gradedUnits = 0;
            let gradedCount = 0;
            let minGrade = null;
            let minGradeSubject = null;
            let hasBelow85 = false;
            const below85Subjects = [];

            subjects.forEach((sub, sIdx) => {
                const subId = Number(sub.subject_id);
                const units = Number(sub.units || 0);
                const subQuarters = studentGradesObj[subId] || {};

                let gradeVal = null;
                if (quarter === 'FINAL') {
                    const qVals = ['Q1', 'Q2', 'Q3', 'Q4']
                        .map(q => subQuarters[q])
                        .filter(v => v !== undefined && v !== null && !isNaN(Number(v)));
                    if (qVals.length > 0) {
                        gradeVal = qVals.reduce((a, b) => Number(a) + Number(b), 0) / qVals.length;
                    }
                } else {
                    const raw = subQuarters[quarter];
                    if (raw !== undefined && raw !== null && !isNaN(Number(raw))) {
                        gradeVal = Number(raw);
                    }
                }

                const weightedProduct = gradeVal !== null ? gradeVal * units : null;
                if (gradeVal !== null) {
                    weightedSum += weightedProduct;
                    gradedUnits += units;
                    gradedCount++;
                    if (minGrade === null || gradeVal < minGrade) {
                        minGrade = gradeVal;
                        minGradeSubject = sub.subject_code;
                    }
                    if (gradeVal < 85) {
                        hasBelow85 = true;
                        below85Subjects.push(`${sub.subject_code} (${gradeVal.toFixed(0)})`);
                    }
                }

                subjectResults.push({
                    subject_id: subId,
                    subject_code: sub.subject_code,
                    subject_name: sub.subject_name,
                    units,
                    col_letter: excelColLetter(sIdx),
                    grade: gradeVal,
                    weighted_product: weightedProduct,
                    q1: subQuarters.Q1 ?? null,
                    q2: subQuarters.Q2 ?? null,
                    q3: subQuarters.Q3 ?? null,
                    q4: subQuarters.Q4 ?? null,
                });
            });

            const isComplete = subjects.length > 0 && gradedCount === subjects.length;
            // Divisor is total section units if complete, or gradedUnits for partial preview
            const divisorUnits = isComplete ? totalSectionUnits : gradedUnits;
            const weightedAverage = divisorUnits > 0 ? weightedSum / divisorUnits : null;

            // Qualification criteria:
            // 1) All assigned subjects graded
            // 2) No subject grade below 85 (all >= 85)
            // 3) Weighted average >= 90.00
            const isQualified =
                isComplete &&
                !hasBelow85 &&
                weightedAverage !== null &&
                weightedAverage >= 89.9999; // float-safe >= 90

            let statusReason = 'Incomplete Grades';
            let statusType = 'incomplete';
            if (isComplete && weightedAverage !== null) {
                if (isQualified) {
                    statusReason = 'Qualified (Avg ≥ 90 & No Grade < 85)';
                    statusType = 'qualified';
                } else if (hasBelow85 && weightedAverage >= 90) {
                    statusReason = `Has Grade < 85: ${below85Subjects.join(', ')}`;
                    statusType = 'below85';
                } else if (hasBelow85) {
                    statusReason = `Avg < 90 & Grade < 85 (${below85Subjects.join(', ')})`;
                    statusType = 'below_both';
                } else {
                    statusReason = `Average Below 90 (${weightedAverage.toFixed(2)})`;
                    statusType = 'below90';
                }
            } else if (subjects.length === 0) {
                statusReason = 'No Subjects Assigned to Section';
            }

            return {
                student,
                excel_row: 21 + idx,
                subjectResults,
                weightedSum,
                gradedUnits,
                totalSectionUnits,
                gradedCount,
                totalSubjects: subjects.length,
                isComplete,
                weightedAverage,
                minGrade,
                minGradeSubject,
                hasBelow85,
                below85Subjects,
                isQualified,
                statusReason,
                statusType,
                rank: null,
            };
        });

        // Sort by weightedAverage descending to assign ranks
        const rankedRows = [...rows].sort((a, b) => {
            if (a.weightedAverage === null && b.weightedAverage === null) {
                return a.student.full_name.localeCompare(b.student.full_name);
            }
            if (a.weightedAverage === null) return 1;
            if (b.weightedAverage === null) return -1;
            if (Math.abs(b.weightedAverage - a.weightedAverage) > 0.0001) {
                return b.weightedAverage - a.weightedAverage;
            }
            return a.student.full_name.localeCompare(b.student.full_name);
        });

        let currentRank = 0;
        let lastAvg = null;
        rankedRows.forEach((r, index) => {
            if (r.weightedAverage !== null) {
                if (lastAvg === null || Math.abs(r.weightedAverage - lastAvg) > 0.0001) {
                    currentRank = index + 1;
                    lastAvg = r.weightedAverage;
                }
                r.rank = currentRank;
            }
        });

        const qualifiers = rankedRows.filter(r => r.isQualified);

        return {
            section,
            quarter,
            subjects,
            totalSectionUnits,
            formulaString: buildSectionFormulaString(subjects, 21),
            rows,          // original alphabetical order
            rankedRows,    // sorted by rank
            qualifiers,    // pulled-out students with no grade < 85 and avg >= 90
        };
    }

    async function apiRequest(action, payload = null) {
        const isPost = payload !== null;
        const url = `api.php?action=${encodeURIComponent(action)}`;
        const options = {
            method: isPost ? 'POST' : 'GET',
            headers: {
                'Accept': 'application/json',
            },
        };
        if (isPost) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify({ action, ...payload });
        }

        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'An unexpected error occurred.');
        }
        return data;
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        const colors = {
            success: 'bg-slate-900 text-white border-emerald-500/40',
            error: 'bg-rose-950 text-white border-rose-500/50',
            info: 'bg-indigo-950 text-white border-indigo-400/40',
        };
        const iconHtml = type === 'error'
            ? `<svg class="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
            : `<svg class="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;

        toast.className = `toast-enter pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border ${colors[type] || colors.success} text-xs sm:text-sm font-medium`;
        toast.innerHTML = `
            ${iconHtml}
            <span class="flex-1 leading-snug">${escapeHtml(message)}</span>
            <button type="button" class="text-slate-400 hover:text-white p-1" aria-label="Close notification">&times;</button>
        `;

        toast.querySelector('button').addEventListener('click', () => toast.remove());
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.2s ease';
                setTimeout(() => toast.remove(), 200);
            }
        }, 4000);
    }

    function applySystemState(data) {
        state.sections = data.sections || [];
        state.subjects = data.subjects || [];
        state.students = data.students || [];
        state.stats = data.stats || {
            total_students: 0,
            total_sections: 0,
            total_subjects: 0,
            total_assignments: 0,
            total_grades: 0,
        };

        // Default active section for Grading and Reports if none set or deleted
        if (state.sections.length > 0) {
            if (!state.gradingSectionId || !state.sections.some(s => s.id === Number(state.gradingSectionId))) {
                state.gradingSectionId = state.sections[0].id;
            }
            if (!state.reportSectionId || !state.sections.some(s => s.id === Number(state.reportSectionId))) {
                state.reportSectionId = state.sections[0].id;
            }
        } else {
            state.gradingSectionId = null;
            state.reportSectionId = null;
        }

        renderAll();
    }

    async function loadInitialData() {
        try {
            const data = await apiRequest('get_all');
            applySystemState(data);
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function switchView(viewName) {
        if (!viewMeta[viewName]) return;
        state.currentView = viewName;

        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.toggle('hidden', panel.id !== `view-${viewName}`);
        });

        document.querySelectorAll('.nav-btn').forEach(btn => {
            const isActive = btn.getAttribute('data-nav') === viewName;
            if (isActive) {
                btn.className = 'nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white shadow-sm shadow-brand-600/30 transition-all cursor-pointer';
            } else {
                btn.className = 'nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer';
            }
        });

        document.getElementById('headerTitle').textContent = viewMeta[viewName].title;
        document.getElementById('headerBreadcrumb').textContent = viewMeta[viewName].breadcrumb;

        closeMobileSidebar();
    }

    function openMobileSidebar() {
        document.getElementById('sidebar')?.classList.remove('-translate-x-full');
        document.getElementById('sidebarBackdrop')?.classList.remove('hidden');
    }

    function closeMobileSidebar() {
        document.getElementById('sidebar')?.classList.add('-translate-x-full');
        document.getElementById('sidebarBackdrop')?.classList.add('hidden');
    }

    function renderAll() {
        document.getElementById('statStudents').textContent = state.stats.total_students;
        document.getElementById('statSections').textContent = state.stats.total_sections;
        document.getElementById('statSubjects').textContent = state.stats.total_subjects;
        document.getElementById('statAssignments').textContent = state.stats.total_assignments;

        document.getElementById('navBadgeSections').textContent = state.stats.total_sections;
        document.getElementById('navBadgeSubjects').textContent = state.stats.total_subjects;
        document.getElementById('navBadgeStudents').textContent = state.stats.total_students;

        const isEmpty = state.sections.length === 0 && state.subjects.length === 0 && state.students.length === 0;
        document.getElementById('onboardingBanner').classList.toggle('hidden', !isEmpty);

        populateStudentSectionFilterDropdown();
        renderDashboard();
        renderSectionsView();
        renderSubjectsView();
        renderStudentsView();
        renderGradingView();
        renderReportsView();
    }

    function yearLevelBadgeClass(yearLevel) {
        const yl = String(yearLevel || '').toLowerCase();
        if (yl.includes('1st') || yl.includes('7')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        if (yl.includes('2nd') || yl.includes('8')) return 'bg-sky-50 text-sky-700 border-sky-200';
        if (yl.includes('3rd') || yl.includes('9') || yl.includes('11')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (yl.includes('4th') || yl.includes('10') || yl.includes('12')) return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }

    // ==================== RENDER DASHBOARD ====================
    function renderDashboard() {
        const secContainer = document.getElementById('dashboardSectionsList');
        const stuContainer = document.getElementById('dashboardStudentsList');

        if (state.sections.length === 0) {
            secContainer.innerHTML = `
                <div class="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                    <p class="text-sm font-semibold text-slate-700">No sections created yet</p>
                    <p class="text-xs text-slate-500 mt-1">Create a section or load the 28-unit demo data to test teacher grade input and weighted ranking.</p>
                    <div class="mt-3.5 flex items-center justify-center gap-2">
                        <button type="button" onclick="App.seedSampleData()" class="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer">
                            Load 28-Unit Demo &amp; Grades
                        </button>
                        <button type="button" onclick="App.openSectionModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition cursor-pointer">
                            + Create Section
                        </button>
                    </div>
                </div>
            `;
        } else {
            secContainer.innerHTML = state.sections.map(sec => {
                const standings = computeSectionStandings(sec.id, 'Q1');
                const qualCount = standings ? standings.qualifiers.length : 0;

                const subPills = sec.assigned_subjects.length > 0
                    ? sec.assigned_subjects.map((sub, idx) => `
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200/80 shadow-2xs">
                            <span class="text-[10px] font-mono font-bold text-slate-400">${excelColLetter(idx)}:</span>
                            <strong class="text-brand-700">${escapeHtml(sub.subject_code)}</strong>
                            <span class="text-slate-500 truncate max-w-[120px]">${escapeHtml(sub.subject_name)}</span>
                            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">*${formatUnits(sub.units)}u</span>
                        </span>
                    `).join('')
                    : `<span class="text-xs text-amber-600 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-lg">No subjects assigned yet</span>`;

                return `
                    <div class="p-4 rounded-xl border border-slate-200/80 hover:border-brand-300 transition bg-slate-50/40">
                        <div class="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h4 class="font-display font-bold text-slate-900 text-sm sm:text-base">${escapeHtml(sec.section_name)}</h4>
                                    <span class="px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${yearLevelBadgeClass(sec.year_level)}">
                                        ${escapeHtml(sec.year_level)}
                                    </span>
                                    <span class="text-xs text-slate-500">&bull; ${sec.student_count} student${sec.student_count === 1 ? '' : 's'}</span>
                                    <span class="text-xs text-slate-500">&bull; ${formatUnits(sec.total_units)} total units</span>
                                    ${qualCount > 0 ? `<span class="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800">${qualCount} Honor Qualifier${qualCount === 1 ? '' : 's'}</span>` : ''}
                                </div>
                                ${sec.adviser ? `<p class="text-xs text-slate-500 mt-0.5">Adviser: ${escapeHtml(sec.adviser)}</p>` : ''}
                            </div>
                            <div class="flex flex-wrap items-center gap-1.5">
                                <button type="button" onclick="App.openSectionGrading(${sec.id})" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition cursor-pointer">
                                    Input Grades
                                </button>
                                <button type="button" onclick="App.openSectionReport(${sec.id})" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer">
                                    Quarterly Ranking
                                </button>
                                <button type="button" onclick="App.openAssignSubjectsModal(${sec.id})" class="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer">
                                    Subjects (${sec.subject_count})
                                </button>
                            </div>
                        </div>
                        <div class="mt-3 flex flex-wrap gap-1.5">
                            ${subPills}
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (state.students.length === 0) {
            stuContainer.innerHTML = `
                <div class="text-center py-10 px-4">
                    <p class="text-sm font-semibold text-slate-700">No students enrolled yet</p>
                    <p class="text-xs text-slate-500 mt-1">Add your first student with their section and year level.</p>
                    <button type="button" onclick="App.openStudentModal()" class="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 transition cursor-pointer">
                        + Add Student
                    </button>
                </div>
            `;
        } else {
            const recent = [...state.students].slice(0, 6);
            stuContainer.innerHTML = recent.map(st => `
                <div class="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition">
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-900 truncate">${escapeHtml(st.full_name)}</p>
                        <div class="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <span class="font-mono text-[11px] text-slate-400">${escapeHtml(st.student_no)}</span>
                            <span>&bull;</span>
                            <span class="font-medium text-brand-600">${escapeHtml(st.section_name)}</span>
                            <span>(${escapeHtml(st.year_level)})</span>
                        </div>
                    </div>
                    <button type="button" onclick="App.openSectionGrading(${st.section_id})" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition cursor-pointer" title="Input grades for this student's section">
                        Grade
                    </button>
                </div>
            `).join('');
        }
    }

    // ==================== RENDER SECTIONS & SUBJECT ASSIGNMENTS ====================
    function renderSectionsView() {
        const container = document.getElementById('sectionsGridContainer');
        const query = (document.getElementById('sectionSearchInput')?.value || '').trim().toLowerCase();
        const yearFilter = document.getElementById('sectionYearFilter')?.value || '';

        const filtered = state.sections.filter(sec => {
            if (yearFilter && sec.year_level !== yearFilter) return false;
            if (!query) return true;
            const inName = sec.section_name.toLowerCase().includes(query);
            const inAdviser = (sec.adviser || '').toLowerCase().includes(query);
            const inYear = sec.year_level.toLowerCase().includes(query);
            const inSubjects = sec.assigned_subjects.some(
                s => s.subject_code.toLowerCase().includes(query) || s.subject_name.toLowerCase().includes(query)
            );
            return inName || inAdviser || inYear || inSubjects;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                    <h4 class="font-display font-bold text-slate-900 text-base">No sections found</h4>
                    <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">Create a section with its year level so you can assign subjects, enroll students, and compute quarterly rankings.</p>
                    <button type="button" onclick="App.openSectionModal()" class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition cursor-pointer">
                        + Create Section
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(sec => {
            const formulaStr = buildSectionFormulaString(sec.assigned_subjects, 21);

            const subjectsListHtml = sec.assigned_subjects.length > 0
                ? `<div class="divide-y divide-slate-100 border border-slate-200/80 rounded-xl bg-slate-50/50 overflow-hidden">
                    ${sec.assigned_subjects.map((sub, idx) => `
                        <div class="px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-white transition">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-[11px] font-mono font-bold text-slate-400">Col ${excelColLetter(idx)}</span>
                                    <span class="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/60">${escapeHtml(sub.subject_code)}</span>
                                    <span class="text-xs sm:text-sm font-medium text-slate-800 truncate">${escapeHtml(sub.subject_name)}</span>
                                    <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">*${formatUnits(sub.units)} unit${Number(sub.units) === 1 ? '' : 's'}</span>
                                </div>
                                ${(sub.schedule || sub.instructor) ? `
                                    <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                        ${sub.schedule ? `<span>${escapeHtml(sub.schedule)}</span>` : ''}
                                        ${sub.schedule && sub.instructor ? `<span>&bull;</span>` : ''}
                                        ${sub.instructor ? `<span>Teacher: ${escapeHtml(sub.instructor)}</span>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="flex items-center gap-1 shrink-0">
                                <button type="button" onclick="App.openSectionGrading(${sec.id}, ${sub.subject_id})" class="px-2 py-1 rounded text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition cursor-pointer" title="Input grades for this subject">
                                    Input Grades
                                </button>
                                <button type="button" onclick="App.unassignSingleSubject(${sec.id}, ${sub.subject_id})" class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer" title="Remove subject from this section">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                   </div>`
                : `<div class="rounded-xl border border-dashed border-slate-300 p-4 text-center bg-slate-50/50">
                        <p class="text-xs text-slate-500">No subjects assigned to <strong>${escapeHtml(sec.section_name)}</strong> yet.</p>
                        <button type="button" onclick="App.openAssignSubjectsModal(${sec.id})" class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer">
                            + Assign Subjects Now
                        </button>
                   </div>`;

            return `
                <div class="bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between p-5 hover:border-slate-300 transition">
                    <div>
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h3 class="font-display font-bold text-lg text-slate-900">${escapeHtml(sec.section_name)}</h3>
                                    <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full border ${yearLevelBadgeClass(sec.year_level)}">
                                        ${escapeHtml(sec.year_level)}
                                    </span>
                                </div>
                                <p class="text-xs text-slate-500 mt-1">
                                    ${sec.adviser ? `Adviser: <strong class="text-slate-700">${escapeHtml(sec.adviser)}</strong> &bull; ` : ''}
                                    <span>${sec.student_count} Student${sec.student_count === 1 ? '' : 's'}</span>
                                    &bull;
                                    <span>${sec.subject_count} Subject${sec.subject_count === 1 ? '' : 's'} (Divisor: <strong>${formatUnits(sec.total_units)} units</strong>)</span>
                                </p>
                            </div>

                            <div class="flex items-center gap-1">
                                <button type="button" onclick="App.openSectionModal(${sec.id})" class="p-2 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer" title="Edit section details">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                    </svg>
                                </button>
                                <button type="button" onclick="App.confirmDeleteSection(${sec.id})" class="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer" title="Delete section">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Section Formula Preview -->
                        <div class="mt-3 px-3 py-2 rounded-xl bg-slate-900 text-slate-200 text-[11px] flex items-center justify-between gap-2 overflow-x-auto">
                            <span class="text-slate-400 shrink-0">Formula:</span>
                            <code class="text-emerald-300 font-mono truncate">${escapeHtml(formulaStr)}</code>
                        </div>

                        <div class="mt-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Assigned Subjects (${sec.subject_count})</span>
                                <button type="button" onclick="App.openAssignSubjectsModal(${sec.id})" class="text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer">
                                    + Assign / Manage Subjects
                                </button>
                            </div>
                            ${subjectsListHtml}
                        </div>
                    </div>

                    <div class="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <button type="button" onclick="App.openStudentModal(null, ${sec.id})" class="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
                            + Add Student
                        </button>
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="App.openSectionGrading(${sec.id})" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer">
                                Teacher Grade Input
                            </button>
                            <button type="button" onclick="App.openSectionReport(${sec.id})" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition cursor-pointer">
                                Quarterly Report &amp; Ranking
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== RENDER SUBJECTS VIEW ====================
    function renderSubjectsView() {
        const tbody = document.getElementById('subjectsTableBody');
        const query = (document.getElementById('subjectSearchInput')?.value || '').trim().toLowerCase();

        const filtered = state.subjects.filter(sub => {
            if (!query) return true;
            return (
                sub.subject_code.toLowerCase().includes(query) ||
                sub.subject_name.toLowerCase().includes(query) ||
                (sub.description || '').toLowerCase().includes(query)
            );
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-12 px-5 text-center">
                        <p class="text-sm font-semibold text-slate-700">No subjects found</p>
                        <p class="text-xs text-slate-500 mt-1">Add subjects with their unit weight (e.g., 4, 3, 1) to compute section rankings.</p>
                        <button type="button" onclick="App.openSubjectModal()" class="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer">
                            + Add New Subject
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(sub => {
            const sectionsBadges = sub.assigned_sections.length > 0
                ? sub.assigned_sections.map(sec => `
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                        <span>${escapeHtml(sec.section_name)}</span>
                        <span class="text-[10px] text-indigo-500">(${escapeHtml(sec.year_level)})</span>
                    </span>
                `).join('')
                : `<span class="text-xs text-slate-400 italic">Not assigned to any section</span>`;

            return `
                <tr class="hover:bg-slate-50/80 transition">
                    <td class="py-3.5 px-5 align-top whitespace-nowrap">
                        <span class="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            ${escapeHtml(sub.subject_code)}
                        </span>
                    </td>
                    <td class="py-3.5 px-5 align-top">
                        <p class="font-semibold text-slate-900">${escapeHtml(sub.subject_name)}</p>
                        ${sub.description ? `<p class="text-xs text-slate-500 mt-0.5">${escapeHtml(sub.description)}</p>` : ''}
                    </td>
                    <td class="py-3.5 px-5 align-top text-center whitespace-nowrap">
                        <span class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            *${formatUnits(sub.units)} u
                        </span>
                    </td>
                    <td class="py-3.5 px-5 align-top">
                        <div class="flex flex-wrap gap-1.5">
                            ${sectionsBadges}
                        </div>
                    </td>
                    <td class="py-3.5 px-5 align-top text-right whitespace-nowrap">
                        <div class="inline-flex items-center gap-1">
                            <button type="button" onclick="App.openSubjectModal(${sub.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer" title="Edit Subject">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                </svg>
                            </button>
                            <button type="button" onclick="App.confirmDeleteSubject(${sub.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer" title="Delete Subject">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==================== RENDER STUDENTS VIEW ====================
    function populateStudentSectionFilterDropdown() {
        const select = document.getElementById('studentSectionFilter');
        if (!select) return;
        const currentVal = select.value;
        const optionsHtml = [`<option value="">All Sections</option>`];
        state.sections.forEach(sec => {
            optionsHtml.push(
                `<option value="${sec.id}">${escapeHtml(sec.section_name)} (${escapeHtml(sec.year_level)})</option>`
            );
        });
        select.innerHTML = optionsHtml.join('');
        if (currentVal && state.sections.some(s => String(s.id) === String(currentVal))) {
            select.value = currentVal;
        }
    }

    function renderStudentsView() {
        const tbody = document.getElementById('studentsTableBody');
        const query = (document.getElementById('studentSearchInput')?.value || '').trim().toLowerCase();
        const yearFilter = document.getElementById('studentYearFilter')?.value || '';
        const sectionFilter = document.getElementById('studentSectionFilter')?.value || '';

        const resetBtn = document.getElementById('resetStudentFiltersBtn');
        if (resetBtn) {
            resetBtn.classList.toggle('hidden', !query && !yearFilter && !sectionFilter);
        }

        const filtered = state.students.filter(st => {
            if (yearFilter && st.year_level !== yearFilter) return false;
            if (sectionFilter && String(st.section_id) !== String(sectionFilter)) return false;
            if (!query) return true;
            return (
                st.full_name.toLowerCase().includes(query) ||
                st.student_no.toLowerCase().includes(query) ||
                st.section_name.toLowerCase().includes(query) ||
                st.year_level.toLowerCase().includes(query)
            );
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-12 px-5 text-center">
                        <p class="text-sm font-semibold text-slate-700">No student records match your view</p>
                        <p class="text-xs text-slate-500 mt-1">Enroll a student and assign them to a section and year level.</p>
                        <button type="button" onclick="App.openStudentModal()" class="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition cursor-pointer">
                            + Add Student
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(st => {
            const statusClasses = {
                Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                Irregular: 'bg-amber-50 text-amber-700 border-amber-200',
                Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
            };

            const subjectBadges = st.assigned_subjects.length > 0
                ? st.assigned_subjects.map(sub => `
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200" title="${escapeHtml(sub.subject_name)}">
                        <span>${escapeHtml(sub.subject_code)}</span>
                        <span class="text-[10px] text-emerald-700 font-bold">*${formatUnits(sub.units)}</span>
                    </span>
                `).join('')
                : `<button type="button" onclick="App.openAssignSubjectsModal(${st.section_id})" class="text-xs text-amber-600 hover:underline cursor-pointer">No subjects assigned to section yet &rarr;</button>`;

            return `
                <tr class="hover:bg-slate-50/80 transition">
                    <td class="py-3.5 px-5 align-middle whitespace-nowrap">
                        <span class="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">${escapeHtml(st.student_no)}</span>
                    </td>
                    <td class="py-3.5 px-5 align-middle">
                        <p class="font-semibold text-slate-900">${escapeHtml(st.full_name)}</p>
                    </td>
                    <td class="py-3.5 px-5 align-middle whitespace-nowrap">
                        <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full border ${yearLevelBadgeClass(st.year_level)}">
                            ${escapeHtml(st.year_level)}
                        </span>
                    </td>
                    <td class="py-3.5 px-5 align-middle whitespace-nowrap">
                        <button type="button" onclick="App.openSectionGrading(${st.section_id})" class="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg text-xs border border-brand-200/70 transition cursor-pointer" title="Click to input grades for this section">
                            <span>${escapeHtml(st.section_name)}</span>
                        </button>
                    </td>
                    <td class="py-3.5 px-5 align-middle">
                        <div class="flex flex-wrap gap-1">
                            ${subjectBadges}
                        </div>
                    </td>
                    <td class="py-3.5 px-5 align-middle whitespace-nowrap">
                        <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusClasses[st.status] || statusClasses.Active}">
                            ${escapeHtml(st.status)}
                        </span>
                    </td>
                    <td class="py-3.5 px-5 align-middle text-right whitespace-nowrap">
                        <div class="inline-flex items-center gap-1">
                            <button type="button" onclick="App.openSectionGrading(${st.section_id})" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition cursor-pointer" title="Input Grades">
                                Grades
                            </button>
                            <button type="button" onclick="App.openStudentModal(${st.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer" title="Edit Student">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                </svg>
                            </button>
                            <button type="button" onclick="App.confirmDeleteStudent(${st.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer" title="Delete Student">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==================== VIEW 5: TEACHER GRADE INPUT PER SECTION ====================
    function openSectionGrading(sectionId, subjectId = 'ALL', quarter = null) {
        state.gradingSectionId = Number(sectionId);
        state.gradingSubjectId = subjectId ? String(subjectId) : 'ALL';
        if (quarter) state.gradingQuarter = quarter;
        switchView('grading');
        renderGradingView();
    }

    function setGradingQuarter(quarter) {
        state.gradingQuarter = quarter;
        const qSelect = document.getElementById('gradingQuarterSelect');
        if (qSelect) qSelect.value = quarter;
        renderGradingView();
    }

    function setGradingSubjectTab(subjectId) {
        state.gradingSubjectId = String(subjectId);
        const sSelect = document.getElementById('gradingSubjectSelect');
        if (sSelect) sSelect.value = String(subjectId);
        renderGradingView();
    }

    function updateSaveStatusBadge(status = 'saved') {
        const badge = document.getElementById('gradingSaveStatusBadge');
        if (!badge) return;
        if (status === 'saving') {
            badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200';
            badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span><span>Saving...</span>`;
        } else if (status === 'dirty') {
            badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300';
            badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span>Unsaved Changes</span>`;
        } else {
            badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200';
            badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>All Saved &#10003;</span>`;
        }
    }

    function openQuarterlyReportForActiveSection() {
        if (state.gradingSectionId) {
            state.reportSectionId = state.gradingSectionId;
            state.reportQuarter = state.gradingQuarter || 'Q1';
        }
        switchView('reports');
        renderReportsView();
    }

    function renderGradingView() {
        const secSelect = document.getElementById('gradingSectionSelect');
        const subSelect = document.getElementById('gradingSubjectSelect');
        const qtrSelect = document.getElementById('gradingQuarterSelect');
        const tabsContainer = document.getElementById('gradingSubjectTabs');
        const container = document.getElementById('gradingSheetContainer');
        if (!secSelect || !subSelect || !qtrSelect || !container) return;

        // Highlight active quarter tab button
        document.querySelectorAll('.qtr-tab-btn').forEach(btn => {
            const isAct = btn.getAttribute('data-qtr-btn') === state.gradingQuarter;
            btn.className = isAct
                ? 'qtr-tab-btn px-2.5 py-1 rounded-md text-[12px] font-bold bg-brand-600 text-white shadow-2xs transition cursor-pointer'
                : 'qtr-tab-btn px-2.5 py-1 rounded-md text-[12px] font-medium text-slate-600 hover:text-slate-900 transition cursor-pointer';
        });

        // Populate Sections dropdown
        if (state.sections.length === 0) {
            secSelect.innerHTML = `<option value="">No sections available</option>`;
            subSelect.innerHTML = `<option value="ALL">No subjects assigned</option>`;
            if (tabsContainer) tabsContainer.innerHTML = '';
            container.innerHTML = `
                <div class="p-10 text-center">
                    <p class="text-sm font-display font-bold text-slate-900">No Sections Available</p>
                    <p class="text-[12px] text-slate-500 mt-1">Create a section, assign subjects, and enroll students first—or load the 28-unit demo data.</p>
                    <div class="mt-3.5 flex justify-center gap-2">
                        <button type="button" onclick="App.seedSampleData()" class="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer">
                            Load 28-Unit Demo Data
                        </button>
                        <button type="button" onclick="App.openSectionModal()" class="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-brand-600 hover:bg-brand-700 cursor-pointer">
                            + Create Section
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        secSelect.innerHTML = state.sections.map(sec => `
            <option value="${sec.id}" ${Number(state.gradingSectionId) === sec.id ? 'selected' : ''}>
                ${escapeHtml(sec.section_name)} — ${escapeHtml(sec.year_level)} (${sec.student_count} students, ${formatUnits(sec.total_units)}u)
            </option>
        `).join('');

        const activeSection = state.sections.find(s => s.id === Number(state.gradingSectionId)) || state.sections[0];
        state.gradingSectionId = activeSection.id;
        qtrSelect.value = state.gradingQuarter;

        const assignedSubjects = activeSection.assigned_subjects || [];
        if (state.gradingSubjectId !== 'ALL' && !assignedSubjects.some(s => String(s.subject_id) === String(state.gradingSubjectId))) {
            state.gradingSubjectId = 'ALL';
        }

        // Populate Subject dropdown
        const subjectOptions = [
            `<option value="ALL" ${state.gradingSubjectId === 'ALL' ? 'selected' : ''}>All Subjects — Master Spreadsheet (${assignedSubjects.length})</option>`,
            ...assignedSubjects.map((sub, idx) => `
                <option value="${sub.subject_id}" ${String(state.gradingSubjectId) === String(sub.subject_id) ? 'selected' : ''}>
                    Col ${excelColLetter(idx)}: ${escapeHtml(sub.subject_code)} — ${escapeHtml(sub.subject_name)} (*${formatUnits(sub.units)}u)
                </option>
            `),
        ];
        subSelect.innerHTML = subjectOptions.join('');

        const standings = computeSectionStandings(activeSection.id, state.gradingQuarter);
        const totalStudentsCount = standings ? standings.rows.length : 0;

        // Render Clickable Subject Pill Tabs with completion counters
        if (tabsContainer) {
            let totalCells = totalStudentsCount * assignedSubjects.length;
            let filledCells = 0;
            const subTabBtns = assignedSubjects.map((sub, idx) => {
                const col = excelColLetter(idx);
                let subGradedCount = 0;
                if (standings) {
                    standings.rows.forEach(r => {
                        const sr = r.subjectResults.find(x => x.subject_id === Number(sub.subject_id));
                        if (sr && sr.grade !== null) {
                            subGradedCount++;
                            filledCells++;
                        }
                    });
                }
                const isCompleteSub = totalStudentsCount > 0 && subGradedCount === totalStudentsCount;
                const isSelected = String(state.gradingSubjectId) === String(sub.subject_id);

                return `
                    <button type="button" onclick="App.setGradingSubjectTab('${sub.subject_id}')"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition cursor-pointer ${
                            isSelected
                                ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }">
                        <span class="font-mono text-[10px] ${isSelected ? 'text-brand-200' : 'text-slate-400'}">${col}:</span>
                        <span>${escapeHtml(sub.subject_code)}</span>
                        <span class="text-[10px] ${isSelected ? 'text-amber-200' : 'text-emerald-700'}">*${formatUnits(sub.units)}u</span>
                        <span class="px-1.5 py-0.2 rounded-full text-[10px] ${
                            isSelected
                                ? 'bg-white/20 text-white'
                                : isCompleteSub
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-600'
                        }">${subGradedCount}/${totalStudentsCount}${isCompleteSub ? ' &#10003;' : ''}</span>
                    </button>
                `;
            });

            const isAllSelected = state.gradingSubjectId === 'ALL';
            tabsContainer.innerHTML = [
                `<button type="button" onclick="App.setGradingSubjectTab('ALL')"
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition cursor-pointer ${
                        isAllSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }">
                    <span>All Subjects Sheet</span>
                    <span class="px-1.5 py-0.2 rounded-full text-[10px] ${isAllSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-100 text-slate-600'}">
                        ${filledCells}/${totalCells}
                    </span>
                </button>`,
                ...subTabBtns,
            ].join('');
        }

        // Update Formula Banner
        const formulaStr = buildSectionFormulaString(assignedSubjects, 21);
        document.getElementById('gradingFormulaCode').textContent = formulaStr;
        document.getElementById('gradingMetaSummary').textContent =
            `${activeSection.section_name} (${activeSection.year_level}) • Divisor: ${formatUnits(activeSection.total_units)} units • Click any cell to inspect student formula`;

        if (assignedSubjects.length === 0) {
            container.innerHTML = `
                <div class="p-10 text-center">
                    <p class="text-sm font-display font-bold text-slate-900">No Subjects Assigned to ${escapeHtml(activeSection.section_name)}</p>
                    <p class="text-[12px] text-slate-500 mt-1">Assign subjects to this section first so teachers can input student grades.</p>
                    <button type="button" onclick="App.openAssignSubjectsModal(${activeSection.id})" class="mt-3.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-brand-600 hover:bg-brand-700 cursor-pointer">
                        + Assign Subjects to ${escapeHtml(activeSection.section_name)}
                    </button>
                </div>
            `;
            return;
        }

        if (!standings || standings.rows.length === 0) {
            container.innerHTML = `
                <div class="p-10 text-center">
                    <p class="text-sm font-display font-bold text-slate-900">No Students Enrolled in ${escapeHtml(activeSection.section_name)}</p>
                    <p class="text-[12px] text-slate-500 mt-1">Enroll students into ${escapeHtml(activeSection.section_name)} to start inputting their grades.</p>
                    <button type="button" onclick="App.openStudentModal(null, ${activeSection.id})" class="mt-3.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-brand-600 hover:bg-brand-700 cursor-pointer">
                        + Enroll Student in ${escapeHtml(activeSection.section_name)}
                    </button>
                </div>
            `;
            return;
        }

        // Filter students by search query inside the grade sheet
        const searchQ = (document.getElementById('gradingStudentSearchInput')?.value || '').trim().toLowerCase();
        const filteredRows = searchQ
            ? standings.rows.filter(r =>
                r.student.full_name.toLowerCase().includes(searchQ) ||
                r.student.student_no.toLowerCase().includes(searchQ)
              )
            : standings.rows;

        const filteredStandings = {
            ...standings,
            rows: filteredRows,
        };

        if (state.gradingSubjectId !== 'ALL') {
            renderSingleSubjectGradeSheet(container, activeSection, filteredStandings, Number(state.gradingSubjectId));
        } else {
            renderMasterSectionGradeSheet(container, activeSection, filteredStandings);
        }
    }

    function renderSingleSubjectGradeSheet(container, section, standings, subjectId) {
        const subIndex = section.assigned_subjects.findIndex(s => Number(s.subject_id) === subjectId);
        const sub = section.assigned_subjects[subIndex];
        if (!sub) return;
        const colLetter = excelColLetter(subIndex);

        const rowsHtml = standings.rows.map((row, rIdx) => {
            const st = row.student;
            const sr = row.subjectResults.find(r => r.subject_id === subjectId);
            const currentVal = sr && sr.grade !== null ? sr.grade : '';
            const weightedVal = sr && sr.weighted_product !== null ? sr.weighted_product.toFixed(1) : '—';
            const isBelow85 = sr && sr.grade !== null && sr.grade < 85;

            const presetChips = [85, 88, 90, 92, 95].map(p => `
                <button type="button" tabindex="-1"
                    onclick="App.setSingleStudentGrade(${st.id}, ${section.id}, ${subjectId}, ${p})"
                    class="px-1.5 py-0.5 rounded text-[10px] font-semibold border transition cursor-pointer ${
                        Number(currentVal) === p
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }">${p}</button>
            `).join('');

            return `
                <tr class="hover:bg-indigo-50/40 transition text-[12px]" id="singleRow_${st.id}" data-student-row="${st.id}">
                    <td class="py-2 px-3 font-mono text-[11px] text-slate-400">${colLetter}${row.excel_row}</td>
                    <td class="py-2 px-3 font-mono text-[11px] font-semibold text-slate-600">${escapeHtml(st.student_no)}</td>
                    <td class="py-2 px-3 font-semibold text-slate-900">${escapeHtml(st.full_name)}</td>
                    <td class="py-2 px-3 text-center">
                        <div class="inline-flex items-center justify-center gap-1.5">
                            <input type="number" step="0.01" min="50" max="100"
                                id="cell_${st.id}_${subjectId}"
                                data-grade-input="true"
                                data-row-idx="${rIdx}"
                                data-col-idx="0"
                                data-student-id="${st.id}"
                                data-section-id="${section.id}"
                                data-subject-id="${subjectId}"
                                data-quarter="${state.gradingQuarter}"
                                data-units="${sub.units}"
                                value="${currentVal !== '' ? Number(currentVal) : ''}"
                                placeholder="50-100"
                                onfocus="App.onGradeCellFocus(this)"
                                onblur="App.onGradeCellBlur(this)"
                                onkeydown="App.onGradeCellKeyDown(event, this)"
                                oninput="App.onLiveGradeCellInput(this)"
                                class="w-20 px-2 py-1 text-center font-bold text-[12px] rounded-lg border ${isBelow85 ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-300 bg-white text-slate-900'} focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 outline-none">
                            <div class="hidden sm:inline-flex items-center gap-1">
                                ${presetChips}
                            </div>
                        </div>
                    </td>
                    <td class="py-2 px-3 text-center font-mono text-[11px] font-semibold text-slate-700" data-weighted-cell="${st.id}">
                        ${weightedVal}
                    </td>
                    <td class="py-2 px-3 text-center" data-remark-cell="${st.id}">
                        ${renderSingleGradeBadge(sr?.grade)}
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-brand-600 text-white">Col ${colLetter}</span>
                    <h3 class="font-display font-bold text-slate-900 text-sm">${escapeHtml(sub.subject_code)} — ${escapeHtml(sub.subject_name)}</h3>
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">*${formatUnits(sub.units)} Units</span>
                    <span class="text-[11px] text-slate-500">
                        &bull; ${escapeHtml(section.section_name)} (${escapeHtml(state.gradingQuarter)})
                        ${sub.instructor ? `&bull; Teacher: <strong>${escapeHtml(sub.instructor)}</strong>` : ''}
                    </span>
                </div>
                <span class="text-[11px] text-slate-500">Type a grade or click a quick-preset chip (85–95)</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100/80 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            <th class="py-2 px-3">Cell</th>
                            <th class="py-2 px-3">Student ID</th>
                            <th class="py-2 px-3">Student Name</th>
                            <th class="py-2 px-3 text-center">${escapeHtml(state.gradingQuarter)} Grade (${colLetter}) &amp; Quick Presets</th>
                            <th class="py-2 px-3 text-center">Weighted (${colLetter}*${formatUnits(sub.units)})</th>
                            <th class="py-2 px-3 text-center">85+ Cutoff Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200/60 text-[12px]">
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderSingleGradeBadge(grade) {
        if (grade === null || grade === undefined || grade === '' || isNaN(Number(grade))) {
            return `<span class="text-[11px] text-slate-400 italic">Pending</span>`;
        }
        const g = Number(grade);
        if (g >= 90) {
            return `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">90+ Honor (${g.toFixed(0)})</span>`;
        }
        if (g >= 85) {
            return `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Passed ≥ 85 (${g.toFixed(0)})</span>`;
        }
        if (g >= 75) {
            return `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">Below 85 (${g.toFixed(0)})</span>`;
        }
        return `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Failed (&lt; 75)</span>`;
    }

    function renderMasterSectionGradeSheet(container, section, standings) {
        const subjects = section.assigned_subjects || [];
        const rankByStudentId = {};
        standings.rankedRows.forEach(r => {
            rankByStudentId[r.student.id] = r.rank;
        });

        const subjectHeadersHtml = subjects.map((sub, idx) => {
            const col = excelColLetter(idx);
            return `
                <th class="py-2 px-1.5 text-center min-w-[74px] border-l border-slate-200/70">
                    <button type="button" onclick="App.setGradingSubjectTab('${sub.subject_id}')" class="w-full text-center group cursor-pointer" title="Click to focus only on ${escapeHtml(sub.subject_code)} (${escapeHtml(sub.subject_name)})">
                        <div class="text-[10px] font-mono font-bold text-brand-600 group-hover:underline">${col}21*${formatUnits(sub.units)}</div>
                        <div class="text-[11px] font-bold text-slate-800 truncate">${escapeHtml(sub.subject_code)}</div>
                        <div class="text-[10px] font-medium text-emerald-700">${formatUnits(sub.units)}u</div>
                    </button>
                </th>
            `;
        }).join('');

        const bodyRowsHtml = standings.rows.map((row, rIdx) => {
            const st = row.student;
            const rank = rankByStudentId[st.id];
            const inputsHtml = row.subjectResults.map((sr, cIdx) => {
                const val = sr.grade !== null ? sr.grade : '';
                const below85 = sr.grade !== null && sr.grade < 85;
                return `
                    <td class="py-1.5 px-1 text-center border-l border-slate-100">
                        <input type="number" step="0.01" min="50" max="100"
                            id="cell_${st.id}_${sr.subject_id}"
                            data-grade-input="true"
                            data-row-idx="${rIdx}"
                            data-col-idx="${cIdx}"
                            data-student-id="${st.id}"
                            data-section-id="${section.id}"
                            data-subject-id="${sr.subject_id}"
                            data-quarter="${state.gradingQuarter}"
                            data-units="${sr.units}"
                            value="${val !== '' ? Number(val) : ''}"
                            placeholder="—"
                            onfocus="App.onGradeCellFocus(this)"
                            onblur="App.onGradeCellBlur(this)"
                            onkeydown="App.onGradeCellKeyDown(event, this)"
                            oninput="App.onMasterSheetCellInput(${st.id}, ${section.id})"
                            class="w-16 px-1.5 py-1 text-center font-semibold text-[12px] rounded-md border ${below85 ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-300 bg-white text-slate-900'} focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 outline-none">
                    </td>
                `;
            }).join('');

            const avgText = row.weightedAverage !== null ? row.weightedAverage.toFixed(2) : '—';
            const qualBadge = row.isQualified
                ? `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">QUALIFIED (≥90 &amp; No &lt;85)</span>`
                : `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium ${row.hasBelow85 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'}">${escapeHtml(row.statusReason)}</span>`;

            return `
                <tr class="hover:bg-indigo-50/30 transition text-[12px]" id="masterRow_${st.id}" data-excel-row="${row.excel_row}">
                    <td class="py-1.5 px-2 font-mono text-[11px] text-slate-400 whitespace-nowrap">#${row.excel_row}</td>
                    <td class="py-1.5 px-3 whitespace-nowrap sticky left-0 bg-white/95 backdrop-blur-xs z-10 border-r border-slate-200/70">
                        <div class="font-semibold text-slate-900 text-[12px]">${escapeHtml(st.full_name)}</div>
                        <div class="font-mono text-[10px] text-slate-400">${escapeHtml(st.student_no)}</div>
                    </td>
                    ${inputsHtml}
                    <td class="py-1.5 px-2 text-center font-mono text-[11px] text-slate-600 border-l border-slate-200/70" id="masterSum_${st.id}">
                        ${row.gradedCount > 0 ? `${row.weightedSum.toFixed(1)} / ${formatUnits(row.isComplete ? row.totalSectionUnits : row.gradedUnits)}` : '—'}
                    </td>
                    <td class="py-1.5 px-2 text-center border-l border-slate-200/70" id="masterAvg_${st.id}">
                        <span class="font-display font-bold text-[12px] ${row.weightedAverage !== null && row.weightedAverage >= 90 ? 'text-emerald-700' : 'text-slate-900'}">
                            ${avgText}
                        </span>
                    </td>
                    <td class="py-1.5 px-2 text-center border-l border-slate-200/70" id="masterRank_${st.id}">
                        ${rank ? `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${rank === 1 ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700'}">${rank}</span>` : '—'}
                    </td>
                    <td class="py-1.5 px-3 text-left border-l border-slate-200/70 whitespace-nowrap" id="masterQual_${st.id}">
                        ${qualBadge}
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <h3 class="font-display font-bold text-slate-900 text-sm">
                        Master Grade Sheet — ${escapeHtml(section.section_name)} (${escapeHtml(section.year_level)}) &bull; ${escapeHtml(state.gradingQuarter)}
                    </h3>
                    <span class="text-[11px] text-slate-500 hidden sm:inline">
                        &bull; Click any subject column header to switch to single-subject focus mode
                    </span>
                </div>
                <span class="text-[11px] text-slate-500">Divisor: <strong>${formatUnits(section.total_units)} Total Units</strong></span>
            </div>
            <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100/90 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            <th class="py-2 px-2">Row</th>
                            <th class="py-2 px-3 min-w-[165px] sticky left-0 bg-slate-100 z-10 border-r border-slate-200">Student</th>
                            ${subjectHeadersHtml}
                            <th class="py-2 px-2 text-center border-l border-slate-200">Sum / Units</th>
                            <th class="py-2 px-2 text-center border-l border-slate-200">Weighted Avg</th>
                            <th class="py-2 px-2 text-center border-l border-slate-200">Rank</th>
                            <th class="py-2 px-3 border-l border-slate-200">Honor Pullout Check</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200/60 text-[12px]">
                        ${bodyRowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Excel-like Keyboard Navigation (Enter, Up, Down, Left, Right)
    function onGradeCellKeyDown(event, inputEl) {
        const key = event.key;
        const rIdx = Number(inputEl.getAttribute('data-row-idx'));
        const cIdx = Number(inputEl.getAttribute('data-col-idx'));

        if (key === 'Enter' || key === 'ArrowDown') {
            event.preventDefault();
            const next = document.querySelector(
                `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx + 1}"][data-col-idx="${cIdx}"]`
            );
            if (next) {
                next.focus();
                next.select();
            }
        } else if (key === 'ArrowUp') {
            event.preventDefault();
            const prev = document.querySelector(
                `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx - 1}"][data-col-idx="${cIdx}"]`
            );
            if (prev) {
                prev.focus();
                prev.select();
            }
        } else if (key === 'ArrowRight' && state.gradingSubjectId === 'ALL') {
            const right = document.querySelector(
                `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx}"][data-col-idx="${cIdx + 1}"]`
            );
            if (right) {
                event.preventDefault();
                right.focus();
                right.select();
            }
        } else if (key === 'ArrowLeft' && state.gradingSubjectId === 'ALL') {
            const left = document.querySelector(
                `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx}"][data-col-idx="${cIdx - 1}"]`
            );
            if (left) {
                event.preventDefault();
                left.focus();
                left.select();
            }
        }
    }

    // Highlight active student row and display live evaluated formula in the fx bar
    function onGradeCellFocus(inputEl) {
        inputEl.select();
        const stId = Number(inputEl.getAttribute('data-student-id'));
        const secId = Number(inputEl.getAttribute('data-section-id'));
        updateActiveStudentFormulaBar(stId, secId);
    }

    function updateActiveStudentFormulaBar(studentId, sectionId) {
        const section = state.sections.find(s => s.id === Number(sectionId));
        const student = state.students.find(st => st.id === Number(studentId));
        if (!section || !student) return;

        const rowEl = document.getElementById(`masterRow_${studentId}`);
        const excelRow = rowEl ? rowEl.getAttribute('data-excel-row') : '21';

        const terms = [];
        let weightedSum = 0;
        let totalUnits = 0;

        section.assigned_subjects.forEach((sub, idx) => {
            const col = excelColLetter(idx);
            const u = Number(sub.units || 0);
            totalUnits += u;

            // Check live DOM input first, fallback to state
            const domInp = document.getElementById(`cell_${studentId}_${sub.subject_id}`);
            let gVal = null;
            if (domInp && domInp.value.trim() !== '' && !isNaN(Number(domInp.value))) {
                gVal = Number(domInp.value);
            } else {
                const saved = student.grades?.[sub.subject_id]?.[state.gradingQuarter];
                if (saved !== undefined && saved !== null) gVal = Number(saved);
            }

            if (gVal !== null) {
                weightedSum += gVal * u;
                terms.push(`(${gVal}*${formatUnits(u)})`);
            } else {
                terms.push(`(${col}${excelRow}*${formatUnits(u)})`);
            }
        });

        const avg = totalUnits > 0 ? (weightedSum / totalUnits).toFixed(2) : '0.00';
        const formulaCodeEl = document.getElementById('gradingFormulaCode');
        const metaSummaryEl = document.getElementById('gradingMetaSummary');

        if (formulaCodeEl) {
            formulaCodeEl.textContent = `((${terms.join('+')})/${formatUnits(totalUnits)}) = ${avg}`;
        }
        if (metaSummaryEl) {
            metaSummaryEl.innerHTML = `Active Student: <strong class="text-white">${escapeHtml(student.full_name)}</strong> (Row ${excelRow})`;
        }
    }

    // Auto-save single cell on blur when Auto-Save is enabled
    async function onGradeCellBlur(inputEl) {
        const autoSaveEnabled = document.getElementById('autoSaveGradesToggle')?.checked;
        if (!autoSaveEnabled) return;

        const val = inputEl.value.trim();
        const stId = Number(inputEl.getAttribute('data-student-id'));
        const secId = Number(inputEl.getAttribute('data-section-id'));
        const subId = Number(inputEl.getAttribute('data-subject-id'));
        const qtr = inputEl.getAttribute('data-quarter');

        const student = state.students.find(s => s.id === stId);
        const oldVal = student?.grades?.[subId]?.[qtr];
        const newNum = val !== '' && !isNaN(Number(val)) ? Number(val) : null;

        // Only send API call if the value actually changed
        if ((oldVal === undefined || oldVal === null) && newNum === null) return;
        if (oldVal !== undefined && newNum !== null && Math.abs(Number(oldVal) - newNum) < 0.001) return;

        if (newNum !== null && (newNum < 50 || newNum > 100)) {
            showToast(`Grade must be between 50 and 100.`, 'error');
            return;
        }

        updateSaveStatusBadge('saving');
        try {
            const res = await apiRequest('save_grades', {
                entries: [{
                    student_id: stId,
                    section_id: secId,
                    subject_id: subId,
                    quarter: qtr,
                    grade: val,
                }],
            });
            // Update state silently without losing current cursor focus
            state.sections = res.sections || state.sections;
            state.subjects = res.subjects || state.subjects;
            state.students = res.students || state.students;
            state.stats = res.stats || state.stats;
            updateSaveStatusBadge('saved');
        } catch (err) {
            updateSaveStatusBadge('dirty');
            showToast(err.message, 'error');
        }
    }

    async function setSingleStudentGrade(studentId, sectionId, subjectId, gradeVal) {
        const inp = document.getElementById(`cell_${studentId}_${subjectId}`);
        if (inp) {
            inp.value = gradeVal;
            onLiveGradeCellInput(inp);
            await onGradeCellBlur(inp);
            renderGradingView();
        }
    }

    async function quickFillEmptyGrades(gradeVal) {
        const inputs = Array.from(document.querySelectorAll('#gradingSheetContainer input[data-grade-input="true"]'));
        const emptyInputs = inputs.filter(inp => inp.value.trim() === '');
        if (emptyInputs.length === 0) {
            showToast('All grade cells in this view already have grades.', 'info');
            return;
        }

        emptyInputs.forEach(inp => {
            inp.value = gradeVal;
            if (state.gradingSubjectId !== 'ALL') {
                onLiveGradeCellInput(inp);
            } else {
                const stId = Number(inp.getAttribute('data-student-id'));
                const secId = Number(inp.getAttribute('data-section-id'));
                onMasterSheetCellInput(stId, secId);
            }
        });

        await saveCurrentGradesSheet();
    }

    function onLiveGradeCellInput(inputEl) {
        updateSaveStatusBadge('dirty');
        const stId = Number(inputEl.getAttribute('data-student-id'));
        const secId = Number(inputEl.getAttribute('data-section-id'));
        const units = Number(inputEl.getAttribute('data-units') || 0);
        const val = inputEl.value.trim();
        const num = val !== '' && !isNaN(Number(val)) ? Number(val) : null;

        inputEl.classList.toggle('border-amber-400', num !== null && num < 85);
        inputEl.classList.toggle('bg-amber-50', num !== null && num < 85);

        const weightedCell = document.querySelector(`[data-weighted-cell="${stId}"]`);
        if (weightedCell) {
            weightedCell.textContent = num !== null ? (num * units).toFixed(1) : '—';
        }
        const remarkCell = document.querySelector(`[data-remark-cell="${stId}"]`);
        if (remarkCell) {
            remarkCell.innerHTML = renderSingleGradeBadge(num);
        }
        updateActiveStudentFormulaBar(stId, secId);
    }

    function onMasterSheetCellInput(studentId, sectionId) {
        updateSaveStatusBadge('dirty');
        const section = state.sections.find(s => s.id === Number(sectionId));
        if (!section) return;
        const totalSectionUnits = section.assigned_subjects.reduce((a, s) => a + Number(s.units || 0), 0);

        const rowEl = document.getElementById(`masterRow_${studentId}`);
        if (!rowEl) return;

        const inputs = Array.from(rowEl.querySelectorAll('input[data-grade-input="true"]'));
        let weightedSum = 0;
        let gradedUnits = 0;
        let gradedCount = 0;
        let hasBelow85 = false;
        const below85Codes = [];

        inputs.forEach((inp, idx) => {
            const raw = inp.value.trim();
            const units = Number(inp.getAttribute('data-units') || 0);
            const subCode = section.assigned_subjects[idx]?.subject_code || `S${idx + 1}`;
            if (raw !== '' && !isNaN(Number(raw))) {
                const g = Number(raw);
                weightedSum += g * units;
                gradedUnits += units;
                gradedCount++;
                const isLow = g < 85;
                inp.classList.toggle('border-amber-400', isLow);
                inp.classList.toggle('bg-amber-50', isLow);
                if (isLow) {
                    hasBelow85 = true;
                    below85Codes.push(`${subCode} (${g})`);
                }
            } else {
                inp.classList.remove('border-amber-400', 'bg-amber-50');
            }
        });

        const isComplete = inputs.length > 0 && gradedCount === inputs.length;
        const divisor = isComplete ? totalSectionUnits : gradedUnits;
        const avg = divisor > 0 ? weightedSum / divisor : null;

        const sumCell = document.getElementById(`masterSum_${studentId}`);
        if (sumCell) {
            sumCell.textContent = gradedCount > 0 ? `${weightedSum.toFixed(1)} / ${formatUnits(divisor)}` : '—';
        }

        const avgCell = document.getElementById(`masterAvg_${studentId}`);
        if (avgCell) {
            avgCell.innerHTML = `<span class="font-display font-bold text-[12px] ${avg !== null && avg >= 90 ? 'text-emerald-700' : 'text-slate-900'}">${avg !== null ? avg.toFixed(2) : '—'}</span>`;
        }

        const qualCell = document.getElementById(`masterQual_${studentId}`);
        if (qualCell) {
            if (!isComplete) {
                qualCell.innerHTML = `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">Incomplete (${gradedCount}/${inputs.length})</span>`;
            } else if (!hasBelow85 && avg !== null && avg >= 89.9999) {
                qualCell.innerHTML = `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">QUALIFIED (≥90 &amp; No &lt;85)</span>`;
            } else if (hasBelow85) {
                qualCell.innerHTML = `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">Has Grade &lt; 85: ${escapeHtml(below85Codes.join(', '))}</span>`;
            } else {
                qualCell.innerHTML = `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">Average Below 90 (${avg.toFixed(2)})</span>`;
            }
        }

        updateActiveStudentFormulaBar(studentId, sectionId);
    }

    async function saveCurrentGradesSheet() {
        const inputs = Array.from(document.querySelectorAll('#gradingSheetContainer input[data-grade-input="true"]'));
        if (inputs.length === 0) {
            showToast('No grade inputs to save.', 'info');
            return;
        }

        const entries = [];
        for (const inp of inputs) {
            const val = inp.value.trim();
            if (val !== '') {
                const num = Number(val);
                if (isNaN(num) || num < 50 || num > 100) {
                    inp.focus();
                    showToast(`Invalid grade "${val}". Please enter a grade between 50 and 100.`, 'error');
                    return;
                }
            }
            entries.push({
                student_id: Number(inp.getAttribute('data-student-id')),
                section_id: Number(inp.getAttribute('data-section-id')),
                subject_id: Number(inp.getAttribute('data-subject-id')),
                quarter: inp.getAttribute('data-quarter'),
                grade: val,
            });
        }

        const saveBtn = document.getElementById('saveGradesBtn');
        if (saveBtn) saveBtn.disabled = true;
        updateSaveStatusBadge('saving');

        try {
            const res = await apiRequest('save_grades', { entries });
            applySystemState(res);
            updateSaveStatusBadge('saved');
            showToast(res.message, 'success');
        } catch (err) {
            updateSaveStatusBadge('dirty');
            showToast(err.message, 'error');
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    // ==================== VIEW 6: AUTOMATED QUARTERLY REPORT, RANKING & PULLOUT ====================
    function openSectionReport(sectionId, quarter = 'Q1') {
        state.reportSectionId = Number(sectionId);
        state.reportQuarter = quarter || 'Q1';
        switchView('reports');
        renderReportsView();
    }

    function openGradingForReportSection() {
        if (state.reportSectionId) {
            state.gradingSectionId = state.reportSectionId;
            if (state.reportQuarter !== 'FINAL') {
                state.gradingQuarter = state.reportQuarter;
            }
        }
        switchView('grading');
        renderGradingView();
    }

    function renderReportsView() {
        const secSelect = document.getElementById('reportSectionSelect');
        const qtrSelect = document.getElementById('reportQuarterSelect');
        const container = document.getElementById('quarterlyReportContainer');
        if (!secSelect || !qtrSelect || !container) return;

        if (state.sections.length === 0) {
            secSelect.innerHTML = `<option value="">No sections available</option>`;
            container.innerHTML = `
                <div class="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
                    <h3 class="font-display font-bold text-slate-900 text-base">No Sections Available for Quarterly Report</h3>
                    <p class="text-xs text-slate-500 mt-1">Load the 28-unit sample curriculum and grades to see automated section rankings and the Honor Qualifier pullout.</p>
                    <button type="button" onclick="App.seedSampleData()" class="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                        Load 28-Unit Demo &amp; Sample Grades
                    </button>
                </div>
            `;
            return;
        }

        secSelect.innerHTML = state.sections.map(sec => `
            <option value="${sec.id}" ${Number(state.reportSectionId) === sec.id ? 'selected' : ''}>
                ${escapeHtml(sec.section_name)} — ${escapeHtml(sec.year_level)} (${formatUnits(sec.total_units)} units)
            </option>
        `).join('');

        const activeSection = state.sections.find(s => s.id === Number(state.reportSectionId)) || state.sections[0];
        state.reportSectionId = activeSection.id;
        qtrSelect.value = state.reportQuarter;

        const standings = computeSectionStandings(activeSection.id, state.reportQuarter);
        if (!standings) return;

        const quarterLabelMap = {
            Q1: '1st Quarter (Q1)',
            Q2: '2nd Quarter (Q2)',
            Q3: '3rd Quarter (Q3)',
            Q4: '4th Quarter (Q4)',
            FINAL: 'Final / Cumulative Average (Q1–Q4)',
        };
        const quarterTitle = quarterLabelMap[state.reportQuarter] || state.reportQuarter;

        // Compute section average across all ranked students with grades
        const gradedStudents = standings.rankedRows.filter(r => r.weightedAverage !== null);
        const sectionMean = gradedStudents.length > 0
            ? (gradedStudents.reduce((acc, r) => acc + r.weightedAverage, 0) / gradedStudents.length).toFixed(2)
            : '—';

        // 1. Pullout Table HTML (Students with NO grade below 85 AND Weighted Average >= 90)
        const pulloutHtml = standings.qualifiers.length > 0
            ? `
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-[12px]">
                        <thead>
                            <tr class="bg-emerald-900/10 border-b border-emerald-200 text-[10px] font-semibold uppercase tracking-wider text-emerald-900">
                                <th class="py-2 px-3">Rank</th>
                                <th class="py-2 px-3">Student ID</th>
                                <th class="py-2 px-3">Student Name</th>
                                <th class="py-2 px-3">Subject Grades (All Verified &ge; 85)</th>
                                <th class="py-2 px-3 text-center">Lowest Subject Grade</th>
                                <th class="py-2 px-3 text-center">Weighted Average (&ge; 90)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-emerald-200/60 text-[12px] bg-white">
                            ${standings.qualifiers.map(q => `
                                <tr class="hover:bg-emerald-50/40 transition">
                                    <td class="py-2 px-3 whitespace-nowrap">
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 shadow-2xs">
                                            Rank #${q.rank}
                                        </span>
                                    </td>
                                    <td class="py-2 px-3 font-mono text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                                        ${escapeHtml(q.student.student_no)}
                                    </td>
                                    <td class="py-2 px-3 font-display font-bold text-slate-900 whitespace-nowrap">
                                        ${escapeHtml(q.student.full_name)}
                                    </td>
                                    <td class="py-2 px-3">
                                        <div class="flex flex-wrap gap-1">
                                            ${q.subjectResults.map(sr => `
                                                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                    <strong>${escapeHtml(sr.subject_code)}:</strong>
                                                    <span>${sr.grade !== null ? sr.grade.toFixed(0) : '—'}</span>
                                                    <span class="text-[10px] text-emerald-600">(*${formatUnits(sr.units)})</span>
                                                </span>
                                            `).join('')}
                                        </div>
                                    </td>
                                    <td class="py-2 px-3 text-center whitespace-nowrap">
                                        <span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                            ${q.minGrade !== null ? q.minGrade.toFixed(2) : '—'} (${escapeHtml(q.minGradeSubject || '')}) &ge; 85
                                        </span>
                                    </td>
                                    <td class="py-2 px-3 text-center whitespace-nowrap">
                                        <span class="font-display font-extrabold text-[13px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                            ${q.weightedAverage.toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `
            : `
                <div class="p-6 text-center bg-white">
                    <p class="text-[12px] font-semibold text-slate-700">No students currently meet both qualification criteria for ${escapeHtml(quarterTitle)}</p>
                    <p class="text-[11px] text-slate-500 mt-1">To be pulled out here, a student must have complete grades in all assigned subjects, <strong>no subject grade below 85</strong>, and a <strong>weighted average of 90.00 or above</strong>.</p>
                </div>
            `;

        // 2. Full Section Computation & Ranking Matrix HTML
        const subjectColsHeader = standings.subjects.map(sub => {
            const idx = standings.subjects.indexOf(sub);
            const col = excelColLetter(idx);
            return `
                <th class="py-2 px-1.5 text-center border-l border-slate-200/70">
                    <div class="text-[10px] font-mono font-bold text-brand-600">${col}*${formatUnits(sub.units)}</div>
                    <div class="text-[11px] font-bold text-slate-800">${escapeHtml(sub.subject_code)}</div>
                    <div class="text-[10px] text-slate-400">${formatUnits(sub.units)}u</div>
                </th>
            `;
        }).join('');

        const fullRankingRowsHtml = standings.rankedRows.length > 0
            ? standings.rankedRows.map(r => {
                const subCells = r.subjectResults.map(sr => {
                    if (sr.grade === null) {
                        return `<td class="py-2 px-1.5 text-center text-[11px] text-slate-300 border-l border-slate-100">—</td>`;
                    }
                    const isLow = sr.grade < 85;
                    return `
                        <td class="py-1.5 px-1.5 text-center border-l border-slate-100 ${isLow ? 'bg-rose-50/80' : ''}">
                            <div class="font-semibold text-[12px] ${isLow ? 'text-rose-700 font-bold' : 'text-slate-800'}">
                                ${sr.grade.toFixed(0)}
                            </div>
                            <div class="text-[10px] font-mono text-slate-400">
                                (${sr.weighted_product.toFixed(0)})
                            </div>
                        </td>
                    `;
                }).join('');

                // Build exact student formula breakdown tooltip/string e.g. (((95*4)+(94*4)...)/28)
                const studentFormulaTerms = r.subjectResults
                    .map(sr => `(${sr.grade !== null ? sr.grade.toFixed(0) : 0}*${formatUnits(sr.units)})`)
                    .join('+');
                const studentExactFormula = `((${studentFormulaTerms})/${formatUnits(r.totalSectionUnits)})`;

                const badgeHtml = r.isQualified
                    ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        &#10003; Pulled Out (Avg &ge; 90 &amp; No &lt; 85)
                       </span>`
                    : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${r.hasBelow85 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'}">
                        ${escapeHtml(r.statusReason)}
                       </span>`;

                return `
                    <tr class="hover:bg-slate-50/90 transition text-[12px] ${r.isQualified ? 'bg-emerald-50/20' : ''}">
                        <td class="py-1.5 px-2.5 whitespace-nowrap text-center">
                            ${r.rank ? `
                                <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${r.rank === 1 ? 'bg-amber-400 text-slate-950 shadow-2xs' : r.rank <= 3 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'}">
                                    ${r.rank}
                                </span>
                            ` : '—'}
                        </td>
                        <td class="py-1.5 px-3 whitespace-nowrap">
                            <div class="font-semibold text-slate-900 text-[12px]">${escapeHtml(r.student.full_name)}</div>
                            <div class="font-mono text-[10px] text-slate-400">${escapeHtml(r.student.student_no)} &bull; Row ${r.excel_row}</div>
                        </td>
                        ${subCells}
                        <td class="py-1.5 px-2 text-center font-mono text-[11px] text-slate-600 border-l border-slate-200/70" title="${escapeHtml(studentExactFormula)}">
                            ${r.gradedCount > 0 ? `${r.weightedSum.toFixed(1)} / ${formatUnits(r.isComplete ? r.totalSectionUnits : r.gradedUnits)}` : '—'}
                        </td>
                        <td class="py-1.5 px-2 text-center border-l border-slate-200/70 whitespace-nowrap">
                            ${r.minGrade !== null ? `<span class="text-[11px] font-semibold ${r.minGrade < 85 ? 'text-rose-600' : 'text-slate-700'}">${r.minGrade.toFixed(0)}</span>` : '—'}
                        </td>
                        <td class="py-1.5 px-2.5 text-center border-l border-slate-200/70 whitespace-nowrap">
                            <span class="font-display font-extrabold text-[12px] ${r.weightedAverage !== null && r.weightedAverage >= 90 ? 'text-emerald-700' : 'text-slate-900'}">
                                ${r.weightedAverage !== null ? r.weightedAverage.toFixed(2) : '—'}
                            </span>
                        </td>
                        <td class="py-1.5 px-3 border-l border-slate-200/70 whitespace-nowrap">
                            ${badgeHtml}
                        </td>
                    </tr>
                `;
            }).join('')
            : `<tr><td colspan="${standings.subjects.length + 6}" class="py-8 text-center text-[12px] text-slate-500">No students enrolled in this section yet.</td></tr>`;

        container.innerHTML = `
            <!-- Report Summary Header Card -->
            <div class="bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                Automated Quarterly Report
                            </span>
                            <span class="text-xs text-slate-400">${escapeHtml(quarterTitle)}</span>
                        </div>
                        <h3 class="font-display font-bold text-xl sm:text-2xl mt-1">
                            ${escapeHtml(activeSection.section_name)} — ${escapeHtml(activeSection.year_level)}
                        </h3>
                        <p class="text-xs text-slate-300 mt-1">
                            ${activeSection.adviser ? `Class Adviser: <strong>${escapeHtml(activeSection.adviser)}</strong> &bull; ` : ''}
                            Weighted Ranking Formula: <code class="text-amber-300 font-mono">${escapeHtml(standings.formulaString)}</code>
                        </p>
                    </div>

                    <div class="grid grid-cols-3 gap-3 shrink-0">
                        <div class="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-center">
                            <span class="text-[11px] text-slate-400 block">Total Units</span>
                            <span class="font-display font-bold text-lg text-white">${formatUnits(standings.totalSectionUnits)}</span>
                        </div>
                        <div class="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-center">
                            <span class="text-[11px] text-slate-400 block">Section Avg</span>
                            <span class="font-display font-bold text-lg text-amber-300">${sectionMean}</span>
                        </div>
                        <div class="bg-emerald-950/90 border border-emerald-500/40 rounded-xl px-4 py-2.5 text-center">
                            <span class="text-[11px] text-emerald-300 block">Honor Pullout</span>
                            <span class="font-display font-bold text-lg text-emerald-400">${standings.qualifiers.length} / ${standings.rankedRows.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AUTOMATED PULLOUT CARD: NO GRADE BELOW 85 & WEIGHTED AVERAGE >= 90 -->
            <div class="bg-white rounded-2xl border-2 border-emerald-500/70 shadow-sm overflow-hidden">
                <div class="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                            </svg>
                        </div>
                        <div>
                            <h4 class="font-display font-bold text-base sm:text-lg">
                                Quarterly Honor Pullout — Students with Average &ge; 90 &amp; No Grade Below 85
                            </h4>
                            <p class="text-xs text-emerald-100">
                                Automatically filtered from ${escapeHtml(activeSection.section_name)} (${escapeHtml(quarterTitle)}) where every subject &ge; 85 and Weighted Average &ge; 90.00
                            </p>
                        </div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-900">
                        ${standings.qualifiers.length} Qualified Student${standings.qualifiers.length === 1 ? '' : 's'}
                    </span>
                </div>
                ${pulloutHtml}
            </div>

            <!-- COMPLETE SECTION QUARTERLY RANKING & COMPUTATION TABLE -->
            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div class="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h4 class="font-display font-bold text-slate-900 text-base">
                            Complete Section Quarterly Computation &amp; Ranking (${escapeHtml(quarterTitle)})
                        </h4>
                        <p class="text-xs text-slate-500">
                            Each cell shows the student's subject grade and its weighted points <code>(Grade * Units)</code> below it. Grades &lt; 85 are highlighted in red.
                        </p>
                    </div>
                </div>
                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100/90 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                <th class="py-3 px-4 text-center">Rank</th>
                                <th class="py-3 px-4 min-w-[180px]">Student Name</th>
                                ${subjectColsHeader}
                                <th class="py-3 px-3 text-center border-l border-slate-200">Sum / Units</th>
                                <th class="py-3 px-3 text-center border-l border-slate-200">Min Grade</th>
                                <th class="py-3 px-4 text-center border-l border-slate-200">Weighted Avg</th>
                                <th class="py-3 px-4 border-l border-slate-200">Pullout Qualification Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200/60 text-sm">
                            ${fullRankingRowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function filterStudentsBySection(sectionId) {
        switchView('students');
        const sectionSelect = document.getElementById('studentSectionFilter');
        if (sectionSelect) {
            sectionSelect.value = String(sectionId);
        }
        renderStudentsView();
    }

    function resetStudentFilters() {
        document.getElementById('studentSearchInput').value = '';
        document.getElementById('studentYearFilter').value = '';
        document.getElementById('studentSectionFilter').value = '';
        renderStudentsView();
    }

    // ==================== MODAL HELPERS ====================
    function openModal(modalId) {
        document.getElementById(modalId)?.classList.remove('hidden');
    }

    function closeModal(modalId) {
        document.getElementById(modalId)?.classList.add('hidden');
    }

    // ==================== SECTION MODAL ====================
    function openSectionModal(sectionId = null, openedFromStudentModal = false) {
        state.returnToModalAfterCreate = openedFromStudentModal ? 'studentModal' : null;

        const form = document.getElementById('sectionForm');
        form.reset();
        document.getElementById('sectionIdInput').value = '';

        const assignedSet = new Set();
        if (sectionId) {
            const sec = state.sections.find(s => s.id === Number(sectionId));
            if (!sec) return;
            document.getElementById('sectionModalTitle').textContent = `Edit Section — ${sec.section_name}`;
            document.getElementById('sectionIdInput').value = sec.id;
            document.getElementById('sectionNameInput').value = sec.section_name;
            document.getElementById('sectionYearLevelInput').value = sec.year_level;
            document.getElementById('sectionAdviserInput').value = sec.adviser || '';
            sec.assigned_subjects.forEach(sub => assignedSet.add(Number(sub.subject_id)));
        } else {
            document.getElementById('sectionModalTitle').textContent = 'Create New Section';
        }

        const checklist = document.getElementById('sectionModalSubjectsChecklist');
        if (state.subjects.length === 0) {
            checklist.innerHTML = `<p class="text-xs text-slate-400 py-2 px-1">No subjects in catalog yet. You can create subjects now or assign them later.</p>`;
        } else {
            checklist.innerHTML = state.subjects.map(sub => {
                const checked = assignedSet.has(sub.id) ? 'checked' : '';
                return `
                    <label class="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-white cursor-pointer transition">
                        <span class="flex items-center gap-2.5 min-w-0">
                            <input type="checkbox" name="section_subject_ids" value="${sub.id}" ${checked} class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300">
                            <span class="font-mono text-xs font-bold text-brand-700">${escapeHtml(sub.subject_code)}</span>
                            <span class="text-xs text-slate-700 truncate">${escapeHtml(sub.subject_name)}</span>
                        </span>
                        <span class="text-[11px] font-bold text-emerald-700 shrink-0">*${formatUnits(sub.units)} u</span>
                    </label>
                `;
            }).join('');
        }

        openModal('sectionModal');
        setTimeout(() => document.getElementById('sectionNameInput')?.focus(), 50);
    }

    async function handleSectionSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('sectionIdInput').value;
        const section_name = document.getElementById('sectionNameInput').value.trim();
        const year_level = document.getElementById('sectionYearLevelInput').value;
        const adviser = document.getElementById('sectionAdviserInput').value.trim();

        const checkedSubjectIds = Array.from(
            document.querySelectorAll('#sectionModalSubjectsChecklist input[name="section_subject_ids"]:checked')
        ).map(cb => Number(cb.value));

        const submitBtn = document.getElementById('sectionSubmitBtn');
        submitBtn.disabled = true;

        try {
            const res = await apiRequest('save_section', {
                id: id || null,
                section_name,
                year_level,
                adviser,
                subject_ids: checkedSubjectIds,
            });
            applySystemState(res);
            closeModal('sectionModal');
            showToast(res.message, 'success');

            if (state.returnToModalAfterCreate === 'studentModal' && res.saved_section_id) {
                state.returnToModalAfterCreate = null;
                populateStudentModalSections(year_level, res.saved_section_id);
                document.getElementById('studentYearLevelSelect').value = year_level;
                updateStudentModalSubjectPreview();
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            submitBtn.disabled = false;
        }
    }

    function confirmDeleteSection(sectionId) {
        const sec = state.sections.find(s => s.id === Number(sectionId));
        if (!sec) return;

        document.getElementById('confirmModalTitle').textContent = `Delete Section "${sec.section_name}"?`;
        document.getElementById('confirmModalMessage').textContent =
            sec.student_count > 0
                ? `Warning: Deleting "${sec.section_name}" (${sec.year_level}) will also remove its ${sec.student_count} enrolled student(s), grades, and subject assignments.`
                : `Are you sure you want to delete "${sec.section_name}" (${sec.year_level}) and its subject assignments?`;

        const btn = document.getElementById('confirmModalActionBtn');
        btn.onclick = async () => {
            btn.disabled = true;
            try {
                const res = await apiRequest('delete_section', { id: sec.id });
                applySystemState(res);
                closeModal('confirmModal');
                showToast(res.message, 'success');
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                btn.disabled = false;
            }
        };
        openModal('confirmModal');
    }

    // ==================== SUBJECT MODAL ====================
    function openSubjectModal(subjectId = null, openedFromOtherModal = false) {
        if (openedFromOtherModal) {
            if (!document.getElementById('assignSubjectsModal').classList.contains('hidden')) {
                state.returnToModalAfterCreate = 'assignSubjectsModal';
            } else if (!document.getElementById('sectionModal').classList.contains('hidden')) {
                state.returnToModalAfterCreate = 'sectionModal';
            }
        } else {
            state.returnToModalAfterCreate = null;
        }

        const form = document.getElementById('subjectForm');
        form.reset();
        document.getElementById('subjectIdInput').value = '';
        document.getElementById('subjectUnitsInput').value = '4.0';

        const assignedSecSet = new Set();
        if (subjectId) {
            const sub = state.subjects.find(s => s.id === Number(subjectId));
            if (!sub) return;
            document.getElementById('subjectModalTitle').textContent = `Edit Subject — ${sub.subject_code}`;
            document.getElementById('subjectIdInput').value = sub.id;
            document.getElementById('subjectCodeInput').value = sub.subject_code;
            document.getElementById('subjectNameInput').value = sub.subject_name;
            document.getElementById('subjectUnitsInput').value = sub.units;
            document.getElementById('subjectDescInput').value = sub.description || '';
            sub.assigned_sections.forEach(sec => assignedSecSet.add(Number(sec.section_id)));
            document.getElementById('subjectAssignSectionsWrapper').classList.add('hidden');
        } else {
            document.getElementById('subjectModalTitle').textContent = 'Add New Subject';
            document.getElementById('subjectAssignSectionsWrapper').classList.remove('hidden');
            if (state.activeAssignSectionId && state.returnToModalAfterCreate === 'assignSubjectsModal') {
                assignedSecSet.add(Number(state.activeAssignSectionId));
            }
        }

        const secChecklist = document.getElementById('subjectModalSectionsChecklist');
        if (state.sections.length === 0) {
            secChecklist.innerHTML = `<p class="text-xs text-slate-400 py-1.5 px-1">No sections created yet. You can assign this subject once a section is created.</p>`;
        } else {
            secChecklist.innerHTML = state.sections.map(sec => {
                const checked = assignedSecSet.has(sec.id) ? 'checked' : '';
                return `
                    <label class="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition">
                        <span class="flex items-center gap-2">
                            <input type="checkbox" name="subject_section_ids" value="${sec.id}" ${checked} class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300">
                            <span class="text-xs font-semibold text-slate-800">${escapeHtml(sec.section_name)}</span>
                        </span>
                        <span class="text-[11px] text-slate-500">${escapeHtml(sec.year_level)}</span>
                    </label>
                `;
            }).join('');
        }

        openModal('subjectModal');
        setTimeout(() => document.getElementById('subjectCodeInput')?.focus(), 50);
    }

    async function handleSubjectSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('subjectIdInput').value;
        const subject_code = document.getElementById('subjectCodeInput').value.trim();
        const subject_name = document.getElementById('subjectNameInput').value.trim();
        const units = document.getElementById('subjectUnitsInput').value;
        const description = document.getElementById('subjectDescInput').value.trim();

        const checkedSectionIds = !id
            ? Array.from(document.querySelectorAll('#subjectModalSectionsChecklist input[name="subject_section_ids"]:checked')).map(cb => Number(cb.value))
            : undefined;

        const submitBtn = document.getElementById('subjectSubmitBtn');
        submitBtn.disabled = true;

        try {
            const payload = {
                id: id || null,
                subject_code,
                subject_name,
                units,
                description,
            };
            if (checkedSectionIds !== undefined) {
                payload.section_ids = checkedSectionIds;
            }

            const res = await apiRequest('save_subject', payload);
            applySystemState(res);
            closeModal('subjectModal');
            showToast(res.message, 'success');

            if (state.returnToModalAfterCreate === 'assignSubjectsModal' && state.activeAssignSectionId) {
                if (res.saved_subject_id) {
                    state.assignDraftMap[res.saved_subject_id] = {
                        checked: true,
                        schedule: '',
                        instructor: '',
                    };
                }
                renderAssignSubjectsModalList();
                state.returnToModalAfterCreate = null;
            } else if (state.returnToModalAfterCreate === 'sectionModal') {
                const secId = document.getElementById('sectionIdInput').value;
                openSectionModal(secId || null);
                state.returnToModalAfterCreate = null;
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            submitBtn.disabled = false;
        }
    }

    function confirmDeleteSubject(subjectId) {
        const sub = state.subjects.find(s => s.id === Number(subjectId));
        if (!sub) return;

        document.getElementById('confirmModalTitle').textContent = `Delete Subject "${sub.subject_code}"?`;
        document.getElementById('confirmModalMessage').textContent =
            sub.section_count > 0
                ? `"${sub.subject_code} - ${sub.subject_name}" is currently assigned to ${sub.section_count} section(s). Deleting it will unassign it and remove its grades.`
                : `Are you sure you want to delete "${sub.subject_code} - ${sub.subject_name}"?`;

        const btn = document.getElementById('confirmModalActionBtn');
        btn.onclick = async () => {
            btn.disabled = true;
            try {
                const res = await apiRequest('delete_subject', { id: sub.id });
                applySystemState(res);
                closeModal('confirmModal');
                showToast(res.message, 'success');
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                btn.disabled = false;
            }
        };
        openModal('confirmModal');
    }

    // ==================== MANAGE SECTION SUBJECT ASSIGNMENTS MODAL ====================
    function openAssignSubjectsModal(sectionId) {
        const sec = state.sections.find(s => s.id === Number(sectionId));
        if (!sec) return;

        state.activeAssignSectionId = sec.id;
        document.getElementById('assignSectionIdInput').value = sec.id;
        document.getElementById('assignModalTitle').textContent = `Manage Subjects — ${sec.section_name}`;
        document.getElementById('assignModalYearBadge').textContent = sec.year_level;
        document.getElementById('assignSubjectSearch').value = '';

        state.assignDraftMap = {};
        state.subjects.forEach(sub => {
            const existing = sec.assigned_subjects.find(a => Number(a.subject_id) === Number(sub.id));
            state.assignDraftMap[sub.id] = {
                checked: Boolean(existing),
                schedule: existing?.schedule || '',
                instructor: existing?.instructor || '',
            };
        });

        renderAssignSubjectsModalList();
        openModal('assignSubjectsModal');
    }

    function renderAssignSubjectsModalList() {
        const container = document.getElementById('assignSubjectsListContainer');
        const query = (document.getElementById('assignSubjectSearch')?.value || '').trim().toLowerCase();

        if (state.subjects.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center">
                    <p class="text-sm font-semibold text-slate-700">No subjects in your catalog yet</p>
                    <p class="text-xs text-slate-500 mt-1">Click "+ New Subject" above to create your first subject and assign it here.</p>
                </div>
            `;
            updateAssignSelectedTotals();
            return;
        }

        const filtered = state.subjects.filter(sub => {
            if (!query) return true;
            return (
                sub.subject_code.toLowerCase().includes(query) ||
                sub.subject_name.toLowerCase().includes(query)
            );
        });

        container.innerHTML = filtered.map(sub => {
            const draft = state.assignDraftMap[sub.id] || { checked: false, schedule: '', instructor: '' };
            return `
                <div class="p-3.5 transition ${draft.checked ? 'bg-brand-50/50' : 'hover:bg-white'}">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label class="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                            <input type="checkbox"
                                data-subject-id="${sub.id}"
                                ${draft.checked ? 'checked' : ''}
                                onchange="App.onAssignCheckboxChange(${sub.id}, this.checked)"
                                class="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-mono text-xs font-bold text-brand-700 bg-white px-2 py-0.5 rounded border border-brand-200">${escapeHtml(sub.subject_code)}</span>
                                    <span class="text-sm font-semibold text-slate-900">${escapeHtml(sub.subject_name)}</span>
                                    <span class="text-xs font-bold text-emerald-700">(*${formatUnits(sub.units)} units)</span>
                                </div>
                                ${sub.description ? `<p class="text-xs text-slate-500 mt-0.5 truncate">${escapeHtml(sub.description)}</p>` : ''}
                            </div>
                        </label>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:w-72 shrink-0 ${draft.checked ? '' : 'opacity-40 pointer-events-none'}">
                            <input type="text"
                                placeholder="Schedule (e.g. MWF 8-9AM)"
                                value="${escapeHtml(draft.schedule)}"
                                oninput="App.onAssignMetaChange(${sub.id}, 'schedule', this.value)"
                                class="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:border-brand-500 outline-none">
                            <input type="text"
                                placeholder="Teacher / Instructor"
                                value="${escapeHtml(draft.instructor)}"
                                oninput="App.onAssignMetaChange(${sub.id}, 'instructor', this.value)"
                                class="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:border-brand-500 outline-none">
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        updateAssignSelectedTotals();
    }

    function onAssignCheckboxChange(subjectId, isChecked) {
        if (!state.assignDraftMap[subjectId]) {
            state.assignDraftMap[subjectId] = { checked: false, schedule: '', instructor: '' };
        }
        state.assignDraftMap[subjectId].checked = isChecked;
        renderAssignSubjectsModalList();
    }

    function onAssignMetaChange(subjectId, field, value) {
        if (!state.assignDraftMap[subjectId]) {
            state.assignDraftMap[subjectId] = { checked: true, schedule: '', instructor: '' };
        }
        state.assignDraftMap[subjectId][field] = value;
    }

    function toggleAllAssignSubjects(selectAll) {
        state.subjects.forEach(sub => {
            if (!state.assignDraftMap[sub.id]) {
                state.assignDraftMap[sub.id] = { checked: selectAll, schedule: '', instructor: '' };
            } else {
                state.assignDraftMap[sub.id].checked = selectAll;
            }
        });
        renderAssignSubjectsModalList();
    }

    function updateAssignSelectedTotals() {
        let count = 0;
        let units = 0;
        state.subjects.forEach(sub => {
            if (state.assignDraftMap[sub.id]?.checked) {
                count++;
                units += Number(sub.units || 0);
            }
        });
        document.getElementById('assignSelectedCount').textContent = count;
        document.getElementById('assignSelectedUnits').textContent = formatUnits(units);
    }

    async function handleAssignSubjectsSubmit(e) {
        e.preventDefault();
        const sectionId = Number(document.getElementById('assignSectionIdInput').value);
        if (!sectionId) return;

        const assignments = [];
        state.subjects.forEach(sub => {
            const draft = state.assignDraftMap[sub.id];
            if (draft && draft.checked) {
                assignments.push({
                    subject_id: sub.id,
                    schedule: draft.schedule || '',
                    instructor: draft.instructor || '',
                });
            }
        });

        const btn = document.getElementById('assignSubjectsSubmitBtn');
        btn.disabled = true;

        try {
            const res = await apiRequest('sync_section_subjects', {
                section_id: sectionId,
                assignments,
            });
            applySystemState(res);
            closeModal('assignSubjectsModal');
            showToast(res.message, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    async function unassignSingleSubject(sectionId, subjectId) {
        try {
            const res = await apiRequest('unassign_single_subject', {
                section_id: sectionId,
                subject_id: subjectId,
            });
            applySystemState(res);
            showToast(res.message, 'info');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    // ==================== STUDENT MODAL ====================
    function populateStudentModalSections(filterYearLevel = '', selectedSectionId = null) {
        const select = document.getElementById('studentSectionSelect');
        if (!select) return;

        const matchingSections = filterYearLevel
            ? state.sections.filter(s => s.year_level === filterYearLevel)
            : state.sections;

        if (matchingSections.length === 0) {
            select.innerHTML = `<option value="" disabled selected>No sections available ${filterYearLevel ? `for ${escapeHtml(filterYearLevel)}` : ''}</option>`;
            return;
        }

        select.innerHTML = [
            `<option value="" disabled ${!selectedSectionId ? 'selected' : ''}>Select Section</option>`,
            ...matchingSections.map(sec => `
                <option value="${sec.id}" ${Number(selectedSectionId) === sec.id ? 'selected' : ''}>
                    ${escapeHtml(sec.section_name)} (${escapeHtml(sec.year_level)})
                </option>
            `),
        ].join('');

        if (!selectedSectionId && matchingSections.length === 1) {
            select.value = String(matchingSections[0].id);
        }
    }

    function updateStudentModalSubjectPreview() {
        const secId = Number(document.getElementById('studentSectionSelect')?.value || 0);
        const countEl = document.getElementById('studentModalSubjectCount');
        const previewEl = document.getElementById('studentModalSubjectsPreview');

        const sec = state.sections.find(s => s.id === secId);
        if (!sec) {
            countEl.textContent = '0 subjects';
            previewEl.innerHTML = `<span class="text-slate-400">Select a section above to preview its assigned subjects.</span>`;
            return;
        }

        const yearSelect = document.getElementById('studentYearLevelSelect');
        if (yearSelect && yearSelect.value !== sec.year_level) {
            yearSelect.value = sec.year_level;
        }

        countEl.textContent = `${sec.assigned_subjects.length} subject${sec.assigned_subjects.length === 1 ? '' : 's'} (${formatUnits(sec.total_units)} units)`;
        if (sec.assigned_subjects.length === 0) {
            previewEl.innerHTML = `<span class="text-amber-600">No subjects assigned to ${escapeHtml(sec.section_name)} yet.</span>`;
        } else {
            previewEl.innerHTML = sec.assigned_subjects.map(sub => `
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    <strong class="text-brand-700">${escapeHtml(sub.subject_code)}</strong>
                    <span>${escapeHtml(sub.subject_name)}</span>
                    <span class="text-[10px] font-bold text-emerald-700">*${formatUnits(sub.units)}u</span>
                </span>
            `).join('');
        }
    }

    function openStudentModal(studentId = null, preselectedSectionId = null) {
        const form = document.getElementById('studentForm');
        form.reset();
        document.getElementById('studentIdInput').value = '';

        if (studentId) {
            const st = state.students.find(s => s.id === Number(studentId));
            if (!st) return;
            document.getElementById('studentModalTitle').textContent = `Edit Student — ${st.full_name}`;
            document.getElementById('studentIdInput').value = st.id;
            document.getElementById('studentNoInput').value = st.student_no;
            document.getElementById('studentFirstNameInput').value = st.first_name;
            document.getElementById('studentMiddleNameInput').value = st.middle_name || '';
            document.getElementById('studentLastNameInput').value = st.last_name;
            document.getElementById('studentStatusInput').value = st.status || 'Active';
            document.getElementById('studentYearLevelSelect').value = st.year_level;
            populateStudentModalSections(st.year_level, st.section_id);
        } else {
            document.getElementById('studentModalTitle').textContent = 'Enroll New Student';
            document.getElementById('studentStatusInput').value = 'Active';

            if (preselectedSectionId) {
                const sec = state.sections.find(s => s.id === Number(preselectedSectionId));
                const yl = sec ? sec.year_level : '';
                document.getElementById('studentYearLevelSelect').value = yl;
                populateStudentModalSections(yl, preselectedSectionId);
            } else {
                document.getElementById('studentYearLevelSelect').value = '';
                populateStudentModalSections('', null);
            }
        }

        updateStudentModalSubjectPreview();
        openModal('studentModal');
        setTimeout(() => document.getElementById('studentFirstNameInput')?.focus(), 50);
    }

    async function handleStudentSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('studentIdInput').value;
        const student_no = document.getElementById('studentNoInput').value.trim();
        const first_name = document.getElementById('studentFirstNameInput').value.trim();
        const middle_name = document.getElementById('studentMiddleNameInput').value.trim();
        const last_name = document.getElementById('studentLastNameInput').value.trim();
        const section_id = Number(document.getElementById('studentSectionSelect').value || 0);
        const year_level = document.getElementById('studentYearLevelSelect').value;
        const status = document.getElementById('studentStatusInput').value;

        if (!section_id) {
            showToast('Please select or create a section for the student.', 'error');
            return;
        }

        const btn = document.getElementById('studentSubmitBtn');
        btn.disabled = true;

        try {
            const res = await apiRequest('save_student', {
                id: id || null,
                student_no,
                first_name,
                middle_name,
                last_name,
                section_id,
                year_level,
                status,
            });
            applySystemState(res);
            closeModal('studentModal');
            showToast(res.message, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    function confirmDeleteStudent(studentId) {
        const st = state.students.find(s => s.id === Number(studentId));
        if (!st) return;

        document.getElementById('confirmModalTitle').textContent = `Remove Student "${st.full_name}"?`;
        document.getElementById('confirmModalMessage').textContent =
            `Are you sure you want to remove ${st.full_name} (${st.student_no}) from ${st.section_name}?`;

        const btn = document.getElementById('confirmModalActionBtn');
        btn.onclick = async () => {
            btn.disabled = true;
            try {
                const res = await apiRequest('delete_student', { id: st.id });
                applySystemState(res);
                closeModal('confirmModal');
                showToast(res.message, 'success');
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                btn.disabled = false;
            }
        };
        openModal('confirmModal');
    }

    async function seedSampleData() {
        try {
            const res = await apiRequest('seed_demo', {});
            applySystemState(res);
            showToast(res.message, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    // ==================== EVENT LISTENERS ====================
    function bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-nav');
                if (target) switchView(target);
            });
        });

        document.getElementById('mobileMenuBtn')?.addEventListener('click', openMobileSidebar);
        document.getElementById('sidebarBackdrop')?.addEventListener('click', closeMobileSidebar);

        document.getElementById('sectionForm')?.addEventListener('submit', handleSectionSubmit);
        document.getElementById('subjectForm')?.addEventListener('submit', handleSubjectSubmit);
        document.getElementById('assignSubjectsForm')?.addEventListener('submit', handleAssignSubjectsSubmit);
        document.getElementById('studentForm')?.addEventListener('submit', handleStudentSubmit);

        document.getElementById('sectionSearchInput')?.addEventListener('input', renderSectionsView);
        document.getElementById('sectionYearFilter')?.addEventListener('change', renderSectionsView);
        document.getElementById('subjectSearchInput')?.addEventListener('input', renderSubjectsView);
        document.getElementById('assignSubjectSearch')?.addEventListener('input', renderAssignSubjectsModalList);

        document.getElementById('studentSearchInput')?.addEventListener('input', renderStudentsView);
        document.getElementById('studentYearFilter')?.addEventListener('change', renderStudentsView);
        document.getElementById('studentSectionFilter')?.addEventListener('change', renderStudentsView);

        // Grading View Selectors
        document.getElementById('gradingSectionSelect')?.addEventListener('change', e => {
            state.gradingSectionId = Number(e.target.value);
            state.gradingSubjectId = 'ALL';
            renderGradingView();
        });
        document.getElementById('gradingSubjectSelect')?.addEventListener('change', e => {
            state.gradingSubjectId = e.target.value;
            renderGradingView();
        });
        document.getElementById('gradingQuarterSelect')?.addEventListener('change', e => {
            state.gradingQuarter = e.target.value;
            renderGradingView();
        });
        document.getElementById('gradingStudentSearchInput')?.addEventListener('input', renderGradingView);

        // Reports View Selectors
        document.getElementById('reportSectionSelect')?.addEventListener('change', e => {
            state.reportSectionId = Number(e.target.value);
            renderReportsView();
        });
        document.getElementById('reportQuarterSelect')?.addEventListener('change', e => {
            state.reportQuarter = e.target.value;
            renderReportsView();
        });

        // Student Modal Year Level <-> Section synchronization
        document.getElementById('studentYearLevelSelect')?.addEventListener('change', e => {
            const selectedYear = e.target.value;
            populateStudentModalSections(selectedYear, null);
            updateStudentModalSubjectPreview();
        });
        document.getElementById('studentSectionSelect')?.addEventListener('change', () => {
            updateStudentModalSubjectPreview();
        });

        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && state.currentView === 'grading') {
                e.preventDefault();
                saveCurrentGradesSheet();
                return;
            }
            if (e.key === 'Escape') {
                ['confirmModal', 'subjectModal', 'assignSubjectsModal', 'sectionModal', 'studentModal'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el && !el.classList.contains('hidden')) {
                        closeModal(id);
                    }
                });
            }
        });
    }

    function init() {
        bindEvents();
        switchView('dashboard');
        loadInitialData();
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        switchView,
        openModal,
        closeModal,
        openSectionModal,
        confirmDeleteSection,
        openSubjectModal,
        confirmDeleteSubject,
        openAssignSubjectsModal,
        onAssignCheckboxChange,
        onAssignMetaChange,
        toggleAllAssignSubjects,
        unassignSingleSubject,
        openStudentModal,
        confirmDeleteStudent,
        filterStudentsBySection,
        resetStudentFilters,
        seedSampleData,
        openSectionGrading,
        setGradingQuarter,
        setGradingSubjectTab,
        openQuarterlyReportForActiveSection,
        onGradeCellKeyDown,
        onGradeCellFocus,
        onGradeCellBlur,
        setSingleStudentGrade,
        quickFillEmptyGrades,
        onLiveGradeCellInput,
        onMasterSheetCellInput,
        saveCurrentGradesSheet,
        openSectionReport,
        openGradingForReportSection,
    };
})();
