/**
 * CogniLearn Central Academic Catalogs
 * Single source of truth for curricula, boards, standards, departments, and subjects.
 * Designed for Secondary/Higher Secondary Schools (Classes 6-12) and Higher Education Colleges.
 */

export const ACADEMIC_CATALOGS = {
  school: {
    standards: [
      'Class 6',
      'Class 7',
      'Class 8',
      'Class 9',
      'Class 10',
      'Class 11',
      'Class 12',
    ] as const,
    sections: ['A', 'B', 'C', 'D', 'E'] as const,
    boards: ['CBSE', 'ICSE', 'State Board', 'Cambridge / IB'] as const,
    streams: ['General', 'Science', 'Commerce', 'Arts'] as const,
    subjects: {
      middle: [
        'Mathematics',
        'General Science',
        'Social Science',
        'English Literature',
        'Hindi / Regional Language',
        'Computer Basics',
      ],
      secondary: [
        'Mathematics',
        'Science (Physics/Chem/Bio)',
        'Social Science',
        'English Language & Literature',
        'Computer Applications / IT',
        'Hindi / Second Language',
      ],
      higherSecScience: [
        'Physics',
        'Chemistry',
        'Mathematics',
        'Biology',
        'Computer Science',
        'Informatics Practices',
        'English Core',
      ],
      higherSecCommerce: [
        'Accountancy',
        'Business Studies',
        'Economics',
        'Applied Mathematics',
        'English Core',
        'Entrepreneurship',
      ],
      higherSecArts: [
        'History',
        'Political Science',
        'Psychology',
        'Sociology',
        'Geography',
        'Economics',
        'English Core',
      ],
    },
    teacherRoles: [
      'Class Teacher',
      'Subject Teacher',
      'Academic Coordinator',
    ] as const,
  },
  college: {
    degrees: [
      'B.Tech',
      'B.E',
      'BCA',
      'B.Sc',
      'B.Com',
      'BBA',
      'M.Tech',
      'MCA',
      'MBA',
    ] as const,
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year'] as const,
    semesters: [
      'Sem 1',
      'Sem 2',
      'Sem 3',
      'Sem 4',
      'Sem 5',
      'Sem 6',
      'Sem 7',
      'Sem 8',
    ] as const,
    sections: ['A', 'B', 'C', 'D'] as const,
    departments: [
      {
        id: 'cse',
        name: 'Computer Science & Engineering',
        code: 'CSE',
        subjects: [
          'Data Structures & Algorithms',
          'Operating Systems',
          'Database Management Systems',
          'Computer Networks',
          'Object Oriented Programming',
          'Software Engineering',
          'Theory of Computation',
        ],
      },
      {
        id: 'aids',
        name: 'Artificial Intelligence & Data Science',
        code: 'AI-DS',
        subjects: [
          'Machine Learning',
          'Deep Learning',
          'Data Analytics & Mining',
          'Natural Language Processing',
          'Computer Vision',
          'Python for Data Science',
        ],
      },
      {
        id: 'ece',
        name: 'Electronics & Communication',
        code: 'ECE',
        subjects: [
          'Digital Signal Processing',
          'Microprocessors & Microcontrollers',
          'Analog & Digital Circuits',
          'VLSI Design',
          'Signals & Systems',
          'Electromagnetic Waves',
        ],
      },
      {
        id: 'eee',
        name: 'Electrical & Electronics',
        code: 'EEE',
        subjects: [
          'Power Systems',
          'Electrical Machines',
          'Control Systems',
          'Power Electronics',
          'Network Analysis',
        ],
      },
      {
        id: 'mech',
        name: 'Mechanical Engineering',
        code: 'MECH',
        subjects: [
          'Thermodynamics',
          'Fluid Mechanics',
          'Strength of Materials',
          'Kinematics of Machinery',
          'Heat and Mass Transfer',
          'CAD/CAM Systems',
        ],
      },
      {
        id: 'civil',
        name: 'Civil Engineering',
        code: 'CIVIL',
        subjects: [
          'Structural Analysis',
          'Geotechnical Engineering',
          'Hydraulics & Water Resources',
          'Surveying',
          'Concrete Technology',
        ],
      },
      {
        id: 'it',
        name: 'Information Technology',
        code: 'IT',
        subjects: [
          'Web Technologies',
          'Cloud Computing',
          'Cyber Security',
          'Distributed Systems',
          'Full Stack Development',
        ],
      },
      {
        id: 'bba',
        name: 'Business Administration (BBA)',
        code: 'BBA',
        subjects: [
          'Marketing Management',
          'Financial Accounting',
          'Organizational Behavior',
          'Business Economics',
          'Human Resource Management',
        ],
      },
      {
        id: 'bcom',
        name: 'Commerce & Accounting (B.Com)',
        code: 'BCOM',
        subjects: [
          'Corporate Accounting',
          'Income Tax Law',
          'Cost Accounting',
          'Auditing & Assurance',
          'Banking & Insurance',
        ],
      },
    ],
    teacherRoles: [
      'Professor',
      'Associate Professor',
      'Assistant Professor',
      'Head of Department (HOD)',
      'Lab Instructor',
    ] as const,
  },
} as const;

