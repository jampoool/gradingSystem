<!-- ==================== MODAL 1: CREATE / EDIT SECTION ==================== -->
<div id="sectionModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="sectionModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('sectionModal')"></div>

        <div class="inline-block w-full max-w-xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-[#D8DEE8]">
            <div class="px-6 py-4 bg-[#F5F7FA] border-b border-[#D8DEE8] flex items-center justify-between">
                <div>
                    <h3 id="sectionModalTitle" class="font-display font-bold text-lg text-[#17243A]">Create Section</h3>
                    <p class="text-sm text-[#475569] mt-0.5">Define section name, year level, and optional initial subjects</p>
                </div>
                <button type="button" onclick="App.closeModal('sectionModal')" class="p-2 rounded-xl text-[#475569] hover:text-[#17243A] hover:bg-[#D8DEE8]/50 transition cursor-pointer" aria-label="Close dialog">
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
                            Section Name <span class="text-[#9B3F72]" aria-hidden="true">*</span>
                        </label>
                        <input type="text" id="sectionNameInput" required placeholder="e.g., BSIT 1-A or Section Ruby" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                    </div>

                    <div>
                        <label for="sectionYearLevelInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                            Year Level <span class="text-[#9B3F72]" aria-hidden="true">*</span>
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
                        Class Adviser / Coordinator <span class="text-[#475569] font-normal">(Optional)</span>
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
                    <button type="button" onclick="App.closeModal('sectionModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F5F7FA] transition cursor-pointer">
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
                    <p class="text-sm text-[#475569] mt-0.5">Define subject code, descriptive title, and credit units (weight in ranking)</p>
                </div>
                <button type="button" onclick="App.closeModal('subjectModal')" class="p-2 rounded-xl text-[#475569] hover:text-[#17243A] hover:bg-[#D8DEE8]/50 transition cursor-pointer" aria-label="Close dialog">
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
                            Subject Code <span class="text-[#9B3F72]" aria-hidden="true">*</span>
                        </label>
                        <input type="text" id="subjectCodeInput" required placeholder="e.g., SUBJ 101" class="w-full px-3.5 py-2.5 text-sm uppercase rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                    </div>

                    <div>
                        <label for="subjectUnitsInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                            Units (Weight) <span class="text-[#9B3F72]" aria-hidden="true">*</span>
                        </label>
                        <input type="number" step="0.5" min="0.5" max="15" id="subjectUnitsInput" value="4.0" required class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                    </div>
                </div>

                <div>
                    <label for="subjectNameInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                        Subject Name / Descriptive Title <span class="text-[#9B3F72]" aria-hidden="true">*</span>
                    </label>
                    <input type="text" id="subjectNameInput" required placeholder="e.g., Introduction to Computing" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                </div>

                <div>
                    <label for="subjectDescInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                        Description <span class="text-[#475569] font-normal">(Optional)</span>
                    </label>
                    <textarea id="subjectDescInput" rows="2" placeholder="Brief course overview..." class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none"></textarea>
                </div>

                <div id="subjectAssignSectionsWrapper" class="pt-1">
                    <label class="block text-sm font-semibold text-[#17243A] mb-2">
                        Assign to Sections <span class="text-[#475569] font-normal">(Optional)</span>
                    </label>
                    <div id="subjectModalSectionsChecklist" class="max-h-40 overflow-y-auto custom-scrollbar border border-[#D8DEE8] rounded-xl p-3 bg-[#F5F7FA] space-y-1.5">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <div class="pt-4 border-t border-[#D8DEE8] flex items-center justify-end gap-2.5">
                    <button type="button" onclick="App.closeModal('subjectModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F5F7FA] transition cursor-pointer">
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
                <button type="button" onclick="App.closeModal('assignSubjectsModal')" class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#243752] transition cursor-pointer" aria-label="Close dialog">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="assignSubjectsForm" class="p-6 space-y-4">
                <input type="hidden" id="assignSectionIdInput">

                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="relative flex-1">
                        <svg class="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" id="assignSubjectSearch" aria-label="Filter subjects to assign" placeholder="Filter subjects by code or name..." class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
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
                    <div class="flex items-center gap-2.5 flex-wrap">
                        <div class="text-sm text-[#475569]">
                            Selected: <strong id="assignSelectedCount" class="text-[#17243A]">0</strong> subjects (Divisor: <strong id="assignSelectedUnits" class="text-[#0F766E]">0.0</strong> total units)
                        </div>
                        <button type="button" onclick="App.openReorderFromAssignModal()" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#2C4870] bg-[#EBF1F8] hover:bg-[#D8E4F3] border border-[#C5D5EA] transition cursor-pointer" title="Adjust the order in which these subjects are input">
                            <span>⇅ Subject Order</span>
                        </button>
                    </div>
                    <div class="flex items-center justify-end gap-2.5">
                        <button type="button" onclick="App.closeModal('assignSubjectsModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F5F7FA] transition cursor-pointer">
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

<!-- ==================== MODAL 3B: REORDER SECTION SUBJECTS ==================== -->
<div id="reorderSubjectsModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="reorderModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('reorderSubjectsModal')"></div>

        <div class="inline-block w-full max-w-2xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-[#D8DEE8]">
            <div class="px-6 py-4 bg-[#17243A] text-white flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-2.5">
                        <span class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#5276A7]/40 text-[#D5F0EA] border border-[#5276A7]/50">Sequence &amp; Formula</span>
                        <h3 id="reorderModalTitle" class="font-display font-bold text-lg">Order Subjects for Section</h3>
                    </div>
                    <p class="text-xs sm:text-sm text-slate-300 mt-0.5">Customize which subject comes first (Col E), second (Col F), etc. for grade input and reports.</p>
                </div>
                <button type="button" onclick="App.closeModal('reorderSubjectsModal')" class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#243752] transition cursor-pointer" aria-label="Close dialog">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div class="p-6 space-y-4">
                <input type="hidden" id="reorderSectionIdInput">

                <div class="flex items-center justify-between gap-2 bg-[#F5F7FA] p-3 rounded-xl border border-[#D8DEE8] text-xs">
                    <span class="text-[#475569]">
                        Use the <kbd class="px-1.5 py-0.5 bg-white border border-[#D8DEE8] rounded font-semibold text-[#17243A]">▲</kbd> / <kbd class="px-1.5 py-0.5 bg-white border border-[#D8DEE8] rounded font-semibold text-[#17243A]">▼</kbd> buttons or the position dropdown to set which subject is input first.
                    </span>
                    <button type="button" onclick="App.resetSubjectOrderToAlphabetical()" class="px-2.5 py-1 rounded-lg bg-white border border-[#D8DEE8] text-[#2C4870] hover:bg-[#EBF1F8] font-semibold whitespace-nowrap cursor-pointer transition">
                        Reset A&ndash;Z
                    </button>
                </div>

                <div id="reorderSubjectsListContainer" class="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                    <!-- Populated by JS -->
                </div>

                <div class="pt-4 border-t border-[#D8DEE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="text-xs font-mono text-[#2C4870] truncate max-w-sm">
                        <span class="text-[#475569] font-sans">Formula Preview: </span>
                        <code id="reorderFormulaPreview" class="font-bold"></code>
                    </div>
                    <div class="flex items-center justify-end gap-2.5">
                        <button type="button" onclick="App.closeModal('reorderSubjectsModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F5F7FA] transition cursor-pointer">
                            Cancel
                        </button>
                        <button type="button" id="reorderSaveBtn" onclick="App.saveSubjectOrder()" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer">
                            Apply Subject Order
                        </button>
                    </div>
                </div>
            </div>
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
                    <p id="studentModalSubtitle" class="text-sm text-[#475569] mt-0.5">Add a single student or bulk paste multiple students (1 per line)</p>
                </div>

                <div class="flex items-center gap-2">
                    <!-- Mode Switcher (Hidden when editing an existing student) -->
                    <div id="studentModalModeToggle" class="inline-flex bg-[#D8DEE8]/70 p-1 rounded-xl text-xs font-semibold">
                        <button type="button" id="studentModeSingleBtn" onclick="App.setStudentModalMode('single')" class="px-3 py-1.5 rounded-lg bg-white text-[#17243A] shadow-2xs transition cursor-pointer">
                            Single Student
                        </button>
                        <button type="button" id="studentModeBulkBtn" onclick="App.setStudentModalMode('bulk')" class="px-3 py-1.5 rounded-lg text-[#475569] hover:text-[#17243A] transition cursor-pointer flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5 text-[#5276A7]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
                            </svg>
                            <span>Bulk Add (1 per Line)</span>
                        </button>
                    </div>

                    <button type="button" onclick="App.closeModal('studentModal')" class="p-2 rounded-xl text-[#475569] hover:text-[#17243A] hover:bg-[#D8DEE8]/50 transition cursor-pointer" aria-label="Close dialog">
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
                            Year Level <span class="text-[#9B3F72]" aria-hidden="true">*</span>
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
                                Assigned Section <span class="text-[#9B3F72]" aria-hidden="true">*</span>
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
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label for="studentNoInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                                Student ID Number <span class="text-[#475569] font-normal">(Auto if blank)</span>
                            </label>
                            <input type="text" id="studentNoInput" placeholder="e.g., 2026-0001" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                        </div>

                        <div>
                            <label for="studentGenderInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                                Gender / Roster Group <span class="text-[#9B3F72]" aria-hidden="true">*</span>
                            </label>
                            <select id="studentGenderInput" required class="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-[#D8DEE8] bg-white text-[#17243A] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                            <label for="studentFirstNameInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                                First Name <span class="text-[#9B3F72]" aria-hidden="true">*</span>
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
                                Last Name <span class="text-[#9B3F72]" aria-hidden="true">*</span>
                            </label>
                            <input type="text" id="studentLastNameInput" required placeholder="e.g., Dela Cruz" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                        </div>
                    </div>
                </div>

                <!-- ==================== BULK ADD STUDENTS (1 PER LINE) FIELDS ==================== -->
                <div id="bulkStudentFields" class="hidden space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2.5 flex-wrap">
                            <label for="bulkStudentsTextarea" class="block text-sm font-semibold text-[#17243A]">
                                Paste or Type Student List <span class="text-[#9B3F72]" aria-hidden="true">*</span>
                            </label>
                            <div class="inline-flex items-center gap-1.5 bg-[#F5F7FA] px-2.5 py-1 rounded-xl border border-[#D8DEE8]">
                                <label for="bulkStudentGenderInput" class="text-xs font-semibold text-[#475569]">Default Group:</label>
                                <select id="bulkStudentGenderInput" onchange="App.onBulkStudentTextInput()" class="text-xs font-bold text-[#17243A] bg-transparent outline-none cursor-pointer">
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="App.fillSampleBulkStudents()" class="text-xs font-semibold text-[#2C4870] bg-[#EBF1F8] hover:bg-[#D8E4F3] border border-[#C5D6EB] px-2.5 py-1 rounded-lg transition cursor-pointer">
                                + Insert Sample Lines
                            </button>
                            <span id="bulkStudentLineCountBadge" class="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]">
                                0 students detected
                            </span>
                        </div>
                    </div>

                    <textarea id="bulkStudentsTextarea" rows="7" oninput="App.onBulkStudentTextInput()" placeholder="Enter 1 student per line. You can also use 'Female:' and 'Male:' group headers or '| F' / '| M':&#10;Female:&#10;Villanueva, Angela R.&#10;Bautista, Sophia L.&#10;Male:&#10;Dela Cruz, Juan M.&#10;Mark Anthony S. Mendoza" class="w-full px-3.5 py-3 text-sm font-mono rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none leading-relaxed"></textarea>

                    <div class="rounded-xl bg-[#F5F7FA] border border-[#D8DEE8] p-3 space-y-2">
                        <div class="flex items-center justify-between text-xs">
                            <span class="font-bold uppercase tracking-wider text-[#475569]">Live Parsed Preview (Female &amp; Male)</span>
                            <span class="text-[#475569]">Supports <code class="text-[#17243A]">Female:</code> / <code class="text-[#17243A]">Male:</code> headers or <code class="text-[#17243A]">| F</code> / <code class="text-[#17243A]">| M</code></span>
                        </div>
                        <div id="bulkStudentsPreviewList" class="max-h-36 overflow-y-auto custom-scrollbar divide-y divide-[#D8DEE8]/70 text-xs text-[#475569]">
                            <p class="text-[#475569] italic py-1">Type or paste student names above to preview how they will be saved...</p>
                        </div>
                    </div>
                </div>

                <!-- Section Subject Load Preview -->
                <div class="rounded-xl bg-[#F5F7FA] border border-[#D8DEE8] p-3.5">
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="text-xs font-bold uppercase tracking-wider text-[#475569]">Section Subject Load Preview</span>
                        <span id="studentModalSubjectCount" class="text-xs font-semibold text-[#5276A7]">0 subjects</span>
                    </div>
                    <div id="studentModalSubjectsPreview" class="flex flex-wrap gap-1.5 text-xs text-[#475569]">
                        Select a section to preview its assigned subjects.
                    </div>
                </div>

                <div class="pt-4 border-t border-[#D8DEE8] flex items-center justify-end gap-2.5">
                    <button type="button" onclick="App.closeModal('studentModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F5F7FA] transition cursor-pointer">
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
<div id="confirmModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="confirmModalTitle" aria-describedby="confirmModalMessage">
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
                    <p id="confirmModalMessage" class="text-sm text-[#475569] mt-1 leading-relaxed">Are you sure you want to delete this record?</p>
                </div>
            </div>

            <div class="mt-6 flex items-center justify-end gap-2.5">
                <button type="button" onclick="App.closeModal('confirmModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F5F7FA] transition cursor-pointer">
                    Cancel
                </button>
                <button type="button" id="confirmModalActionBtn" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#9B3F72] hover:bg-[#842D60] shadow-sm transition cursor-pointer">
                    Yes, Delete
                </button>
            </div>
        </div>
    </div>
</div>

<!-- ==================== MODAL 6: TEACHER USER ACCOUNT & PERMISSIONS ==================== -->
<div id="teacherModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="teacherModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('teacherModal')"></div>

        <div class="inline-block w-full max-w-lg my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-[#D8DEE8]">
            <div class="px-6 py-4 bg-[#F5F7FA] border-b border-[#D8DEE8] flex items-center justify-between">
                <div>
                    <h3 id="teacherModalTitle" class="font-display font-bold text-lg text-[#17243A]">Add Teacher Account</h3>
                    <p class="text-sm text-[#475569] mt-0.5">Manage user credentials, role, and student enrollment permission</p>
                </div>
                <button type="button" onclick="App.closeModal('teacherModal')" class="p-2 rounded-xl text-[#475569] hover:text-[#17243A] hover:bg-[#D8DEE8]/50 transition cursor-pointer" aria-label="Close dialog">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="teacherForm" onsubmit="App.handleTeacherFormSubmit(event)" class="p-6 space-y-4">
                <input type="hidden" id="teacherIdInput" name="id">

                <div>
                    <label for="teacherFullNameInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                        Full Name &amp; Title <span class="text-[#9B3F72]" aria-hidden="true">*</span>
                    </label>
                    <input type="text" id="teacherFullNameInput" required placeholder="e.g., Prof. Maria Santos" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="teacherUsernameInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                            Username <span class="text-[#9B3F72]" aria-hidden="true">*</span>
                        </label>
                        <input type="text" id="teacherUsernameInput" required placeholder="e.g., msantos" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                    </div>

                    <div>
                        <label for="teacherRoleInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                            System Role <span class="text-[#9B3F72]" aria-hidden="true">*</span>
                        </label>
                        <select id="teacherRoleInput" onchange="App.onTeacherRoleSelectChange(this.value)" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] bg-white focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                            <option value="teacher" selected>Teacher (Handled Sections Only)</option>
                            <option value="admin">Administrator (Full Access)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label for="teacherPasswordInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                        <span id="teacherPasswordLabel">Password</span> <span id="teacherPasswordRequiredStar" class="text-[#9B3F72]">*</span>
                    </label>
                    <input type="password" id="teacherPasswordInput" placeholder="Minimum 6 characters" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                    <p id="teacherPasswordHelp" class="hidden text-xs text-[#475569] mt-1">Leave blank to keep existing password.</p>
                </div>

                <!-- Admin Permission: Enabling permission to add students -->
                <div id="teacherPermContainer" class="p-3.5 rounded-xl border border-[#D8DEE8] bg-[#F5F7FA] space-y-2.5">
                    <label class="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" id="teacherCanAddStudentInput" class="mt-1 w-4 h-4 rounded text-[#17243A] focus:ring-[#5276A7] border-[#D8DEE8]">
                        <div>
                            <span class="text-sm font-bold text-[#17243A] block">Enable Student Enrollment Permission</span>
                            <span class="text-xs text-[#475569] block mt-0.5">Allows this teacher to add or bulk-enroll students into their assigned sections. When disabled, student management is admin-only.</span>
                        </div>
                    </label>

                    <label class="flex items-center gap-3 cursor-pointer pt-2 border-t border-[#D8DEE8]">
                        <input type="checkbox" id="teacherIsActiveInput" checked class="w-4 h-4 rounded text-[#17243A] focus:ring-[#5276A7] border-[#D8DEE8]">
                        <span class="text-sm font-medium text-[#17243A]">Account is active and allowed to sign in</span>
                    </label>
                </div>

                <div class="pt-4 border-t border-[#D8DEE8] flex items-center justify-end gap-2.5">
                    <button type="button" onclick="App.closeModal('teacherModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F5F7FA] transition cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" id="teacherSubmitBtn" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer">
                        Save Account
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ==================== MODAL 7: REQUEST UNLOCK GRADES (TEACHER SIDE) ==================== -->
<div id="requestUnlockModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="requestUnlockModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('requestUnlockModal')"></div>

        <div class="inline-block w-full max-w-lg my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-[#D8DEE8]">
            <div class="px-6 py-4 bg-[#FFF0D1] border-b border-[#F0D296] flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#B7791F] text-white flex items-center justify-center font-bold text-sm">
                        🔒
                    </div>
                    <div>
                        <h3 id="requestUnlockModalTitle" class="font-display font-bold text-base sm:text-lg text-[#80530F]">Request to Unlock Grades</h3>
                        <p class="text-xs text-[#80530F]/90 mt-0.5">Submit an official unlock request to your administrator</p>
                    </div>
                </div>
                <button type="button" onclick="App.closeModal('requestUnlockModal')" class="p-2 rounded-xl text-[#80530F] hover:bg-[#F0D296]/50 transition cursor-pointer" aria-label="Close dialog">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="requestUnlockForm" onsubmit="App.handleRequestUnlockSubmit(event)" class="p-6 space-y-4">
                <input type="hidden" id="requestUnlockSectionId">
                <input type="hidden" id="requestUnlockSubjectId">
                <input type="hidden" id="requestUnlockQuarter">

                <div class="p-3.5 rounded-xl bg-[#F5F7FA] border border-[#D8DEE8] text-xs text-[#475569] space-y-1">
                    <div class="flex justify-between">
                        <span>Section:</span>
                        <strong id="requestUnlockSectionName" class="text-[#17243A]">BSIT 1-A</strong>
                    </div>
                    <div class="flex justify-between">
                        <span>Subject:</span>
                        <strong id="requestUnlockSubjectName" class="text-[#17243A]">SUBJ 101</strong>
                    </div>
                    <div class="flex justify-between">
                        <span>Quarter:</span>
                        <strong id="requestUnlockQuarterName" class="text-[#17243A]">Q1</strong>
                    </div>
                </div>

                <div>
                    <label for="requestUnlockReasonInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                        Reason for Rewriting Grades <span class="text-[#9B3F72]" aria-hidden="true">*</span>
                    </label>
                    <textarea id="requestUnlockReasonInput" required rows="3" placeholder="Please explain why the finalized grades need to be edited or rewritten (e.g. clerical grade correction, late requirement approval)..." class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none"></textarea>
                </div>

                <div class="pt-4 border-t border-[#D8DEE8] flex items-center justify-end gap-2.5">
                    <button type="button" onclick="App.closeModal('requestUnlockModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F5F7FA] transition cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" id="requestUnlockSubmitBtn" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#B7791F] hover:bg-[#80530F] shadow-sm transition cursor-pointer">
                        Submit Unlock Request
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ==================== MODAL 8: ADMIN REVIEW UNLOCK REQUEST ==================== -->
<div id="unlockReviewModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="unlockReviewModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('unlockReviewModal')"></div>

        <div class="inline-block w-full max-w-lg my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-[#D8DEE8]">
            <div class="px-6 py-4 bg-[#17243A] text-white flex items-center justify-between">
                <div>
                    <h3 id="unlockReviewModalTitle" class="font-display font-bold text-base sm:text-lg">Review Grade Unlock Request</h3>
                    <p class="text-xs text-slate-300 mt-0.5">Approve to allow the teacher to rewrite grades, or reject request</p>
                </div>
                <button type="button" onclick="App.closeModal('unlockReviewModal')" class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#243752] transition cursor-pointer" aria-label="Close dialog">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div class="p-6 space-y-4">
                <input type="hidden" id="reviewUnlockSectionId">
                <input type="hidden" id="reviewUnlockSubjectId">
                <input type="hidden" id="reviewUnlockQuarter">

                <div class="p-4 rounded-xl bg-[#F5F7FA] border border-[#D8DEE8] space-y-2 text-xs">
                    <div class="flex justify-between">
                        <span class="text-[#475569]">Teacher / Instructor:</span>
                        <strong id="reviewUnlockTeacherName" class="text-[#17243A]">Prof. Maria Santos</strong>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[#475569]">Class Section:</span>
                        <strong id="reviewUnlockSectionName" class="text-[#17243A]">BSIT 1-A</strong>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[#475569]">Subject:</span>
                        <strong id="reviewUnlockSubjectName" class="text-[#17243A]">SUBJ 101 — Core Subject</strong>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[#475569]">Grading Period:</span>
                        <strong id="reviewUnlockQuarterName" class="text-[#17243A]">Q1</strong>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-[#475569]">Requested Date:</span>
                        <span id="reviewUnlockDate" class="text-[#17243A] font-mono">2026-11-01</span>
                    </div>
                </div>

                <div>
                    <span class="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">Teacher's Explanation / Reason:</span>
                    <div id="reviewUnlockReasonText" class="p-3.5 rounded-xl border border-[#F0D296] bg-[#FFF0D1] text-xs sm:text-sm text-[#80530F] font-medium leading-relaxed">
                        Reason goes here
                    </div>
                </div>

                <div class="pt-4 border-t border-[#D8DEE8] flex flex-wrap items-center justify-between gap-2.5">
                    <button type="button" onclick="App.closeModal('unlockReviewModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F5F7FA] transition cursor-pointer">
                        Close
                    </button>
                    <div class="flex items-center gap-2">
                        <button type="button" id="unlockRejectBtn" onclick="App.submitUnlockDecision('reject')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#842D60] bg-[#F5DFEB] hover:bg-[#eed3e3] border border-[#E2B8CF] transition cursor-pointer">
                            Reject Request
                        </button>
                        <button type="button" id="unlockApproveBtn" onclick="App.submitUnlockDecision('approve')" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0c5f58] shadow-sm transition cursor-pointer">
                            ✓ Approve &amp; Unlock Grades
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ==================== MODAL 9: ASSIGN SUBJECTS & SECTIONS TO TEACHER ==================== -->
<div id="assignSubjectTeacherModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="astModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('assignSubjectTeacherModal')"></div>

        <div class="inline-block w-full max-w-4xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-[#D8DEE8]">
            <div class="px-6 py-4 bg-[#17243A] text-white flex items-center justify-between">
                <div>
                    <h3 id="astModalTitle" class="font-display font-bold text-lg text-white">Assign Sections &amp; Subjects to Teacher</h3>
                    <p class="text-xs sm:text-sm text-slate-300 mt-0.5">Assign multiple sections and subjects to an instructor in a single action</p>
                </div>
                <button type="button" onclick="App.closeModal('assignSubjectTeacherModal')" class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#243752] transition cursor-pointer" aria-label="Close dialog">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="assignSubjectTeacherForm" class="p-6 space-y-4">
                <!-- Select Teacher -->
                <div class="bg-[#F5F7FA] p-4 rounded-xl border border-[#D8DEE8]">
                    <div class="flex items-center justify-between mb-1.5">
                        <label for="astTeacherSelect" class="block text-sm font-semibold text-[#17243A]">
                            Teacher Account <span class="text-[#9B3F72]">*</span>
                        </label>
                        <button type="button" onclick="App.openTeacherModalFromAssign()" class="text-xs font-semibold text-[#5276A7] hover:text-[#17243A] cursor-pointer">
                            + New Teacher Account
                        </button>
                    </div>
                    <select id="astTeacherSelect" required onchange="App.onAstTeacherChange(this.value)" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] bg-white font-medium text-[#17243A] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                        <option value="">-- Select Teacher --</option>
                        <!-- Populated by JS -->
                    </select>
                    <p id="astTeacherInfoPill" class="text-xs text-[#475569] mt-1.5 font-medium"></p>
                </div>

                <!-- Dual Columns: Select Multiple Sections & Multiple Subjects -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Left Column: Multiple Sections -->
                    <div class="flex flex-col border border-[#D8DEE8] rounded-xl p-3.5 bg-white">
                        <div class="flex items-center justify-between gap-2 mb-2">
                            <label class="block text-xs font-bold uppercase tracking-wider text-[#17243A]">
                                1. Select Section(s) <span class="text-[#9B3F72]">*</span>
                            </label>
                            <span id="astSectionsCountBadge" class="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]">0 selected</span>
                        </div>

                        <!-- Toolbar: Search + Select All / Clear -->
                        <div class="flex items-center gap-2 mb-2.5">
                            <input type="text" id="astSectionSearchInput" oninput="App.renderAstSectionsList()" placeholder="Filter sections..." class="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#D8DEE8] focus:border-[#5276A7] outline-none">
                            <button type="button" onclick="App.astToggleAllSections(true)" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#F5F7FA] hover:bg-[#D8DEE8] text-[#17243A] border border-[#D8DEE8] transition cursor-pointer shrink-0">
                                All
                            </button>
                            <button type="button" onclick="App.astToggleAllSections(false)" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#F5F7FA] hover:bg-[#D8DEE8] text-[#475569] border border-[#D8DEE8] transition cursor-pointer shrink-0">
                                None
                            </button>
                        </div>

                        <!-- Scrollable Checkbox List -->
                        <div id="astSectionsListContainer" class="h-60 overflow-y-auto custom-scrollbar border border-[#D8DEE8] rounded-xl divide-y divide-[#D8DEE8] bg-white">
                            <!-- Populated by JS -->
                        </div>
                    </div>

                    <!-- Right Column: Multiple Subjects -->
                    <div class="flex flex-col border border-[#D8DEE8] rounded-xl p-3.5 bg-white">
                        <div class="flex items-center justify-between gap-2 mb-2">
                            <label class="block text-xs font-bold uppercase tracking-wider text-[#17243A]">
                                2. Select Subject(s) <span class="text-[#9B3F72]">*</span>
                            </label>
                            <span id="astSubjectsCountBadge" class="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]">0 selected</span>
                        </div>

                        <!-- Toolbar: Search + Select All / Clear -->
                        <div class="flex items-center gap-2 mb-2.5">
                            <input type="text" id="astSubjectSearchInput" oninput="App.renderAstSubjectsList()" placeholder="Filter subjects..." class="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#D8DEE8] focus:border-[#5276A7] outline-none">
                            <button type="button" onclick="App.astToggleAllSubjects(true)" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#F5F7FA] hover:bg-[#D8DEE8] text-[#17243A] border border-[#D8DEE8] transition cursor-pointer shrink-0">
                                All
                            </button>
                            <button type="button" onclick="App.astToggleAllSubjects(false)" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#F5F7FA] hover:bg-[#D8DEE8] text-[#475569] border border-[#D8DEE8] transition cursor-pointer shrink-0">
                                None
                            </button>
                        </div>

                        <!-- Scrollable Checkbox List -->
                        <div id="astSubjectsListContainer" class="h-60 overflow-y-auto custom-scrollbar border border-[#D8DEE8] rounded-xl divide-y divide-[#D8DEE8] bg-white">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                </div>

                <!-- Class Schedule (Optional) -->
                <div>
                    <label for="astScheduleInput" class="block text-sm font-semibold text-[#17243A] mb-1.5">
                        Class Schedule <span class="text-[#475569] font-normal">(Optional — applied to assigned loads)</span>
                    </label>
                    <input type="text" id="astScheduleInput" placeholder="e.g. MWF 8:00 AM – 10:00 AM" class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D8DEE8] focus:border-[#5276A7] focus:ring-2 focus:ring-[#5276A7]/20 outline-none">
                </div>

                <!-- Real-time Dynamic Summary Preview Alert -->
                <div id="astSummaryPreview" class="p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition flex items-center justify-between gap-3">
                    <!-- Populated by JS -->
                </div>

                <div class="pt-4 border-t border-[#D8DEE8] flex items-center justify-end gap-2.5">
                    <button type="button" onclick="App.closeModal('assignSubjectTeacherModal')" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F5F7FA] transition cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" id="astSubmitBtn" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#17243A] hover:bg-[#243752] shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        Assign Teaching Loads
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ==================== MODAL 10: STUDENT CURRICULUM SUBJECTS VIEWER ==================== -->
<div id="studentSubjectsModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="studentSubjectsModalTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <div class="fixed inset-0 bg-[#17243A]/60 backdrop-blur-xs transition-opacity" onclick="App.closeModal('studentSubjectsModal')"></div>

        <div class="inline-block w-full max-w-2xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl z-10 overflow-hidden border border-[#D8DEE8]">
            <div class="px-6 py-4 bg-[#17243A] text-white flex items-center justify-between">
                <div>
                    <h3 id="studentSubjectsModalTitle" class="font-display font-bold text-lg text-white">Student Curriculum &amp; Enrolled Subjects</h3>
                    <p id="studentSubjectsModalSubtitle" class="text-xs sm:text-sm text-slate-300 mt-0.5">Enrolled subject loads and assigned instructors</p>
                </div>
                <button type="button" onclick="App.closeModal('studentSubjectsModal')" class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#243752] transition cursor-pointer" aria-label="Close dialog">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div class="p-6 space-y-4">
                <div class="flex items-center justify-between bg-[#F5F7FA] p-3.5 rounded-xl border border-[#D8DEE8] text-xs">
                    <div>
                        <span class="text-[#475569]">Student: </span>
                        <strong id="ssmStudentName" class="text-[#17243A] font-bold"></strong>
                        <span class="text-[#475569] ml-1.5" id="ssmStudentNo"></span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span id="ssmSectionName" class="px-2.5 py-0.5 rounded-full font-bold bg-[#EBF1F8] text-[#2C4870] border border-[#C5D5EA]"></span>
                        <span id="ssmTotalUnits" class="px-2.5 py-0.5 rounded-full font-bold bg-[#D5F0EA] text-[#0F766E] border border-[#99D8CC]"></span>
                    </div>
                </div>

                <div class="max-h-72 overflow-y-auto custom-scrollbar border border-[#D8DEE8] rounded-xl overflow-hidden">
                    <table class="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead class="bg-[#F5F7FA] border-b border-[#D8DEE8] font-bold uppercase tracking-wider text-[#475569] text-[11px] sticky top-0">
                            <tr>
                                <th scope="col" class="py-2.5 px-3.5">Code</th>
                                <th scope="col" class="py-2.5 px-3.5">Subject Description</th>
                                <th scope="col" class="py-2.5 px-3.5 text-center">Units</th>
                                <th scope="col" class="py-2.5 px-3.5">Instructor</th>
                                <th scope="col" class="py-2.5 px-3.5">Schedule</th>
                            </tr>
                        </thead>
                        <tbody id="studentSubjectsModalBody" class="divide-y divide-[#D8DEE8]">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>

                <div class="pt-2 flex items-center justify-end">
                    <button type="button" onclick="App.closeModal('studentSubjectsModal')" class="px-4 py-2 rounded-xl text-sm font-semibold text-[#17243A] bg-[#F5F7FA] hover:bg-[#D8DEE8] border border-[#D8DEE8] transition cursor-pointer">
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ==================== MODAL 11: GRADE LOCK & UNLOCK ANIMATION OVERLAY ==================== -->
<div id="gradeLockAnimationModal" class="fixed inset-0 z-50 hidden overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="glamTitle">
    <div class="min-h-screen px-4 text-center flex items-center justify-center">
        <!-- Backdrop with blur -->
        <div class="fixed inset-0 bg-[#17243A]/80 backdrop-blur-sm transition-opacity"></div>

        <div class="inline-block w-full max-w-sm my-8 text-center align-middle transition-all transform bg-white shadow-2xl rounded-3xl z-10 overflow-hidden border border-[#D8DEE8] p-7 sm:p-8">
            <!-- Animated Lock Icon Canvas -->
            <div class="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
                <!-- Outer Pulse Ring -->
                <div id="glamRing" class="absolute inset-0 rounded-full border-4 border-[#0F766E]/20 animate-ping"></div>
                <div id="glamBadge" class="relative w-20 h-20 rounded-2xl bg-[#D5F0EA] border border-[#99D8CC] flex items-center justify-center shadow-lg transition-all duration-300">
                    <!-- Padlock SVG -->
                    <svg id="glamPadlockSvg" class="w-10 h-10 text-[#0F766E] transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <!-- Shackle -->
                        <path id="glamPadlockShackle" d="M7 11V7a5 5 0 0 1 10 0v4" class="transition-transform duration-500 origin-[7px_11px]"></path>
                        <!-- Body -->
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="currentColor" fill-opacity="0.12"></rect>
                        <!-- Keyhole -->
                        <circle cx="12" cy="16" r="1"></circle>
                        <path d="M12 17v2"></path>
                    </svg>
                </div>
            </div>

            <!-- Title & Status Description -->
            <h3 id="glamTitle" class="font-display font-extrabold text-xl text-[#17243A] tracking-tight">
                Securing &amp; Finalizing Grades
            </h3>
            <p id="glamSubtitle" class="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed">
                Encrypting section standings and applying institutional read-only lock...
            </p>

            <!-- Animated Progress Bar -->
            <div class="w-full bg-[#EBF1F8] h-1.5 rounded-full overflow-hidden mt-6 relative">
                <div id="glamProgressBar" class="h-full bg-gradient-to-r from-[#0F766E] via-[#5276A7] to-[#0F766E] rounded-full w-full animate-shimmer"></div>
            </div>

            <p id="glamHint" class="text-[11px] text-[#64748B] mt-4 font-mono">
                Academic Integrity Policy &bull; DepEd / CHED Verified
            </p>
        </div>
    </div>
</div>

<!-- Toast Notification Container with Generous Spacing -->
<div id="toastContainer" class="fixed bottom-6 right-6 z-50 flex flex-col gap-3.5 max-w-md w-full pointer-events-none no-print"></div>
