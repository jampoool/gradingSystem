        <!-- Top Action Header (Academic Prestige — Pure White #FFFFFF & Cool Gray #D8DEE8 Border) -->
        <header class="bg-white border-b border-[#D8DEE8] px-4 sm:px-5 py-3 sticky top-0 z-20 shrink-0 no-print shadow-2xs">
            <div class="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex items-center gap-4 min-w-0">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 text-xs font-semibold text-[#5276A7]">
                            <span>Academic Year 2026–2027</span>
                            <span>&bull;</span>
                            <span id="headerBreadcrumb">Overview Dashboard</span>
                        </div>
                        <h2 id="headerTitle" class="font-display text-lg sm:text-xl font-bold text-[#17243A] tracking-tight truncate mt-0.5">Academic Overview</h2>
                    </div>

                    <!-- Inline Navbar Summary Pill (Maximizes Navbar Middle Space on Wide Screens) -->
                    <div class="hidden 2xl:flex items-center gap-2.5 pl-4 border-l border-[#D8DEE8] text-xs">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EBF1F8] text-[#2C4870] border border-[#C5D6EB] font-semibold">
                            <span>Formula:</span>
                            <code class="text-[#17243A] font-mono font-bold">&Sigma;(Subj &times; Units) / Units</code>
                        </span>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC] font-semibold">
                            <span>&#10003; Passing &ge; 75 &bull; Honor &ge; 90 (No &lt; 85)</span>
                        </span>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 shrink-0">
                    <button type="button" onclick="App.seedSampleData()" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#2C4870] bg-[#EBF1F8] border border-[#C5D6EB] hover:bg-[#D8E4F3] transition cursor-pointer" title="Load or reset 28-unit demo curriculum, students, and sample grades">
                        <span>Load Sample Data</span>
                    </button>

                    <button type="button" onclick="App.switchView('grading')" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#5276A7] hover:bg-[#3E5F8A] shadow-2xs transition cursor-pointer">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        <span>Input Grades</span>
                    </button>

                    <button type="button" onclick="App.switchView('reports')" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#17243A] bg-white border border-[#D8DEE8] hover:bg-[#F5F7FA] transition cursor-pointer">
                        <svg class="w-4 h-4 text-[#0F766E]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        <span>Quarterly Ranking</span>
                    </button>

                    <button type="button" onclick="App.openSectionModal()" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#17243A] bg-white border border-[#D8DEE8] hover:bg-[#F5F7FA] transition cursor-pointer">
                        <svg class="w-4 h-4 text-[#5276A7]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span>Section</span>
                    </button>

                    <button type="button" onclick="App.openSubjectModal()" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#17243A] bg-white border border-[#D8DEE8] hover:bg-[#F5F7FA] transition cursor-pointer">
                        <svg class="w-4 h-4 text-[#5276A7]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span>Subject</span>
                    </button>

                    <button type="button" onclick="App.openStudentModal()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                        </svg>
                        <span>Add Student</span>
                    </button>
                </div>
            </div>
        </header>
