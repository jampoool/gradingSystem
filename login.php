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
            $error = 'Cannot connect to the database. Please make sure MySQL is running.';
        } else {
            $pdo = getDBConnection();
            $stmt = $pdo->prepare("SELECT id, username, password_hash, full_name, role, can_add_student, is_active FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $row = $stmt->fetch();

            if (!$row || !password_verify($password, $row['password_hash'])) {
                $error = 'Incorrect username or password.';
            } elseif ((int)$row['is_active'] !== 1) {
                $error = 'This account has been deactivated. Please contact the administrator.';
            } else {
                loginUser($row);
                $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = ?")->execute([$row['id']]);
                header('Location: index.php');
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
    <title>Sign In — GradeFlow</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: { extend: { fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
            } } }
        };
    </script>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="h-full font-sans text-[#17243A] antialiased">
    <div class="min-h-full grid lg:grid-cols-2">
        <!-- Brand Panel (Midnight Navy) -->
        <div class="hidden lg:flex flex-col justify-between bg-[#17243A] text-white p-12">
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-[#5276A7] flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2.1" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                    </svg>
                </div>
                <div>
                    <p class="font-display font-bold text-xl leading-none">GradeFlow</p>
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-300 mt-1">Academic Management</p>
                </div>
            </div>

            <div class="max-w-md">
                <h1 class="font-display text-3xl font-bold leading-tight">Encode grades for your classes, all in one place.</h1>
                <p class="text-slate-300 mt-4 text-base leading-relaxed">
                    Teachers see only the sections and subjects they handle. Administrators manage sections, students, and teacher accounts.
                </p>
            </div>

            <p class="text-sm text-slate-400">Academic Year 2026–2027</p>
        </div>

        <!-- Sign-in Form -->
        <div class="flex items-center justify-center p-6 sm:p-12">
            <div class="w-full max-w-sm">
                <div class="lg:hidden flex items-center gap-3 mb-8">
                    <div class="w-10 h-10 rounded-xl bg-[#17243A] flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.1" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/>
                        </svg>
                    </div>
                    <p class="font-display font-bold text-xl">GradeFlow</p>
                </div>

                <h2 class="font-display text-2xl font-bold">Sign in</h2>
                <p class="text-[#475569] mt-1.5 text-base">Use the account provided by your school administrator.</p>

                <?php if ($error !== ''): ?>
                <div id="loginErrorAlert" class="mt-6 flex items-start gap-2.5 rounded-xl bg-[#F5DFEB] border border-[#E2B8CF] px-4 py-3 text-sm text-[#842D60]" role="alert" aria-live="assertive">
                    <span class="font-bold">&#10005;</span>
                    <span><?= htmlspecialchars($error) ?></span>
                </div>
                <?php endif; ?>

                <form method="post" action="login.php" class="mt-6 space-y-5" novalidate>
                    <div>
                        <label for="username" class="block text-sm font-semibold mb-1.5">Username</label>
                        <input id="username" name="username" type="text" autocomplete="username" required autofocus <?= $error !== '' ? 'aria-invalid="true" aria-describedby="loginErrorAlert"' : '' ?>
                            value="<?= htmlspecialchars($username) ?>"
                            class="w-full px-4 py-3 text-base rounded-xl border border-[#D8DEE8] bg-white focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                    </div>
                    <div>
                        <label for="password" class="block text-sm font-semibold mb-1.5">Password</label>
                        <div class="relative">
                            <input id="password" name="password" type="password" autocomplete="current-password" required <?= $error !== '' ? 'aria-invalid="true" aria-describedby="loginErrorAlert"' : '' ?>
                                class="w-full px-4 py-3 pr-20 text-base rounded-xl border border-[#D8DEE8] bg-white focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                            <button type="button" id="togglePassword" class="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-semibold text-[#5276A7] hover:text-[#17243A] hover:bg-[#EBF1F8] transition cursor-pointer" aria-controls="password" aria-label="Show password">Show</button>
                        </div>
                    </div>
                    <button type="submit" class="w-full py-3 rounded-xl text-base font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition">
                        Sign in
                    </button>
                </form>

                <div class="mt-8 rounded-xl bg-white border border-[#D8DEE8] p-4 text-sm text-[#475569]">
                    <p class="font-semibold text-[#17243A]">First time here?</p>
                    <p class="mt-1">Default administrator: <code class="font-mono text-[#17243A]">admin</code> / <code class="font-mono text-[#17243A]">admin123</code>. Change it after signing in.</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('togglePassword').addEventListener('click', function () {
            const input = document.getElementById('password');
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            this.textContent = show ? 'Hide' : 'Show';
            this.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        });
    </script>
</body>
</html>

