<?php
declare(strict_types=1);
require_once __DIR__ . '/config/db.php';
$pdo = getDBConnection();
?>
<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduGrade — Academic &amp; Grading Management System</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
                    },
                    fontSize: {
                        '2xs': ['10px', { lineHeight: '14px' }],
                        'xs': ['11px', { lineHeight: '16px' }],
                        'sm': ['12px', { lineHeight: '17px' }],
                        'base': ['12px', { lineHeight: '18px' }],
                        'lg': ['13px', { lineHeight: '19px' }],
                        'xl': ['14px', { lineHeight: '20px' }],
                        '2xl': ['16px', { lineHeight: '22px' }],
                        '3xl': ['18px', { lineHeight: '24px' }],
                    },
                    colors: {
                        brand: {
                            50: '#eef2ff',
                            100: '#e0e7ff',
                            200: '#c7d2fe',
                            500: '#6366f1',
                            600: '#4f46e5',
                            700: '#4338ca',
                            800: '#3730a3',
                            900: '#312e81',
                        }
                    }
                }
            }
        };
    </script>
    <style>
        html, body {
            font-size: 12px;
            line-height: 1.45;
        }
        [x-cloak] { display: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .toast-enter { animation: slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            opacity: 1;
        }
        @media print {
            aside, header, .no-print { display: none !important; }
            main { padding: 0 !important; max-width: 100% !important; }
            body { background: white !important; font-size: 11px !important; }
        }
    </style>
</head>
<body class="h-full font-sans text-[12px] text-slate-800 antialiased selection:bg-brand-600 selection:text-white">

<div class="min-h-screen flex flex-col lg:flex-row">

    <!-- Mobile Header -->
    <header class="lg:hidden bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md no-print">
        <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-inner">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                </svg>
            </div>
            <div>
                <span class="font-display font-bold text-base tracking-tight block leading-none">EduGrade</span>
                <span class="text-[11px] text-slate-400">Grading System</span>
            </div>
        </div>
        <button id="mobileMenuBtn" type="button" class="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500" aria-label="Toggle Menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
        </button>
    </header>

    <!-- Sidebar Backdrop (Mobile) -->
    <div id="sidebarBackdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 hidden lg:hidden no-print"></div>

    <!-- Sidebar Navigation -->
    <aside id="sidebar" class="fixed lg:static inset-y-0 left-0 z-40 w-60 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out -translate-x-full lg:translate-x-0 shrink-0 no-print">
        <!-- Brand Logo -->
        <div class="px-4 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/30">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                    </svg>
                </div>
                <div>
                    <h1 class="font-display font-bold text-white text-sm tracking-tight leading-none">EduGrade</h1>
                    <p class="text-[11px] text-slate-400 mt-0.5">Academic &amp; Grading</p>
                </div>
            </div>
        </div>

        <!-- Primary Navigation -->
        <div class="px-3 py-5 flex-1 overflow-y-auto space-y-1">
            <p class="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Academic Setup</p>

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
                <span id="navBadgeSections" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">0</span>
            </button>

            <button type="button" data-nav="subjects" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
                <span class="flex items-center gap-3">
                    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    <span>Manage Subjects</span>
                </span>
                <span id="navBadgeSubjects" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">0</span>
            </button>

            <button type="button" data-nav="students" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
                <span class="flex items-center gap-3">
                    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                    <span>Student Directory</span>
                </span>
                <span id="navBadgeStudents" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">0</span>
            </button>

            <!-- Grading & Automation Modules -->
            <div class="pt-4">
                <p class="px-3 text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 mb-2">Grading &amp; Automation</p>

                <button type="button" data-nav="grading" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
                    <span class="flex items-center gap-3">
                        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        <span>Teacher Grade Input</span>
                    </span>
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500/20 text-amber-300">Input</span>
                </button>

                <button type="button" data-nav="reports" class="nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer mt-1">
                    <span class="flex items-center gap-3">
                        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        <span>Quarterly Ranking &amp; Pullout</span>
                    </span>
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300">Auto</span>
                </button>
            </div>

            <div class="pt-5">
                <p class="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Quick Actions</p>
                <div class="space-y-1.5 px-2">
                    <button type="button" onclick="App.openSectionModal()" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer">
                        <span class="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">+</span>
                        <span>New Section</span>
                    </button>
                    <button type="button" onclick="App.openSubjectModal()" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer">
                        <span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">+</span>
                        <span>New Subject</span>
                    </button>
                    <button type="button" onclick="App.openStudentModal()" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer">
                        <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">+</span>
                        <span>Enroll Student</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Database Status Footer -->
        <div class="p-4 border-t border-slate-800/80 bg-slate-950/40">
            <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span class="text-slate-300 font-medium">DB: <code class="text-emerald-400">gradingsystem</code></span>
                </div>
                <span class="text-[11px] text-slate-500">MySQL Ready</span>
            </div>
        </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">

        <!-- Top Action Header -->
        <header class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 sticky top-0 z-20 no-print">
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <div class="flex items-center gap-1.5 text-[11px] font-medium text-brand-600">
                        <span>Academic Year 2026–2027</span>
                        <span>&bull;</span>
                        <span id="headerBreadcrumb">Overview Dashboard</span>
                    </div>
                    <h2 id="headerTitle" class="font-display text-sm sm:text-base font-bold text-slate-900 tracking-tight">Academic Overview</h2>
                </div>

                <div class="flex flex-wrap items-center gap-1.5">
                    <button type="button" onclick="App.switchView('grading')" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition cursor-pointer">
                        <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        <span>Input Grades</span>
                    </button>

                    <button type="button" onclick="App.switchView('reports')" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer">
                        <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        <span>Quarterly Ranking</span>
                    </button>

                    <button type="button" onclick="App.openSectionModal()" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-2xs transition cursor-pointer">
                        <svg class="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span>Section</span>
                    </button>

                    <button type="button" onclick="App.openSubjectModal()" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-2xs transition cursor-pointer">
                        <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span>Subject</span>
                    </button>

                    <button type="button" onclick="App.openStudentModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-600/20 transition cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                        </svg>
                        <span>Add Student</span>
                    </button>
                </div>
            </div>
        </header>

        <!-- Main View Container -->
        <main class="flex-1 px-3 sm:px-6 py-4 max-w-7xl w-full mx-auto space-y-4">

            <!-- Empty-System Onboarding Banner -->
            <div id="onboardingBanner" class="hidden bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 rounded-xl p-4 text-white shadow-md no-print">
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div class="space-y-1 max-w-2xl">
                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-indigo-100">
                            Quick Start Guide
                        </span>
                        <h3 class="text-sm font-display font-bold">Welcome to your Grading &amp; Ranking System!</h3>
                        <p class="text-[12px] text-indigo-100/90 leading-relaxed">
                            Load the <strong>28-unit sample curriculum, students, and grades</strong> with one click to immediately test the Teacher Grade Input, the weighted ranking formula <code>(((E21*4)+(F21*4)+(G21*4)+(H21*4)+(I21*4)+(J21*3)+(K21*1)+(L21*4))/28)</code>, and the Quarterly Honor Pullout report!
                        </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 shrink-0">
                        <button type="button" onclick="App.seedSampleData()" class="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-white text-brand-900 hover:bg-indigo-50 transition shadow-sm cursor-pointer">
                            Load 28-Unit Demo &amp; Sample Grades
                        </button>
                        <button type="button" onclick="App.openSectionModal()" class="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-brand-600 text-white border border-brand-400/40 hover:bg-brand-500 transition cursor-pointer">
                            + Create First Section
                        </button>
                    </div>
                </div>
            </div>

            <!-- ==================== VIEW 1: OVERVIEW DASHBOARD ==================== -->
            <section id="view-dashboard" class="view-panel space-y-4">
                <!-- KPI Cards -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div onclick="App.switchView('students')" class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-brand-300 transition cursor-pointer group">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Enrolled Students</p>
                                <p id="statStudents" class="text-xl font-display font-bold text-slate-900 mt-0.5">0</p>
                            </div>
                            <div class="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-105 transition">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Student records</span>
                            <span class="text-brand-600 font-semibold group-hover:translate-x-0.5 transition">&rarr;</span>
                        </div>
                    </div>

                    <div onclick="App.switchView('sections')" class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer group">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active Sections</p>
                                <p id="statSections" class="text-xl font-display font-bold text-slate-900 mt-0.5">0</p>
                            </div>
                            <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                                </svg>
                            </div>
                        </div>
                        <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Sections &amp; loads</span>
                            <span class="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition">&rarr;</span>
                        </div>
                    </div>

                    <div onclick="App.switchView('grading')" class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-300 transition cursor-pointer group">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Teacher Grade Input</p>
                                <p id="statSubjects" class="text-xl font-display font-bold text-slate-900 mt-0.5">0</p>
                            </div>
                            <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Input student grades</span>
                            <span class="text-amber-600 font-semibold group-hover:translate-x-0.5 transition">&rarr;</span>
                        </div>
                    </div>

                    <div onclick="App.switchView('reports')" class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition cursor-pointer group">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Quarterly Ranking</p>
                                <p id="statAssignments" class="text-xl font-display font-bold text-slate-900 mt-0.5">0</p>
                            </div>
                            <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Avg &ge; 90 &amp; No &lt; 85</span>
                            <span class="text-emerald-600 font-semibold group-hover:translate-x-0.5 transition">&rarr;</span>
                        </div>
                    </div>
                </div>

                <!-- Dashboard Sections & Assigned Subjects Overview + Recent Students -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Sections & Assigned Subjects Overview (2 cols) -->
                    <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col">
                        <div class="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 class="font-display font-bold text-slate-900 text-base">Sections, Grade Entry &amp; Quarterly Reports</h3>
                                <p class="text-xs text-slate-500">Pull up any section to input student grades or view automated weighted rankings</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="App.seedSampleData()" class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition cursor-pointer">
                                    Load 28-Unit Demo Data
                                </button>
                                <button type="button" onclick="App.openSectionModal()" class="text-xs font-semibold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition cursor-pointer">
                                    + New Section
                                </button>
                            </div>
                        </div>
                        <div id="dashboardSectionsList" class="p-5 space-y-3.5 flex-1">
                            <!-- Populated by JS -->
                        </div>
                    </div>

                    <!-- Recent Students Roster (1 col) -->
                    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col">
                        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 class="font-display font-bold text-slate-900 text-base">Enrolled Students</h3>
                                <p class="text-xs text-slate-500">Student name, section &amp; year level</p>
                            </div>
                            <button type="button" onclick="App.openStudentModal()" class="text-xs font-semibold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition cursor-pointer">
                                + Add
                            </button>
                        </div>
                        <div id="dashboardStudentsList" class="p-4 divide-y divide-slate-100 flex-1">
                            <!-- Populated by JS -->
                        </div>
                        <div class="p-3 border-t border-slate-100 text-center">
                            <button type="button" onclick="App.switchView('students')" class="text-xs font-semibold text-slate-600 hover:text-brand-600 transition cursor-pointer">
                                Open Full Student Directory &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ==================== VIEW 2: SECTIONS & SUBJECT ASSIGNMENT ==================== -->
            <section id="view-sections" class="view-panel hidden space-y-6">
                <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                        <div class="relative flex-1 max-w-md">
                            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <input type="text" id="sectionSearchInput" placeholder="Search section name, adviser, or assigned subject..." class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                        </div>

                        <select id="sectionYearFilter" aria-label="Filter sections by year level" class="px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
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

                    <div class="flex items-center gap-2.5">
                        <button type="button" onclick="App.openSectionModal()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition cursor-pointer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                            </svg>
                            <span>Create New Section</span>
                        </button>
                    </div>
                </div>

                <div id="sectionsGridContainer" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <!-- Populated by JS -->
                </div>
            </section>

            <!-- ==================== VIEW 3: MANAGE SUBJECTS ==================== -->
            <section id="view-subjects" class="view-panel hidden space-y-6">
                <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="relative flex-1 max-w-md">
                        <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" id="subjectSearchInput" placeholder="Search by subject code, title, or description..." class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                    </div>

                    <div class="flex items-center gap-2.5">
                        <button type="button" onclick="App.openSubjectModal()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition cursor-pointer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                            </svg>
                            <span>Add New Subject</span>
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    <th class="py-3.5 px-5">Subject Code</th>
                                    <th class="py-3.5 px-5">Descriptive Title</th>
                                    <th class="py-3.5 px-5 text-center">Units (Weight)</th>
                                    <th class="py-3.5 px-5">Assigned Sections</th>
                                    <th class="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="subjectsTableBody" class="divide-y divide-slate-200/60 text-sm">
                                <!-- Populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!-- ==================== VIEW 4: STUDENT DIRECTORY ==================== -->
            <section id="view-students" class="view-panel hidden space-y-6">
                <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                        <div class="relative flex-1 max-w-md">
                            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <input type="text" id="studentSearchInput" placeholder="Search by student name, ID, or section..." class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                        </div>

                        <select id="studentYearFilter" aria-label="Filter students by year level" class="px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
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

                        <select id="studentSectionFilter" aria-label="Filter students by section" class="px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                            <option value="">All Sections</option>
                        </select>

                        <button type="button" id="resetStudentFiltersBtn" onclick="App.resetStudentFilters()" class="hidden px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
                            Clear Filters
                        </button>
                    </div>

                    <div class="flex items-center gap-2.5">
                        <button type="button" onclick="App.openStudentModal()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition cursor-pointer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                            </svg>
                            <span>Add Student</span>
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    <th class="py-3.5 px-5">Student ID</th>
                                    <th class="py-3.5 px-5">Student Name</th>
                                    <th class="py-3.5 px-5">Year Level</th>
                                    <th class="py-3.5 px-5">Section</th>
                                    <th class="py-3.5 px-5">Enrolled Subjects (From Section)</th>
                                    <th class="py-3.5 px-5">Status</th>
                                    <th class="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="studentsTableBody" class="divide-y divide-slate-200/60 text-sm">
                                <!-- Populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!-- ==================== VIEW 5: TEACHER GRADE INPUT PER SECTION ==================== -->
            <section id="view-grading" class="view-panel hidden space-y-3.5">
                <!-- Top Teacher Control Card -->
                <div class="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs space-y-3">
                    <!-- Row 1: Section Selector + Quarter Segmented Tabs + Auto-Save & Save Actions -->
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div class="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
                            <!-- 1. Select Section -->
                            <div class="sm:w-64">
                                <label for="gradingSectionSelect" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                                    Assigned Section
                                </label>
                                <select id="gradingSectionSelect" class="w-full px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                                    <option value="">Select Section...</option>
                                </select>
                            </div>

                            <!-- 2. Quarter Quick-Switch Segmented Pill Bar -->
                            <div>
                                <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                                    Grading Period
                                </span>
                                <div class="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200/80" role="group" aria-label="Quarter Selection">
                                    <button type="button" onclick="App.setGradingQuarter('Q1')" data-qtr-btn="Q1" class="qtr-tab-btn px-3 py-1 rounded-md text-[12px] font-semibold transition cursor-pointer">1st Qtr (Q1)</button>
                                    <button type="button" onclick="App.setGradingQuarter('Q2')" data-qtr-btn="Q2" class="qtr-tab-btn px-3 py-1 rounded-md text-[12px] font-semibold transition cursor-pointer">2nd Qtr (Q2)</button>
                                    <button type="button" onclick="App.setGradingQuarter('Q3')" data-qtr-btn="Q3" class="qtr-tab-btn px-3 py-1 rounded-md text-[12px] font-semibold transition cursor-pointer">3rd Qtr (Q3)</button>
                                    <button type="button" onclick="App.setGradingQuarter('Q4')" data-qtr-btn="Q4" class="qtr-tab-btn px-3 py-1 rounded-md text-[12px] font-semibold transition cursor-pointer">4th Qtr (Q4)</button>
                                </div>
                                <!-- Hidden select kept for compatibility -->
                                <select id="gradingQuarterSelect" class="hidden" aria-hidden="true">
                                    <option value="Q1">Q1</option>
                                    <option value="Q2">Q2</option>
                                    <option value="Q3">Q3</option>
                                    <option value="Q4">Q4</option>
                                </select>
                            </div>

                            <!-- 3. Subject Dropdown (synced with Subject Tabs below) -->
                            <div class="sm:w-64">
                                <label for="gradingSubjectSelect" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                                    Subject View Mode
                                </label>
                                <select id="gradingSubjectSelect" class="w-full px-3 py-1.5 text-[12px] font-medium rounded-lg border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                                    <option value="ALL">All Assigned Subjects (Master Sheet)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Save Status, Auto-Save Toggle & Action Buttons -->
                        <div class="flex flex-wrap items-center gap-2 shrink-0">
                            <!-- Auto-save toggle -->
                            <label class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700 cursor-pointer select-none" title="Automatically save grade changes when moving to the next cell">
                                <input type="checkbox" id="autoSaveGradesToggle" checked class="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500 border-slate-300">
                                <span>Auto-Save</span>
                            </label>

                            <!-- Save Status Pill -->
                            <span id="gradingSaveStatusBadge" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>All Saved</span>
                            </span>

                            <button type="button" onclick="App.openQuarterlyReportForActiveSection()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer">
                                <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                                <span>Quarterly Ranking</span>
                            </button>

                            <button type="button" id="saveGradesBtn" onclick="App.saveCurrentGradesSheet()" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-600/20 transition cursor-pointer" title="Shortcut: Ctrl + S">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                                <span>Save Grades</span>
                            </button>
                        </div>
                    </div>

                    <!-- Row 2: One-Click Subject Pill Tabs (with Completion Progress) -->
                    <div id="gradingSubjectTabs" class="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-1 border-t border-slate-100">
                        <!-- Populated by JS -->
                    </div>

                    <!-- Row 3: Search Student + Quick-Fill Toolbar + Keyboard Hints -->
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                        <!-- Filter Student in Grade Sheet -->
                        <div class="relative w-full md:w-64">
                            <svg class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <input type="text" id="gradingStudentSearchInput" placeholder="Filter student in sheet..." class="w-full pl-8 pr-3 py-1 text-[12px] rounded-lg border border-slate-300 focus:border-brand-500 outline-none">
                        </div>

                        <!-- Quick-Fill Empty Cells Helper -->
                        <div class="flex flex-wrap items-center gap-1.5">
                            <span class="text-[11px] font-semibold text-slate-500">Quick-Fill Blank Cells:</span>
                            <button type="button" onclick="App.quickFillEmptyGrades(85)" class="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition cursor-pointer">85</button>
                            <button type="button" onclick="App.quickFillEmptyGrades(88)" class="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition cursor-pointer">88</button>
                            <button type="button" onclick="App.quickFillEmptyGrades(90)" class="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 transition cursor-pointer">90</button>
                            <button type="button" onclick="App.quickFillEmptyGrades(92)" class="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 transition cursor-pointer">92</button>
                            <button type="button" onclick="App.quickFillEmptyGrades(95)" class="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 transition cursor-pointer">95</button>
                            <span class="text-slate-300 mx-1">|</span>
                            <span class="text-[11px] text-slate-400 hidden sm:inline">
                                Tip: Use <kbd class="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-600 font-mono text-[10px]">Enter</kbd> or <kbd class="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-600 font-mono text-[10px]">&uarr;&darr;&larr;&rarr;</kbd> to navigate cells like Excel
                            </span>
                        </div>
                    </div>

                    <!-- Row 4: Live Excel Formula & Active Cell Inspector Bar -->
                    <div id="gradingFormulaBanner" class="rounded-lg bg-slate-900 text-slate-200 px-3 py-2 text-[11px] flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] shrink-0">fx</span>
                            <code id="gradingFormulaCode" class="text-emerald-300 font-mono text-[11px] truncate">(((E21*4)+(F21*4)+(G21*4)+(H21*4)+(I21*4)+(J21*3)+(K21*1)+(L21*4))/28)</code>
                        </div>
                        <span id="gradingMetaSummary" class="text-slate-400 text-[11px] shrink-0">Click any student cell to inspect their live weighted formula calculation.</span>
                    </div>
                </div>

                <!-- Grade Input Table Container -->
                <div id="gradingSheetContainer" class="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                    <!-- Populated by JS -->
                </div>
            </section>

            <!-- ==================== VIEW 6: QUARTERLY REPORT, RANKING & HONOR PULLOUT ==================== -->
            <section id="view-reports" class="view-panel hidden space-y-6">
                <!-- Controls Header -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-end justify-between gap-4 no-print">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-xl">
                        <div>
                            <label for="reportSectionSelect" class="block text-xs font-semibold text-slate-700 mb-1">
                                Select Section
                            </label>
                            <select id="reportSectionSelect" class="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                                <option value="">Select Section...</option>
                            </select>
                        </div>

                        <div>
                            <label for="reportQuarterSelect" class="block text-xs font-semibold text-slate-700 mb-1">
                                Quarterly Report Period
                            </label>
                            <select id="reportQuarterSelect" class="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                                <option value="Q1">1st Quarter Report (Q1)</option>
                                <option value="Q2">2nd Quarter Report (Q2)</option>
                                <option value="Q3">3rd Quarter Report (Q3)</option>
                                <option value="Q4">4th Quarter Report (Q4)</option>
                                <option value="FINAL">Final / Cumulative Average (Q1–Q4)</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2.5">
                        <button type="button" onclick="App.openGradingForReportSection()" class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer">
                            <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            <span>Edit Section Grades</span>
                        </button>

                        <button type="button" onclick="window.print()" class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition cursor-pointer">
                            <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                            </svg>
                            <span>Print Quarterly Report</span>
                        </button>
                    </div>
                </div>

                <!-- Automated Report Content Container -->
                <div id="quarterlyReportContainer" class="space-y-6">
                    <!-- Populated by JS -->
                </div>
            </section>

        </main>
    </div>
</div>

<!-- ==================== MODAL 1: CREATE / EDIT SECTION ==================== -->
<div id="sectionModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="sectionModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('sectionModal')"></div>

        <div class="inline-block w-full max-w-xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-slate-200">
            <div class="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                    <h3 id="sectionModalTitle" class="font-display font-bold text-lg text-slate-900">Create Section</h3>
                    <p class="text-xs text-slate-500">Define section name, year level, and optional initial subjects</p>
                </div>
                <button type="button" onclick="App.closeModal('sectionModal')" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="sectionForm" class="p-6 space-y-4">
                <input type="hidden" id="sectionIdInput" name="id">

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="sectionNameInput" class="block text-xs font-semibold text-slate-700 mb-1">
                            Section Name <span class="text-rose-500">*</span>
                        </label>
                        <input type="text" id="sectionNameInput" required placeholder="e.g., BSIT 1-A or Section Ruby" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                    </div>

                    <div>
                        <label for="sectionYearLevelInput" class="block text-xs font-semibold text-slate-700 mb-1">
                            Year Level <span class="text-rose-500">*</span>
                        </label>
                        <select id="sectionYearLevelInput" required class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                            <option value="" disabled selected>Select Year Level</option>
                            <optgroup label="College / Tertiary">
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </optgroup>
                            <optgroup label="High School (K-12)">
                                <option value="Grade 7">Grade 7</option>
                                <option value="Grade 8">Grade 8</option>
                                <option value="Grade 9">Grade 9</option>
                                <option value="Grade 10">Grade 10</option>
                                <option value="Grade 11">Grade 11</option>
                                <option value="Grade 12">Grade 12</option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                <div>
                    <label for="sectionAdviserInput" class="block text-xs font-semibold text-slate-700 mb-1">
                        Class Adviser / Coordinator <span class="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input type="text" id="sectionAdviserInput" placeholder="e.g., Prof. Maria Santos" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                </div>

                <div class="pt-2">
                    <div class="flex items-center justify-between mb-1.5">
                        <label class="block text-xs font-semibold text-slate-700">
                            Assign Subjects to this Section
                        </label>
                        <button type="button" onclick="App.openSubjectModal(null, true)" class="text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer">
                            + Create New Subject
                        </button>
                    </div>
                    <div id="sectionModalSubjectsChecklist" class="max-h-48 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl p-2.5 bg-slate-50/60 space-y-1.5">
                        <!-- Checkboxes populated by JS -->
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                    <button type="button" onclick="App.closeModal('sectionModal')" class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" id="sectionSubmitBtn" class="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition cursor-pointer">
                        Save Section
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ==================== MODAL 2: CREATE / EDIT SUBJECT ==================== -->
<div id="subjectModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="subjectModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('subjectModal')"></div>

        <div class="inline-block w-full max-w-lg my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-slate-200">
            <div class="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                    <h3 id="subjectModalTitle" class="font-display font-bold text-lg text-slate-900">Add New Subject</h3>
                    <p class="text-xs text-slate-500">Define subject code, descriptive title, and credit units (weight in ranking)</p>
                </div>
                <button type="button" onclick="App.closeModal('subjectModal')" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="subjectForm" class="p-6 space-y-4">
                <input type="hidden" id="subjectIdInput" name="id">

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="sm:col-span-2">
                        <label for="subjectCodeInput" class="block text-xs font-semibold text-slate-700 mb-1">
                            Subject Code <span class="text-rose-500">*</span>
                        </label>
                        <input type="text" id="subjectCodeInput" required placeholder="e.g., SUBJ 101" class="w-full px-3.5 py-2 text-sm uppercase rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                    </div>

                    <div>
                        <label for="subjectUnitsInput" class="block text-xs font-semibold text-slate-700 mb-1">
                            Units (Weight) <span class="text-rose-500">*</span>
                        </label>
                        <input type="number" step="0.5" min="0.5" max="15" id="subjectUnitsInput" value="4.0" required class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                    </div>
                </div>

                <div>
                    <label for="subjectNameInput" class="block text-xs font-semibold text-slate-700 mb-1">
                        Subject Name / Descriptive Title <span class="text-rose-500">*</span>
                    </label>
                    <input type="text" id="subjectNameInput" required placeholder="e.g., Introduction to Computing" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                </div>

                <div>
                    <label for="subjectDescInput" class="block text-xs font-semibold text-slate-700 mb-1">
                        Description <span class="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea id="subjectDescInput" rows="2" placeholder="Brief course overview..." class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"></textarea>
                </div>

                <div id="subjectAssignSectionsWrapper" class="pt-1">
                    <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                        Assign to Sections <span class="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div id="subjectModalSectionsChecklist" class="max-h-36 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl p-2.5 bg-slate-50/60 space-y-1.5">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                    <button type="button" onclick="App.closeModal('subjectModal')" class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" id="subjectSubmitBtn" class="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition cursor-pointer">
                        Save Subject
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ==================== MODAL 3: MANAGE SECTION SUBJECT ASSIGNMENTS ==================== -->
<div id="assignSubjectsModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="assignModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('assignSubjectsModal')"></div>

        <div class="inline-block w-full max-w-3xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-slate-200">
            <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-2">
                        <span id="assignModalYearBadge" class="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-brand-500/30 text-brand-200 border border-brand-400/30">1st Year</span>
                        <h3 id="assignModalTitle" class="font-display font-bold text-lg">Manage Subjects — Section</h3>
                    </div>
                    <p class="text-xs text-slate-400 mt-0.5">Select the subjects taken by this section and optionally set schedules or instructors</p>
                </div>
                <button type="button" onclick="App.closeModal('assignSubjectsModal')" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="assignSubjectsForm" class="p-6 space-y-4">
                <input type="hidden" id="assignSectionIdInput">

                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="relative flex-1">
                        <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" id="assignSubjectSearch" placeholder="Filter subjects by code or name..." class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                    </div>

                    <div class="flex items-center gap-2">
                        <button type="button" onclick="App.toggleAllAssignSubjects(true)" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
                            Select All
                        </button>
                        <button type="button" onclick="App.toggleAllAssignSubjects(false)" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
                            Clear All
                        </button>
                        <button type="button" onclick="App.openSubjectModal(null, true)" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer">
                            + New Subject
                        </button>
                    </div>
                </div>

                <div id="assignSubjectsListContainer" class="max-h-96 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl divide-y divide-slate-200/70 bg-slate-50/40">
                    <!-- Populated by JS -->
                </div>

                <div class="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="text-xs text-slate-600">
                        Selected: <strong id="assignSelectedCount" class="text-slate-900">0</strong> subjects (Divisor: <strong id="assignSelectedUnits" class="text-brand-600">0.0</strong> total units)
                    </div>
                    <div class="flex items-center justify-end gap-2.5">
                        <button type="button" onclick="App.closeModal('assignSubjectsModal')" class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" id="assignSubjectsSubmitBtn" class="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition cursor-pointer">
                            Save Assigned Subjects
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ==================== MODAL 4: ADD / EDIT STUDENT ==================== -->
<div id="studentModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="studentModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('studentModal')"></div>

        <div class="inline-block w-full max-w-xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-slate-200">
            <div class="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                    <h3 id="studentModalTitle" class="font-display font-bold text-lg text-slate-900">Enroll Student</h3>
                    <p class="text-xs text-slate-500">Enter student name, year level, and section</p>
                </div>
                <button type="button" onclick="App.closeModal('studentModal')" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="studentForm" class="p-6 space-y-4">
                <input type="hidden" id="studentIdInput" name="id">

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="studentNoInput" class="block text-xs font-semibold text-slate-700 mb-1">
                            Student ID Number <span class="text-slate-400 font-normal">(Auto if blank)</span>
                        </label>
                        <input type="text" id="studentNoInput" placeholder="e.g., 2026-0001" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                    </div>

                    <div>
                        <label for="studentStatusInput" class="block text-xs font-semibold text-slate-700 mb-1">
                            Enrollment Status
                        </label>
                        <select id="studentStatusInput" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                            <option value="Active">Active (Regular)</option>
                            <option value="Irregular">Irregular</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                        <label for="studentFirstNameInput" class="block text-xs font-semibold text-slate-700 mb-1">
                            First Name <span class="text-rose-500">*</span>
                        </label>
                        <input type="text" id="studentFirstNameInput" required placeholder="e.g., Juan" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                    </div>

                    <div>
                        <label for="studentMiddleNameInput" class="block text-xs font-semibold text-slate-700 mb-1">
                            Middle Name / M.I.
                        </label>
                        <input type="text" id="studentMiddleNameInput" placeholder="e.g., M." class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                    </div>

                    <div>
                        <label for="studentLastNameInput" class="block text-xs font-semibold text-slate-700 mb-1">
                            Last Name <span class="text-rose-500">*</span>
                        </label>
                        <input type="text" id="studentLastNameInput" required placeholder="e.g., Dela Cruz" class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                        <label for="studentYearLevelSelect" class="block text-xs font-semibold text-slate-700 mb-1">
                            Year Level <span class="text-rose-500">*</span>
                        </label>
                        <select id="studentYearLevelSelect" required class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                            <option value="">All / Auto from Section</option>
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

                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label for="studentSectionSelect" class="block text-xs font-semibold text-slate-700">
                                Assigned Section <span class="text-rose-500">*</span>
                            </label>
                            <button type="button" onclick="App.openSectionModal(null, true)" class="text-[11px] font-semibold text-brand-600 hover:text-brand-700 cursor-pointer">
                                + New Section
                            </button>
                        </div>
                        <select id="studentSectionSelect" required class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none">
                            <option value="" disabled selected>Select Section</option>
                        </select>
                    </div>
                </div>

                <div class="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="text-xs font-semibold text-slate-700">Section Subject Load Preview</span>
                        <span id="studentModalSubjectCount" class="text-[11px] font-medium text-brand-600">0 subjects</span>
                    </div>
                    <div id="studentModalSubjectsPreview" class="flex flex-wrap gap-1.5 text-xs text-slate-500">
                        Select a section to preview its assigned subjects.
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                    <button type="button" onclick="App.closeModal('studentModal')" class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" id="studentSubmitBtn" class="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition cursor-pointer">
                        Save Student
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ==================== MODAL 5: CONFIRMATION DIALOG ==================== -->
<div id="confirmModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('confirmModal')"></div>

        <div class="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 border border-slate-200">
            <div class="flex items-start gap-4">
                <div class="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <div>
                    <h3 id="confirmModalTitle" class="font-display font-bold text-base text-slate-900">Confirm Deletion</h3>
                    <p id="confirmModalMessage" class="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">Are you sure you want to delete this record?</p>
                </div>
            </div>

            <div class="mt-6 flex items-center justify-end gap-2.5">
                <button type="button" onclick="App.closeModal('confirmModal')" class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                    Cancel
                </button>
                <button type="button" id="confirmModalActionBtn" class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition cursor-pointer">
                    Yes, Delete
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Toast Notification Container -->
<div id="toastContainer" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none no-print"></div>

<!-- Main Application JS -->
<script src="assets/js/app.js"></script>
</body>
</html>
