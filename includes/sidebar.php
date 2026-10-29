    <!-- Mobile Header (Midnight Navy #17243A) -->
    <header class="lg:hidden bg-[#17243A] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md no-print border-b border-[#243752]">
        <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[#5276A7] flex items-center justify-center shadow-inner">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                </svg>
            </div>
            <div>
                <span class="font-display font-bold text-base tracking-tight block leading-none">GradeFlow</span>
                <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Academic Management</span>
            </div>
        </div>
        <button id="mobileMenuBtn" type="button" class="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-[#243752] focus:outline-none focus:ring-2 focus:ring-[#5276A7]" aria-label="Toggle Menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
        </button>
    </header>

    <!-- Sidebar Backdrop (Mobile) -->
    <div id="sidebarBackdrop" class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs z-30 hidden lg:hidden no-print"></div>

    <!-- Sidebar Navigation (Midnight Navy #17243A — Academic Prestige Primary Brand) -->
    <aside id="sidebar" class="fixed lg:static inset-y-0 left-0 z-40 w-64 lg:h-full bg-[#17243A] text-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out -translate-x-full lg:translate-x-0 shrink-0 no-print border-r border-[#243752]">
        <!-- Brand Logo -->
        <div class="px-4 py-4 border-b border-[#243752] flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-[#5276A7] flex items-center justify-center shadow-md">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.1" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                    </svg>
                </div>
                <div>
                    <h1 class="font-display font-bold text-white text-base tracking-tight leading-none">GradeFlow</h1>
                    <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mt-1">Academic Management</p>
                </div>
            </div>
            <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-[#243752] text-slate-200 border border-[#5276A7]/40">SY 26–27</span>
        </div>

        <!-- Primary Navigation -->
        <nav aria-label="Main Navigation" class="px-3 py-3.5 flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between gap-4">
            <div class="space-y-4">
                <!-- Academic Setup Group -->
                <div class="space-y-1">
                    <p class="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Academic Setup</p>

                    <button type="button" data-nav="dashboard" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                            </svg>
                            <span>Overview Dashboard</span>
                        </span>
                    </button>

                    <button type="button" data-nav="sections" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                            </svg>
                            <span>Sections &amp; Curriculum</span>
                        </span>
                        <span id="navBadgeSections" class="px-2 py-0.5 text-xs font-bold rounded-full bg-[#243752] text-slate-200">0</span>
                    </button>

                    <button type="button" data-nav="subjects" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                            <span>Manage Subjects</span>
                        </span>
                        <span id="navBadgeSubjects" class="px-2 py-0.5 text-xs font-bold rounded-full bg-[#243752] text-slate-200">0</span>
                    </button>

                    <button type="button" data-nav="students" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                            </svg>
                            <span>Student Directory</span>
                        </span>
                        <span id="navBadgeStudents" class="px-2 py-0.5 text-xs font-bold rounded-full bg-[#243752] text-slate-200">0</span>
                    </button>
                </div>

                <!-- Grading & Automation Modules -->
                <div class="pt-3 border-t border-[#243752] space-y-1">
                    <p class="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Grading &amp; Evaluation</p>

                    <button type="button" data-nav="grading" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            <span>Teacher Grade Input</span>
                        </span>
                        <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-[#FFF0D1] text-[#80530F]">Sheet</span>
                    </button>

                    <button type="button" data-nav="reports" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                            <span>Quarterly Ranking</span>
                        </span>
                        <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-[#D5F0EA] text-[#0F766E]">Auto</span>
                    </button>
                </div>

                <!-- Quick Actions -->
                <div class="pt-3 border-t border-[#243752]">
                    <p class="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Quick Actions</p>
                    <div class="grid grid-cols-1 gap-1.5">
                        <button type="button" onclick="App.openSectionModal()" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-white bg-[#243752]/60 hover:bg-[#243752] transition cursor-pointer">
                            <span class="w-5 h-5 rounded-md bg-[#5276A7]/30 text-[#B8CCE6] flex items-center justify-center font-bold text-sm">+</span>
                            <span>New Section</span>
                        </button>
                        <button type="button" onclick="App.openSubjectModal()" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-white bg-[#243752]/60 hover:bg-[#243752] transition cursor-pointer">
                            <span class="w-5 h-5 rounded-md bg-[#0F766E]/40 text-[#D5F0EA] flex items-center justify-center font-bold text-sm">+</span>
                            <span>New Subject</span>
                        </button>
                        <button type="button" onclick="App.openStudentModal()" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-white bg-[#243752]/60 hover:bg-[#243752] transition cursor-pointer">
                            <span class="w-5 h-5 rounded-md bg-[#5276A7]/30 text-[#B8CCE6] flex items-center justify-center font-bold text-sm">+</span>
                            <span>Enroll Student</span>
                        </button>
                        <button type="button" onclick="App.openStudentModal(null, null, 'bulk')" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-white bg-[#5276A7]/30 hover:bg-[#5276A7]/50 border border-[#5276A7]/40 transition cursor-pointer">
                            <span class="w-5 h-5 rounded-md bg-[#5276A7] text-white flex items-center justify-center font-bold text-xs">&equiv;</span>
                            <span>Bulk Add Students</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Sidebar Live Policy & Formula Reference Card -->
            <div class="rounded-xl bg-[#101A2B] border border-[#243752] p-3.5 space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-wider text-[#B8CCE6]">Grading Policy</span>
                    <span id="sidebarGradesCountBadge" class="text-xs font-mono text-slate-300">0 grades</span>
                </div>
                <div class="text-xs text-slate-300 space-y-1.5">
                    <div class="flex items-center justify-between">
                        <span>Passing Grade:</span>
                        <span class="px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#D5F0EA] text-[#0F766E]">&ge; 75.00</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>Honor Avg:</span>
                        <strong class="text-white">&ge; 90.00</strong>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>Honor Floor:</span>
                        <span class="px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#FFF0D1] text-[#80530F]">No &lt; 85</span>
                    </div>
                </div>
                <div class="pt-2 border-t border-[#243752]">
                    <code class="block text-xs font-mono text-[#B8CCE6] truncate" title="(((E21*4)+(F21*4)+(G21*4)+(H21*4)+(I21*4)+(J21*3)+(K21*1)+(L21*4))/28)">&Sigma;(Grade &times; Units) / TotalUnits</code>
                </div>
            </div>
        </nav>

        <!-- Database Status Footer -->
        <div class="px-4 py-3 border-t border-[#243752] bg-[#101A2B] shrink-0">
            <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#0F766E] ring-2 ring-[#D5F0EA]/40"></span>
                    <span class="text-slate-200 font-medium">DB: <code class="text-[#D5F0EA] font-semibold">gradingsystem</code></span>
                </div>
                <span class="text-xs text-slate-400">Connected</span>
            </div>
        </div>
    </aside>