export type SchoolStandard = (typeof ACADEMIC_CATALOGS.school.standards)[number];
export type SchoolBoard = (typeof ACADEMIC_CATALOGS.school.boards)[number];
export type SchoolStream = (typeof ACADEMIC_CATALOGS.school.streams)[number];
export type CollegeDegree = (typeof ACADEMIC_CATALOGS.college.degrees)[number];
export type CollegeYear = (typeof ACADEMIC_CATALOGS.college.years)[number];
export type CollegeSemester = (typeof ACADEMIC_CATALOGS.college.semesters)[number];
export type SchoolTeacherRole = (typeof ACADEMIC_CATALOGS.school.teacherRoles)[number];
export type CollegeTeacherRole = (typeof ACADEMIC_CATALOGS.college.teacherRoles)[number];

/**
 * Returns appropriate subject suggestions based on academic selection
 */
export function getSuggestedSubjects(tier: 'school' | 'college', context: {
  standard?: string;
  stream?: string;
  departmentId?: string;
}): string[] {
  if (tier === 'school') {
    const std = context.standard || 'Class 10';
    if (std === 'Class 11' || std === 'Class 12') {
      if (context.stream === 'Commerce') return [...ACADEMIC_CATALOGS.school.subjects.higherSecCommerce];
      if (context.stream === 'Arts') return [...ACADEMIC_CATALOGS.school.subjects.higherSecArts];
      return [...ACADEMIC_CATALOGS.school.subjects.higherSecScience];
    }
    if (std === 'Class 9' || std === 'Class 10') {
      return [...ACADEMIC_CATALOGS.school.subjects.secondary];
    }
    return [...ACADEMIC_CATALOGS.school.subjects.middle];
  } else {
    const dept = ACADEMIC_CATALOGS.college.departments.find(
      (d) => d.id === context.departmentId || d.name === context.departmentId || d.code === context.departmentId
    );
    return dept ? [...dept.subjects] : [...ACADEMIC_CATALOGS.college.departments[0].subjects];
  }
}

export function getSchoolSubjects(standard?: string, stream?: string): string[] {
  return getSuggestedSubjects('school', { standard, stream });
}

export function getCollegeSubjects(department?: string): string[] {
  return getSuggestedSubjects('college', { departmentId: department });
}

export function getSubjectsForTier(tier: 'school' | 'college', context: {
  standard?: string;
  stream?: string;
  departmentId?: string;
}): string[] {
  return getSuggestedSubjects(tier, context);
}

export const SCHOOL_STANDARDS_AND_SUBJECTS = {
  'Class 6': ACADEMIC_CATALOGS.school.subjects.middle,
  'Class 7': ACADEMIC_CATALOGS.school.subjects.middle,
  'Class 8': ACADEMIC_CATALOGS.school.subjects.middle,
  'Class 9': ACADEMIC_CATALOGS.school.subjects.secondary,
  'Class 10': ACADEMIC_CATALOGS.school.subjects.secondary,
  'Class 11': ACADEMIC_CATALOGS.school.subjects.higherSecScience,
  'Class 12': ACADEMIC_CATALOGS.school.subjects.higherSecScience,
};

export const COLLEGE_DEPARTMENTS = ACADEMIC_CATALOGS.college.departments.map(d => d.name);
export const SCHOOL_BOARDS = ACADEMIC_CATALOGS.school.boards;
export const SCHOOL_STANDARDS = ACADEMIC_CATALOGS.school.standards;

