<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config/db.php';

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

function fetchSystemState(PDO $pdo): array
{
    // 1. Fetch Sections
    $sectionsStmt = $pdo->query("
        SELECT 
            s.id,
            s.section_name,
            s.year_level,
            s.adviser,
            s.created_at,
            COUNT(DISTINCT st.id) AS student_count
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
            ss.assigned_at,
            sub.subject_code,
            sub.subject_name,
            sub.units,
            sec.section_name,
            sec.year_level
        FROM section_subjects ss
        INNER JOIN subjects sub ON sub.id = ss.subject_id
        INNER JOIN sections sec ON sec.id = ss.section_id
        ORDER BY ss.id ASC, sub.subject_code ASC
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
            'instructor'    => $row['instructor'] ?? '',
        ];

        $subjectSectionsMap[$subId][] = [
            'assignment_id' => (int)$row['assignment_id'],
            'section_id'    => $secId,
            'section_name'  => $row['section_name'],
            'year_level'    => $row['year_level'],
            'schedule'      => $row['schedule'] ?? '',
            'instructor'    => $row['instructor'] ?? '',
        ];
    }

    foreach ($sections as &$sec) {
        $sec['id'] = (int)$sec['id'];
        $sec['student_count'] = (int)$sec['student_count'];
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

    // 4. Fetch Students
    $studentsStmt = $pdo->query("
        SELECT 
            st.id,
            st.student_no,
            st.first_name,
            st.middle_name,
            st.last_name,
            st.full_name,
            st.year_level,
            st.section_id,
            st.status,
            st.created_at,
            sec.section_name
        FROM students st
        INNER JOIN sections sec ON sec.id = st.section_id
        ORDER BY st.last_name ASC, st.first_name ASC
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

    foreach ($students as &$st) {
        $st['id'] = (int)$st['id'];
        $st['section_id'] = (int)$st['section_id'];
        $st['assigned_subjects'] = $sectionSubjectsMap[$st['section_id']] ?? [];
        $st['grades'] = $gradesByStudent[$st['id']] ?? new stdClass();
    }
    unset($st);

    return [
        'sections' => $sections,
        'subjects' => $subjects,
        'students' => $students,
        'stats'    => [
            'total_students'    => count($students),
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

try {
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
                $existingStmt = $pdo->prepare("SELECT subject_id, schedule, instructor FROM section_subjects WHERE section_id = ?");
                $existingStmt->execute([$sectionId]);
                $existingMap = [];
                foreach ($existingStmt->fetchAll() as $erow) {
                    $existingMap[(int)$erow['subject_id']] = $erow;
                }

                $delStmt = $pdo->prepare("DELETE FROM section_subjects WHERE section_id = ?");
                $delStmt->execute([$sectionId]);

                $insStmt = $pdo->prepare("INSERT INTO section_subjects (section_id, subject_id, schedule, instructor) VALUES (?, ?, ?, ?)");
                foreach (array_unique($subjectIds) as $subId) {
                    if ($subId > 0) {
                        $sched = $existingMap[$subId]['schedule'] ?? null;
                        $inst = $existingMap[$subId]['instructor'] ?? null;
                        $insStmt->execute([$sectionId, $subId, $sched, $inst]);
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

            $ins = $pdo->prepare("INSERT INTO section_subjects (section_id, subject_id, schedule, instructor) VALUES (?, ?, ?, ?)");
            $count = 0;
            if (is_array($assignments)) {
                $seen = [];
                foreach ($assignments as $item) {
                    $subId = is_array($item) ? (int)($item['subject_id'] ?? 0) : (int)$item;
                    if ($subId > 0 && !isset($seen[$subId])) {
                        $seen[$subId] = true;
                        $schedule = is_array($item) && !empty($item['schedule']) ? trim((string)$item['schedule']) : null;
                        $instructor = is_array($item) && !empty($item['instructor']) ? trim((string)$item['instructor']) : null;
                        $ins->execute([$sectionId, $subId, $schedule, $instructor]);
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
            $id = isset($input['id']) && $input['id'] !== '' ? (int)$input['id'] : null;
            $studentNo = trim((string)($input['student_no'] ?? ''));
            $firstName = trim((string)($input['first_name'] ?? ''));
            $middleName = trim((string)($input['middle_name'] ?? ''));
            $lastName = trim((string)($input['last_name'] ?? ''));
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
                    SET student_no = ?, first_name = ?, middle_name = ?, last_name = ?, full_name = ?, year_level = ?, section_id = ?, status = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $studentNo,
                    $firstName,
                    $middleName !== '' ? $middleName : null,
                    $lastName,
                    $fullName,
                    $yearLevel,
                    $sectionId,
                    $status,
                    $id,
                ]);
                // Also keep student_grades section_id synced if student moved sections
                $syncGradesSec = $pdo->prepare("UPDATE student_grades SET section_id = ? WHERE student_id = ?");
                $syncGradesSec->execute([$sectionId, $id]);
                $msg = "Student '{$fullName}' updated successfully.";
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO students (student_no, first_name, middle_name, last_name, full_name, year_level, section_id, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $studentNo,
                    $firstName,
                    $middleName !== '' ? $middleName : null,
                    $lastName,
                    $fullName,
                    $yearLevel,
                    $sectionId,
                    $status,
                ]);
                $msg = "Student '{$fullName}' added to {$sectionRow['section_name']} ({$yearLevel}).";
            }

            respond(true, $msg, fetchSystemState($pdo));
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
            foreach ($entries as $entry) {
                $studentId = (int)($entry['student_id'] ?? 0);
                $sectionId = (int)($entry['section_id'] ?? 0);
                $subjectId = (int)($entry['subject_id'] ?? 0);
                $quarter = strtoupper(trim((string)($entry['quarter'] ?? 'Q1')));
                $rawGrade = $entry['grade'] ?? '';

                if ($studentId <= 0 || $sectionId <= 0 || $subjectId <= 0 || !in_array($quarter, $validQuarters, true)) {
                    continue;
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

            // Assign all 8 subjects (28 units total) to BSIT 1-A
            $subjectCodes8 = ['SUBJ 101', 'SUBJ 102', 'SUBJ 103', 'SUBJ 104', 'SUBJ 105', 'SUBJ 106', 'SUBJ 107', 'SUBJ 108'];
            $assStmt = $pdo->prepare("INSERT IGNORE INTO section_subjects (section_id, subject_id, schedule, instructor) VALUES (?, ?, ?, ?)");
            if (isset($secMap['BSIT 1-A'])) {
                $sec1AId = (int)$secMap['BSIT 1-A']['id'];
                foreach ($subjectCodes8 as $idx => $code) {
                    if (isset($subMap[$code])) {
                        $inst = $idx % 2 === 0 ? 'Prof. Maria Santos' : 'Prof. Carlos Reyes';
                        $assStmt->execute([$sec1AId, $subMap[$code], 'MWF', $inst]);
                    }
                }
            }

            $demoStudents = [
                ['2026-0001', 'Angela', 'R.', 'Villanueva', 'BSIT 1-A', [95, 94, 96, 93, 95, 94, 98, 95]], // Avg ~94.68, min 93 -> QUALIFIED
                ['2026-0002', 'Juan', 'M.', 'Dela Cruz', 'BSIT 1-A', [92, 91, 90, 93, 91, 90, 95, 92]],   // Avg ~91.61, min 90 -> QUALIFIED
                ['2026-0003', 'Sophia', 'L.', 'Bautista', 'BSIT 1-A', [91, 90, 89, 92, 90, 88, 94, 90]],  // Avg ~90.29, min 88 -> QUALIFIED
                ['2026-0004', 'Mark Anthony', 'S.', 'Mendoza', 'BSIT 1-A', [96, 95, 94, 83, 94, 92, 95, 93]], // Avg ~92.25 (>=90), BUT has 83 (<85) -> NOT QUALIFIED (below 85 rule)
                ['2026-0005', 'Gabriel', 'T.', 'Soriano', 'BSIT 1-A', [88, 87, 89, 86, 88, 87, 90, 88]],  // Min 86 (>=85), but Avg ~87.68 (<90) -> NOT QUALIFIED
            ];
            $stuStmt = $pdo->prepare("
                INSERT INTO students (student_no, first_name, middle_name, last_name, full_name, year_level, section_id, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
                ON DUPLICATE KEY UPDATE section_id = VALUES(section_id), year_level = VALUES(year_level)
            ");
            $gradeStmt = $pdo->prepare("
                INSERT INTO student_grades (student_id, section_id, subject_id, quarter, grade, remarks)
                VALUES (?, ?, ?, 'Q1', ?, 'Passed')
                ON DUPLICATE KEY UPDATE grade = VALUES(grade)
            ");

            if (isset($secMap['BSIT 1-A'])) {
                $sec1A = $secMap['BSIT 1-A'];
                $sec1AId = (int)$sec1A['id'];

                foreach ($demoStudents as [$stNo, $fn, $mn, $ln, $sName, $gradesArr]) {
                    $full = "{$ln}, {$fn}" . ($mn ? " {$mn}" : '');
                    $stuStmt->execute([$stNo, $fn, $mn, $ln, $full, $sec1A['year_level'], $sec1AId]);

                    $findStu = $pdo->prepare("SELECT id FROM students WHERE student_no = ?");
                    $findStu->execute([$stNo]);
                    $stuId = (int)$findStu->fetchColumn();

                    if ($stuId > 0) {
                        foreach ($subjectCodes8 as $i => $code) {
                            if (isset($subMap[$code], $gradesArr[$i])) {
                                $gradeStmt->execute([$stuId, $sec1AId, $subMap[$code], $gradesArr[$i]]);
                            }
                        }
                    }
                }
            }

            $pdo->commit();
            respond(true, 'Sample sections, 28-unit curriculum, students, and Q1 grades loaded.', fetchSystemState($pdo));
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
