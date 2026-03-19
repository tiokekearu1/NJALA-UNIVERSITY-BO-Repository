export const ACADEMIC_STRUCTURE = {
  schools: [
    {
      id: 'school_public_health',
      name: 'School of Public Health',
      departments: [
        { id: 'dept_biostats', name: 'Biostatistics and Epidemiology' },
        { id: 'dept_behavioural', name: 'Behavioural Health Sciences' },
        { id: 'dept_environmental', name: 'Environmental Health and Sanitation' }
      ]
    },
    {
      id: 'school_nursing',
      name: 'School of Nursing',
      departments: [
        { id: 'dept_bsc_nursing', name: 'BSc Nursing' }
      ]
    },
    {
      id: 'school_community_health',
      name: 'School of Community Health Sciences',
      departments: [
        { id: 'dept_community_clinical', name: 'Community Health and Clinical Sciences' }
      ]
    },
    {
      id: 'school_education',
      name: 'School of Education',
      departments: [
        { id: 'dept_edu_admin', name: 'Educational Administration' },
        { id: 'dept_guidance', name: 'Guidance and Counselling' },
        { id: 'dept_curriculum', name: 'Curriculum Development' },
        { id: 'dept_adult_edu', name: 'Adult Education' },
        { id: 'dept_science_edu', name: 'Science Education' },
        { id: 'dept_community_dev', name: 'Community Development Studies' }
      ]
    },
    {
      id: 'school_social_sciences',
      name: 'School of Social Sciences and Law',
      departments: [
        { id: 'dept_accounting', name: 'Accounting and Finance' },
        { id: 'dept_banking', name: 'Banking and Finance' },
        { id: 'dept_business_admin', name: 'Business Administration' },
        { id: 'dept_economics', name: 'Economics' },
        { id: 'dept_sociology', name: 'Sociology' },
        { id: 'dept_social_work', name: 'Social Work' },
        { id: 'dept_peace_dev', name: 'Peace and Development Studies' },
        { id: 'dept_law', name: 'Bachelor of Laws (LLB)' }
      ]
    }
  ]
};

export const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);
