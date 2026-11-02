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

