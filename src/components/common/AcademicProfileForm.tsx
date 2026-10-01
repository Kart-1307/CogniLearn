import React, { useState, useEffect, useId } from 'react';
import {
  GraduationCap,
  School,
  Building2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Layers,
  Hash,
} from 'lucide-react';
import { ACADEMIC_CATALOGS, getSchoolSubjects, getCollegeSubjects } from '../../config/academicCatalogs';
import { studentAcademicProfileSchema, teacherProfessionalProfileSchema } from '../../schemas/academic';
import { InstitutionTier } from '../../types';

interface AcademicProfileFormProps {
  mode: 'student' | 'teacher';
  initialTier?: InstitutionTier;
  initialData?: any;
  onChange: (profile: any, isValid: boolean) => void;
  disabled?: boolean;
}

export const AcademicProfileForm: React.FC<AcademicProfileFormProps> = ({
  mode,
  initialTier = 'school',
  initialData,
  onChange,
  disabled = false,
}) => {
  const [tier, setTier] = useState<InstitutionTier>(initialData?.tier || initialTier);

  // School Student State
  const [schoolName, setSchoolName] = useState(initialData?.institutionName || '');
  const [board, setBoard] = useState(initialData?.board || ACADEMIC_CATALOGS.school.boards[0]);
  const [standard, setStandard] = useState(initialData?.standard || 'Class 10');
  const [schoolStream, setSchoolStream] = useState(initialData?.schoolStream || ACADEMIC_CATALOGS.school.streams[0]);
  const [schoolSection, setSchoolSection] = useState(initialData?.section || 'A');
  const [schoolRollNo, setSchoolRollNo] = useState(initialData?.rollNo || '');

  // College Student State
  const [collegeName, setCollegeName] = useState(initialData?.institutionName || '');
  const [degree, setDegree] = useState(initialData?.degree || ACADEMIC_CATALOGS.college.degrees[0]);
  const [department, setDepartment] = useState(initialData?.department || ACADEMIC_CATALOGS.college.departments[0]);
  const [academicYear, setAcademicYear] = useState(initialData?.academicYear || '1st Year');
  const [semester, setSemester] = useState(initialData?.semester || 'Semester 1');
  const [collegeSection, setCollegeSection] = useState(initialData?.section || 'A');
  const [collegeRollNo, setCollegeRollNo] = useState(initialData?.rollNo || '');

  // Teacher State
  const [teacherRole, setTeacherRole] = useState(
    initialData?.role || (tier === 'school' ? ACADEMIC_CATALOGS.school.teacherRoles[0] : ACADEMIC_CATALOGS.college.teacherRoles[0])
  );
  const [staffIdNumber, setStaffIdNumber] = useState(initialData?.staffIdNumber || '');

  // Selected subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialData?.subjects || initialData?.primarySubjects || []
  );
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isSeniorSchool = standard === 'Class 11' || standard === 'Class 12';
  const customSubjectInputId = useId();

  // Update suggested subjects when tier, standard, stream, or dept changes
  useEffect(() => {
    if (selectedSubjects.length === 0) {
      if (tier === 'school') {
        const suggested = getSchoolSubjects(standard, isSeniorSchool ? schoolStream : undefined);
        setSelectedSubjects(suggested.slice(0, 5));
      } else {
        const suggested = getCollegeSubjects(department);
        setSelectedSubjects(suggested.slice(0, 5));
      }
    }
  }, [tier, standard, schoolStream, department]);

  // Handle live validation and emit changes upward
  useEffect(() => {
    let currentPayload: any = null;

    if (mode === 'student') {
      if (tier === 'school') {
        currentPayload = {
          tier: 'school',
          institutionName: schoolName,
          board,
          standard,
          schoolStream: isSeniorSchool ? schoolStream : undefined,
          section: schoolSection,
          rollNo: schoolRollNo,
          subjects: selectedSubjects,
        };
      } else {
        currentPayload = {
          tier: 'college',
          institutionName: collegeName,
          department,
          degree,
          academicYear,
          semester,
          section: collegeSection,
          rollNo: collegeRollNo,
          subjects: selectedSubjects,
        };
      }

      const result = studentAcademicProfileSchema.safeParse(currentPayload);
      if (result.success) {
        setValidationErrors({});
        onChange(currentPayload, true);
      } else {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          if (err.path && err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        onChange(currentPayload, false);
      }
    } else {
      // Teacher mode
      if (tier === 'school') {
        currentPayload = {
          tier: 'school',
          institutionName: schoolName,
          role: teacherRole,
          board,
          staffIdNumber: staffIdNumber || undefined,
          primarySubjects: selectedSubjects,
        };
      } else {
        currentPayload = {
          tier: 'college',
          institutionName: collegeName,
          role: teacherRole,
          department,
          staffIdNumber: staffIdNumber || undefined,
          primarySubjects: selectedSubjects,
        };
      }

      const result = teacherProfessionalProfileSchema.safeParse(currentPayload);
      if (result.success) {
        setValidationErrors({});
        onChange(currentPayload, true);
      } else {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          if (err.path && err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        onChange(currentPayload, false);
      }
    }
  }, [
    tier,
    mode,
    schoolName,
    board,
    standard,
    schoolStream,
    schoolSection,
    schoolRollNo,
    collegeName,
    degree,
    department,
    academicYear,
    semester,
    collegeSection,
    collegeRollNo,
    teacherRole,
    staffIdNumber,
    selectedSubjects,
    isSeniorSchool,
  ]);

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const addCustomSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSubjectInput.trim();
    if (trimmed && !selectedSubjects.includes(trimmed)) {
      setSelectedSubjects([...selectedSubjects, trimmed]);
      setCustomSubjectInput('');
    }
  };

  const suggestedCatalogSubjects =
    tier === 'school'
      ? getSchoolSubjects(standard, isSeniorSchool ? schoolStream : undefined)
      : getCollegeSubjects(department);

  return (
    <div className="space-y-6 text-left">
      {/* 1. Tier Switcher Tabs */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Select Academic Track
        </label>
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setTier('school');
              setTeacherRole(ACADEMIC_CATALOGS.school.teacherRoles[0]);
            }}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              tier === 'school'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <School className="w-4 h-4" />
            <span>K-12 School (Class 6–12)</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setTier('college');
              setTeacherRole(ACADEMIC_CATALOGS.college.teacherRoles[0]);
            }}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              tier === 'college'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>College / University</span>
          </button>
        </div>
      </div>

      {/* 2. Track Specific Fields */}
      {tier === 'school' ? (
        <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <School className="w-4 h-4" />
            <span>School Details</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">School / Institution Name</label>
            <input
              type="text"
              disabled={disabled}
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. Delhi Public School, R.K. Puram"
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            {validationErrors.institutionName && (
              <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {validationErrors.institutionName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Education Board</label>
              <select
                disabled={disabled}
                value={board}
                onChange={(e) => setBoard(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {ACADEMIC_CATALOGS.school.boards.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-white">
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Standard / Grade</label>
              <select
                disabled={disabled}
                value={standard}
                onChange={(e) => setStandard(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {ACADEMIC_CATALOGS.school.standards.map((std) => (
                  <option key={std} value={std} className="bg-slate-900 text-white">
                    {std}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isSeniorSchool && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Senior Academic Stream</label>
              <select
                disabled={disabled}
                value={schoolStream}
                onChange={(e) => setSchoolStream(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {ACADEMIC_CATALOGS.school.streams.map((str) => (
                  <option key={str} value={str} className="bg-slate-900 text-white">
                    {str}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'student' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Section</label>
                <select
                  disabled={disabled}
                  value={schoolSection}
                  onChange={(e) => setSchoolSection(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {ACADEMIC_CATALOGS.school.sections.map((sec) => (
                    <option key={sec} value={sec} className="bg-slate-900 text-white">
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Roll Number</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={schoolRollNo}
                  onChange={(e) => setSchoolRollNo(e.target.value)}
                  placeholder="e.g. 14"
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                {validationErrors.rollNo && (
                  <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {validationErrors.rollNo}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Teacher Designation</label>
                <select
                  disabled={disabled}
                  value={teacherRole}
                  onChange={(e) => setTeacherRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {ACADEMIC_CATALOGS.school.teacherRoles.map((r) => (
                    <option key={r} value={r} className="bg-slate-900 text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Staff ID Number (Optional)</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={staffIdNumber}
                  onChange={(e) => setStaffIdNumber(e.target.value)}
                  placeholder="e.g. DPS-1049"
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Higher Education / University Details</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">College / University Name</label>
            <input
              type="text"
              disabled={disabled}
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="e.g. Indian Institute of Information Technology"
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            {validationErrors.institutionName && (
              <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {validationErrors.institutionName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Degree Program</label>
              <select
                disabled={disabled}
                value={degree}
                onChange={(e) => setDegree(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                {ACADEMIC_CATALOGS.college.degrees.map((deg) => (
                  <option key={deg} value={deg} className="bg-slate-900 text-white">
                    {deg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Department / Major</label>
              <select
                disabled={disabled}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                {ACADEMIC_CATALOGS.college.departments.map((dept) => (
                  <option key={dept} value={dept} className="bg-slate-900 text-white">
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {mode === 'student' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Year of Study</label>
                  <select
                    disabled={disabled}
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {ACADEMIC_CATALOGS.college.years.map((y) => (
                      <option key={y} value={y} className="bg-slate-900 text-white">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Semester</label>
                  <select
                    disabled={disabled}
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {ACADEMIC_CATALOGS.college.semesters.map((s) => (
                      <option key={s} value={s} className="bg-slate-900 text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Section / Division</label>
                  <select
                    disabled={disabled}
                    value={collegeSection}
                    onChange={(e) => setCollegeSection(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {ACADEMIC_CATALOGS.college.sections.map((sec) => (
                      <option key={sec} value={sec} className="bg-slate-900 text-white">
                        Section {sec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">USN / University Roll No</label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={collegeRollNo}
                    onChange={(e) => setCollegeRollNo(e.target.value)}
                    placeholder="e.g. 22CS084"
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                  {validationErrors.rollNo && (
                    <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.rollNo}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Faculty Role</label>
                <select
                  disabled={disabled}
                  value={teacherRole}
                  onChange={(e) => setTeacherRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  {ACADEMIC_CATALOGS.college.teacherRoles.map((r) => (
                    <option key={r} value={r} className="bg-slate-900 text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Faculty / Staff ID (Optional)</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={staffIdNumber}
                  onChange={(e) => setStaffIdNumber(e.target.value)}
                  placeholder="e.g. FAC-2024-88"
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Subjects Multi-Select Section */}
      <div className="space-y-3 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>{mode === 'student' ? 'Enrolled Subjects' : 'Primary Teaching Subjects'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
              {selectedSubjects.length} selected
            </span>
          </label>

          <button
            type="button"
            onClick={() => setSelectedSubjects([...suggestedCatalogSubjects])}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Select All Suggested
          </button>
        </div>

        {/* Selected Subject Badges */}
        <div className="flex flex-wrap gap-2 min-h-10 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          {selectedSubjects.length === 0 ? (
            <p className="text-slate-500 text-xs italic self-center">No subjects selected yet. Pick from suggestions below.</p>
          ) : (
            selectedSubjects.map((sub) => (
              <span
                key={sub}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 text-xs font-medium animate-fadeIn"
              >
                {sub}
                <button
                  type="button"
                  onClick={() => toggleSubject(sub)}
                  className="text-indigo-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Catalog Suggestions Chips */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Suggested for this curriculum:</p>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {suggestedCatalogSubjects.map((sub) => {
              const isSelected = selectedSubjects.includes(sub);
              return (
                <button
                  type="button"
                  key={sub}
                  onClick={() => toggleSubject(sub)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1 ${
                    isSelected
                      ? 'bg-indigo-500 text-white font-semibold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3 h-3" />}
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Subject Input */}
        <div className="flex gap-2 pt-2 border-t border-slate-800/60">
          <label htmlFor={customSubjectInputId} className="sr-only">
            Add custom subject
          </label>
          <input
            id={customSubjectInputId}
            type="text"
            value={customSubjectInput}
            onChange={(e) => setCustomSubjectInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomSubject();
              }
            }}
            placeholder="Add other subject or elective..."
            className="flex-1 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => addCustomSubject()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {validationErrors.subjects && (
          <p className="text-rose-400 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {validationErrors.subjects}
          </p>
        )}
      </div>
    </div>
  );
};
