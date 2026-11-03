<?php
declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';

if (currentUser()) {
    header('Location: index.php');
    exit;
}

$error = '';
$username = '';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $username = trim((string)($_POST['username'] ?? ''));
    $password = (string)($_POST['password'] ?? '');

    if ($username === '' || $password === '') {
        $error = 'Please enter both your username and password.';
    } else {
        $dbStatus = getDatabaseStatus();
        if (!$dbStatus['connected']) {
            $error = 'Cannot connect to the database. Please ensure your database server is active.';
        } else {
            $pdo = getDBConnection();
            $stmt = $pdo->prepare("SELECT id, username, password_hash, full_name, role, can_add_student, is_active FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $row = $stmt->fetch();

            if (!$row || !password_verify($password, $row['password_hash'])) {
                $error = 'Invalid credentials. Please verify your username and password.';
            } elseif ((int)$row['is_active'] !== 1) {
                $error = 'This account has been deactivated. Please contact your school administrator.';
            } else {
                loginUser($row);
                $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = ?")->execute([$row['id']]);
                header('Location: index.php?login=success');
                exit;
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en" class="h-full bg-[#F5F7FA]">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In — GradeFlow Academic Grading System</title>
    <meta name="description" content="Secure portal sign-in for faculty and administrators of GradeFlow Academic Management System.">
    <script src="https://cdn.tailwindcss.com"></script>
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
                    colors: {
                        ap: {
                            navy: '#17243A',
                            navyHover: '#243752',
                            slate: '#5276A7',
                            slateBg: '#EBF1F8',
                            slateText: '#2C4870',
                            teal: '#0F766E',
                            mintBg: '#D5F0EA',
                            plum: '#9B3F72',
                            roseBg: '#F5DFEB',
                            amber: '#B7791F',
                            sandBg: '#FFF0D1',
                            cloud: '#F5F7FA',
                            border: '#D8DEE8',
                            muted: '#475569'
                        }
                    }
                }
            }
        };
    </script>
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        /* Ambient Background Mesh Pattern for Brand Showcase Canvas */
        .academic-mesh-bg {
            background-color: #17243A;
            background-image: 
                radial-gradient(at 0% 0%, rgba(82, 118, 167, 0.35) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(15, 118, 110, 0.30) 0px, transparent 50%),
                radial-gradient(at 50% 50%, rgba(155, 63, 114, 0.15) 0px, transparent 65%);
        }
        .grid-pattern {
            background-size: 32px 32px;
            background-image: linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
        }
    </style>
</head>
<body class="h-full font-sans text-[#17243A] antialiased bg-[#F5F7FA]">
    <div class="min-h-full flex flex-col lg:flex-row">
        
        <!-- ==================== LEFT CANVAS: BRAND SHOWCASE & ACADEMIC VALUE (Principles of Design: Hierarchy, Balance & Rhythm) ==================== -->
        <div class="hidden lg:flex lg:w-7/12 academic-mesh-bg text-white p-12 xl:p-16 relative overflow-hidden flex-col justify-between grid-pattern">
            <!-- Background Glow Flares -->
            <div class="absolute -top-32 -left-32 w-96 h-96 bg-[#5276A7]/25 rounded-full blur-3xl pointer-events-none" aria-hidden="true"></div>
            <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-[#0F766E]/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true"></div>

            <!-- Top Brand Header -->
            <div class="relative z-10 flex items-center gap-3.5">
                <?= renderAcademicSealSvg('w-12 h-12') ?>
                <div>
                    <span class="font-display font-extrabold text-2xl tracking-tight leading-none text-white block">GradeFlow</span>
                    <span class="text-[11px] font-bold uppercase tracking-widest text-[#F0D296] mt-1 block">Institutional Academic Management</span>
                </div>
            </div>

            <!-- Core Value Headline & Pillars -->
            <div class="relative z-10 max-w-xl my-auto py-12">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-slate-200 mb-6 shadow-xs">
                    <span class="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse"></span>
                    <span>Institutional Faculty &amp; Grading Portal</span>
                </div>

                <h1 class="font-display text-3xl xl:text-4xl font-extrabold leading-tight text-white">
                    Precision grading and effortless academic workflows for modern institutions.
                </h1>

                <p class="text-slate-300 mt-4 text-base leading-relaxed font-normal">
                    Designed for faculty efficiency and institutional governance. Teachers manage their designated class loads with live computations, while administrators preserve grade integrity.
                </p>

                <!-- Value Proposition Grid (3 Clean Cards) -->
                <div class="mt-8 grid sm:grid-cols-3 gap-3.5 pt-6 border-t border-white/10">
                    <div class="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
                        <div class="w-8 h-8 rounded-xl bg-[#5276A7]/30 border border-[#5276A7]/40 flex items-center justify-center text-white mb-2.5">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                        </div>
                        <h2 class="font-bold text-sm text-white">Role-Based Scope</h2>
                        <p class="text-xs text-slate-300 mt-1 leading-normal">Faculty view strictly their assigned sections and subject loads.</p>
                    </div>

                    <div class="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
                        <div class="w-8 h-8 rounded-xl bg-[#0F766E]/30 border border-[#0F766E]/40 flex items-center justify-center text-[#99D8CC] mb-2.5">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <h2 class="font-bold text-sm text-white">Live Transmutation</h2>
                        <p class="text-xs text-slate-300 mt-1 leading-normal">Automated weighted averages, honor ranks, and quarterly reports.</p>
                    </div>

                    <div class="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
                        <div class="w-8 h-8 rounded-xl bg-[#B7791F]/30 border border-[#B7791F]/40 flex items-center justify-center text-[#F0D296] mb-2.5">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                        </div>
                        <h2 class="font-bold text-sm text-white">Lock &amp; Approval</h2>
                        <p class="text-xs text-slate-300 mt-1 leading-normal">Tamper-proof finalization with administrative unlock workflows.</p>
                    </div>
                </div>
            </div>

            <!-- Bottom Institutional Metadata -->
            <div class="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10 text-xs text-slate-400">
                <div class="flex items-center gap-2">
                    <span class="inline-block w-2 h-2 rounded-full bg-[#0F766E]"></span>
                    <span>System Active &bull; DepEd / CHED Policy Compliant</span>
                </div>
                <span>Academic Year 2026–2027 &bull; v2.4</span>
            </div>
        </div>

        <!-- ==================== RIGHT CANVAS: INTERACTIVE SIGN-IN FORM (Principles of Design: Contrast, Alignment & Affordance) ==================== -->
        <div class="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[#F5F7FA]">
            <!-- Mobile Brand Bar (Visible only on small screens) -->
            <div class="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-[#D8DEE8]">
                <div class="flex items-center gap-3">
                    <?= renderAcademicSealSvg('w-10 h-10') ?>
                    <div>
                        <span class="font-display font-bold text-lg text-[#17243A]">GradeFlow</span>
                        <span class="block text-[11px] font-semibold text-[#475569]">Academic Grading Portal</span>
                    </div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]">
                    A.Y. 2026–2027
                </span>
            </div>

            <!-- Centered Sign-in Card Container -->
            <div class="w-full max-w-md mx-auto my-auto">
                <div class="bg-white rounded-3xl border border-[#D8DEE8] p-7 sm:p-9 shadow-xl shadow-[#17243A]/5 transition-all">
                    
                    <!-- Institutional Crest & Official Portal Heading -->
                    <div class="flex items-center gap-3.5 mb-6 pb-5 border-b border-[#D8DEE8]">
                        <?= renderAcademicSealSvg('w-11 h-11') ?>
                        <div>
                            <span class="font-display font-extrabold text-xl text-[#17243A] block leading-none">GradeFlow</span>
                            <span class="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] mt-1 block">Official Faculty &amp; Staff Portal</span>
                        </div>
                    </div>

                    <!-- Form Header -->
                    <div class="mb-6">
                        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA] mb-3">
                            <span class="w-2 h-2 rounded-full bg-[#0F766E]"></span>
                            <span>Secure Institutional Authentication</span>
                        </div>
                        <h2 class="font-display text-2xl sm:text-3xl font-extrabold text-[#17243A] tracking-tight">
                            Sign In
                        </h2>
                        <p class="text-sm text-[#475569] mt-1.5 leading-relaxed">
                            Sign in with your assigned institutional account to access your grade sheets.
                        </p>
                    </div>

                    <!-- Error Alert (WCAG 2.1 AA Compliant Contrast) -->
                    <?php if ($error !== ''): ?>
                    <div id="loginErrorAlert" class="mb-5 flex items-start gap-3 rounded-2xl bg-[#F5DFEB] border border-[#E2B8CF] p-4 text-sm text-[#842D60] shadow-xs" role="alert" aria-live="assertive">
                        <div class="w-5 h-5 rounded-full bg-[#9B3F72] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5" aria-hidden="true">
                            &#10005;
                        </div>
                        <div class="flex-1">
                            <p class="font-bold text-sm text-[#842D60]">Authentication Failed</p>
                            <p class="text-xs text-[#842D60]/90 mt-0.5 leading-relaxed"><?= htmlspecialchars($error) ?></p>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Form Controls -->
                    <form method="post" action="login.php" class="space-y-4" novalidate id="loginForm">
                        <!-- Username Field -->
                        <div>
                            <label for="username" class="block text-xs font-bold uppercase tracking-wider text-[#17243A] mb-1.5">
                                Username <span class="text-[#9B3F72]">*</span>
                            </label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#475569]">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                </div>
                                <input id="username" name="username" type="text" autocomplete="username" required autofocus
                                    value="<?= htmlspecialchars($username) ?>"
                                    placeholder="Enter your username"
                                    <?= $error !== '' ? 'aria-invalid="true" aria-describedby="loginErrorAlert"' : '' ?>
                                    class="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] placeholder-[#94A3B8] focus:border-[#5276A7] focus:ring-4 focus:ring-[#5276A7]/15 outline-none transition shadow-2xs font-medium">
                            </div>
                        </div>

                        <!-- Password Field -->
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label for="password" class="block text-xs font-bold uppercase tracking-wider text-[#17243A]">
                                    Password <span class="text-[#9B3F72]">*</span>
                                </label>
                                <span class="text-[11px] text-[#475569]">Case-sensitive</span>
                            </div>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#475569]">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                    </svg>
                                </div>
                                <input id="password" name="password" type="password" autocomplete="current-password" required
                                    placeholder="Enter your account password"
                                    <?= $error !== '' ? 'aria-invalid="true" aria-describedby="loginErrorAlert"' : '' ?>
                                    class="w-full pl-11 pr-12 py-3 text-sm rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] placeholder-[#94A3B8] focus:border-[#5276A7] focus:ring-4 focus:ring-[#5276A7]/15 outline-none transition shadow-2xs font-medium">
                                
                                <button type="button" id="togglePasswordBtn"
                                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#475569] hover:text-[#17243A] transition cursor-pointer"
                                    aria-controls="password" aria-label="Toggle password visibility">
                                    <svg id="eyeIcon" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                    </svg>
                                    <svg id="eyeOffIcon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Sign In Button -->
                        <div class="pt-2">
                            <button type="submit" id="submitBtn"
                                class="w-full py-3.5 px-5 rounded-xl text-sm font-bold text-white bg-[#17243A] hover:bg-[#243752] focus:ring-4 focus:ring-[#17243A]/25 shadow-md shadow-[#17243A]/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]">
                                <span>Sign In to Dashboard</span>
                                <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                                </svg>
                            </button>
                        </div>
                    </form>

                    <!-- Quick Demo Fill Section (Affordance & Usability Enhancement) -->
                    <div class="mt-6 pt-5 border-t border-[#D8DEE8]/80">
                        <div class="flex items-center justify-between mb-2.5">
                            <p class="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                                Quick-Fill Demo Accounts
                            </p>
                            <span class="text-[11px] font-semibold text-[#5276A7]">1-Click Login</span>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" onclick="fillCredentials('admin', 'admin123')"
                                class="p-2.5 rounded-xl border border-[#D8DEE8] hover:border-[#17243A] bg-[#F5F7FA] hover:bg-white text-left transition cursor-pointer group">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold text-[#17243A] group-hover:text-[#5276A7]">Admin</span>
                                    <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EBF1F8] text-[#2C4870]">Full</span>
                                </div>
                                <p class="text-[11px] font-mono text-[#475569] mt-0.5">admin / admin123</p>
                            </button>

                            <button type="button" onclick="fillCredentials('jpdaguman', 'teacher123')"
                                class="p-2.5 rounded-xl border border-[#D8DEE8] hover:border-[#0F766E] bg-[#F5F7FA] hover:bg-white text-left transition cursor-pointer group">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold text-[#17243A] group-hover:text-[#0F766E]">Teacher</span>
                                    <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#D5F0EA] text-[#0F766E]">Faculty</span>
                                </div>
                                <p class="text-[11px] font-mono text-[#475569] mt-0.5">jpdaguman / teacher123</p>
                            </button>
                        </div>
                    </div>

                </div>

                <!-- Security & Support Footer -->
                <div class="mt-6 text-center space-y-2">
                    <p class="text-xs text-[#475569] flex items-center justify-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-[#0F766E]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                        <span>Encrypted Session &bull; Grade Integrity Protection</span>
                    </p>
                    <p class="text-[11px] text-[#64748B]">
                        Need help? Please contact your school administrator or academic coordinator.
                    </p>
                </div>
            </div>

            <!-- Bottom Copyright / Version Bar (Mobile) -->
            <div class="lg:hidden text-center text-xs text-[#64748B] pt-6 border-t border-[#D8DEE8] mt-8">
                &copy; 2026 GradeFlow Academic Systems &bull; All rights reserved.
            </div>
        </div>

    </div>

    <!-- Interactive Client Script: Password Visibility & Quick Demo Fill -->
    <script>
        // Password Visibility Toggle with Accessible State Updates
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('togglePasswordBtn');
        const eyeIcon = document.getElementById('eyeIcon');
        const eyeOffIcon = document.getElementById('eyeOffIcon');

        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', function () {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                eyeIcon.classList.toggle('hidden', isPassword);
                eyeOffIcon.classList.toggle('hidden', !isPassword);
                this.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
                passwordInput.focus();
            });
        }

        // Quick Credentials Autofill Function
        function fillCredentials(username, password) {
            const uInput = document.getElementById('username');
            const pInput = document.getElementById('password');
            if (uInput && pInput) {
                uInput.value = username;
                pInput.value = password;
                
                // Visual feedback pulse on the inputs
                [uInput, pInput].forEach(el => {
                    el.classList.add('ring-2', 'ring-[#5276A7]', 'bg-[#EBF1F8]/30');
                    setTimeout(() => {
                        el.classList.remove('ring-2', 'ring-[#5276A7]', 'bg-[#EBF1F8]/30');
                    }, 400);
                });
                
                pInput.focus();
            }
        }

        // Form Submit Loading State Feedback
        document.getElementById('loginForm')?.addEventListener('submit', function () {
            const btn = document.getElementById('submitBtn');
            const overlay = document.getElementById('loginAuthOverlay');
            if (overlay) {
                overlay.classList.remove('hidden');
            }
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Authenticating...</span>
                `;
            }
            try {
                sessionStorage.setItem('gf_just_logged_in', 'true');
            } catch (e) {}
        });
    </script>

    <!-- Full-Screen Login Authentication Loading Overlay -->
    <div id="loginAuthOverlay" class="fixed inset-0 z-50 bg-[#17243A]/90 backdrop-blur-md hidden flex flex-col items-center justify-center p-6 text-white text-center transition-opacity" role="status" aria-live="polite">
        <div class="relative flex flex-col items-center max-w-sm w-full">
            <div class="relative w-20 h-20 mb-6 flex items-center justify-center">
                <div class="relative w-18 h-18 flex items-center justify-center crest-pulse">
                    <?= renderAcademicSealSvg('w-18 h-18') ?>
                </div>
            </div>

            <h3 class="font-display font-extrabold text-2xl text-white tracking-tight">Authenticating...</h3>
            <p class="text-xs font-semibold uppercase tracking-widest text-[#99D8CC] mt-1">Verifying Credentials</p>
            <p class="text-sm text-slate-300 mt-3 leading-relaxed">
                Connecting to institutional database and preparing your academic workspace...
            </p>

            <div class="w-64 bg-white/15 h-1.5 rounded-full overflow-hidden mt-6 relative border border-white/10">
                <div class="h-full bg-gradient-to-r from-[#0F766E] via-[#5276A7] to-[#99D8CC] rounded-full w-full animate-shimmer"></div>
            </div>
            <p class="text-[11px] text-slate-400 mt-4 font-mono">Securing Session Tokens...</p>
        </div>
    </div>
</body>
</html>
