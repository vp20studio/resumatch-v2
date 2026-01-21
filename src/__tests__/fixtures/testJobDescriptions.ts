/**
 * Test Job Description Fixtures
 * 5 diverse JDs for comprehensive algorithm testing
 */

export interface TestJobDescription {
  id: string;
  title: string;
  company: string;
  category: string;
  matchingResumeIds: string[]; // Resume IDs that should score 50-95%
  mismatchResumeIds: string[]; // Resume IDs that should score 20-50%
  expectedRequirementCount: number;
  expectedKeywordCount: number;
  text: string;
}

export const testJobDescriptions: TestJobDescription[] = [
  {
    id: 'senior-react',
    title: 'Senior React Developer',
    company: 'FinTech Startup',
    category: 'tech',
    matchingResumeIds: ['swe-mid', 'new-grad'],
    mismatchResumeIds: ['marketing-senior', 'career-changer', 'exec-sales'],
    expectedRequirementCount: 8,
    expectedKeywordCount: 5,
    text: `Senior React Developer
FinTech Startup | San Francisco, CA | Full-time

About Us
We're a fast-growing fintech startup building the future of personal finance. Our platform helps millions of users manage their money smarter. We're backed by top-tier VCs and are scaling rapidly.

The Role
We're looking for a Senior React Developer to join our frontend team. You'll work on our consumer-facing web application, building features that help users take control of their financial lives.

Responsibilities
- Build and maintain React/TypeScript applications serving millions of users
- Design and implement reusable components and frontend architecture
- Collaborate with designers and product managers to deliver exceptional UX
- Write clean, tested, maintainable code following best practices
- Mentor junior developers and contribute to technical decisions
- Optimize application performance and web vitals
- Participate in code reviews and architectural discussions

Requirements
- 4+ years of professional software development experience
- 3+ years of experience with React and modern JavaScript/TypeScript
- Strong understanding of frontend architecture and state management (Redux, Context)
- Experience with REST APIs and data fetching patterns
- Proficiency in CSS, responsive design, and modern styling approaches
- Experience with testing frameworks (Jest, React Testing Library)
- Excellent communication and collaboration skills

Nice to Have
- Experience in fintech or financial services
- Knowledge of Node.js and backend development
- Experience with Next.js or similar frameworks
- Familiarity with CI/CD and DevOps practices
- Understanding of web security best practices

Benefits
- Competitive salary ($150K-$200K) + equity
- Remote-friendly (3 days in office)
- Health, dental, vision insurance
- 401k with company match
- Unlimited PTO
`,
  },

  {
    id: 'growth-marketing',
    title: 'Growth Marketing Lead',
    company: 'TechGrowth Inc',
    category: 'marketing',
    matchingResumeIds: ['marketing-senior'],
    mismatchResumeIds: ['swe-mid', 'new-grad', 'career-changer', 'exec-sales'],
    expectedRequirementCount: 7,
    expectedKeywordCount: 5,
    text: `Growth Marketing Lead
TechGrowth Inc | Boston, MA | Full-time

About TechGrowth
We're a Series B B2B SaaS company revolutionizing how businesses manage their operations. With $50M in funding and 200+ customers, we're ready to scale to the next level.

The Opportunity
We're seeking a Growth Marketing Lead to own our demand generation engine. You'll build and scale marketing programs that drive qualified pipeline and revenue growth.

What You'll Do
- Develop and execute multi-channel demand generation strategy
- Build and optimize ABM programs targeting enterprise accounts
- Manage marketing automation and lead nurturing workflows
- Own MQL targets and marketing-sourced pipeline metrics
- Partner with sales on lead handoff and account-based strategies
- Create compelling content including whitepapers, webinars, and case studies
- Manage paid acquisition channels (Google, LinkedIn, programmatic)
- Analyze campaign performance and optimize based on data

Requirements
- 5+ years of B2B marketing experience, preferably in SaaS
- Proven track record of driving measurable pipeline growth
- Experience with marketing automation platforms (HubSpot, Marketo)
- Strong understanding of ABM strategies and tools
- Proficiency in marketing analytics and attribution
- Experience managing marketing budgets of $500K+
- Excellent project management and cross-functional skills

Preferred Qualifications
- MBA or equivalent experience
- Experience in enterprise SaaS or technology
- Knowledge of Salesforce and marketing integrations
- Track record building and managing marketing teams

Compensation
- Base salary: $120K-$150K
- Performance bonus: up to 20%
- Equity package
- Full benefits
`,
  },

  {
    id: 'junior-swe-google',
    title: 'Junior Software Engineer',
    company: 'Google',
    category: 'tech',
    matchingResumeIds: ['new-grad', 'swe-mid'],
    mismatchResumeIds: ['marketing-senior', 'career-changer', 'exec-sales'],
    expectedRequirementCount: 6,
    expectedKeywordCount: 4,
    text: `Software Engineer, University Graduate
Google | Mountain View, CA | Full-time

About the Job
Google's software engineers develop the next-generation technologies that change how billions of users connect, explore, and interact with information and one another.

This is an entry-level position for recent graduates looking to build impactful products at scale.

Responsibilities
- Write and test code, developing documentation and processes
- Participate in software design and code reviews
- Debug and resolve production issues
- Collaborate with team members across different projects
- Learn and grow through mentorship and training programs

Minimum Qualifications
- Bachelor's degree in Computer Science or equivalent practical experience
- Experience with one or more programming languages (Python, Java, C++, JavaScript)
- Understanding of data structures and algorithms
- Strong problem-solving skills

Preferred Qualifications
- Experience with web development (React, Angular, or similar)
- Knowledge of database systems (SQL and NoSQL)
- Internship experience in software development
- Contributions to open source projects
- Experience with distributed systems or cloud platforms

About Google
Google is committed to creating a diverse and inclusive environment. We believe great ideas can come from anywhere and anyone.

Compensation
- Competitive base salary
- Annual bonus
- Equity refresh grants
- Comprehensive benefits
`,
  },

  {
    id: 'ux-designer-health',
    title: 'UX Designer',
    company: 'HealthTech Innovations',
    category: 'design',
    matchingResumeIds: ['career-changer'],
    mismatchResumeIds: ['swe-mid', 'marketing-senior', 'new-grad', 'exec-sales'],
    expectedRequirementCount: 6,
    expectedKeywordCount: 4,
    text: `UX Designer
HealthTech Innovations | Seattle, WA | Full-time

About Us
HealthTech Innovations is transforming healthcare through technology. Our patient engagement platform serves 500+ healthcare providers and millions of patients nationwide.

The Role
We're looking for a UX Designer to create intuitive, accessible experiences for patients and healthcare providers. You'll work on products that directly impact people's health and wellbeing.

Responsibilities
- Conduct user research including interviews, surveys, and usability testing
- Create user flows, wireframes, and high-fidelity prototypes
- Design accessible interfaces following WCAG guidelines
- Collaborate with product managers and engineers
- Present design solutions to stakeholders
- Contribute to and maintain design system
- Advocate for users throughout the design process

Requirements
- 2+ years of UX design experience (bootcamp or career change welcome)
- Strong portfolio demonstrating user-centered design process
- Proficiency in Figma or similar design tools
- Experience conducting user research and usability testing
- Understanding of accessibility standards and inclusive design
- Excellent communication and presentation skills
- Ability to work in collaborative, cross-functional environment

Nice to Have
- Experience in healthcare or regulated industries
- Knowledge of HTML/CSS
- Experience with design systems
- Background in education or training

Benefits
- Salary range: $90K-$120K
- Comprehensive health benefits
- Flexible work arrangements
- Professional development budget
- Mission-driven work environment
`,
  },

  {
    id: 'vp-sales-enterprise',
    title: 'VP of Sales',
    company: 'Enterprise SaaS Co',
    category: 'executive',
    matchingResumeIds: ['exec-sales'],
    mismatchResumeIds: ['swe-mid', 'marketing-senior', 'new-grad', 'career-changer'],
    expectedRequirementCount: 8,
    expectedKeywordCount: 5,
    text: `Vice President of Sales
Enterprise SaaS Co | New York, NY | Full-time

Company Overview
Enterprise SaaS Co is a market leader in enterprise software solutions. With $75M ARR and 300+ enterprise customers, we're positioned for continued growth and are seeking a world-class sales leader.

The Opportunity
As VP of Sales, you'll lead our global sales organization and drive the next phase of growth. Reporting to the CEO, you'll own revenue targets and build a high-performing team.

Responsibilities
- Own P&L for sales organization with $100M+ revenue target
- Build, lead, and develop team of 50+ sales professionals
- Design and execute go-to-market strategy for enterprise segment
- Establish sales processes, playbooks, and performance metrics
- Partner with marketing on pipeline generation and ABM initiatives
- Negotiate and close strategic enterprise deals ($1M+ ACV)
- Develop channel and partner ecosystem
- Present to board and executive team on sales performance

Requirements
- 12+ years of enterprise software sales experience
- 5+ years leading sales teams of 30+ people
- Track record scaling organizations from $50M to $150M+ ARR
- Experience selling to Fortune 500 and large enterprises
- Deep understanding of enterprise sales cycles and procurement
- Strong executive presence and communication skills
- MBA from top program preferred

Compensation
- Base salary: $300K-$400K
- OTE: $600K-$800K
- Significant equity package
- Executive benefits
`,
  },
];

/**
 * Get JD by ID
 */
export function getJDById(id: string): TestJobDescription | undefined {
  return testJobDescriptions.find((jd) => jd.id === id);
}

/**
 * Get JDs by category
 */
export function getJDsByCategory(category: string): TestJobDescription[] {
  return testJobDescriptions.filter((jd) => jd.category === category);
}

/**
 * Check if a resume-JD pair should be a good match
 */
export function isExpectedMatch(resumeId: string, jdId: string): boolean {
  const jd = getJDById(jdId);
  return jd?.matchingResumeIds.includes(resumeId) ?? false;
}

/**
 * Check if a resume-JD pair should be a mismatch
 */
export function isExpectedMismatch(resumeId: string, jdId: string): boolean {
  const jd = getJDById(jdId);
  return jd?.mismatchResumeIds.includes(resumeId) ?? false;
}
