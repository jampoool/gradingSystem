<!-- ==================== MODAL 1: CREATE / EDIT SECTION ==================== -->
<div id="sectionModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="sectionModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('sectionModal')"></div>

        <div class="inline-block w-full max-w-xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-[#D8DEE8]">
            <div class="px-6 py-4 bg-[#F5F7FA] border-b border-[#D8DEE8] flex items-center justify-between">
                <div>
                    <h3 id="sectionModalTitle" class="font-display font-bold text-lg text-[#17243A]">Create Section</h3>
                    <p class="text-sm text-[#64748B] mt-0.5">Define section name, year level, and optional initial subjects</p>
                </div>
                <button type="button" onclick="App.closeModal('sectionModal')" class="p-2 rounded-xl text-[#64748B] hover:text-[#17243A] hover:bg-[#D8DEE8]/50 transition" aria-label="Close modal">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="sectionForm" class="p-6 space-y-4">
                <input type="hidden" id="sectionIdInput" name="id">

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="sectionNameInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                            Section Name <span class="text-[#9B3F72]">*</span>
                        </label>
                        <input type="text" id="sectionNameInput" required placeholder="e.g., BSIT 1-A or Section Ruby" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                    </div>

                    <div>
                        <label for="sectionYearLevelInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                            Year Level <span class="text-[#9B3F72]">*</span>
                        </label>
                        <select id="sectionYearLevelInput" required class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] bg-white focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
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
                    <label for="sectionAdviserInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                        Class Adviser / Coordinator <span class="text-[#64748B] font-normal">(Optional)</span>
                    </label>
                    <input type="text" id="sectionAdviserInput" placeholder="e.g., Prof. Maria Santos" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                </div>

                <div class="pt-1">
                    <div class="flex items-center justify-between mb-2">
                        <label class="block text-sm font-semibold text-[#17243A]">
                            Assign Subjects to this Section
                        </label>
                        <button type="button" onclick="App.openSubjectModal(null, true)" class="text-xs sm:text-sm font-semibold text-[#5276A7] hover:text-[#17243A] cursor-pointer">
                            + Create New Subject
                        </button>
                    </div>
                    <div id="sectionModalSubjectsChecklist" class="max-h-52 overflow-y-auto custom-scrollbar border border-[#D8DEE8] rounded-xl p-3 bg-[#F5F7FA] space-y-1.5">
                        <!-- Checkboxes populated by JS -->
                    </div>
                </div>

                <div class="pt-4 border-t border-[#D8DEE8] flex items-center justify-end gap-2.5">
                    <button type="button" onclick="App.closeModal('sectionModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] hover:bg-[#F5F7FA] transition cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" id="sectionSubmitBtn" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer">
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
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('subjectModal')"></div>

        <div class="inline-block w-full max-w-lg my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-[#D8DEE8]">
            <div class="px-6 py-4 bg-[#F5F7FA] border-b border-[#D8DEE8] flex items-center justify-between">
                <div>
                    <h3 id="subjectModalTitle" class="font-display font-bold text-lg text-[#17243A]">Add New Subject</h3>
                    <p class="text-sm text-[#64748B] mt-0.5">Define subject code, descriptive title, and credit units (weight in ranking)</p>
                </div>
                <button type="button" onclick="App.closeModal('subjectModal')" class="p-2 rounded-xl text-[#64748B] hover:text-[#17243A] hover:bg-[#D8DEE8]/50 transition" aria-label="Close modal">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="subjectForm" class="p-6 space-y-4">
                <input type="hidden" id="subjectIdInput" name="id">

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="sm:col-span-2">
                        <label for="subjectCodeInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                            Subject Code <span class="text-[#9B3F72]">*</span>
                        </label>
                        <input type="text" id="subjectCodeInput" required placeholder="e.g., SUBJ 101" class="w-full px-3.5 py-2.5 text-sm uppercase rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                    </div>

                    <div>
                        <label for="subjectUnitsInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                            Units (Weight) <span class="text-[#9B3F72]">*</span>
                        </label>
                        <input type="number" step="0.5" min="0.5" max="15" id="subjectUnitsInput" value="4.0" required class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                    </div>
                </div>

                <div>
                    <label for="subjectNameInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                        Subject Name / Descriptive Title <span class="text-[#9B3F72]">*</span>
                    </label>
                    <input type="text" id="subjectNameInput" required placeholder="e.g., Introduction to Computing" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                </div>

                <div>
                    <label for="subjectDescInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                        Description <span class="text-[#64748B] font-normal">(Optional)</span>
                    </label>
                    <textarea id="subjectDescInput" rows="2" placeholder="Brief course overview..." class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none"></textarea>
                </div>

                <div id="subjectAssignSectionsWrapper" class="pt-1">
                    <label class="block text-sm font-semibold text-[#17243A] mb-2">
                        Assign to Sections <span class="text-[#64748B] font-normal">(Optional)</span>
                    </label>
                    <div id="subjectModalSectionsChecklist" class="max-h-40 overflow-y-auto custom-scrollbar border border-[#D8DEE8] rounded-xl p-3 bg-[#F5F7FA] space-y-1.5">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <div class="pt-4 border-t border-[#D8DEE8] flex items-center justify-end gap-2.5">
                    <button type="button" onclick="App.closeModal('subjectModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] hover:bg-[#F5F7FA] transition cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" id="subjectSubmitBtn" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer">
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
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('assignSubjectsModal')"></div>

        <div class="inline-block w-full max-w-3xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-[#D8DEE8]">
            <div class="px-6 py-4 bg-[#17243A] text-white flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-2.5">
                        <span id="assignModalYearBadge" class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#243752] text-[#B8CCE6] border border-[#5276A7]/40">1st Year</span>
                        <h3 id="assignModalTitle" class="font-display font-bold text-lg">Manage Subjects — Section</h3>
                    </div>
                    <p class="text-sm text-slate-300 mt-0.5">Select the subjects taken by this section and optionally set schedules or instructors</p>
                </div>
                <button type="button" onclick="App.closeModal('assignSubjectsModal')" class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#243752] transition" aria-label="Close modal">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="assignSubjectsForm" class="p-6 space-y-4">
                <input type="hidden" id="assignSectionIdInput">

                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="relative flex-1">
                        <svg class="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" id="assignSubjectSearch" placeholder="Filter subjects by code or name..." class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                    </div>

                    <div class="flex items-center gap-2">
                        <button type="button" onclick="App.toggleAllAssignSubjects(true)" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#17243A] bg-[#F5F7FA] hover:bg-[#D8DEE8]/60 border border-[#D8DEE8] transition cursor-pointer">
                            Select All
                        </button>
                        <button type="button" onclick="App.toggleAllAssignSubjects(false)" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#17243A] bg-[#F5F7FA] hover:bg-[#D8DEE8]/60 border border-[#D8DEE8] transition cursor-pointer">
                            Clear All
                        </button>
                        <button type="button" onclick="App.openSubjectModal(null, true)" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#5276A7] hover:bg-[#3E5F8A] transition cursor-pointer">
                            + New Subject
                        </button>
                    </div>
                </div>

                <div id="assignSubjectsListContainer" class="max-h-96 overflow-y-auto custom-scrollbar border border-[#D8DEE8] rounded-xl divide-y divide-[#D8DEE8]/70 bg-[#F5F7FA]/60">
                    <!-- Populated by JS -->
                </div>

                <div class="pt-4 border-t border-[#D8DEE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="text-sm text-[#64748B]">
                        Selected: <strong id="assignSelectedCount" class="text-[#17243A]">0</strong> subjects (Divisor: <strong id="assignSelectedUnits" class="text-[#0F766E]">0.0</strong> total units)
                    </div>
                    <div class="flex items-center justify-end gap-2.5">
                        <button type="button" onclick="App.closeModal('assignSubjectsModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] hover:bg-[#F5F7FA] transition cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" id="assignSubjectsSubmitBtn" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer">
                            Save Assigned Subjects
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ==================== MODAL 4: ADD / EDIT / BULK ENROLL STUDENT ==================== -->
<div id="studentModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="studentModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('studentModal')"></div>

        <div class="inline-block w-full max-w-2xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-[#D8DEE8]">
            <div class="px-6 py-4 bg-[#F5F7FA] border-b border-[#D8DEE8] flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 id="studentModalTitle" class="font-display font-bold text-lg text-[#17243A]">Enroll Student</h3>
                    <p id="studentModalSubtitle" class="text-sm text-[#64748B] mt-0.5">Add a single student or bulk paste multiple students (1 per line)</p>
                </div>

                <div class="flex items-center gap-2">
                    <!-- Mode Switcher (Hidden when editing an existing student) -->
                    <div id="studentModalModeToggle" class="inline-flex bg-[#D8DEE8]/70 p-1 rounded-xl text-xs font-semibold">
                        <button type="button" id="studentModeSingleBtn" onclick="App.setStudentModalMode('single')" class="px-3 py-1.5 rounded-lg bg-white text-[#17243A] shadow-2xs transition cursor-pointer">
                            Single Student
                        </button>
                        <button type="button" id="studentModeBulkBtn" onclick="App.setStudentModalMode('bulk')" class="px-3 py-1.5 rounded-lg text-[#64748B] hover:text-[#17243A] transition cursor-pointer flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5 text-[#5276A7]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
                            </svg>
                            <span>Bulk Add (1 per Line)</span>
                        </button>
                    </div>

                    <button type="button" onclick="App.closeModal('studentModal')" class="p-2 rounded-xl text-[#64748B] hover:text-[#17243A] hover:bg-[#D8DEE8]/50 transition" aria-label="Close modal">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>

            <form id="studentForm" class="p-6 space-y-4">
                <input type="hidden" id="studentIdInput" name="id">

                <!-- Common Target Section & Year Level Selection -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-3 border-b border-[#D8DEE8]">
                    <div>
                        <label for="studentYearLevelSelect" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                            Year Level <span class="text-[#9B3F72]">*</span>
                        </label>
                        <select id="studentYearLevelSelect" required class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] bg-white focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
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
                        <div class="flex items-center justify-between mb-1.5">
                            <label for="studentSectionSelect" class="block text-sm font-semibold text-[#17243A]">
                                Assigned Section <span class="text-[#9B3F72]">*</span>
                            </label>
                            <button type="button" onclick="App.openSectionModal(null, true)" class="text-xs font-semibold text-[#5276A7] hover:text-[#17243A] cursor-pointer">
                                + New Section
                            </button>
                        </div>
                        <select id="studentSectionSelect" required class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] bg-white focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                            <option value="" disabled selected>Select Section</option>
                        </select>
                    </div>

                    <div>
                        <label for="studentStatusInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                            Enrollment Status
                        </label>
                        <select id="studentStatusInput" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] bg-white focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                            <option value="Active">Active (Regular)</option>
                            <option value="Irregular">Irregular</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <!-- ==================== SINGLE STUDENT FIELDS ==================== -->
                <div id="singleStudentFields" class="space-y-4">
                    <div>
                        <label for="studentNoInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                            Student ID Number <span class="text-[#64748B] font-normal">(Auto-generated if left blank)</span>
                        </label>
                        <input type="text" id="studentNoInput" placeholder="e.g., 2026-0001" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                            <label for="studentFirstNameInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                                First Name <span class="text-[#9B3F72]">*</span>
                            </label>
                            <input type="text" id="studentFirstNameInput" required placeholder="e.g., Juan" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                        </div>

                        <div>
                            <label for="studentMiddleNameInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                                Middle Name / M.I.
                            </label>
                            <input type="text" id="studentMiddleNameInput" placeholder="e.g., M." class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                        </div>

                        <div>
                            <label for="studentLastNameInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                                Last Name <span class="text-[#9B3F72]">*</span>
                            </label>
                            <input type="text" id="studentLastNameInput" required placeholder="e.g., Dela Cruz" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                        </div>
                    </div>
                </div>

                <!-- ==================== BULK ADD STUDENTS (1 PER LINE) FIELDS ==================== -->
                <div id="bulkStudentFields" class="hidden space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <label for="bulkStudentsTextarea" class="block text-sm font-semibold text-[#17243A]">
                            Paste or Type Student List <span class="text-[#9B3F72]">*</span>
                            <span class="text-xs font-normal text-[#64748B] ml-1">(1 student per line)</span>
                        </label>
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="App.fillSampleBulkStudents()" class="text-xs font-semibold text-[#2C4870] bg-[#EBF1F8] hover:bg-[#D8E4F3] border border-[#C5D6EB] px-2.5 py-1 rounded-lg transition cursor-pointer">
                                + Insert Sample Lines
                            </button>
                            <span id="bulkStudentLineCountBadge" class="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                                0 students detected
                            </span>
                        </div>
                    </div>

                    <textarea id="bulkStudentsTextarea" rows="7" oninput="App.onBulkStudentTextInput()" placeholder="Enter 1 student per line. Supported formats:&#10;Dela Cruz, Juan M.&#10;Villanueva, Angela R.&#10;Mark Anthony S. Mendoza&#10;2026-0101 | Bautista, Sophia L." class="w-full px-3.5 py-3 text-sm font-mono rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none leading-relaxed"></textarea>

                    <div class="rounded-xl bg-[#F5F7FA] border border-[#D8DEE8] p-3 space-y-2">
                        <div class="flex items-center justify-between text-xs">
                            <span class="font-bold uppercase tracking-wider text-[#64748B]">Live Parsed Preview</span>
                            <span class="text-[#64748B]">Accepts <code class="text-[#17243A]">Last, First M.I.</code> or <code class="text-[#17243A]">First M.I. Last</code> or <code class="text-[#17243A]">ID | Name</code></span>
                        </div>
                        <div id="bulkStudentsPreviewList" class="max-h-36 overflow-y-auto custom-scrollbar divide-y divide-[#D8DEE8]/70 text-xs text-[#64748B]">
                            <p class="text-[#64748B] italic py-1">Type or paste student names above to preview how they will be saved...</p>
                        </div>
                    </div>
                </div>

                <!-- Section Subject Load Preview -->
                <div class="rounded-xl bg-[#F5F7FA] border border-[#D8DEE8] p-3.5">
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Section Subject Load Preview</span>
                        <span id="studentModalSubjectCount" class="text-xs font-semibold text-[#5276A7]">0 subjects</span>
                    </div>
                    <div id="studentModalSubjectsPreview" class="flex flex-wrap gap-1.5 text-xs text-[#64748B]">
                        Select a section to preview its assigned subjects.
                    </div>
                </div>

                <div class="pt-4 border-t border-[#D8DEE8] flex items-center justify-end gap-2.5">
                    <button type="button" onclick="App.closeModal('studentModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] hover:bg-[#F5F7FA] transition cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" id="studentSubmitBtn" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer">
                        Save Student
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ==================== MODAL 5: CONFIRMATION DIALOG (BERRY PLUM DANGER #9B3F72) ==================== -->
<div id="confirmModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('confirmModal')"></div>

        <div class="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 border border-[#D8DEE8]">
            <div class="flex items-start gap-4">
                <div class="w-11 h-11 rounded-full bg-[#F5DFEB] text-[#842D60] border border-[#E2B8CF] flex items-center justify-center shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <div>
                    <h3 id="confirmModalTitle" class="font-display font-bold text-base sm:text-lg text-[#17243A]">Confirm Deletion</h3>
                    <p id="confirmModalMessage" class="text-sm text-[#64748B] mt-1 leading-relaxed">Are you sure you want to delete this record?</p>
                </div>
            </div>

            <div class="mt-6 flex items-center justify-end gap-2.5">
                <button type="button" onclick="App.closeModal('confirmModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] hover:bg-[#F5F7FA] transition cursor-pointer">
                    Cancel
                </button>
                <button type="button" id="confirmModalActionBtn" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#9B3F72] hover:bg-[#842D60] shadow-sm transition cursor-pointer">
                    Yes, Delete
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Toast Notification Container -->
<div id="toastContainer" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none no-print"></div>
