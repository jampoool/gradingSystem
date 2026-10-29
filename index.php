<?php
require_once __DIR__ . '/config/db.php';
$dbStatus = getDatabaseStatus();
require_once __DIR__ . '/includes/header.php';
?>
    <!-- App Shell (Academic Prestige — 60% Cloud White #F5F7FA / 30% Midnight Navy #17243A / 10% Semantic Accents) -->
    <div class="min-h-screen lg:h-screen lg:overflow-hidden w-full flex flex-col lg:flex-row bg-[#F5F7FA]">
        <?php require_once __DIR__ . '/includes/sidebar.php'; ?>

        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col min-w-0 lg:h-full lg:overflow-hidden">
            <?php require_once __DIR__ . '/includes/navbar.php'; ?>

            <!-- Page Container (Full Width & Full Height Flex — No Blank Space) -->
            <main class="flex-1 flex flex-col min-h-0 w-full max-w-none p-3.5 sm:p-5 overflow-y-auto custom-scrollbar gap-4">

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
                            <button type="button" onclick="App.openSectionModal()" class="px-4 py-2.5 rounded-xl bg-[#17243A]/70 hover:bg-[#17243A] text-white font-semibold text-sm border border-white/25 transition cursor-pointer">
                                + Create First Section
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ==================== VIEW 1: OVERVIEW DASHBOARD ==================== -->
                <section id="view-dashboard" class="view-panel space-y-4">
                    <!-- Top Row: Academic Prestige KPI & Passing / At-Risk Rate Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3.5 shrink-0">
                        <!-- Passing Students Rate (Deep Teal #0F766E / Pale Mint #D5F0EA) -->
                        <div onclick="App.switchView('reports')" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#0F766E] transition cursor-pointer group flex flex-col justify-between">
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Passing Students</span>
                                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                                    <span>&#10003; Passing</span>
                                </span>
                            </div>
                            <div class="mt-2 flex items-baseline justify-between">
                                <p id="statPassingRate" class="font-display text-2xl sm:text-3xl font-extrabold text-[#0F766E]">0.0%</p>
                                <span id="statPassingCount" class="text-xs font-semibold text-[#64748B]">0 passed (&ge;75)</span>
                            </div>
                        </div>

                        <!-- Students at Risk Rate (Berry Plum #9B3F72 / Soft Rose #F5DFEB / Dark Berry #842D60) -->
                        <div onclick="App.switchView('grading')" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#9B3F72] transition cursor-pointer group flex flex-col justify-between">
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Students at Risk</span>
                                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF]">
                                    <span>&#9888; Failing</span>
                                </span>
                            </div>
                            <div class="mt-2 flex items-baseline justify-between">
                                <p id="statRiskRate" class="font-display text-2xl sm:text-3xl font-extrabold text-[#842D60]">0.0%</p>
                                <span id="statRiskCount" class="text-xs font-semibold text-[#64748B]">0 failing (&lt;75)</span>
                            </div>
                        </div>

                        <!-- Total Students (Midnight Navy #17243A) -->
                        <div onclick="App.switchView('students')" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#5276A7] transition cursor-pointer group flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Total Students</p>
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
                        <div onclick="App.switchView('sections')" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#5276A7] transition cursor-pointer group flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Active Sections</p>
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
                        <div onclick="App.switchView('subjects')" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#5276A7] transition cursor-pointer group flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Catalog Subjects</p>
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
                        <div onclick="App.switchView('reports')" class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs hover:border-[#0F766E] transition cursor-pointer group flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Subject Loads</p>
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
                                    <p class="text-xs text-[#64748B] mt-0.5">Click a section pill below to switch sections, view enrolled students, and adjust entries shown</p>
                                </div>
                                <div class="flex flex-wrap items-center gap-2">
                                    <button type="button" onclick="App.openSectionModal()" class="text-xs font-semibold text-white bg-[#17243A] hover:bg-[#243752] px-3.5 py-1.5 rounded-xl transition cursor-pointer">
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
                                    <p class="text-xs text-[#64748B] mt-0.5">Live weighted score &amp; policy status (&ge;75 Passing)</p>
                                </div>
                                <div class="flex items-center gap-1.5">
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
                <section id="view-sections" class="view-panel hidden space-y-4">
                    <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                        <div class="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                            <div class="relative flex-1">
                                <svg class="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                                <input type="text" id="sectionSearchInput" placeholder="Search sections, year level, adviser, or assigned subjects..." class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                            </div>
                            <select id="sectionYearFilter" aria-label="Filter sections by year level" class="px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] font-medium focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
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
                        </div>
                        <button type="button" onclick="App.openSectionModal()" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer shrink-0">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                            </svg>
                            <span>Create New Section</span>
                        </button>
                    </div>

                    <div id="sectionsGridContainer" class="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 content-start">
                        <!-- Populated by JS -->
                    </div>
                </section>

                <!-- ==================== VIEW 3: MANAGE SUBJECTS ==================== -->
                <section id="view-subjects" class="view-panel hidden space-y-4">
                    <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                        <div class="relative flex-1">
                            <svg class="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <input type="text" id="subjectSearchInput" placeholder="Search subjects by code, descriptive title, or description..." class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
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
                            <table class="w-full text-left border-collapse">
                                <thead class="sticky top-0 z-10">
                                    <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                        <th class="py-3.5 px-4">Subject Code</th>
                                        <th class="py-3.5 px-4">Subject Name &amp; Description</th>
                                        <th class="py-3.5 px-4 text-center">Units (Weight)</th>
                                        <th class="py-3.5 px-4">Assigned Sections</th>
                                        <th class="py-3.5 px-4 text-right">Actions</th>
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
                <section id="view-students" class="view-panel hidden space-y-4">
                    <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
                        <div class="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                            <div class="relative flex-1">
                                <svg class="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                                <input type="text" id="studentSearchInput" placeholder="Search by student name, ID number, or section..." class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                            </div>

                            <select id="studentYearFilter" aria-label="Filter students by year level" class="px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] font-medium focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
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

                            <select id="studentSectionFilter" aria-label="Filter students by section" class="px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] font-medium focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                <option value="">All Sections</option>
                            </select>

                            <button type="button" id="resetStudentFiltersBtn" onclick="App.resetStudentFilters()" class="hidden px-3.5 py-2.5 text-xs font-semibold text-[#64748B] hover:text-[#17243A] bg-[#F5F7FA] hover:bg-[#D8DEE8]/60 rounded-xl transition cursor-pointer">
                                Reset
                            </button>
                        </div>

                        <div class="flex flex-wrap items-center gap-2 shrink-0">
                            <button type="button" onclick="App.openStudentModal(null, null, 'bulk')" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#5276A7] hover:bg-[#3E5F8A] shadow-2xs transition cursor-pointer">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
                                </svg>
                                <span>Bulk Add (1 per Line)</span>
                            </button>
                            <button type="button" onclick="App.openStudentModal()" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                                </svg>
                                <span>Add New Student</span>
                            </button>
                        </div>
                    </div>

                    <div class="bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div class="flex-1 overflow-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse">
                                <thead class="sticky top-0 z-10">
                                    <tr class="bg-[#F5F7FA] border-b border-[#D8DEE8] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                        <th class="py-3.5 px-4">Student ID</th>
                                        <th class="py-3.5 px-4">Full Name</th>
                                        <th class="py-3.5 px-4">Year Level</th>
                                        <th class="py-3.5 px-4">Section</th>
                                        <th class="py-3.5 px-4">Enrolled Subjects (From Section)</th>
                                        <th class="py-3.5 px-4">Status</th>
                                        <th class="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="studentsTableBody" class="divide-y divide-[#D8DEE8]/70 text-sm">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <!-- ==================== VIEW 5: TEACHER GRADE INPUT PER SECTION ==================== -->
                <section id="view-grading" class="view-panel hidden space-y-4">
                    <!-- Top Grade Controls Bar -->
                    <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs space-y-3.5 shrink-0">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-end">
                            <div class="lg:col-span-3">
                                <label for="gradingSectionSelect" class="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">1. Select Section</label>
                                <select id="gradingSectionSelect" class="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                    <!-- Populated by JS -->
                                </select>
                            </div>

                            <div class="lg:col-span-4">
                                <label for="gradingSubjectSelect" class="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">2. Select Subject (or Master Sheet)</label>
                                <select id="gradingSubjectSelect" class="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                    <!-- Populated by JS -->
                                </select>
                            </div>

                            <div class="lg:col-span-2">
                                <label class="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">3. Grading Period</label>
                                <div class="grid grid-cols-4 gap-1 bg-[#F5F7FA] p-1 rounded-xl border border-[#D8DEE8]">
                                    <button type="button" data-qtr-btn="Q1" onclick="App.setGradingQuarter('Q1')" class="qtr-tab-btn px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#17243A] text-white shadow-2xs transition cursor-pointer text-center">Q1</button>
                                    <button type="button" data-qtr-btn="Q2" onclick="App.setGradingQuarter('Q2')" class="qtr-tab-btn px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#17243A] transition cursor-pointer text-center">Q2</button>
                                    <button type="button" data-qtr-btn="Q3" onclick="App.setGradingQuarter('Q3')" class="qtr-tab-btn px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#17243A] transition cursor-pointer text-center">Q3</button>
                                    <button type="button" data-qtr-btn="Q4" onclick="App.setGradingQuarter('Q4')" class="qtr-tab-btn px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#17243A] transition cursor-pointer text-center">Q4</button>
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
                            </div>
                        </div>

                        <!-- Subject Quick-Switch Tabs & Quick Fill Bar -->
                        <div class="pt-3 border-t border-[#D8DEE8] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                            <div id="gradingSubjectTabs" class="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 flex-1">
                                <!-- Populated by JS -->
                            </div>

                            <div class="flex flex-wrap items-center gap-2 shrink-0">
                                <div class="relative">
                                    <svg class="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                    </svg>
                                    <input type="text" id="gradingStudentSearchInput" placeholder="Filter student..." class="pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] outline-none w-44 sm:w-52">
                                </div>

                                <div class="inline-flex items-center gap-1 bg-[#F5F7FA] px-2.5 py-1.5 rounded-xl border border-[#D8DEE8] text-xs">
                                    <span class="text-[#64748B] font-semibold mr-1">Fill Empty:</span>
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
                        <div id="gradingFormulaBanner" class="rounded-xl bg-[#17243A] text-slate-200 px-4 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-xs">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#5276A7]/30 text-[#B8CCE6] border border-[#5276A7]/40">Live Formula</span>
                                <code id="gradingFormulaCode" class="text-[#D5F0EA] font-mono text-xs sm:text-sm font-semibold">(((E21*4)+(F21*4)+(G21*4)+(H21*4)+(I21*4)+(J21*3)+(K21*1)+(L21*4))/28)</code>
                            </div>
                            <div class="flex items-center gap-3 text-slate-300 text-xs">
                                <span id="gradingMetaSummary">Select a cell to inspect student formula</span>
                                <span>&bull;</span>
                                <span class="text-[#FFF0D1] font-semibold">Use <kbd class="px-1.5 py-0.5 bg-[#243752] rounded border border-[#5276A7]/40 text-white">Enter</kbd> or <kbd class="px-1.5 py-0.5 bg-[#243752] rounded border border-[#5276A7]/40 text-white">&uarr;&darr;&larr;&rarr;</kbd> to navigate</span>
                            </div>
                        </div>
                    </div>

                    <!-- Grade Sheet Container (Stretches to Fill Remaining Height) -->
                    <div id="gradingSheetContainer" class="bg-white rounded-2xl border border-[#D8DEE8] shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
                        <!-- Populated by JS -->
                    </div>
                </section>

                <!-- ==================== VIEW 6: AUTOMATED QUARTERLY REPORT, RANKING & HONOR PULLOUT ==================== -->
                <section id="view-reports" class="view-panel hidden space-y-4">
                    <!-- Report Filter Bar -->
                    <div class="bg-white rounded-2xl p-4 border border-[#D8DEE8] shadow-2xs flex flex-col lg:flex-row lg:items-end justify-between gap-3.5 no-print shrink-0">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
                            <div>
                                <label for="reportSectionSelect" class="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Select Section</label>
                                <select id="reportSectionSelect" class="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                    <!-- Populated by JS -->
                                </select>
                            </div>
                            <div>
                                <label for="reportQuarterSelect" class="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Quarter / Evaluation Period</label>
                                <select id="reportQuarterSelect" class="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                    <option value="Q1">1st Quarter (Q1)</option>
                                    <option value="Q2">2nd Quarter (Q2)</option>
                                    <option value="Q3">3rd Quarter (Q3)</option>
                                    <option value="Q4">4th Quarter (Q4)</option>
                                    <option value="FINAL">Final Average (Q1–Q4 Cumulative)</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-2.5">
                            <button type="button" onclick="App.openGradingForReportSection()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#5276A7] hover:bg-[#3E5F8A] transition cursor-pointer">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                                <span>Edit Section Grades</span>
                            </button>
                            <button type="button" onclick="window.print()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                                </svg>
                                <span>Print Report</span>
                            </button>
                        </div>
                    </div>

                    <div id="quarterlyReportContainer" class="space-y-4 flex-1 flex flex-col min-h-0">
                        <!-- Populated by JS -->
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
