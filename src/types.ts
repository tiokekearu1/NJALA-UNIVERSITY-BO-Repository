import { Timestamp } from 'firebase/firestore';

export type UserRole = 'super_admin' | 'school_admin' | 'lecturer' | 'student' | 'public';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  schoolId?: string;
  departmentId?: string;
  programmeId?: string;
  photoURL?: string;
}

export interface School {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  schoolId: string;
}

export interface Programme {
  id: string;
  name: string;
  departmentId: string;
}

export type DissertationStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';

export interface Dissertation {
  id: string;
  title: string;
  studentName: string;
  registrationNumber: string;
  programmeId: string;
  departmentId: string;
  schoolId: string;
  supervisorName: string;
  year: number;
  abstract: string;
  keywords: string[];
  fileUrl: string;
  status: DissertationStatus;
  uploadedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  summary?: string;
  comments?: string;
  downloadCount?: number;
  isDraft?: boolean;
}

export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

export type HomeSectionType = 'hero' | 'stats' | 'features' | 'cta' | 'content';

export interface HomeSectionItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  value?: string;
  color?: string;
}

export interface BackgroundConfig {
  type: 'solid' | 'gradient';
  color?: string;
  gradient?: {
    from: string;
    to: string;
    direction: string;
  };
}

export interface HomeSection {
  id: string;
  type: HomeSectionType;
  title?: string;
  subtitle?: string;
  content?: string;
  backgroundConfig?: BackgroundConfig;
  textColor?: string;
  buttonText?: string;
  buttonAction?: string;
  items?: HomeSectionItem[];
  order: number;
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
}

export interface AppSettings {
  appName: string;
  primaryColor: string;
  logoUrl?: string;
  allowPublicUploads: boolean;
  maintenanceMode: boolean;
  footerText: string;
  footerBackgroundConfig?: BackgroundConfig;
  footerTextColor?: string;
  publicAccessOnly: boolean;
  footerLinks: FooterLink[];
  homeSections?: HomeSection[];
  customPages?: CustomPage[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  resourceId: string;
  resourceType: 'dissertation' | 'user' | 'settings' | 'academic_structure';
  details: any;
  timestamp: Timestamp;
}
