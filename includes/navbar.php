        <!-- Top Action Header (Academic Prestige — Clean, Uncluttered & Professional) -->
        <?php
        $navPageMeta = [
            'dashboard' => ['title' => 'Academic Overview', 'breadcrumb' => 'GradeFlow Dashboard'],
            'sections'  => ['title' => 'Sections & Subject Assignments', 'breadcrumb' => 'Sections & Curriculum'],
            'subjects'  => ['title' => 'Subject Catalog Management', 'breadcrumb' => 'Manage Subjects'],
            'students'  => ['title' => 'Student Directory & Enrollment', 'breadcrumb' => 'Manage Students'],
            'grading'   => ['title' => 'Teacher Grade Input per Section', 'breadcrumb' => 'Teacher Grade Sheet'],
            'reports'   => ['title' => 'Quarterly Report, Weighted Ranking & Honor Pullout', 'breadcrumb' => 'Automated Quarterly Ranking'],
            'users'     => ['title' => 'Teacher Accounts & Permissions', 'breadcrumb' => 'Manage Users'],
        ];
        $currentNavMeta = $navPageMeta[$requestedPage ?? 'dashboard'] ?? $navPageMeta['dashboard'];
        ?>
        <header class="bg-white border-b border-[#D8DEE8] px-5 py-3.5 sticky top-0 z-20 shrink-0 no-print">
            <div class="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="min-w-0">
                    <div class="flex items-center gap-2 text-xs font-medium text-[#475569]">
                        <span>Academic Year 2026–2027</span>
                        <span>&bull;</span>
                        <span id="headerBreadcrumb" class="text-[#5276A7] font-semibold"><?= htmlspecialchars($currentNavMeta['breadcrumb']) ?></span>
                    </div>
                    <h2 id="headerTitle" class="font-display text-lg sm:text-xl font-bold text-[#17243A] tracking-tight truncate"><?= htmlspecialchars($currentNavMeta['title']) ?></h2>
                </div>

                <div class="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button type="button" onclick="App.seedSampleData()" class="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-xl text-xs sm:text-sm font-medium text-[#475569] hover:text-[#17243A] bg-[#F5F7FA] hover:bg-[#EBF1F8] border border-[#D8DEE8] transition cursor-pointer" title="Load sample sections, students, and grades">
                        <span>Load Sample Data</span>
                    </button>

                    <a href="?page=grading" onclick="event.preventDefault(); App.switchView('grading');" class="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold text-[#17243A] bg-white border border-[#D8DEE8] hover:bg-[#F5F7FA] transition cursor-pointer">
                        <svg class="w-4 h-4 text-[#5276A7]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        <span>Input Grades</span>
                    </a>

                    <button type="button" onclick="App.openStudentModal()" class="inline-flex items-center gap-1.5 px-4 py-2 min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-2xs transition cursor-pointer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span>Add Student</span>
                    </button>

                    <div class="h-6 w-px bg-[#D8DEE8] mx-1 hidden sm:block"></div>

                    <!-- User Profile & Logout -->
                    <div class="flex items-center gap-2 pl-1">
                        <div class="hidden md:flex flex-col text-right">
                            <span class="text-xs font-bold text-[#17243A] leading-tight"><?= htmlspecialchars($currentUser['full_name'] ?? 'User') ?></span>
                            <span class="text-[10px] font-semibold uppercase tracking-wider text-[#475569] leading-tight"><?= htmlspecialchars($currentUser['role'] ?? 'teacher') ?></span>
                        </div>
                        <a href="logout.php" class="inline-flex items-center gap-1.5 px-3 py-2 min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold text-[#842D60] bg-[#F5DFEB] hover:bg-[#eed3e3] border border-[#E2B8CF] transition" title="Sign out of GradeFlow">
                            <svg class="w-4 h-4 text-[#842D60]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            <span>Logout</span>
                        </a>
                    </div>
                </div>
            </div>
        </header>
