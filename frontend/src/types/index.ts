export type Role = 'SUPER_ADMIN' | 'SCHOOL_ADMIN';
export type InstitutionType = 'PUBLIC' | 'PRIVATE';
export type NewsCategory = 'ANNOUNCEMENT' | 'BANNER_SLIDE' | 'ACTIVITY';

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
  _count?: {
    personnels: number;
    schoolStats: number;
  };
}

export interface StatsOverview {
  academicYear: number;
  semester: number;
  reportingSchoolsCount: number;
  institutions: {
    total: number;
    public: number;
    private: number;
  };
  students: {
    vocCert: number;
    highVocCert: number;
    bachelor: number;
    total: number;
  };
  personnel: {
    teachers: number;
    staff: number;
    total: number;
  };
  graduatesEmployment: {
    employed: number;
    furtherStudy: number;
    unemployed: number;
    totalReported: number;
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
