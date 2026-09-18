export type Role = 'SUPER_ADMIN' | 'SCHOOL_ADMIN';
export type InstitutionType = 'PUBLIC' | 'PRIVATE';
export type NewsCategory = 'ANNOUNCEMENT' | 'BANNER_SLIDE' | 'ACTIVITY';

export interface Personnel {
  id: string;
  name: string;
  position: string;
  order: number;
  photoUrl?: string | null;
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  type: InstitutionType;
  logoUrl: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  province: string;
  personnels?: Personnel[];
  _count?: {
    personnels: number;
    schoolStats: number;
  };
}

export interface StatsOverview {
  academicYear: number;
  semester: number;
  selectedInstitutionId?: string;
  reportingSchoolsCount: number;
  institutions: {
    total: number;
    public: number;
    private: number;
  };
  executivesCount: number;
  students: {
    male: number;
    female: number;
    vocCert: number;
    highVocCert: number;
    bachelor: number;
    total: number;
    byGrade: {
      vocCert1: number;
      vocCert2: number;
      vocCert3: number;
      highVocCert1: number;
      highVocCert2: number;
      bachelor: number;
    };
  };
  bySectorGrades: {
    public: {
      vocCert1: number;
      vocCert2: number;
      vocCert3: number;
      highVocCert1: number;
      highVocCert2: number;
      bachelor: number;
    };
    private: {
      vocCert1: number;
      vocCert2: number;
      vocCert3: number;
      highVocCert1: number;
      highVocCert2: number;
      bachelor: number;
    };
  };
  personnel: {
    teachers: number;
    staff: number;
    total: number;
  };
  graduatesEmployment: {
    gradVocCert: number;
    gradHighVocCert: number;
    totalGraduates: number;
    employed: number;
    furtherStudy: number;
    unemployed: number;
    byJobType: {
      inField: number;
      outField: number;
      freelance: number;
      unemployed: number;
    };
    byWorkplace: {
      government: number;
      private: number;
      selfEmployed: number;
    };
  };
}

export interface InstitutionStatItem {
  id: string;
  academicYear: number;
  semester: number;
  maleStudents: number;
  femaleStudents: number;
  totalStudents: number;
  totalTeachers: number;
  employedGraduatesCount: number;
  unemployedCount: number;
  institution: {
    id: string;
    code: string;
    name: string;
    type: InstitutionType;
    logoUrl: string | null;
  };
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  category: NewsCategory;
  viewCount: number;
  createdAt: string;
  author?: {
    fullName: string;
  };
}

export interface SiteSettings {
  is_data_submission_open?: boolean;
  system_title?: string;
  current_academic_year?: number;
  current_semester?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  institution?: {
    id: string;
    code: string;
    name: string;
    type: InstitutionType;
    logoUrl: string | null;
  } | null;
}

export interface ContactFormInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}
