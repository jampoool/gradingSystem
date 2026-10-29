/**
 * GradeFlow — Academic & Grading Management System
 * Frontend Application Controller (Vanilla JS)
 * Design System: Academic Prestige (Midnight Navy #17243A, Deep Teal #0F766E, Berry Plum #9B3F72, Antique Amber #B7791F, Slate Blue #5276A7)
 */

const App = (() => {
    /**
     * Institutional Grading Policy Configuration (Philippine Academic Standard)
     * Status colors are separated from the raw grading scale and derived strictly from these policy rules.
     */
    const GRADING_POLICY = {
        passingGrade: 75.0,
        honorSubjectFloor: 85.0,
        honorAverage: 90.0,
        minValidGrade: 50.0,
        maxValidGrade: 100.0,
    };

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

        // Dashboard Section Switcher & Student Entries Pagination state
        dashboardSectionId: null,
        dashboardPageSize: 10,
        dashboardCurrentPage: 1,
        dashboardStudentSearch: '',

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
            breadcrumb: 'GradeFlow Dashboard',
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
     * Evaluates a numeric grade against GRADING_POLICY and returns semantic status + Academic Prestige classes.
     */
    function evaluateGradePolicy(gradeVal) {
        if (gradeVal === null || gradeVal === undefined || gradeVal === '' || isNaN(Number(gradeVal))) {
            return {
                state: 'pending',
                isPassing: false,
                isFailing: false,
                isBelowHonorFloor: false,
                label: 'Pending',
                badgeClass: 'bg-[#FFF0D1] text-[#80530F] border-[#F0D296]',
                inputClass: 'border-[#D8DEE8] bg-white text-[#17243A]',
            };
        }
        const g = Number(gradeVal);
        if (g < GRADING_POLICY.passingGrade) {
            return {
                state: 'failed',
                isPassing: false,
                isFailing: true,
                isBelowHonorFloor: true,
                label: 'Failed',
                badgeClass: 'bg-[#F5DFEB] text-[#842D60] border-[#E2B8CF]',
                inputClass: 'border-[#9B3F72] bg-[#F5DFEB]/60 text-[#842D60]',
            };
        }
        if (g < GRADING_POLICY.honorSubjectFloor) {
            return {
                state: 'warning_floor',
                isPassing: true,
                isFailing: false,
                isBelowHonorFloor: true,
                label: 'Passed (Below 85)',
                badgeClass: 'bg-[#FFF0D1] text-[#80530F] border-[#F0D296]',
                inputClass: 'border-[#B7791F] bg-[#FFF0D1]/60 text-[#80530F]',
            };
        }
        return {
            state: 'passed',
            isPassing: true,
            isFailing: false,
            isBelowHonorFloor: false,
            label: g >= GRADING_POLICY.honorAverage ? 'Passed (Honor 90+)' : 'Passed',
            badgeClass: 'bg-[#D5F0EA] text-[#0F766E] border-[#99D8CC]',
            inputClass: 'border-[#D8DEE8] bg-white text-[#17243A]',
        };
    }

    /**
     * Computes student subject grades, weighted average, lowest grade, passing/failing status, and honor qualification
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
            let hasFailingGrade = false;
            const below85Subjects = [];
            const failingSubjects = [];

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
                    if (gradeVal < GRADING_POLICY.passingGrade) {
                        hasFailingGrade = true;
                        failingSubjects.push(`${sub.subject_code} (${gradeVal.toFixed(0)})`);
                    }
                    if (gradeVal < GRADING_POLICY.honorSubjectFloor) {
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
            const divisorUnits = isComplete ? totalSectionUnits : gradedUnits;
            const weightedAverage = divisorUnits > 0 ? weightedSum / divisorUnits : null;

            const isFailingOverall =
                hasFailingGrade ||
                (weightedAverage !== null && weightedAverage < GRADING_POLICY.passingGrade);
            const isPassingOverall =
                weightedAverage !== null &&
                weightedAverage >= GRADING_POLICY.passingGrade &&
                !hasFailingGrade;

            const isQualified =
                isComplete &&
                !hasBelow85 &&
                weightedAverage !== null &&
                weightedAverage >= (GRADING_POLICY.honorAverage - 0.0001);

            let statusReason = 'Pending / Incomplete Grades';
            let statusType = 'incomplete';
            if (isComplete && weightedAverage !== null) {
                if (isFailingOverall) {
                    statusReason = failingSubjects.length > 0
                        ? `Failed (< ${GRADING_POLICY.passingGrade}): ${failingSubjects.join(', ')}`
                        : `Failed (Avg ${weightedAverage.toFixed(2)} < ${GRADING_POLICY.passingGrade})`;
                    statusType = 'failed';
                } else if (isQualified) {
                    statusReason = 'Qualified (Avg ≥ 90 & No Grade < 85)';
                    statusType = 'qualified';
                } else if (hasBelow85 && weightedAverage >= GRADING_POLICY.honorAverage) {
                    statusReason = `Passed · Below 85 Floor: ${below85Subjects.join(', ')}`;
                    statusType = 'below85';
                } else if (hasBelow85) {
                    statusReason = `Passed · Avg < 90 & Grade < 85 (${below85Subjects.join(', ')})`;
                    statusType = 'below_both';
                } else {
                    statusReason = `Passed · Average ${weightedAverage.toFixed(2)} (< 90 Honor)`;
                    statusType = 'below90';
                }
            } else if (gradedCount > 0 && isFailingOverall) {
                statusReason = `At Risk / Failing (${failingSubjects.join(', ')})`;
                statusType = 'failed';
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
                hasFailingGrade,
                isFailingOverall,
                isPassingOverall,
                below85Subjects,
                failingSubjects,
                isQualified,
                statusReason,
                statusType,
                rank: null,
            };
        });

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
            rows,
            rankedRows,
            qualifiers,
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
        // Academic Prestige semantic toast styling
        const colors = {
            success: 'bg-[#17243A] text-white border-[#0F766E]',
            error: 'bg-[#842D60] text-white border-[#9B3F72]',
            warning: 'bg-[#80530F] text-white border-[#B7791F]',
            info: 'bg-[#243752] text-white border-[#5276A7]',
        };
        const iconHtml = type === 'error'
            ? `<span class="w-6 h-6 rounded-lg bg-[#F5DFEB] text-[#842D60] flex items-center justify-center shrink-0 font-bold text-xs">✕</span>`
            : type === 'warning'
                ? `<span class="w-6 h-6 rounded-lg bg-[#FFF0D1] text-[#80530F] flex items-center justify-center shrink-0 font-bold text-xs">!</span>`
                : type === 'info'
                    ? `<span class="w-6 h-6 rounded-lg bg-[#EBF1F8] text-[#2C4870] flex items-center justify-center shrink-0 font-bold text-xs">i</span>`
                    : `<span class="w-6 h-6 rounded-lg bg-[#D5F0EA] text-[#0F766E] flex items-center justify-center shrink-0 font-bold text-xs">&#10003;</span>`;

        toast.className = `toast-enter pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border-l-4 ${colors[type] || colors.success} text-sm font-medium`;
        toast.innerHTML = `
            ${iconHtml}
            <span class="flex-1 leading-snug">${escapeHtml(message)}</span>
            <button type="button" class="text-slate-300 hover:text-white p-1 text-base leading-none cursor-pointer" aria-label="Close notification">&times;</button>
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

        if (state.sections.length > 0) {
            if (!state.dashboardSectionId || !state.sections.some(s => s.id === Number(state.dashboardSectionId))) {
                state.dashboardSectionId = state.sections[0].id;
                state.dashboardCurrentPage = 1;
            }
            if (!state.gradingSectionId || !state.sections.some(s => s.id === Number(state.gradingSectionId))) {
                state.gradingSectionId = state.sections[0].id;
            }
            if (!state.reportSectionId || !state.sections.some(s => s.id === Number(state.reportSectionId))) {
                state.reportSectionId = state.sections[0].id;
            }
        } else {
            state.dashboardSectionId = null;
            state.gradingSectionId = null;
            state.reportSectionId = null;
        }

        renderAll();
    }

    function setDashboardSection(sectionId) {
        state.dashboardSectionId = Number(sectionId);
        state.dashboardCurrentPage = 1;
        renderDashboard();
    }

    function setDashboardPageSize(pageSize) {
        state.dashboardPageSize = pageSize === 'ALL' ? 'ALL' : Number(pageSize) || 10;
        state.dashboardCurrentPage = 1;
        renderDashboard();
    }

    function setDashboardPage(pageNum) {
        state.dashboardCurrentPage = Math.max(1, Number(pageNum) || 1);
        renderDashboard();
    }

    function onDashboardStudentSearch(query) {
        state.dashboardStudentSearch = String(query || '');
        state.dashboardCurrentPage = 1;
        renderDashboard();
    }

    function openDashboardActiveSectionStudentModal(mode = 'single') {
        const targetSecId = state.dashboardSectionId || (state.sections[0]?.id ?? null);
        openStudentModal(null, targetSecId, mode);
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
                btn.className = 'nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-[#243752] text-white border border-[#5276A7]/50 shadow-xs transition-all cursor-pointer';
            } else {
                btn.className = 'nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-[#243752]/70 transition-all cursor-pointer';
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

        const sidebarGradesBadge = document.getElementById('sidebarGradesCountBadge');
        if (sidebarGradesBadge) {
            sidebarGradesBadge.textContent = `${state.stats.total_grades || 0} grades`;
        }

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
        if (yl.includes('1st') || yl.includes('7')) return 'bg-[#EBF1F8] text-[#2C4870] border-[#C5D5EA]';
        if (yl.includes('2nd') || yl.includes('8')) return 'bg-[#EBF1F8] text-[#17243A] border-[#C5D5EA]';
        if (yl.includes('3rd') || yl.includes('9') || yl.includes('11')) return 'bg-[#D5F0EA] text-[#0F766E] border-[#99D8CC]';
        if (yl.includes('4th') || yl.includes('10') || yl.includes('12')) return 'bg-[#FFF0D1] text-[#80530F] border-[#F0D296]';
        return 'bg-[#F5F7FA] text-[#17243A] border-[#D8DEE8]';
    }

    // ==================== RENDER DASHBOARD ====================
    function renderDashboard() {
        const pillsBar = document.getElementById('dashboardSectionPillsBar');
        const secContainer = document.getElementById('dashboardSectionsList');
        const stuContainer = document.getElementById('dashboardStudentsList');
        const overviewSecBadge = document.getElementById('dashboardOverviewSectionBadge');

        // Compute global Passing vs At-Risk (Failing < 75) rates across all evaluated students
        const standingsBySection = {};
        state.sections.forEach(sec => {
            standingsBySection[sec.id] = computeSectionStandings(sec.id, 'Q1');
        });

        let gradedStudentCount = 0;
        let passingStudentCount = 0;
        let failingStudentCount = 0;

        state.students.forEach(st => {
            const stRow = standingsBySection[st.section_id]?.rows.find(r => r.student.id === st.id);
            if (stRow && stRow.weightedAverage !== null) {
                gradedStudentCount++;
                if (stRow.isFailingOverall) {
                    failingStudentCount++;
                } else {
                    passingStudentCount++;
                }
            }
        });

        const passingRateEl = document.getElementById('statPassingRate');
        const passingCountEl = document.getElementById('statPassingCount');
        const riskRateEl = document.getElementById('statRiskRate');
        const riskCountEl = document.getElementById('statRiskCount');

        if (gradedStudentCount > 0) {
            const passPct = ((passingStudentCount / gradedStudentCount) * 100).toFixed(1) + '%';
            const riskPct = ((failingStudentCount / gradedStudentCount) * 100).toFixed(1) + '%';
            if (passingRateEl) passingRateEl.textContent = passPct;
            if (passingCountEl) passingCountEl.textContent = `${passingStudentCount} of ${gradedStudentCount} passed (≥${GRADING_POLICY.passingGrade})`;
            if (riskRateEl) riskRateEl.textContent = riskPct;
            if (riskCountEl) riskCountEl.textContent = `${failingStudentCount} of ${gradedStudentCount} failing (<${GRADING_POLICY.passingGrade})`;
        } else {
            if (passingRateEl) passingRateEl.textContent = '0.0%';
            if (passingCountEl) passingCountEl.textContent = `0 passed (≥${GRADING_POLICY.passingGrade})`;
            if (riskRateEl) riskRateEl.textContent = '0.0%';
            if (riskCountEl) riskCountEl.textContent = `0 failing (<${GRADING_POLICY.passingGrade})`;
        }

        if (state.sections.length === 0) {
            if (pillsBar) {
                pillsBar.innerHTML = `<span class="text-xs font-medium text-[#64748B]">No sections available yet</span>`;
            }
            if (overviewSecBadge) {
                overviewSecBadge.textContent = '0 Enrolled';
            }
            secContainer.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center py-10 px-4 border-2 border-dashed border-[#D8DEE8] rounded-2xl bg-[#F5F7FA]/50">
                    <p class="text-base font-bold text-[#17243A]">No sections created yet</p>
                    <p class="text-sm text-[#64748B] mt-1 max-w-md">Create a section or load the 28-unit demo data to test teacher grade input and weighted ranking.</p>
                    <div class="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                        <button type="button" onclick="App.seedSampleData()" class="px-4 py-2 rounded-xl text-sm font-semibold text-[#0F766E] bg-[#D5F0EA] hover:bg-[#c2e8df] border border-[#99D8CC] transition cursor-pointer">
                            Load 28-Unit Demo &amp; Grades
                        </button>
                        <button type="button" onclick="App.openSectionModal()" class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer">
                            + Create Section
                        </button>
                    </div>
                </div>
            `;
        } else {
            const activeSec =
                state.sections.find(s => s.id === Number(state.dashboardSectionId)) || state.sections[0];
            state.dashboardSectionId = activeSec.id;

            // 1. Render Section Breadcrumb Pills Bar
            if (pillsBar) {
                const pillsHtml = state.sections.map((sec, idx) => {
                    const isSelected = sec.id === activeSec.id;
                    const chevron = idx > 0
                        ? `<span class="text-[#64748B]/50 font-bold text-xs select-none">/</span>`
                        : '';
                    return `
                        ${chevron}
                        <button type="button"
                            onclick="App.setDashboardSection(${sec.id})"
                            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap border transition cursor-pointer ${
                                isSelected
                                    ? 'bg-[#17243A] text-white border-[#17243A] shadow-xs'
                                    : 'bg-white text-[#17243A] border-[#D8DEE8] hover:border-[#5276A7] hover:bg-[#EBF1F8]/50'
                            }">
                            <span>${escapeHtml(sec.section_name)}</span>
                            <span class="text-xs font-medium ${isSelected ? 'text-slate-300' : 'text-[#64748B]'}">(${escapeHtml(sec.year_level)})</span>
                            <span class="px-2 py-0.5 rounded-full text-xs font-bold ${
                                isSelected
                                    ? 'bg-[#D5F0EA] text-[#0F766E]'
                                    : 'bg-[#EBF1F8] text-[#2C4870]'
                            }">${sec.student_count} student${sec.student_count === 1 ? '' : 's'}</span>
                        </button>
                    `;
                }).join('');

                pillsBar.innerHTML = `
                    <span class="text-xs font-bold uppercase tracking-wider text-[#64748B] shrink-0 mr-1">Sections:</span>
                    <div class="flex items-center gap-1.5">
                        ${pillsHtml}
                    </div>
                    <button type="button" onclick="App.openSectionModal()" class="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-[#5276A7] hover:text-[#17243A] bg-white hover:bg-[#EBF1F8] border border-dashed border-[#5276A7]/50 transition cursor-pointer" title="Create another section">
                        + Add Section
                    </button>
                `;
            }

            // 2. Render Active Section Details & Paginated Student Table (Default 10 Entries, Adjustable)
            const standings = standingsBySection[activeSec.id];
            const qualCount = standings ? standings.qualifiers.length : 0;
            const formulaStr = buildSectionFormulaString(activeSec.assigned_subjects, 21);

            const subPills = activeSec.assigned_subjects.length > 0
                ? `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    ${activeSec.assigned_subjects.map((sub, idx) => `
                        <button type="button" onclick="App.openSectionGrading(${activeSec.id}, ${sub.subject_id})" class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white hover:bg-[#EBF1F8]/60 text-[#17243A] border border-[#D8DEE8] hover:border-[#5276A7] shadow-2xs transition cursor-pointer text-left">
                            <span class="truncate">
                                <span class="font-mono font-bold text-[#64748B]">${excelColLetter(idx)}:</span>
                                <strong class="text-[#17243A] text-xs">${escapeHtml(sub.subject_code)}</strong>
                                <span class="text-[#64748B] text-xs block truncate">${escapeHtml(sub.subject_name)}</span>
                            </span>
                            <span class="text-xs font-bold text-[#2C4870] bg-[#EBF1F8] px-2 py-0.5 rounded-md border border-[#C5D5EA] shrink-0">*${formatUnits(sub.units)}u</span>
                        </button>
                    `).join('')}
                   </div>`
                : `<div class="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#FFF0D1] border border-[#F0D296] text-xs text-[#80530F]">
                        <span class="font-semibold">&#9888; No subjects assigned to ${escapeHtml(activeSec.section_name)} yet.</span>
                        <button type="button" onclick="App.openAssignSubjectsModal(${activeSec.id})" class="font-bold underline cursor-pointer">+ Assign Subjects</button>
                   </div>`;

            // Filter & paginate students in active section
            const allSectionRows = standings ? standings.rankedRows : [];
            const searchQ = (state.dashboardStudentSearch || '').trim().toLowerCase();
            const filteredSectionRows = searchQ
                ? allSectionRows.filter(r =>
                    r.student.full_name.toLowerCase().includes(searchQ) ||
                    r.student.student_no.toLowerCase().includes(searchQ)
                  )
                : allSectionRows;

            const totalMatching = filteredSectionRows.length;
            const pageSize = state.dashboardPageSize === 'ALL'
                ? Math.max(1, totalMatching)
                : (Number(state.dashboardPageSize) || 10);
            const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize));
            if (state.dashboardCurrentPage > totalPages) {
                state.dashboardCurrentPage = totalPages;
            }
            const currentPage = Math.max(1, state.dashboardCurrentPage);
            const startIndex = (currentPage - 1) * pageSize;
            const paginatedRows = state.dashboardPageSize === 'ALL'
                ? filteredSectionRows
                : filteredSectionRows.slice(startIndex, startIndex + pageSize);

            const startEntryNum = totalMatching > 0 ? startIndex + 1 : 0;
            const endEntryNum = totalMatching > 0 ? Math.min(startIndex + paginatedRows.length, totalMatching) : 0;

            const pageSizeOptions = [5, 10, 15, 25, 50, 'ALL'].map(opt => {
                const isCurr = String(state.dashboardPageSize) === String(opt);
                const label = opt === 'ALL' ? 'All' : `${opt}`;
                return `<option value="${opt}" ${isCurr ? 'selected' : ''}>${label} entries</option>`;
            }).join('');

            const pageSizeQuickPills = [5, 10, 25, 'ALL'].map(opt => {
                const isCurr = String(state.dashboardPageSize) === String(opt);
                const label = opt === 'ALL' ? 'All' : String(opt);
                return `
                    <button type="button" onclick="App.setDashboardPageSize('${opt}')"
                        class="px-2 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            isCurr
                                ? 'bg-[#17243A] text-white border-[#17243A]'
                                : 'bg-white text-[#64748B] border-[#D8DEE8] hover:text-[#17243A] hover:bg-[#F5F7FA]'
                        }">
                        ${label}
                    </button>
                `;
            }).join('');

            const studentRowsHtml = paginatedRows.length > 0
                ? paginatedRows.map((r, idx) => {
                    let statusBadgeHtml = '';
                    if (r.isFailingOverall) {
                        statusBadgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]"><span>&#10005;</span><span>${escapeHtml(r.statusReason)}</span></span>`;
                    } else if (r.isQualified) {
                        statusBadgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>Passed &bull; Honor Qualified</span></span>`;
                    } else if (r.hasBelow85) {
                        statusBadgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9888;</span><span>${escapeHtml(r.statusReason)}</span></span>`;
                    } else if (r.isPassingOverall) {
                        statusBadgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>${escapeHtml(r.statusReason)}</span></span>`;
                    } else {
                        statusBadgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9203;</span><span>${escapeHtml(r.statusReason)}</span></span>`;
                    }

                    const minGradeColor = r.minGrade === null
                        ? 'text-[#64748B]'
                        : r.minGrade < GRADING_POLICY.passingGrade
                            ? 'text-[#842D60] font-bold'
                            : r.minGrade < GRADING_POLICY.honorSubjectFloor
                                ? 'text-[#80530F] font-bold'
                                : 'text-[#17243A]';

                    const avgColor = r.weightedAverage === null
                        ? 'text-[#64748B]'
                        : r.isFailingOverall
                            ? 'text-[#842D60]'
                            : r.weightedAverage >= GRADING_POLICY.honorAverage
                                ? 'text-[#0F766E]'
                                : 'text-[#17243A]';

                    const rowNumber = startIndex + idx + 1;

                    return `
                        <tr class="hover:bg-[#F5F7FA]/90 transition">
                            <td class="py-2.5 px-3 font-mono text-xs text-[#64748B]">${rowNumber}</td>
                            <td class="py-2.5 px-3 font-bold ${r.rank === 1 ? 'text-[#80530F]' : 'text-[#17243A]'}">${r.rank ? `#${r.rank}` : '—'}</td>
                            <td class="py-2.5 px-3 font-mono text-xs font-semibold text-[#64748B]">${escapeHtml(r.student.student_no)}</td>
                            <td class="py-2.5 px-3 font-semibold text-[#17243A]">${escapeHtml(r.student.full_name)}</td>
                            <td class="py-2.5 px-3 text-center font-mono ${minGradeColor}">${r.minGrade !== null ? r.minGrade.toFixed(0) : '—'}</td>
                            <td class="py-2.5 px-3 text-center font-display font-bold ${avgColor}">${r.weightedAverage !== null ? r.weightedAverage.toFixed(2) : '—'}</td>
                            <td class="py-2.5 px-3">${statusBadgeHtml}</td>
                            <td class="py-2.5 px-3 text-right whitespace-nowrap">
                                <div class="inline-flex items-center gap-1">
                                    <button type="button" onclick="App.openSectionGrading(${activeSec.id})" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer" title="Encode grades">
                                        Grade
                                    </button>
                                    <button type="button" onclick="App.openStudentModal(${r.student.id})" class="p-1.5 rounded-lg text-[#64748B] hover:text-[#17243A] hover:bg-[#EBF1F8] transition cursor-pointer" title="Edit or transfer student">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                        </svg>
                                    </button>
                                    <button type="button" onclick="App.confirmDeleteStudent(${r.student.id})" class="p-1.5 rounded-lg text-[#64748B] hover:text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Remove student from section">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')
                : `
                    <tr>
                        <td colspan="8" class="py-8 px-4 text-center">
                            <p class="text-sm font-bold text-[#17243A]">${searchQ ? 'No matching students in this section' : `No students enrolled in ${escapeHtml(activeSec.section_name)} yet`}</p>
                            <p class="text-xs text-[#64748B] mt-1">Adjust enrollment for ${escapeHtml(activeSec.section_name)} by adding a single student or bulk-enrolling a list.</p>
                            <div class="mt-3 inline-flex items-center gap-2">
                                <button type="button" onclick="App.openStudentModal(null, ${activeSec.id}, 'single')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer">
                                    + Add Student to ${escapeHtml(activeSec.section_name)}
                                </button>
                                <button type="button" onclick="App.openStudentModal(null, ${activeSec.id}, 'bulk')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#2C4870] bg-[#EBF1F8] hover:bg-[#dce6f4] border border-[#C5D5EA] transition cursor-pointer">
                                    + Bulk Add (1 per Line)
                                </button>
                            </div>
                        </td>
                    </tr>
                `;

            // Pagination buttons
            const pageButtonsHtml = [];
            for (let p = 1; p <= totalPages; p++) {
                const isActPage = p === currentPage;
                pageButtonsHtml.push(`
                    <button type="button" onclick="App.setDashboardPage(${p})"
                        class="w-7 h-7 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            isActPage
                                ? 'bg-[#17243A] text-white border-[#17243A]'
                                : 'bg-white text-[#17243A] border-[#D8DEE8] hover:bg-[#F5F7FA]'
                        }">
                        ${p}
                    </button>
                `);
            }

            secContainer.innerHTML = `
                <!-- Active Section Header Card -->
                <div class="p-4 rounded-2xl border border-[#D8DEE8] bg-[#F5F7FA]/70 space-y-3 shrink-0">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="font-display font-bold text-[#17243A] text-base sm:text-lg">${escapeHtml(activeSec.section_name)}</h4>
                                <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full border ${yearLevelBadgeClass(activeSec.year_level)}">
                                    ${escapeHtml(activeSec.year_level)}
                                </span>
                                <span class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]">
                                    ${activeSec.student_count} Enrolled Student${activeSec.student_count === 1 ? '' : 's'}
                                </span>
                                <span class="text-xs font-medium text-[#64748B]">&bull; ${formatUnits(activeSec.total_units)} units</span>
                                ${qualCount > 0 ? `<span class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">&#10003; ${qualCount} Honor Qualifier${qualCount === 1 ? '' : 's'}</span>` : ''}
                            </div>
                            <div class="flex items-center gap-2 text-xs text-[#64748B] mt-1 flex-wrap">
                                ${activeSec.adviser ? `<span>Adviser: <strong class="text-[#17243A]">${escapeHtml(activeSec.adviser)}</strong></span><span>&bull;</span>` : ''}
                                <code class="text-xs font-mono text-[#2C4870] bg-[#EBF1F8] px-2 py-0.5 rounded-md border border-[#C5D5EA]">${escapeHtml(formulaStr)}</code>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-1.5">
                            <button type="button" onclick="App.openStudentModal(null, ${activeSec.id}, 'single')" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#17243A] hover:bg-[#EBF1F8] border border-[#D8DEE8] transition cursor-pointer" title="Enroll a student into ${escapeHtml(activeSec.section_name)}">
                                + Add Student
                            </button>
                            <button type="button" onclick="App.openStudentModal(null, ${activeSec.id}, 'bulk')" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EBF1F8] text-[#2C4870] hover:bg-[#dce6f4] border border-[#C5D5EA] transition cursor-pointer" title="Bulk add multiple students to ${escapeHtml(activeSec.section_name)}">
                                + Bulk Add
                            </button>
                            <button type="button" onclick="App.openSectionGrading(${activeSec.id})" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#17243A] text-white hover:bg-[#243752] transition cursor-pointer">
                                Input Grades
                            </button>
                            <button type="button" onclick="App.openSectionReport(${activeSec.id})" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#D5F0EA] text-[#0F766E] hover:bg-[#c2e8df] border border-[#99D8CC] transition cursor-pointer">
                                Quarterly Ranking
                            </button>
                            <button type="button" onclick="App.openAssignSubjectsModal(${activeSec.id})" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#17243A] hover:bg-[#F5F7FA] border border-[#D8DEE8] transition cursor-pointer">
                                Subjects (${activeSec.subject_count})
                            </button>
                        </div>
                    </div>
                    ${subPills}
                </div>

                <!-- Enrolled Students List for Active Section (Default 10 Entries + Adjustable Limit & Enrollment) -->
                <div class="border border-[#D8DEE8] rounded-2xl overflow-hidden bg-white flex-1 flex flex-col min-h-0">
                    <!-- Table Toolbar: Show Entries Selector (10 Default) + Search + Adjust Enrolled Students -->
                    <div class="px-3.5 py-2.5 bg-[#F5F7FA] border-b border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs font-bold uppercase tracking-wider text-[#17243A]">
                                Students in ${escapeHtml(activeSec.section_name)}
                            </span>
                            <div class="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#D8DEE8]">
                                <label for="dashboardEntriesSelect" class="text-xs font-medium text-[#64748B]">Show:</label>
                                <select id="dashboardEntriesSelect" onchange="App.setDashboardPageSize(this.value)" class="text-xs font-bold text-[#17243A] bg-transparent outline-none cursor-pointer">
                                    ${pageSizeOptions}
                                </select>
                            </div>
                            <div class="hidden sm:inline-flex items-center gap-1" title="Quickly switch how many student entries are displayed">
                                ${pageSizeQuickPills}
                            </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                            <div class="relative">
                                <input type="text"
                                    value="${escapeHtml(state.dashboardStudentSearch)}"
                                    oninput="App.onDashboardStudentSearch(this.value)"
                                    placeholder="Search in ${escapeHtml(activeSec.section_name)}..."
                                    class="w-44 sm:w-52 px-3 py-1.5 text-xs rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] outline-none">
                            </div>
                            <button type="button" onclick="App.openSectionReport(${activeSec.id})" class="text-xs font-bold text-[#5276A7] hover:text-[#17243A] hover:underline cursor-pointer">
                                Full Report &rarr;
                            </button>
                        </div>
                    </div>

                    <!-- Students Table -->
                    <div class="flex-1 overflow-x-auto custom-scrollbar">
                        <table class="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr class="border-b border-[#D8DEE8] bg-[#F5F7FA]/60 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                    <th class="py-2.5 px-3 w-10">#</th>
                                    <th class="py-2.5 px-3">Rank</th>
                                    <th class="py-2.5 px-3">Student ID</th>
                                    <th class="py-2.5 px-3">Student Name</th>
                                    <th class="py-2.5 px-3 text-center">Min Grade</th>
                                    <th class="py-2.5 px-3 text-center">Weighted Avg</th>
                                    <th class="py-2.5 px-3">Status &amp; Honor Qualification</th>
                                    <th class="py-2.5 px-3 text-right">Manage</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#D8DEE8]/60">
                                ${studentRowsHtml}
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination & Entry Count Footer -->
                    <div class="px-3.5 py-2.5 bg-[#F5F7FA] border-t border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B] shrink-0">
                        <div>
                            Showing <strong class="text-[#17243A]">${startEntryNum}</strong> to <strong class="text-[#17243A]">${endEntryNum}</strong> of <strong class="text-[#17243A]">${totalMatching}</strong> student${totalMatching === 1 ? '' : 's'} enrolled in <strong class="text-[#17243A]">${escapeHtml(activeSec.section_name)}</strong>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button type="button"
                                onclick="App.setDashboardPage(${currentPage - 1})"
                                ${currentPage <= 1 ? 'disabled' : ''}
                                class="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#D8DEE8] bg-white text-[#17243A] hover:bg-[#EBF1F8] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer">
                                Prev
                            </button>
                            ${pageButtonsHtml.join('')}
                            <button type="button"
                                onclick="App.setDashboardPage(${currentPage + 1})"
                                ${currentPage >= totalPages ? 'disabled' : ''}
                                class="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#D8DEE8] bg-white text-[#17243A] hover:bg-[#EBF1F8] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // 3. Student Grade Overview Panel (Synced with Active Section on Dashboard)
        const activeSectionForOverview =
            state.sections.find(s => s.id === Number(state.dashboardSectionId)) || state.sections[0] || null;

        if (overviewSecBadge) {
            overviewSecBadge.textContent = activeSectionForOverview
                ? `${activeSectionForOverview.section_name} (${activeSectionForOverview.student_count})`
                : '0 Enrolled';
        }

        const overviewStudents = activeSectionForOverview
            ? state.students.filter(st => st.section_id === activeSectionForOverview.id)
            : state.students;

        if (overviewStudents.length === 0) {
            stuContainer.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center py-10 px-4">
                    <p class="text-base font-bold text-[#17243A]">No students in ${activeSectionForOverview ? escapeHtml(activeSectionForOverview.section_name) : 'this section'}</p>
                    <p class="text-sm text-[#64748B] mt-1">Enroll students individually or via bulk add (1 per line).</p>
                    <div class="mt-3.5 flex items-center gap-2">
                        <button type="button" onclick="App.openDashboardActiveSectionStudentModal('single')" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer">
                            + Add Student
                        </button>
                        <button type="button" onclick="App.openDashboardActiveSectionStudentModal('bulk')" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2C4870] bg-[#EBF1F8] hover:bg-[#dce6f4] border border-[#C5D5EA] transition cursor-pointer">
                            + Bulk Add
                        </button>
                    </div>
                </div>
            `;
        } else {
            stuContainer.innerHTML = overviewStudents.map(st => {
                const standings = standingsBySection[st.section_id];
                const stRow = standings?.rows.find(r => r.student.id === st.id);
                const avg = stRow ? stRow.weightedAverage : null;

                let scoreHtml = `<span class="font-display font-bold text-base text-[#64748B]">—</span>`;
                let statusPillHtml = `
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]">
                        <span>&#9203;</span>
                        <span>Pending</span>
                    </span>
                `;

                if (avg !== null) {
                    const roundedDisplay = Math.abs(avg - Math.round(avg)) < 0.05 ? Math.round(avg) : avg.toFixed(1);
                    if (stRow.isFailingOverall) {
                        scoreHtml = `<span class="font-display font-extrabold text-lg text-[#842D60]">${roundedDisplay}</span>`;
                        statusPillHtml = `
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]">
                                <span>&#10005;</span>
                                <span>Failed</span>
                            </span>
                        `;
                    } else {
                        scoreHtml = `<span class="font-display font-extrabold text-lg text-[#17243A]">${roundedDisplay}</span>`;
                        statusPillHtml = `
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                                <span>&#10003;</span>
                                <span>Passed</span>
                            </span>
                        `;
                    }
                }

                return `
                    <div class="py-3 px-3 flex items-center justify-between gap-3 hover:bg-[#F5F7FA] rounded-xl transition cursor-pointer" onclick="App.openSectionGrading(${st.section_id})" title="Click to open section grade sheet">
                        <div class="min-w-0">
                            <p class="text-sm font-bold text-[#17243A] truncate">${escapeHtml(st.full_name)}</p>
                            <div class="flex items-center gap-1.5 text-xs text-[#64748B] mt-0.5">
                                <span class="font-mono text-xs text-[#64748B]">${escapeHtml(st.student_no)}</span>
                                <span>&bull;</span>
                                <span class="font-semibold text-[#5276A7]">${escapeHtml(st.section_name)}</span>
                                <span>(${escapeHtml(st.year_level)})</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 shrink-0">
                            <div class="text-right">
                                ${scoreHtml}
                            </div>
                            ${statusPillHtml}
                        </div>
                    </div>
                `;
            }).join('');
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
                <div class="xl:col-span-2 bg-white rounded-2xl border border-[#D8DEE8] p-12 text-center">
                    <h4 class="font-display font-bold text-[#17243A] text-base">No sections found</h4>
                    <p class="text-sm text-[#64748B] mt-1 max-w-md mx-auto">Create a section with its year level so you can assign subjects, enroll students, and compute quarterly rankings.</p>
                    <button type="button" onclick="App.openSectionModal()" class="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer">
                        + Create Section
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map((sec, sIndex) => {
            const formulaStr = buildSectionFormulaString(sec.assigned_subjects, 21);
            const isFullWidthCard = filtered.length === 1 || (filtered.length % 2 === 1 && sIndex === filtered.length - 1);

            const subjectsListHtml = sec.assigned_subjects.length > 0
                ? `<div class="grid grid-cols-1 ${isFullWidthCard ? 'lg:grid-cols-2' : ''} gap-2">
                    ${sec.assigned_subjects.map((sub, idx) => `
                        <div class="px-3.5 py-2.5 flex items-center justify-between gap-2.5 rounded-xl border border-[#D8DEE8] bg-[#F5F7FA]/80 hover:bg-white transition">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-xs font-mono font-bold text-[#64748B]">Col ${excelColLetter(idx)}</span>
                                    <span class="font-mono text-xs font-bold text-[#2C4870] bg-[#EBF1F8] px-2 py-0.5 rounded-md border border-[#C5D5EA]">${escapeHtml(sub.subject_code)}</span>
                                    <span class="text-sm font-semibold text-[#17243A] truncate">${escapeHtml(sub.subject_name)}</span>
                                    <span class="text-xs font-bold text-[#0F766E] bg-[#D5F0EA] px-2 py-0.5 rounded-md border border-[#99D8CC]">*${formatUnits(sub.units)}u</span>
                                </div>
                                ${(sub.schedule || sub.instructor) ? `
                                    <div class="text-xs text-[#64748B] mt-1 flex items-center gap-1.5">
                                        ${sub.schedule ? `<span>${escapeHtml(sub.schedule)}</span>` : ''}
                                        ${sub.schedule && sub.instructor ? `<span>&bull;</span>` : ''}
                                        ${sub.instructor ? `<span>Teacher: ${escapeHtml(sub.instructor)}</span>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                                <button type="button" onclick="App.openSectionGrading(${sec.id}, ${sub.subject_id})" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer" title="Input grades for this subject">
                                    Input Grades
                                </button>
                                <button type="button" onclick="App.unassignSingleSubject(${sec.id}, ${sub.subject_id})" class="p-1.5 rounded-lg text-[#64748B] hover:text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Remove subject from this section">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                   </div>`
                : `<div class="rounded-xl border border-dashed border-[#D8DEE8] p-5 text-center bg-[#F5F7FA]/60">
                        <p class="text-sm text-[#64748B]">No subjects assigned to <strong class="text-[#17243A]">${escapeHtml(sec.section_name)}</strong> yet.</p>
                        <button type="button" onclick="App.openAssignSubjectsModal(${sec.id})" class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#5276A7] hover:text-[#17243A] cursor-pointer">
                            + Assign Subjects Now
                        </button>
                   </div>`;

            return `
                <div class="${isFullWidthCard ? 'xl:col-span-2' : ''} bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex flex-col justify-between p-4 sm:p-5 hover:border-[#5276A7] transition">
                    <div>
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="flex items-center gap-2.5 flex-wrap">
                                    <h3 class="font-display font-bold text-lg text-[#17243A]">${escapeHtml(sec.section_name)}</h3>
                                    <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full border ${yearLevelBadgeClass(sec.year_level)}">
                                        ${escapeHtml(sec.year_level)}
                                    </span>
                                </div>
                                <p class="text-xs sm:text-sm text-[#64748B] mt-1">
                                    ${sec.adviser ? `Adviser: <strong class="text-[#17243A]">${escapeHtml(sec.adviser)}</strong> &bull; ` : ''}
                                    <span>${sec.student_count} Student${sec.student_count === 1 ? '' : 's'}</span>
                                    &bull;
                                    <span>${sec.subject_count} Subject${sec.subject_count === 1 ? '' : 's'} (Divisor: <strong class="text-[#17243A]">${formatUnits(sec.total_units)} units</strong>)</span>
                                </p>
                            </div>

                            <div class="flex items-center gap-1.5">
                                <button type="button" onclick="App.openSectionModal(${sec.id})" class="p-2 rounded-xl text-[#64748B] hover:text-[#17243A] hover:bg-[#EBF1F8] transition cursor-pointer" title="Edit section details">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                    </svg>
                                </button>
                                <button type="button" onclick="App.confirmDeleteSection(${sec.id})" class="p-2 rounded-xl text-[#64748B] hover:text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Delete section">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Section Formula Preview -->
                        <div class="mt-3 px-3.5 py-2 rounded-xl bg-[#17243A] text-slate-200 text-xs flex items-center justify-between gap-2 overflow-x-auto">
                            <span class="text-slate-300 shrink-0 font-medium">Weighted Ranking Formula:</span>
                            <code class="text-[#D5F0EA] font-mono font-semibold truncate">${escapeHtml(formulaStr)}</code>
                        </div>

                        <div class="mt-3.5">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Assigned Subjects (${sec.subject_count})</span>
                                <button type="button" onclick="App.openAssignSubjectsModal(${sec.id})" class="text-xs sm:text-sm font-semibold text-[#5276A7] hover:text-[#17243A] cursor-pointer">
                                    + Assign / Manage Subjects
                                </button>
                            </div>
                            ${subjectsListHtml}
                        </div>
                    </div>

                    <div class="mt-4 pt-3 border-t border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2.5">
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="App.openStudentModal(null, ${sec.id})" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#17243A] bg-[#F5F7FA] hover:bg-[#EBF1F8] border border-[#D8DEE8] transition cursor-pointer">
                                + Add Student
                            </button>
                            <button type="button" onclick="App.openStudentModal(null, ${sec.id}, 'bulk')" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#2C4870] bg-[#EBF1F8] hover:bg-[#dce6f4] border border-[#C5D5EA] transition cursor-pointer" title="Bulk add multiple students (1 per line)">
                                + Bulk Add
                            </button>
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="App.openSectionGrading(${sec.id})" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer">
                                Teacher Grade Input
                            </button>
                            <button type="button" onclick="App.openSectionReport(${sec.id})" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#0F766E] bg-[#D5F0EA] hover:bg-[#c2e8df] border border-[#99D8CC] shadow-2xs transition cursor-pointer">
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
                    <td colspan="5" class="py-12 px-4 text-center">
                        <p class="text-base font-bold text-[#17243A]">No subjects found</p>
                        <p class="text-sm text-[#64748B] mt-1">Add subjects with their unit weight (e.g., 4, 3, 1) to compute section rankings.</p>
                        <button type="button" onclick="App.openSubjectModal()" class="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer">
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
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]">
                        <span>${escapeHtml(sec.section_name)}</span>
                        <span class="text-[#5276A7]">(${escapeHtml(sec.year_level)})</span>
                    </span>
                `).join('')
                : `<span class="text-xs text-[#64748B] italic">Not assigned to any section</span>`;

            return `
                <tr class="hover:bg-[#F5F7FA]/80 transition">
                    <td class="py-3 px-4 align-middle whitespace-nowrap">
                        <span class="font-mono text-xs sm:text-sm font-bold text-[#17243A] bg-[#EBF1F8] border border-[#C5D5EA] px-2.5 py-1 rounded-lg">
                            ${escapeHtml(sub.subject_code)}
                        </span>
                    </td>
                    <td class="py-3 px-4 align-middle">
                        <p class="font-semibold text-[#17243A] text-sm">${escapeHtml(sub.subject_name)}</p>
                        ${sub.description ? `<p class="text-xs text-[#64748B] mt-0.5">${escapeHtml(sub.description)}</p>` : ''}
                    </td>
                    <td class="py-3 px-4 align-middle text-center whitespace-nowrap">
                        <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                            *${formatUnits(sub.units)} u
                        </span>
                    </td>
                    <td class="py-3 px-4 align-middle">
                        <div class="flex flex-wrap gap-1.5">
                            ${sectionsBadges}
                        </div>
                    </td>
                    <td class="py-3 px-4 align-middle text-right whitespace-nowrap">
                        <div class="inline-flex items-center gap-1.5">
                            <button type="button" onclick="App.openSubjectModal(${sub.id})" class="p-2 rounded-xl text-[#64748B] hover:text-[#17243A] hover:bg-[#EBF1F8] transition cursor-pointer" title="Edit Subject">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                </svg>
                            </button>
                            <button type="button" onclick="App.confirmDeleteSubject(${sub.id})" class="p-2 rounded-xl text-[#64748B] hover:text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Delete Subject">
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
                    <td colspan="7" class="py-12 px-4 text-center">
                        <p class="text-base font-bold text-[#17243A]">No student records match your view</p>
                        <p class="text-sm text-[#64748B] mt-1">Enroll a student and assign them to a section and year level.</p>
                        <button type="button" onclick="App.openStudentModal()" class="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer">
                            + Add Student
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(st => {
            const statusClasses = {
                Active: 'bg-[#D5F0EA] text-[#0F766E] border-[#99D8CC]',
                Irregular: 'bg-[#FFF0D1] text-[#80530F] border-[#F0D296]',
                Inactive: 'bg-[#F5DFEB] text-[#842D60] border-[#E2B8CF]',
            };
            const statusIcons = {
                Active: '&#10003;',
                Irregular: '&#9888;',
                Inactive: '&#10005;',
            };

            const subjectBadges = st.assigned_subjects.length > 0
                ? st.assigned_subjects.map(sub => `
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#F5F7FA] text-[#17243A] border border-[#D8DEE8]" title="${escapeHtml(sub.subject_name)}">
                        <span>${escapeHtml(sub.subject_code)}</span>
                        <span class="text-[#5276A7] font-bold">*${formatUnits(sub.units)}</span>
                    </span>
                `).join('')
                : `<button type="button" onclick="App.openAssignSubjectsModal(${st.section_id})" class="text-xs font-semibold text-[#80530F] bg-[#FFF0D1] px-2.5 py-1 rounded-lg border border-[#F0D296] hover:underline cursor-pointer">&#9888; No subjects assigned to section yet &rarr;</button>`;

            return `
                <tr class="hover:bg-[#F5F7FA]/80 transition">
                    <td class="py-3 px-4 align-middle whitespace-nowrap">
                        <span class="font-mono text-xs sm:text-sm font-semibold text-[#17243A] bg-[#F5F7FA] border border-[#D8DEE8] px-2.5 py-1 rounded-lg">${escapeHtml(st.student_no)}</span>
                    </td>
                    <td class="py-3 px-4 align-middle">
                        <p class="font-semibold text-[#17243A] text-sm">${escapeHtml(st.full_name)}</p>
                    </td>
                    <td class="py-3 px-4 align-middle whitespace-nowrap">
                        <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${yearLevelBadgeClass(st.year_level)}">
                            ${escapeHtml(st.year_level)}
                        </span>
                    </td>
                    <td class="py-3 px-4 align-middle whitespace-nowrap">
                        <button type="button" onclick="App.openSectionGrading(${st.section_id})" class="inline-flex items-center gap-1.5 font-semibold text-[#2C4870] hover:text-[#17243A] bg-[#EBF1F8] hover:bg-[#dce6f4] px-2.5 py-1 rounded-lg text-xs sm:text-sm border border-[#C5D5EA] transition cursor-pointer" title="Click to input grades for this section">
                            <span>${escapeHtml(st.section_name)}</span>
                        </button>
                    </td>
                    <td class="py-3 px-4 align-middle">
                        <div class="flex flex-wrap gap-1.5">
                            ${subjectBadges}
                        </div>
                    </td>
                    <td class="py-3 px-4 align-middle whitespace-nowrap">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${statusClasses[st.status] || statusClasses.Active}">
                            <span>${statusIcons[st.status] || '&#10003;'}</span>
                            <span>${escapeHtml(st.status)}</span>
                        </span>
                    </td>
                    <td class="py-3 px-4 align-middle text-right whitespace-nowrap">
                        <div class="inline-flex items-center gap-1.5">
                            <button type="button" onclick="App.openSectionGrading(${st.section_id})" class="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer" title="Input Grades">
                                Grades
                            </button>
                            <button type="button" onclick="App.openStudentModal(${st.id})" class="p-2 rounded-xl text-[#64748B] hover:text-[#17243A] hover:bg-[#EBF1F8] transition cursor-pointer" title="Edit Student">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                </svg>
                            </button>
                            <button type="button" onclick="App.confirmDeleteStudent(${st.id})" class="p-2 rounded-xl text-[#64748B] hover:text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Delete Student">
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
            badge.className = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]';
            badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-[#5276A7] animate-ping"></span><span>Saving...</span>`;
        } else if (status === 'dirty') {
            badge.className = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]';
            badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-[#B7791F]"></span><span>&#9888; Unsaved Changes</span>`;
        } else {
            badge.className = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]';
            badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-[#0F766E]"></span><span>All Saved &#10003;</span>`;
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

        document.querySelectorAll('.qtr-tab-btn').forEach(btn => {
            const isAct = btn.getAttribute('data-qtr-btn') === state.gradingQuarter;
            btn.className = isAct
                ? 'qtr-tab-btn px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#17243A] text-white shadow-2xs transition cursor-pointer text-center'
                : 'qtr-tab-btn px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#17243A] transition cursor-pointer text-center';
        });

        if (state.sections.length === 0) {
            secSelect.innerHTML = `<option value="">No sections available</option>`;
            subSelect.innerHTML = `<option value="ALL">No subjects assigned</option>`;
            if (tabsContainer) tabsContainer.innerHTML = '';
            container.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <p class="text-base font-display font-bold text-[#17243A]">No Sections Available</p>
                    <p class="text-sm text-[#64748B] mt-1">Create a section, assign subjects, and enroll students first—or load the 28-unit demo data.</p>
                    <div class="mt-4 flex justify-center gap-2.5">
                        <button type="button" onclick="App.seedSampleData()" class="px-4 py-2 rounded-xl text-sm font-semibold text-[#0F766E] bg-[#D5F0EA] hover:bg-[#c2e8df] border border-[#99D8CC] cursor-pointer">
                            Load 28-Unit Demo Data
                        </button>
                        <button type="button" onclick="App.openSectionModal()" class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] cursor-pointer">
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
                        class="flex-1 min-w-fit inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition cursor-pointer ${
                            isSelected
                                ? 'bg-[#5276A7] text-white border-[#5276A7] shadow-2xs'
                                : 'bg-[#F5F7FA] text-[#17243A] border-[#D8DEE8] hover:bg-[#EBF1F8]'
                        }">
                        <span class="font-mono text-xs ${isSelected ? 'text-white/80' : 'text-[#64748B]'}">${col}:</span>
                        <span>${escapeHtml(sub.subject_code)}</span>
                        <span class="text-xs ${isSelected ? 'text-[#D5F0EA]' : 'text-[#0F766E]'}">*${formatUnits(sub.units)}u</span>
                        <span class="px-2 py-0.5 rounded-full text-xs ${
                            isSelected
                                ? 'bg-white/20 text-white'
                                : isCompleteSub
                                    ? 'bg-[#D5F0EA] text-[#0F766E]'
                                    : 'bg-[#EBF1F8] text-[#2C4870]'
                        }">${subGradedCount}/${totalStudentsCount}${isCompleteSub ? ' &#10003;' : ''}</span>
                    </button>
                `;
            });

            const isAllSelected = state.gradingSubjectId === 'ALL';
            tabsContainer.innerHTML = [
                `<button type="button" onclick="App.setGradingSubjectTab('ALL')"
                    class="flex-1 min-w-fit inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition cursor-pointer ${
                        isAllSelected
                            ? 'bg-[#17243A] text-white border-[#17243A] shadow-2xs'
                            : 'bg-white text-[#17243A] border-[#D8DEE8] hover:bg-[#F5F7FA]'
                    }">
                    <span>All Subjects Sheet</span>
                    <span class="px-2 py-0.5 rounded-full text-xs ${isAllSelected ? 'bg-[#D5F0EA] text-[#0F766E]' : 'bg-[#F5F7FA] text-[#64748B]'}">
                        ${filledCells}/${totalCells}
                    </span>
                </button>`,
                ...subTabBtns,
            ].join('');
        }

        const formulaStr = buildSectionFormulaString(assignedSubjects, 21);
        document.getElementById('gradingFormulaCode').textContent = formulaStr;
        document.getElementById('gradingMetaSummary').textContent =
            `${activeSection.section_name} (${formatUnits(activeSection.total_units)}u)`;

        if (assignedSubjects.length === 0) {
            container.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <p class="text-base font-display font-bold text-[#17243A]">No Subjects Assigned to ${escapeHtml(activeSection.section_name)}</p>
                    <p class="text-sm text-[#64748B] mt-1">Assign subjects to this section first so teachers can input student grades.</p>
                    <button type="button" onclick="App.openAssignSubjectsModal(${activeSection.id})" class="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] cursor-pointer">
                        + Assign Subjects to ${escapeHtml(activeSection.section_name)}
                    </button>
                </div>
            `;
            return;
        }

        if (!standings || standings.rows.length === 0) {
            container.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <p class="text-base font-display font-bold text-[#17243A]">No Students Enrolled in ${escapeHtml(activeSection.section_name)}</p>
                    <p class="text-sm text-[#64748B] mt-1">Enroll students into ${escapeHtml(activeSection.section_name)} to start inputting their grades.</p>
                    <button type="button" onclick="App.openStudentModal(null, ${activeSection.id})" class="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] cursor-pointer">
                        + Enroll Student in ${escapeHtml(activeSection.section_name)}
                    </button>
                </div>
            `;
            return;
        }

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
            const evalInfo = evaluateGradePolicy(sr?.grade);

            const presetChips = [85, 88, 90, 92, 95].map(p => `
                <button type="button" tabindex="-1"
                    onclick="App.setSingleStudentGrade(${st.id}, ${section.id}, ${subjectId}, ${p})"
                    class="px-2 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        Number(currentVal) === p
                            ? 'bg-[#17243A] text-white border-[#17243A]'
                            : 'bg-[#F5F7FA] text-[#17243A] border-[#D8DEE8] hover:bg-[#EBF1F8]'
                    }">${p}</button>
            `).join('');

            return `
                <tr class="hover:bg-[#F5F7FA] transition text-sm" id="singleRow_${st.id}" data-student-row="${st.id}">
                    <td class="py-2.5 px-3.5 font-mono text-xs text-[#64748B]">${colLetter}${row.excel_row}</td>
                    <td class="py-2.5 px-3.5 font-mono text-xs font-semibold text-[#17243A]">${escapeHtml(st.student_no)}</td>
                    <td class="py-2.5 px-3.5 font-semibold text-[#17243A]">${escapeHtml(st.full_name)}</td>
                    <td class="py-2.5 px-3.5 text-center">
                        <div class="inline-flex items-center justify-center gap-2">
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
                                class="w-24 px-2.5 py-1.5 text-center font-bold text-sm rounded-xl border ${evalInfo.inputClass} focus:border-[#17243A] focus:ring-2 focus:ring-[#5276A7]/25 outline-none">
                            <div class="hidden sm:inline-flex items-center gap-1">
                                ${presetChips}
                            </div>
                        </div>
                    </td>
                    <td class="py-2.5 px-3.5 text-center font-mono text-xs sm:text-sm font-semibold text-[#17243A]" data-weighted-cell="${st.id}">
                        ${weightedVal}
                    </td>
                    <td class="py-2.5 px-3.5 text-center" data-remark-cell="${st.id}">
                        ${renderSingleGradeBadge(sr?.grade)}
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="px-4 py-3 bg-[#F5F7FA] border-b border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div class="flex items-center gap-2.5 flex-wrap">
                    <span class="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#17243A] text-white">Col ${colLetter}</span>
                    <h3 class="font-display font-bold text-[#17243A] text-sm sm:text-base">${escapeHtml(sub.subject_code)} — ${escapeHtml(sub.subject_name)}</h3>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">*${formatUnits(sub.units)} Units</span>
                    <span class="text-xs sm:text-sm text-[#64748B]">
                        &bull; ${escapeHtml(section.section_name)} (${escapeHtml(state.gradingQuarter)})
                        ${sub.instructor ? `&bull; Teacher: <strong class="text-[#17243A]">${escapeHtml(sub.instructor)}</strong>` : ''}
                    </span>
                </div>
                <span class="text-xs text-[#64748B] font-medium">Policy: Pass &ge; ${GRADING_POLICY.passingGrade} &bull; Honor Floor &ge; ${GRADING_POLICY.honorSubjectFloor}</span>
            </div>
            <div class="flex-1 overflow-auto custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead class="sticky top-0 z-10">
                        <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                            <th class="py-3 px-3.5">Cell</th>
                            <th class="py-3 px-3.5">Student ID</th>
                            <th class="py-3 px-3.5">Student Name</th>
                            <th class="py-3 px-3.5 text-center">${escapeHtml(state.gradingQuarter)} Grade (${colLetter}) &amp; Quick Presets</th>
                            <th class="py-3 px-3.5 text-center">Weighted (${colLetter}*${formatUnits(sub.units)})</th>
                            <th class="py-3 px-3.5 text-center">Academic Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#D8DEE8]/60 text-sm">
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderSingleGradeBadge(grade) {
        if (grade === null || grade === undefined || grade === '' || isNaN(Number(grade))) {
            return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9203;</span><span>Pending</span></span>`;
        }
        const g = Number(grade);
        if (g >= GRADING_POLICY.honorAverage) {
            return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>Passed &bull; 90+ Honor (${g.toFixed(0)})</span></span>`;
        }
        if (g >= GRADING_POLICY.honorSubjectFloor) {
            return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>Passed &ge; 85 (${g.toFixed(0)})</span></span>`;
        }
        if (g >= GRADING_POLICY.passingGrade) {
            return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9888;</span><span>Passed &bull; Below 85 (${g.toFixed(0)})</span></span>`;
        }
        return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]"><span>&#10005;</span><span>Failed (&lt; ${GRADING_POLICY.passingGrade})</span></span>`;
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
                <th class="py-2.5 px-2 text-center min-w-[82px] border-l border-[#D8DEE8]">
                    <button type="button" onclick="App.setGradingSubjectTab('${sub.subject_id}')" class="w-full text-center group cursor-pointer" title="Click to focus only on ${escapeHtml(sub.subject_code)} (${escapeHtml(sub.subject_name)})">
                        <div class="text-xs font-mono font-bold text-[#5276A7] group-hover:underline">${col}21*${formatUnits(sub.units)}</div>
                        <div class="text-xs font-bold text-[#17243A] truncate">${escapeHtml(sub.subject_code)}</div>
                        <div class="text-xs font-medium text-[#0F766E]">${formatUnits(sub.units)}u</div>
                    </button>
                </th>
            `;
        }).join('');

        const bodyRowsHtml = standings.rows.map((row, rIdx) => {
            const st = row.student;
            const rank = rankByStudentId[st.id];
            const inputsHtml = row.subjectResults.map((sr, cIdx) => {
                const val = sr.grade !== null ? sr.grade : '';
                const evalInfo = evaluateGradePolicy(sr.grade);
                return `
                    <td class="py-2 px-1.5 text-center border-l border-[#D8DEE8]/50">
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
                            class="w-full min-w-[68px] max-w-[86px] px-2 py-1.5 text-center font-bold text-sm rounded-xl border ${evalInfo.inputClass} focus:border-[#17243A] focus:ring-2 focus:ring-[#5276A7]/25 outline-none">
                    </td>
                `;
            }).join('');

            const avgText = row.weightedAverage !== null ? row.weightedAverage.toFixed(2) : '—';
            let qualBadge = '';
            if (row.isFailingOverall) {
                qualBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]"><span>&#10005;</span><span>${escapeHtml(row.statusReason)}</span></span>`;
            } else if (row.isQualified) {
                qualBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>QUALIFIED (≥90 &amp; No &lt;85)</span></span>`;
            } else if (row.hasBelow85) {
                qualBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9888;</span><span>${escapeHtml(row.statusReason)}</span></span>`;
            } else if (row.isPassingOverall) {
                qualBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>${escapeHtml(row.statusReason)}</span></span>`;
            } else {
                qualBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9203;</span><span>${escapeHtml(row.statusReason)}</span></span>`;
            }

            const avgColor = row.weightedAverage === null
                ? 'text-[#64748B]'
                : row.isFailingOverall
                    ? 'text-[#842D60]'
                    : row.weightedAverage >= GRADING_POLICY.honorAverage
                        ? 'text-[#0F766E]'
                        : 'text-[#17243A]';

            return `
                <tr class="hover:bg-[#F5F7FA] transition text-sm" id="masterRow_${st.id}" data-excel-row="${row.excel_row}">
                    <td class="py-2 px-2.5 font-mono text-xs text-[#64748B] whitespace-nowrap">#${row.excel_row}</td>
                    <td class="py-2 px-3.5 whitespace-nowrap sticky left-0 bg-white/95 backdrop-blur-xs z-10 border-r border-[#D8DEE8]">
                        <div class="font-semibold text-[#17243A] text-sm">${escapeHtml(st.full_name)}</div>
                        <div class="font-mono text-xs text-[#64748B]">${escapeHtml(st.student_no)}</div>
                    </td>
                    ${inputsHtml}
                    <td class="py-2 px-2.5 text-center font-mono text-xs text-[#64748B] border-l border-[#D8DEE8] whitespace-nowrap" id="masterSum_${st.id}">
                        ${row.gradedCount > 0 ? `${row.weightedSum.toFixed(1)} / ${formatUnits(row.isComplete ? row.totalSectionUnits : row.gradedUnits)}` : '—'}
                    </td>
                    <td class="py-2 px-2.5 text-center border-l border-[#D8DEE8] whitespace-nowrap" id="masterAvg_${st.id}">
                        <span class="font-display font-bold text-sm ${avgColor}">
                            ${avgText}
                        </span>
                    </td>
                    <td class="py-2 px-2.5 text-center border-l border-[#D8DEE8] whitespace-nowrap" id="masterRank_${st.id}">
                        ${rank ? `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${rank === 1 ? 'bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]' : 'bg-[#F5F7FA] text-[#17243A] border border-[#D8DEE8]'}">${rank}</span>` : '—'}
                    </td>
                    <td class="py-2 px-3.5 text-left border-l border-[#D8DEE8] whitespace-nowrap" id="masterQual_${st.id}">
                        ${qualBadge}
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="px-4 py-3 bg-[#F5F7FA] border-b border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div class="flex items-center gap-2">
                    <h3 class="font-display font-bold text-[#17243A] text-sm sm:text-base">
                        Master Grade Sheet — ${escapeHtml(section.section_name)} (${escapeHtml(section.year_level)}) &bull; ${escapeHtml(state.gradingQuarter)}
                    </h3>
                    <span class="text-xs text-[#64748B] hidden sm:inline">
                        &bull; Click any subject column header to switch to single-subject focus mode
                    </span>
                </div>
                <span class="text-xs sm:text-sm text-[#64748B]">Divisor: <strong class="text-[#17243A]">${formatUnits(section.total_units)} Total Units</strong></span>
            </div>
            <div class="flex-1 overflow-auto custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead class="sticky top-0 z-20">
                        <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                            <th class="py-2.5 px-2.5">Row</th>
                            <th class="py-2.5 px-3.5 min-w-[180px] sticky left-0 bg-[#F5F7FA] z-20 border-r border-[#D8DEE8]">Student</th>
                            ${subjectHeadersHtml}
                            <th class="py-2.5 px-2.5 text-center border-l border-[#D8DEE8]">Sum / Units</th>
                            <th class="py-2.5 px-2.5 text-center border-l border-[#D8DEE8]">Weighted Avg</th>
                            <th class="py-2.5 px-2.5 text-center border-l border-[#D8DEE8]">Rank</th>
                            <th class="py-2.5 px-3.5 border-l border-[#D8DEE8]">Status &amp; Honor Pullout Check</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#D8DEE8]/60 text-sm">
                        ${bodyRowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }

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
            metaSummaryEl.innerHTML = `<strong class="text-white">${escapeHtml(student.full_name)}</strong> (#${excelRow})`;
        }
    }

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

    function applyGradeInputCellColors(inputEl, num) {
        inputEl.classList.remove(
            'border-[#D8DEE8]', 'bg-white', 'text-[#17243A]',
            'border-[#B7791F]', 'bg-[#FFF0D1]/60', 'text-[#80530F]',
            'border-[#9B3F72]', 'bg-[#F5DFEB]/60', 'text-[#842D60]'
        );
        const evalInfo = evaluateGradePolicy(num);
        evalInfo.inputClass.split(' ').forEach(cls => inputEl.classList.add(cls));
    }

    function onLiveGradeCellInput(inputEl) {
        updateSaveStatusBadge('dirty');
        const stId = Number(inputEl.getAttribute('data-student-id'));
        const secId = Number(inputEl.getAttribute('data-section-id'));
        const units = Number(inputEl.getAttribute('data-units') || 0);
        const val = inputEl.value.trim();
        const num = val !== '' && !isNaN(Number(val)) ? Number(val) : null;

        applyGradeInputCellColors(inputEl, num);

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
        let hasFailing = false;
        const below85Codes = [];
        const failingCodes = [];

        inputs.forEach((inp, idx) => {
            const raw = inp.value.trim();
            const units = Number(inp.getAttribute('data-units') || 0);
            const subCode = section.assigned_subjects[idx]?.subject_code || `S${idx + 1}`;
            if (raw !== '' && !isNaN(Number(raw))) {
                const g = Number(raw);
                weightedSum += g * units;
                gradedUnits += units;
                gradedCount++;
                applyGradeInputCellColors(inp, g);
                if (g < GRADING_POLICY.passingGrade) {
                    hasFailing = true;
                    failingCodes.push(`${subCode} (${g})`);
                }
                if (g < GRADING_POLICY.honorSubjectFloor) {
                    hasBelow85 = true;
                    below85Codes.push(`${subCode} (${g})`);
                }
            } else {
                applyGradeInputCellColors(inp, null);
            }
        });

        const isComplete = inputs.length > 0 && gradedCount === inputs.length;
        const divisor = isComplete ? totalSectionUnits : gradedUnits;
        const avg = divisor > 0 ? weightedSum / divisor : null;
        const isFailingOverall = hasFailing || (avg !== null && avg < GRADING_POLICY.passingGrade);

        const sumCell = document.getElementById(`masterSum_${studentId}`);
        if (sumCell) {
            sumCell.textContent = gradedCount > 0 ? `${weightedSum.toFixed(1)} / ${formatUnits(divisor)}` : '—';
        }

        const avgCell = document.getElementById(`masterAvg_${studentId}`);
        if (avgCell) {
            const avgColor = avg === null
                ? 'text-[#64748B]'
                : isFailingOverall
                    ? 'text-[#842D60]'
                    : avg >= GRADING_POLICY.honorAverage
                        ? 'text-[#0F766E]'
                        : 'text-[#17243A]';
            avgCell.innerHTML = `<span class="font-display font-bold text-sm ${avgColor}">${avg !== null ? avg.toFixed(2) : '—'}</span>`;
        }

        const qualCell = document.getElementById(`masterQual_${studentId}`);
        if (qualCell) {
            if (isFailingOverall) {
                qualCell.innerHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]"><span>&#10005;</span><span>Failed: ${escapeHtml(failingCodes.join(', ') || avg?.toFixed(2))}</span></span>`;
            } else if (!isComplete) {
                qualCell.innerHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9203;</span><span>Pending (${gradedCount}/${inputs.length})</span></span>`;
            } else if (!hasBelow85 && avg !== null && avg >= (GRADING_POLICY.honorAverage - 0.0001)) {
                qualCell.innerHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>QUALIFIED (≥90 &amp; No &lt;85)</span></span>`;
            } else if (hasBelow85) {
                qualCell.innerHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9888;</span><span>Passed · Below 85: ${escapeHtml(below85Codes.join(', '))}</span></span>`;
            } else {
                qualCell.innerHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>Passed · Avg ${avg.toFixed(2)} (&lt;90)</span></span>`;
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
                <div class="bg-white rounded-2xl border border-[#D8DEE8] p-12 text-center">
                    <h3 class="font-display font-bold text-[#17243A] text-base">No Sections Available for Quarterly Report</h3>
                    <p class="text-sm text-[#64748B] mt-1">Load the 28-unit sample curriculum and grades to see automated section rankings and the Honor Qualifier pullout.</p>
                    <button type="button" onclick="App.seedSampleData()" class="mt-4 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] cursor-pointer">
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

        const gradedStudents = standings.rankedRows.filter(r => r.weightedAverage !== null);
        const sectionMean = gradedStudents.length > 0
            ? (gradedStudents.reduce((acc, r) => acc + r.weightedAverage, 0) / gradedStudents.length).toFixed(2)
            : '—';

        const pulloutHtml = standings.qualifiers.length > 0
            ? `
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr class="bg-[#D5F0EA]/60 border-b border-[#99D8CC] text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                                <th class="py-2.5 px-3.5">Rank</th>
                                <th class="py-2.5 px-3.5">Student ID</th>
                                <th class="py-2.5 px-3.5">Student Name</th>
                                <th class="py-2.5 px-3.5">Subject Grades (All Verified &ge; 85)</th>
                                <th class="py-2.5 px-3.5 text-center">Lowest Subject Grade</th>
                                <th class="py-2.5 px-3.5 text-center">Weighted Average (&ge; 90)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#D8DEE8]/70 text-sm bg-white">
                            ${standings.qualifiers.map(q => `
                                <tr class="hover:bg-[#D5F0EA]/25 transition">
                                    <td class="py-2.5 px-3.5 whitespace-nowrap">
                                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#17243A] text-white shadow-2xs">
                                            Rank #${q.rank}
                                        </span>
                                    </td>
                                    <td class="py-2.5 px-3.5 font-mono text-xs font-semibold text-[#64748B] whitespace-nowrap">
                                        ${escapeHtml(q.student.student_no)}
                                    </td>
                                    <td class="py-2.5 px-3.5 font-display font-bold text-[#17243A] whitespace-nowrap">
                                        ${escapeHtml(q.student.full_name)}
                                    </td>
                                    <td class="py-2.5 px-3.5">
                                        <div class="flex flex-wrap gap-1.5">
                                            ${q.subjectResults.map(sr => `
                                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                                                    <strong>${escapeHtml(sr.subject_code)}:</strong>
                                                    <span>${sr.grade !== null ? sr.grade.toFixed(0) : '—'}</span>
                                                    <span class="text-[#0F766E]/80">(*${formatUnits(sr.units)})</span>
                                                </span>
                                            `).join('')}
                                        </div>
                                    </td>
                                    <td class="py-2.5 px-3.5 text-center whitespace-nowrap">
                                        <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                                            &#10003; ${q.minGrade !== null ? q.minGrade.toFixed(2) : '—'} (${escapeHtml(q.minGradeSubject || '')}) &ge; 85
                                        </span>
                                    </td>
                                    <td class="py-2.5 px-3.5 text-center whitespace-nowrap">
                                        <span class="font-display font-extrabold text-sm text-[#0F766E] bg-[#D5F0EA] px-3 py-1 rounded-xl border border-[#99D8CC]">
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
                    <p class="text-sm font-semibold text-[#17243A]">No students currently meet both qualification criteria for ${escapeHtml(quarterTitle)}</p>
                    <p class="text-xs text-[#64748B] mt-1">To be pulled out here, a student must have complete grades in all assigned subjects, <strong>no subject grade below 85</strong>, and a <strong>weighted average of 90.00 or above</strong>.</p>
                </div>
            `;

        const subjectColsHeader = standings.subjects.map(sub => {
            const idx = standings.subjects.indexOf(sub);
            const col = excelColLetter(idx);
            return `
                <th class="py-2.5 px-2 text-center border-l border-[#D8DEE8]">
                    <div class="text-xs font-mono font-bold text-[#5276A7]">${col}*${formatUnits(sub.units)}</div>
                    <div class="text-xs font-bold text-[#17243A]">${escapeHtml(sub.subject_code)}</div>
                    <div class="text-xs text-[#64748B]">${formatUnits(sub.units)}u</div>
                </th>
            `;
        }).join('');

        const fullRankingRowsHtml = standings.rankedRows.length > 0
            ? standings.rankedRows.map(r => {
                const subCells = r.subjectResults.map(sr => {
                    if (sr.grade === null) {
                        return `<td class="py-2 px-2 text-center text-xs text-[#64748B] border-l border-[#D8DEE8]/50">—</td>`;
                    }
                    const isFailing = sr.grade < GRADING_POLICY.passingGrade;
                    const isBelow85 = sr.grade >= GRADING_POLICY.passingGrade && sr.grade < GRADING_POLICY.honorSubjectFloor;
                    const cellBg = isFailing
                        ? 'bg-[#F5DFEB]/70'
                        : isBelow85
                            ? 'bg-[#FFF0D1]/70'
                            : '';
                    const textColor = isFailing
                        ? 'text-[#842D60] font-bold'
                        : isBelow85
                            ? 'text-[#80530F] font-bold'
                            : 'text-[#17243A]';
                    return `
                        <td class="py-2 px-2 text-center border-l border-[#D8DEE8]/50 ${cellBg}">
                            <div class="font-semibold text-sm ${textColor}">
                                ${sr.grade.toFixed(0)}
                            </div>
                            <div class="text-xs font-mono text-[#64748B]">
                                (${sr.weighted_product.toFixed(0)})
                            </div>
                        </td>
                    `;
                }).join('');

                const studentFormulaTerms = r.subjectResults
                    .map(sr => `(${sr.grade !== null ? sr.grade.toFixed(0) : 0}*${formatUnits(sr.units)})`)
                    .join('+');
                const studentExactFormula = `((${studentFormulaTerms})/${formatUnits(r.totalSectionUnits)})`;

                let badgeHtml = '';
                if (r.isFailingOverall) {
                    badgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]">
                        <span>&#10005;</span>
                        <span>${escapeHtml(r.statusReason)}</span>
                       </span>`;
                } else if (r.isQualified) {
                    badgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                        <span>&#10003;</span>
                        <span>Passed &bull; Honor Pulled Out (Avg &ge; 90 &amp; No &lt; 85)</span>
                       </span>`;
                } else if (r.hasBelow85) {
                    badgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]">
                        <span>&#9888;</span>
                        <span>${escapeHtml(r.statusReason)}</span>
                       </span>`;
                } else if (r.isPassingOverall) {
                    badgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                        <span>&#10003;</span>
                        <span>${escapeHtml(r.statusReason)}</span>
                       </span>`;
                } else {
                    badgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]">
                        <span>&#9203;</span>
                        <span>${escapeHtml(r.statusReason)}</span>
                       </span>`;
                }

                const minGradeColor = r.minGrade === null
                    ? 'text-[#64748B]'
                    : r.minGrade < GRADING_POLICY.passingGrade
                        ? 'text-[#842D60] font-bold'
                        : r.minGrade < GRADING_POLICY.honorSubjectFloor
                            ? 'text-[#80530F] font-bold'
                            : 'text-[#17243A]';

                const avgColor = r.weightedAverage === null
                    ? 'text-[#64748B]'
                    : r.isFailingOverall
                        ? 'text-[#842D60]'
                        : r.weightedAverage >= GRADING_POLICY.honorAverage
                            ? 'text-[#0F766E]'
                            : 'text-[#17243A]';

                return `
                    <tr class="hover:bg-[#F5F7FA] transition text-sm ${r.isQualified ? 'bg-[#D5F0EA]/20' : r.isFailingOverall ? 'bg-[#F5DFEB]/20' : ''}">
                        <td class="py-2 px-3 whitespace-nowrap text-center">
                            ${r.rank ? `
                                <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${r.rank === 1 ? 'bg-[#17243A] text-white shadow-2xs' : r.rank <= 3 ? 'bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]' : 'bg-[#F5F7FA] text-[#17243A] border border-[#D8DEE8]'}">
                                    ${r.rank}
                                </span>
                            ` : '—'}
                        </td>
                        <td class="py-2 px-3.5 whitespace-nowrap">
                            <div class="font-semibold text-[#17243A] text-sm">${escapeHtml(r.student.full_name)}</div>
                            <div class="font-mono text-xs text-[#64748B]">${escapeHtml(r.student.student_no)} &bull; Row ${r.excel_row}</div>
                        </td>
                        ${subCells}
                        <td class="py-2 px-2.5 text-center font-mono text-xs text-[#64748B] border-l border-[#D8DEE8]" title="${escapeHtml(studentExactFormula)}">
                            ${r.gradedCount > 0 ? `${r.weightedSum.toFixed(1)} / ${formatUnits(r.isComplete ? r.totalSectionUnits : r.gradedUnits)}` : '—'}
                        </td>
                        <td class="py-2 px-2.5 text-center border-l border-[#D8DEE8] whitespace-nowrap">
                            ${r.minGrade !== null ? `<span class="text-xs sm:text-sm font-semibold ${minGradeColor}">${r.minGrade.toFixed(0)}</span>` : '—'}
                        </td>
                        <td class="py-2 px-3 text-center border-l border-[#D8DEE8] whitespace-nowrap">
                            <span class="font-display font-extrabold text-sm ${avgColor}">
                                ${r.weightedAverage !== null ? r.weightedAverage.toFixed(2) : '—'}
                            </span>
                        </td>
                        <td class="py-2 px-3.5 border-l border-[#D8DEE8] whitespace-nowrap">
                            ${badgeHtml}
                        </td>
                    </tr>
                `;
            }).join('')
            : `<tr><td colspan="${standings.subjects.length + 6}" class="py-10 text-center text-sm text-[#64748B]">No students enrolled in this section yet.</td></tr>`;

        container.innerHTML = `
            <!-- Report Summary Header Card (Midnight Navy #17243A) -->
            <div class="bg-[#17243A] text-white rounded-2xl p-4 sm:p-5 shadow-sm shrink-0">
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2.5 flex-wrap">
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E]">
                                &#10003; Automated Quarterly Report
                            </span>
                            <span class="text-xs sm:text-sm text-slate-300">${escapeHtml(quarterTitle)}</span>
                        </div>
                        <h3 class="font-display font-bold text-lg sm:text-xl mt-1">
                            ${escapeHtml(activeSection.section_name)} — ${escapeHtml(activeSection.year_level)}
                        </h3>
                        <p class="text-xs sm:text-sm text-slate-300 mt-1">
                            ${activeSection.adviser ? `Class Adviser: <strong>${escapeHtml(activeSection.adviser)}</strong> &bull; ` : ''}
                            Weighted Formula: <code class="text-[#FFF0D1] font-mono">${escapeHtml(standings.formulaString)}</code>
                        </p>
                    </div>

                    <div class="grid grid-cols-3 gap-2.5 shrink-0">
                        <div class="bg-[#243752] border border-[#5276A7]/40 rounded-xl px-3.5 py-2 text-center">
                            <span class="text-xs text-slate-300 block">Total Units</span>
                            <span class="font-display font-bold text-base text-white">${formatUnits(standings.totalSectionUnits)}</span>
                        </div>
                        <div class="bg-[#243752] border border-[#5276A7]/40 rounded-xl px-3.5 py-2 text-center">
                            <span class="text-xs text-slate-300 block">Section Avg</span>
                            <span class="font-display font-bold text-base text-[#FFF0D1]">${sectionMean}</span>
                        </div>
                        <div class="bg-[#0F766E] border border-[#99D8CC]/50 rounded-xl px-3.5 py-2 text-center">
                            <span class="text-xs text-[#D5F0EA] block">Honor Pullout</span>
                            <span class="font-display font-bold text-base text-white">${standings.qualifiers.length} / ${standings.rankedRows.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AUTOMATED PULLOUT CARD: NO GRADE BELOW 85 & WEIGHTED AVERAGE >= 90 (Deep Teal #0F766E) -->
            <div class="bg-white rounded-2xl border-2 border-[#0F766E] shadow-2xs overflow-hidden shrink-0">
                <div class="px-4 py-3 bg-[#0F766E] text-white flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                            </svg>
                        </div>
                        <div>
                            <h4 class="font-display font-bold text-sm sm:text-base">
                                Quarterly Honor Pullout — Students with Average &ge; 90 &amp; No Grade Below 85
                            </h4>
                            <p class="text-xs text-[#D5F0EA]">
                                Automatically filtered from ${escapeHtml(activeSection.section_name)} (${escapeHtml(quarterTitle)}) where every subject &ge; 85 and Weighted Average &ge; 90.00
                            </p>
                        </div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E]">
                        &#10003; ${standings.qualifiers.length} Qualified Student${standings.qualifiers.length === 1 ? '' : 's'}
                    </span>
                </div>
                ${pulloutHtml}
            </div>

            <!-- COMPLETE SECTION QUARTERLY RANKING & COMPUTATION TABLE -->
            <div class="bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
                <div class="px-4 py-3 bg-[#F5F7FA] border-b border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div>
                        <h4 class="font-display font-bold text-[#17243A] text-sm sm:text-base">
                            Complete Section Quarterly Computation &amp; Ranking (${escapeHtml(quarterTitle)})
                        </h4>
                        <p class="text-xs text-[#64748B] mt-0.5">
                            Each cell shows the student's subject grade and its weighted points <code>(Grade * Units)</code>. Failing grades (&lt; ${GRADING_POLICY.passingGrade}) appear in Berry Plum; grades 75–84 appear in Antique Amber.
                        </p>
                    </div>
                </div>
                <div class="flex-1 overflow-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse">
                        <thead class="sticky top-0 z-10">
                            <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                <th class="py-2.5 px-3 text-center">Rank</th>
                                <th class="py-2.5 px-3.5 min-w-[180px]">Student Name</th>
                                ${subjectColsHeader}
                                <th class="py-2.5 px-2.5 text-center border-l border-[#D8DEE8]">Sum / Units</th>
                                <th class="py-2.5 px-2.5 text-center border-l border-[#D8DEE8]">Min Grade</th>
                                <th class="py-2.5 px-3 text-center border-l border-[#D8DEE8]">Weighted Avg</th>
                                <th class="py-2.5 px-3.5 border-l border-[#D8DEE8]">Status &amp; Pullout Check</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#D8DEE8]/60 text-sm">
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
            checklist.innerHTML = `<p class="text-xs text-[#64748B] py-2 px-1">No subjects in catalog yet. You can create subjects now or assign them later.</p>`;
        } else {
            checklist.innerHTML = state.subjects.map(sub => {
                const checked = assignedSet.has(sub.id) ? 'checked' : '';
                return `
                    <label class="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-white cursor-pointer transition">
                        <span class="flex items-center gap-2.5 min-w-0">
                            <input type="checkbox" name="section_subject_ids" value="${sub.id}" ${checked} class="w-4 h-4 rounded text-[#17243A] focus:ring-[#5276A7] border-[#D8DEE8]">
                            <span class="font-mono text-xs font-bold text-[#2C4870]">${escapeHtml(sub.subject_code)}</span>
                            <span class="text-sm text-[#17243A] truncate">${escapeHtml(sub.subject_name)}</span>
                        </span>
                        <span class="text-xs font-bold text-[#0F766E] shrink-0">*${formatUnits(sub.units)} u</span>
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
            secChecklist.innerHTML = `<p class="text-xs text-[#64748B] py-1.5 px-1">No sections created yet. You can assign this subject once a section is created.</p>`;
        } else {
            secChecklist.innerHTML = state.sections.map(sec => {
                const checked = assignedSecSet.has(sec.id) ? 'checked' : '';
                return `
                    <label class="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-white cursor-pointer transition">
                        <span class="flex items-center gap-2.5">
                            <input type="checkbox" name="subject_section_ids" value="${sec.id}" ${checked} class="w-4 h-4 rounded text-[#17243A] focus:ring-[#5276A7] border-[#D8DEE8]">
                            <span class="text-sm font-semibold text-[#17243A]">${escapeHtml(sec.section_name)}</span>
                        </span>
                        <span class="text-xs text-[#64748B]">${escapeHtml(sec.year_level)}</span>
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
                    <p class="text-sm font-semibold text-[#17243A]">No subjects in your catalog yet</p>
                    <p class="text-xs text-[#64748B] mt-1">Click "+ New Subject" above to create your first subject and assign it here.</p>
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
                <div class="p-3.5 transition ${draft.checked ? 'bg-[#EBF1F8]/60' : 'hover:bg-white'}">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label class="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                            <input type="checkbox"
                                ${draft.checked ? 'checked' : ''}
                                onchange="App.onAssignCheckboxChange(${sub.id}, this.checked)"
                                class="mt-0.5 w-4 h-4 rounded text-[#17243A] focus:ring-[#5276A7] border-[#D8DEE8]">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-mono text-xs font-bold text-[#2C4870] bg-white px-2 py-0.5 rounded border border-[#C5D5EA]">${escapeHtml(sub.subject_code)}</span>
                                    <span class="text-sm font-semibold text-[#17243A]">${escapeHtml(sub.subject_name)}</span>
                                    <span class="text-xs font-bold text-[#0F766E]">(*${formatUnits(sub.units)} units)</span>
                                </div>
                                ${sub.description ? `<p class="text-xs text-[#64748B] mt-0.5 truncate">${escapeHtml(sub.description)}</p>` : ''}
                            </div>
                        </label>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:w-72 shrink-0 ${draft.checked ? '' : 'opacity-40 pointer-events-none'}">
                            <input type="text"
                                placeholder="Schedule (e.g. MWF 8-9AM)"
                                value="${escapeHtml(draft.schedule)}"
                                oninput="App.onAssignMetaChange(${sub.id}, 'schedule', this.value)"
                                class="px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#D8DEE8] bg-white focus:border-[#5276A7] outline-none">
                            <input type="text"
                                placeholder="Teacher / Instructor"
                                value="${escapeHtml(draft.instructor)}"
                                oninput="App.onAssignMetaChange(${sub.id}, 'instructor', this.value)"
                                class="px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#D8DEE8] bg-white focus:border-[#5276A7] outline-none">
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
            previewEl.innerHTML = `<span class="text-[#64748B]">Select a section above to preview its assigned subjects.</span>`;
            return;
        }

        const yearSelect = document.getElementById('studentYearLevelSelect');
        if (yearSelect && yearSelect.value !== sec.year_level) {
            yearSelect.value = sec.year_level;
        }

        countEl.textContent = `${sec.assigned_subjects.length} subject${sec.assigned_subjects.length === 1 ? '' : 's'} (${formatUnits(sec.total_units)} units)`;
        if (sec.assigned_subjects.length === 0) {
            previewEl.innerHTML = `<span class="text-[#80530F] font-semibold">&#9888; No subjects assigned to ${escapeHtml(sec.section_name)} yet.</span>`;
        } else {
            previewEl.innerHTML = sec.assigned_subjects.map(sub => `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-[#17243A] border border-[#D8DEE8] shadow-2xs">
                    <strong class="text-[#2C4870]">${escapeHtml(sub.subject_code)}</strong>
                    <span>${escapeHtml(sub.subject_name)}</span>
                    <span class="text-xs font-bold text-[#0F766E]">*${formatUnits(sub.units)}u</span>
                </span>
            `).join('');
        }
    }

    let studentModalMode = 'single';

    function parseBulkStudentLineClient(rawLine) {
        let line = String(rawLine || '').trim();
        if (!line) return null;

        // Strip optional list numbering at the start like "1. " or "1) " or "- "
        line = line.replace(/^(?:\d{1,3}[\.\)]\s+|[-•*]\s+)/, '').trim();
        if (!line) return null;

        let studentNo = '';
        let namePart = line;

        // Check pipe, tab, or semicolon separator: "2026-0001 | Dela Cruz, Juan M."
        const pipeMatch = line.match(/^([^\|\t;]+)[\|\t;]+(.+)$/);
        if (pipeMatch) {
            const firstCol = pipeMatch[1].trim();
            const restCol = pipeMatch[2].trim();
            if (/\d/.test(firstCol) && firstCol.length <= 30) {
                studentNo = firstCol;
                namePart = restCol;
            }
        } else if ((line.match(/,/g) || []).length >= 2) {
            const parts = line.split(',').map(s => s.trim());
            if (/\d/.test(parts[0]) && parts[0].length <= 30) {
                studentNo = parts.shift();
                namePart = parts.join(', ');
            }
        }

        let firstName = '';
        let middleName = '';
        let lastName = '';

        if (namePart.includes(',')) {
            const commaParts = namePart.split(',').map(s => s.trim());
            lastName = commaParts[0] || '';
            const givenPart = commaParts[1] || '';
            const extraMiddle = commaParts[2] || '';

            if (extraMiddle) {
                firstName = givenPart;
                middleName = extraMiddle;
            } else {
                const words = givenPart.split(/\s+/).filter(Boolean);
                if (words.length >= 2) {
                    const lastToken = words[words.length - 1];
                    if (/^[A-Za-z]\.?$/.test(lastToken)) {
                        middleName = lastToken.replace(/\.$/, '') + '.';
                        words.pop();
                    }
                }
                firstName = words.join(' ');
            }
        } else {
            const words = namePart.split(/\s+/).filter(Boolean);
            const count = words.length;
            if (count === 1) {
                firstName = words[0];
                lastName = words[0];
            } else if (count === 2) {
                firstName = words[0];
                lastName = words[1];
            } else {
                const compoundPrefixes = ['dela', 'de', 'del', 'delos', 'san', 'sta', 'sta.', 'sto', 'sto.', 'da', 'van', 'von'];
                const secondLast = words[count - 2].toLowerCase();
                const thirdLast = count >= 4 ? words[count - 3].toLowerCase() : '';
                let remaining = [];

                if (count >= 4 && thirdLast === 'de' && secondLast === 'la') {
                    lastName = `${words[count - 3]} ${words[count - 2]} ${words[count - 1]}`;
                    remaining = words.slice(0, count - 3);
                } else if (compoundPrefixes.includes(secondLast) && !/^[A-Za-z]\.$/.test(words[count - 2])) {
                    lastName = `${words[count - 2]} ${words[count - 1]}`;
                    remaining = words.slice(0, count - 2);
                } else {
                    lastName = words[count - 1];
                    remaining = words.slice(0, count - 1);
                }

                if (remaining.length >= 2) {
                    const remLast = remaining[remaining.length - 1];
                    if (/^[A-Za-z]\.?$/.test(remLast)) {
                        middleName = remLast.replace(/\.$/, '') + '.';
                        remaining.pop();
                    }
                }
                firstName = remaining.join(' ');
            }
        }

        if (!firstName || !lastName) return null;

        return {
            student_no: studentNo,
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            full_name: `${lastName}, ${firstName}${middleName ? ' ' + middleName : ''}`,
        };
    }

    function setStudentModalMode(mode = 'single') {
        studentModalMode = mode === 'bulk' ? 'bulk' : 'single';

        const singleFields = document.getElementById('singleStudentFields');
        const bulkFields = document.getElementById('bulkStudentFields');
        const singleBtn = document.getElementById('studentModeSingleBtn');
        const bulkBtn = document.getElementById('studentModeBulkBtn');
        const firstNameInp = document.getElementById('studentFirstNameInput');
        const lastNameInp = document.getElementById('studentLastNameInput');
        const submitBtn = document.getElementById('studentSubmitBtn');

        if (studentModalMode === 'bulk') {
            singleFields?.classList.add('hidden');
            bulkFields?.classList.remove('hidden');
            if (firstNameInp) firstNameInp.required = false;
            if (lastNameInp) lastNameInp.required = false;

            if (singleBtn) {
                singleBtn.className = 'px-3 py-1.5 rounded-lg text-[#64748B] hover:text-[#17243A] transition cursor-pointer';
            }
            if (bulkBtn) {
                bulkBtn.className = 'px-3 py-1.5 rounded-lg bg-[#17243A] text-white shadow-2xs transition cursor-pointer flex items-center gap-1.5';
            }
            onBulkStudentTextInput();
            setTimeout(() => document.getElementById('bulkStudentsTextarea')?.focus(), 50);
        } else {
            singleFields?.classList.remove('hidden');
            bulkFields?.classList.add('hidden');
            if (firstNameInp) firstNameInp.required = true;
            if (lastNameInp) lastNameInp.required = true;

            if (singleBtn) {
                singleBtn.className = 'px-3 py-1.5 rounded-lg bg-[#17243A] text-white shadow-2xs transition cursor-pointer';
            }
            if (bulkBtn) {
                bulkBtn.className = 'px-3 py-1.5 rounded-lg text-[#64748B] hover:text-[#17243A] transition cursor-pointer flex items-center gap-1.5';
            }
            if (submitBtn) {
                submitBtn.textContent = document.getElementById('studentIdInput')?.value ? 'Update Student' : 'Save Student';
            }
            setTimeout(() => document.getElementById('studentFirstNameInput')?.focus(), 50);
        }
    }

    function onBulkStudentTextInput() {
        const textarea = document.getElementById('bulkStudentsTextarea');
        const badge = document.getElementById('bulkStudentLineCountBadge');
        const previewList = document.getElementById('bulkStudentsPreviewList');
        const submitBtn = document.getElementById('studentSubmitBtn');
        if (!textarea || !badge || !previewList) return;

        const rawLines = textarea.value.split(/\r\n|\r|\n/).map(l => l.trim()).filter(Boolean);
        const parsedItems = rawLines.map((line, idx) => ({
            lineNum: idx + 1,
            raw: line,
            parsed: parseBulkStudentLineClient(line),
        }));

        const validCount = parsedItems.filter(item => item.parsed !== null).length;
        badge.textContent = `${validCount} student${validCount === 1 ? '' : 's'} detected`;

        if (submitBtn && studentModalMode === 'bulk') {
            submitBtn.textContent = validCount > 0
                ? `Enroll ${validCount} Student${validCount === 1 ? '' : 's'}`
                : 'Enroll Students';
        }

        if (parsedItems.length === 0) {
            previewList.innerHTML = `<p class="text-[#64748B] italic py-1">Type or paste student names above (1 student per line) to preview how they will be enrolled...</p>`;
            return;
        }

        previewList.innerHTML = parsedItems.map(item => {
            if (!item.parsed) {
                return `
                    <div class="py-1.5 flex items-center justify-between gap-2 text-[#842D60]">
                        <span>Line ${item.lineNum}: <strong>${escapeHtml(item.raw)}</strong></span>
                        <span class="px-2 py-0.5 rounded bg-[#F5DFEB] border border-[#E2B8CF] text-xs font-bold">&#10005; Invalid name</span>
                    </div>
                `;
            }
            const p = item.parsed;
            return `
                <div class="py-1.5 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="font-mono text-[#64748B]">#${item.lineNum}</span>
                        <span class="font-semibold text-[#17243A] truncate">${escapeHtml(p.full_name)}</span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <span class="px-2 py-0.5 rounded bg-white border border-[#D8DEE8] text-[#17243A] font-mono">
                            ID: ${p.student_no ? escapeHtml(p.student_no) : 'Auto'}
                        </span>
                        <span class="px-2 py-0.5 rounded bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC] font-bold">
                            &#10003; Ready
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function fillSampleBulkStudents() {
        const textarea = document.getElementById('bulkStudentsTextarea');
        if (!textarea) return;
        const sampleLines = [
            'Dela Cruz, Juan M.',
            'Villanueva, Angela R.',
            'Mark Anthony S. Mendoza',
            'Bautista, Sophia L.',
            'Gabriel T. Soriano',
        ];
        textarea.value = textarea.value.trim()
            ? textarea.value.trim() + '\n' + sampleLines.join('\n')
            : sampleLines.join('\n');
        onBulkStudentTextInput();
        textarea.focus();
    }

    function openStudentModal(studentId = null, preselectedSectionId = null, mode = 'single') {
        const form = document.getElementById('studentForm');
        form.reset();
        document.getElementById('studentIdInput').value = '';
        const bulkTextarea = document.getElementById('bulkStudentsTextarea');
        if (bulkTextarea) bulkTextarea.value = '';

        const modeToggle = document.getElementById('studentModalModeToggle');

        if (studentId) {
            const st = state.students.find(s => s.id === Number(studentId));
            if (!st) return;
            modeToggle?.classList.add('hidden');
            setStudentModalMode('single');
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
            modeToggle?.classList.remove('hidden');
            document.getElementById('studentModalTitle').textContent = mode === 'bulk' ? 'Bulk Add Students (1 per Line)' : 'Enroll New Student';
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
            setStudentModalMode(mode);
        }

        updateStudentModalSubjectPreview();
        openModal('studentModal');
    }

    async function handleStudentSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('studentIdInput').value;
        const section_id = Number(document.getElementById('studentSectionSelect').value || 0);
        const year_level = document.getElementById('studentYearLevelSelect').value;
        const status = document.getElementById('studentStatusInput').value;

        if (!section_id) {
            showToast('Please select or create a section for the student(s).', 'error');
            return;
        }

        const btn = document.getElementById('studentSubmitBtn');
        btn.disabled = true;

        try {
            if (!id && studentModalMode === 'bulk') {
                const students_text = (document.getElementById('bulkStudentsTextarea')?.value || '').trim();
                if (!students_text) {
                    showToast('Please enter at least one student name (1 student per line).', 'error');
                    btn.disabled = false;
                    return;
                }
                const res = await apiRequest('bulk_save_students', {
                    students_text,
                    section_id,
                    year_level,
                    status,
                });
                applySystemState(res);
                closeModal('studentModal');
                showToast(res.message, 'success');
            } else {
                const student_no = document.getElementById('studentNoInput').value.trim();
                const first_name = document.getElementById('studentFirstNameInput').value.trim();
                const middle_name = document.getElementById('studentMiddleNameInput').value.trim();
                const last_name = document.getElementById('studentLastNameInput').value.trim();

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
            }
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
        setStudentModalMode,
        onBulkStudentTextInput,
        fillSampleBulkStudents,
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
        setDashboardSection,
        setDashboardPageSize,
        setDashboardPage,
        onDashboardStudentSearch,
        openDashboardActiveSectionStudentModal,
    };
})();
