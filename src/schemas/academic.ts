import { z } from 'zod';
import { ACADEMIC_CATALOGS } from '../config/academicCatalogs';

export const institutionTierSchema = z.enum(['school', 'college']);

export const schoolStudentSchema = z.object({
  tier: z.literal('school'),
  institutionName: z.string().min(2, 'School name must be at least 2 characters'),
  board: z.enum(ACADEMIC_CATALOGS.school.boards, {
    error: 'Please select a valid academic board',
  }),
  standard: z.enum(ACADEMIC_CATALOGS.school.standards, {
    error: 'Please select a valid standard (Class 6-12)',
  }),
  schoolStream: z.enum(ACADEMIC_CATALOGS.school.streams).optional(),
  section: z.string().min(1, 'Section is required').max(10),
  rollNo: z.string().trim().min(1, 'Roll number is required').max(20, 'Roll number too long'),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  classCode: z.string().trim().max(12).optional(),
});

export const collegeStudentSchema = z.object({
  tier: z.literal('college'),
  institutionName: z.string().min(2, 'College/University name must be at least 2 characters'),
  department: z.string().min(2, 'Department is required'),
  degree: z.enum(ACADEMIC_CATALOGS.college.degrees, {
    error: 'Please select a valid degree program',
  }),
  academicYear: z.enum(ACADEMIC_CATALOGS.college.years, {
    error: 'Please select an academic year',
  }),
  semester: z.enum(ACADEMIC_CATALOGS.college.semesters, {
    error: 'Please select a semester',
  }),
  section: z.string().min(1, 'Section/Division is required').max(10),
  rollNo: z.string().trim().min(1, 'University Roll No / USN is required').max(30, 'Roll number too long'),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  classCode: z.string().trim().max(12).optional(),
});

export const studentAcademicProfileSchema = z.discriminatedUnion('tier', [
  schoolStudentSchema,
  collegeStudentSchema,
]);

export const schoolTeacherSchema = z.object({
  tier: z.literal('school'),
  institutionName: z.string().min(2, 'School name must be at least 2 characters'),
  role: z.enum(ACADEMIC_CATALOGS.school.teacherRoles),
  board: z.enum(ACADEMIC_CATALOGS.school.boards).optional(),
  staffIdNumber: z.string().trim().max(30).optional(),
  primarySubjects: z.array(z.string()).min(1, 'Select at least one teaching subject'),
});

export const collegeTeacherSchema = z.object({
  tier: z.literal('college'),
  institutionName: z.string().min(2, 'College/University name must be at least 2 characters'),
  role: z.enum(ACADEMIC_CATALOGS.college.teacherRoles),
  department: z.string().min(2, 'Department is required'),
  staffIdNumber: z.string().trim().max(30).optional(),
  primarySubjects: z.array(z.string()).min(1, 'Select at least one teaching subject'),
});

export const teacherProfessionalProfileSchema = z.discriminatedUnion('tier', [
  schoolTeacherSchema,
  collegeTeacherSchema,
]);

export const cohortSchema = z.object({
  tier: institutionTierSchema,
  name: z.string().min(2, 'Class / Cohort name is required'),
  standard: z.string().optional(),
  department: z.string().optional(),
  schoolStream: z.string().optional(),
  academicYear: z.string().min(2, 'Academic year is required'),
  semester: z.string().optional(),
  section: z.string().min(1, 'Section is required'),
  subject: z.string().min(2, 'Primary subject is required'),
  room: z.string().optional(),
});

export const joinCohortSchema = z.object({
  code: z.string().trim().min(4, 'Class join code must be at least 4 characters').max(12),
  rollNo: z.string().trim().min(1, 'Roll number is required').max(30),
});

export type SchoolStudentInput = z.infer<typeof schoolStudentSchema>;
export type CollegeStudentInput = z.infer<typeof collegeStudentSchema>;
export type StudentProfileInput = z.infer<typeof studentAcademicProfileSchema>;
export type SchoolTeacherInput = z.infer<typeof schoolTeacherSchema>;
export type CollegeTeacherInput = z.infer<typeof collegeTeacherSchema>;
export type TeacherProfileInput = z.infer<typeof teacherProfessionalProfileSchema>;
export type CohortInput = z.infer<typeof cohortSchema>;
export type JoinCohortInput = z.infer<typeof joinCohortSchema>;
