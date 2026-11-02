<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';

$pdo = getDBConnection();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

$input = [];
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $input = $decoded;
        }
    }
    if (empty($input) && !empty($_POST)) {
        $input = $_POST;
    }
    if (empty($action) && isset($input['action'])) {
        $action = (string)$input['action'];
    }
}

function respond(bool $success, string $message, array $data = [], int $status = 200): void
{
    http_response_code($status);
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message,
    ], $data));
    exit;
}

function normalizeGender(?string $raw, string $fallback = 'Female'): string
{
    $val = strtolower(trim((string)$raw));
    if (in_array($val, ['male', 'm', 'boy', 'boys'], true)) {
        return 'Male';
    }
    if (in_array($val, ['female', 'f', 'girl', 'girls'], true)) {
        return 'Female';
    }
    return $fallback === 'Male' ? 'Male' : 'Female';
}

function fetchSystemState(PDO $pdo): array
{
    // 0. Identify the signed-in viewer (admins see everything; teachers see only their handled sections)
    $viewer = currentUser();
    $viewerIsAdmin = ($viewer['role'] ?? '') === 'admin';
    $viewerId = (int)($viewer['id'] ?? 0);

    // 1. Fetch Sections (with Female & Male student counts)
    $sectionsStmt = $pdo->query("
        SELECT 
            s.id,
            s.section_name,
            s.year_level,
            s.adviser,
            s.created_at,
            COUNT(DISTINCT st.id) AS student_count,
            COALESCE(SUM(CASE WHEN st.gender = 'Female' THEN 1 ELSE 0 END), 0) AS female_count,
            COALESCE(SUM(CASE WHEN st.gender = 'Male' THEN 1 ELSE 0 END), 0) AS male_count
        FROM sections s
        LEFT JOIN students st ON st.section_id = s.id
        GROUP BY s.id
        ORDER BY s.year_level ASC, s.section_name ASC
    ");
    $sections = $sectionsStmt->fetchAll();

    // 2. Fetch Subjects
    $subjectsStmt = $pdo->query("
        SELECT 
            sub.id,
            sub.subject_code,
            sub.subject_name,
            sub.units,
            sub.description,
            sub.created_at,
            COUNT(DISTINCT ss.section_id) AS section_count
        FROM subjects sub
        LEFT JOIN section_subjects ss ON ss.subject_id = sub.id
        GROUP BY sub.id
        ORDER BY sub.subject_code ASC
    ");
    $subjects = $subjectsStmt->fetchAll();

    // 3. Fetch Section-Subject Assignments
    $assignmentsStmt = $pdo->query("
        SELECT 
            ss.id AS assignment_id,
            ss.section_id,
            ss.subject_id,
            ss.schedule,
            ss.instructor,
            ss.teacher_id,
            u.full_name AS teacher_name,
            ss.sort_order,
            ss.assigned_at,
            sub.subject_code,
            sub.subject_name,
            sub.units,
            sec.section_name,
            sec.year_level
        FROM section_subjects ss
        INNER JOIN subjects sub ON sub.id = ss.subject_id
        INNER JOIN sections sec ON sec.id = ss.section_id
        LEFT JOIN users u ON u.id = ss.teacher_id
        ORDER BY ss.sort_order ASC, ss.id ASC, sub.subject_code ASC
    ");
    $assignments = $assignmentsStmt->fetchAll();

    $sectionSubjectsMap = [];
    $subjectSectionsMap = [];
    foreach ($assignments as $row) {
        $secId = (int)$row['section_id'];
        $subId = (int)$row['subject_id'];

        $sectionSubjectsMap[$secId][] = [
            'assignment_id' => (int)$row['assignment_id'],
            'subject_id'    => $subId,
            'subject_code'  => $row['subject_code'],
            'subject_name'  => $row['subject_name'],
            'units'         => (float)$row['units'],
            'schedule'      => $row['schedule'] ?? '',
            'instructor'    => ($row['teacher_name'] ?? '') !== '' ? $row['teacher_name'] : ($row['instructor'] ?? ''),
            'teacher_id'    => $row['teacher_id'] !== null ? (int)$row['teacher_id'] : null,
            'can_edit'      => $viewerIsAdmin || ((int)($row['teacher_id'] ?? 0) === $viewerId && $viewerId > 0),
            'sort_order'    => (int)($row['sort_order'] ?? 0),
        ];

        $subjectSectionsMap[$subId][] = [
            'assignment_id' => (int)$row['assignment_id'],
            'section_id'    => $secId,
            'section_name'  => $row['section_name'],
            'year_level'    => $row['year_level'],
            'schedule'      => $row['schedule'] ?? '',
            'instructor'    => ($row['teacher_name'] ?? '') !== '' ? $row['teacher_name'] : ($row['instructor'] ?? ''),
            'teacher_id'    => $row['teacher_id'] !== null ? (int)$row['teacher_id'] : null,
            'can_edit'      => $viewerIsAdmin || ((int)($row['teacher_id'] ?? 0) === $viewerId && $viewerId > 0),
        ];
    }

    foreach ($sections as &$sec) {
        $sec['id'] = (int)$sec['id'];
        $sec['student_count'] = (int)$sec['student_count'];
        $sec['female_count'] = (int)($sec['female_count'] ?? 0);
        $sec['male_count'] = (int)($sec['male_count'] ?? 0);
        $sec['assigned_subjects'] = $sectionSubjectsMap[$sec['id']] ?? [];
        $sec['subject_count'] = count($sec['assigned_subjects']);
        $totalUnits = 0.0;
        foreach ($sec['assigned_subjects'] as $asub) {
            $totalUnits += (float)$asub['units'];
        }
        $sec['total_units'] = $totalUnits;
    }
    unset($sec);

    foreach ($subjects as &$sub) {
        $sub['id'] = (int)$sub['id'];
        $sub['units'] = (float)$sub['units'];
        $sub['section_count'] = (int)$sub['section_count'];
        $sub['assigned_sections'] = $subjectSectionsMap[$sub['id']] ?? [];
    }
    unset($sub);

    // 4. Fetch Students (Ordered by Female first, then Male, then alphabetically by last_name, first_name)
    $studentsStmt = $pdo->query("
        SELECT 
            st.id,
            st.student_no,
            st.first_name,
            st.middle_name,
            st.last_name,
            st.full_name,
            st.gender,
            st.year_level,
            st.section_id,
            st.status,
            st.created_at,
            sec.section_name
        FROM students st
        INNER JOIN sections sec ON sec.id = st.section_id
        ORDER BY FIELD(st.gender, 'Female', 'Male'), st.last_name ASC, st.first_name ASC
    ");
    $students = $studentsStmt->fetchAll();

    // 5. Fetch All Student Grades
    $gradesStmt = $pdo->query("
        SELECT 
            id,
            student_id,
            section_id,
            subject_id,
            quarter,
            grade,
            remarks,
            updated_at
        FROM student_grades
    ");
    $allGradesRows = $gradesStmt->fetchAll();

    $gradesByStudent = [];
    foreach ($allGradesRows as $grow) {
        $stId = (int)$grow['student_id'];
        $subId = (int)$grow['subject_id'];
        $qtr = $grow['quarter'];
        $gradesByStudent[$stId][$subId][$qtr] = (float)$grow['grade'];
    }

    // 6. Teacher scoping: keep only sections where this teacher handles at least one subject
    $teachers = [];
    if (!$viewerIsAdmin) {
        $handledSectionIds = [];
        $handledSubjectIds = [];
        foreach ($assignments as $arow) {
            if ((int)($arow['teacher_id'] ?? 0) === $viewerId) {
                $handledSectionIds[(int)$arow['section_id']] = true;
                $handledSubjectIds[(int)$arow['subject_id']] = true;
            }
        }
        $sections = array_values(array_filter($sections, fn($s) => isset($handledSectionIds[$s['id']])));
        $subjects = array_values(array_filter($subjects, fn($s) => isset($handledSubjectIds[$s['id']])));
        foreach ($subjects as &$tsub) {
            $tsub['assigned_sections'] = array_values(array_filter(
                $tsub['assigned_sections'],
                fn($as) => isset($handledSectionIds[$as['section_id']])
            ));
        }
        unset($tsub);
        $students = array_values(array_filter($students, fn($st) => isset($handledSectionIds[(int)$st['section_id']])));
        $assignments = array_values(array_filter($assignments, fn($a) => isset($handledSectionIds[(int)$a['section_id']])));
        $visibleStudentIds = [];
        foreach ($students as $vst) {
            $visibleStudentIds[(int)$vst['id']] = true;
        }
        $allGradesRows = array_values(array_filter($allGradesRows, fn($g) => isset($visibleStudentIds[(int)$g['student_id']])));
    } else {
        // Admin: list of teacher accounts with their subject loads
        $teacherRows = $pdo->query("
            SELECT u.id, u.username, u.full_name, u.role, u.can_add_student, u.is_active, u.last_login_at, u.created_at,
                   COUNT(ss.id) AS load_count,
                   COUNT(DISTINCT ss.section_id) AS section_count
            FROM users u
            LEFT JOIN section_subjects ss ON ss.teacher_id = u.id
            GROUP BY u.id
            ORDER BY FIELD(u.role, 'admin', 'teacher'), u.full_name ASC
        ")->fetchAll();
        $loadsByTeacher = [];
        foreach ($assignments as $arow) {
            if ($arow['teacher_id'] !== null) {
                $loadsByTeacher[(int)$arow['teacher_id']][] = [
                    'section_id'   => (int)$arow['section_id'],
                    'section_name' => $arow['section_name'],
                    'subject_id'   => (int)$arow['subject_id'],
                    'subject_code' => $arow['subject_code'],
                ];
            }
        }
        foreach ($teacherRows as $trow) {
            $teachers[] = [
                'id'            => (int)$trow['id'],
                'username'      => $trow['username'],
                'full_name'     => $trow['full_name'],
                'role'          => $trow['role'],
                'can_add_student' => (bool)$trow['can_add_student'],
                'is_active'     => (int)$trow['is_active'] === 1,
                'last_login_at' => $trow['last_login_at'],
                'load_count'    => (int)$trow['load_count'],
                'section_count' => (int)$trow['section_count'],
                'loads'         => $loadsByTeacher[(int)$trow['id']] ?? [],
            ];
        }
    }

    $totalFemale = 0;
    $totalMale = 0;
    foreach ($students as &$st) {
        $st['id'] = (int)$st['id'];
        $st['section_id'] = (int)$st['section_id'];
        $st['gender'] = normalizeGender($st['gender'] ?? 'Female');
        if ($st['gender'] === 'Male') {
            $totalMale++;
        } else {
            $totalFemale++;
        }
        $st['assigned_subjects'] = $sectionSubjectsMap[$st['section_id']] ?? [];
        $st['grades'] = $gradesByStudent[$st['id']] ?? new stdClass();
    }
    unset($st);

    // 5b. Fetch Grade Locks and Unlock Requests
    $locksStmt = $pdo->query("
        SELECT 
            gl.id,
            gl.section_id,
            gl.subject_id,
            gl.quarter,
            gl.is_locked,
            gl.locked_by_user_id,
            gl.locked_at,
            gl.unlock_requested,
            gl.unlock_reason,
            gl.unlock_requested_by,
            gl.unlock_requested_at,
            u_lock.full_name AS locked_by_name,
            u_req.full_name AS unlock_requested_by_name,
            sec.section_name,
            sub.subject_code,
            sub.subject_name
        FROM grade_locks gl
        INNER JOIN sections sec ON sec.id = gl.section_id
        INNER JOIN subjects sub ON sub.id = gl.subject_id
        LEFT JOIN users u_lock ON u_lock.id = gl.locked_by_user_id
        LEFT JOIN users u_req ON u_req.id = gl.unlock_requested_by
    ");
    $locksRows = $locksStmt ? $locksStmt->fetchAll() : [];
    $gradeLocks = [];
    $pendingUnlockRequests = [];
    foreach ($locksRows as $lrow) {
        $key = (int)$lrow['section_id'] . '_' . (int)$lrow['subject_id'] . '_' . $lrow['quarter'];
        $lockData = [
            'id'                       => (int)$lrow['id'],
            'section_id'               => (int)$lrow['section_id'],
            'subject_id'               => (int)$lrow['subject_id'],
            'quarter'                  => $lrow['quarter'],
            'is_locked'                => (int)$lrow['is_locked'] === 1,
            'locked_by_name'           => $lrow['locked_by_name'] ?? 'System',
            'locked_at'                => $lrow['locked_at'],
            'unlock_requested'         => (int)$lrow['unlock_requested'] === 1,
            'unlock_reason'            => $lrow['unlock_reason'] ?? '',
            'unlock_requested_by_name' => $lrow['unlock_requested_by_name'] ?? '',
            'unlock_requested_at'      => $lrow['unlock_requested_at'],
            'section_name'             => $lrow['section_name'],
            'subject_code'             => $lrow['subject_code'],
            'subject_name'             => $lrow['subject_name'],
        ];
        $gradeLocks[$key] = $lockData;
        if ((int)$lrow['unlock_requested'] === 1) {
            $pendingUnlockRequests[] = $lockData;
        }
    }

    return [
        'current_user' => $viewer ? [
            'id'              => $viewerId,
            'username'        => $viewer['username'],
            'full_name'       => $viewer['full_name'],
            'role'            => $viewer['role'],
            'can_add_student' => $viewerIsAdmin || !empty($viewer['can_add_student']),
        ] : null,
        'teachers'               => $teachers,
        'grade_locks'             => $gradeLocks,
        'pending_unlock_requests' => $pendingUnlockRequests,
        'sections'               => $sections,
        'subjects'               => $subjects,
        'students'               => $students,
        'stats'    => [
            'total_students'    => count($students),
            'total_female'      => $totalFemale,
            'total_male'        => $totalMale,
            'total_sections'    => count($sections),
            'total_subjects'    => count($subjects),
            'total_assignments' => count($assignments),
            'total_grades'      => count($allGradesRows),
        ],
    ];
}

function generateStudentNo(PDO $pdo): string
{
    $year = date('Y');
    $stmt = $pdo->prepare("SELECT student_no FROM students WHERE student_no LIKE ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$year . '-%']);
    $last = $stmt->fetchColumn();

    $nextNum = 1;
    if ($last && preg_match('/^' . $year . '-(\d+)$/', (string)$last, $matches)) {
        $nextNum = (int)$matches[1] + 1;
    } else {
        $countStmt = $pdo->query("SELECT COUNT(*) FROM students");
        $nextNum = ((int)$countStmt->fetchColumn()) + 1;
    }

    while (true) {
        $candidate = sprintf('%s-%04d', $year, $nextNum);
        $check = $pdo->prepare("SELECT COUNT(*) FROM students WHERE student_no = ?");
        $check->execute([$candidate]);
        if ((int)$check->fetchColumn() === 0) {
            return $candidate;
        }
        $nextNum++;
    }
}

/**
 * Checks if a line is a gender group header like "Female:", "FEMALE", "Male:", "Boys:", "Girls:"
 */
function detectBulkGenderHeader(string $rawLine): ?string
{
    $clean = trim($rawLine, " \t\n\r\0\x0B:-—•*#[]()");
    $lower = strtolower($clean);
    if (in_array($lower, ['female', 'females', 'girl', 'girls', 'female students'], true)) {
        return 'Female';
    }
    if (in_array($lower, ['male', 'males', 'boy', 'boys', 'male students'], true)) {
        return 'Male';
    }
    return null;
}

/**
 * Parses a single line from Bulk Student Add into:
 * ['student_no' => string, 'first_name' => string, 'middle_name' => string, 'last_name' => string, 'gender' => 'Female'|'Male']
 * Supports:
 * - "Last Name, First Name [Middle]" (e.g. "Dela Cruz, Juan M.")
 * - "First Name [Middle] Last Name" (e.g. "Juan M. Dela Cruz" or "Juan Dela Cruz")
 * - Optional leading Student ID separated by |, tab, ;, or comma (e.g. "2026-0010 | Dela Cruz, Juan M.")
 * - Optional trailing gender tag like "| Female", "| Male", "| F", "| M", "(Female)", "(Male)", "[F]", "[M]"
 */
function parseBulkStudentLine(string $rawLine, string $defaultGender = 'Female'): ?array
{
    $line = trim($rawLine);
    if ($line === '') {
        return null;
    }

    // Strip optional list numbering at the start like "1. " or "1) " or "- " (but keep IDs like "2026-0001")
    $line = (string)preg_replace('/^(?:\d{1,3}[\.\)]\s+|[-•*]\s+)/u', '', $line);
    $line = trim($line);
    if ($line === '') {
        return null;
    }

    $gender = normalizeGender($defaultGender);

    // Check for trailing gender marker such as "| Female", "| Male", "| F", "| M", "[Female]", "(M)", etc.
    if (preg_match('/^(.*?)(?:[\|\t;,-]+\s*|\s+[\(\[])(female|male|f|m|girl|boy)[\)\]]?\s*$/iu', $line, $gm)) {
        $candidateRest = trim($gm[1]);
        $genderToken = strtolower(trim($gm[2]));
        // Make sure we didn't accidentally strip a middle initial like "Dela Cruz, Juan M" where "M" is after a space without brackets/pipes
        $fullMatch = $gm[0];
        $hasExplicitDelimiter = (bool)preg_match('/(?:[\|\t;]\s*(?:female|male|f|m)|[\(\[](?:female|male|f|m)[\)\]]|(?:[\|\t;,-]+|\s+)(?:female|male))\s*$/iu', $fullMatch);
        if ($hasExplicitDelimiter && $candidateRest !== '') {
            $gender = normalizeGender($genderToken, $gender);
            $line = $candidateRest;
        }
    }

    $studentNo = '';
    $namePart = $line;

    // Check for pipe, tab, or semicolon separator first: "2026-0001 | Dela Cruz, Juan M."
    if (preg_match('/^([^\|\t;]+)[\|\t;]+(.+)$/u', $line, $m)) {
        $firstCol = trim($m[1]);
        $restCol = trim($m[2]);
        if (preg_match('/\d/', $firstCol) && strlen($firstCol) <= 30) {
            $studentNo = $firstCol;
            $namePart = $restCol;
        }
    } elseif (substr_count($line, ',') >= 2) {
        // Check if first comma-separated token is a Student ID: "2026-0001, Dela Cruz, Juan M."
        $parts = array_map('trim', explode(',', $line));
        if (preg_match('/\d/', $parts[0]) && strlen($parts[0]) <= 30) {
            $studentNo = array_shift($parts);
            $namePart = implode(', ', $parts);
        }
    }

    $firstName = '';
    $middleName = '';
    $lastName = '';

    if (strpos($namePart, ',') !== false) {
        // Format: "Last Name, First Name [Middle]" or "Last Name, First Name, Middle Name"
        $commaParts = array_map('trim', explode(',', $namePart));
        $lastName = $commaParts[0] ?? '';
        $givenPart = $commaParts[1] ?? '';
        $extraMiddle = $commaParts[2] ?? '';

        if ($extraMiddle !== '') {
            $firstName = $givenPart;
            $middleName = $extraMiddle;
        } else {
            $words = preg_split('/\s+/u', $givenPart, -1, PREG_SPLIT_NO_EMPTY);
            if (count($words) >= 2) {
                $lastToken = $words[count($words) - 1];
                // If last token is a middle initial like "M." or "M"
                if (preg_match('/^[A-Za-z]\.?$/u', $lastToken)) {
                    $middleName = rtrim($lastToken, '.') . '.';
                    array_pop($words);
                }
            }
            $firstName = implode(' ', $words);
        }
    } else {
        // Format: "First Name [Middle] Last Name" (e.g. "Juan M. Dela Cruz" or "Juan Dela Cruz")
        $words = preg_split('/\s+/u', $namePart, -1, PREG_SPLIT_NO_EMPTY);
        $count = count($words);
        if ($count === 1) {
            $firstName = $words[0];
            $lastName = $words[0];
        } elseif ($count === 2) {
            $firstName = $words[0];
            $lastName = $words[1];
        } else {
            // Check for compound last names (e.g., Dela Cruz, De Guzman, Del Rosario, San Juan, Sta. Maria, Sto. Tomas)
            $compoundPrefixes = ['dela', 'de', 'del', 'delos', 'san', 'sta', 'sta.', 'sto', 'sto.', 'da', 'van', 'von'];
            $secondLast = strtolower($words[$count - 2]);
            $thirdLast = $count >= 4 ? strtolower($words[$count - 3]) : '';

            if ($count >= 4 && $thirdLast === 'de' && $secondLast === 'la') {
                $lastName = $words[$count - 3] . ' ' . $words[$count - 2] . ' ' . $words[$count - 1];
                $remaining = array_slice($words, 0, $count - 3);
            } elseif (in_array($secondLast, $compoundPrefixes, true) && !preg_match('/^[A-Za-z]\.$/u', $words[$count - 2])) {
                $lastName = $words[$count - 2] . ' ' . $words[$count - 1];
                $remaining = array_slice($words, 0, $count - 2);
            } else {
                $lastName = $words[$count - 1];
                $remaining = array_slice($words, 0, $count - 1);
            }

            if (count($remaining) >= 2) {
                $remLast = $remaining[count($remaining) - 1];
                if (preg_match('/^[A-Za-z]\.?$/u', $remLast)) {
                    $middleName = rtrim($remLast, '.') . '.';
                    array_pop($remaining);
                }
            }
            $firstName = implode(' ', $remaining);
        }
    }

    if ($firstName === '' || $lastName === '') {
        return null;
    }

    return [
        'student_no'  => $studentNo,
        'first_name'  => $firstName,
        'middle_name' => $middleName,
        'last_name'   => $lastName,
        'gender'      => $gender,
    ];
}

try {
    // ==================== AUTHENTICATION & ROLE-BASED ACCESS ====================
    $authUser = refreshSessionUser($pdo);
    if (!$authUser) {
        respond(false, 'Your session has expired. Please sign in again.', ['auth_required' => true], 401);
    }

    // Actions a teacher account is allowed to perform. Everything else is admin-only.
    $teacherAllowedActions = ['get_all', 'save_grades', 'change_password', 'save_student', 'bulk_save_students', 'lock_grades', 'request_unlock_grades'];
    if ($authUser['role'] !== 'admin' && !in_array($action, $teacherAllowedActions, true)) {
        respond(false, 'You do not have permission to perform this action.', [], 403);
    }

    switch ($action) {
        case 'get_all':
            respond(true, 'Data loaded successfully.', fetchSystemState($pdo));
            break;

        case 'save_section':
            $id = isset($input['id']) && $input['id'] !== '' ? (int)$input['id'] : null;
            $sectionName = trim((string)($input['section_name'] ?? ''));
            $yearLevel = trim((string)($input['year_level'] ?? ''));
            $adviser = trim((string)($input['adviser'] ?? ''));
            $subjectIds = isset($input['subject_ids']) && is_array($input['subject_ids']) ? array_map('intval', $input['subject_ids']) : null;

            if ($sectionName === '' || $yearLevel === '') {
                respond(false, 'Section Name and Year Level are required.', [], 422);
            }

            if ($id) {
                $dupStmt = $pdo->prepare("SELECT id FROM sections WHERE section_name = ? AND year_level = ? AND id != ?");
                $dupStmt->execute([$sectionName, $yearLevel, $id]);
            } else {
                $dupStmt = $pdo->prepare("SELECT id FROM sections WHERE section_name = ? AND year_level = ?");
                $dupStmt->execute([$sectionName, $yearLevel]);
            }
            if ($dupStmt->fetch()) {
                respond(false, "Section '{$sectionName}' already exists under {$yearLevel}.", [], 409);
            }

            $pdo->beginTransaction();
            if ($id) {
                $stmt = $pdo->prepare("UPDATE sections SET section_name = ?, year_level = ?, adviser = ? WHERE id = ?");
                $stmt->execute([$sectionName, $yearLevel, $adviser !== '' ? $adviser : null, $id]);

                $syncStudents = $pdo->prepare("UPDATE students SET year_level = ? WHERE section_id = ?");
                $syncStudents->execute([$yearLevel, $id]);
                $sectionId = $id;
                $msg = "Section '{$sectionName}' updated successfully.";
            } else {
                $stmt = $pdo->prepare("INSERT INTO sections (section_name, year_level, adviser) VALUES (?, ?, ?)");
                $stmt->execute([$sectionName, $yearLevel, $adviser !== '' ? $adviser : null]);
                $sectionId = (int)$pdo->lastInsertId();
                $msg = "Section '{$sectionName}' ({$yearLevel}) created successfully.";
            }

            if ($subjectIds !== null) {
                $existingStmt = $pdo->prepare("SELECT subject_id, schedule, instructor, teacher_id FROM section_subjects WHERE section_id = ?");
                $existingStmt->execute([$sectionId]);
                $existingMap = [];
                foreach ($existingStmt->fetchAll() as $erow) {
                    $existingMap[(int)$erow['subject_id']] = $erow;
                }

                $delStmt = $pdo->prepare("DELETE FROM section_subjects WHERE section_id = ?");
                $delStmt->execute([$sectionId]);

                $insStmt = $pdo->prepare("INSERT INTO section_subjects (section_id, subject_id, schedule, instructor, teacher_id) VALUES (?, ?, ?, ?, ?)");
                foreach (array_unique($subjectIds) as $subId) {
                    if ($subId > 0) {
                        $sched = $existingMap[$subId]['schedule'] ?? null;
                        $inst = $existingMap[$subId]['instructor'] ?? null;
                        $teacherKeep = $existingMap[$subId]['teacher_id'] ?? null;
                        $insStmt->execute([$sectionId, $subId, $sched, $inst, $teacherKeep]);
                    }
                }
            }

            $pdo->commit();
            respond(true, $msg, array_merge(['saved_section_id' => $sectionId], fetchSystemState($pdo)));
            break;

        case 'delete_section':
            $id = (int)($input['id'] ?? 0);
            if ($id <= 0) {
                respond(false, 'Invalid section ID.', [], 422);
            }
            $stmt = $pdo->prepare("SELECT section_name, year_level FROM sections WHERE id = ?");
            $stmt->execute([$id]);
            $sec = $stmt->fetch();
            if (!$sec) {
                respond(false, 'Section not found.', [], 404);
            }

            $del = $pdo->prepare("DELETE FROM sections WHERE id = ?");
            $del->execute([$id]);
            respond(true, "Section '{$sec['section_name']}' ({$sec['year_level']}) removed.", fetchSystemState($pdo));
            break;

        case 'save_subject':
            $id = isset($input['id']) && $input['id'] !== '' ? (int)$input['id'] : null;
            $subjectCode = strtoupper(trim((string)($input['subject_code'] ?? '')));
            $subjectName = trim((string)($input['subject_name'] ?? ''));
            $units = isset($input['units']) && $input['units'] !== '' ? (float)$input['units'] : 3.0;
            $description = trim((string)($input['description'] ?? ''));

            if ($subjectCode === '' || $subjectName === '') {
                respond(false, 'Subject Code and Descriptive Title are required.', [], 422);
            }
            if ($units < 0 || $units > 15) {
                respond(false, 'Units must be between 0 and 15.', [], 422);
            }

            if ($id) {
                $dupStmt = $pdo->prepare("SELECT id FROM subjects WHERE subject_code = ? AND id != ?");
                $dupStmt->execute([$subjectCode, $id]);
            } else {
                $dupStmt = $pdo->prepare("SELECT id FROM subjects WHERE subject_code = ?");
                $dupStmt->execute([$subjectCode]);
            }
            if ($dupStmt->fetch()) {
                respond(false, "Subject Code '{$subjectCode}' already exists.", [], 409);
            }

            if ($id) {
                $stmt = $pdo->prepare("UPDATE subjects SET subject_code = ?, subject_name = ?, units = ?, description = ? WHERE id = ?");
                $stmt->execute([$subjectCode, $subjectName, $units, $description !== '' ? $description : null, $id]);
                $subjectId = $id;
                $msg = "Subject '{$subjectCode} - {$subjectName}' updated.";
            } else {
                $stmt = $pdo->prepare("INSERT INTO subjects (subject_code, subject_name, units, description) VALUES (?, ?, ?, ?)");
                $stmt->execute([$subjectCode, $subjectName, $units, $description !== '' ? $description : null]);
                $subjectId = (int)$pdo->lastInsertId();
                $msg = "Subject '{$subjectCode} - {$subjectName}' created.";
            }

            if (isset($input['section_ids']) && is_array($input['section_ids'])) {
                $sectionIds = array_map('intval', $input['section_ids']);
                $insAssign = $pdo->prepare("INSERT IGNORE INTO section_subjects (section_id, subject_id) VALUES (?, ?)");
                foreach (array_unique($sectionIds) as $secId) {
                    if ($secId > 0) {
                        $insAssign->execute([$secId, $subjectId]);
                    }
                }
            }

            respond(true, $msg, array_merge(['saved_subject_id' => $subjectId], fetchSystemState($pdo)));
            break;

        case 'delete_subject':
            $id = (int)($input['id'] ?? 0);
            if ($id <= 0) {
                respond(false, 'Invalid subject ID.', [], 422);
            }
            $stmt = $pdo->prepare("SELECT subject_code, subject_name FROM subjects WHERE id = ?");
            $stmt->execute([$id]);
            $sub = $stmt->fetch();
            if (!$sub) {
                respond(false, 'Subject not found.', [], 404);
            }

            $del = $pdo->prepare("DELETE FROM subjects WHERE id = ?");
            $del->execute([$id]);
            respond(true, "Subject '{$sub['subject_code']}' removed.", fetchSystemState($pdo));
            break;

        case 'sync_section_subjects':
            $sectionId = (int)($input['section_id'] ?? 0);
            $assignments = $input['assignments'] ?? [];
            if ($sectionId <= 0) {
                respond(false, 'Please select a valid section.', [], 422);
            }

            $secStmt = $pdo->prepare("SELECT section_name, year_level FROM sections WHERE id = ?");
            $secStmt->execute([$sectionId]);
            $sec = $secStmt->fetch();
            if (!$sec) {
                respond(false, 'Section not found.', [], 404);
            }

            $pdo->beginTransaction();
            $del = $pdo->prepare("DELETE FROM section_subjects WHERE section_id = ?");
            $del->execute([$sectionId]);

            $ins = $pdo->prepare("INSERT INTO section_subjects (section_id, subject_id, schedule, instructor, teacher_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
            $validTeacherIds = [];
            foreach ($pdo->query("SELECT id, full_name FROM users WHERE role = 'teacher'")->fetchAll() as $vt) {
                $validTeacherIds[(int)$vt['id']] = $vt['full_name'];
            }
            $count = 0;
            if (is_array($assignments)) {
                $seen = [];
                $orderIndex = 1;
                foreach ($assignments as $item) {
                    $subId = is_array($item) ? (int)($item['subject_id'] ?? 0) : (int)$item;
                    if ($subId > 0 && !isset($seen[$subId])) {
                        $seen[$subId] = true;
                        $schedule = is_array($item) && !empty($item['schedule']) ? trim((string)$item['schedule']) : null;
                        $instructor = is_array($item) && !empty($item['instructor']) ? trim((string)$item['instructor']) : null;
                        $customOrder = is_array($item) && isset($item['sort_order']) && (int)$item['sort_order'] > 0
                            ? (int)$item['sort_order']
                            : $orderIndex;
                        $teacherId = is_array($item) && !empty($item['teacher_id']) ? (int)$item['teacher_id'] : null;
                        if ($teacherId !== null && !isset($validTeacherIds[$teacherId])) {
                            $teacherId = null;
                        }
                        if ($teacherId !== null) {
                            $instructor = $validTeacherIds[$teacherId];
                        }
                        $ins->execute([$sectionId, $subId, $schedule, $instructor, $teacherId, $customOrder]);
                        $orderIndex++;
                        $count++;
                    }
                }
            }
            $pdo->commit();

            respond(
                true,
                "Updated subject assignments for {$sec['section_name']} ({$count} subject" . ($count === 1 ? '' : 's') . " assigned).",
                fetchSystemState($pdo)
            );
            break;

        case 'reorder_section_subjects':
            $sectionId = (int)($input['section_id'] ?? 0);
            $subjectIds = $input['subject_ids'] ?? [];
            if ($sectionId <= 0 || !is_array($subjectIds) || empty($subjectIds)) {
                respond(false, 'Please provide a valid section and subject order list.', [], 422);
            }

            $secCheck = $pdo->prepare("SELECT section_name FROM sections WHERE id = ?");
            $secCheck->execute([$sectionId]);
            $secRow = $secCheck->fetch();
            if (!$secRow) {
                respond(false, 'Section not found.', [], 404);
            }

            $upd = $pdo->prepare("UPDATE section_subjects SET sort_order = ? WHERE section_id = ? AND subject_id = ?");
            $pdo->beginTransaction();
            $pos = 1;
            foreach ($subjectIds as $sId) {
                $sId = (int)$sId;
                if ($sId > 0) {
                    $upd->execute([$pos, $sectionId, $sId]);
                    $pos++;
                }
            }
            $pdo->commit();

            respond(true, "Subject input order updated for {$secRow['section_name']}.", fetchSystemState($pdo));
            break;

        case 'unassign_single_subject':
            $sectionId = (int)($input['section_id'] ?? 0);
            $subjectId = (int)($input['subject_id'] ?? 0);
            if ($sectionId <= 0 || $subjectId <= 0) {
                respond(false, 'Invalid section or subject.', [], 422);
            }

            $stmt = $pdo->prepare("DELETE FROM section_subjects WHERE section_id = ? AND subject_id = ?");
            $stmt->execute([$sectionId, $subjectId]);
            respond(true, 'Subject unassigned from section.', fetchSystemState($pdo));
            break;

        case 'save_student':
            if ($authUser['role'] !== 'admin' && empty($authUser['can_add_student'])) {
                respond(false, 'You do not have permission to enroll or add students. Please contact your administrator.', [], 403);
            }
            $id = isset($input['id']) && $input['id'] !== '' ? (int)$input['id'] : null;
            $studentNo = trim((string)($input['student_no'] ?? ''));
            $firstName = trim((string)($input['first_name'] ?? ''));
            $middleName = trim((string)($input['middle_name'] ?? ''));
            $lastName = trim((string)($input['last_name'] ?? ''));
            $gender = normalizeGender((string)($input['gender'] ?? 'Female'));
            $sectionId = (int)($input['section_id'] ?? 0);
            $status = trim((string)($input['status'] ?? 'Active'));
            if (!in_array($status, ['Active', 'Irregular', 'Inactive'], true)) {
                $status = 'Active';
            }

            if ($firstName === '' || $lastName === '') {
                respond(false, 'First Name and Last Name are required.', [], 422);
            }
            if ($sectionId <= 0) {
                respond(false, 'Please select a Section for the student.', [], 422);
            }

            $secStmt = $pdo->prepare("SELECT id, section_name, year_level FROM sections WHERE id = ?");
            $secStmt->execute([$sectionId]);
            $sectionRow = $secStmt->fetch();
            if (!$sectionRow) {
                respond(false, 'Selected section does not exist.', [], 404);
            }

            $yearLevel = $sectionRow['year_level'];

            if ($studentNo === '') {
                $studentNo = generateStudentNo($pdo);
            } else {
                if ($id) {
                    $dupStmt = $pdo->prepare("SELECT id FROM students WHERE student_no = ? AND id != ?");
                    $dupStmt->execute([$studentNo, $id]);
                } else {
                    $dupStmt = $pdo->prepare("SELECT id FROM students WHERE student_no = ?");
                    $dupStmt->execute([$studentNo]);
                }
                if ($dupStmt->fetch()) {
                    respond(false, "Student ID '{$studentNo}' is already assigned to another student.", [], 409);
                }
            }

            $middleInitial = $middleName !== '' ? ' ' . $middleName : '';
            $fullName = "{$lastName}, {$firstName}{$middleInitial}";

            if ($id) {
                $stmt = $pdo->prepare("
                    UPDATE students 
                    SET student_no = ?, first_name = ?, middle_name = ?, last_name = ?, full_name = ?, gender = ?, year_level = ?, section_id = ?, status = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $studentNo,
                    $firstName,
                    $middleName !== '' ? $middleName : null,
                    $lastName,
                    $fullName,
                    $gender,
                    $yearLevel,
                    $sectionId,
                    $status,
                    $id,
                ]);
                // Also keep student_grades section_id synced if student moved sections
                $syncGradesSec = $pdo->prepare("UPDATE student_grades SET section_id = ? WHERE student_id = ?");
                $syncGradesSec->execute([$sectionId, $id]);
                $msg = "Student '{$fullName}' ({$gender}) updated successfully.";
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO students (student_no, first_name, middle_name, last_name, full_name, gender, year_level, section_id, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $studentNo,
                    $firstName,
                    $middleName !== '' ? $middleName : null,
                    $lastName,
                    $fullName,
                    $gender,
                    $yearLevel,
                    $sectionId,
                    $status,
                ]);
                $msg = "Student '{$fullName}' ({$gender}) added to {$sectionRow['section_name']} ({$yearLevel}).";
            }

            respond(true, $msg, fetchSystemState($pdo));
            break;

        case 'bulk_save_students':
            if ($authUser['role'] !== 'admin' && empty($authUser['can_add_student'])) {
                respond(false, 'You do not have permission to enroll or bulk-add students. Please contact your administrator.', [], 403);
            }
            $rawLines = (string)($input['students_text'] ?? '');
            $sectionId = (int)($input['section_id'] ?? 0);
            $defaultGender = normalizeGender((string)($input['gender'] ?? 'Female'));
            $status = trim((string)($input['status'] ?? 'Active'));
            if (!in_array($status, ['Active', 'Irregular', 'Inactive'], true)) {
                $status = 'Active';
            }

            if ($sectionId <= 0) {
                respond(false, 'Please select a Section for the students.', [], 422);
            }

            $secStmt = $pdo->prepare("SELECT id, section_name, year_level FROM sections WHERE id = ?");
            $secStmt->execute([$sectionId]);
            $sectionRow = $secStmt->fetch();
            if (!$sectionRow) {
                respond(false, 'Selected section does not exist.', [], 404);
            }
            $yearLevel = $sectionRow['year_level'];

            $lines = preg_split('/\r\n|\r|\n/', $rawLines);
            $parsedStudents = [];
            $currentGenderContext = $defaultGender;
            foreach ($lines as $idx => $line) {
                if (trim($line) === '') {
                    continue;
                }
                $headerGender = detectBulkGenderHeader($line);
                if ($headerGender !== null) {
                    $currentGenderContext = $headerGender;
                    continue;
                }
                $parsed = parseBulkStudentLine($line, $currentGenderContext);
                if ($parsed === null) {
                    respond(false, 'Could not parse student name on line ' . ($idx + 1) . ': "' . trim($line) . '". Please enter a valid name.', [], 422);
                }
                $parsedStudents[] = $parsed;
            }

            if (empty($parsedStudents)) {
                respond(false, 'Please enter at least one student name (one student per line).', [], 422);
            }

            $pdo->beginTransaction();
            $insertStmt = $pdo->prepare("
                INSERT INTO students (student_no, first_name, middle_name, last_name, full_name, gender, year_level, section_id, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $checkDupNo = $pdo->prepare("SELECT id FROM students WHERE student_no = ?");

            $addedCount = 0;
            $addedFemale = 0;
            $addedMale = 0;
            foreach ($parsedStudents as $st) {
                $studentNo = trim($st['student_no']);
                if ($studentNo === '') {
                    $studentNo = generateStudentNo($pdo);
                } else {
                    $checkDupNo->execute([$studentNo]);
                    if ($checkDupNo->fetch()) {
                        $pdo->rollBack();
                        respond(false, "Student ID '{$studentNo}' already exists. Leave Student ID blank to auto-generate.", [], 409);
                    }
                }

                $firstName = $st['first_name'];
                $middleName = $st['middle_name'];
                $lastName = $st['last_name'];
                $stGender = normalizeGender($st['gender'] ?? $defaultGender);
                $middleInitial = $middleName !== '' ? ' ' . $middleName : '';
                $fullName = "{$lastName}, {$firstName}{$middleInitial}";

                $insertStmt->execute([
                    $studentNo,
                    $firstName,
                    $middleName !== '' ? $middleName : null,
                    $lastName,
                    $fullName,
                    $stGender,
                    $yearLevel,
                    $sectionId,
                    $status,
                ]);
                $addedCount++;
                if ($stGender === 'Male') {
                    $addedMale++;
                } else {
                    $addedFemale++;
                }
            }

            $pdo->commit();
            $plural = $addedCount === 1 ? '' : 's';
            respond(
                true,
                "Successfully enrolled {$addedCount} student{$plural} ({$addedFemale} Female, {$addedMale} Male) into {$sectionRow['section_name']} ({$yearLevel}).",
                fetchSystemState($pdo)
            );
            break;

        case 'delete_student':
            $id = (int)($input['id'] ?? 0);
            if ($id <= 0) {
                respond(false, 'Invalid student ID.', [], 422);
            }
            $stmt = $pdo->prepare("SELECT full_name FROM students WHERE id = ?");
            $stmt->execute([$id]);
            $st = $stmt->fetch();
            if (!$st) {
                respond(false, 'Student not found.', [], 404);
            }

            $del = $pdo->prepare("DELETE FROM students WHERE id = ?");
            $del->execute([$id]);
            respond(true, "Student '{$st['full_name']}' removed.", fetchSystemState($pdo));
            break;

        case 'save_grades':
            $entries = $input['entries'] ?? [];
            if (!is_array($entries) || empty($entries)) {
                respond(false, 'No grade entries provided.', [], 422);
            }

            $validQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
            $upsertStmt = $pdo->prepare("
                INSERT INTO student_grades (student_id, section_id, subject_id, quarter, grade, remarks)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    section_id = VALUES(section_id),
                    grade = VALUES(grade),
                    remarks = VALUES(remarks)
            ");
            $deleteStmt = $pdo->prepare("
                DELETE FROM student_grades
                WHERE student_id = ? AND subject_id = ? AND quarter = ?
            ");

            $pdo->beginTransaction();
            $savedCount = 0;
            // Teachers may only encode grades for subject loads assigned to them
            $ownedLoads = null;
            if ($authUser['role'] !== 'admin') {
                $ownStmt = $pdo->prepare("SELECT section_id, subject_id FROM section_subjects WHERE teacher_id = ?");
                $ownStmt->execute([$authUser['id']]);
                $ownedLoads = [];
                foreach ($ownStmt->fetchAll() as $own) {
                    $ownedLoads[(int)$own['section_id'] . ':' . (int)$own['subject_id']] = true;
                }
            }
            $studentSectionStmt = $pdo->prepare("SELECT section_id FROM students WHERE id = ?");
            foreach ($entries as $entry) {
                $studentId = (int)($entry['student_id'] ?? 0);
                $sectionId = (int)($entry['section_id'] ?? 0);
                $subjectId = (int)($entry['subject_id'] ?? 0);
                $quarter = strtoupper(trim((string)($entry['quarter'] ?? 'Q1')));
                $rawGrade = $entry['grade'] ?? '';

                if ($studentId <= 0 || $sectionId <= 0 || $subjectId <= 0 || !in_array($quarter, $validQuarters, true)) {
                    continue;
                }

                // Server-side integrity: the student must belong to the section being graded
                $studentSectionStmt->execute([$studentId]);
                if ((int)$studentSectionStmt->fetchColumn() !== $sectionId) {
                    $pdo->rollBack();
                    respond(false, 'A grade entry does not match the student\'s section.', [], 422);
                }
                if ($ownedLoads !== null && !isset($ownedLoads[$sectionId . ':' . $subjectId])) {
                    $pdo->rollBack();
                    respond(false, 'You can only encode grades for subjects assigned to you.', [], 403);
                }

                if ($authUser['role'] !== 'admin') {
                    $lockCheck = $pdo->prepare("SELECT is_locked FROM grade_locks WHERE section_id = ? AND subject_id = ? AND quarter = ?");
                    $lockCheck->execute([$sectionId, $subjectId, $quarter]);
                    if ((int)$lockCheck->fetchColumn() === 1) {
                        $pdo->rollBack();
                        respond(false, "Grades for this subject in {} are locked and finalized. Please submit an unlock request to make corrections.", [], 403);
                    }
                }

                if ($rawGrade === '' || $rawGrade === null) {
                    $deleteStmt->execute([$studentId, $subjectId, $quarter]);
                    continue;
                }

                if (!is_numeric($rawGrade)) {
                    $pdo->rollBack();
                    respond(false, 'Grades must be valid numeric values.', [], 422);
                }

                $gradeVal = round((float)$rawGrade, 2);
                if ($gradeVal < 50 || $gradeVal > 100) {
                    $pdo->rollBack();
                    respond(false, "Grade {$gradeVal} is out of valid range (50.00 to 100.00).", [], 422);
                }

                $remarks = $gradeVal >= 75 ? 'Passed' : 'Failed';
                $upsertStmt->execute([$studentId, $sectionId, $subjectId, $quarter, $gradeVal, $remarks]);
                $savedCount++;
            }
            $pdo->commit();

            respond(true, "Saved {$savedCount} grade record" . ($savedCount === 1 ? '' : 's') . " successfully.", fetchSystemState($pdo));
            break;

        // ==================== USER ACCOUNTS (Admin manages teachers) ====================
        case 'save_teacher':
            $id = isset($input['id']) && $input['id'] !== '' ? (int)$input['id'] : null;
            $username = strtolower(trim((string)($input['username'] ?? '')));
            $fullName = trim((string)($input['full_name'] ?? ''));
            $password = (string)($input['password'] ?? '');
            $role = ($input['role'] ?? 'teacher') === 'admin' ? 'admin' : 'teacher';
            $canAddStudent = ($role === 'admin') ? 1 : (!empty($input['can_add_student']) ? 1 : 0);
            $isActive = !isset($input['is_active']) || (bool)$input['is_active'];

            if ($fullName === '' || $username === '') {
                respond(false, 'Full name and username are required.', [], 422);
            }
            if (!preg_match('/^[a-z0-9._-]{3,60}$/', $username)) {
                respond(false, 'Username must be 3–60 characters using letters, numbers, dot, dash, or underscore.', [], 422);
            }
            if (!$id && strlen($password) < 6) {
                respond(false, 'Password must be at least 6 characters.', [], 422);
            }
            if ($id && $password !== '' && strlen($password) < 6) {
                respond(false, 'New password must be at least 6 characters.', [], 422);
            }
            if ($id === (int)$authUser['id'] && ($role !== 'admin' || !$isActive)) {
                respond(false, 'You cannot remove your own administrator access or deactivate your own account.', [], 422);
            }

            $dup = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
            $dup->execute([$username, $id ?? 0]);
            if ($dup->fetch()) {
                respond(false, "Username '{$username}' is already taken.", [], 409);
            }

            if ($id) {
                $upd = $pdo->prepare("UPDATE users SET username = ?, full_name = ?, role = ?, can_add_student = ?, is_active = ? WHERE id = ?");
                $upd->execute([$username, $fullName, $role, $canAddStudent, $isActive ? 1 : 0, $id]);
                if ($password !== '') {
                    $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
                }
                if ($role !== 'teacher') {
                    // Admin accounts do not hold teaching loads
                    $pdo->prepare("UPDATE section_subjects SET teacher_id = NULL WHERE teacher_id = ?")->execute([$id]);
                } else {
                    $pdo->prepare("UPDATE section_subjects SET instructor = ? WHERE teacher_id = ?")->execute([$fullName, $id]);
                }
                $msg = "Account for {$fullName} updated.";
            } else {
                $ins = $pdo->prepare("INSERT INTO users (username, password_hash, full_name, role, can_add_student, is_active) VALUES (?, ?, ?, ?, ?, ?)");
                $ins->execute([$username, password_hash($password, PASSWORD_DEFAULT), $fullName, $role, $canAddStudent, $isActive ? 1 : 0]);
                $msg = ($role === 'admin' ? 'Administrator' : 'Teacher') . " account for {$fullName} created.";
            }
            respond(true, $msg, fetchSystemState($pdo));
            break;

        case 'delete_teacher':
            $id = (int)($input['id'] ?? 0);
            if ($id <= 0) {
                respond(false, 'Invalid account.', [], 422);
            }
            if ($id === (int)$authUser['id']) {
                respond(false, 'You cannot delete your own account.', [], 422);
            }
            $u = $pdo->prepare("SELECT full_name FROM users WHERE id = ?");
            $u->execute([$id]);
            $uRow = $u->fetch();
            if (!$uRow) {
                respond(false, 'Account not found.', [], 404);
            }
            // Subject loads keep their instructor name but become unassigned (FK ON DELETE SET NULL)
            $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
            respond(true, "Account for {$uRow['full_name']} deleted. Their subject loads are now unassigned.", fetchSystemState($pdo));
            break;

        case 'change_password':
            $current = (string)($input['current_password'] ?? '');
            $new = (string)($input['new_password'] ?? '');
            if (strlen($new) < 6) {
                respond(false, 'New password must be at least 6 characters.', [], 422);
            }
            $p = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
            $p->execute([$authUser['id']]);
            if (!password_verify($current, (string)$p->fetchColumn())) {
                respond(false, 'Your current password is incorrect.', [], 422);
            }
            $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([password_hash($new, PASSWORD_DEFAULT), $authUser['id']]);
            respond(true, 'Password updated successfully.');
            break;

                case 'toggle_teacher_permission':
            $id = (int)($input['id'] ?? 0);
            $canAdd = !empty($input['can_add_student']) ? 1 : 0;
            if ($id <= 0) {
                respond(false, 'Invalid teacher ID.', [], 422);
            }
            $pdo->prepare("UPDATE users SET can_add_student = ? WHERE id = ? AND role = 'teacher'")->execute([$canAdd, $id]);
            respond(true, "Student enrollment permission updated successfully.", fetchSystemState($pdo));
            break;

        case 'lock_grades':
            $sectionId = (int)($input['section_id'] ?? 0);
            $subjectId = isset($input['subject_id']) && $input['subject_id'] !== 'ALL' ? (int)$input['subject_id'] : 0;
            $quarter = strtoupper(trim((string)($input['quarter'] ?? 'Q1')));

            if ($sectionId <= 0 || !in_array($quarter, ['Q1', 'Q2', 'Q3', 'Q4'], true)) {
                respond(false, 'Invalid section or grading quarter.', [], 422);
            }

            $subjectsToLock = [];
            if ($subjectId > 0) {
                $subjectsToLock[] = $subjectId;
            } else {
                if ($authUser['role'] === 'admin') {
                    $subStmt = $pdo->prepare("SELECT subject_id FROM section_subjects WHERE section_id = ?");
                    $subStmt->execute([$sectionId]);
                    $subjectsToLock = $subStmt->fetchAll(PDO::FETCH_COLUMN);
                } else {
                    $subStmt = $pdo->prepare("SELECT subject_id FROM section_subjects WHERE section_id = ? AND teacher_id = ?");
                    $subStmt->execute([$sectionId, $authUser['id']]);
                    $subjectsToLock = $subStmt->fetchAll(PDO::FETCH_COLUMN);
                }
            }

            if (empty($subjectsToLock)) {
                respond(false, 'No assigned subjects found to lock.', [], 422);
            }

            $upsertLock = $pdo->prepare("
                INSERT INTO grade_locks (section_id, subject_id, quarter, is_locked, locked_by_user_id, locked_at, unlock_requested, unlock_reason)
                VALUES (?, ?, ?, 1, ?, NOW(), 0, NULL)
                ON DUPLICATE KEY UPDATE
                    is_locked = 1,
                    locked_by_user_id = VALUES(locked_by_user_id),
                    locked_at = NOW(),
                    unlock_requested = 0,
                    unlock_reason = NULL
            ");
            foreach ($subjectsToLock as $sId) {
                $upsertLock->execute([$sectionId, (int)$sId, $quarter, $authUser['id']]);
            }
            respond(true, "Grades finalized and locked for {$quarter}.", fetchSystemState($pdo));
            break;

        case 'request_unlock_grades':
            $sectionId = (int)($input['section_id'] ?? 0);
            $subjectId = (int)($input['subject_id'] ?? 0);
            $quarter = strtoupper(trim((string)($input['quarter'] ?? 'Q1')));
            $reason = trim((string)($input['reason'] ?? ''));

            if ($sectionId <= 0 || $subjectId <= 0 || !in_array($quarter, ['Q1', 'Q2', 'Q3', 'Q4'], true)) {
                respond(false, 'Invalid request parameters.', [], 422);
            }
            if ($reason === '') {
                respond(false, 'Please provide an explanation or reason for requesting to unlock grades.', [], 422);
            }

            $check = $pdo->prepare("SELECT id FROM grade_locks WHERE section_id = ? AND subject_id = ? AND quarter = ?");
            $check->execute([$sectionId, $subjectId, $quarter]);
            if (!$check->fetch()) {
                $pdo->prepare("
                    INSERT INTO grade_locks (section_id, subject_id, quarter, is_locked, locked_by_user_id, locked_at, unlock_requested, unlock_reason, unlock_requested_by, unlock_requested_at)
                    VALUES (?, ?, ?, 1, ?, NOW(), 1, ?, ?, NOW())
                ")->execute([$sectionId, $subjectId, $quarter, $authUser['id'], $reason, $authUser['id']]);
            } else {
                $pdo->prepare("
                    UPDATE grade_locks
                    SET unlock_requested = 1,
                        unlock_reason = ?,
                        unlock_requested_by = ?,
                        unlock_requested_at = NOW()
                    WHERE section_id = ? AND subject_id = ? AND quarter = ?
                ")->execute([$reason, $authUser['id'], $sectionId, $subjectId, $quarter]);
            }
            respond(true, "Unlock request submitted to the administrator.", fetchSystemState($pdo));
            break;

        case 'approve_unlock_grades':
            $sectionId = (int)($input['section_id'] ?? 0);
            $subjectId = (int)($input['subject_id'] ?? 0);
            $quarter = strtoupper(trim((string)($input['quarter'] ?? 'Q1')));
            $decision = trim((string)($input['decision'] ?? 'approve'));

            if ($sectionId <= 0 || $subjectId <= 0) {
                respond(false, 'Invalid unlock request parameters.', [], 422);
            }

            if ($decision === 'approve') {
                $pdo->prepare("
                    UPDATE grade_locks
                    SET is_locked = 0,
                        unlock_requested = 0,
                        unlock_reason = NULL
                    WHERE section_id = ? AND subject_id = ? AND quarter = ?
                ")->execute([$sectionId, $subjectId, $quarter]);
                $msg = "Grades unlocked. The teacher can now edit and rewrite grades.";
            } else {
                $pdo->prepare("
                    UPDATE grade_locks
                    SET unlock_requested = 0
                    WHERE section_id = ? AND subject_id = ? AND quarter = ?
                ")->execute([$sectionId, $subjectId, $quarter]);
                $msg = "Unlock request rejected. Grades remain locked.";
            }
            respond(true, $msg, fetchSystemState($pdo));
            break;

        case 'toggle_grade_lock':
            $sectionId = (int)($input['section_id'] ?? 0);
            $subjectId = (int)($input['subject_id'] ?? 0);
            $quarter = strtoupper(trim((string)($input['quarter'] ?? 'Q1')));
            $lock = !empty($input['is_locked']) ? 1 : 0;

            if ($sectionId <= 0 || $subjectId <= 0) {
                respond(false, 'Invalid parameters.', [], 422);
            }

            $pdo->prepare("
                INSERT INTO grade_locks (section_id, subject_id, quarter, is_locked, locked_by_user_id, locked_at, unlock_requested, unlock_reason)
                VALUES (?, ?, ?, ?, ?, NOW(), 0, NULL)
                ON DUPLICATE KEY UPDATE
                    is_locked = VALUES(is_locked),
                    locked_by_user_id = VALUES(locked_by_user_id),
                    locked_at = NOW(),
                    unlock_requested = 0,
                    unlock_reason = NULL
            ")->execute([$sectionId, $subjectId, $quarter, $lock, $authUser['id']]);
            respond(true, $lock ? "Grades locked successfully." : "Grades unlocked successfully.", fetchSystemState($pdo));
            break;

        case 'seed_demo':
            $pdo->beginTransaction();

            $demoSections = [
                ['BSIT 1-A', '1st Year', 'Prof. Maria Santos'],
                ['BSIT 1-B', '1st Year', 'Prof. Carlos Reyes'],
                ['BSIT 2-A', '2nd Year', 'Prof. Elena Cruz'],
            ];
            $secStmt = $pdo->prepare("INSERT IGNORE INTO sections (section_name, year_level, adviser) VALUES (?, ?, ?)");
            foreach ($demoSections as $ds) {
                $secStmt->execute($ds);
            }

            // 8 subjects whose units sum to 28: (4 + 4 + 4 + 4 + 4 + 3 + 1 + 4 = 28) matching (((E21*4)+(F21*4)+(G21*4)+(H21*4)+(I21*4)+(J21*3)+(K21*1)+(L21*4))/28)
            $demoSubjects = [
                ['SUBJ 101', 'Core Subject 1 (Major A)', 4.0, '4-unit core subject (Column E)'],
                ['SUBJ 102', 'Core Subject 2 (Major B)', 4.0, '4-unit core subject (Column F)'],
                ['SUBJ 103', 'Core Subject 3 (Science)', 4.0, '4-unit core subject (Column G)'],
                ['SUBJ 104', 'Core Subject 4 (Mathematics)', 4.0, '4-unit core subject (Column H)'],
                ['SUBJ 105', 'Core Subject 5 (English & Comm)', 4.0, '4-unit core subject (Column I)'],
                ['SUBJ 106', 'Social Studies & Ethics', 3.0, '3-unit general subject (Column J)'],
                ['SUBJ 107', 'Physical Education / Lab', 1.0, '1-unit enrichment course (Column K)'],
                ['SUBJ 108', 'Applied Research & Tech', 4.0, '4-unit capstone subject (Column L)'],
            ];
            $subStmt = $pdo->prepare("
                INSERT INTO subjects (subject_code, subject_name, units, description)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE units = VALUES(units), subject_name = VALUES(subject_name)
            ");
            foreach ($demoSubjects as $dsub) {
                $subStmt->execute($dsub);
            }

            $secMap = [];
            foreach ($pdo->query("SELECT id, section_name, year_level FROM sections")->fetchAll() as $r) {
                $secMap[$r['section_name']] = $r;
            }
            $subMap = [];
            foreach ($pdo->query("SELECT id, subject_code FROM subjects")->fetchAll() as $r) {
                $subMap[$r['subject_code']] = (int)$r['id'];
            }

            // Assign all 8 subjects (28 units total) to BSIT 1-A and BSIT 1-B
            $subjectCodes8 = ['SUBJ 101', 'SUBJ 102', 'SUBJ 103', 'SUBJ 104', 'SUBJ 105', 'SUBJ 106', 'SUBJ 107', 'SUBJ 108'];
            // Demo teacher accounts (password: teacher123). Each teacher handles specific subject loads:
            //   msantos → BSIT 1-A only | creyes → BSIT 1-A and BSIT 1-B | ecruz → BSIT 1-B only
            $demoTeachers = [
                'msantos' => 'Prof. Maria Santos',
                'creyes'  => 'Prof. Carlos Reyes',
                'ecruz'   => 'Prof. Elena Cruz',
            ];
            $teacherIns = $pdo->prepare("INSERT IGNORE INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, 'teacher')");
            $teacherIdMap = [];
            foreach ($demoTeachers as $uname => $tname) {
                $teacherIns->execute([$uname, password_hash('teacher123', PASSWORD_DEFAULT), $tname]);
                $tFind = $pdo->prepare("SELECT id FROM users WHERE username = ?");
                $tFind->execute([$uname]);
                $teacherIdMap[$uname] = (int)$tFind->fetchColumn();
            }
            $loadPlan = [
                'BSIT 1-A' => ['msantos', 'creyes'], // even-index subjects → first, odd-index → second
                'BSIT 1-B' => ['creyes', 'ecruz'],
            ];

            $assStmt = $pdo->prepare("
                INSERT INTO section_subjects (section_id, subject_id, schedule, instructor, teacher_id)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE instructor = VALUES(instructor), teacher_id = VALUES(teacher_id)
            ");
            foreach (['BSIT 1-A', 'BSIT 1-B'] as $secNameSeed) {
                if (isset($secMap[$secNameSeed])) {
                    $seedSecId = (int)$secMap[$secNameSeed]['id'];
                    foreach ($subjectCodes8 as $idx => $code) {
                        if (isset($subMap[$code])) {
                            $tUser = $loadPlan[$secNameSeed][$idx % 2];
                            $inst = $demoTeachers[$tUser];
                            $sched = $secNameSeed === 'BSIT 1-A' ? 'MWF' : 'TTH';
                            $assStmt->execute([$seedSecId, $subMap[$code], $sched, $inst, $teacherIdMap[$tUser] ?: null]);
                        }
                    }
                }
            }

            // Base roster templates: 15 Females and 15 Males
            $femaleTemplates = [
                ['Angela', 'R.', 'Villanueva', [95, 94, 96, 93, 95, 94, 98, 95]],
                ['Sophia', 'L.', 'Bautista',   [91, 90, 89, 92, 90, 88, 94, 90]],
                ['Camille', 'P.', 'Navarro',   [93, 92, 91, 90, 92, 91, 95, 93]],
                ['Bea', 'C.', 'Aquino',        [85, 86, 84, 87, 85, 86, 88, 85]],
                ['Patricia', 'G.', 'Lim',      [94, 93, 92, 95, 93, 92, 96, 94]],
                ['Kathryn', 'B.', 'Bernardo',  [89, 90, 88, 91, 89, 87, 92, 90]],
                ['Liza', 'M.', 'Soberano',     [92, 93, 91, 94, 90, 92, 95, 93]],
                ['Nadine', 'A.', 'Lustre',     [88, 87, 89, 86, 88, 87, 90, 88]],
                ['Janella', 'S.', 'Salvador',  [84, 85, 83, 86, 84, 82, 88, 85]],
                ['Julia', 'E.', 'Barretto',    [86, 88, 85, 89, 87, 86, 90, 88]],
                ['Andrea', 'C.', 'Brillantes', [83, 84, 82, 85, 83, 81, 87, 84]],
                ['Francine', 'D.', 'Diaz',     [90, 91, 89, 92, 90, 89, 93, 91]],
                ['Belle', 'K.', 'Mariano',     [93, 94, 92, 95, 91, 93, 96, 94]],
                ['Kim', 'P.', 'Chiu',          [78, 80, 77, 82, 79, 76, 84, 80]],
                ['Sarah', 'G.', 'Geronimo',    [96, 95, 97, 94, 96, 95, 98, 96]],
            ];

            $maleTemplates = [
                ['Juan', 'M.', 'Dela Cruz',      [92, 91, 90, 93, 91, 90, 95, 92]],
                ['Mark Anthony', 'S.', 'Mendoza', [96, 95, 94, 83, 94, 92, 95, 93]],
                ['Gabriel', 'T.', 'Soriano',     [88, 87, 89, 86, 88, 87, 90, 88]],
                ['Alex', 'D.', 'Cruz',           [64, 62, 68, 60, 65, 66, 72, 63]],
                ['John', 'A.', 'Reyes',          [78, 79, 77, 80, 78, 76, 82, 79]],
                ['Christian', 'V.', 'Ramos',     [82, 81, 83, 80, 82, 84, 85, 81]],
                ['Paolo', 'E.', 'Garcia',        [70, 72, 68, 74, 71, 69, 75, 70]],
                ['Daniel', 'B.', 'Padilla',      [84, 85, 83, 86, 84, 82, 88, 85]],
                ['Enrique', 'J.', 'Gil',         [87, 86, 88, 85, 87, 86, 89, 87]],
                ['James', 'R.', 'Reid',          [85, 84, 86, 83, 85, 84, 88, 85]],
                ['Joshua', 'T.', 'Garcia',       [91, 90, 92, 89, 91, 90, 94, 91]],
                ['Donny', 'P.', 'Pangilinan',    [93, 92, 94, 91, 93, 92, 95, 93]],
                ['Alden', 'Q.', 'Richards',      [89, 88, 90, 87, 89, 88, 91, 89]],
                ['Dingdong', 'M.', 'Dantes',     [86, 87, 85, 88, 86, 85, 89, 87]],
                ['Piolo', 'N.', 'Pascual',       [95, 94, 96, 93, 95, 94, 97, 95]],
            ];

            // 15 Females and 15 Males per section (30 total per section)
            $sectionPrefixes = [
                'BSIT 1-A' => '261A',
                'BSIT 1-B' => '261B',
                'BSIT 2-A' => '262A',
            ];
            $demoStudents = [];
            foreach ($sectionPrefixes as $sName => $pfx) {
                // 15 Female students
                foreach ($femaleTemplates as $fIdx => [$fn, $mn, $ln, $grades]) {
                    $stNo = sprintf('%s-F%02d', $pfx, $fIdx + 1);
                    $demoStudents[] = [$stNo, $fn, $mn, $ln, 'Female', $sName, $grades];
                }
                // 15 Male students
                foreach ($maleTemplates as $mIdx => [$fn, $mn, $ln, $grades]) {
                    $stNo = sprintf('%s-M%02d', $pfx, $mIdx + 1);
                    $demoStudents[] = [$stNo, $fn, $mn, $ln, 'Male', $sName, $grades];
                }
            }
            $stuStmt = $pdo->prepare("
                INSERT INTO students (student_no, first_name, middle_name, last_name, full_name, gender, year_level, section_id, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')
                ON DUPLICATE KEY UPDATE gender = VALUES(gender), section_id = VALUES(section_id), year_level = VALUES(year_level)
            ");
            $gradeStmt = $pdo->prepare("
                INSERT INTO student_grades (student_id, section_id, subject_id, quarter, grade, remarks)
                VALUES (?, ?, ?, 'Q1', ?, ?)
                ON DUPLICATE KEY UPDATE grade = VALUES(grade), remarks = VALUES(remarks)
            ");

            foreach ($demoStudents as [$stNo, $fn, $mn, $ln, $genderVal, $sName, $gradesArr]) {
                if (!isset($secMap[$sName])) {
                    continue;
                }
                $targetSec = $secMap[$sName];
                $targetSecId = (int)$targetSec['id'];
                $full = "{$ln}, {$fn}" . ($mn ? " {$mn}" : '');
                $stuStmt->execute([$stNo, $fn, $mn, $ln, $full, $genderVal, $targetSec['year_level'], $targetSecId]);

                $findStu = $pdo->prepare("SELECT id FROM students WHERE student_no = ?");
                $findStu->execute([$stNo]);
                $stuId = (int)$findStu->fetchColumn();

                if ($stuId > 0) {
                    foreach ($subjectCodes8 as $i => $code) {
                        if (isset($subMap[$code], $gradesArr[$i])) {
                            $gVal = (float)$gradesArr[$i];
                            $rem = $gVal >= 75 ? 'Passed' : 'Failed';
                            $gradeStmt->execute([$stuId, $targetSecId, $subMap[$code], $gVal, $rem]);
                        }
                    }
                }
            }

            $pdo->commit();
            respond(true, 'Sample sections, 28-unit curriculum, Female/Male student rosters, and Q1 grades loaded.', fetchSystemState($pdo));
            break;

        default:
            respond(false, 'Unknown API action.', [], 400);
    }
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respond(false, 'Server error: ' . $e->getMessage(), [], 500);
}
