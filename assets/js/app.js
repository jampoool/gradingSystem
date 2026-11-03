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
        honorAverageRoundFloor: 89.5, // 89.50 and above rounds to 90 for Honor qualification
        minValidGrade: 50.0,
        maxValidGrade: 100.0,
    };

    /**
     * Checks if a weighted average qualifies for the 90+ Honor Roll
     * (Philippine Academic Standard: 89.50 and above rounds up to 90)
     */
    function meetsHonorAveragePolicy(avg) {
        if (avg === null || avg === undefined || avg === '' || isNaN(Number(avg))) return false;
        const num = Number(avg);
        return Math.round(num) >= 90 || num >= (GRADING_POLICY.honorAverageRoundFloor - 0.0001);
    }

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
        reorderSectionId: null,
        reorderDraftList: [],

        // Dashboard Section Switcher & Student Entries Pagination state
        dashboardSectionId: null,
        dashboardPageSize: 10,
        dashboardCurrentPage: 1,
        dashboardStudentSearch: '',
        dashboardGenderFilter: '',

        // Sections View state
        sectionViewMode: 'grid', // 'grid' | 'table'
        expandedSections: {},

        // Students Directory state
        studentSectionId: '',
        studentPageSize: 10,
        studentCurrentPage: 1,
        studentGenderFilter: '',

        // Grading & Reports state
        gradingSectionId: null,
        gradingSubjectId: 'ALL',
        gradingQuarter: 'Q1',

        reportSectionId: null,
        reportQuarter: 'Q1',

        currentUser: null,
        teachers: [],
        gradeLocks: {},
        pendingUnlockRequests: [],
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
        users: {
            title: 'Teacher Accounts & Permissions',
            breadcrumb: 'Manage Users',
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

    function normalizeGenderClient(gender) {
        const g = String(gender || 'Female').trim().toLowerCase();
        return g === 'male' || g === 'm' || g === 'boy' || g === 'boys' ? 'Male' : 'Female';
    }

    function genderBadgeHtml(gender, compact = false) {
        const norm = normalizeGenderClient(gender);
        if (norm === 'Male') {
            return compact
                ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]" title="Male">&#9794; M</span>`
                : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]"><span>&#9794;</span><span>Male</span></span>`;
        }
        return compact
            ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]" title="Female">&#9792; F</span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]"><span>&#9792;</span><span>Female</span></span>`;
    }

    function genderSectionHeaderRowHtml(gender, count, colSpan, subtitle = '') {
        const norm = normalizeGenderClient(gender);
        const isMale = norm === 'Male';
        const bgClass = isMale
            ? 'bg-[#EBF1F8]/90 border-y border-[#C5D5EA] text-[#2C4870]'
            : 'bg-[#F5DFEB]/75 border-y border-[#E2B8CF] text-[#842D60]';
        const pillClass = isMale
            ? 'bg-[#2C4870] text-white'
            : 'bg-[#842D60] text-white';
        const symbol = isMale ? '&#9794;' : '&#9792;';
        const label = isMale ? 'MALE STUDENTS' : 'FEMALE STUDENTS';

        return `
            <tr class="${bgClass}">
                <td colspan="${colSpan}" class="py-2 px-3.5">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider ${pillClass}">
                                <span>${symbol}</span>
                                <span>${label}</span>
                            </span>
                            <span class="text-xs font-bold">(${count} student${count === 1 ? '' : 's'})</span>
                        </div>
                        ${subtitle ? `<span class="text-xs font-semibold opacity-85">${subtitle}</span>` : ''}
                    </div>
                </td>
            </tr>
        `;
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
                inputClass: 'border-[#9B3F72] bg-[#F5DFEB]/60 text-[#842D60] font-bold',
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
                inputClass: 'border-[#B7791F] bg-[#FFF0D1]/60 text-[#80530F] font-semibold',
            };
        }
        if (meetsHonorAveragePolicy(g)) {
            return {
                state: 'honor',
                isPassing: true,
                isFailing: false,
                isBelowHonorFloor: false,
                label: 'Passed (Honor 90+)',
                badgeClass: 'bg-[#D5F0EA] text-[#0F766E] border-[#99D8CC]',
                inputClass: 'border-[#99D8CC] bg-[#D5F0EA]/60 text-[#0F766E] font-bold',
            };
        }
        return {
            state: 'passed',
            isPassing: true,
            isFailing: false,
            isBelowHonorFloor: false,
            label: 'Passed',
            badgeClass: 'bg-[#EBF1F8] text-[#2C4870] border-[#C5D5EA]',
            inputClass: 'border-[#C5D5EA] bg-[#EBF1F8]/60 text-[#2C4870] font-semibold',
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
        const sectionStudents = state.students
            .filter(st => st.section_id === section.id)
            .sort((a, b) => {
                const ga = normalizeGenderClient(a.gender);
                const gb = normalizeGenderClient(b.gender);
                if (ga !== gb) return ga === 'Female' ? -1 : 1;
                return a.full_name.localeCompare(b.full_name);
            });

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

            const meetsHonorAverage = meetsHonorAveragePolicy(weightedAverage);
            const roundedAverage = weightedAverage !== null ? Math.round(weightedAverage) : null;

            const isQualified =
                isComplete &&
                !hasBelow85 &&
                meetsHonorAverage;

            let statusReason = 'Pending / Incomplete Grades';
            let statusType = 'incomplete';
            if (isComplete && weightedAverage !== null) {
                if (isFailingOverall) {
                    statusReason = failingSubjects.length > 0
                        ? `Failed (< ${GRADING_POLICY.passingGrade}): ${failingSubjects.join(', ')}`
                        : `Failed (Avg ${weightedAverage.toFixed(2)} < ${GRADING_POLICY.passingGrade})`;
                    statusType = 'failed';
                } else if (isQualified) {
                    const roundNote = weightedAverage < 90 ? ` (Rounds to 90)` : '';
                    statusReason = `Qualified (Avg ${weightedAverage.toFixed(2)}${roundNote} ≥ 90 & No Grade < 85)`;
                    statusType = 'qualified';
                } else if (hasBelow85 && meetsHonorAverage) {
                    statusReason = `Passed · Below 85 Floor: ${below85Subjects.join(', ')}`;
                    statusType = 'below85';
                } else if (hasBelow85) {
                    statusReason = `Passed · Avg < 90 & Grade < 85 (${below85Subjects.join(', ')})`;
                    statusType = 'below_both';
                } else {
                    statusReason = `Passed · Average ${weightedAverage.toFixed(2)} (< 89.5 Honor Floor)`;
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
                roundedAverage,
                meetsHonorAverage,
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

        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
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
        state.currentUser = data.current_user || null;
        state.teachers = data.teachers || [];
        state.gradeLocks = data.grade_locks || data.gradeLocks || {};
        state.pendingUnlockRequests = data.pending_unlock_requests || [];
        state.stats = data.stats || {
            total_students: 0,
            total_sections: 0,
            total_subjects: 0,
            total_assignments: 0,
            total_grades: 0,
        };

        const urlParams = new URLSearchParams(window.location.search);
        const urlSecId = urlParams.get('section_id');
        const urlQtr = urlParams.get('quarter');
        const urlSubId = urlParams.get('subject_id');

        if (state.sections.length > 0) {
            const hasUrlSec = urlSecId && state.sections.some(s => s.id === Number(urlSecId));
            const initialSecId = hasUrlSec ? Number(urlSecId) : state.sections[0].id;

            if (!state.dashboardSectionId || !state.sections.some(s => s.id === Number(state.dashboardSectionId))) {
                state.dashboardSectionId = initialSecId;
                state.dashboardCurrentPage = 1;
            }
            if (!state.gradingSectionId || !state.sections.some(s => s.id === Number(state.gradingSectionId))) {
                state.gradingSectionId = initialSecId;
            }
            if (!state.reportSectionId || !state.sections.some(s => s.id === Number(state.reportSectionId))) {
                state.reportSectionId = initialSecId;
            }
            if (urlQtr && ['Q1', 'Q2', 'Q3', 'Q4', 'FINAL'].includes(urlQtr)) {
                state.gradingQuarter = urlQtr;
                state.reportQuarter = urlQtr;
            }
            if (urlSubId) {
                state.gradingSubjectId = String(urlSubId);
            }
        } else {
            state.dashboardSectionId = null;
            state.gradingSectionId = null;
            state.reportSectionId = null;
        }

        if (state.currentView === 'students' && urlSecId) {
            state.studentSectionId = String(urlSecId);
            const secFilter = document.getElementById('studentSectionFilter');
            if (secFilter) secFilter.value = String(urlSecId);
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

    function setDashboardGenderFilter(gender = '') {
        state.dashboardGenderFilter = gender || '';
        state.dashboardCurrentPage = 1;
        renderDashboard();
    }

    function openDashboardActiveSectionStudentModal(mode = 'single') {
        if (state.currentUser?.role !== 'admin' && !state.currentUser?.can_add_student) {
            showToast('Permission restricted: You do not have permission to enroll students. Contact your administrator.', 'error');
            return;
        }
        const targetSecId = state.dashboardSectionId || (state.sections[0]?.id ?? null);
        openStudentModal(null, targetSecId, mode);
    }

    function hideAppLoader() {
        const loader = document.getElementById('appGlobalLoader');
        if (loader) {
            loader.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                loader.remove();
            }, 500);
        }

        // Check if user just logged in and trigger welcome toast
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const hasJustLoggedIn = urlParams.get('login') === 'success' || sessionStorage.getItem('gf_just_logged_in') === 'true';
            if (hasJustLoggedIn) {
                sessionStorage.removeItem('gf_just_logged_in');
                updateBrowserUrl({ login: null }, true);
                const user = state.currentUser;
                const greetingName = user?.full_name ? `Welcome back, ${user.full_name}!` : 'Welcome back!';
                const roleBadge = user?.role === 'admin' ? 'Administrator' : 'Faculty Member';
                setTimeout(() => {
                    showToast(`🎓 ${greetingName} Signed in as ${roleBadge}.`, 'success');
                }, 400);
            }
        } catch (e) {}
    }

    async function loadInitialData() {
        try {
            const data = await apiRequest('get_all');
            applySystemState(data);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            hideAppLoader();
        }
    }

    function updateBrowserUrl(params = {}, replace = false) {
        try {
            const currentParams = new URLSearchParams(window.location.search);
            for (const [key, val] of Object.entries(params)) {
                if (val === null || val === undefined || val === '') {
                    currentParams.delete(key);
                } else {
                    currentParams.set(key, String(val));
                }
            }
            if (params.page && params.page !== 'grading' && params.page !== 'reports' && params.page !== 'students') {
                currentParams.delete('section_id');
                currentParams.delete('subject_id');
                currentParams.delete('quarter');
            }
            const query = currentParams.toString() ? `?${currentParams.toString()}` : window.location.pathname;
            const newUrl = currentParams.toString() ? `${window.location.pathname}?${currentParams.toString()}` : window.location.pathname;
            const currentFull = `${window.location.pathname}${window.location.search}`;
            if (newUrl !== currentFull) {
                if (replace) {
                    window.history.replaceState({ page: params.page || state.currentView }, '', newUrl);
                } else {
                    window.history.pushState({ page: params.page || state.currentView }, '', newUrl);
                }
            }
        } catch (e) {
            // History API fallback
        }
    }

    function switchView(viewName, updateUrl = true) {
        if (!viewMeta[viewName]) return;
        if (viewName === 'users' && state.currentUser && state.currentUser.role !== 'admin') {
            viewName = 'dashboard';
        }
        state.currentView = viewName;

        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.toggle('hidden', panel.id !== `view-${viewName}`);
        });

        document.querySelectorAll('.nav-btn').forEach(btn => {
            const isActive = btn.getAttribute('data-nav') === viewName;
            if (isActive) {
                btn.className = 'nav-btn w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold bg-[#243752] text-white border border-[#5276A7]/50 shadow-xs transition-all cursor-pointer';
                btn.setAttribute('aria-current', 'page');
            } else {
                btn.className = 'nav-btn w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-[#243752]/70 transition-all cursor-pointer';
                btn.removeAttribute('aria-current');
            }
        });

        const headerTitle = document.getElementById('headerTitle');
        const headerBreadcrumb = document.getElementById('headerBreadcrumb');
        if (headerTitle) headerTitle.textContent = viewMeta[viewName].title;
        if (headerBreadcrumb) headerBreadcrumb.textContent = viewMeta[viewName].breadcrumb;

        if (updateUrl) {
            updateBrowserUrl({ page: viewName });
        }

        closeMobileSidebar();
    }

    function openMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        const btn = document.getElementById('mobileMenuBtn');
        if (!sidebar || !backdrop) return;
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
        btn?.setAttribute('aria-expanded', 'true');
        document.body.classList.add('overflow-hidden');
        requestAnimationFrame(() => {
            const firstNav = sidebar.querySelector('.nav-btn');
            firstNav?.focus();
        });
    }

    function closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        const btn = document.getElementById('mobileMenuBtn');
        if (!sidebar || !backdrop) return;
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
        btn?.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('overflow-hidden');
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

        const usersBadge = document.getElementById('navBadgeUsers');
        if (usersBadge) {
            usersBadge.textContent = state.teachers ? state.teachers.length : 0;
        }
        const unlockBadge = document.getElementById('navBadgeUnlockRequests');
        if (unlockBadge) {
            const count = state.pendingUnlockRequests ? state.pendingUnlockRequests.length : 0;
            unlockBadge.textContent = count;
            unlockBadge.classList.toggle('hidden', count === 0);
        }

        const canAddStudent = state.currentUser?.role === 'admin' || Boolean(state.currentUser?.can_add_student);
        document.querySelectorAll('.can-add-student-only').forEach(el => {
            el.classList.toggle('hidden', !canAddStudent);
        });

        renderUsersView();
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
                pillsBar.innerHTML = `<span class="text-xs font-medium text-[#475569]">No sections available yet</span>`;
            }
            if (overviewSecBadge) {
                overviewSecBadge.textContent = '0 Enrolled';
            }
            secContainer.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center py-10 px-4 border-2 border-dashed border-[#D8DEE8] rounded-2xl bg-[#F5F7FA]/50">
                    <p class="text-base font-bold text-[#17243A]">No sections created yet</p>
                    <p class="text-sm text-[#475569] mt-1 max-w-md">Create a section or load the 28-unit demo data to test teacher grade input and weighted ranking.</p>
                    <div class="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                        <button type="button" onclick="App.seedSampleData()" class="px-4 py-2 rounded-xl text-sm font-semibold text-[#0F766E] bg-[#D5F0EA] hover:bg-[#c2e8df] border border-[#99D8CC] transition cursor-pointer">
                            Load 28-Unit Demo &amp; Grades
                        </button>
                        <button type="button" onclick="App.openSectionModal()" class="admin-only px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer">+ Create Section
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
                        ? `<span class="text-[#475569]/50 font-bold text-xs select-none">/</span>`
                        : '';
                    return `
                        ${chevron}
                        <button type="button"
                            onclick="App.setDashboardSection(${sec.id})" aria-pressed="${isSelected}" aria-label="Select section ${escapeHtml(sec.section_name)}"
                            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap border transition cursor-pointer ${
                                isSelected
                                    ? 'bg-[#17243A] text-white border-[#17243A] shadow-xs'
                                    : 'bg-white text-[#17243A] border-[#D8DEE8] hover:border-[#5276A7] hover:bg-[#EBF1F8]/50'
                            }">
                            <span>${escapeHtml(sec.section_name)}</span>
                            <span class="text-xs font-medium ${isSelected ? 'text-slate-300' : 'text-[#475569]'}">(${escapeHtml(sec.year_level)})</span>
                            <span class="px-2 py-0.5 rounded-full text-xs font-bold ${
                                isSelected
                                    ? 'bg-[#D5F0EA] text-[#0F766E]'
                                    : 'bg-[#EBF1F8] text-[#2C4870]'
                            }">${sec.student_count} student${sec.student_count === 1 ? '' : 's'}</span>
                        </button>
                    `;
                }).join('');

                pillsBar.innerHTML = `
                    <span class="text-xs font-bold uppercase tracking-wider text-[#475569] shrink-0 mr-1">Sections:</span>
                    <div class="flex items-center gap-1.5">
                        ${pillsHtml}
                    </div>
                    <button type="button" onclick="App.openSectionModal()" class="admin-only ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-[#5276A7] hover:text-[#17243A] bg-white hover:bg-[#EBF1F8] border border-dashed border-[#5276A7]/50 transition cursor-pointer" title="Create another section">
                        + Add Section</button>
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
                                <span class="font-mono font-bold text-[#475569]">${excelColLetter(idx)}:</span>
                                <strong class="text-[#17243A] text-xs">${escapeHtml(sub.subject_code)}</strong>
                                <span class="text-[#475569] text-xs block truncate">${escapeHtml(sub.subject_name)}</span>
                            </span>
                            <span class="text-xs font-bold text-[#2C4870] bg-[#EBF1F8] px-2 py-0.5 rounded-md border border-[#C5D5EA] shrink-0">*${formatUnits(sub.units)}u</span>
                        </button>
                    `).join('')}
                   </div>`
                : `<div class="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#FFF0D1] border border-[#F0D296] text-xs text-[#80530F]">
                        <span class="font-semibold">&#9888; No subjects assigned to ${escapeHtml(activeSec.section_name)} yet.</span>
                        <button type="button" onclick="App.openAssignSubjectsModal(${activeSec.id})" class="font-bold underline cursor-pointer">+ Assign Subjects</button>
                   </div>`;

            // Filter & paginate students in active section (Ordered by Female first, then Male)
            const allSectionRows = standings ? standings.rows : [];
            const totalFemaleInSec = allSectionRows.filter(r => normalizeGenderClient(r.student.gender) === 'Female').length;
            const totalMaleInSec = allSectionRows.filter(r => normalizeGenderClient(r.student.gender) === 'Male').length;

            const searchQ = (state.dashboardStudentSearch || '').trim().toLowerCase();
            const genderFilter = state.dashboardGenderFilter || '';
            const filteredSectionRows = allSectionRows.filter(r => {
                if (genderFilter && normalizeGenderClient(r.student.gender) !== genderFilter) return false;
                if (!searchQ) return true;
                return (
                    r.student.full_name.toLowerCase().includes(searchQ) ||
                    r.student.student_no.toLowerCase().includes(searchQ)
                );
            });

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
                                : 'bg-white text-[#475569] border-[#D8DEE8] hover:text-[#17243A] hover:bg-[#F5F7FA]'
                        }">
                        ${label}
                    </button>
                `;
            }).join('');

            const genderFilterPillsHtml = `
                <div class="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-[#D8DEE8]">
                    <button type="button" onclick="App.setDashboardGenderFilter('')"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            !genderFilter ? 'bg-[#17243A] text-white' : 'text-[#475569] hover:text-[#17243A]'
                        }">
                        All (${allSectionRows.length})
                    </button>
                    <button type="button" onclick="App.setDashboardGenderFilter('Female')"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            genderFilter === 'Female' ? 'bg-[#842D60] text-white' : 'text-[#842D60] hover:bg-[#F5DFEB]/60'
                        }">
                        &#9792; Female (${totalFemaleInSec})
                    </button>
                    <button type="button" onclick="App.setDashboardGenderFilter('Male')"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            genderFilter === 'Male' ? 'bg-[#2C4870] text-white' : 'text-[#2C4870] hover:bg-[#EBF1F8]/70'
                        }">
                        &#9794; Male (${totalMaleInSec})
                    </button>
                </div>
            `;

            const renderDashboardStudentRow = (r, rowNumber) => {
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
                    ? 'text-[#475569]'
                    : r.minGrade < GRADING_POLICY.passingGrade
                        ? 'text-[#842D60] font-bold'
                        : r.minGrade < GRADING_POLICY.honorSubjectFloor
                            ? 'text-[#80530F] font-bold'
                            : 'text-[#17243A]';

                const avgColor = r.weightedAverage === null
                    ? 'text-[#475569]'
                    : r.isFailingOverall
                        ? 'text-[#842D60]'
                        : meetsHonorAveragePolicy(r.weightedAverage)
                            ? 'text-[#0F766E]'
                            : 'text-[#17243A]';

                return `
                    <tr class="hover:bg-[#F5F7FA]/90 transition">
                        <td class="py-2.5 px-3 font-mono text-xs text-[#475569]">${rowNumber}</td>
                        <td class="py-2.5 px-3 font-bold ${r.rank === 1 ? 'text-[#80530F]' : 'text-[#17243A]'}">${r.rank ? `#${r.rank}` : '—'}</td>
                        <td class="py-2.5 px-3 font-mono text-xs font-semibold text-[#475569]">${escapeHtml(r.student.student_no)}</td>
                        <td class="py-2.5 px-3">
                            <div class="flex items-center gap-2">
                                <span class="font-semibold text-[#17243A]">${escapeHtml(r.student.full_name)}</span>
                                ${genderBadgeHtml(r.student.gender, true)}
                            </div>
                        </td>
                        <td class="py-2.5 px-3 text-center font-mono ${minGradeColor}">${r.minGrade !== null ? r.minGrade.toFixed(0) : '—'}</td>
                        <td class="py-2.5 px-3 text-center font-display font-bold ${avgColor}">${r.weightedAverage !== null ? r.weightedAverage.toFixed(2) : '—'}</td>
                        <td class="py-2.5 px-3">${statusBadgeHtml}</td>
                        <td class="py-2.5 px-3 text-right whitespace-nowrap">
                            <div class="inline-flex items-center gap-1">
                                <button type="button" onclick="App.openSectionGrading(${activeSec.id})" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer" title="Encode grades">
                                    Grade
                                </button>
                                <button type="button" onclick="App.openStudentModal(${r.student.id})" class="p-1.5 rounded-lg text-[#475569] hover:text-[#17243A] hover:bg-[#EBF1F8] transition cursor-pointer" title="Edit or transfer student">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                    </svg>
                                </button>
                                <button type="button" onclick="App.confirmDeleteStudent(${r.student.id})" class="p-1.5 rounded-lg text-[#475569] hover:text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Remove student from section">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            };

            let studentRowsHtml = '';
            if (paginatedRows.length > 0) {
                const femalePageRows = paginatedRows.filter(r => normalizeGenderClient(r.student.gender) === 'Female');
                const malePageRows = paginatedRows.filter(r => normalizeGenderClient(r.student.gender) === 'Male');
                const chunks = [];
                if (femalePageRows.length > 0) {
                    chunks.push(genderSectionHeaderRowHtml('Female', totalFemaleInSec, 8, `${activeSec.section_name} • Female Roster`));
                    femalePageRows.forEach((r, idx) => chunks.push(renderDashboardStudentRow(r, idx + 1)));
                }
                if (malePageRows.length > 0) {
                    chunks.push(genderSectionHeaderRowHtml('Male', totalMaleInSec, 8, `${activeSec.section_name} • Male Roster`));
                    malePageRows.forEach((r, idx) => chunks.push(renderDashboardStudentRow(r, idx + 1)));
                }
                studentRowsHtml = chunks.join('');
            } else {
                studentRowsHtml = `
                    <tr>
                        <td colspan="8" class="py-8 px-4 text-center">
                            <p class="text-sm font-bold text-[#17243A]">${searchQ || genderFilter ? 'No matching students in this section' : `No students enrolled in ${escapeHtml(activeSec.section_name)} yet`}</p>
                            <p class="text-xs text-[#475569] mt-1">Adjust enrollment for ${escapeHtml(activeSec.section_name)} by adding a single student or bulk-enrolling a list.</p>
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
            }

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
                                    ${activeSec.student_count} Enrolled (&#9792; ${totalFemaleInSec} Female &bull; &#9794; ${totalMaleInSec} Male)
                                </span>
                                <span class="text-xs font-medium text-[#475569]">&bull; ${formatUnits(activeSec.total_units)} units</span>
                                ${qualCount > 0 ? `<span class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">&#10003; ${qualCount} Honor Qualifier${qualCount === 1 ? '' : 's'}</span>` : ''}
                            </div>
                            <div class="flex items-center gap-2 text-xs text-[#475569] mt-1 flex-wrap">
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
                    <!-- Table Toolbar: Show Entries Selector (10 Default) + Female/Male Filter + Search -->
                    <div class="px-3.5 py-2.5 bg-[#F5F7FA] border-b border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs font-bold uppercase tracking-wider text-[#17243A]">
                                Students in ${escapeHtml(activeSec.section_name)}
                            </span>
                            ${genderFilterPillsHtml}
                            <div class="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#D8DEE8]">
                                <label for="dashboardEntriesSelect" class="text-xs font-medium text-[#475569]">Show:</label>
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
                        <table class="w-full text-left border-collapse text-xs sm:text-sm" aria-label="Enrolled Students in Section">
                            <thead>
                                <tr class="border-b border-[#D8DEE8] bg-[#F5F7FA]/60 text-xs font-bold uppercase tracking-wider text-[#475569]">
                                    <th scope="col" class="py-2.5 px-3 w-10">#</th>
                                    <th scope="col" class="py-2.5 px-3">Rank</th>
                                    <th scope="col" class="py-2.5 px-3">Student ID</th>
                                    <th scope="col" class="py-2.5 px-3">Student Name</th>
                                    <th scope="col" class="py-2.5 px-3 text-center">Min Grade</th>
                                    <th scope="col" class="py-2.5 px-3 text-center">Weighted Avg</th>
                                    <th scope="col" class="py-2.5 px-3">Status &amp; Honor Qualification</th>
                                    <th scope="col" class="py-2.5 px-3 text-right">Manage</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#D8DEE8]/60">
                                ${studentRowsHtml}
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination & Entry Count Footer -->
                    <div class="px-3.5 py-2.5 bg-[#F5F7FA] border-t border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569] shrink-0">
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
                    <p class="text-sm text-[#475569] mt-1">Enroll students individually or via bulk add (1 per line).</p>
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
            const renderOverviewItem = (st, idx) => {
                const standings = standingsBySection[st.section_id];
                const stRow = standings?.rows.find(r => r.student.id === st.id);
                const avg = stRow ? stRow.weightedAverage : null;

                let scoreHtml = `<span class="font-display font-bold text-base text-[#475569]">—</span>`;
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
                    <div class="py-2.5 px-3 flex items-center justify-between gap-3 hover:bg-[#F5F7FA] rounded-xl transition cursor-pointer" onclick="App.openSectionGrading(${st.section_id})" title="Click to open section grade sheet">
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                                <span class="font-mono text-xs text-[#475569]">${idx + 1}.</span>
                                <p class="text-sm font-bold text-[#17243A] truncate">${escapeHtml(st.full_name)}</p>
                                ${genderBadgeHtml(st.gender, true)}
                            </div>
                            <div class="flex items-center gap-1.5 text-xs text-[#475569] mt-0.5">
                                <span class="font-mono text-xs text-[#475569]">${escapeHtml(st.student_no)}</span>
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
            };

            const femaleOverview = overviewStudents.filter(st => normalizeGenderClient(st.gender) === 'Female');
            const maleOverview = overviewStudents.filter(st => normalizeGenderClient(st.gender) === 'Male');
            const overviewBlocks = [];

            if (femaleOverview.length > 0) {
                overviewBlocks.push(`
                    <div class="py-1.5 px-2.5 mb-1 rounded-lg bg-[#F5DFEB]/75 border border-[#E2B8CF] flex items-center justify-between">
                        <span class="text-xs font-extrabold uppercase tracking-wider text-[#842D60]">&#9792; Female (${femaleOverview.length})</span>
                        <span class="text-xs font-semibold text-[#842D60]">${activeSectionForOverview ? escapeHtml(activeSectionForOverview.section_name) : 'All Sections'}</span>
                    </div>
                    ${femaleOverview.map((st, idx) => renderOverviewItem(st, idx)).join('')}
                `);
            }
            if (maleOverview.length > 0) {
                overviewBlocks.push(`
                    <div class="py-1.5 px-2.5 mt-2 mb-1 rounded-lg bg-[#EBF1F8]/90 border border-[#C5D5EA] flex items-center justify-between">
                        <span class="text-xs font-extrabold uppercase tracking-wider text-[#2C4870]">&#9794; Male (${maleOverview.length})</span>
                        <span class="text-xs font-semibold text-[#2C4870]">${activeSectionForOverview ? escapeHtml(activeSectionForOverview.section_name) : 'All Sections'}</span>
                    </div>
                    ${maleOverview.map((st, idx) => renderOverviewItem(st, idx)).join('')}
                `);
            }

            stuContainer.innerHTML = overviewBlocks.join('');
        }
    }

    // ==================== RENDER SECTIONS & SUBJECT ASSIGNMENTS ====================
    function setSectionViewMode(mode) {
        state.sectionViewMode = mode === 'table' ? 'table' : 'grid';
        renderSectionsView();
    }

    function toggleSectionCurriculumExpand(sectionId) {
        state.expandedSections[sectionId] = !state.expandedSections[sectionId];
        renderSectionsView();
    }

    function renderSectionsView() {
        const gridContainer = document.getElementById('sectionsGridContainer');
        const tableContainer = document.getElementById('sectionsTableContainer');
        const tableBody = document.getElementById('sectionsTableBody');
        const query = (document.getElementById('sectionSearchInput')?.value || '').trim().toLowerCase();
        const yearFilter = document.getElementById('sectionYearFilter')?.value || '';

        // Calculate Top Summary KPIs
        const totalSections = state.sections.length;
        const totalStudents = state.sections.reduce((acc, s) => acc + (Number(s.student_count) || 0), 0);
        const totalLoads = state.sections.reduce((acc, s) => acc + (Number(s.subject_count) || 0), 0);
        const avgClassSize = totalSections > 0 ? (totalStudents / totalSections).toFixed(1) : '0';

        const statTotalEl = document.getElementById('secStatTotal');
        const statStudentsEl = document.getElementById('secStatStudents');
        const statLoadsEl = document.getElementById('secStatLoads');
        const statAvgEl = document.getElementById('secStatAvgClass');

        if (statTotalEl) statTotalEl.textContent = totalSections;
        if (statStudentsEl) statStudentsEl.textContent = totalStudents;
        if (statLoadsEl) statLoadsEl.textContent = totalLoads;
        if (statAvgEl) statAvgEl.textContent = avgClassSize;

        // Sync View Mode Toggle Buttons
        const gridBtn = document.getElementById('secViewGridBtn');
        const tableBtn = document.getElementById('secViewTableBtn');
        const isTable = state.sectionViewMode === 'table';

        if (gridBtn && tableBtn) {
            gridBtn.className = `px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                !isTable ? 'bg-[#17243A] text-white shadow-xs' : 'text-[#475569] hover:text-[#17243A]'
            }`;
            tableBtn.className = `px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                isTable ? 'bg-[#17243A] text-white shadow-xs' : 'text-[#475569] hover:text-[#17243A]'
            }`;
        }

        if (gridContainer && tableContainer) {
            gridContainer.classList.toggle('hidden', isTable);
            tableContainer.classList.toggle('hidden', !isTable);
            tableContainer.classList.toggle('flex', isTable);
        }

        // Filter sections
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

        const isTeacher = state.currentUser?.role === 'teacher';
        const isAdmin = state.currentUser?.role === 'admin';

        if (filtered.length === 0) {
            const emptyHtml = `
                <div class="col-span-full bg-white rounded-2xl border border-[#D8DEE8] p-12 text-center">
                    <div class="w-12 h-12 rounded-2xl bg-[#EBF1F8] text-[#5276A7] flex items-center justify-center mx-auto mb-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                        </svg>
                    </div>
                    <h4 class="font-display font-bold text-[#17243A] text-base">No sections match your search or filter</h4>
                    <p class="text-sm text-[#475569] mt-1 max-w-md mx-auto">Try clearing search terms or create a new section for this year level.</p>
                    <div class="mt-4 flex items-center justify-center gap-2">
                        <button type="button" onclick="document.getElementById('sectionSearchInput').value=''; document.getElementById('sectionYearFilter').value=''; App.renderSectionsView();" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#17243A] bg-[#F5F7FA] hover:bg-[#D8DEE8] border border-[#D8DEE8] transition cursor-pointer">
                            Clear Filters
                        </button>
                        ${isAdmin ? `
                            <button type="button" onclick="App.openSectionModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer">
                                + Create Section
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            if (gridContainer) gridContainer.innerHTML = emptyHtml;
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="py-12 px-4 text-center">${emptyHtml}</td></tr>`;
            return;
        }

        // ==================== 1. RENDER CARDS GRID (Progressive Disclosure) ====================
        if (gridContainer) {
            gridContainer.innerHTML = filtered.map(sec => {
                const isExpanded = Boolean(state.expandedSections[sec.id]);
                const femaleCount = Number(sec.female_count) || 0;
                const maleCount = Number(sec.male_count) || 0;
                const totalStudents = Number(sec.student_count) || 0;
                const femalePct = totalStudents > 0 ? Math.round((femaleCount / totalStudents) * 100) : 50;
                const subjects = sec.assigned_subjects || [];
                const previewSubjects = subjects.slice(0, 4);
                const remainingCount = Math.max(0, subjects.length - 4);

                // Preview Chips (Compact Cloud)
                const subjectChipsHtml = previewSubjects.map(sub => `
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F5F7FA] hover:bg-[#EBF1F8] border border-[#D8DEE8] text-[#17243A] transition" title="${escapeHtml(sub.subject_name)} • ${sub.instructor ? 'Instructor: ' + escapeHtml(sub.instructor) : 'No instructor assigned'}">
                        <span class="font-bold text-[#2C4870]">${escapeHtml(sub.subject_code)}</span>
                        <span class="text-[#0F766E] font-bold">*${formatUnits(sub.units)}u</span>
                    </span>
                `).join('');

                // Full Expanded Curriculum Table
                const fullCurriculumHtml = subjects.length > 0
                    ? `
                        <div class="mt-3 pt-3 border-t border-[#D8DEE8] space-y-2">
                            <div class="flex items-center justify-between text-xs font-bold text-[#475569] uppercase tracking-wider">
                                <span>Curriculum Breakdown (${subjects.length} Loads)</span>
                                ${isAdmin && subjects.length > 1 ? `
                                    <button type="button" onclick="App.openReorderSubjectsModal(${sec.id})" class="text-xs font-bold text-[#5276A7] hover:underline cursor-pointer">
                                        ⇅ Reorder
                                    </button>
                                ` : ''}
                            </div>
                            <div class="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                                ${subjects.map((sub, idx) => `
                                    <div class="p-2.5 rounded-xl border border-[#D8DEE8] bg-[#F5F7FA]/70 hover:bg-white flex items-center justify-between gap-2 text-xs transition">
                                        <div class="min-w-0">
                                            <div class="flex items-center gap-1.5 flex-wrap">
                                                <span class="font-mono text-[11px] font-bold text-[#2C4870] bg-[#EBF1F8] px-1.5 py-0.5 rounded border border-[#C5D5EA]">${escapeHtml(sub.subject_code)}</span>
                                                <span class="font-semibold text-[#17243A] truncate max-w-[140px]">${escapeHtml(sub.subject_name)}</span>
                                                <span class="font-bold text-[#0F766E] text-[11px]">${formatUnits(sub.units)}u</span>
                                            </div>
                                            <div class="text-[11px] text-[#475569] mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                ${sub.schedule ? `<span class="font-mono text-slate-500">${escapeHtml(sub.schedule)} &bull;</span>` : ''}
                                                ${sub.instructor ? `
                                                    <span class="text-[#0F766E] font-medium font-sans">👨‍🏫 ${escapeHtml(sub.instructor)}</span>
                                                ` : `
                                                    <span class="text-[#80530F] font-medium font-sans">⚠️ TBA</span>
                                                `}
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-1 shrink-0">
                                            <button type="button" onclick="App.openSectionGrading(${sec.id}, ${sub.subject_id})" class="px-2 py-1 rounded-lg text-[11px] font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer" title="Input grades for this subject">
                                                Grades
                                            </button>
                                            ${isAdmin ? `
                                                <button type="button" onclick="App.openAssignSubjectTeacherModal(${sub.teacher_id || 'null'}, ${sec.id}, ${sub.subject_id})" class="p-1 rounded-lg text-[#5276A7] hover:bg-[#EBF1F8] transition cursor-pointer" title="Change Instructor">
                                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                                </button>
                                                <button type="button" onclick="App.unassignSingleSubject(${sec.id}, ${sub.subject_id})" class="p-1 rounded-lg text-[#475569] hover:text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Remove subject from section">
                                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `
                    : '';

                return `
                    <div class="bg-white rounded-2xl border border-[#D8DEE8] hover:border-[#5276A7] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between p-4 sm:p-5">
                        <div class="space-y-3.5">
                            <!-- Card Header: Title, Level & Admin Actions -->
                            <div class="flex items-start justify-between gap-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl bg-[#EBF1F8] text-[#2C4870] flex items-center justify-center font-bold text-base border border-[#C5D5EA] shrink-0">
                                        <svg class="w-5 h-5 text-[#2C4870]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <h3 class="font-display font-extrabold text-base sm:text-lg text-[#17243A] leading-tight">${escapeHtml(sec.section_name)}</h3>
                                            <span class="px-2 py-0.5 text-[11px] font-semibold rounded-md border ${yearLevelBadgeClass(sec.year_level)}">
                                                ${escapeHtml(sec.year_level)}
                                            </span>
                                        </div>
                                        <p class="text-xs text-[#475569] mt-0.5 flex items-center gap-1">
                                            <span>Adviser:</span>
                                            <strong class="text-[#17243A]">${sec.adviser ? escapeHtml(sec.adviser) : '<span class="italic text-slate-400 font-normal">None Assigned</span>'}</strong>
                                        </p>
                                    </div>
                                </div>

                                ${isAdmin ? `
                                    <div class="flex items-center gap-1 shrink-0">
                                        <button type="button" onclick="App.openSectionModal(${sec.id})" class="p-1.5 rounded-lg text-[#475569] hover:text-[#17243A] hover:bg-[#EBF1F8] transition cursor-pointer" title="Edit section">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                            </svg>
                                        </button>
                                        <button type="button" onclick="App.confirmDeleteSection(${sec.id})" class="p-1.5 rounded-lg text-[#475569] hover:text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Delete section">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                            </svg>
                                        </button>
                                    </div>
                                ` : ''}
                            </div>

                            <!-- Section Metrics Card -->
                            <div class="bg-[#F5F7FA] rounded-xl p-3 border border-[#D8DEE8] space-y-2 text-xs">
                                <div class="flex items-center justify-between">
                                    <span class="text-[#475569] font-medium">Enrolled Students:</span>
                                    <span class="font-bold text-[#17243A]">
                                        ${totalStudents} Students
                                        <span class="text-[11px] font-normal text-[#475569] ml-1">
                                            (<span class="text-[#842D60] font-semibold">&#9792; ${femaleCount}</span> / <span class="text-[#2C4870] font-semibold">&#9794; ${maleCount}</span>)
                                        </span>
                                    </span>
                                </div>

                                <!-- Subtle Gender Proportion Bar -->
                                <div class="w-full bg-[#D8DEE8] h-1.5 rounded-full overflow-hidden flex">
                                    <div class="bg-[#9B3F72] h-full" style="width: ${femalePct}%" title="Female: ${femaleCount} (${femalePct}%)"></div>
                                    <div class="bg-[#5276A7] h-full" style="width: ${100 - femalePct}%" title="Male: ${maleCount} (${100 - femalePct}%)"></div>
                                </div>

                                <div class="flex items-center justify-between pt-1 border-t border-[#D8DEE8]/70">
                                    <span class="text-[#475569] font-medium">Curriculum Load:</span>
                                    <span class="font-bold text-[#0F766E]">
                                        ${sec.subject_count} Subjects &bull; ${formatUnits(sec.total_units)} Units
                                    </span>
                                </div>
                            </div>

                            <!-- Subject Chips Cloud (Progressive Disclosure) -->
                            <div>
                                <div class="flex items-center justify-between mb-1.5">
                                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                                        Curriculum Preview
                                    </span>
                                    ${isAdmin ? `
                                        <button type="button" onclick="App.openAssignSubjectsModal(${sec.id})" class="text-xs font-semibold text-[#5276A7] hover:underline cursor-pointer">
                                            + Assign
                                        </button>
                                    ` : ''}
                                </div>

                                ${subjects.length > 0 ? `
                                    <div class="flex flex-wrap gap-1.5">
                                        ${subjectChipsHtml}
                                        ${remainingCount > 0 ? `
                                            <span class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]">
                                                +${remainingCount} more
                                            </span>
                                        ` : ''}
                                    </div>

                                    <button type="button" onclick="App.toggleSectionCurriculumExpand(${sec.id})"
                                        class="mt-2 text-xs font-bold text-[#5276A7] hover:text-[#17243A] flex items-center gap-1 transition cursor-pointer">
                                        <span>${isExpanded ? '▲ Hide Full Curriculum' : `▼ View Full Curriculum &amp; Instructors (${subjects.length})`}</span>
                                    </button>
                                    ${isExpanded ? fullCurriculumHtml : ''}
                                ` : `
                                    <div class="p-3 rounded-xl border border-dashed border-[#D8DEE8] text-center bg-[#F5F7FA]/70">
                                        <p class="text-xs text-[#475569]">No subjects assigned to this section yet.</p>
                                        ${isAdmin ? `
                                            <button type="button" onclick="App.openAssignSubjectsModal(${sec.id})" class="mt-1 text-xs font-bold text-[#5276A7] hover:underline cursor-pointer">
                                                + Assign Subjects Now
                                            </button>
                                        ` : ''}
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Card Footer Action Buttons -->
                        <div class="mt-4 pt-3.5 border-t border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-1.5">
                                <button type="button" onclick="App.openStudentModal(null, ${sec.id})" class="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#17243A] bg-[#F5F7FA] hover:bg-[#EBF1F8] border border-[#D8DEE8] transition cursor-pointer" title="Enroll single student">
                                    + Student
                                </button>
                                <button type="button" onclick="App.openStudentModal(null, ${sec.id}, 'bulk')" class="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#2C4870] bg-[#EBF1F8] hover:bg-[#dce6f4] border border-[#C5D5EA] transition cursor-pointer" title="Bulk enroll students">
                                    + Bulk
                                </button>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <button type="button" onclick="App.openSectionGrading(${sec.id})" class="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer" title="Open Grade Sheet">
                                    Grades
                                </button>
                                <button type="button" onclick="App.openSectionReport(${sec.id})" class="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0F766E] bg-[#D5F0EA] hover:bg-[#c2e8df] border border-[#99D8CC] transition cursor-pointer" title="View Rankings &amp; Report">
                                    Report &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ==================== 2. RENDER TABLE VIEW ====================
        if (tableBody) {
            tableBody.innerHTML = filtered.map((sec, idx) => {
                const femaleCount = Number(sec.female_count) || 0;
                const maleCount = Number(sec.male_count) || 0;
                const totalStudents = Number(sec.student_count) || 0;

                return `
                    <tr class="hover:bg-[#F5F7FA]/80 transition">
                        <td class="py-3 px-4 align-middle text-center font-mono text-xs text-[#475569]">${idx + 1}</td>
                        <td class="py-3 px-4 align-middle whitespace-nowrap">
                            <button type="button" onclick="App.openSectionGrading(${sec.id})" class="font-display font-bold text-sm text-[#17243A] hover:text-[#5276A7] transition cursor-pointer">
                                ${escapeHtml(sec.section_name)}
                            </button>
                        </td>
                        <td class="py-3 px-4 align-middle whitespace-nowrap">
                            <span class="px-2.5 py-0.5 text-xs font-semibold rounded-md border ${yearLevelBadgeClass(sec.year_level)}">
                                ${escapeHtml(sec.year_level)}
                            </span>
                        </td>
                        <td class="py-3 px-4 align-middle whitespace-nowrap">
                            ${sec.adviser ? `<span class="font-medium text-xs text-[#17243A]">👨‍🏫 ${escapeHtml(sec.adviser)}</span>` : '<span class="italic text-xs text-slate-400">None</span>'}
                        </td>
                        <td class="py-3 px-4 align-middle whitespace-nowrap">
                            <span class="font-bold text-xs text-[#17243A]">${totalStudents}</span>
                            <span class="text-xs text-[#475569] ml-1">(<span class="text-[#842D60] font-semibold">&#9792; ${femaleCount}</span> / <span class="text-[#2C4870] font-semibold">&#9794; ${maleCount}</span>)</span>
                        </td>
                        <td class="py-3 px-4 align-middle whitespace-nowrap">
                            <span class="inline-flex items-center gap-1 font-semibold text-xs text-[#0F766E] bg-[#D5F0EA] px-2.5 py-1 rounded-lg border border-[#99D8CC]">
                                <span>${sec.subject_count} Subjects</span>
                                <span class="font-bold">(${formatUnits(sec.total_units)}u)</span>
                            </span>
                        </td>
                        <td class="py-3 px-4 align-middle text-right whitespace-nowrap">
                            <div class="inline-flex items-center gap-1.5">
                                <button type="button" onclick="App.openSectionGrading(${sec.id})" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer" title="Input Grades">
                                    Grades
                                </button>
                                <button type="button" onclick="App.openSectionReport(${sec.id})" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0F766E] bg-[#D5F0EA] hover:bg-[#c2e8df] border border-[#99D8CC] transition cursor-pointer" title="View Report">
                                    Report
                                </button>
                                ${isAdmin ? `
                                    <button type="button" onclick="App.openSectionModal(${sec.id})" class="p-1 rounded-lg text-[#475569] hover:text-[#17243A] hover:bg-[#EBF1F8] transition cursor-pointer" title="Edit Section">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                    </button>
                                    <button type="button" onclick="App.confirmDeleteSection(${sec.id})" class="p-1 rounded-lg text-[#475569] hover:text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Delete Section">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
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
                        <p class="text-sm text-[#475569] mt-1">Add subjects with their unit weight (e.g., 4, 3, 1) to compute section rankings.</p>
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
                : `<span class="text-xs text-[#475569] italic">Not assigned to any section</span>`;

            return `
                <tr class="hover:bg-[#F5F7FA]/80 transition">
                    <td class="py-3 px-4 align-middle whitespace-nowrap">
                        <span class="font-mono text-xs sm:text-sm font-bold text-[#17243A] bg-[#EBF1F8] border border-[#C5D5EA] px-2.5 py-1 rounded-lg">
                            ${escapeHtml(sub.subject_code)}
                        </span>
                    </td>
                    <td class="py-3 px-4 align-middle">
                        <p class="font-semibold text-[#17243A] text-sm">${escapeHtml(sub.subject_name)}</p>
                        ${sub.description ? `<p class="text-xs text-[#475569] mt-0.5">${escapeHtml(sub.description)}</p>` : ''}
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
                            <button type="button" onclick="App.openSubjectModal(${sub.id})" class="p-2 rounded-xl text-[#475569] hover:text-[#17243A] hover:bg-[#EBF1F8] transition cursor-pointer" title="Edit Subject">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                </svg>
                            </button>
                            <button type="button" onclick="App.confirmDeleteSubject(${sub.id})" class="p-2 rounded-xl text-[#475569] hover:text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Delete Subject">
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

    function setStudentSectionFilter(secId) {
        state.studentSectionId = secId ? String(secId) : '';
        state.studentCurrentPage = 1;
        const secSelect = document.getElementById('studentSectionFilter');
        if (secSelect) secSelect.value = state.studentSectionId;
        if (state.currentView === 'students') {
            updateBrowserUrl({
                page: 'students',
                section_id: state.studentSectionId ? Number(state.studentSectionId) : null
            }, true);
        }
        renderStudentsView();
    }

    function setStudentGenderFilter(gender) {
        state.studentGenderFilter = gender || '';
        state.studentCurrentPage = 1;
        const gf = document.getElementById('studentGenderFilter');
        if (gf) gf.value = state.studentGenderFilter;
        renderStudentsView();
    }

    function setStudentPageSize(size) {
        state.studentPageSize = size === 'ALL' ? 'ALL' : Number(size) || 10;
        state.studentCurrentPage = 1;
        renderStudentsView();
    }

    function setStudentPage(page) {
        state.studentCurrentPage = Math.max(1, Number(page) || 1);
        renderStudentsView();
    }

    function openStudentSubjectsModal(studentId) {
        const student = state.students.find(s => Number(s.id) === Number(studentId));
        if (!student) return;

        const nameEl = document.getElementById('ssmStudentName');
        const noEl = document.getElementById('ssmStudentNo');
        const secEl = document.getElementById('ssmSectionName');
        const unitsEl = document.getElementById('ssmTotalUnits');
        const tbody = document.getElementById('studentSubjectsModalBody');

        if (nameEl) nameEl.textContent = student.full_name;
        if (noEl) noEl.textContent = `(${student.student_no})`;
        if (secEl) secEl.textContent = `${student.section_name} • ${student.year_level}`;

        const subjects = student.assigned_subjects || [];
        const totalUnits = subjects.reduce((sum, s) => sum + (Number(s.units) || 0), 0);
        if (unitsEl) unitsEl.textContent = `${totalUnits} Units Total`;

        if (tbody) {
            if (subjects.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-8 px-4 text-center text-[#475569]">
                            <p class="font-bold text-[#17243A]">No subjects currently assigned</p>
                            <p class="text-xs mt-1">This section doesn't have assigned subjects yet.</p>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = subjects.map(sub => `
                    <tr class="hover:bg-[#F5F7FA] transition">
                        <td class="py-2.5 px-3.5 font-mono font-bold text-[#17243A] whitespace-nowrap">${escapeHtml(sub.subject_code)}</td>
                        <td class="py-2.5 px-3.5">
                            <span class="font-semibold text-[#17243A]">${escapeHtml(sub.subject_name)}</span>
                        </td>
                        <td class="py-2.5 px-3.5 text-center font-bold text-[#0F766E]">${formatUnits(sub.units)}</td>
                        <td class="py-2.5 px-3.5 text-[#475569]">
                            ${sub.teacher_name ? `<span class="font-medium text-[#17243A]">${escapeHtml(sub.teacher_name)}</span>` : '<span class="italic text-slate-400">TBA</span>'}
                        </td>
                        <td class="py-2.5 px-3.5 text-[#475569]">
                            ${sub.schedule ? `<span class="font-medium text-xs bg-[#F5F7FA] border border-[#D8DEE8] px-2 py-0.5 rounded">${escapeHtml(sub.schedule)}</span>` : '<span class="italic text-slate-400">—</span>'}
                        </td>
                    </tr>
                `).join('');
            }
        }

        openModal('studentSubjectsModal');
    }

    function renderStudentsView() {
        const tbody = document.getElementById('studentsTableBody');
        const paginationContainer = document.getElementById('studentPaginationContainer');
        const query = (document.getElementById('studentSearchInput')?.value || '').trim().toLowerCase();
        const yearFilter = document.getElementById('studentYearFilter')?.value || '';
        const sectionFilter = state.studentSectionId || document.getElementById('studentSectionFilter')?.value || '';
        const genderFilter = state.studentGenderFilter || document.getElementById('studentGenderFilter')?.value || '';

        // Update Top Summary KPI Metric Cards
        const totalAll = state.students.length;
        const femalesAll = state.students.filter(s => normalizeGenderClient(s.gender) === 'Female').length;
        const malesAll = state.students.filter(s => normalizeGenderClient(s.gender) === 'Male').length;
        const activeSecCount = state.sections.length;

        const statTotalEl = document.getElementById('studentStatTotal');
        const statFemaleEl = document.getElementById('studentStatFemale');
        const statFemalePctEl = document.getElementById('studentStatFemalePct');
        const statMaleEl = document.getElementById('studentStatMale');
        const statMalePctEl = document.getElementById('studentStatMalePct');
        const statSecEl = document.getElementById('studentStatSections');

        if (statTotalEl) statTotalEl.textContent = totalAll;
        if (statFemaleEl) statFemaleEl.textContent = femalesAll;
        if (statFemalePctEl) statFemalePctEl.textContent = totalAll > 0 ? `${Math.round((femalesAll / totalAll) * 100)}%` : '0%';
        if (statMaleEl) statMaleEl.textContent = malesAll;
        if (statMalePctEl) statMalePctEl.textContent = totalAll > 0 ? `${Math.round((malesAll / totalAll) * 100)}%` : '0%';
        if (statSecEl) statSecEl.textContent = activeSecCount;

        // Sync Gender Segmented Button States
        const sgfAll = document.getElementById('sgfBtnAll');
        const sgfFemale = document.getElementById('sgfBtnFemale');
        const sgfMale = document.getElementById('sgfBtnMale');
        if (sgfAll && sgfFemale && sgfMale) {
            sgfAll.className = `px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                !genderFilter ? 'bg-[#17243A] text-white shadow-xs' : 'text-[#475569] hover:text-[#17243A]'
            }`;
            sgfFemale.className = `px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                genderFilter === 'Female' ? 'bg-[#9B3F72] text-white shadow-xs' : 'text-[#475569] hover:text-[#17243A]'
            }`;
            sgfMale.className = `px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                genderFilter === 'Male' ? 'bg-[#5276A7] text-white shadow-xs' : 'text-[#475569] hover:text-[#17243A]'
            }`;
        }

        // Render Section Pills Bar
        const pillsContainer = document.getElementById('studentSectionPillsBar');
        if (pillsContainer) {
            const allActive = !state.studentSectionId;
            const pillsHtml = [
                `<button type="button" onclick="App.setStudentSectionFilter('')" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 ${
                    allActive
                        ? 'bg-[#17243A] text-white border-[#17243A] shadow-xs'
                        : 'bg-white text-[#475569] border-[#D8DEE8] hover:text-[#17243A] hover:bg-[#F5F7FA]'
                }">
                    All Sections <span class="ml-1 opacity-80 font-normal">(${totalAll})</span>
                </button>`
            ];

            state.sections.forEach(sec => {
                const count = state.students.filter(st => st.section_id === sec.id).length;
                const isSecActive = String(state.studentSectionId) === String(sec.id);
                pillsHtml.push(`
                    <button type="button" onclick="App.setStudentSectionFilter(${sec.id})" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 ${
                        isSecActive
                            ? 'bg-[#17243A] text-white border-[#17243A] shadow-xs'
                            : 'bg-white text-[#475569] border-[#D8DEE8] hover:text-[#17243A] hover:bg-[#F5F7FA]'
                    }">
                        ${escapeHtml(sec.section_name)} <span class="ml-1 opacity-80 font-normal">(${count})</span>
                    </button>
                `);
            });

            pillsContainer.innerHTML = pillsHtml.join('');
        }

        const resetBtn = document.getElementById('resetStudentFiltersBtn');
        if (resetBtn) {
            resetBtn.classList.toggle('hidden', !query && !yearFilter && !sectionFilter && !genderFilter);
        }

        // Filter the student list
        const filtered = state.students.filter(st => {
            if (yearFilter && st.year_level !== yearFilter) return false;
            if (sectionFilter && String(st.section_id) !== String(sectionFilter)) return false;
            if (genderFilter && normalizeGenderClient(st.gender) !== genderFilter) return false;
            if (!query) return true;
            return (
                st.full_name.toLowerCase().includes(query) ||
                st.student_no.toLowerCase().includes(query) ||
                st.section_name.toLowerCase().includes(query) ||
                st.year_level.toLowerCase().includes(query)
            );
        });

        // Pagination calculation
        const totalMatching = filtered.length;
        const pageSize = state.studentPageSize === 'ALL' ? 'ALL' : Number(state.studentPageSize) || 10;
        const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalMatching / pageSize));
        state.studentCurrentPage = Math.min(Math.max(1, state.studentCurrentPage), totalPages);
        const currentPage = state.studentCurrentPage;

        const pagedStudents = pageSize === 'ALL'
            ? filtered
            : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="py-12 px-4 text-center">
                        <p class="text-base font-bold text-[#17243A]">No student records match your view</p>
                        <p class="text-sm text-[#475569] mt-1">Enroll a student and assign them to a section, year level, and gender group.</p>
                        <div class="mt-4 flex items-center justify-center gap-2">
                            <button type="button" onclick="App.resetStudentFilters()" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#17243A] bg-[#F5F7FA] hover:bg-[#D8DEE8] border border-[#D8DEE8] transition cursor-pointer">
                                Clear Filters
                            </button>
                            <button type="button" onclick="App.openStudentModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer can-add-student-only">
                                + Add Student
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

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

        const canAddStudent = state.currentUser?.role === 'admin' || Boolean(state.currentUser?.can_add_student);

        const rowsHtml = pagedStudents.map((st, idx) => {
            const overallIdx = pageSize === 'ALL' ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
            const initials = (st.full_name || '')
                .split(' ')
                .filter(Boolean)
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'ST';

            const normGender = normalizeGenderClient(st.gender);
            const genderBadge = normGender === 'Female'
                ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]"><span>&#9792;</span><span>Female</span></span>`
                : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]"><span>&#9794;</span><span>Male</span></span>`;

            const subCount = (st.assigned_subjects || []).length;
            const totalUnits = (st.assigned_subjects || []).reduce((sum, s) => sum + (Number(s.units) || 0), 0);
            const curriculumBtn = subCount > 0
                ? `<button type="button" onclick="App.openStudentSubjectsModal(${st.id})" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F5F7FA] hover:bg-[#EBF1F8] text-[#17243A] border border-[#D8DEE8] hover:border-[#5276A7] transition cursor-pointer" title="Click to view all ${subCount} subjects, teachers, and schedules">
                    <svg class="w-3.5 h-3.5 text-[#5276A7]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    <span>${subCount} Subjects</span>
                    <span class="text-[#0F766E] font-bold">(${totalUnits}u)</span>
                </button>`
                : `<button type="button" onclick="App.openAssignSubjectsModal(${st.section_id})" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296] hover:underline cursor-pointer" title="Assign subjects to section">
                    <span>&#9888; No Subjects</span>
                </button>`;

            return `
                <tr class="hover:bg-[#F5F7FA]/80 transition">
                    <td class="py-3 px-3.5 align-middle text-center font-mono text-xs text-[#475569]">
                        ${overallIdx}
                    </td>
                    <td class="py-3 px-3.5 align-middle whitespace-nowrap">
                        <span class="font-mono text-xs font-semibold text-[#17243A] bg-[#F5F7FA] border border-[#D8DEE8] px-2 py-1 rounded-lg">${escapeHtml(st.student_no)}</span>
                    </td>
                    <td class="py-3 px-3.5 align-middle">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-full ${normGender === 'Female' ? 'bg-[#F5DFEB] text-[#842D60] border-[#E2B8CF]' : 'bg-[#EBF1F8] text-[#2C4870] border-[#C5D5EA]'} border flex items-center justify-center font-bold text-xs shrink-0">
                                ${initials}
                            </div>
                            <div>
                                <p class="font-semibold text-[#17243A] text-sm leading-tight">${escapeHtml(st.full_name)}</p>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-3.5 align-middle whitespace-nowrap">
                        ${genderBadge}
                    </td>
                    <td class="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="App.openSectionGrading(${st.section_id})" class="font-bold text-[#2C4870] hover:text-[#17243A] bg-[#EBF1F8] hover:bg-[#dce6f4] px-2 py-0.5 rounded-md text-xs border border-[#C5D5EA] transition cursor-pointer" title="Click to input grades for this section">
                                ${escapeHtml(st.section_name)}
                            </button>
                            <span class="px-2 py-0.5 text-[11px] font-semibold rounded-md border ${yearLevelBadgeClass(st.year_level)}">
                                ${escapeHtml(st.year_level)}
                            </span>
                        </div>
                    </td>
                    <td class="py-3 px-3.5 align-middle whitespace-nowrap">
                        ${curriculumBtn}
                    </td>
                    <td class="py-3 px-3.5 align-middle whitespace-nowrap">
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${statusClasses[st.status] || statusClasses.Active}">
                            <span>${statusIcons[st.status] || '&#10003;'}</span>
                            <span>${escapeHtml(st.status)}</span>
                        </span>
                    </td>
                    <td class="py-3 px-3.5 align-middle text-right whitespace-nowrap">
                        <div class="inline-flex items-center gap-1.5">
                            <button type="button" onclick="App.openSectionGrading(${st.section_id})" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] transition cursor-pointer" title="Input Grades">
                                Grades
                            </button>
                            ${canAddStudent ? `
                                <button type="button" onclick="App.openStudentModal(${st.id})" class="p-1.5 rounded-lg text-[#475569] hover:text-[#17243A] hover:bg-[#EBF1F8] transition cursor-pointer" title="Edit Student">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                    </svg>
                                </button>
                                <button type="button" onclick="App.confirmDeleteStudent(${st.id})" class="p-1.5 rounded-lg text-[#475569] hover:text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Delete Student">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = rowsHtml.join('');

        // Render Pagination & Entries Controls
        if (paginationContainer) {
            const startEntryNum = totalMatching === 0 ? 0 : (pageSize === 'ALL' ? 1 : (currentPage - 1) * pageSize + 1);
            const endEntryNum = pageSize === 'ALL' ? totalMatching : Math.min(currentPage * pageSize, totalMatching);

            const pageSizeOptions = [10, 25, 50, 'ALL'].map(opt => {
                const isSel = (opt === 'ALL' && state.studentPageSize === 'ALL') || Number(opt) === Number(state.studentPageSize);
                return `<option value="${opt}" ${isSel ? 'selected' : ''}>${opt === 'ALL' ? 'All' : opt}</option>`;
            }).join('');

            const pageSizeQuickPills = [10, 25, 50, 'ALL'].map(opt => {
                const isCurr = (opt === 'ALL' && state.studentPageSize === 'ALL') || Number(opt) === Number(state.studentPageSize);
                return `
                    <button type="button" onclick="App.setStudentPageSize('${opt}')"
                        class="px-2 py-0.5 rounded-md text-xs font-bold border transition cursor-pointer ${
                            isCurr
                                ? 'bg-[#17243A] text-white border-[#17243A]'
                                : 'bg-white text-[#475569] border-[#D8DEE8] hover:text-[#17243A] hover:bg-[#F5F7FA]'
                        }">
                        ${opt === 'ALL' ? 'All' : opt}
                    </button>
                `;
            }).join('');

            const pageButtonsHtml = [];
            const maxPageButtons = 5;
            let startP = Math.max(1, currentPage - 2);
            let endP = Math.min(totalPages, startP + maxPageButtons - 1);
            if (endP - startP + 1 < maxPageButtons) {
                startP = Math.max(1, endP - maxPageButtons + 1);
            }

            for (let p = startP; p <= endP; p++) {
                const isActPage = p === currentPage;
                pageButtonsHtml.push(`
                    <button type="button" onclick="App.setStudentPage(${p})"
                        class="w-7 h-7 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            isActPage
                                ? 'bg-[#17243A] text-white border-[#17243A]'
                                : 'bg-white text-[#17243A] border-[#D8DEE8] hover:bg-[#F5F7FA]'
                        }">
                        ${p}
                    </button>
                `);
            }

            paginationContainer.innerHTML = `
                <div class="flex items-center gap-2">
                    <span>Showing <strong class="text-[#17243A]">${startEntryNum}</strong> to <strong class="text-[#17243A]">${endEntryNum}</strong> of <strong class="text-[#17243A]">${totalMatching}</strong> students</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-[#D8DEE8]">
                        <span class="text-xs font-medium text-[#475569]">Show:</span>
                        <select onchange="App.setStudentPageSize(this.value)" class="text-xs font-bold text-[#17243A] bg-transparent outline-none cursor-pointer">
                            ${pageSizeOptions}
                        </select>
                    </div>
                    <div class="hidden sm:inline-flex items-center gap-1">
                        ${pageSizeQuickPills}
                    </div>
                </div>
                <div class="flex items-center gap-1.5">
                    <button type="button"
                        onclick="App.setStudentPage(${currentPage - 1})"
                        ${currentPage <= 1 ? 'disabled' : ''}
                        class="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#D8DEE8] bg-white text-[#17243A] hover:bg-[#EBF1F8] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer">
                        Prev
                    </button>
                    ${pageButtonsHtml.join('')}
                    <button type="button"
                        onclick="App.setStudentPage(${currentPage + 1})"
                        ${currentPage >= totalPages ? 'disabled' : ''}
                        class="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#D8DEE8] bg-white text-[#17243A] hover:bg-[#EBF1F8] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer">
                        Next
                    </button>
                </div>
            `;
        }
    }

    // ==================== VIEW 5: TEACHER GRADE INPUT PER SECTION ====================
    function openSectionGrading(sectionId, subjectId = null, quarter = null) {
        state.gradingSectionId = Number(sectionId);
        const isTeacher = state.currentUser?.role === 'teacher';
        const sec = state.sections.find(s => s.id === state.gradingSectionId);
        const assignedSubs = sec?.assigned_subjects || [];

        if (subjectId && subjectId !== 'ALL') {
            state.gradingSubjectId = String(subjectId);
        } else if (isTeacher && assignedSubs.length > 0) {
            state.gradingSubjectId = String(assignedSubs[0].subject_id);
        } else {
            state.gradingSubjectId = isTeacher && assignedSubs.length > 0 ? String(assignedSubs[0].subject_id) : 'ALL';
        }
        if (quarter) state.gradingQuarter = quarter;
        switchView('grading', false);
        updateBrowserUrl({
            page: 'grading',
            section_id: state.gradingSectionId,
            quarter: state.gradingQuarter,
            subject_id: state.gradingSubjectId !== 'ALL' && state.gradingSubjectId ? state.gradingSubjectId : null
        });
        renderGradingView();
    }

    function setGradingQuarter(quarter) {
        state.gradingQuarter = quarter;
        const qSelect = document.getElementById('gradingQuarterSelect');
        if (qSelect) qSelect.value = quarter;
        if (state.currentView === 'grading') {
            updateBrowserUrl({
                page: 'grading',
                section_id: state.gradingSectionId,
                quarter: state.gradingQuarter,
                subject_id: state.gradingSubjectId !== 'ALL' ? state.gradingSubjectId : null
            }, true);
        }
        renderGradingView();
    }

    function setGradingSubjectTab(subjectId) {
        state.gradingSubjectId = String(subjectId);
        const sSelect = document.getElementById('gradingSubjectSelect');
        if (sSelect) sSelect.value = String(subjectId);
        if (state.currentView === 'grading') {
            updateBrowserUrl({
                page: 'grading',
                section_id: state.gradingSectionId,
                quarter: state.gradingQuarter,
                subject_id: state.gradingSubjectId !== 'ALL' ? state.gradingSubjectId : null
            }, true);
        }
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
                : 'qtr-tab-btn px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#475569] hover:text-[#17243A] transition cursor-pointer text-center';
        });

        if (state.sections.length === 0) {
            secSelect.innerHTML = `<option value="">No sections available</option>`;
            subSelect.innerHTML = `<option value="ALL">No subjects assigned</option>`;
            if (tabsContainer) tabsContainer.innerHTML = '';
            container.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <p class="text-base font-display font-bold text-[#17243A]">No Sections Available</p>
                    <p class="text-sm text-[#475569] mt-1">Create a section, assign subjects, and enroll students first—or load the 28-unit demo data.</p>
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

        const isTeacher = state.currentUser?.role === 'teacher';
        const assignedSubjects = activeSection.assigned_subjects || [];

        if (isTeacher) {
            if (!assignedSubjects.some(s => String(s.subject_id) === String(state.gradingSubjectId))) {
                state.gradingSubjectId = assignedSubjects[0] ? String(assignedSubjects[0].subject_id) : '';
            }
        } else {
            if (state.gradingSubjectId !== 'ALL' && !assignedSubjects.some(s => String(s.subject_id) === String(state.gradingSubjectId))) {
                state.gradingSubjectId = 'ALL';
            }
        }

        const subjectOptions = isTeacher
            ? assignedSubjects.map((sub, idx) => `
                <option value="${sub.subject_id}" ${String(state.gradingSubjectId) === String(sub.subject_id) ? 'selected' : ''}>
                    ${escapeHtml(sub.subject_code)} — ${escapeHtml(sub.subject_name)} (*${formatUnits(sub.units)}u)
                </option>
            `)
            : [
                `<option value="ALL" ${state.gradingSubjectId === 'ALL' ? 'selected' : ''}>All Subjects — Master Spreadsheet (${assignedSubjects.length})</option>`,
                ...assignedSubjects.map((sub, idx) => `
                    <option value="${sub.subject_id}" ${String(state.gradingSubjectId) === String(sub.subject_id) ? 'selected' : ''}>
                        Col ${excelColLetter(idx)}: ${escapeHtml(sub.subject_code)} — ${escapeHtml(sub.subject_name)} (*${formatUnits(sub.units)}u)
                    </option>
                `),
            ];
        subSelect.innerHTML = subjectOptions.length > 0 ? subjectOptions.join('') : `<option value="">No subjects handled</option>`;

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
                        <span class="font-mono text-xs ${isSelected ? 'text-white/80' : 'text-[#475569]'}">${isTeacher ? '' : col + ':'}</span>
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

            if (isTeacher) {
                tabsContainer.innerHTML = subTabBtns.join('');
            } else {
                const isAllSelected = state.gradingSubjectId === 'ALL';
                tabsContainer.innerHTML = [
                    `<button type="button" onclick="App.setGradingSubjectTab('ALL')"
                        class="flex-1 min-w-fit inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition cursor-pointer ${
                            isAllSelected
                                ? 'bg-[#17243A] text-white border-[#17243A] shadow-2xs'
                                : 'bg-white text-[#17243A] border-[#D8DEE8] hover:bg-[#F5F7FA]'
                        }">
                        <span>All Subjects Sheet</span>
                        <span class="px-2 py-0.5 rounded-full text-xs ${isAllSelected ? 'bg-[#D5F0EA] text-[#0F766E]' : 'bg-[#F5F7FA] text-[#475569]'}">
                            ${filledCells}/${totalCells}
                        </span>
                    </button>`,
                    ...subTabBtns,
                ].join('');
            }
        }

        const formulaStr = buildSectionFormulaString(assignedSubjects, 21);
        document.getElementById('gradingFormulaCode').textContent = formulaStr;
        document.getElementById('gradingMetaSummary').textContent =
            `${activeSection.section_name} (${formatUnits(activeSection.total_units)}u)`;

        if (assignedSubjects.length === 0) {
            container.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <p class="text-base font-display font-bold text-[#17243A]">${isTeacher ? 'No Subjects Handled in ' + escapeHtml(activeSection.section_name) : 'No Subjects Assigned to ' + escapeHtml(activeSection.section_name)}</p>
                    <p class="text-sm text-[#475569] mt-1">${isTeacher ? 'You are not assigned as the teacher for any subjects in this section.' : 'Assign subjects to this section first so teachers can input student grades.'}</p>
                    ${!isTeacher ? `
                        <button type="button" onclick="App.openAssignSubjectsModal(${activeSection.id})" class="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] cursor-pointer">
                            + Assign Subjects to ${escapeHtml(activeSection.section_name)}
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        if (!standings || standings.rows.length === 0) {
            container.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <p class="text-base font-display font-bold text-[#17243A]">No Students Enrolled in ${escapeHtml(activeSection.section_name)}</p>
                    <p class="text-sm text-[#475569] mt-1">Enroll students into ${escapeHtml(activeSection.section_name)} to start inputting their grades.</p>
                    <button type="button" onclick="App.openStudentModal(null, ${activeSection.id})" class="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] cursor-pointer">
                        + Enroll Student in ${escapeHtml(activeSection.section_name)}
                    </button>
                </div>
            `;
            return;
        }

        const searchQ = (document.getElementById('gradingStudentSearchInput')?.value || '').trim().toLowerCase();
        const genderFilter = document.getElementById('gradingGenderFilter')?.value || '';
        const filteredRows = standings.rows.filter(r => {
            if (genderFilter && normalizeGenderClient(r.student.gender) !== genderFilter) return false;
            if (!searchQ) return true;
            return (
                r.student.full_name.toLowerCase().includes(searchQ) ||
                r.student.student_no.toLowerCase().includes(searchQ)
            );
        });

        const filteredStandings = {
            ...standings,
            rows: filteredRows,
        };

        // Determine Lock Status for Section / Subject / Quarter
        const currentQtr = state.gradingQuarter;
        const currentSubId = state.gradingSubjectId;
        const assignedSubs = activeSection.assigned_subjects || [];
        const isAdmin = state.currentUser?.role === 'admin';

        let isSheetLocked = false;
        let isUnlockRequested = false;
        let activeLockData = null;
        const subjectLocksMap = {};

        assignedSubs.forEach(sub => {
            const k = `${activeSection.id}_${sub.subject_id}_${currentQtr}`;
            const lk = state.gradeLocks ? state.gradeLocks[k] : null;
            if (lk && lk.is_locked) {
                subjectLocksMap[sub.subject_id] = true;
            }
        });

        if (currentSubId !== 'ALL') {
            const lockKey = `${activeSection.id}_${currentSubId}_${currentQtr}`;
            activeLockData = state.gradeLocks ? state.gradeLocks[lockKey] : null;
            if (activeLockData && activeLockData.is_locked) {
                isSheetLocked = true;
                isUnlockRequested = Boolean(activeLockData.unlock_requested);
            }
        } else {
            // Master Spreadsheet: locked if all subjects are locked
            const lockedCount = Object.keys(subjectLocksMap).length;
            isSheetLocked = assignedSubs.length > 0 && lockedCount === assignedSubs.length;
            isUnlockRequested = assignedSubs.some(sub => {
                const k = `${activeSection.id}_${sub.subject_id}_${currentQtr}`;
                return state.gradeLocks && state.gradeLocks[k] && state.gradeLocks[k].unlock_requested;
            });
            if (lockedCount > 0) {
                const firstLockedSub = assignedSubs.find(s => subjectLocksMap[s.subject_id]);
                if (firstLockedSub) {
                    activeLockData = state.gradeLocks[`${activeSection.id}_${firstLockedSub.subject_id}_${currentQtr}`];
                }
            }
        }

        // Render Grading Lock Notice Banner
        const lockNoticeBanner = document.getElementById('gradingLockNoticeBanner');
        if (lockNoticeBanner) {
            if (isSheetLocked) {
                lockNoticeBanner.classList.remove('hidden');
                if (isUnlockRequested) {
                    lockNoticeBanner.className = 'rounded-xl p-3 border border-[#F0D296] bg-[#FFF0D1] text-xs flex flex-wrap items-center justify-between gap-2 text-[#80530F]';
                    lockNoticeBanner.innerHTML = `
                        <div class="flex items-center gap-2">
                            <span class="text-base">⏳</span>
                            <div>
                                <span class="font-bold">Grades Finalized &amp; Unlock Request Submitted</span>
                                <p class="text-[11px] opacity-90 mt-0.5">Reason: "${escapeHtml(activeLockData?.unlock_reason || '')}". Waiting for administrator approval.</p>
                            </div>
                        </div>
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-[#80530F] border border-[#F0D296]">Pending Admin Review</span>
                    `;
                } else {
                    lockNoticeBanner.className = 'rounded-xl p-3 border border-[#99D8CC] bg-[#D5F0EA] text-xs flex flex-wrap items-center justify-between gap-2 text-[#0F766E]';
                    lockNoticeBanner.innerHTML = `
                        <div class="flex items-center gap-2">
                            <span class="text-base">🔒</span>
                            <div>
                                <span class="font-bold">Grades Finalized &amp; Locked for ${escapeHtml(currentQtr)}</span>
                                <p class="text-[11px] opacity-90 mt-0.5">Locked ${activeLockData?.locked_at ? 'on ' + escapeHtml(activeLockData.locked_at) : ''} by ${escapeHtml(activeLockData?.locked_by_name || 'Teacher')}. Grade inputs are secured.</p>
                            </div>
                        </div>
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-[#0F766E] border border-[#99D8CC]">Finalized &bull; Read-Only</span>
                    `;
                }
            } else {
                lockNoticeBanner.classList.add('hidden');
                lockNoticeBanner.innerHTML = '';
            }
        }

        // Render Lock Action Buttons in Header
        const lockActionsContainer = document.getElementById('gradingLockActionsContainer');
        if (lockActionsContainer) {
            if (isAdmin) {
                if (isSheetLocked) {
                    lockActionsContainer.innerHTML = `
                        <button type="button" onclick="App.toggleGradeLockDirect(${activeSection.id}, '${currentSubId}', '${currentQtr}', false)"
                            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0c5f58] shadow-2xs transition cursor-pointer"
                            title="Administrator Override: Unlock this grade sheet so teachers can edit">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
                            <span>Admin Unlock Sheet</span>
                        </button>
                    `;
                } else {
                    lockActionsContainer.innerHTML = `
                        <button type="button" onclick="App.toggleGradeLockDirect(${activeSection.id}, '${currentSubId}', '${currentQtr}', true)"
                            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#17243A] bg-[#F5F7FA] hover:bg-[#EBF1F8] border border-[#D8DEE8] transition cursor-pointer"
                            title="Administrator: Finalize and lock this sheet immediately">
                            <svg class="w-4 h-4 text-[#5276A7]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            <span>Direct Lock</span>
                        </button>
                    `;
                }
            } else {
                // Teacher view
                if (!isSheetLocked) {
                    lockActionsContainer.innerHTML = `
                        <button type="button" onclick="App.lockCurrentGradesSheet()"
                            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#17243A] hover:bg-[#243752] shadow-2xs transition cursor-pointer"
                            title="Finalize grades and lock this sheet against accidental changes">
                            <svg class="w-4 h-4 text-[#D5F0EA]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            <span>Finalize &amp; Lock Grades</span>
                        </button>
                    `;
                } else if (!isUnlockRequested) {
                    lockActionsContainer.innerHTML = `
                        <button type="button" onclick="App.openRequestUnlockModal()"
                            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#80530F] bg-[#FFF0D1] hover:bg-[#ffe6b3] border border-[#F0D296] shadow-2xs transition cursor-pointer"
                            title="Submit a request to the administrator explaining why grades need to be rewritten">
                            <svg class="w-4 h-4 text-[#B7791F]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
                            <span>Request Unlock to Rewrite</span>
                        </button>
                    `;
                } else {
                    lockActionsContainer.innerHTML = `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#80530F] bg-[#FFF0D1] border border-[#F0D296]">
                            <span class="animate-pulse">⏳</span>
                            <span>Unlock Request Pending</span>
                        </span>
                    `;
                }
            }
        }

        const inputsDisabled = isSheetLocked && !isAdmin;

        if (state.gradingSubjectId !== 'ALL') {
            renderSingleSubjectGradeSheet(container, activeSection, filteredStandings, Number(state.gradingSubjectId), inputsDisabled);
        } else {
            renderMasterSectionGradeSheet(container, activeSection, filteredStandings, subjectLocksMap, !isAdmin);
        }

        updateMissingGradesCounter();
        resetActiveStudentHUD();
    }

    function renderSingleSubjectGradeSheet(container, section, standings, subjectId, isLocked = false) {
        const subIndex = section.assigned_subjects.findIndex(s => Number(s.subject_id) === subjectId);
        const sub = section.assigned_subjects[subIndex];
        if (!sub) return;
        const colLetter = excelColLetter(subIndex);

        const femaleCount = standings.rows.filter(r => normalizeGenderClient(r.student.gender) === 'Female').length;
        const maleCount = standings.rows.filter(r => normalizeGenderClient(r.student.gender) === 'Male').length;
        let lastGenderGroup = null;
        const rowsHtmlChunks = [];

        standings.rows.forEach((row, rIdx) => {
            const st = row.student;
            const gNorm = normalizeGenderClient(st.gender);
            if (gNorm !== lastGenderGroup) {
                lastGenderGroup = gNorm;
                rowsHtmlChunks.push(
                    genderSectionHeaderRowHtml(
                        gNorm,
                        gNorm === 'Female' ? femaleCount : maleCount,
                        6,
                        `${section.section_name} • ${sub.subject_code}`
                    )
                );
            }

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

            rowsHtmlChunks.push(`
                <tr class="hover:bg-[#F5F7FA] transition text-sm" id="singleRow_${st.id}" data-student-row="${st.id}">
                    <td class="py-2.5 px-3.5 font-mono text-xs text-[#475569]">${colLetter}${row.excel_row}</td>
                    <td class="py-2.5 px-3.5 font-mono text-xs font-semibold text-[#17243A]">${escapeHtml(st.student_no)}</td>
                    <td class="py-2.5 px-3.5">
                        <div class="flex items-center gap-2">
                            <span class="font-semibold text-[#17243A]">${escapeHtml(st.full_name)}</span>
                            ${genderBadgeHtml(st.gender, true)}
                        </div>
                    </td>
                    <td class="py-2.5 px-3.5 text-center">
                        <div class="inline-flex items-center justify-center gap-2">
                            <input type="number" step="0.01" min="50" max="100"
                                id="cell_${st.id}_${subjectId}"
                                data-grade-input="true"
                                data-row-idx="${rIdx}"
                                data-col-idx="0"
                                data-student-id="${st.id}"
                                data-student-name="${escapeHtml(st.full_name)}"
                                data-student-no="${escapeHtml(st.student_no)}"
                                data-student-gender="${escapeHtml(st.gender)}"
                                data-section-id="${section.id}"
                                data-subject-id="${subjectId}"
                                data-subject-code="${escapeHtml(sub.subject_code)}"
                                data-subject-name="${escapeHtml(sub.subject_name)}"
                                data-quarter="${state.gradingQuarter}"
                                data-units="${sub.units}"
                                value="${currentVal !== '' ? Number(currentVal) : ''}"
                                placeholder="50-100"
                                onfocus="App.onGradeCellFocus(this)"
                                onblur="App.onGradeCellBlur(this)"
                                onkeydown="App.onGradeCellKeyDown(event, this)"
                                oninput="App.onLiveGradeCellInput(this)"
                                ${isLocked ? 'disabled readonly' : ''} class="w-24 px-2.5 py-1.5 text-center font-bold text-sm rounded-xl border ${evalInfo.inputClass} ${isLocked ? 'bg-slate-100 opacity-80 cursor-not-allowed text-[#475569]' : 'focus:border-[#17243A] focus:ring-2 focus:ring-[#5276A7]/25 outline-none'}">
                            ${isLocked ? '' : `<div class="hidden sm:inline-flex items-center gap-1">${presetChips}</div>`}
                        </div>
                    </td>
                    <td class="py-2.5 px-3.5 text-center font-mono text-xs sm:text-sm font-semibold text-[#17243A]" data-weighted-cell="${st.id}">
                        ${weightedVal}
                    </td>
                    <td class="py-2.5 px-3.5 text-center" data-remark-cell="${st.id}">
                        ${renderSingleGradeBadge(sr?.grade)}
                    </td>
                </tr>
            `);
        });

        const rowsHtml = rowsHtmlChunks.join('');

        container.innerHTML = `
            <div class="px-4 py-3 bg-[#F5F7FA] border-b border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div class="flex items-center gap-2.5 flex-wrap">
                    <span class="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#17243A] text-white">Col ${colLetter}</span>
                    <h3 class="font-display font-bold text-[#17243A] text-sm sm:text-base">${escapeHtml(sub.subject_code)} — ${escapeHtml(sub.subject_name)}</h3>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">*${formatUnits(sub.units)} Units</span>
                    <span class="text-xs sm:text-sm text-[#475569]">
                        &bull; ${escapeHtml(section.section_name)} (${escapeHtml(state.gradingQuarter)})
                        ${sub.instructor ? `&bull; Teacher: <strong class="text-[#17243A]">${escapeHtml(sub.instructor)}</strong>` : ''}
                    </span>
                </div>
                <span class="text-xs text-[#475569] font-medium">Policy: Pass &ge; ${GRADING_POLICY.passingGrade} &bull; Honor Floor &ge; ${GRADING_POLICY.honorSubjectFloor}</span>
            </div>
            <div class="flex-1 overflow-auto custom-scrollbar">
                <table class="w-full text-left border-collapse" aria-label="Student Grade Table">
                    <thead class="sticky top-0 z-10">
                        <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#475569]">
                            <th scope="col" class="py-3 px-3.5">Cell</th>
                            <th scope="col" class="py-3 px-3.5">Student ID</th>
                            <th scope="col" class="py-3 px-3.5">Student Name</th>
                            <th scope="col" class="py-3 px-3.5 text-center">${escapeHtml(state.gradingQuarter)} Grade (${colLetter}) &amp; Quick Presets</th>
                            <th scope="col" class="py-3 px-3.5 text-center">Weighted (${colLetter}*${formatUnits(sub.units)})</th>
                            <th scope="col" class="py-3 px-3.5 text-center">Academic Status</th>
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
        if (meetsHonorAveragePolicy(g)) {
            const roundText = g < 90 ? ` (Rounds to 90)` : '';
            return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>Passed &bull; 90+ Honor${roundText} (${g.toFixed(0)})</span></span>`;
        }
        if (g >= GRADING_POLICY.honorSubjectFloor) {
            return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>Passed &ge; 85 (${g.toFixed(0)})</span></span>`;
        }
        if (g >= GRADING_POLICY.passingGrade) {
            return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9888;</span><span>Passed &bull; Below 85 (${g.toFixed(0)})</span></span>`;
        }
        return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]"><span>&#10005;</span><span>Failed (&lt; ${GRADING_POLICY.passingGrade})</span></span>`;
    }

    function renderMasterSectionGradeSheet(container, section, standings, subjectLocksMap = {}, enforceLocks = false) {
        const subjects = section.assigned_subjects || [];
        const rankByStudentId = {};
        standings.rankedRows.forEach(r => {
            rankByStudentId[r.student.id] = r.rank;
        });

        const subjectHeadersHtml = subjects.map((sub, idx) => {
            const col = excelColLetter(idx);
            return `
                <th scope="col" id="subHeader_${idx}" class="py-2.5 px-2 text-center min-w-[96px] sm:min-w-[108px] border-l border-[#D8DEE8] transition-colors">
                    <button type="button" onclick="App.setGradingSubjectTab('${sub.subject_id}')" class="w-full text-center group cursor-pointer" title="Click to focus only on ${escapeHtml(sub.subject_code)} (${escapeHtml(sub.subject_name)})">
                        <div class="text-xs font-mono font-bold text-[#5276A7] group-hover:underline">${col}21*${formatUnits(sub.units)}</div>
                        <div class="text-xs font-bold text-[#17243A] truncate">${escapeHtml(sub.subject_code)}</div>
                        <div class="text-xs font-medium text-[#0F766E]">${formatUnits(sub.units)}u</div>
                    </button>
                </th>
            `;
        }).join('');

        const femaleCount = standings.rows.filter(r => normalizeGenderClient(r.student.gender) === 'Female').length;
        const maleCount = standings.rows.filter(r => normalizeGenderClient(r.student.gender) === 'Male').length;
        const totalColsCount = subjects.length + 6;
        let lastGenderGroup = null;
        const bodyRowsChunks = [];

        standings.rows.forEach((row, rIdx) => {
            const st = row.student;
            const gNorm = normalizeGenderClient(st.gender);
            if (gNorm !== lastGenderGroup) {
                lastGenderGroup = gNorm;
                bodyRowsChunks.push(
                    genderSectionHeaderRowHtml(
                        gNorm,
                        gNorm === 'Female' ? femaleCount : maleCount,
                        totalColsCount,
                        `${section.section_name} (${section.year_level}) • ${state.gradingQuarter}`
                    )
                );
            }

            const rank = rankByStudentId[st.id];
            const inputsHtml = row.subjectResults.map((sr, cIdx) => {
                const val = sr.grade !== null ? sr.grade : '';
                const evalInfo = evaluateGradePolicy(sr.grade);
                const isSubLocked = enforceLocks && Boolean(subjectLocksMap[sr.subject_id]);
                return `
                    <td class="py-2 px-1.5 text-center border-l border-[#D8DEE8]/50">
                        <input type="number" step="0.01" min="50" max="100"
                            id="cell_${st.id}_${sr.subject_id}"
                            data-grade-input="true"
                            data-row-idx="${rIdx}"
                            data-col-idx="${cIdx}"
                            data-student-id="${st.id}"
                            data-student-name="${escapeHtml(st.full_name)}"
                            data-student-no="${escapeHtml(st.student_no)}"
                            data-student-gender="${escapeHtml(st.gender)}"
                            data-section-id="${section.id}"
                            data-subject-id="${sr.subject_id}"
                            data-subject-code="${escapeHtml(subjects[cIdx]?.subject_code || '')}"
                            data-subject-name="${escapeHtml(subjects[cIdx]?.subject_name || '')}"
                            data-quarter="${state.gradingQuarter}"
                            data-units="${sr.units}"
                            value="${val !== '' ? Number(val) : ''}"
                            placeholder="—"
                            ${isSubLocked ? 'disabled readonly' : ''}
                            onfocus="App.onGradeCellFocus(this)"
                            onblur="App.onGradeCellBlur(this)"
                            onkeydown="App.onGradeCellKeyDown(event, this)"
                            oninput="App.onMasterSheetCellInput(${st.id}, ${section.id})"
                            class="w-full min-w-[76px] max-w-[96px] px-2.5 py-1.5 text-center font-bold text-sm rounded-xl border ${evalInfo.inputClass} ${isSubLocked ? 'bg-slate-100 opacity-80 cursor-not-allowed text-[#475569]' : 'focus:border-[#17243A] focus:ring-2 focus:ring-[#5276A7]/25 outline-none'}">
                    </td>
                `;
            }).join('');

            const avgText = row.weightedAverage !== null ? row.weightedAverage.toFixed(2) : '—';
            let qualBadge = '';
            if (row.isFailingOverall) {
                qualBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]"><span>&#10005;</span><span>${escapeHtml(row.statusReason)}</span></span>`;
            } else if (row.isQualified) {
                const roundText = (row.weightedAverage !== null && row.weightedAverage < 90) ? ' (Rounds to 90)' : '';
                qualBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>QUALIFIED (≥90${roundText} &amp; No &lt;85)</span></span>`;
            } else if (row.hasBelow85) {
                qualBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9888;</span><span>${escapeHtml(row.statusReason)}</span></span>`;
            } else if (row.isPassingOverall) {
                qualBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>${escapeHtml(row.statusReason)}</span></span>`;
            } else {
                qualBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9203;</span><span>${escapeHtml(row.statusReason)}</span></span>`;
            }

            const avgColor = row.weightedAverage === null
                ? 'text-[#475569]'
                : row.isFailingOverall
                    ? 'text-[#842D60]'
                    : meetsHonorAveragePolicy(row.weightedAverage)
                        ? 'text-[#0F766E]'
                        : 'text-[#17243A]';

            bodyRowsChunks.push(`
                <tr class="hover:bg-[#F5F7FA] transition text-sm" id="masterRow_${st.id}" data-excel-row="${row.excel_row}">
                    <td class="py-2.5 px-3 font-mono text-xs text-[#475569] whitespace-nowrap">#${row.excel_row}</td>
                    <td class="py-2.5 px-4 whitespace-nowrap sticky left-0 bg-white/95 backdrop-blur-xs z-10 border-r border-[#D8DEE8]">
                        <div class="flex items-center gap-2">
                            <span class="font-semibold text-[#17243A] text-sm">${escapeHtml(st.full_name)}</span>
                            ${genderBadgeHtml(st.gender, true)}
                        </div>
                        <div class="font-mono text-xs text-[#475569]">${escapeHtml(st.student_no)}</div>
                    </td>
                    ${inputsHtml}
                    <td class="py-2.5 px-3 text-center font-mono text-xs text-[#475569] border-l border-[#D8DEE8] whitespace-nowrap" id="masterSum_${st.id}">
                        ${row.gradedCount > 0 ? `${row.weightedSum.toFixed(1)} / ${formatUnits(row.isComplete ? row.totalSectionUnits : row.gradedUnits)}` : '—'}
                    </td>
                    <td class="py-2.5 px-3 text-center border-l border-[#D8DEE8] whitespace-nowrap" id="masterAvg_${st.id}">
                        <span class="font-display font-bold text-sm ${avgColor}">
                            ${avgText}
                        </span>
                    </td>
                    <td class="py-2.5 px-3 text-center border-l border-[#D8DEE8] whitespace-nowrap" id="masterRank_${st.id}">
                        ${rank ? `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${rank === 1 ? 'bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]' : 'bg-[#F5F7FA] text-[#17243A] border border-[#D8DEE8]'}">${rank}</span>` : '—'}
                    </td>
                    <td class="py-2.5 px-4 text-left border-l border-[#D8DEE8] whitespace-nowrap" id="masterQual_${st.id}">
                        ${qualBadge}
                    </td>
                </tr>
            `);
        });

        const bodyRowsHtml = bodyRowsChunks.join('');

        container.innerHTML = `
            <div class="px-4 py-3 bg-[#F5F7FA] border-b border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div class="flex items-center gap-2">
                    <h3 class="font-display font-bold text-[#17243A] text-sm sm:text-base">
                        Master Grade Sheet — ${escapeHtml(section.section_name)} (${escapeHtml(section.year_level)}) &bull; ${escapeHtml(state.gradingQuarter)}
                    </h3>
                    <span class="text-xs text-[#475569] hidden sm:inline">
                        &bull; Click any subject column header to switch to single-subject focus mode
                    </span>
                </div>
                <span class="text-xs sm:text-sm text-[#475569]">Divisor: <strong class="text-[#17243A]">${formatUnits(section.total_units)} Total Units</strong></span>
            </div>
            <div class="flex-1 overflow-auto custom-scrollbar">
                <table class="w-full text-left border-collapse" aria-label="Student Grade Table">
                    <thead class="sticky top-0 z-20">
                        <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#475569]">
                            <th scope="col" class="py-2.5 px-2.5">Row</th>
                            <th scope="col" class="py-2.5 px-3.5 min-w-[180px] sticky left-0 bg-[#F5F7FA] z-20 border-r border-[#D8DEE8]">Student</th>
                            ${subjectHeadersHtml}
                            <th scope="col" class="py-2.5 px-2.5 text-center border-l border-[#D8DEE8]">Sum / Units</th>
                            <th scope="col" class="py-2.5 px-2.5 text-center border-l border-[#D8DEE8]">Weighted Avg</th>
                            <th scope="col" class="py-2.5 px-2.5 text-center border-l border-[#D8DEE8]">Rank</th>
                            <th scope="col" class="py-2.5 px-3.5 border-l border-[#D8DEE8]">Status &amp; Honor Pullout Check</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#D8DEE8]/60 text-sm">
                        ${bodyRowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }

    function updateMissingGradesCounter() {
        const inputs = Array.from(document.querySelectorAll('#gradingSheetContainer input[data-grade-input="true"]'));
        const emptyCount = inputs.filter(inp => inp.value.trim() === '').length;
        const totalCount = inputs.length;

        const countBadge = document.getElementById('gradingMissingCountBadge');
        const pillBadge = document.getElementById('activeGuideMissingPill');

        if (countBadge) {
            countBadge.textContent = emptyCount;
            if (emptyCount === 0 && totalCount > 0) {
                countBadge.className = 'px-1.5 py-0.2 rounded-full text-[10px] bg-[#0F766E] text-white font-mono';
                countBadge.innerHTML = '&#10003; 0';
            } else {
                countBadge.className = 'px-1.5 py-0.2 rounded-full text-[10px] bg-black/25 text-white font-mono';
            }
        }
        if (pillBadge) {
            pillBadge.textContent = emptyCount;
        }
        return emptyCount;
    }

    function jumpToNextEmptyGradeCell() {
        const inputs = Array.from(document.querySelectorAll('#gradingSheetContainer input[data-grade-input="true"]:not([disabled])'));
        if (inputs.length === 0) {
            showToast('No editable grade cells available.', 'info');
            return;
        }

        const activeEl = document.activeElement;
        const activeIdx = inputs.indexOf(activeEl);

        let nextEmpty = null;
        for (let i = activeIdx + 1; i < inputs.length; i++) {
            if (inputs[i].value.trim() === '') {
                nextEmpty = inputs[i];
                break;
            }
        }
        if (!nextEmpty) {
            for (let i = 0; i <= activeIdx; i++) {
                if (inputs[i].value.trim() === '') {
                    nextEmpty = inputs[i];
                    break;
                }
            }
        }

        if (nextEmpty) {
            nextEmpty.focus();
            setTimeout(() => {
                try {
                    nextEmpty.select();
                    nextEmpty.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } catch (e) {}
            }, 10);
            const stName = nextEmpty.getAttribute('data-student-name') || 'Student';
            showToast(`Jumped to missing grade for ${stName}`, 'info');
        } else {
            showToast('All visible grade cells are complete! 🎉', 'success');
        }
    }

    async function applyPresetToActiveCell(gradeVal) {
        let activeEl = document.activeElement;
        if (!activeEl || !activeEl.matches('#gradingSheetContainer input[data-grade-input="true"]:not([disabled])')) {
            activeEl = document.querySelector('#gradingSheetContainer input[data-grade-input="true"]:not([disabled])');
        }
        if (!activeEl) {
            showToast('No active editable grade cell to fill.', 'info');
            return;
        }

        activeEl.value = gradeVal;
        const rIdx = Number(activeEl.getAttribute('data-row-idx'));
        const cIdx = Number(activeEl.getAttribute('data-col-idx'));
        const isMaster = state.gradingSubjectId === 'ALL';

        if (isMaster) {
            const stId = Number(activeEl.getAttribute('data-student-id'));
            const secId = Number(activeEl.getAttribute('data-section-id'));
            onMasterSheetCellInput(stId, secId);
        } else {
            onLiveGradeCellInput(activeEl);
        }

        await onGradeCellBlur(activeEl);

        // Advance focus down to next student in column
        const next = document.querySelector(
            `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx + 1}"][data-col-idx="${cIdx}"]`
        );
        if (next) {
            next.focus();
            setTimeout(() => {
                try { next.select(); } catch(e){}
            }, 10);
        }
    }

    function toggleGradingFormulaView() {
        const accordion = document.getElementById('gradingFormulaAccordion');
        const toggleText = document.getElementById('gradingFormulaToggleText');
        if (!accordion) return;
        const isHidden = accordion.classList.contains('hidden');
        if (isHidden) {
            accordion.classList.remove('hidden');
            if (toggleText) toggleText.textContent = 'Hide fx';
        } else {
            accordion.classList.add('hidden');
            if (toggleText) toggleText.textContent = 'Formula';
        }
    }

    function resetActiveStudentHUD() {
        const avatarEl = document.getElementById('activeGuideAvatar');
        const nameEl = document.getElementById('activeGuideStudentName');
        const metaEl = document.getElementById('activeGuideStudentMeta');
        const subBadgeEl = document.getElementById('activeGuideSubjectBadge');
        const gradeStatusEl = document.getElementById('activeGuideGradeStatus');
        const standingEl = document.getElementById('activeGuideStanding');

        if (avatarEl) {
            avatarEl.innerHTML = `<svg class="w-5 h-5 text-[#B8CCE6]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`;
        }
        if (nameEl) nameEl.textContent = 'Fast Grade Entry Assistant';
        if (metaEl) metaEl.textContent = 'Click any cell or press Enter to begin';
        if (subBadgeEl) subBadgeEl.classList.add('hidden');
        if (gradeStatusEl) {
            gradeStatusEl.innerHTML = `<span>⌨️ Navigation: <kbd class="px-1.5 py-0.5 rounded bg-black/30 font-mono text-white text-[11px]">Enter</kbd> Down &bull; <kbd class="px-1.5 py-0.5 rounded bg-black/30 font-mono text-white text-[11px]">Tab</kbd> Next Subj</span>`;
        }
        if (standingEl) standingEl.textContent = 'Weighted averages calculate live';
    }

    function updateActiveStudentHUD(inputEl) {
        if (!inputEl) return;
        const stId = Number(inputEl.getAttribute('data-student-id'));
        const secId = Number(inputEl.getAttribute('data-section-id'));
        const stName = inputEl.getAttribute('data-student-name') || '';
        const stNo = inputEl.getAttribute('data-student-no') || '';
        const stGender = inputEl.getAttribute('data-student-gender') || '';
        const subCode = inputEl.getAttribute('data-subject-code') || '';
        const subName = inputEl.getAttribute('data-subject-name') || '';
        const units = inputEl.getAttribute('data-units') || '';

        // Avatar Initials
        const avatarEl = document.getElementById('activeGuideAvatar');
        if (avatarEl) {
            const initials = stName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'ST';
            avatarEl.textContent = initials;
        }

        // Student Name
        const nameEl = document.getElementById('activeGuideStudentName');
        if (nameEl) {
            nameEl.textContent = stName || 'Active Student';
        }

        // Student Meta
        const metaEl = document.getElementById('activeGuideStudentMeta');
        if (metaEl) {
            metaEl.innerHTML = `${escapeHtml(stNo)} &bull; ${genderBadgeHtml(stGender, true)}`;
        }

        // Subject Badge
        const subBadgeEl = document.getElementById('activeGuideSubjectBadge');
        if (subBadgeEl) {
            subBadgeEl.classList.remove('hidden');
            subBadgeEl.textContent = `${subCode} (${formatUnits(units)}u)`;
            subBadgeEl.title = subName;
        }

        // Grade status
        const val = inputEl.value.trim();
        const gradeStatusEl = document.getElementById('activeGuideGradeStatus');
        if (gradeStatusEl) {
            if (val === '' || isNaN(Number(val))) {
                gradeStatusEl.innerHTML = `<span class="inline-flex items-center gap-1 text-[#FFF0D1] font-bold"><span class="animate-pulse">⚡</span><span>Awaiting Grade (50-100)</span></span>`;
            } else {
                const g = Number(val);
                if (g < GRADING_POLICY.passingGrade) {
                    gradeStatusEl.innerHTML = `<span class="inline-flex items-center gap-1 text-[#F5DFEB] font-bold"><span>&#10005;</span><span>Failing Grade (${g})</span></span>`;
                } else if (g < GRADING_POLICY.honorSubjectFloor) {
                    gradeStatusEl.innerHTML = `<span class="inline-flex items-center gap-1 text-[#FFF0D1] font-bold"><span>&#9888;</span><span>Passed &bull; Below 85 Floor (${g})</span></span>`;
                } else if (meetsHonorAveragePolicy(g)) {
                    gradeStatusEl.innerHTML = `<span class="inline-flex items-center gap-1 text-[#D5F0EA] font-bold"><span>★</span><span>Passed &bull; Honor Tier (${g})</span></span>`;
                } else {
                    gradeStatusEl.innerHTML = `<span class="inline-flex items-center gap-1 text-[#D5F0EA] font-bold"><span>&#10003;</span><span>Passed (${g})</span></span>`;
                }
            }
        }

        // Standing & Average
        const standingEl = document.getElementById('activeGuideStanding');
        if (standingEl) {
            const standings = computeSectionStandings(secId, state.gradingQuarter);
            const row = standings?.rows.find(r => r.student.id === stId);
            if (row && row.weightedAverage !== null) {
                const avgText = row.weightedAverage.toFixed(2);
                const honorLabel = row.isQualified ? '★ Qualified for Honors' : (row.isFailingOverall ? 'Failing' : 'Passed');
                standingEl.innerHTML = `Qtr Avg: <strong class="text-white">${avgText}</strong> (${honorLabel})`;
            } else {
                standingEl.textContent = 'Auto-saves on Enter or Tab';
            }
        }

        updateActiveStudentFormulaBar(stId, secId);
        updateMissingGradesCounter();
    }

    function onGradeCellKeyDown(event, inputEl) {
        const key = event.key;
        const rIdx = Number(inputEl.getAttribute('data-row-idx'));
        const cIdx = Number(inputEl.getAttribute('data-col-idx'));
        const isMaster = state.gradingSubjectId === 'ALL';

        // Shortcut: Alt+N or Ctrl+Enter jumps to next missing grade
        if ((event.altKey && (key === 'n' || key === 'N')) || (event.ctrlKey && key === 'Enter')) {
            event.preventDefault();
            jumpToNextEmptyGradeCell();
            return;
        }

        // Stepper: + or = increments grade by 1; - decrements by 1
        if (key === '+' || key === '=') {
            event.preventDefault();
            let cur = Number(inputEl.value) || 75;
            cur = Math.min(100, Math.round(cur + 1));
            inputEl.value = cur;
            if (isMaster) {
                onMasterSheetCellInput(Number(inputEl.getAttribute('data-student-id')), Number(inputEl.getAttribute('data-section-id')));
            } else {
                onLiveGradeCellInput(inputEl);
            }
            updateActiveStudentHUD(inputEl);
            return;
        }
        if (key === '-' && inputEl.value.trim() !== '') {
            event.preventDefault();
            let cur = Number(inputEl.value) || 75;
            cur = Math.max(50, Math.round(cur - 1));
            inputEl.value = cur;
            if (isMaster) {
                onMasterSheetCellInput(Number(inputEl.getAttribute('data-student-id')), Number(inputEl.getAttribute('data-section-id')));
            } else {
                onLiveGradeCellInput(inputEl);
            }
            updateActiveStudentHUD(inputEl);
            return;
        }

        // Enter: Move Down vertically (or wrap to next column top if at bottom of column in Master Sheet)
        if (key === 'Enter') {
            event.preventDefault();
            if (event.shiftKey) {
                // Move Up
                const prev = document.querySelector(
                    `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx - 1}"][data-col-idx="${cIdx}"]`
                );
                if (prev) {
                    prev.focus();
                    setTimeout(() => {
                        try { prev.select(); } catch(e){}
                    }, 10);
                }
            } else {
                // Move Down
                const next = document.querySelector(
                    `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx + 1}"][data-col-idx="${cIdx}"]`
                );
                if (next) {
                    next.focus();
                    setTimeout(() => {
                        try { next.select(); } catch(e){}
                    }, 10);
                } else if (isMaster) {
                    // Wrap to row 0 of next column
                    const nextColTop = document.querySelector(
                        `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="0"][data-col-idx="${cIdx + 1}"]`
                    );
                    if (nextColTop) {
                        nextColTop.focus();
                        setTimeout(() => {
                            try { nextColTop.select(); } catch(e){}
                        }, 10);
                    }
                }
            }
            return;
        }

        // Tab: Move Horizontally across subjects (or wrap across rows)
        if (key === 'Tab') {
            event.preventDefault();
            if (event.shiftKey) {
                // Move Left
                if (isMaster) {
                    const left = document.querySelector(
                        `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx}"][data-col-idx="${cIdx - 1}"]`
                    );
                    if (left) {
                        left.focus();
                        setTimeout(() => {
                            try { left.select(); } catch(e){}
                        }, 10);
                    } else {
                        // Wrap to previous row last column
                        const prevRowInputs = Array.from(document.querySelectorAll(
                            `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx - 1}"]`
                        ));
                        if (prevRowInputs.length > 0) {
                            const lastOfPrev = prevRowInputs[prevRowInputs.length - 1];
                            lastOfPrev.focus();
                            setTimeout(() => {
                                try { lastOfPrev.select(); } catch(e){}
                            }, 10);
                        }
                    }
                } else {
                    const prev = document.querySelector(
                        `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx - 1}"][data-col-idx="${cIdx}"]`
                    );
                    if (prev) {
                        prev.focus();
                        setTimeout(() => {
                            try { prev.select(); } catch(e){}
                        }, 10);
                    }
                }
            } else {
                // Move Right
                if (isMaster) {
                    const right = document.querySelector(
                        `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx}"][data-col-idx="${cIdx + 1}"]`
                    );
                    if (right) {
                        right.focus();
                        setTimeout(() => {
                            try { right.select(); } catch(e){}
                        }, 10);
                    } else {
                        // Wrap to next row column 0
                        const nextRowFirst = document.querySelector(
                            `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx + 1}"][data-col-idx="0"]`
                        );
                        if (nextRowFirst) {
                            nextRowFirst.focus();
                            setTimeout(() => {
                                try { nextRowFirst.select(); } catch(e){}
                            }, 10);
                        }
                    }
                } else {
                    const next = document.querySelector(
                        `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx + 1}"][data-col-idx="${cIdx}"]`
                    );
                    if (next) {
                        next.focus();
                        setTimeout(() => {
                            try { next.select(); } catch(e){}
                        }, 10);
                    }
                }
            }
            return;
        }

        // Arrow navigation
        if (key === 'ArrowDown') {
            event.preventDefault();
            const next = document.querySelector(
                `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx + 1}"][data-col-idx="${cIdx}"]`
            );
            if (next) {
                next.focus();
                setTimeout(() => {
                    try { next.select(); } catch(e){}
                }, 10);
            }
        } else if (key === 'ArrowUp') {
            event.preventDefault();
            const prev = document.querySelector(
                `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx - 1}"][data-col-idx="${cIdx}"]`
            );
            if (prev) {
                prev.focus();
                setTimeout(() => {
                    try { prev.select(); } catch(e){}
                }, 10);
            }
        } else if (key === 'ArrowRight' && isMaster) {
            const len = inputEl.value.length;
            if (inputEl.selectionStart === len || inputEl.selectionEnd - inputEl.selectionStart === len) {
                const right = document.querySelector(
                    `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx}"][data-col-idx="${cIdx + 1}"]`
                );
                if (right) {
                    event.preventDefault();
                    right.focus();
                    setTimeout(() => {
                        try { right.select(); } catch(e){}
                    }, 10);
                }
            }
        } else if (key === 'ArrowLeft' && isMaster) {
            const len = inputEl.value.length;
            if (inputEl.selectionStart === 0 || inputEl.selectionEnd - inputEl.selectionStart === len) {
                const left = document.querySelector(
                    `#gradingSheetContainer input[data-grade-input="true"][data-row-idx="${rIdx}"][data-col-idx="${cIdx - 1}"]`
                );
                if (left) {
                    event.preventDefault();
                    left.focus();
                    setTimeout(() => {
                        try { left.select(); } catch(e){}
                    }, 10);
                }
            }
        }
    }

    function onGradeCellFocus(inputEl) {
        // Immediate selection across all browsers
        setTimeout(() => {
            try { inputEl.select(); } catch(e){}
        }, 0);

        // Highlight active student row
        document.querySelectorAll('#gradingSheetContainer tr.active-grade-row').forEach(tr => {
            tr.classList.remove('active-grade-row');
        });
        const tr = inputEl.closest('tr');
        if (tr) tr.classList.add('active-grade-row');

        // In Master Sheet mode, highlight corresponding column header
        document.querySelectorAll('#gradingSheetContainer th.active-grade-col-header').forEach(th => {
            th.classList.remove('active-grade-col-header');
        });
        const cIdx = inputEl.getAttribute('data-col-idx');
        if (cIdx !== null && cIdx !== undefined) {
            const th = document.getElementById(`subHeader_${cIdx}`);
            if (th) th.classList.add('active-grade-col-header');
        }

        updateActiveStudentHUD(inputEl);
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

            // Visual micro-flash indicating success
            inputEl.classList.add('cell-saved-flash');
            setTimeout(() => inputEl.classList.remove('cell-saved-flash'), 500);
            updateMissingGradesCounter();
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
            'border-[#9B3F72]', 'bg-[#F5DFEB]/60', 'text-[#842D60]',
            'border-[#99D8CC]', 'bg-[#D5F0EA]/60', 'text-[#0F766E]',
            'border-[#C5D5EA]', 'bg-[#EBF1F8]/60', 'text-[#2C4870]',
            'font-bold', 'font-semibold'
        );
        const evalInfo = evaluateGradePolicy(num);
        evalInfo.inputClass.split(' ').filter(Boolean).forEach(cls => inputEl.classList.add(cls));
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
        updateActiveStudentHUD(inputEl);
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
                ? 'text-[#475569]'
                : isFailingOverall
                    ? 'text-[#842D60]'
                    : meetsHonorAveragePolicy(avg)
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
            } else if (!hasBelow85 && meetsHonorAveragePolicy(avg)) {
                const roundText = (avg !== null && avg < 90) ? ' (Rounds to 90)' : '';
                qualCell.innerHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>QUALIFIED (≥90${roundText} &amp; No &lt;85)</span></span>`;
            } else if (hasBelow85) {
                qualCell.innerHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF0D1] text-[#80530F] border border-[#F0D296]"><span>&#9888;</span><span>Passed · Below 85: ${escapeHtml(below85Codes.join(', '))}</span></span>`;
            } else {
                qualCell.innerHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>&#10003;</span><span>Passed · Avg ${avg.toFixed(2)} (&lt;89.5)</span></span>`;
            }
        }

        const focusedInput = document.activeElement?.matches?.('input[data-grade-input="true"]') ? document.activeElement : null;
        if (focusedInput && Number(focusedInput.getAttribute('data-student-id')) === studentId) {
            updateActiveStudentHUD(focusedInput);
        } else {
            updateActiveStudentFormulaBar(studentId, sectionId);
            updateMissingGradesCounter();
        }
    }

    async function saveCurrentGradesSheet() {
        const isAdmin = state.currentUser?.role === 'admin';
        const inputs = Array.from(document.querySelectorAll('#gradingSheetContainer input[data-grade-input="true"]:not([disabled])'));
        if (inputs.length === 0) {
            showToast('All inputs are locked or read-only. Submit an unlock request if you need to rewrite grades.', 'info');
            return;
        }
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
        switchView('reports', false);
        updateBrowserUrl({
            page: 'reports',
            section_id: state.reportSectionId,
            quarter: state.reportQuarter
        });
        renderReportsView();
    }

    function openGradingForReportSection() {
        if (state.reportSectionId) {
            state.gradingSectionId = state.reportSectionId;
            if (state.reportQuarter !== 'FINAL') {
                state.gradingQuarter = state.reportQuarter;
            }
        }
        openSectionGrading(state.gradingSectionId, 'ALL', state.gradingQuarter);
    }

    function getHonorDistinction(avg) {
        if (avg === null || avg === undefined || isNaN(Number(avg))) return '';
        const n = Number(avg);
        if (n >= 97.995) return 'With Highest Honors';
        if (n >= 94.995) return 'With High Honors';
        if (n >= 89.495) return 'With Honors';
        return '';
    }

    function printInstitutionalHeaderHtml(title, subtitle, section, quarterTitle) {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        return `
            <div class="hidden print-only-block mb-3 pb-3 border-b-2 border-slate-900 text-slate-900">
                <div class="text-center">
                    <p class="text-[9pt] uppercase tracking-widest font-semibold text-slate-600">Republic of the Philippines &bull; Department of Education</p>
                    <h2 class="text-[13pt] font-black uppercase tracking-wider text-slate-900 font-display">GradeFlow Academic Management System</h2>
                    <p class="text-[10pt] font-bold text-[#17243A] uppercase mt-0.5">${title}</p>
                    <p class="text-[8pt] text-slate-600 italic mt-0.5">${subtitle}</p>
                </div>
                <div class="flex items-center justify-between text-[8pt] pt-2 border-t border-slate-300 mt-2 font-mono">
                    <span><strong>Section:</strong> ${escapeHtml(section.section_name)} (${escapeHtml(section.year_level)})</span>
                    <span><strong>Evaluation Period:</strong> ${escapeHtml(quarterTitle)}</span>
                    <span><strong>Class Adviser:</strong> ${escapeHtml(section.adviser || 'Unassigned')}</span>
                    <span><strong>Date Printed:</strong> ${currentDate}</span>
                </div>
            </div>
        `;
    }

    function printSignatoriesHtml(adviserName = '') {
        return `
            <div class="hidden print-only-block print-signatories pt-5 text-slate-900">
                <div class="grid grid-cols-3 gap-6 text-center text-[8.5pt]">
                    <div>
                        <p class="text-slate-600 mb-8">Prepared by:</p>
                        <p class="font-bold border-b border-slate-900 pb-1 uppercase">${escapeHtml(adviserName || 'Class Adviser')}</p>
                        <p class="text-slate-600 text-[7.5pt] mt-0.5">Class Adviser</p>
                    </div>
                    <div>
                        <p class="text-slate-600 mb-8">Verified &amp; Audited by:</p>
                        <p class="font-bold border-b border-slate-900 pb-1 uppercase">Academic Coordinator</p>
                        <p class="text-slate-600 text-[7.5pt] mt-0.5">Curriculum &amp; Instruction</p>
                    </div>
                    <div>
                        <p class="text-slate-600 mb-8">Approved by:</p>
                        <p class="font-bold border-b border-slate-900 pb-1 uppercase">School Principal</p>
                        <p class="text-slate-600 text-[7.5pt] mt-0.5">Head of Academic Affairs</p>
                    </div>
                </div>
            </div>
        `;
    }

    function printReport(target = 'all') {
        document.body.setAttribute('data-print-target', target);
        window.print();
        setTimeout(() => {
            document.body.removeAttribute('data-print-target');
        }, 1200);
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
                    <p class="text-sm text-[#475569] mt-1">Load the 28-unit sample curriculum and grades to see automated section rankings and the Honor Qualifier pullout.</p>
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
                    <table class="w-full text-left border-collapse text-sm print-table">
                        <thead>
                            <tr class="bg-[#D5F0EA]/60 border-b border-[#99D8CC] text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                                <th scope="col" class="py-2.5 px-3 text-center">Rank</th>
                                <th scope="col" class="py-2.5 px-3">Student ID</th>
                                <th scope="col" class="py-2.5 px-3.5">Student Name</th>
                                <th scope="col" class="py-2.5 px-3 text-center">Honor Distinction</th>
                                <th scope="col" class="py-2.5 px-3">Subject Grades (All &ge; 85)</th>
                                <th scope="col" class="py-2.5 px-3 text-center">Lowest Grade</th>
                                <th scope="col" class="py-2.5 px-3 text-center">General Average</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#D8DEE8]/70 text-sm bg-white">
                            ${standings.qualifiers.map(q => {
                                const distinction = getHonorDistinction(q.weightedAverage);
                                return `
                                <tr class="hover:bg-[#D5F0EA]/25 transition">
                                    <td class="py-2.5 px-3 whitespace-nowrap text-center">
                                        <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#17243A] text-white shadow-2xs">
                                            Rank #${q.rank}
                                        </span>
                                    </td>
                                    <td class="py-2.5 px-3 font-mono text-xs font-semibold text-[#475569] whitespace-nowrap">
                                        ${escapeHtml(q.student.student_no)}
                                    </td>
                                    <td class="py-2.5 px-3.5 font-display font-bold text-[#17243A] whitespace-nowrap">
                                        <div class="flex items-center gap-2">
                                            <span>${escapeHtml(q.student.full_name)}</span>
                                            ${genderBadgeHtml(q.student.gender, true)}
                                        </div>
                                    </td>
                                    <td class="py-2.5 px-3 text-center whitespace-nowrap">
                                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                                            🎖️ ${escapeHtml(distinction || 'With Honors')}
                                        </span>
                                    </td>
                                    <td class="py-2.5 px-3">
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
                                    <td class="py-2.5 px-3 text-center whitespace-nowrap">
                                        <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                                            &#10003; ${q.minGrade !== null ? q.minGrade.toFixed(0) : '—'} (${escapeHtml(q.minGradeSubject || '')}) &ge; 85
                                        </span>
                                    </td>
                                    <td class="py-2.5 px-3 text-center whitespace-nowrap">
                                        <div class="inline-flex flex-col items-center">
                                            <span class="font-display font-extrabold text-sm text-[#0F766E] bg-[#D5F0EA] px-3 py-1 rounded-xl border border-[#99D8CC]">
                                                ${q.weightedAverage.toFixed(2)}${q.weightedAverage < 90 ? ` &rarr; ${Math.round(q.weightedAverage)}` : ''}
                                            </span>
                                            ${q.weightedAverage < 90 ? `<span class="text-xs font-bold text-[#0F766E] mt-0.5">Rounds to 90</span>` : ''}
                                        </div>
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `
            : `
                <div class="p-6 text-center bg-white">
                    <p class="text-sm font-semibold text-[#17243A]">No students currently meet both qualification criteria for ${escapeHtml(quarterTitle)}</p>
                    <p class="text-xs text-[#475569] mt-1">To be pulled out here, a student must have complete grades in all assigned subjects, <strong>no subject grade below 85</strong>, and a <strong>weighted average of 89.50 or above (which rounds to 90)</strong>.</p>
                </div>
            `;

        const subjectColsHeader = standings.subjects.map(sub => {
            const idx = standings.subjects.indexOf(sub);
            const col = excelColLetter(idx);
            return `
                <th scope="col" class="py-2.5 px-2 text-center border-l border-[#D8DEE8]">
                    <div class="text-xs font-mono font-bold text-[#5276A7]">${col}*${formatUnits(sub.units)}</div>
                    <div class="text-xs font-bold text-[#17243A]">${escapeHtml(sub.subject_code)}</div>
                    <div class="text-xs text-[#475569]">${formatUnits(sub.units)}u</div>
                </th>
            `;
        }).join('');

        const renderReportRankingRow = r => {
                const subCells = r.subjectResults.map(sr => {
                    if (sr.grade === null) {
                        return `<td class="py-2 px-2 text-center text-xs text-[#475569] border-l border-[#D8DEE8]/50">—</td>`;
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
                            <div class="text-xs font-mono text-[#475569]">
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
                    const roundNote = r.weightedAverage < 90 ? ' (Rounds to 90)' : '';
                    badgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                        <span>&#10003;</span>
                        <span>Passed &bull; Honor Pulled Out (Avg &ge; 90${roundNote} &amp; No &lt; 85)</span>
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
                    ? 'text-[#475569]'
                    : r.minGrade < GRADING_POLICY.passingGrade
                        ? 'text-[#842D60] font-bold'
                        : r.minGrade < GRADING_POLICY.honorSubjectFloor
                            ? 'text-[#80530F] font-bold'
                            : 'text-[#17243A]';

                const avgColor = r.weightedAverage === null
                    ? 'text-[#475569]'
                    : r.isFailingOverall
                        ? 'text-[#842D60]'
                        : meetsHonorAveragePolicy(r.weightedAverage)
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
                            <div class="flex items-center gap-1.5">
                                <span class="font-semibold text-[#17243A] text-sm">${escapeHtml(r.student.full_name)}</span>
                                ${genderBadgeHtml(r.student.gender, true)}
                            </div>
                            <div class="font-mono text-xs text-[#475569]">${escapeHtml(r.student.student_no)} &bull; Row ${r.excel_row}</div>
                        </td>
                        ${subCells}
                        <td class="py-2 px-2.5 text-center font-mono text-xs text-[#475569] border-l border-[#D8DEE8]" title="${escapeHtml(studentExactFormula)}">
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
            };

        const fullRankingRowsHtml = (() => {
            if (standings.rankedRows.length === 0) {
                return `<tr><td colspan="${standings.subjects.length + 6}" class="py-10 text-center text-sm text-[#475569]">No students enrolled in this section yet.</td></tr>`;
            }
            const femaleRanked = standings.rankedRows.filter(r => normalizeGenderClient(r.student.gender) === 'Female');
            const maleRanked = standings.rankedRows.filter(r => normalizeGenderClient(r.student.gender) === 'Male');
            const totalReportCols = standings.subjects.length + 6;
            const reportChunks = [];

            if (femaleRanked.length > 0) {
                reportChunks.push(genderSectionHeaderRowHtml('Female', femaleRanked.length, totalReportCols, `${activeSection.section_name} • Ranked Female Students`));
                femaleRanked.forEach(r => reportChunks.push(renderReportRankingRow(r)));
            }
            if (maleRanked.length > 0) {
                reportChunks.push(genderSectionHeaderRowHtml('Male', maleRanked.length, totalReportCols, `${activeSection.section_name} • Ranked Male Students`));
                maleRanked.forEach(r => reportChunks.push(renderReportRankingRow(r)));
            }
            return reportChunks.join('');
        })();

        container.innerHTML = `
            <!-- Screen-Only Report Summary Header Card (Midnight Navy #17243A) -->
            <div class="bg-[#17243A] text-white rounded-2xl p-4 sm:p-5 shadow-sm shrink-0 no-print">
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

            <!-- PART 1: QUARTERLY HONOR ROLL & DISTINCTION ROSTER (Page 1) -->
            <div id="printHonorsSection" class="bg-white rounded-2xl border-2 border-[#0F766E] shadow-2xs overflow-hidden shrink-0">
                ${printInstitutionalHeaderHtml(
                    'Official Academic Honors &amp; Distinction Roster',
                    'Quarterly Academic Excellence Recognition &bull; Criteria: No Subject Grade Below 85 &bull; General Average &ge; 90.00 (or 89.50+ Rounded to 90)',
                    activeSection,
                    quarterTitle
                )}
                <div class="px-4 py-3 bg-[#0F766E] text-white flex flex-wrap items-center justify-between gap-2 no-print">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                            </svg>
                        </div>
                        <div>
                            <h4 class="font-display font-bold text-sm sm:text-base">
                                Quarterly Honor Pullout — Students with Average &ge; 90 (or 89.5+ Rounded to 90) &amp; No Grade Below 85
                            </h4>
                            <p class="text-xs text-[#D5F0EA]">
                                Automatically filtered from ${escapeHtml(activeSection.section_name)} (${escapeHtml(quarterTitle)}) where every subject &ge; 85 and Weighted Average &ge; 89.50 (rounds to 90)
                            </p>
                        </div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E]">
                        &#10003; ${standings.qualifiers.length} Qualified Student${standings.qualifiers.length === 1 ? '' : 's'}
                    </span>
                </div>
                ${pulloutHtml}
                ${printSignatoriesHtml(activeSection.adviser)}
            </div>

            <!-- CLEAN PAGE BREAK FOR PRINTING/PDF EXPORT -->
            <div class="print-page-break"></div>

            <!-- PART 2: COMPLETE SECTION QUARTERLY RANKING & COMPUTATION MASTER SHEET (Page 2+) -->
            <div id="printMasterGradesSection" class="bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
                ${printInstitutionalHeaderHtml(
                    'Master Quarterly Grade Sheet &amp; General Section Ranking',
                    `Official Section Records &bull; Weighted Formula: ${escapeHtml(standings.formulaString)}`,
                    activeSection,
                    quarterTitle
                )}
                <div class="px-4 py-3 bg-[#F5F7FA] border-b border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2 shrink-0 no-print">
                    <div>
                        <h4 class="font-display font-bold text-[#17243A] text-sm sm:text-base">
                            Complete Section Quarterly Computation &amp; Ranking (${escapeHtml(quarterTitle)})
                        </h4>
                        <p class="text-xs text-[#475569] mt-0.5">
                            Each cell shows the student's subject grade and its weighted points <code>(Grade * Units)</code>. Failing grades (&lt; ${GRADING_POLICY.passingGrade}) appear in Berry Plum; grades 75–84 appear in Antique Amber.
                        </p>
                    </div>
                </div>
                <div class="flex-1 overflow-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse print-table" aria-label="Quarterly Grade Sheet Table">
                        <thead class="sticky top-0 z-10">
                            <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#475569]">
                                <th scope="col" class="py-2.5 px-3 text-center">Rank</th>
                                <th scope="col" class="py-2.5 px-3.5 min-w-[180px]">Student Name</th>
                                ${subjectColsHeader}
                                <th scope="col" class="py-2.5 px-2.5 text-center border-l border-[#D8DEE8]">Sum / Units</th>
                                <th scope="col" class="py-2.5 px-2.5 text-center border-l border-[#D8DEE8]">Min Grade</th>
                                <th scope="col" class="py-2.5 px-3 text-center border-l border-[#D8DEE8]">Weighted Avg</th>
                                <th scope="col" class="py-2.5 px-3.5 border-l border-[#D8DEE8]">Status &amp; Pullout Check</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#D8DEE8]/60 text-sm">
                            ${fullRankingRowsHtml}
                        </tbody>
                    </table>
                </div>
                ${printSignatoriesHtml(activeSection.adviser)}
            </div>
        `;
    }

    function filterStudentsBySection(sectionId) {
        state.studentSectionId = sectionId ? String(sectionId) : '';
        state.studentCurrentPage = 1;
        switchView('students', false);
        const sectionSelect = document.getElementById('studentSectionFilter');
        if (sectionSelect) {
            sectionSelect.value = state.studentSectionId;
        }
        updateBrowserUrl({
            page: 'students',
            section_id: sectionId ? Number(sectionId) : null
        });
        renderStudentsView();
    }

    function resetStudentFilters() {
        const sInput = document.getElementById('studentSearchInput');
        if (sInput) sInput.value = '';
        const yFilter = document.getElementById('studentYearFilter');
        if (yFilter) yFilter.value = '';
        const secFilter = document.getElementById('studentSectionFilter');
        if (secFilter) secFilter.value = '';
        const gf = document.getElementById('studentGenderFilter');
        if (gf) gf.value = '';
        state.studentSectionId = '';
        state.studentGenderFilter = '';
        state.studentCurrentPage = 1;
        updateBrowserUrl({ page: 'students' }, true);
        renderStudentsView();
    }

    // ==================== ACCESSIBLE MODAL HELPERS (WCAG 2.1 AA) ====================
    let modalTriggerElement = null;
    const activeModalsStack = [];

    function getFocusableElements(container) {
        if (!container) return [];
        return Array.from(container.querySelectorAll(
            'button:not([disabled]):not([aria-hidden="true"]), [href]:not([aria-hidden="true"]), input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"]), select:not([disabled]):not([aria-hidden="true"]), textarea:not([disabled]):not([aria-hidden="true"]), [tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])'
        )).filter(el => el.offsetParent !== null && !el.closest('.hidden'));
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        if (activeModalsStack.length === 0) {
            modalTriggerElement = document.activeElement;
        }
        if (!activeModalsStack.includes(modalId)) {
            activeModalsStack.push(modalId);
        }

        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');

        requestAnimationFrame(() => {
            const focusables = getFocusableElements(modal);
            if (focusables.length > 0) {
                const firstInteractive = focusables.find(el => el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') || focusables[0];
                firstInteractive.focus();
            }
        });
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add('hidden');

        const idx = activeModalsStack.indexOf(modalId);
        if (idx !== -1) {
            activeModalsStack.splice(idx, 1);
        }

        if (activeModalsStack.length === 0) {
            document.body.classList.remove('overflow-hidden');
            if (modalTriggerElement && typeof modalTriggerElement.focus === 'function') {
                modalTriggerElement.focus();
                modalTriggerElement = null;
            }
        } else {
            const topModalId = activeModalsStack[activeModalsStack.length - 1];
            const topModal = document.getElementById(topModalId);
            if (topModal) {
                const focusables = getFocusableElements(topModal);
                if (focusables.length > 0) focusables[0].focus();
            }
        }
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
            checklist.innerHTML = `<p class="text-xs text-[#475569] py-2 px-1">No subjects in catalog yet. You can create subjects now or assign them later.</p>`;
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
            secChecklist.innerHTML = `<p class="text-xs text-[#475569] py-1.5 px-1">No sections created yet. You can assign this subject once a section is created.</p>`;
        } else {
            secChecklist.innerHTML = state.sections.map(sec => {
                const checked = assignedSecSet.has(sec.id) ? 'checked' : '';
                return `
                    <label class="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-white cursor-pointer transition">
                        <span class="flex items-center gap-2.5">
                            <input type="checkbox" name="subject_section_ids" value="${sec.id}" ${checked} class="w-4 h-4 rounded text-[#17243A] focus:ring-[#5276A7] border-[#D8DEE8]">
                            <span class="text-sm font-semibold text-[#17243A]">${escapeHtml(sec.section_name)}</span>
                        </span>
                        <span class="text-xs text-[#475569]">${escapeHtml(sec.year_level)}</span>
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
                teacher_id: existing?.teacher_id !== null && existing?.teacher_id !== undefined ? Number(existing.teacher_id) : null,
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
                    <p class="text-xs text-[#475569] mt-1">Click "+ New Subject" above to create your first subject and assign it here.</p>
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

        const teachersList = (state.teachers || []).filter(t => t.role === 'teacher');

        container.innerHTML = filtered.map(sub => {
            const draft = state.assignDraftMap[sub.id] || { checked: false, schedule: '', instructor: '', teacher_id: null };
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
                                ${sub.description ? `<p class="text-xs text-[#475569] mt-0.5 truncate">${escapeHtml(sub.description)}</p>` : ''}
                            </div>
                        </label>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:w-80 shrink-0 ${draft.checked ? '' : 'opacity-40 pointer-events-none'}">
                            <input type="text"
                                placeholder="Schedule (e.g. MWF 8-9AM)"
                                value="${escapeHtml(draft.schedule)}"
                                oninput="App.onAssignMetaChange(${sub.id}, 'schedule', this.value)"
                                class="px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#D8DEE8] bg-white focus:border-[#5276A7] outline-none">
                            <select
                                onchange="App.onAssignTeacherSelectChange(${sub.id}, this.value)"
                                class="px-2.5 py-2 text-xs sm:text-sm rounded-xl border border-[#D8DEE8] bg-white font-medium text-[#17243A] focus:border-[#5276A7] outline-none truncate">
                                <option value="">-- Assign Teacher --</option>
                                ${teachersList.map(t => `
                                    <option value="${t.id}" ${draft.teacher_id === t.id ? 'selected' : ''}>
                                        ${escapeHtml(t.full_name)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        updateAssignSelectedTotals();
    }

    function onAssignTeacherSelectChange(subjectId, teacherIdVal) {
        if (!state.assignDraftMap[subjectId]) {
            state.assignDraftMap[subjectId] = { checked: true, schedule: '', instructor: '', teacher_id: null };
        }
        const tid = teacherIdVal ? Number(teacherIdVal) : null;
        state.assignDraftMap[subjectId].teacher_id = tid;
        if (tid) {
            const t = (state.teachers || []).find(x => x.id === tid);
            state.assignDraftMap[subjectId].instructor = t ? t.full_name : '';
        } else {
            state.assignDraftMap[subjectId].instructor = '';
        }
    }

    function onAssignCheckboxChange(subjectId, isChecked) {
        if (!state.assignDraftMap[subjectId]) {
            state.assignDraftMap[subjectId] = { checked: false, schedule: '', instructor: '', teacher_id: null };
        }
        state.assignDraftMap[subjectId].checked = isChecked;
        renderAssignSubjectsModalList();
    }

    function onAssignMetaChange(subjectId, field, value) {
        if (!state.assignDraftMap[subjectId]) {
            state.assignDraftMap[subjectId] = { checked: true, schedule: '', instructor: '', teacher_id: null };
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

        const sec = state.sections.find(s => s.id === sectionId);
        const existingOrderMap = {};
        if (sec && sec.assigned_subjects) {
            sec.assigned_subjects.forEach((as, idx) => {
                existingOrderMap[as.subject_id] = idx + 1;
            });
        }

        const checkedSubjects = state.subjects.filter(sub => state.assignDraftMap[sub.id]?.checked);
        // Preserve previous custom order for already-assigned subjects; append new ones
        checkedSubjects.sort((a, b) => {
            const orderA = existingOrderMap[a.id] ?? 9999;
            const orderB = existingOrderMap[b.id] ?? 9999;
            if (orderA !== orderB) return orderA - orderB;
            return a.subject_code.localeCompare(b.subject_code);
        });

        const assignments = checkedSubjects.map((sub, idx) => {
            const draft = state.assignDraftMap[sub.id];
            return {
                subject_id: sub.id,
                schedule: draft.schedule || '',
                instructor: draft.instructor || '',
                teacher_id: draft.teacher_id || null,
                sort_order: idx + 1,
            };
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

    // ==================== ASSIGN SUBJECTS & SECTIONS TO TEACHER CONTROLLER ====================
    let returnToTeacherModalAfterCreate = false;
    let astCheckedSections = new Set();
    let astCheckedSubjects = new Set();

    function openAssignSubjectTeacherModal(teacherId = null, sectionIds = null, subjectIds = null) {
        const modal = document.getElementById('assignSubjectTeacherModal');
        if (!modal) return;

        const teacherSelect = document.getElementById('astTeacherSelect');
        const schedInput = document.getElementById('astScheduleInput');
        const secSearch = document.getElementById('astSectionSearchInput');
        const subSearch = document.getElementById('astSubjectSearchInput');

        if (secSearch) secSearch.value = '';
        if (subSearch) subSearch.value = '';
        if (schedInput) schedInput.value = '';

        // Reset and pre-fill checked sections
        astCheckedSections = new Set();
        if (Array.isArray(sectionIds)) {
            sectionIds.forEach(id => { if (id) astCheckedSections.add(Number(id)); });
        } else if (sectionIds !== null && sectionIds !== undefined && Number(sectionIds) > 0) {
            astCheckedSections.add(Number(sectionIds));
        }

        // Reset and pre-fill checked subjects
        astCheckedSubjects = new Set();
        if (Array.isArray(subjectIds)) {
            subjectIds.forEach(id => { if (id) astCheckedSubjects.add(Number(id)); });
        } else if (subjectIds !== null && subjectIds !== undefined && Number(subjectIds) > 0) {
            astCheckedSubjects.add(Number(subjectIds));
        }

        // Populate Teachers dropdown
        const teachersList = (state.teachers || []).filter(t => t.role === 'teacher');
        teacherSelect.innerHTML = `<option value="">-- Select Teacher Account --</option>` +
            teachersList.map(t => {
                const loadCount = t.load_count !== undefined ? t.load_count : 0;
                return `<option value="${t.id}">${escapeHtml(t.full_name)} (@${escapeHtml(t.username)}) — ${loadCount} current load${loadCount === 1 ? '' : 's'}</option>`;
            }).join('');

        if (teacherId) {
            teacherSelect.value = String(teacherId);
        } else {
            teacherSelect.value = '';
        }

        onAstTeacherChange(teacherSelect.value);
        renderAstSectionsList();
        renderAstSubjectsList();
        updateAstSummary();

        openModal('assignSubjectTeacherModal');
    }

    function onAstTeacherChange(teacherId) {
        const infoPill = document.getElementById('astTeacherInfoPill');
        if (!infoPill) return;

        if (!teacherId) {
            infoPill.innerHTML = `<span class="text-[#80530F]">Please select a teacher to assign teaching loads to.</span>`;
            updateAstSummary();
            return;
        }

        const t = (state.teachers || []).find(x => String(x.id) === String(teacherId));
        if (t) {
            const loadCount = t.load_count !== undefined ? t.load_count : 0;
            infoPill.innerHTML = `
                <span class="inline-flex items-center gap-1.5 text-[#0F766E] font-semibold">
                    <span>✓ Selected Teacher:</span>
                    <strong class="text-[#17243A]">${escapeHtml(t.full_name)}</strong>
                    <span class="text-[#475569]">(@${escapeHtml(t.username)})</span>
                    <span>&bull;</span>
                    <span>${loadCount} current active load${loadCount === 1 ? '' : 's'}</span>
                </span>
            `;
        } else {
            infoPill.textContent = '';
        }

        updateAstSummary();
    }

    function getAstFilteredSections() {
        const q = (document.getElementById('astSectionSearchInput')?.value || '').trim().toLowerCase();
        return state.sections.filter(sec => {
            if (!q) return true;
            return (
                sec.section_name.toLowerCase().includes(q) ||
                (sec.year_level && sec.year_level.toLowerCase().includes(q))
            );
        });
    }

    function renderAstSectionsList() {
        const container = document.getElementById('astSectionsListContainer');
        if (!container) return;

        const filtered = getAstFilteredSections();

        if (state.sections.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center text-xs text-[#475569]">
                    No sections created yet. Create a section first.
                </div>
            `;
            return;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center text-xs text-[#475569]">
                    No sections match your filter.
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(sec => {
            const isChecked = astCheckedSections.has(sec.id);
            const subCount = sec.assigned_subjects ? sec.assigned_subjects.length : (sec.subject_count || 0);
            return `
                <label class="flex items-center justify-between p-2.5 hover:bg-[#F5F7FA] transition cursor-pointer select-none ${isChecked ? 'bg-[#EBF1F8]/50' : ''}">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <input type="checkbox"
                            value="${sec.id}"
                            ${isChecked ? 'checked' : ''}
                            onchange="App.onAstSectionToggle(${sec.id}, this.checked)"
                            class="w-4 h-4 rounded text-[#17243A] focus:ring-[#5276A7] border-[#D8DEE8] cursor-pointer shrink-0">
                        <div class="min-w-0 flex-1">
                            <span class="text-xs sm:text-sm font-semibold text-[#17243A] truncate block">${escapeHtml(sec.section_name)}</span>
                            <span class="text-[11px] text-[#475569]">${sec.student_count || 0} students &bull; ${subCount} subjects</span>
                        </div>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA] shrink-0 ml-2">
                        ${escapeHtml(sec.year_level)}
                    </span>
                </label>
            `;
        }).join('');

        updateAstSummary();
    }

    function getAstFilteredSubjects() {
        const q = (document.getElementById('astSubjectSearchInput')?.value || '').trim().toLowerCase();
        return state.subjects.filter(sub => {
            if (!q) return true;
            return (
                sub.subject_code.toLowerCase().includes(q) ||
                sub.subject_name.toLowerCase().includes(q)
            );
        });
    }

    function renderAstSubjectsList() {
        const container = document.getElementById('astSubjectsListContainer');
        if (!container) return;

        const filtered = getAstFilteredSubjects();

        if (state.subjects.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center text-xs text-[#475569]">
                    No subjects in catalog yet.
                </div>
            `;
            return;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center text-xs text-[#475569]">
                    No subjects match your filter.
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(sub => {
            const isChecked = astCheckedSubjects.has(sub.id);
            return `
                <label class="flex items-center justify-between p-2.5 hover:bg-[#F5F7FA] transition cursor-pointer select-none ${isChecked ? 'bg-[#EBF1F8]/50' : ''}">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <input type="checkbox"
                            value="${sub.id}"
                            ${isChecked ? 'checked' : ''}
                            onchange="App.onAstSubjectToggle(${sub.id}, this.checked)"
                            class="w-4 h-4 rounded text-[#17243A] focus:ring-[#5276A7] border-[#D8DEE8] cursor-pointer shrink-0">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="font-mono text-xs font-bold text-[#2C4870] bg-[#EBF1F8] px-1.5 py-0.5 rounded border border-[#C5D5EA]">${escapeHtml(sub.subject_code)}</span>
                                <span class="text-xs font-semibold text-[#17243A] truncate">${escapeHtml(sub.subject_name)}</span>
                            </div>
                        </div>
                    </div>
                    <span class="text-[11px] font-bold text-[#0F766E] shrink-0 ml-2">
                        *${formatUnits(sub.units)}u
                    </span>
                </label>
            `;
        }).join('');

        updateAstSummary();
    }

    function onAstSectionToggle(sectionId, isChecked) {
        if (isChecked) {
            astCheckedSections.add(Number(sectionId));
        } else {
            astCheckedSections.delete(Number(sectionId));
        }
        renderAstSectionsList();
        updateAstSummary();
    }

    function onAstSubjectToggle(subjectId, isChecked) {
        if (isChecked) {
            astCheckedSubjects.add(Number(subjectId));
        } else {
            astCheckedSubjects.delete(Number(subjectId));
        }
        renderAstSubjectsList();
        updateAstSummary();
    }

    function astToggleAllSections(selectAll) {
        const visible = getAstFilteredSections();
        if (selectAll) {
            visible.forEach(s => astCheckedSections.add(s.id));
        } else {
            const hasQuery = Boolean((document.getElementById('astSectionSearchInput')?.value || '').trim());
            if (hasQuery) {
                visible.forEach(s => astCheckedSections.delete(s.id));
            } else {
                astCheckedSections.clear();
            }
        }
        renderAstSectionsList();
        updateAstSummary();
    }

    function astToggleAllSubjects(selectAll) {
        const visible = getAstFilteredSubjects();
        if (selectAll) {
            visible.forEach(s => astCheckedSubjects.add(s.id));
        } else {
            const hasQuery = Boolean((document.getElementById('astSubjectSearchInput')?.value || '').trim());
            if (hasQuery) {
                visible.forEach(s => astCheckedSubjects.delete(s.id));
            } else {
                astCheckedSubjects.clear();
            }
        }
        renderAstSubjectsList();
        updateAstSummary();
    }

    function updateAstSummary() {
        const secCount = astCheckedSections.size;
        const subCount = astCheckedSubjects.size;
        const totalLoads = secCount * subCount;

        const secBadge = document.getElementById('astSectionsCountBadge');
        if (secBadge) {
            secBadge.textContent = `${secCount} / ${state.sections.length} selected`;
            secBadge.className = secCount > 0
                ? 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]'
                : 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]';
        }

        const subBadge = document.getElementById('astSubjectsCountBadge');
        if (subBadge) {
            subBadge.textContent = `${subCount} / ${state.subjects.length} selected`;
            subBadge.className = subCount > 0
                ? 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]'
                : 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]';
        }

        const preview = document.getElementById('astSummaryPreview');
        const submitBtn = document.getElementById('astSubmitBtn');
        const teacherId = document.getElementById('astTeacherSelect')?.value;
        const teacher = (state.teachers || []).find(t => String(t.id) === String(teacherId));

        if (!preview || !submitBtn) return;

        if (!teacherId) {
            preview.className = 'p-3.5 rounded-xl border border-[#F0D296] bg-[#FFF0D1] text-xs sm:text-sm font-medium transition flex items-center justify-between gap-3 text-[#80530F]';
            preview.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-base">&#9888;</span>
                    <span>Please select a teacher account above to proceed with assignment.</span>
                </div>
            `;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Assign Teaching Loads';
            return;
        }

        if (secCount === 0 || subCount === 0) {
            preview.className = 'p-3.5 rounded-xl border border-[#F0D296] bg-[#FFF0D1] text-xs sm:text-sm font-medium transition flex items-center justify-between gap-3 text-[#80530F]';
            preview.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-base">&#9888;</span>
                    <span>Select at least 1 section and 1 subject. (${secCount} sections, ${subCount} subjects checked)</span>
                </div>
            `;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Assign Teaching Loads';
            return;
        }

        preview.className = 'p-3.5 rounded-xl border border-[#99D8CC] bg-[#D5F0EA] text-xs sm:text-sm font-medium transition flex items-center justify-between gap-3 text-[#17243A]';
        preview.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-[#0F766E] font-bold text-base">&#10003;</span>
                <div>
                    Assigning <strong class="text-[#0F766E]">${escapeHtml(teacher.full_name)}</strong> to 
                    <strong>${subCount}</strong> subject${subCount === 1 ? '' : 's'} across 
                    <strong>${secCount}</strong> section${secCount === 1 ? '' : 's'}.
                </div>
            </div>
            <span class="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-[#99D8CC] text-[#0F766E] shrink-0">
                ${totalLoads} Load${totalLoads === 1 ? '' : 's'}
            </span>
        `;
        submitBtn.disabled = false;
        submitBtn.textContent = `Assign ${totalLoads} Teaching Load${totalLoads === 1 ? '' : 's'}`;
    }

    async function handleAssignSubjectTeacherSubmit(e) {
        e.preventDefault();
        const teacherId = Number(document.getElementById('astTeacherSelect')?.value);
        const schedule = (document.getElementById('astScheduleInput')?.value || '').trim();

        const sectionIds = Array.from(astCheckedSections);
        const subjectIds = Array.from(astCheckedSubjects);

        if (!teacherId) {
            showToast('Please select a teacher account.', 'error');
            return;
        }
        if (sectionIds.length === 0) {
            showToast('Please select at least one section.', 'error');
            return;
        }
        if (subjectIds.length === 0) {
            showToast('Please select at least one subject.', 'error');
            return;
        }

        const btn = document.getElementById('astSubmitBtn');
        if (btn) btn.disabled = true;

        try {
            const res = await apiRequest('assign_subject_teacher', {
                teacher_id: teacherId,
                section_ids: sectionIds,
                subject_ids: subjectIds,
                schedule,
            });
            applySystemState(res);
            closeModal('assignSubjectTeacherModal');
            showToast(res.message, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function openTeacherModalFromAssign() {
        returnToTeacherModalAfterCreate = true;
        closeModal('assignSubjectTeacherModal');
        openTeacherModal();
    }

    // ==================== REORDER SECTION SUBJECTS CONTROLLER ====================
    function openReorderSubjectsModal(sectionId = null) {
        let secId = Number(sectionId);
        if (!secId) {
            secId = Number(state.gradingSectionId) || Number(state.dashboardSectionId) || (state.sections[0]?.id ?? 0);
        }
        const sec = state.sections.find(s => s.id === secId);
        if (!sec) {
            showToast('Please select or create a section first.', 'error');
            return;
        }

        state.reorderSectionId = sec.id;
        document.getElementById('reorderSectionIdInput').value = sec.id;
        document.getElementById('reorderModalTitle').textContent = `Order Subjects — ${sec.section_name} (${sec.year_level})`;

        // Clone current assigned subjects in order
        state.reorderDraftList = (sec.assigned_subjects || []).map(s => ({ ...s }));

        renderReorderSubjectsList();
        openModal('reorderSubjectsModal');
    }

    function openReorderFromAssignModal() {
        const secId = Number(document.getElementById('assignSectionIdInput')?.value);
        if (!secId) return;
        closeModal('assignSubjectsModal');
        openReorderSubjectsModal(secId);
    }

    function renderReorderSubjectsList() {
        const container = document.getElementById('reorderSubjectsListContainer');
        const previewEl = document.getElementById('reorderFormulaPreview');
        if (!container) return;

        const list = state.reorderDraftList || [];
        const total = list.length;

        if (total === 0) {
            container.innerHTML = `
                <div class="p-8 text-center bg-[#F5F7FA] rounded-xl border border-dashed border-[#D8DEE8]">
                    <p class="text-sm font-semibold text-[#17243A]">No subjects assigned to this section yet</p>
                    <p class="text-xs text-[#475569] mt-1">Assign subjects to this section first to configure their input order.</p>
                </div>
            `;
            if (previewEl) previewEl.textContent = 'No subjects';
            return;
        }

        container.innerHTML = list.map((sub, idx) => {
            const col = excelColLetter(idx);
            const isFirst = idx === 0;
            const isLast = idx === total - 1;

            const posOptions = list.map((_, pIdx) => `
                <option value="${pIdx}" ${pIdx === idx ? 'selected' : ''}>
                    Position ${pIdx + 1} (${excelColLetter(pIdx)}) ${pIdx === 0 ? '— 1st Input' : ''}
                </option>
            `).join('');

            return `
                <div class="flex items-center justify-between gap-3 p-3 rounded-xl border ${
                    isFirst
                        ? 'bg-[#EBF1F8] border-[#5276A7]/40 shadow-2xs'
                        : 'bg-white border-[#D8DEE8] hover:border-[#B8CCE6]'
                } transition">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <!-- Excel Column & Position Badge -->
                        <div class="inline-flex flex-col items-center justify-center w-12 h-11 rounded-lg ${
                            isFirst ? 'bg-[#17243A] text-white' : 'bg-[#F5F7FA] text-[#17243A] border border-[#D8DEE8]'
                        } font-mono shrink-0">
                            <span class="text-xs font-bold leading-none">Col ${col}</span>
                            <span class="text-xs opacity-75 mt-0.5">${idx === 0 ? '1st' : (idx + 1) + 'th'}</span>
                        </div>

                        <!-- Subject Info -->
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-bold text-[#17243A] text-sm">${escapeHtml(sub.subject_code)}</span>
                                <span class="text-xs font-semibold text-[#0F766E] bg-[#D5F0EA] px-2 py-0.5 rounded-full border border-[#99D8CC]">
                                    *${formatUnits(sub.units)} units
                                </span>
                                ${isFirst ? '<span class="text-xs font-extrabold uppercase tracking-wider text-[#2C4870] bg-white px-2 py-0.5 rounded border border-[#C5D5EA]">★ First to Input</span>' : ''}
                            </div>
                            <p class="text-xs text-[#475569] truncate mt-0.5">${escapeHtml(sub.subject_name)}</p>
                        </div>
                    </div>

                    <!-- Order Adjustment Controls: Position Select & Move Up / Down Buttons -->
                    <div class="flex items-center gap-1.5 shrink-0">
                        <select onchange="App.setSubjectPositionInDraft(${idx}, Number(this.value))"
                            aria-label="Set position for ${escapeHtml(sub.subject_code)}"
                            class="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] outline-none cursor-pointer">
                            ${posOptions}
                        </select>

                        <button type="button"
                            onclick="App.moveSubjectInDraft(${idx}, -1)"
                            ${isFirst ? 'disabled' : ''}
                            class="p-1.5 rounded-lg border border-[#D8DEE8] bg-white text-[#17243A] hover:bg-[#EBF1F8] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                            title="Move Up (makes this subject input sooner)">
                            ▲
                        </button>

                        <button type="button"
                            onclick="App.moveSubjectInDraft(${idx}, 1)"
                            ${isLast ? 'disabled' : ''}
                            class="p-1.5 rounded-lg border border-[#D8DEE8] bg-white text-[#17243A] hover:bg-[#EBF1F8] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                            title="Move Down (makes this subject input later)">
                            ▼
                        </button>

                        ${!isFirst ? `
                            <button type="button"
                                onclick="App.moveSubjectToTopInDraft(${idx})"
                                class="px-2 py-1 rounded-lg text-xs font-bold border border-[#C5D5EA] bg-[#EBF1F8] text-[#2C4870] hover:bg-[#D8E4F3] transition cursor-pointer"
                                title="Make this subject 1st to be input (Col E)">
                                ⤒ 1st
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        if (previewEl) {
            previewEl.textContent = buildSectionFormulaString(list, 21);
        }
    }

    function moveSubjectInDraft(index, delta) {
        const list = state.reorderDraftList;
        const target = index + delta;
        if (target < 0 || target >= list.length) return;
        const temp = list[index];
        list[index] = list[target];
        list[target] = temp;
        renderReorderSubjectsList();
    }

    function moveSubjectToTopInDraft(index) {
        const list = state.reorderDraftList;
        if (index <= 0 || index >= list.length) return;
        const [item] = list.splice(index, 1);
        list.unshift(item);
        renderReorderSubjectsList();
    }

    function setSubjectPositionInDraft(oldIndex, newIndex) {
        const list = state.reorderDraftList;
        if (oldIndex < 0 || oldIndex >= list.length || newIndex < 0 || newIndex >= list.length || oldIndex === newIndex) return;
        const [item] = list.splice(oldIndex, 1);
        list.splice(newIndex, 0, item);
        renderReorderSubjectsList();
    }

    function resetSubjectOrderToAlphabetical() {
        state.reorderDraftList.sort((a, b) => a.subject_code.localeCompare(b.subject_code));
        renderReorderSubjectsList();
    }

    async function saveSubjectOrder() {
        const secId = state.reorderSectionId;
        if (!secId) return;

        const subjectIds = state.reorderDraftList.map(s => Number(s.subject_id));
        const btn = document.getElementById('reorderSaveBtn');
        if (btn) btn.disabled = true;

        try {
            const res = await apiRequest('reorder_section_subjects', {
                section_id: secId,
                subject_ids: subjectIds,
            });
            applySystemState(res);
            closeModal('reorderSubjectsModal');
            const firstSub = state.reorderDraftList[0]?.subject_code || 'Selected subject';
            showToast(`${firstSub} is now 1st to be input (Col E). Subject order saved!`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            if (btn) btn.disabled = false;
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
            previewEl.innerHTML = `<span class="text-[#475569]">Select a section above to preview its assigned subjects.</span>`;
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

    function detectBulkGenderHeaderClient(rawLine) {
        let line = String(rawLine || '').trim();
        line = line.replace(/^[\[\(\-#*]+\s*|\s*[\]\)\-:]+$/g, '').trim().toLowerCase();
        if (['female', 'females', 'female students', 'girls'].includes(line)) {
            return 'Female';
        }
        if (['male', 'males', 'male students', 'boys'].includes(line)) {
            return 'Male';
        }
        return null;
    }

    function parseBulkStudentLineClient(rawLine, defaultGender = 'Female') {
        let line = String(rawLine || '').trim();
        if (!line) return null;

        // Strip optional list numbering at the start like "1. " or "1) " or "- "
        line = line.replace(/^(?:\d{1,3}[\.\)]\s+|[-•*]\s+)/, '').trim();
        if (!line) return null;

        let gender = normalizeGenderClient(defaultGender);
        const trailingGenderMatch = line.match(/[\|\t;]\s*(female|male|f|m|girl|boy)\s*$/i);
        if (trailingGenderMatch) {
            const gTok = trailingGenderMatch[1].toLowerCase();
            gender = (gTok === 'm' || gTok === 'male' || gTok === 'boy') ? 'Male' : 'Female';
            line = line.replace(/[\|\t;]\s*(female|male|f|m|girl|boy)\s*$/i, '').trim();
        } else {
            const leadingGenderMatch = line.match(/^(female|male|f|m)\s*[\|\t:]\s*(.+)$/i);
            if (leadingGenderMatch) {
                const gTok = leadingGenderMatch[1].toLowerCase();
                gender = (gTok === 'm' || gTok === 'male') ? 'Male' : 'Female';
                line = leadingGenderMatch[2].trim();
            }
        }

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
            gender,
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
                singleBtn.className = 'px-3 py-1.5 rounded-lg text-[#475569] hover:text-[#17243A] transition cursor-pointer';
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
                bulkBtn.className = 'px-3 py-1.5 rounded-lg text-[#475569] hover:text-[#17243A] transition cursor-pointer flex items-center gap-1.5';
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
        const defaultGenderSelect = document.getElementById('bulkStudentGenderInput');
        if (!textarea || !badge || !previewList) return;

        let activeGender = normalizeGenderClient(defaultGenderSelect?.value || 'Female');
        const rawLines = textarea.value.split(/\r\n|\r|\n/).map(l => l.trim()).filter(Boolean);
        const parsedItems = [];

        rawLines.forEach((line, idx) => {
            const headerGender = detectBulkGenderHeaderClient(line);
            if (headerGender) {
                activeGender = headerGender;
                parsedItems.push({
                    lineNum: idx + 1,
                    raw: line,
                    isHeader: true,
                    headerGender,
                    parsed: null,
                });
                return;
            }
            parsedItems.push({
                lineNum: idx + 1,
                raw: line,
                isHeader: false,
                parsed: parseBulkStudentLineClient(line, activeGender),
            });
        });

        const validItems = parsedItems.filter(item => item.parsed !== null);
        const validCount = validItems.length;
        const femaleCount = validItems.filter(item => item.parsed.gender === 'Female').length;
        const maleCount = validItems.filter(item => item.parsed.gender === 'Male').length;
        badge.textContent = `${validCount} student${validCount === 1 ? '' : 's'} (${femaleCount}F · ${maleCount}M)`;

        if (submitBtn && studentModalMode === 'bulk') {
            submitBtn.textContent = validCount > 0
                ? `Enroll ${validCount} Student${validCount === 1 ? '' : 's'}`
                : 'Enroll Students';
        }

        if (parsedItems.length === 0) {
            previewList.innerHTML = `<p class="text-[#475569] italic py-1">Type or paste student names above (1 student per line) to preview how they will be enrolled...</p>`;
            return;
        }

        previewList.innerHTML = parsedItems.map(item => {
            if (item.isHeader) {
                const isFem = item.headerGender === 'Female';
                return `
                    <div class="py-1 px-2 rounded ${isFem ? 'bg-[#FDF2F8] text-[#9D174D]' : 'bg-[#EFF6FF] text-[#1E40AF]'} text-xs font-extrabold uppercase tracking-wider">
                        ${isFem ? '&#9792; Female Group Header' : '&#9794; Male Group Header'}
                    </div>
                `;
            }
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
                        <span class="font-mono text-[#475569]">#${item.lineNum}</span>
                        <span class="font-semibold text-[#17243A] truncate">${escapeHtml(p.full_name)}</span>
                        ${genderBadgeHtml(p.gender, true)}
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
            'Female:',
            'Villanueva, Angela R.',
            'Bautista, Sophia L.',
            'Male:',
            'Dela Cruz, Juan M.',
            'Mark Anthony S. Mendoza',
            'Gabriel T. Soriano',
        ];
        textarea.value = textarea.value.trim()
            ? textarea.value.trim() + '\n' + sampleLines.join('\n')
            : sampleLines.join('\n');
        onBulkStudentTextInput();
        textarea.focus();
    }

    function openStudentModal(studentId = null, preselectedSectionId = null, mode = 'single') {
        if (!studentId && state.currentUser?.role !== 'admin' && !state.currentUser?.can_add_student) {
            showToast('Permission restricted: You do not have permission to enroll students. Contact your administrator.', 'error');
            return;
        }
        const form = document.getElementById('studentForm');
        form.reset();
        document.getElementById('studentIdInput').value = '';
        const bulkTextarea = document.getElementById('bulkStudentsTextarea');
        if (bulkTextarea) bulkTextarea.value = '';

        const modeToggle = document.getElementById('studentModalModeToggle');
        const singleGenderInput = document.getElementById('studentGenderInput');
        const bulkGenderInput = document.getElementById('bulkStudentGenderInput');

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
            if (singleGenderInput) singleGenderInput.value = normalizeGenderClient(st.gender);
            document.getElementById('studentStatusInput').value = st.status || 'Active';
            document.getElementById('studentYearLevelSelect').value = st.year_level;
            populateStudentModalSections(st.year_level, st.section_id);
        } else {
            modeToggle?.classList.remove('hidden');
            document.getElementById('studentModalTitle').textContent = mode === 'bulk' ? 'Bulk Add Students (1 per Line)' : 'Enroll New Student';
            if (singleGenderInput) singleGenderInput.value = 'Female';
            if (bulkGenderInput) bulkGenderInput.value = 'Female';
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
                const gender = normalizeGenderClient(document.getElementById('bulkStudentGenderInput')?.value || 'Female');
                if (!students_text) {
                    showToast('Please enter at least one student name (1 student per line).', 'error');
                    btn.disabled = false;
                    return;
                }
                const res = await apiRequest('bulk_save_students', {
                    students_text,
                    section_id,
                    year_level,
                    gender,
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
                const gender = normalizeGenderClient(document.getElementById('studentGenderInput')?.value || 'Female');

                const res = await apiRequest('save_student', {
                    id: id || null,
                    student_no,
                    first_name,
                    middle_name,
                    last_name,
                    gender,
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


    // ==================== VIEW 7: TEACHER ACCOUNTS & PERMISSIONS (ADMIN ONLY) ====================
    function renderUsersView() {
        const tableBody = document.getElementById('usersTableBody');
        const countSummary = document.getElementById('userCountSummary');
        const unlockContainer = document.getElementById('adminPendingUnlocksContainer');
        if (!tableBody) return;

        // Render Pending Unlock Requests Banner
        if (unlockContainer) {
            const pending = state.pendingUnlockRequests || [];
            if (pending.length > 0) {
                unlockContainer.classList.remove('hidden');
                unlockContainer.innerHTML = `
                    <div class="rounded-2xl border border-[#F0D296] bg-[#FFF0D1] p-4.5 shadow-xs space-y-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2.5">
                                <span class="w-8 h-8 rounded-xl bg-[#B7791F] text-white flex items-center justify-center font-bold text-sm">⏳</span>
                                <div>
                                    <h4 class="font-display font-bold text-sm sm:text-base text-[#80530F]">
                                        Pending Grade Sheet Unlock Requests (${pending.length})
                                    </h4>
                                    <p class="text-xs text-[#80530F]/90 mt-0.5">
                                        Teachers have requested to unlock finalized grades to make corrections or rewrite grades.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            ${pending.map(req => `
                                <div class="bg-white rounded-xl p-3.5 border border-[#F0D296] shadow-2xs space-y-2">
                                    <div class="flex items-start justify-between gap-2">
                                        <div>
                                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-[#EBF1F8] text-[#2C4870]">
                                                ${escapeHtml(req.section_name)} &bull; ${escapeHtml(req.quarter)}
                                            </span>
                                            <h5 class="text-xs font-bold text-[#17243A] mt-1">${escapeHtml(req.subject_code)} — ${escapeHtml(req.subject_name)}</h5>
                                            <p class="text-xs text-[#475569]">Teacher: <strong class="text-[#17243A]">${escapeHtml(req.unlock_requested_by_name || 'Teacher')}</strong></p>
                                        </div>
                                        <span class="text-[11px] font-mono text-[#475569] shrink-0">${req.unlock_requested_at ? escapeHtml(req.unlock_requested_at) : ''}</span>
                                    </div>
                                    <div class="p-2.5 rounded-lg bg-[#F5F7FA] border border-[#D8DEE8] text-xs text-[#17243A] italic">
                                        "${escapeHtml(req.unlock_reason)}"
                                    </div>
                                    <div class="flex items-center justify-end gap-2 pt-1">
                                        <button type="button" onclick="App.submitUnlockDecision('reject', ${req.section_id}, ${req.subject_id}, '${req.quarter}')"
                                            class="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#842D60] bg-[#F5DFEB] hover:bg-[#eed3e3] border border-[#E2B8CF] transition cursor-pointer">
                                            Reject
                                        </button>
                                        <button type="button" onclick="App.openReviewUnlockModal(${req.section_id}, ${req.subject_id}, '${req.quarter}')"
                                            class="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5276A7] bg-[#EBF1F8] hover:bg-[#dce6f4] border border-[#C5D5EA] transition cursor-pointer">
                                            Review
                                        </button>
                                        <button type="button" onclick="App.submitUnlockDecision('approve', ${req.section_id}, ${req.subject_id}, '${req.quarter}')"
                                            class="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0c5f58] shadow-2xs transition cursor-pointer">
                                            ✓ Approve &amp; Unlock
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                unlockContainer.classList.add('hidden');
                unlockContainer.innerHTML = '';
            }
        }

        const searchQ = (document.getElementById('userSearchInput')?.value || '').trim().toLowerCase();
        const roleFilter = document.getElementById('userRoleFilter')?.value || '';

        const teachersList = state.teachers || [];
        const filtered = teachersList.filter(u => {
            if (roleFilter && u.role !== roleFilter) return false;
            if (!searchQ) return true;
            return (
                (u.full_name && u.full_name.toLowerCase().includes(searchQ)) ||
                (u.username && u.username.toLowerCase().includes(searchQ))
            );
        });

        if (countSummary) {
            countSummary.textContent = `${filtered.length} of ${teachersList.length} Accounts`;
        }

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-12 text-center text-[#475569]">
                        <p class="text-sm font-semibold text-[#17243A]">No User Accounts Found</p>
                        <p class="text-xs mt-1">Try adjusting your search or role filter, or click "+ Add Teacher User" above.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filtered.map(u => {
            const isAdmin = u.role === 'admin';
            const isSelf = state.currentUser && state.currentUser.id === u.id;
            const canAdd = Boolean(u.can_add_student);
            const isActive = Boolean(u.is_active);

            // Teaching loads badges
            const loadCount = Number(u.teaching_load_count || u.load_count || (u.teaching_loads ? u.teaching_loads.length : (u.loads ? u.loads.length : 0)));
            const loadsList = u.teaching_loads || u.loads || [];
            let loadHtml = '';
            if (isAdmin) {
                loadHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]">Full Curriculum Access</span>`;
            } else if (loadCount === 0) {
                loadHtml = `<div class="flex items-center gap-1.5"><span class="text-xs text-[#475569] italic">No assigned subjects</span> <button type="button" onclick="App.openAssignSubjectTeacherModal(${u.id})" class="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer">+ Assign Subject</button></div>`;
            } else {
                const loads = loadsList.slice(0, 3).map(l => 
                    `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5F7FA] text-[#17243A] border border-[#D8DEE8]">${escapeHtml(l.section_name)}: ${escapeHtml(l.subject_code)}</span>`
                ).join(' ');
                loadHtml = `<div class="flex items-center gap-1.5 flex-wrap"><span class="font-bold text-xs text-[#17243A]">${loadCount} class${loadCount === 1 ? '' : 'es'}:</span> ${loads}${loadCount > 3 ? `<span class="text-xs text-[#475569] font-semibold">+${loadCount - 3} more</span>` : ''} <button type="button" onclick="App.openAssignSubjectTeacherModal(${u.id})" class="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer" title="Assign additional subject load">+ Add</button></div>`;
            }

            // Student add permission badge / toggle
            let permHtml = '';
            if (isAdmin) {
                permHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"><span>✓</span><span>Admin (Always)</span></span>`;
            } else if (canAdd) {
                permHtml = `
                    <button type="button" onclick="App.toggleTeacherPermission(${u.id}, false)"
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC] hover:bg-[#c3e8df] transition cursor-pointer"
                        title="Click to revoke student enrollment permission">
                        <span>✓</span><span>Enabled</span>
                    </button>
                `;
            } else {
                permHtml = `
                    <button type="button" onclick="App.toggleTeacherPermission(${u.id}, true)"
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF] hover:bg-[#eed3e3] transition cursor-pointer"
                        title="Click to grant student enrollment permission">
                        <span>✕</span><span>Disabled</span>
                    </button>
                `;
            }

            return `
                <tr class="hover:bg-[#F5F7FA] transition">
                    <td class="py-3.5 px-4 font-semibold text-[#17243A]">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-full ${isAdmin ? 'bg-[#17243A] text-white' : 'bg-[#5276A7] text-white'} flex items-center justify-center font-bold text-xs shrink-0">
                                ${isAdmin ? 'A' : 'T'}
                            </div>
                            <div>
                                <span class="block">${escapeHtml(u.full_name)}</span>
                                ${isSelf ? '<span class="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#D5F0EA] px-1.5 py-0.2 rounded border border-[#99D8CC]">Current User</span>' : ''}
                            </div>
                        </div>
                    </td>
                    <td class="py-3.5 px-4 font-mono text-xs text-[#475569]">
                        ${escapeHtml(u.username)}
                    </td>
                    <td class="py-3.5 px-4">
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isAdmin ? 'bg-[#17243A] text-white' : 'bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]'}">
                            ${isAdmin ? 'Administrator' : 'Teacher'}
                        </span>
                    </td>
                    <td class="py-3.5 px-4">
                        ${loadHtml}
                    </td>
                    <td class="py-3.5 px-4 text-center">
                        ${permHtml}
                    </td>
                    <td class="py-3.5 px-4 text-center">
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]' : 'bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]'}">
                            ${isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                        <div class="inline-flex items-center gap-1.5">
                            ${!isAdmin ? `
                                <button type="button" onclick="App.openAssignSubjectTeacherModal(${u.id})" class="px-2 py-1 rounded-lg text-xs font-bold text-[#0F766E] bg-[#D5F0EA] hover:bg-[#c2e8df] border border-[#99D8CC] transition cursor-pointer flex items-center gap-1" title="Assign Subject Load to this Teacher">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                                    <span>Assign Subject</span>
                                </button>
                            ` : ''}
                            <button type="button" onclick="App.openTeacherModal(${u.id})" class="p-1.5 rounded-lg text-[#475569] hover:text-[#17243A] hover:bg-[#EBF1F8] transition cursor-pointer" title="Edit Teacher Account">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            </button>
                            ${!isSelf ? `
                                <button type="button" onclick="App.confirmDeleteTeacher(${u.id})" class="p-1.5 rounded-lg text-[#842D60] hover:bg-[#F5DFEB] transition cursor-pointer" title="Delete Account">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function openTeacherModal(teacherId = null) {
        const form = document.getElementById('teacherForm');
        form.reset();
        document.getElementById('teacherIdInput').value = '';

        const roleSelect = document.getElementById('teacherRoleInput') || document.getElementById('teacherRoleSelect');
        const passStar = document.getElementById('teacherPasswordRequiredStar');
        const passHelp = document.getElementById('teacherPasswordHelp');
        const passInput = document.getElementById('teacherPasswordInput');
        const permCheckbox = document.getElementById('teacherCanAddStudentInput');
        const activeCheckbox = document.getElementById('teacherIsActiveInput');

        if (teacherId) {
            const u = (state.teachers || []).find(t => t.id === Number(teacherId));
            if (!u) return;
            document.getElementById('teacherModalTitle').textContent = `Edit User — ${u.full_name}`;
            document.getElementById('teacherIdInput').value = u.id;
            document.getElementById('teacherFullNameInput').value = u.full_name || '';
            document.getElementById('teacherUsernameInput').value = u.username || '';
            if (roleSelect) roleSelect.value = u.role || 'teacher';
            if (permCheckbox) permCheckbox.checked = Boolean(u.can_add_student);
            if (activeCheckbox) activeCheckbox.checked = Boolean(u.is_active);
            
            passInput.value = '';
            passInput.removeAttribute('required');
            passStar?.classList.add('hidden');
            passHelp?.classList.remove('hidden');
        } else {
            document.getElementById('teacherModalTitle').textContent = 'Add Teacher User';
            if (roleSelect) roleSelect.value = 'teacher';
            if (permCheckbox) permCheckbox.checked = false;
            if (activeCheckbox) activeCheckbox.checked = true;

            passInput.value = '';
            passInput.setAttribute('required', 'required');
            passStar?.classList.remove('hidden');
            passHelp?.classList.add('hidden');
        }

        onTeacherRoleSelectChange();
        openModal('teacherModal');
    }

    function onTeacherRoleSelectChange() {
        const role = document.getElementById('teacherRoleSelect')?.value || 'teacher';
        const permCheckbox = document.getElementById('teacherCanAddStudentInput');
        if (role === 'admin') {
            if (permCheckbox) {
                permCheckbox.checked = true;
                permCheckbox.disabled = true;
            }
        } else {
            if (permCheckbox) {
                permCheckbox.disabled = false;
            }
        }
    }

    async function handleTeacherFormSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('teacherIdInput').value;
        const fullName = (document.getElementById('teacherFullNameInput')?.value || '').trim();
        const username = (document.getElementById('teacherUsernameInput')?.value || '').trim();
        const role = (document.getElementById('teacherRoleInput') || document.getElementById('teacherRoleSelect'))?.value || 'teacher';
        const password = document.getElementById('teacherPasswordInput')?.value || '';
        const canAddStudent = document.getElementById('teacherCanAddStudentInput')?.checked ? 1 : 0;
        const isActive = document.getElementById('teacherIsActiveInput')?.checked ? 1 : 0;

        if (!fullName || !username) {
            showToast('Full name and username are required.', 'error');
            return;
        }

        if (!id && !password) {
            showToast('Password is required for new accounts.', 'error');
            return;
        }

        const submitBtn = document.getElementById('teacherSubmitBtn');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const res = await apiRequest('save_teacher', {
                id: id ? Number(id) : null,
                full_name: fullName,
                username,
                role,
                password,
                can_add_student: canAddStudent,
                is_active: isActive,
            });
            applySystemState(res);
            closeModal('teacherModal');
            showToast(res.message, 'success');

            if (returnToTeacherModalAfterCreate) {
                returnToTeacherModalAfterCreate = false;
                const newT = (state.teachers || []).find(t => t.username === username);
                openAssignSubjectTeacherModal(newT?.id || null);
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    async function toggleTeacherPermission(teacherId, canAdd) {
        try {
            const res = await apiRequest('toggle_teacher_permission', {
                id: Number(teacherId),
                can_add_student: canAdd ? 1 : 0,
            });
            applySystemState(res);
            showToast(res.message, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function confirmDeleteTeacher(teacherId) {
        const u = (state.teachers || []).find(t => t.id === Number(teacherId));
        if (!u) return;

        document.getElementById('confirmModalTitle').textContent = `Delete Account: ${u.full_name}?`;
        document.getElementById('confirmModalMessage').innerHTML = `
            Are you sure you want to delete the account <strong>${escapeHtml(u.full_name)}</strong> (@${escapeHtml(u.username)})?
            <br><span class="text-[#842D60] font-semibold text-xs mt-1 block">The teacher will no longer be able to log in or input grades.</span>
        `;
        const btn = document.getElementById('confirmModalActionBtn');
        btn.textContent = 'Yes, Delete Account';
        btn.onclick = async () => {
            btn.disabled = true;
            try {
                const res = await apiRequest('delete_teacher', { id: u.id });
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

    // ==================== GRADE LOCKING & UNLOCK REQUESTS ====================
    async function playGradeLockAnimation({ isLocking, subName, secName, qtr, onAction }) {
        const modal = document.getElementById('gradeLockAnimationModal');
        const titleEl = document.getElementById('glamTitle');
        const subtitleEl = document.getElementById('glamSubtitle');
        const shackleEl = document.getElementById('glamPadlockShackle');
        const badgeEl = document.getElementById('glamBadge');
        const ringEl = document.getElementById('glamRing');
        const iconSvg = document.getElementById('glamPadlockSvg');

        if (!modal) {
            return await onAction();
        }

        // Display modal with initial animated state
        modal.classList.remove('hidden');
        if (isLocking) {
            titleEl.textContent = 'Securing & Finalizing Grades...';
            subtitleEl.innerHTML = `Encrypting and locking grades for <strong>${escapeHtml(subName || '')}</strong> in <strong>${escapeHtml(secName || '')} (${escapeHtml(qtr || '')})</strong>.`;
            badgeEl.className = 'relative w-20 h-20 rounded-2xl bg-[#D5F0EA] border border-[#99D8CC] flex items-center justify-center shadow-lg transition-all duration-300';
            ringEl.className = 'absolute inset-0 rounded-full border-4 border-[#0F766E]/30 animate-ping';
            iconSvg.className = 'w-10 h-10 text-[#0F766E] transition-all duration-300';
            if (shackleEl) shackleEl.style.transform = 'translateY(-7px)';
        } else {
            titleEl.textContent = 'Unlocking Grade Sheet...';
            subtitleEl.innerHTML = `Lifting read-only lock for <strong>${escapeHtml(subName || '')}</strong> in <strong>${escapeHtml(secName || '')} (${escapeHtml(qtr || '')})</strong>.`;
            badgeEl.className = 'relative w-20 h-20 rounded-2xl bg-[#FFF0D1] border border-[#F0D296] flex items-center justify-center shadow-lg transition-all duration-300';
            ringEl.className = 'absolute inset-0 rounded-full border-4 border-[#B7791F]/30 animate-ping';
            iconSvg.className = 'w-10 h-10 text-[#80530F] transition-all duration-300';
            if (shackleEl) shackleEl.style.transform = 'translateY(0)';
        }

        try {
            const res = await onAction();

            // Animate padlock snap shut or unlock open
            if (isLocking) {
                if (shackleEl) shackleEl.style.transform = 'translateY(0)';
                titleEl.textContent = 'Grades Successfully Finalized!';
                subtitleEl.textContent = 'Institutional read-only policy has been applied to this grade sheet.';
                badgeEl.classList.add('scale-105');
            } else {
                if (shackleEl) shackleEl.style.transform = 'translateY(-7px) rotate(-28deg)';
                titleEl.textContent = 'Grade Sheet Unlocked!';
                subtitleEl.textContent = 'Faculty can now edit and update student grades.';
                badgeEl.classList.add('scale-105');
            }

            // Brief delay for satisfying visual feedback
            await new Promise(r => setTimeout(r, 650));
            modal.classList.add('hidden');
            badgeEl.classList.remove('scale-105');

            // Grade sheet table flash
            const sheetContainer = document.getElementById('gradingSheetContainer');
            if (sheetContainer) {
                sheetContainer.classList.add('grade-table-locked-flash');
                setTimeout(() => sheetContainer.classList.remove('grade-table-locked-flash'), 800);
            }

            return res;
        } catch (err) {
            modal.classList.add('hidden');
            throw err;
        }
    }

    async function lockCurrentGradesSheet() {
        const secId = state.gradingSectionId;
        const subId = state.gradingSubjectId;
        const qtr = state.gradingQuarter;

        if (!secId) return;

        if (subId === 'ALL') {
            showToast('Please select a specific subject tab to finalize and lock its grades.', 'info');
            return;
        }

        const sec = state.sections.find(s => s.id === Number(secId));
        const sub = sec?.assigned_subjects?.find(s => String(s.subject_id) === String(subId));
        const subName = sub ? sub.subject_code : 'this subject';

        document.getElementById('confirmModalTitle').textContent = `Finalize & Lock Grades?`;
        document.getElementById('confirmModalMessage').innerHTML = `
            Are you sure you want to finalize and lock in the grades for <strong>${escapeHtml(subName)}</strong> in <strong>${escapeHtml(sec?.section_name || '')} (${escapeHtml(qtr)})</strong>?
            <br><span class="text-[#475569] text-xs mt-1 block">Once locked, inputs will become read-only. If you need to rewrite grades later, you can submit an official unlock request to the administrator.</span>
        `;
        const btn = document.getElementById('confirmModalActionBtn');
        btn.textContent = 'Yes, Finalize & Lock';
        btn.onclick = async () => {
            btn.disabled = true;
            try {
                closeModal('confirmModal');
                const res = await playGradeLockAnimation({
                    isLocking: true,
                    subName,
                    secName: sec?.section_name,
                    qtr,
                    onAction: () => apiRequest('lock_grades', {
                        section_id: Number(secId),
                        subject_id: Number(subId),
                        quarter: qtr,
                    })
                });
                applySystemState(res);
                showToast(res.message, 'success');
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                btn.disabled = false;
            }
        };
        openModal('confirmModal');
    }

    function openRequestUnlockModal() {
        const secId = state.gradingSectionId;
        const subId = state.gradingSubjectId;
        const qtr = state.gradingQuarter;

        if (!secId || subId === 'ALL') {
            showToast('Please select a specific subject tab to request an unlock.', 'info');
            return;
        }

        const sec = state.sections.find(s => s.id === Number(secId));
        const sub = sec?.assigned_subjects?.find(s => String(s.subject_id) === String(subId));

        document.getElementById('requestUnlockSectionId').value = secId;
        document.getElementById('requestUnlockSubjectId').value = subId;
        document.getElementById('requestUnlockQuarter').value = qtr;

        document.getElementById('requestUnlockSectionName').textContent = sec ? sec.section_name : '';
        document.getElementById('requestUnlockSubjectName').textContent = sub ? `${sub.subject_code} — ${sub.subject_name}` : '';
        document.getElementById('requestUnlockQuarterName').textContent = qtr;
        document.getElementById('requestUnlockReasonInput').value = '';

        openModal('requestUnlockModal');
    }

    async function handleRequestUnlockSubmit(e) {
        e.preventDefault();
        const secId = document.getElementById('requestUnlockSectionId').value;
        const subId = document.getElementById('requestUnlockSubjectId').value;
        const qtr = document.getElementById('requestUnlockQuarter').value;
        const reason = (document.getElementById('requestUnlockReasonInput')?.value || '').trim();

        if (!reason) {
            showToast('Please provide an explanation/reason for rewriting grades.', 'error');
            return;
        }

        const submitBtn = document.getElementById('requestUnlockSubmitBtn');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const res = await apiRequest('request_unlock_grades', {
                section_id: Number(secId),
                subject_id: Number(subId),
                quarter: qtr,
                reason,
            });
            applySystemState(res);
            closeModal('requestUnlockModal');
            showToast(res.message, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    function openReviewUnlockModal(sectionId, subjectId, quarter) {
        const key = `${sectionId}_${subjectId}_${quarter}`;
        const req = (state.pendingUnlockRequests || []).find(r => r.section_id === Number(sectionId) && r.subject_id === Number(subjectId) && r.quarter === quarter)
            || (state.gradeLocks && state.gradeLocks[key]);

        if (!req) {
            showToast('Unlock request details not found.', 'error');
            return;
        }

        document.getElementById('reviewUnlockSectionId').value = sectionId;
        document.getElementById('reviewUnlockSubjectId').value = subjectId;
        document.getElementById('reviewUnlockQuarter').value = quarter;

        document.getElementById('reviewUnlockTeacherName').textContent = req.unlock_requested_by_name || 'Teacher';
        document.getElementById('reviewUnlockSectionName').textContent = req.section_name || `Section #${sectionId}`;
        document.getElementById('reviewUnlockSubjectName').textContent = `${req.subject_code} — ${req.subject_name}`;
        document.getElementById('reviewUnlockQuarterName').textContent = quarter;
        document.getElementById('reviewUnlockDate').textContent = req.unlock_requested_at || 'Pending';
        document.getElementById('reviewUnlockReasonText').textContent = req.unlock_reason || 'No explanation provided.';

        openModal('unlockReviewModal');
    }

    async function submitUnlockDecision(decision, secId = null, subId = null, qtr = null) {
        const targetSecId = secId ?? document.getElementById('reviewUnlockSectionId')?.value;
        const targetSubId = subId ?? document.getElementById('reviewUnlockSubjectId')?.value;
        const targetQtr = qtr ?? document.getElementById('reviewUnlockQuarter')?.value;

        if (!targetSecId || !targetSubId || !targetQtr) return;

        try {
            closeModal('unlockReviewModal');
            let res;
            if (decision === 'approve') {
                const sec = state.sections.find(s => s.id === Number(targetSecId));
                const sub = sec?.assigned_subjects?.find(s => String(s.subject_id) === String(targetSubId));
                const subName = sub ? sub.subject_code : 'Subject';
                res = await playGradeLockAnimation({
                    isLocking: false,
                    subName,
                    secName: sec?.section_name,
                    qtr: targetQtr,
                    onAction: () => apiRequest('approve_unlock_grades', {
                        section_id: Number(targetSecId),
                        subject_id: Number(targetSubId),
                        quarter: targetQtr,
                        decision,
                    })
                });
            } else {
                res = await apiRequest('approve_unlock_grades', {
                    section_id: Number(targetSecId),
                    subject_id: Number(targetSubId),
                    quarter: targetQtr,
                    decision,
                });
            }
            applySystemState(res);
            showToast(res.message, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    async function toggleGradeLockDirect(secId, subId, qtr, isLocked) {
        if (subId === 'ALL') {
            showToast('Please select a specific subject tab to lock or unlock.', 'info');
            return;
        }

        const sec = state.sections.find(s => s.id === Number(secId));
        const sub = sec?.assigned_subjects?.find(s => String(s.subject_id) === String(subId));
        const subName = sub ? sub.subject_code : 'this subject';

        try {
            const res = await playGradeLockAnimation({
                isLocking: Boolean(isLocked),
                subName,
                secName: sec?.section_name,
                qtr,
                onAction: () => apiRequest('toggle_grade_lock', {
                    section_id: Number(secId),
                    subject_id: Number(subId),
                    quarter: qtr,
                    is_locked: isLocked ? 1 : 0,
                })
            });
            applySystemState(res);
            showToast(res.message, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    // ==================== EVENT LISTENERS ====================
    function bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2 || e.button === 1) {
                    return;
                }
                const target = btn.getAttribute('data-nav');
                if (target) {
                    e.preventDefault();
                    switchView(target, true);
                }
            });
        });

        window.addEventListener('popstate', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const pageFromUrl = urlParams.get('page') || urlParams.get('view') || (window.location.hash ? window.location.hash.replace('#', '') : 'dashboard');
            const validPage = viewMeta[pageFromUrl] ? pageFromUrl : 'dashboard';

            const urlSecId = urlParams.get('section_id');
            const urlQtr = urlParams.get('quarter');
            const urlSubId = urlParams.get('subject_id');

            if (urlSecId && state.sections.some(s => s.id === Number(urlSecId))) {
                const secId = Number(urlSecId);
                state.dashboardSectionId = secId;
                state.gradingSectionId = secId;
                state.reportSectionId = secId;
                state.studentSectionId = String(secId);
                const studentFilter = document.getElementById('studentSectionFilter');
                if (studentFilter) studentFilter.value = String(secId);
            }
            if (urlQtr && ['Q1', 'Q2', 'Q3', 'Q4', 'FINAL'].includes(urlQtr)) {
                state.gradingQuarter = urlQtr;
                state.reportQuarter = urlQtr;
            }
            if (urlSubId) {
                state.gradingSubjectId = String(urlSubId);
            }

            switchView(validPage, false);

            if (validPage === 'grading') renderGradingView();
            else if (validPage === 'reports') renderReportsView();
            else if (validPage === 'students') renderStudentsView();
            else if (validPage === 'sections') renderSectionsView();
            else if (validPage === 'subjects') renderSubjectsView();
            else if (validPage === 'users') renderUsersView();
            else renderDashboard();
        });

        document.getElementById('mobileMenuBtn')?.addEventListener('click', openMobileSidebar);
        document.getElementById('sidebarBackdrop')?.addEventListener('click', closeMobileSidebar);

        document.getElementById('sectionForm')?.addEventListener('submit', handleSectionSubmit);
        document.getElementById('subjectForm')?.addEventListener('submit', handleSubjectSubmit);
        document.getElementById('assignSubjectsForm')?.addEventListener('submit', handleAssignSubjectsSubmit);
        document.getElementById('studentForm')?.addEventListener('submit', handleStudentSubmit);
        document.getElementById('teacherForm')?.addEventListener('submit', handleTeacherFormSubmit);
        document.getElementById('assignSubjectTeacherForm')?.addEventListener('submit', handleAssignSubjectTeacherSubmit);
        document.getElementById('teacherRoleSelect')?.addEventListener('change', onTeacherRoleSelectChange);
        document.getElementById('requestUnlockForm')?.addEventListener('submit', handleRequestUnlockSubmit);

        document.getElementById('sectionSearchInput')?.addEventListener('input', renderSectionsView);
        document.getElementById('sectionYearFilter')?.addEventListener('change', renderSectionsView);
        document.getElementById('subjectSearchInput')?.addEventListener('input', renderSubjectsView);
        document.getElementById('assignSubjectSearch')?.addEventListener('input', renderAssignSubjectsModalList);

        document.getElementById('studentSearchInput')?.addEventListener('input', () => {
            state.studentCurrentPage = 1;
            renderStudentsView();
        });
        document.getElementById('studentYearFilter')?.addEventListener('change', () => {
            state.studentCurrentPage = 1;
            renderStudentsView();
        });
        document.getElementById('studentSectionFilter')?.addEventListener('change', e => {
            state.studentSectionId = e.target.value;
            state.studentCurrentPage = 1;
            if (state.currentView === 'students') {
                updateBrowserUrl({
                    page: 'students',
                    section_id: e.target.value ? Number(e.target.value) : null
                }, true);
            }
            renderStudentsView();
        });
        document.getElementById('studentGenderFilter')?.addEventListener('change', e => {
            state.studentGenderFilter = e.target.value;
            state.studentCurrentPage = 1;
            renderStudentsView();
        });

        // Grading View Selectors
        document.getElementById('gradingSectionSelect')?.addEventListener('change', e => {
            state.gradingSectionId = Number(e.target.value);
            const isTeacher = state.currentUser?.role === 'teacher';
            const sec = state.sections.find(s => s.id === state.gradingSectionId);
            const subs = sec?.assigned_subjects || [];
            if (isTeacher) {
                state.gradingSubjectId = subs[0] ? String(subs[0].subject_id) : '';
            } else {
                state.gradingSubjectId = 'ALL';
            }
            if (state.currentView === 'grading') {
                updateBrowserUrl({
                    page: 'grading',
                    section_id: state.gradingSectionId,
                    quarter: state.gradingQuarter,
                    subject_id: state.gradingSubjectId !== 'ALL' && state.gradingSubjectId ? state.gradingSubjectId : null
                }, true);
            }
            renderGradingView();
        });
        document.getElementById('gradingSubjectSelect')?.addEventListener('change', e => {
            state.gradingSubjectId = e.target.value;
            if (state.currentView === 'grading') {
                updateBrowserUrl({
                    page: 'grading',
                    section_id: state.gradingSectionId,
                    quarter: state.gradingQuarter,
                    subject_id: state.gradingSubjectId !== 'ALL' ? state.gradingSubjectId : null
                }, true);
            }
            renderGradingView();
        });
        document.getElementById('gradingQuarterSelect')?.addEventListener('change', e => {
            state.gradingQuarter = e.target.value;
            if (state.currentView === 'grading') {
                updateBrowserUrl({
                    page: 'grading',
                    section_id: state.gradingSectionId,
                    quarter: state.gradingQuarter,
                    subject_id: state.gradingSubjectId !== 'ALL' ? state.gradingSubjectId : null
                }, true);
            }
            renderGradingView();
        });
        document.getElementById('gradingStudentSearchInput')?.addEventListener('input', renderGradingView);
        document.getElementById('gradingGenderFilter')?.addEventListener('change', renderGradingView);

        // Reports View Selectors
        document.getElementById('reportSectionSelect')?.addEventListener('change', e => {
            state.reportSectionId = Number(e.target.value);
            if (state.currentView === 'reports') {
                updateBrowserUrl({
                    page: 'reports',
                    section_id: state.reportSectionId,
                    quarter: state.reportQuarter
                }, true);
            }
            renderReportsView();
        });
        document.getElementById('reportQuarterSelect')?.addEventListener('change', e => {
            state.reportQuarter = e.target.value;
            if (state.currentView === 'reports') {
                updateBrowserUrl({
                    page: 'reports',
                    section_id: state.reportSectionId,
                    quarter: state.reportQuarter
                }, true);
            }
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

        document.getElementById('closeMobileSidebarBtn')?.addEventListener('click', closeMobileSidebar);

        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && state.currentView === 'grading') {
                e.preventDefault();
                saveCurrentGradesSheet();
                return;
            }
            // Accessible Tab-trap inside open modals
            if (e.key === 'Tab' && activeModalsStack.length > 0) {
                const topModalId = activeModalsStack[activeModalsStack.length - 1];
                const topModal = document.getElementById(topModalId);
                if (topModal && !topModal.classList.contains('hidden')) {
                    const focusables = getFocusableElements(topModal);
                    if (focusables.length > 0) {
                        const firstEl = focusables[0];
                        const lastEl = focusables[focusables.length - 1];
                        if (e.shiftKey && document.activeElement === firstEl) {
                            e.preventDefault();
                            lastEl.focus();
                        } else if (!e.shiftKey && document.activeElement === lastEl) {
                            e.preventDefault();
                            firstEl.focus();
                        }
                    }
                }
            }
            if (e.key === 'Escape') {
                if (activeModalsStack.length > 0) {
                    e.preventDefault();
                    closeModal(activeModalsStack[activeModalsStack.length - 1]);
                    return;
                }
                closeMobileSidebar();
            }
        });
    }

    function init() {
        bindEvents();
        const urlParams = new URLSearchParams(window.location.search);
        const initialPage = urlParams.get('page') || urlParams.get('view') || (window.location.hash ? window.location.hash.replace('#', '') : 'dashboard');
        const validPage = viewMeta[initialPage] ? initialPage : 'dashboard';
        switchView(validPage, false);
        loadInitialData();
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        switchView,
        updateBrowserUrl,
        openModal,
        closeModal,
        openSectionModal,
        confirmDeleteSection,
        openSubjectModal,
        confirmDeleteSubject,
        openAssignSubjectsModal,
        openReorderSubjectsModal,
        openReorderFromAssignModal,
        moveSubjectInDraft,
        moveSubjectToTopInDraft,
        setSubjectPositionInDraft,
        resetSubjectOrderToAlphabetical,
        saveSubjectOrder,
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
        setStudentSectionFilter,
        setStudentGenderFilter,
        setStudentPageSize,
        setStudentPage,
        openStudentSubjectsModal,
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
        jumpToNextEmptyGradeCell,
        applyPresetToActiveCell,
        toggleGradingFormulaView,
        updateMissingGradesCounter,
        onLiveGradeCellInput,
        onMasterSheetCellInput,
        saveCurrentGradesSheet,
        openSectionReport,
        openGradingForReportSection,
        setDashboardSection,
        setDashboardGenderFilter,
        setDashboardPageSize,
        setDashboardPage,
        onDashboardStudentSearch,
        openDashboardActiveSectionStudentModal,
        printReport,
        setSectionViewMode,
        toggleSectionCurriculumExpand,
        renderUsersView,
        openTeacherModal,
        onTeacherRoleSelectChange,
        toggleTeacherPermission,
        confirmDeleteTeacher,
        lockCurrentGradesSheet,
        openRequestUnlockModal,
        openReviewUnlockModal,
        submitUnlockDecision,
        toggleGradeLockDirect,
        openAssignSubjectTeacherModal,
        onAstTeacherChange,
        renderAstSectionsList,
        renderAstSubjectsList,
        onAstSectionToggle,
        onAstSubjectToggle,
        astToggleAllSections,
        astToggleAllSubjects,
        handleAssignSubjectTeacherSubmit,
        openTeacherModalFromAssign,
        onAssignTeacherSelectChange,
    };
})();


