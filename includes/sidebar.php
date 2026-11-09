    <!-- Mobile Header (Midnight Navy #17243A) -->
    <header class="lg:hidden bg-[#17243A] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md no-print border-b border-[#243752]">
        <div class="flex items-center gap-3">
            <?= renderAcademicSealSvg('w-9 h-9') ?>
            <div>
                <span class="font-display font-bold text-base tracking-tight block leading-none">GradeFlow</span>
                <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Academic Management</span>
            </div>
        </div>
        <button id="mobileMenuBtn" type="button" class="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-[#243752] transition touch-target" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="sidebar">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
        </button>
    </header>

    <!-- Sidebar Backdrop (Mobile) -->
    <div id="sidebarBackdrop" class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs z-30 hidden lg:hidden no-print"></div>

    <!-- Sidebar Navigation (Midnight Navy #17243A — Academic Prestige Primary Brand) -->
    <?php
    $activeNavPage = $requestedPage ?? ($_GET['page'] ?? $_GET['view'] ?? 'dashboard');
    $validNavPages = ['dashboard', 'sections', 'subjects', 'students', 'grading', 'reports', 'student_report', 'users'];
    if (!in_array($activeNavPage, $validNavPages, true)) {
        $activeNavPage = 'dashboard';
    }
    if (!function_exists('getNavClass')) {
        function getNavClass(string $page, string $activePage): string {
            if ($page === $activePage) {
                return 'nav-btn w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold bg-[#243752] text-white border border-[#5276A7]/50 shadow-xs transition-all cursor-pointer';
            }
            return 'nav-btn w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-[#243752]/70 transition-all cursor-pointer';
        }
    }
    if (!function_exists('getNavAria')) {
        function getNavAria(string $page, string $activePage): string {
            return $page === $activePage ? ' aria-current="page"' : '';
        }
    }
    ?>
    <aside id="sidebar" class="fixed lg:static inset-y-0 left-0 z-40 w-64 lg:h-full bg-[#17243A] text-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out -translate-x-full lg:translate-x-0 shrink-0 no-print border-r border-[#243752]">
        <!-- Brand Logo -->
        <div class="px-4 py-4 border-b border-[#243752] flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
                <?= renderAcademicSealSvg('w-9 h-9') ?>
                <div>
                    <h1 class="font-display font-bold text-white text-base tracking-tight leading-none">GradeFlow</h1>
                    <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mt-1">Academic Management</p>
                </div>
            </div>
            <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-[#243752] text-slate-200 border border-[#5276A7]/40">SY 26–27</span>
        </div>

        <!-- Primary Navigation -->
        <nav aria-label="Main Navigation" class="px-3 py-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between gap-6">
            <div class="space-y-6">
                <!-- Main Menu -->
                <div class="space-y-1">
                    <p class="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">Overview &amp; Records</p>

                    <a href="?page=dashboard" data-nav="dashboard" class="<?= getNavClass('dashboard', $activeNavPage) ?>"<?= getNavAria('dashboard', $activeNavPage) ?>>
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                            </svg>
                            <span>Dashboard</span>
                        </span>
                    </a>

                    <a href="?page=sections" data-nav="sections" class="<?= getNavClass('sections', $activeNavPage) ?>"<?= getNavAria('sections', $activeNavPage) ?>>
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                            </svg>
                            <span>Sections</span>
                        </span>
                        <span id="navBadgeSections" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#243752] text-slate-200">0</span>
                    </a>

                    <a href="?page=subjects" data-nav="subjects" class="<?= getNavClass('subjects', $activeNavPage) ?>"<?= getNavAria('subjects', $activeNavPage) ?>>
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                            <span>Subjects</span>
                        </span>
                        <span id="navBadgeSubjects" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#243752] text-slate-200">0</span>
                    </a>

                    <a href="?page=students" data-nav="students" class="<?= getNavClass('students', $activeNavPage) ?>"<?= getNavAria('students', $activeNavPage) ?>>
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                            </svg>
                            <span>Students</span>
                        </span>
                        <span id="navBadgeStudents" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#243752] text-slate-200">0</span>
                    </a>
                </div>

                <!-- Grading & Reports -->
                <div class="pt-4 border-t border-[#243752] space-y-1">
                    <p class="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">Grading &amp; Reports</p>

                    <a href="?page=grading" data-nav="grading" class="<?= getNavClass('grading', $activeNavPage) ?>"<?= getNavAria('grading', $activeNavPage) ?>>
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            <span>Grade Input</span>
                        </span>
                    </a>

                    <a href="?page=reports" data-nav="reports" class="<?= getNavClass('reports', $activeNavPage) ?>"<?= getNavAria('reports', $activeNavPage) ?>>
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                            <span>Rankings &amp; Honors</span>
                        </span>
                    </a>

                    <a href="?page=student_report" data-nav="student_report" class="<?= getNavClass('student_report', $activeNavPage) ?>"<?= getNavAria('student_report', $activeNavPage) ?>>
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                            <span>Student Grade Card</span>
                        </span>
                    </a>
                </div>

                <!-- Admin Management (Admin Only) -->
                <div class="admin-only pt-4 border-t border-[#243752] space-y-1">
                    <p class="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">Administration</p>

                    <a href="?page=users" data-nav="users" class="<?= getNavClass('users', $activeNavPage) ?>"<?= getNavAria('users', $activeNavPage) ?>>
                        <span class="flex items-center gap-3">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                            <span>Teacher Accounts</span>
                        </span>
                        <div class="flex items-center gap-1.5">
                            <span id="navBadgeUnlockRequests" class="hidden px-2 py-0.5 text-xs font-bold rounded-full bg-[#FFF0D1] text-[#80530F]" title="Pending grade unlock requests">0</span>
                            <span id="navBadgeUsers" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#243752] text-slate-200">0</span>
                        </div>
                    </a>
                </div>
            </div>

            <!-- Compact Grading Policy Summary -->
            <div class="rounded-xl bg-[#101A2B] border border-[#243752] p-3.5 space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#B8CCE6]">Grading Policy</span>
                    <span id="sidebarGradesCountBadge" class="text-[11px] text-slate-300">0 grades</span>
                </div>
                <div class="text-xs text-slate-300 space-y-1">
                    <div class="flex items-center justify-between">
                        <span>Passing:</span>
                        <span class="font-semibold text-[#D5F0EA]">&ge; 75</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>Honor Roll:</span>
                        <span class="font-semibold text-white">&ge; 90 Avg (No &lt; 85)</span>
                    </div>
                </div>
            </div>
        </nav>

        <!-- User Profile & Logout Footer -->
        <div class="px-4 py-3.5 border-t border-[#243752] bg-[#101A2B] shrink-0 space-y-2.5">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-[#243752] border border-[#5276A7]/40 text-slate-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        <?= htmlspecialchars(substr($currentUser['full_name'] ?? 'U', 0, 1)) ?>
                    </div>
                    <div class="min-w-0">
                        <p class="text-xs font-bold text-white truncate leading-tight"><?= htmlspecialchars($currentUser['full_name'] ?? 'User') ?></p>
                        <span class="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#D5F0EA] leading-tight">
                            <?= htmlspecialchars($currentUser['role'] ?? 'teacher') ?>
                        </span>
                    </div>
                </div>
                <a href="logout.php" class="p-1.5 rounded-lg text-slate-300 hover:text-[#F5DFEB] hover:bg-[#842D60]/30 transition shrink-0" title="Logout">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                </a>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-[#243752]/70">
                <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#0F766E]"></span>
                    <span>Connected</span>
                </div>
                <a href="logout.php" class="text-xs text-[#E2B8CF] hover:text-white font-medium hover:underline">
                    Sign Out &rarr;
                </a>
            </div>
        </div>
    </aside>
