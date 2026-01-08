export type ResumeProfile = {
  name: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: string;
  url?: string;
  portfolio?: string;
  github?: string;
};

export type ResumeWorkExperience = {
  company: string;
  jobTitle: string;
  date?: string;
  descriptions: string[];
};

export type ResumeEducation = {
  school: string;
  degree: string;
  date?: string;
  gpa?: string;
  descriptions?: string[];
};

export type ResumeProject = {
  project: string;
  date?: string;
  descriptions: string[];
  url?: string;
};

export type ResumeSkills = {
  featuredSkills: { skill: string; rating: number }[];
  descriptions: string[];
};

export type ResumeCustom = {
  descriptions: string[];
};

export type Resume = {
  profile: ResumeProfile;
  workExperiences: ResumeWorkExperience[];
  educations: ResumeEducation[];
  projects: ResumeProject[];
  skills: ResumeSkills;
  custom: ResumeCustom;
};
