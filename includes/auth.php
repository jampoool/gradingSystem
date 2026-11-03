<?php
declare(strict_types=1);

/**
 * Session-based authentication helpers for GradeFlow.
 * Roles:
 *   - admin   : full access (sections, subjects, students, teacher accounts, all grades)
 *   - teacher : can only view sections where they handle at least one subject,
 *               and can only encode grades for the subjects assigned to them.
 */

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('GRADEFLOWSESSID');
    session_start();
}

function currentUser(): ?array
{
    return $_SESSION['user'] ?? null;
}

function isAdmin(): bool
{
    return (currentUser()['role'] ?? '') === 'admin';
}

function loginUser(array $userRow): void
{
    session_regenerate_id(true);
    $isAdmin = ($userRow['role'] ?? '') === 'admin';
    $_SESSION['user'] = [
        'id'             => (int)$userRow['id'],
        'username'       => $userRow['username'],
        'full_name'      => $userRow['full_name'],
        'role'           => $userRow['role'],
        'can_add_student'=> $isAdmin || !empty($userRow['can_add_student']),
    ];
}

function logoutUser(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

/** Redirects to the login page when no user is signed in (for HTML pages). */
function requireLoginPage(): array
{
    $user = currentUser();
    if (!$user) {
        header('Location: login.php');
        exit;
    }
    return $user;
}

/**
 * Returns the authentic, handcrafted GradeFlow Academic Crest / Seal SVG.
 * Designed to replace generic AI outline icons with a prestigious institutional seal.
 */
function renderAcademicSealSvg(string $className = 'w-12 h-12', string $ariaLabel = 'GradeFlow Official Academic Crest'): string
{
    return <<<HTML
    <svg class="{$className} shrink-0 select-none drop-shadow-sm" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{$ariaLabel}">
        <!-- Outer Concentric Seal Rings -->
        <circle cx="32" cy="32" r="30" fill="#17243A" stroke="#5276A7" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="26.5" fill="none" stroke="#D99B26" stroke-width="0.75" stroke-dasharray="1.5 2" opacity="0.85"/>
        <circle cx="32" cy="32" r="24" fill="#1E2E48" stroke="#2C4870" stroke-width="1"/>

        <!-- Classical Academic Heraldic Shield -->
        <path d="M32 11C41.5 11 47 14 47 21C47 34.5 32 46.5 32 49C32 46.5 17 34.5 17 21C17 14 22.5 11 32 11Z" fill="#17243A" stroke="#D99B26" stroke-width="1.2" stroke-linejoin="round"/>

        <!-- Upper Arch Division Accent -->
        <path d="M20 20C24 21.5 40 21.5 44 20" stroke="#5276A7" stroke-width="0.75" opacity="0.5"/>

        <!-- Triad of Scholastic Honor Stars -->
        <!-- Center Star -->
        <polygon points="32,13 32.7,14.8 34.7,14.9 33.1,16.1 33.6,18 32,16.9 30.4,18 30.9,16.1 29.3,14.9 31.3,14.8" fill="#F0D296"/>
        <!-- Left Star -->
        <polygon points="25,15 25.6,16.4 27.2,16.5 25.9,17.4 26.3,18.9 25,18 23.7,18.9 24.1,17.4 22.8,16.5 24.4,16.4" fill="#F0D296" opacity="0.85"/>
        <!-- Right Star -->
        <polygon points="39,15 39.6,16.4 41.2,16.5 39.9,17.4 40.3,18.9 39,18 37.7,18.9 38.1,17.4 36.8,16.5 38.4,16.4" fill="#F0D296" opacity="0.85"/>

        <!-- Torch of Knowledge & Truth -->
        <path d="M30.8 26H33.2L32.8 30H31.2L30.8 26Z" fill="#D8DEE8" stroke="#5276A7" stroke-width="0.5"/>
        <!-- Torch Flame Outer -->
        <path d="M32 19.5C33.2 21 34 22.2 33.2 24.2C32.4 24.8 31.6 24.8 30.8 24.2C30 22.2 30.8 21 32 19.5Z" fill="#E97E2E"/>
        <!-- Torch Flame Core -->
        <path d="M32 21C32.6 21.9 33 22.7 32.6 23.7C32.1 24.1 31.8 24.1 31.4 23.7C31 22.7 31.4 21.9 32 21Z" fill="#FCD34D"/>

        <!-- Open Academic Tome / Ledger of Learning -->
        <!-- Left Page -->
        <path d="M32 37.5C27.5 35.2 23.5 35.8 21 37.2V29C23.5 27.6 27.5 27 32 29V37.5Z" fill="#FFFFFF" stroke="#17243A" stroke-width="0.75" stroke-linejoin="round"/>
        <!-- Right Page -->
        <path d="M32 37.5C36.5 35.2 40.5 35.8 43 37.2V29C40.5 27.6 36.5 27 32 29V37.5Z" fill="#FFFFFF" stroke="#17243A" stroke-width="0.75" stroke-linejoin="round"/>
        <!-- Book Spine Shadow -->
        <line x1="32" y1="29" x2="32" y2="37.8" stroke="#17243A" stroke-width="1" stroke-linecap="round"/>
        <!-- Ruled Lines (Left) -->
        <line x1="23.5" y1="30.5" x2="29.5" y2="29.8" stroke="#5276A7" stroke-width="0.6" stroke-linecap="round"/>
        <line x1="23.5" y1="32.5" x2="29.5" y2="31.8" stroke="#5276A7" stroke-width="0.6" stroke-linecap="round"/>
        <line x1="23.5" y1="34.5" x2="28.5" y2="33.8" stroke="#5276A7" stroke-width="0.6" stroke-linecap="round"/>
        <!-- Ruled Lines (Right) -->
        <line x1="34.5" y1="29.8" x2="40.5" y2="30.5" stroke="#5276A7" stroke-width="0.6" stroke-linecap="round"/>
        <line x1="34.5" y1="31.8" x2="40.5" y2="32.5" stroke="#5276A7" stroke-width="0.6" stroke-linecap="round"/>
        <line x1="34.5" y1="33.8" x2="39.5" y2="34.5" stroke="#5276A7" stroke-width="0.6" stroke-linecap="round"/>

        <!-- Classical Laurel Wreath Flanking Shield (Scholastic Honor) -->
        <!-- Left Laurel -->
        <path d="M13 28C11 31.5 11 36 13.5 39.5C14.8 36 16.2 33.5 18.5 32.5" stroke="#99D8CC" stroke-width="1.1" stroke-linecap="round" fill="none"/>
        <path d="M15 37C17.2 40.5 20.5 42.5 24 43.5" stroke="#99D8CC" stroke-width="1.1" stroke-linecap="round" fill="none"/>
        <!-- Right Laurel -->
        <path d="M51 28C53 31.5 53 36 50.5 39.5C49.2 36 47.8 33.5 45.5 32.5" stroke="#99D8CC" stroke-width="1.1" stroke-linecap="round" fill="none"/>
        <path d="M49 37C46.8 40.5 43.5 42.5 40 43.5" stroke="#99D8CC" stroke-width="1.1" stroke-linecap="round" fill="none"/>

        <!-- Bottom Crest Ribbon Tie Knot -->
        <circle cx="32" cy="44.5" r="1.5" fill="#F0D296" stroke="#B7791F" stroke-width="0.5"/>

        <!-- Foundation Motto Banner at Base -->
        <path d="M22 53C28 55 36 55 42 53" stroke="#D99B26" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.75"/>
    </svg>
    HTML;
}

/**
 * Re-validates the session user against the database so that deactivated
 * or deleted accounts lose access immediately.
 */
function refreshSessionUser(PDO $pdo): ?array
{
    $user = currentUser();
    if (!$user) {
        return null;
    }
    $stmt = $pdo->prepare("SELECT id, username, full_name, role, can_add_student, is_active FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();
    if (!$row || (int)$row['is_active'] !== 1) {
        logoutUser();
        return null;
    }
    $isAdmin = ($row['role'] ?? '') === 'admin';
    $_SESSION['user']['full_name'] = $row['full_name'];
    $_SESSION['user']['role'] = $row['role'];
    $_SESSION['user']['username'] = $row['username'];
    $_SESSION['user']['can_add_student'] = $isAdmin || !empty($row['can_add_student']);
    return $_SESSION['user'];
}

