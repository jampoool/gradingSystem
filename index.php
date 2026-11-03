<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
$currentUser = requireLoginPage();
$isAdminUser = ($currentUser['role'] ?? '') === 'admin';
$dbStatus = getDatabaseStatus();

$requestedPage = $_GET['page'] ?? $_GET['view'] ?? 'dashboard';
$allowedPages = ['dashboard', 'sections', 'subjects', 'students', 'grading', 'reports', 'users'];
if (!in_array($requestedPage, $allowedPages, true)) {
    $requestedPage = 'dashboard';
}
if ($requestedPage === 'users' && !$isAdminUser) {
    $requestedPage = 'dashboard';
}

require_once __DIR__ . '/includes/header.php';
?>
    <!-- App Shell (Academic Prestige — 60% Cloud White #F5F7FA / 30% Midnight Navy #17243A / 10% Semantic Accents) -->
    <div class="min-h-screen lg:h-screen lg:overflow-hidden w-full flex flex-col lg:flex-row bg-[#F5F7FA]">
        <?php require_once __DIR__ . '/includes/sidebar.php'; ?>

        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col min-w-0 lg:h-full lg:overflow-hidden">
            <?php require_once __DIR__ . '/includes/navbar.php'; ?>

            <!-- Page Container (Full Width & Full Height Flex — No Blank Space) -->
            <main id="mainContent" tabindex="-1" class="flex-1 flex flex-col min-h-0 w-full max-w-none p-3.5 sm:p-5 overflow-y-auto custom-scrollbar gap-4 outline-none">

                <?php if (!$dbStatus['connected']): ?>
                <!-- Database Connection Alert (Berry Plum Danger #F5DFEB / #842D60) -->
                <div class="rounded-2xl bg-[#F5DFEB] border border-[#E2B8CF] p-4 flex items-start gap-3 text-[#842D60] shrink-0" role="alert">
                    <svg class="w-5 h-5 text-[#9B3F72] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <div class="text-sm">
                        <h3 class="font-bold">Database Connection Error</h3>
                        <p class="mt-1"><?= htmlspecialchars($dbStatus['error'] ?? 'Unable to connect to MySQL.') ?></p>
                    </div>
                </div>
                <?php endif; ?>

                <!-- Setup / Empty State Onboarding Banner (Midnight Navy #17243A & Slate Blue #5276A7) -->
                <div id="onboardingBanner" class="hidden rounded-2xl bg-gradient-to-r from-[#17243A] via-[#243752] to-[#5276A7] text-white p-5 shadow-md shrink-0">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div class="space-y-1.5 max-w-3xl">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 text-slate-100">
                                Quick Start Setup
                            </span>
                            <h3 class="font-display text-lg sm:text-xl font-bold">Welcome to GradeFlow Academic Management!</h3>
                            <p class="text-slate-200 text-sm leading-relaxed">
                                Load the 28-unit sample curriculum, students, and quarterly grades with one click to test the weighted formula <code class="bg-white/15 px-1.5 py-0.5 rounded font-mono text-xs">(((E21*4)+(F21*4)...)/28)</code>, passing/failing analytics, and automated honor pullout.
                            </p>
                        </div>
                        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
                            <button type="button" onclick="App.seedSampleData()" class="px-4 py-2.5 rounded-xl bg-white text-[#17243A] hover:bg-[#F5F7FA] font-bold text-sm shadow-sm transition cursor-pointer">
                                Load Sample Data
                            </button>
                            <button type="button" onclick="App.openSectionModal()" class="admin-only px-4 py-2.5 rounded-xl bg-[#17243A]/70 hover:bg-[#17243A] text-white font-semibold text-sm border border-white/25 transition cursor-pointer">
                                + Create First Section
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ==================== VIEW 1: OVERVIEW DASHBOARD ==================== -->
                <section id="view-dashboard" class="view-panel <?= $requestedPage === 'dashboard' ? '' : 'hidden' ?> space-y-4">
                    <!-- Top Row: Academic Prestige KPI & Passing / At-Risk Rate Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3.5 shrink-0">
                        <!-- Passing Students Rate (Deep Teal #0F766E / Pale Mint #D5F0EA) -->
                        <div role="button" tabindex="0" onclick="App.switchView('reports')" onkeydown="if(event.key==='Enter'||event.key===' '){App.switchView('reports');event.preventDefault();}" aria-label="Passing Students rate: click to view reports and honor roll" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#0F766E] transition cursor-pointer group flex flex-col justify-between">
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-xs font-bold uppercase tracking-wider text-[#475569]">Passing Students</span>
                                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                                    <span>&#10003; Passing</span>
                                </span>
                            </div>
                            <div class="mt-2 flex items-baseline justify-between">
                                <p id="statPassingRate" class="font-display text-2xl sm:text-3xl font-extrabold text-[#0F766E]">0.0%</p>
                                <span id="statPassingCount" class="text-xs font-semibold text-[#475569]">0 passed (&ge;75)</span>
                            </div>
                        </div>

                        <!-- Students at Risk Rate (Berry Plum #9B3F72 / Soft Rose #F5DFEB / Dark Berry #842D60) -->
                        <div role="button" tabindex="0" onclick="App.switchView('grading')" onkeydown="if(event.key==='Enter'||event.key===' '){App.switchView('grading');event.preventDefault();}" aria-label="Students at Risk rate: click to view and input grades" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#9B3F72] transition cursor-pointer group flex flex-col justify-between">
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-xs font-bold uppercase tracking-wider text-[#475569]">Students at Risk</span>
                                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]">
                                    <span>&#9888; Failing</span>
                                </span>
                            </div>
                            <div class="mt-2 flex items-baseline justify-between">
                                <p id="statRiskRate" class="font-display text-2xl sm:text-3xl font-extrabold text-[#842D60]">0.0%</p>
                                <span id="statRiskCount" class="text-xs font-semibold text-[#475569]">0 failing (&lt;75)</span>
                            </div>
                        </div>

                        <!-- Total Students (Midnight Navy #17243A) -->
                        <div role="button" tabindex="0" onclick="App.switchView('students')" onkeydown="if(event.key==='Enter'||event.key===' '){App.switchView('students');event.preventDefault();}" aria-label="Total Students: click to view student directory" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#5276A7] transition cursor-pointer group flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold uppercase tracking-wider text-[#475569]">Total Students</p>
                                <p id="statStudents" class="font-display text-2xl sm:text-3xl font-extrabold text-[#17243A] mt-1">0</p>
                                <p class="text-xs text-[#5276A7] font-semibold mt-1 group-hover:underline">Student directory &rarr;</p>
                            </div>
                            <div class="w-11 h-11 rounded-2xl bg-[#EBF1F8] text-[#5276A7] flex items-center justify-center group-hover:bg-[#17243A] group-hover:text-white transition shrink-0">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                            </div>
                        </div>

                        <!-- Active Sections -->
                        <div role="button" tabindex="0" onclick="App.switchView('sections')" onkeydown="if(event.key==='Enter'||event.key===' '){App.switchView('sections');event.preventDefault();}" aria-label="Active Sections: click to manage curriculum and sections" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#5276A7] transition cursor-pointer group flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold uppercase tracking-wider text-[#475569]">Active Sections</p>
                                <p id="statSections" class="font-display text-2xl sm:text-3xl font-extrabold text-[#17243A] mt-1">0</p>
                                <p class="text-xs text-[#5276A7] font-semibold mt-1 group-hover:underline">Manage sections &rarr;</p>
                            </div>
                            <div class="w-11 h-11 rounded-2xl bg-[#EBF1F8] text-[#5276A7] flex items-center justify-center group-hover:bg-[#17243A] group-hover:text-white transition shrink-0">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                                </svg>
                            </div>
                        </div>

                        <!-- Catalog Subjects -->
                        <div role="button" tabindex="0" onclick="App.switchView('subjects')" onkeydown="if(event.key==='Enter'||event.key===' '){App.switchView('subjects');event.preventDefault();}" aria-label="Catalog Subjects: click to manage subjects and units" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#5276A7] transition cursor-pointer group flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold uppercase tracking-wider text-[#475569]">Catalog Subjects</p>
                                <p id="statSubjects" class="font-display text-2xl sm:text-3xl font-extrabold text-[#17243A] mt-1">0</p>
                                <p class="text-xs text-[#5276A7] font-semibold mt-1 group-hover:underline">Weighted units &rarr;</p>
                            </div>
                            <div class="w-11 h-11 rounded-2xl bg-[#EBF1F8] text-[#5276A7] flex items-center justify-center group-hover:bg-[#17243A] group-hover:text-white transition shrink-0">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                            </div>
                        </div>

                        <!-- Subject Loads & Honor Roll -->
                        <div role="button" tabindex="0" onclick="App.switchView('reports')" onkeydown="if(event.key==='Enter'||event.key===' '){App.switchView('reports');event.preventDefault();}" aria-label="Subject Loads: click to view rankings and reports" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#0F766E] transition cursor-pointer group flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold uppercase tracking-wider text-[#475569]">Subject Loads</p>
                                <p id="statAssignments" class="font-display text-2xl sm:text-3xl font-extrabold text-[#17243A] mt-1">0</p>
                                <p class="text-xs text-[#0F766E] font-semibold mt-1 group-hover:underline">Honor ranking &rarr;</p>
                            </div>
                            <div class="w-11 h-11 rounded-2xl bg-[#D5F0EA] text-[#0F766E] flex items-center justify-center group-hover:bg-[#0F766E] group-hover:text-white transition shrink-0">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Main Dashboard Split Grid (Stretches to Fill Remaining Height) -->
                    <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-0">
                        <!-- Left: Section Breadcrumb Pill Switcher & Enrolled Students Table (Default 10 Entries, Adjustable) -->
                        <div class="xl:col-span-8 bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex flex-col min-h-0 overflow-hidden">
                            <!-- Panel Header -->
                            <div class="px-4 py-3.5 border-b border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2 shrink-0">
                                <div>
                                    <h3 class="font-display font-bold text-[#17243A] text-base">Section Explorer &amp; Enrolled Students</h3>
                                    <p class="text-xs text-[#475569] mt-0.5">Click a section pill below to switch sections, view enrolled students, and adjust entries shown</p>
                                </div>
                                <div class="flex flex-wrap items-center gap-2">
                                    <button type="button" onclick="App.openSectionModal()" class="admin-only text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] px-3.5 py-1.5 rounded-xl transition cursor-pointer">
                                        + New Section
                                    </button>
                                    <button type="button" onclick="App.switchView('sections')" class="text-xs font-semibold text-[#5276A7] hover:text-[#17243A] px-2.5 py-1.5 rounded-xl hover:bg-[#F5F7FA] transition cursor-pointer">
                                        Manage All &rarr;
                                    </button>
                                </div>
                            </div>

                            <!-- Section Breadcrumb Pills Bar (Switch Active Section) -->
                            <div id="dashboardSectionPillsBar" class="px-4 py-2.5 bg-[#F5F7FA] border-b border-[#D8DEE8] flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
                                <!-- Populated by JS -->
                            </div>

                            <!-- Active Section Content & Paginated Students List (Default 10 Entries) -->
                            <div id="dashboardSectionsList" class="p-4 space-y-3.5 flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
                                <!-- Populated by JS -->
                            </div>
                        </div>

                        <!-- Right: Student Grade Overview (Synced with Selected Section or All Students) -->
                        <div class="xl:col-span-4 bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex flex-col min-h-0 overflow-hidden">
                            <div class="px-4 py-3.5 border-b border-[#D8DEE8] flex items-center justify-between gap-2 shrink-0">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h3 class="font-display font-bold text-[#17243A] text-base">Student Grade Overview</h3>
                                        <span id="dashboardOverviewSectionBadge" class="px-2 py-0.5 rounded-md text-xs font-bold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]">All</span>
                                    </div>
                                    <p class="text-xs text-[#475569] mt-0.5">Live weighted score &amp; policy status (&ge;75 Passing)</p>
                                </div>
                                <div class="flex items-center gap-1.5 can-add-student-only">
                                    <button type="button" onclick="App.openDashboardActiveSectionStudentModal('bulk')" class="text-xs font-semibold text-[#2C4870] bg-[#EBF1F8] hover:bg-[#D8E4F3] border border-[#C5D6EB] px-2.5 py-1.5 rounded-xl transition cursor-pointer" title="Bulk add multiple students (1 per line) to active section">
                                        + Bulk Add
                                    </button>
                                    <button type="button" onclick="App.openDashboardActiveSectionStudentModal('single')" class="text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] px-3 py-1.5 rounded-xl transition cursor-pointer" title="Enroll student to active section">
                                        + Enroll
                                    </button>
                                </div>
                            </div>
                            <div id="dashboardStudentsList" class="p-3.5 divide-y divide-[#D8DEE8]/60 flex-1 overflow-y-auto custom-scrollbar">
                                <!-- Populated by JS -->
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ==================== VIEW 2: SECTIONS & SUBJECT ASSIGNMENTS ==================== -->
                <section id="view-sections" class="view-panel <?= $requestedPage === 'sections' ? '' : 'hidden' ?> space-y-4">
                    <!-- Top Summary KPI Strip -->
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                        <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex items-center gap-3.5">
                            <div class="w-11 h-11 rounded-xl bg-[#EBF1F8] text-[#2C4870] flex items-center justify-center shrink-0 font-bold">
                                <svg class="w-5 h-5 text-[#2C4870]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                                </svg>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-[#475569] uppercase tracking-wider">Active Sections</p>
                                <p id="secStatTotal" class="text-xl font-bold font-display text-[#17243A]">0</p>
                            </div>
                        </div>

                        <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex items-center gap-3.5">
                            <div class="w-11 h-11 rounded-xl bg-[#D5F0EA] text-[#0F766E] flex items-center justify-center shrink-0 font-bold">
                                <svg class="w-5 h-5 text-[#0F766E]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                            </div>
                            <div>
                                <div class="flex items-center gap-1.5">
                                    <p class="text-xs font-semibold text-[#475569] uppercase tracking-wider">Enrolled Students</p>
                                </div>
                                <p id="secStatStudents" class="text-xl font-bold font-display text-[#0F766E]">0</p>
                            </div>
                        </div>

                        <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex items-center gap-3.5">
                            <div class="w-11 h-11 rounded-xl bg-[#EBF1F8] text-[#5276A7] flex items-center justify-center shrink-0 font-bold">
                                <svg class="w-5 h-5 text-[#5276A7]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-[#475569] uppercase tracking-wider">Curriculum Loads</p>
                                <p id="secStatLoads" class="text-xl font-bold font-display text-[#5276A7]">0</p>
                            </div>
                        </div>

                        <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex items-center gap-3.5">
                            <div class="w-11 h-11 rounded-xl bg-[#FFF0D1] text-[#80530F] flex items-center justify-center shrink-0 font-bold">
                                <svg class="w-5 h-5 text-[#B7791F]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-[#475569] uppercase tracking-wider">Avg Class Size</p>
                                <p id="secStatAvgClass" class="text-xl font-bold font-display text-[#80530F]">0</p>
                            </div>
                        </div>
                    </div>

                    <!-- Toolbar & Filters -->
                    <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                        <div class="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
                            <div class="relative flex-1">
                                <svg class="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                                <input type="text" id="sectionSearchInput" aria-label="Search sections by name, year level, adviser, or subjects" placeholder="Search sections, year level, adviser, or assigned subjects..." class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                            </div>
                            <select id="sectionYearFilter" aria-label="Filter sections by year level" class="px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] font-medium focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                <option value="">All Year Levels</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                                <option value="Grade 7">Grade 7</option>
                                <option value="Grade 8">Grade 8</option>
                                <option value="Grade 9">Grade 9</option>
                                <option value="Grade 10">Grade 10</option>
                                <option value="Grade 11">Grade 11</option>
                                <option value="Grade 12">Grade 12</option>
                            </select>

                            <!-- View Mode Switcher: Cards Grid vs Table Directory -->
                            <div class="inline-flex items-center rounded-xl border border-[#D8DEE8] p-1 bg-[#F5F7FA] shrink-0" role="group" aria-label="Sections view mode">
                                <button type="button" id="secViewGridBtn" onclick="App.setSectionViewMode('grid')" class="px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer bg-[#17243A] text-white shadow-xs" title="Cards Grid View">
                                    <span class="mr-1">⊞</span> Grid
                                </button>
                                <button type="button" id="secViewTableBtn" onclick="App.setSectionViewMode('table')" class="px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer text-[#475569] hover:text-[#17243A]" title="Directory Table View">
                                    <span class="mr-1">☰</span> Table
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0">
                            <button type="button" onclick="App.openAssignSubjectTeacherModal()" class="admin-only inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#0F766E] bg-[#D5F0EA] hover:bg-[#c2e8df] border border-[#99D8CC] transition cursor-pointer" title="Assign a specific subject to a teacher">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                                <span>Assign Teaching Loads</span>
                            </button>
                            <button type="button" onclick="App.openSectionModal()" class="admin-only inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer shrink-0">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                                </svg>
                                <span>Create New Section</span>
                            </button>
                        </div>
                    </div>

                    <!-- Container 1: Clean Balanced Cards Grid -->
                    <div id="sectionsGridContainer" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5 flex-1 content-start">
                        <!-- Populated by JS -->
                    </div>

                    <!-- Container 2: Compact Table Directory -->
                    <div id="sectionsTableContainer" class="bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex-1 flex-col min-h-0 overflow-hidden hidden">
                        <div class="flex-1 overflow-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse text-xs sm:text-sm" aria-label="Sections Directory Table">
                                <thead class="sticky top-0 z-10">
                                    <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#475569]">
                                        <th scope="col" class="py-3 px-4 w-12 text-center">#</th>
                                        <th scope="col" class="py-3 px-4">Section Name</th>
                                        <th scope="col" class="py-3 px-4">Year Level</th>
                                        <th scope="col" class="py-3 px-4">Adviser</th>
                                        <th scope="col" class="py-3 px-4">Students Enrolled</th>
                                        <th scope="col" class="py-3 px-4">Curriculum Load</th>
                                        <th scope="col" class="py-3 px-4 text-right">Quick Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="sectionsTableBody" class="divide-y divide-[#D8DEE8]/70">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <!-- ==================== VIEW 3: MANAGE SUBJECTS ==================== -->
                <section id="view-subjects" class="view-panel <?= $requestedPage === 'subjects' ? '' : 'hidden' ?> space-y-4">
                    <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                        <div class="relative flex-1">
                            <svg class="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <input type="text" id="subjectSearchInput" aria-label="Search catalog subjects by code, title, or description" placeholder="Search subjects by code, descriptive title, or description..." class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                        </div>
                        <button type="button" onclick="App.openSubjectModal()" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer shrink-0">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                            </svg>
                            <span>Add New Subject</span>
                        </button>
                    </div>

                    <div class="bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div class="flex-1 overflow-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse" aria-label="Data Table">
                                <thead class="sticky top-0 z-10">
                                    <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#475569]">
                                        <th scope="col" class="py-3.5 px-4">Subject Code</th>
                                        <th scope="col" class="py-3.5 px-4">Subject Name &amp; Description</th>
                                        <th scope="col" class="py-3.5 px-4 text-center">Units (Weight)</th>
                                        <th scope="col" class="py-3.5 px-4">Assigned Sections</th>
                                        <th scope="col" class="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="subjectsTableBody" class="divide-y divide-[#D8DEE8]/70 text-sm">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <!-- ==================== VIEW 4: STUDENT DIRECTORY ==================== -->
                <section id="view-students" class="view-panel <?= $requestedPage === 'students' ? '' : 'hidden' ?> space-y-4">
                    <!-- Top Metric Cards / Quick Summary -->
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                        <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex items-center gap-3.5">
                            <div class="w-11 h-11 rounded-xl bg-[#EBF1F8] text-[#17243A] flex items-center justify-center shrink-0 font-bold">
                                <svg class="w-5 h-5 text-[#2C4870]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-[#475569] uppercase tracking-wider">Total Enrolled</p>
                                <p id="studentStatTotal" class="text-xl font-bold font-display text-[#17243A]">0</p>
                            </div>
                        </div>

                        <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex items-center gap-3.5">
                            <div class="w-11 h-11 rounded-xl bg-[#F5DFEB] text-[#842D60] flex items-center justify-center shrink-0 font-bold text-lg">
                                &#9792;
                            </div>
                            <div>
                                <div class="flex items-center gap-1.5">
                                    <p class="text-xs font-semibold text-[#475569] uppercase tracking-wider">Female Students</p>
                                    <span id="studentStatFemalePct" class="px-1.5 py-0.2 rounded text-[11px] font-bold bg-[#F5DFEB] text-[#842D60]">0%</span>
                                </div>
                                <p id="studentStatFemale" class="text-xl font-bold font-display text-[#842D60]">0</p>
                            </div>
                        </div>

                        <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex items-center gap-3.5">
                            <div class="w-11 h-11 rounded-xl bg-[#EBF1F8] text-[#2C4870] flex items-center justify-center shrink-0 font-bold text-lg">
                                &#9794;
                            </div>
                            <div>
                                <div class="flex items-center gap-1.5">
                                    <p class="text-xs font-semibold text-[#475569] uppercase tracking-wider">Male Students</p>
                                    <span id="studentStatMalePct" class="px-1.5 py-0.2 rounded text-[11px] font-bold bg-[#EBF1F8] text-[#2C4870]">0%</span>
                                </div>
                                <p id="studentStatMale" class="text-xl font-bold font-display text-[#2C4870]">0</p>
                            </div>
                        </div>

                        <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex items-center gap-3.5">
                            <div class="w-11 h-11 rounded-xl bg-[#D5F0EA] text-[#0F766E] flex items-center justify-center shrink-0 font-bold">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                                </svg>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-[#475569] uppercase tracking-wider">Active Sections</p>
                                <p id="studentStatSections" class="text-xl font-bold font-display text-[#0F766E]">0</p>
                            </div>
                        </div>
                    </div>

                    <!-- Filter & Toolbar Bar -->
                    <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs space-y-3 shrink-0">
                        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div class="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
                                <!-- Search -->
                                <div class="relative flex-1">
                                    <svg class="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                    </svg>
                                    <input type="text" id="studentSearchInput" placeholder="Search by student name, ID number, or section..." class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                </div>

                                <!-- Year Level Filter -->
                                <select id="studentYearFilter" aria-label="Filter students by year level" class="px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] font-medium focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                    <option value="">All Year Levels</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                    <option value="Grade 7">Grade 7</option>
                                    <option value="Grade 8">Grade 8</option>
                                    <option value="Grade 9">Grade 9</option>
                                    <option value="Grade 10">Grade 10</option>
                                    <option value="Grade 11">Grade 11</option>
                                    <option value="Grade 12">Grade 12</option>
                                </select>

                                <!-- Gender Filter Segmented Buttons -->
                                <div class="inline-flex items-center rounded-xl border border-[#D8DEE8] p-1 bg-[#F5F7FA] shrink-0" role="group" aria-label="Filter by gender">
                                    <button type="button" id="sgfBtnAll" onclick="App.setStudentGenderFilter('')" class="px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer bg-[#17243A] text-white shadow-xs">
                                        All
                                    </button>
                                    <button type="button" id="sgfBtnFemale" onclick="App.setStudentGenderFilter('Female')" class="px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer text-[#475569] hover:text-[#17243A]">
                                        &#9792; Female
                                    </button>
                                    <button type="button" id="sgfBtnMale" onclick="App.setStudentGenderFilter('Male')" class="px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer text-[#475569] hover:text-[#17243A]">
                                        &#9794; Male
                                    </button>
                                </div>
                                <select id="studentGenderFilter" class="hidden" aria-hidden="true">
                                    <option value="">All</option>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                </select>
                                <select id="studentSectionFilter" class="hidden" aria-hidden="true">
                                    <option value="">All Sections</option>
                                </select>

                                <button type="button" id="resetStudentFiltersBtn" onclick="App.resetStudentFilters()" class="hidden px-3 py-2 text-xs font-semibold text-[#475569] hover:text-[#17243A] bg-[#F5F7FA] hover:bg-[#D8DEE8]/60 rounded-xl transition cursor-pointer shrink-0">
                                    Reset
                                </button>
                            </div>

                            <div class="flex flex-wrap items-center gap-2 shrink-0 can-add-student-only">
                                <button type="button" onclick="App.openStudentModal(null, null, 'bulk')" class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#5276A7] hover:bg-[#3E5F8A] shadow-2xs transition cursor-pointer">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
                                    </svg>
                                    <span>Bulk Add</span>
                                </button>
                                <button type="button" onclick="App.openStudentModal()" class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                                    </svg>
                                    <span>Add New Student</span>
                                </button>
                            </div>
                        </div>

                        <!-- Section Switcher Pill Bar -->
                        <div class="pt-2 border-t border-[#D8DEE8]/70 flex items-center gap-2 overflow-x-auto custom-scrollbar" id="studentSectionPillsBar">
                            <!-- Populated dynamically by JS -->
                        </div>
                    </div>

                    <!-- Clean Structured Student Directory Table -->
                    <div class="bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div class="flex-1 overflow-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse text-xs sm:text-sm" aria-label="Student Directory Table">
                                <thead class="sticky top-0 z-10">
                                    <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#475569]">
                                        <th scope="col" class="py-3 px-3.5 w-12 text-center">#</th>
                                        <th scope="col" class="py-3 px-3.5">Student ID</th>
                                        <th scope="col" class="py-3 px-3.5">Student Name</th>
                                        <th scope="col" class="py-3 px-3.5">Gender</th>
                                        <th scope="col" class="py-3 px-3.5">Section &amp; Level</th>
                                        <th scope="col" class="py-3 px-3.5">Curriculum / Subjects</th>
                                        <th scope="col" class="py-3 px-3.5">Status</th>
                                        <th scope="col" class="py-3 px-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="studentsTableBody" class="divide-y divide-[#D8DEE8]/70">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination Footer -->
                        <div id="studentPaginationContainer" class="px-4 py-3 bg-[#F5F7FA] border-t border-[#D8DEE8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#475569] shrink-0">
                            <!-- Populated dynamically by JS -->
                        </div>
                    </div>
                </section>

                <!-- ==================== VIEW 5: TEACHER GRADE INPUT PER SECTION ==================== -->
                <section id="view-grading" class="view-panel <?= $requestedPage === 'grading' ? '' : 'hidden' ?> space-y-4">
                    <!-- Top Grade Controls Bar -->
                    <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs space-y-3.5 shrink-0">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-end">
                            <div class="lg:col-span-3">
                                <label for="gradingSectionSelect" class="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">1. Select Section</label>
                                <select id="gradingSectionSelect" class="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                    <!-- Populated by JS -->
                                </select>
                            </div>

                            <div class="lg:col-span-4">
                                <label for="gradingSubjectSelect" class="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">2. Select Subject (or Master Sheet)</label>
                                <select id="gradingSubjectSelect" class="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                    <!-- Populated by JS -->
                                </select>
                            </div>

                            <div class="lg:col-span-2">
                                <label class="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">3. Grading Period</label>
                                <div class="grid grid-cols-4 gap-1 bg-[#F5F7FA] p-1 rounded-xl border border-[#D8DEE8]">
                                    <button type="button" data-qtr-btn="Q1" onclick="App.setGradingQuarter('Q1')" class="qtr-tab-btn px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#17243A] text-white shadow-2xs transition cursor-pointer text-center">Q1</button>
                                    <button type="button" data-qtr-btn="Q2" onclick="App.setGradingQuarter('Q2')" class="qtr-tab-btn px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#475569] hover:text-[#17243A] transition cursor-pointer text-center">Q2</button>
                                    <button type="button" data-qtr-btn="Q3" onclick="App.setGradingQuarter('Q3')" class="qtr-tab-btn px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#475569] hover:text-[#17243A] transition cursor-pointer text-center">Q3</button>
                                    <button type="button" data-qtr-btn="Q4" onclick="App.setGradingQuarter('Q4')" class="qtr-tab-btn px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#475569] hover:text-[#17243A] transition cursor-pointer text-center">Q4</button>
                                </div>
                                <select id="gradingQuarterSelect" class="hidden" aria-hidden="true">
                                    <option value="Q1">1st Quarter (Q1)</option>
                                    <option value="Q2">2nd Quarter (Q2)</option>
                                    <option value="Q3">3rd Quarter (Q3)</option>
                                    <option value="Q4">4th Quarter (Q4)</option>
                                </select>
                            </div>

                            <div class="lg:col-span-3 flex flex-wrap items-center justify-end gap-2">
                                <label class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5F7FA] border border-[#D8DEE8] text-xs font-semibold text-[#17243A] cursor-pointer select-none" title="Automatically saves each grade when you press Enter or move to the next cell">
                                    <input type="checkbox" id="autoSaveGradesToggle" checked class="w-4 h-4 rounded text-[#17243A] focus:ring-[#5276A7] border-[#D8DEE8]">
                                    <span>Auto-Save</span>
                                </label>
                                <span id="gradingSaveStatusBadge" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                                    <span class="w-2 h-2 rounded-full bg-[#0F766E]"></span>
                                    <span>All Saved &#10003;</span>
                                </span>
                                <button type="button" id="saveGradesBtn" onclick="App.saveCurrentGradesSheet()" class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                    </svg>
                                    <span>Save All</span>
                                </button>
                                <div id="gradingLockActionsContainer" class="inline-flex items-center gap-2"></div>
                            </div>
                        </div>

                        <!-- Subject Quick-Switch Tabs & Quick Fill Bar -->
                        <div class="pt-3 border-t border-[#D8DEE8] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                            <div class="flex items-center gap-2 flex-1 min-w-0">
                                <button type="button" onclick="App.openReorderSubjectsModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EBF1F8] text-[#2C4870] hover:bg-[#D8E4F3] border border-[#C5D5EA] transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs" title="Customize which subject comes first (Col E), second, etc.">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                                    </svg>
                                    <span>Order Subjects</span>
                                </button>
                                <div id="gradingSubjectTabs" class="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 flex-1">
                                    <!-- Populated by JS -->
                                </div>
                            </div>

                            <div class="flex flex-wrap items-center gap-2 shrink-0 can-add-student-only">
                                <div class="relative">
                                    <svg class="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                    </svg>
                                    <input type="text" id="gradingStudentSearchInput" placeholder="Filter student..." class="pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] outline-none w-44 sm:w-52">
                                </div>

                                <select id="gradingGenderFilter" aria-label="Filter grade sheet by gender" class="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] outline-none">
                                    <option value="">All (Female &amp; Male)</option>
                                    <option value="Female">Female Only</option>
                                    <option value="Male">Male Only</option>
                                </select>

                                <!-- Missing Grades Counter Badge & Jump Button -->
                                <button type="button" id="jumpToNextEmptyBtn" onclick="App.jumpToNextEmptyGradeCell()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0c5f58] shadow-2xs transition cursor-pointer" title="Find and jump directly to the next missing grade cell (Shortcut: Alt+N or Ctrl+Enter)">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                    <span>Next Missing</span>
                                    <span id="gradingMissingCountBadge" class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25 text-white font-mono">0</span>
                                </button>

                                <div class="inline-flex items-center gap-1 bg-[#F5F7FA] px-2.5 py-1.5 rounded-xl border border-[#D8DEE8] text-xs">
                                    <span class="text-[#475569] font-semibold mr-1">Fill Empty:</span>
                                    <button type="button" onclick="App.quickFillEmptyGrades(85)" class="px-2 py-0.5 rounded-md bg-white hover:bg-[#EBF1F8] text-[#17243A] font-semibold border border-[#D8DEE8] transition cursor-pointer">85</button>
                                    <button type="button" onclick="App.quickFillEmptyGrades(88)" class="px-2 py-0.5 rounded-md bg-white hover:bg-[#EBF1F8] text-[#17243A] font-semibold border border-[#D8DEE8] transition cursor-pointer">88</button>
                                    <button type="button" onclick="App.quickFillEmptyGrades(90)" class="px-2 py-0.5 rounded-md bg-white hover:bg-[#D5F0EA] text-[#0F766E] font-bold border border-[#99D8CC] transition cursor-pointer">90</button>
                                    <button type="button" onclick="App.quickFillEmptyGrades(92)" class="px-2 py-0.5 rounded-md bg-white hover:bg-[#D5F0EA] text-[#0F766E] font-bold border border-[#99D8CC] transition cursor-pointer">92</button>
                                    <button type="button" onclick="App.quickFillEmptyGrades(95)" class="px-2 py-0.5 rounded-md bg-white hover:bg-[#D5F0EA] text-[#0F766E] font-bold border border-[#99D8CC] transition cursor-pointer">95</button>
                                </div>

                                <button type="button" onclick="App.openQuarterlyReportForActiveSection()" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#5276A7] hover:bg-[#3E5F8A] transition cursor-pointer">
                                    <span>View Ranking &rarr;</span>
                                </button>
                            </div>
                        </div>

                        <!-- Active Formula & Keyboard Hint Banner (Midnight Navy #17243A) -->
                        <div id="gradingLockNoticeBanner" class="hidden rounded-xl p-3 border text-xs flex flex-wrap items-center justify-between gap-2"></div>

                        <!-- Interactive Active Student Guidance Strip & Speed Bar -->
                        <div id="activeGradingGuideStrip" class="rounded-2xl bg-gradient-to-r from-[#17243A] via-[#1E2E48] to-[#17243A] border border-[#2C4870] shadow-sm text-white p-3.5 transition-all">
                            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                <!-- Student & Subject Details -->
                                <div class="flex items-center gap-3 min-w-0">
                                    <div id="activeGuideAvatar" class="w-10 h-10 rounded-xl bg-[#5276A7]/30 border border-[#5276A7]/50 flex items-center justify-center font-bold text-sm text-[#D5F0EA] shrink-0">
                                        <svg class="w-5 h-5 text-[#B8CCE6]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <h4 id="activeGuideStudentName" class="font-display font-bold text-sm sm:text-base text-white truncate">Fast Grade Entry Assistant</h4>
                                            <span id="activeGuideStudentMeta" class="text-xs text-slate-300">Click any cell or press Enter to begin</span>
                                            <span id="activeGuideSubjectBadge" class="hidden px-2 py-0.5 rounded-lg text-xs font-semibold bg-[#5276A7]/40 text-[#D5F0EA] border border-[#5276A7]/60"></span>
                                        </div>
                                        <div class="flex items-center gap-2.5 mt-1 flex-wrap text-xs text-slate-300">
                                            <span id="activeGuideGradeStatus" class="inline-flex items-center gap-1 font-semibold text-slate-200">
                                                <span>⌨️ Navigation: <kbd class="px-1.5 py-0.5 rounded bg-black/30 font-mono text-white text-[11px]">Enter</kbd> Down &bull; <kbd class="px-1.5 py-0.5 rounded bg-black/30 font-mono text-white text-[11px]">Tab</kbd> Next Subj</span>
                                            </span>
                                            <span class="text-slate-500">&bull;</span>
                                            <span id="activeGuideStanding" class="text-slate-300">Weighted averages calculate live</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Quick Presets & Guidance Controls on Active Student -->
                                <div class="flex flex-wrap items-center gap-2 shrink-0">
                                    <!-- Apply Preset to Active Cell & Move Down -->
                                    <div class="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/15 text-xs">
                                        <span class="text-slate-300 text-[11px] font-semibold mr-1">Apply &amp; &darr;:</span>
                                        <button type="button" onclick="App.applyPresetToActiveCell(85)" class="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white text-white hover:text-[#17243A] font-bold text-xs transition cursor-pointer" title="Apply 85 to current student and move to next">85</button>
                                        <button type="button" onclick="App.applyPresetToActiveCell(88)" class="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white text-white hover:text-[#17243A] font-bold text-xs transition cursor-pointer" title="Apply 88 to current student and move to next">88</button>
                                        <button type="button" onclick="App.applyPresetToActiveCell(90)" class="px-2 py-0.5 rounded-lg bg-[#0F766E] hover:bg-[#D5F0EA] text-white hover:text-[#0F766E] font-bold text-xs transition cursor-pointer" title="Apply 90 (Honors) to current student and move to next">90</button>
                                        <button type="button" onclick="App.applyPresetToActiveCell(92)" class="px-2 py-0.5 rounded-lg bg-[#0F766E] hover:bg-[#D5F0EA] text-white hover:text-[#0F766E] font-bold text-xs transition cursor-pointer" title="Apply 92 to current student and move to next">92</button>
                                        <button type="button" onclick="App.applyPresetToActiveCell(95)" class="px-2 py-0.5 rounded-lg bg-[#0F766E] hover:bg-[#D5F0EA] text-white hover:text-[#0F766E] font-bold text-xs transition cursor-pointer" title="Apply 95 to current student and move to next">95</button>
                                    </div>

                                    <!-- Next Missing Jump Button -->
                                    <button type="button" onclick="App.jumpToNextEmptyGradeCell()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F766E] hover:bg-[#13978d] transition cursor-pointer shadow-2xs" title="Jump directly to next unfilled student cell (Shortcut: Alt+N or Ctrl+Enter)">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                        <span>Next Empty</span>
                                        <span id="activeGuideMissingPill" class="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">0</span>
                                    </button>

                                    <!-- Keyboard Navigation Hints Pill -->
                                    <div class="hidden xl:inline-flex items-center gap-1 text-[11px] text-slate-300 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10 select-none">
                                        <kbd class="px-1 py-0.5 bg-black/30 rounded text-[10px] font-mono text-white">Enter</kbd> <span>&darr;</span>
                                        <span class="mx-0.5 opacity-40">|</span>
                                        <kbd class="px-1 py-0.5 bg-black/30 rounded text-[10px] font-mono text-white">Shift+Enter</kbd> <span>&uarr;</span>
                                        <span class="mx-0.5 opacity-40">|</span>
                                        <kbd class="px-1 py-0.5 bg-black/30 rounded text-[10px] font-mono text-white">Tab</kbd> <span>&rarr;</span>
                                    </div>

                                    <!-- Toggle Mathematical Formula -->
                                    <button type="button" onclick="App.toggleGradingFormulaView()" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer" title="View/hide raw Excel weighted formula">
                                        <span class="font-mono text-xs">fx</span>
                                        <span id="gradingFormulaToggleText">Formula</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Collapsible Formula Accordion (Preserves DepEd/CHED formula audit) -->
                            <div id="gradingFormulaAccordion" class="hidden mt-3 pt-3 border-t border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                                <div class="flex items-center gap-2 flex-wrap min-w-0">
                                    <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#5276A7]/40 text-[#D5F0EA] border border-[#5276A7]/50">Excel Formula</span>
                                    <code id="gradingFormulaCode" class="text-[#D5F0EA] font-mono text-xs font-semibold break-all">(((E21*4)+(F21*4)+(G21*4)+(H21*4)+(I21*4)+(J21*3)+(K21*1)+(L21*4))/28)</code>
                                </div>
                                <div class="text-xs text-slate-300 shrink-0">
                                    <span id="gradingMetaSummary">Active Student Computation</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Grade Sheet Container (Substantially Longer Table with Generous Vertical & Horizontal Space) -->
                    <div id="gradingSheetContainer" class="bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex-1 flex flex-col min-h-[680px] lg:min-h-[780px] overflow-hidden">
                        <!-- Populated by JS -->
                    </div>
                </section>

                <!-- ==================== VIEW 6: AUTOMATED QUARTERLY REPORT, RANKING & HONOR PULLOUT ==================== -->
                <section id="view-reports" class="view-panel <?= $requestedPage === 'reports' ? '' : 'hidden' ?> space-y-4">
                    <!-- Report Filter Bar -->
                    <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex flex-col lg:flex-row lg:items-end justify-between gap-3.5 no-print shrink-0">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
                            <div>
                                <label for="reportSectionSelect" class="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Select Section</label>
                                <select id="reportSectionSelect" class="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                    <!-- Populated by JS -->
                                </select>
                            </div>
                            <div>
                                <label for="reportQuarterSelect" class="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Quarter / Evaluation Period</label>
                                <select id="reportQuarterSelect" class="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                    <option value="Q1">1st Quarter (Q1)</option>
                                    <option value="Q2">2nd Quarter (Q2)</option>
                                    <option value="Q3">3rd Quarter (Q3)</option>
                                    <option value="Q4">4th Quarter (Q4)</option>
                                    <option value="FINAL">Final Average (Q1–Q4 Cumulative)</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                            <button type="button" onclick="App.openGradingForReportSection()" class="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#5276A7] hover:bg-[#3E5F8A] transition cursor-pointer">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                                <span>Edit Section Grades</span>
                            </button>
                            <button type="button" onclick="App.printReport('honors')" class="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#0F766E] bg-[#D5F0EA] hover:bg-[#c2e8df] border border-[#99D8CC] transition cursor-pointer" title="Print only the Official Academic Honors Certificate / Roster">
                                <span>🎖️ Print Honors Only</span>
                            </button>
                            <button type="button" onclick="App.printReport('grades')" class="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#2C4870] bg-[#EBF1F8] hover:bg-[#D8E4F3] border border-[#C5D5EA] transition cursor-pointer" title="Print only the Full Section Grade Sheet">
                                <span>📋 Print Grade Sheet Only</span>
                            </button>
                            <button type="button" onclick="App.printReport('all')" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer" title="Print complete report with Honors on Page 1 and Grade Sheet on Page 2+">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                                </svg>
                                <span>Print Complete (Separated)</span>
                            </button>
                        </div>
                    </div>

                    <div id="quarterlyReportContainer" class="space-y-4 flex-1 flex flex-col min-h-0">
                        <!-- Populated by JS -->
                    </div>
                </section>

                <!-- ==================== VIEW 7: TEACHER ACCOUNTS & PERMISSIONS (ADMIN ONLY) ==================== -->
                <section id="view-users" class="view-panel <?= $requestedPage === 'users' ? '' : 'hidden' ?> space-y-4 admin-only">
                    <!-- Top Actions Bar -->
                    <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                        <div class="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                            <div class="relative flex-1">
                                <svg class="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                                <input type="text" id="userSearchInput" aria-label="Search teacher user accounts by name or username" oninput="App.renderUsersView()" placeholder="Search accounts by teacher name or username..." class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                            </div>
                            <select id="userRoleFilter" aria-label="Filter teacher accounts by role" onchange="App.renderUsersView()" class="px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] font-medium focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                <option value="">All Roles</option>
                                <option value="teacher">Teachers Only</option>
                                <option value="admin">Administrators Only</option>
                            </select>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <button type="button" onclick="App.openAssignSubjectTeacherModal()" class="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#0F766E] bg-[#D5F0EA] hover:bg-[#c2e8df] border border-[#99D8CC] transition cursor-pointer shrink-0" title="Assign a teaching load to a teacher">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                                <span>Assign Subject Load</span>
                            </button>
                            <button type="button" onclick="App.openTeacherModal()" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer shrink-0">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                                </svg>
                                <span>Add Teacher User</span>
                            </button>
                        </div>
                    </div>

                    <!-- Pending Unlock Requests Banner (Visible when teachers have requested unlocks) -->
                    <div id="adminPendingUnlocksContainer" class="hidden space-y-3 shrink-0">
                        <!-- Populated by JS -->
                    </div>

                    <!-- User Directory Table Container -->
                    <div class="bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div class="px-5 py-3.5 bg-[#F5F7FA] border-b border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2 shrink-0">
                            <div>
                                <h3 class="font-display font-bold text-[#17243A] text-base">Teacher Accounts &amp; Permissions</h3>
                                <p class="text-xs text-[#475569] mt-0.5">Control teacher access, assignable roles, and student enrollment privileges</p>
                            </div>
                            <span id="userCountSummary" class="text-xs font-semibold text-[#5276A7] bg-[#EBF1F8] px-3 py-1 rounded-full border border-[#C5D5EA]">0 Accounts</span>
                        </div>
                        <div class="flex-1 overflow-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse" aria-label="Data Table">
                                <thead class="sticky top-0 z-10">
                                    <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#475569]">
                                        <th scope="col" class="py-3.5 px-4">User / Full Name</th>
                                        <th scope="col" class="py-3.5 px-4">Username</th>
                                        <th scope="col" class="py-3.5 px-4">Role</th>
                                        <th scope="col" class="py-3.5 px-4">Handled Teaching Loads</th>
                                        <th scope="col" class="py-3.5 px-4 text-center">Student Add Permission</th>
                                        <th scope="col" class="py-3.5 px-4 text-center">Status</th>
                                        <th scope="col" class="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="usersTableBody" class="divide-y divide-[#D8DEE8]/70 text-sm">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    </div>

    <?php require_once __DIR__ . '/includes/modals.php'; ?>

    <!-- Main Application Script -->
    <script src="assets/js/app.js"></script>
</body>
</html>

