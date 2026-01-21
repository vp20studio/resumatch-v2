/**
 * Test Resume Fixtures
 * 5 diverse resumes for comprehensive algorithm testing
 */

export interface TestResume {
  id: string;
  name: string;
  category: string;
  expectedSkillCount: number;
  expectedExperienceCount: number;
  text: string;
}

export const testResumes: TestResume[] = [
  {
    id: 'swe-mid',
    name: 'Software Engineer (3 years)',
    category: 'tech',
    expectedSkillCount: 8,
    expectedExperienceCount: 2,
    text: `ALEX CHEN
San Francisco, CA | alex.chen@email.com | (415) 555-0123 | linkedin.com/in/alexchen

SUMMARY
Full-stack software engineer with 3 years of experience building scalable web applications. Passionate about clean code, user experience, and solving complex problems.

EXPERIENCE

Software Engineer | TechStartup Inc | San Francisco, CA | Jan 2022 - Present
- Built and maintained React/TypeScript frontend serving 50,000+ daily active users
- Developed RESTful APIs using Node.js and Express, reducing response times by 40%
- Implemented CI/CD pipelines with GitHub Actions, cutting deployment time from 2 hours to 15 minutes
- Led migration from MongoDB to PostgreSQL, improving query performance by 60%
- Collaborated with product team to ship 12 new features, increasing user engagement by 25%
- Mentored 2 junior developers through code reviews and pair programming sessions

Junior Developer | WebAgency Co | Oakland, CA | Jun 2020 - Dec 2021
- Developed responsive websites for 15+ clients using HTML, CSS, and JavaScript
- Built custom WordPress themes and plugins for e-commerce sites
- Integrated third-party APIs including Stripe, Twilio, and Google Maps
- Reduced page load times by 50% through image optimization and lazy loading

EDUCATION
Bachelor of Science in Computer Science | UC Berkeley | 2020
GPA: 3.7/4.0 | Dean's List

SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Frontend: React, Next.js, Redux, Tailwind CSS, HTML5, CSS3
Backend: Node.js, Express, PostgreSQL, MongoDB, Redis
Tools: Git, Docker, AWS, GitHub Actions, Jira, Figma
`,
  },

  {
    id: 'marketing-senior',
    name: 'Marketing Manager (5 years)',
    category: 'marketing',
    expectedSkillCount: 10,
    expectedExperienceCount: 3,
    text: `SARAH JOHNSON
Boston, MA | sarah.johnson@email.com | (617) 555-0456 | linkedin.com/in/sarahjohnson

PROFESSIONAL SUMMARY
Results-driven B2B marketing leader with 5+ years of experience driving growth for SaaS companies. Expertise in demand generation, content marketing, and marketing automation. Track record of building high-performing teams and exceeding revenue targets.

EXPERIENCE

Senior Marketing Manager | CloudSoft Solutions | Boston, MA | Mar 2021 - Present
- Developed and executed integrated marketing campaigns generating $4.2M in pipeline annually
- Grew MQL volume by 180% while reducing cost per lead by 35% through ABM strategies
- Built and managed a team of 4 marketers, achieving 95% of OKRs for 6 consecutive quarters
- Launched product marketing initiatives for 3 new features, driving 40% increase in adoption
- Partnered with sales to create enablement materials that shortened sales cycle by 20%
- Managed $800K annual marketing budget with 15% under budget while exceeding targets

Marketing Manager | DataTech Inc | Cambridge, MA | Jan 2019 - Feb 2021
- Led demand generation strategy resulting in 150% increase in qualified leads
- Implemented HubSpot marketing automation, improving lead nurturing conversion by 45%
- Created content marketing program generating 50,000 monthly blog visitors
- Coordinated 12 successful webinars with average 300+ attendees
- Established SEO strategy that doubled organic traffic in 18 months

Marketing Coordinator | StartupHub | Boston, MA | Jun 2017 - Dec 2018
- Supported marketing campaigns for startup accelerator with 50+ portfolio companies
- Managed social media accounts, growing Twitter following from 5K to 25K
- Organized 20+ networking events with 100+ attendees each
- Created email newsletters with 35% average open rate

EDUCATION
MBA, Marketing | Boston University | 2019
Bachelor of Arts, Communications | Northeastern University | 2017

SKILLS
Marketing: Demand Generation, ABM, Content Marketing, SEO/SEM, Product Marketing
Tools: HubSpot, Salesforce, Marketo, Google Analytics, Semrush, Asana
Technical: SQL (basic), HTML/CSS, A/B Testing, Marketing Attribution
Leadership: Team Management, Budget Planning, Cross-functional Collaboration
`,
  },

  {
    id: 'new-grad',
    name: 'Recent Graduate (CS degree)',
    category: 'tech',
    expectedSkillCount: 6,
    expectedExperienceCount: 2,
    text: `JORDAN PATEL
Austin, TX | jordan.patel@email.com | (512) 555-0789 | github.com/jordanpatel

EDUCATION
Bachelor of Science in Computer Science | University of Texas at Austin | May 2024
GPA: 3.8/4.0 | Honors: Magna Cum Laude, Dean's List (all semesters)
Relevant Coursework: Data Structures, Algorithms, Database Systems, Machine Learning, Software Engineering

EXPERIENCE

Software Engineering Intern | BigTech Corp | Austin, TX | May 2023 - Aug 2023
- Developed internal dashboard using React and Python Flask, used by 200+ employees
- Implemented automated testing suite that increased code coverage from 45% to 80%
- Optimized database queries reducing page load times by 30%
- Participated in code reviews and agile ceremonies with senior engineers

Research Assistant | UT Austin CS Department | Austin, TX | Jan 2023 - May 2023
- Assisted professor with machine learning research on natural language processing
- Built data pipeline processing 100,000+ text documents using Python and pandas
- Co-authored research paper submitted to ACL conference

PROJECTS

TaskFlow - Full Stack Task Management App | github.com/jordanpatel/taskflow
- Built MERN stack application with real-time updates using Socket.io
- Implemented user authentication with JWT and OAuth2
- Deployed on AWS with automated CI/CD pipeline

ML Stock Predictor | github.com/jordanpatel/stock-ml
- Created LSTM neural network for stock price prediction using TensorFlow
- Achieved 15% improvement over baseline models on test data
- Built interactive visualization dashboard with Streamlit

SKILLS
Languages: Python, JavaScript, Java, C++, SQL
Frameworks: React, Node.js, Flask, TensorFlow, PyTorch
Tools: Git, Docker, AWS, Linux, PostgreSQL, MongoDB

ACTIVITIES
- President, UT Computer Science Club (2023-2024)
- Hackathon Winner, HackTX 2023 (1st place, Health track)
`,
  },

  {
    id: 'career-changer',
    name: 'Career Changer (Teacher to UX)',
    category: 'design',
    expectedSkillCount: 7,
    expectedExperienceCount: 3,
    text: `MARIA GONZALEZ
Seattle, WA | maria.gonzalez@email.com | (206) 555-0321 | portfolio.mariagonzalez.design

SUMMARY
Former educator transitioning to UX design with 8 years of experience understanding human behavior and creating engaging learning experiences. Completed Google UX Design Certificate and built portfolio through freelance projects. Passionate about accessibility and user-centered design.

EXPERIENCE

Freelance UX Designer | Self-Employed | Seattle, WA | Jan 2023 - Present
- Redesigned mobile app for local nonprofit, increasing donation conversions by 35%
- Conducted user research with 20+ participants, synthesizing insights into actionable recommendations
- Created wireframes and prototypes in Figma for 5 client projects
- Developed design system documentation improving team collaboration
- Led usability testing sessions and presented findings to stakeholders

High School English Teacher | Seattle Public Schools | Seattle, WA | Aug 2015 - Dec 2022
- Designed curriculum for 150+ students annually, improving standardized test scores by 20%
- Created engaging digital learning materials during pandemic remote learning
- Implemented feedback systems that increased student participation by 40%
- Led professional development workshops on educational technology for 30 teachers
- Received "Teacher of the Year" award in 2020

Curriculum Designer | EduTech Startup | Remote | Jan 2020 - Aug 2020 (Part-time)
- Designed user interface for educational platform used by 10,000+ students
- Conducted A/B tests on lesson formats, improving completion rates by 25%
- Collaborated with engineers to improve app accessibility compliance

EDUCATION
Google UX Design Professional Certificate | 2023
Master of Education | University of Washington | 2015
Bachelor of Arts, English | Washington State University | 2013

UX DESIGN SKILLS
Research: User Interviews, Surveys, Usability Testing, Competitive Analysis, Personas
Design: Wireframing, Prototyping, Visual Design, Design Systems, Accessibility (WCAG)
Tools: Figma, Adobe XD, Miro, InVision, Maze, UserTesting
Soft Skills: Stakeholder Presentations, Workshop Facilitation, Cross-functional Collaboration

PORTFOLIO PROJECTS
- Nonprofit Mobile App Redesign (case study available)
- Healthcare Patient Portal UX Improvement
- E-commerce Checkout Flow Optimization
`,
  },

  {
    id: 'exec-sales',
    name: 'VP of Sales (15 years)',
    category: 'executive',
    expectedSkillCount: 10,
    expectedExperienceCount: 4,
    text: `MICHAEL THOMPSON
New York, NY | michael.thompson@email.com | (212) 555-0654 | linkedin.com/in/michaelthompson

EXECUTIVE SUMMARY
Transformational sales leader with 15+ years driving revenue growth at enterprise SaaS companies. Proven track record of building and scaling sales organizations from $10M to $100M+ ARR. Expert in enterprise sales, strategic partnerships, and go-to-market strategy.

EXPERIENCE

Vice President of Sales | EnterpriseSoft Inc | New York, NY | Jan 2020 - Present
- Grew ARR from $45M to $120M in 3 years, exceeding targets by 30% annually
- Built and led global sales organization of 85 reps across 4 regions
- Established enterprise sales playbook reducing ramp time from 9 to 5 months
- Closed Fortune 500 deals including $15M multi-year contract with major bank
- Partnered with marketing to implement ABM strategy generating $50M in pipeline
- Reduced customer churn from 18% to 9% through account management restructuring
- Implemented Salesforce optimization improving forecast accuracy to 95%

Senior Director of Sales | CloudServices Co | Boston, MA | Mar 2016 - Dec 2019
- Scaled sales team from 15 to 45 reps while maintaining productivity targets
- Drove expansion revenue growth of 140% through strategic account management
- Launched channel partner program generating $8M in incremental revenue
- Negotiated strategic alliance with Microsoft, opening $30M market opportunity
- Designed sales compensation structure improving retention by 40%

Regional Sales Manager | TechSolutions Ltd | Chicago, IL | Jun 2012 - Feb 2016
- Managed 12-person sales team achieving 125% of annual quota for 3 consecutive years
- Developed new business in financial services vertical, winning 20+ enterprise accounts
- Created sales training program adopted company-wide, reducing ramp time by 35%
- Promoted from Account Executive to Regional Manager within 18 months

Account Executive | StartupTech | San Francisco, CA | Jan 2009 - May 2012
- Consistently ranked top 3 sales performer, achieving 150%+ of quota
- Built initial customer base in healthcare vertical generating $3M in new ARR
- Developed relationships with C-suite executives at target accounts

EDUCATION
MBA | Kellogg School of Management, Northwestern University | 2012
Bachelor of Science, Business Administration | Indiana University | 2008

SKILLS & EXPERTISE
Sales Leadership: Enterprise Sales, Strategic Accounts, Channel Partnerships, Sales Operations
Go-to-Market: Market Expansion, Sales Strategy, Revenue Operations, Forecasting
Tools: Salesforce, Gong, Outreach, Clari, LinkedIn Sales Navigator
Industries: SaaS, FinTech, Healthcare IT, Enterprise Software
`,
  },
];

/**
 * Get resume by ID
 */
export function getResumeById(id: string): TestResume | undefined {
  return testResumes.find((r) => r.id === id);
}

/**
 * Get resumes by category
 */
export function getResumesByCategory(category: string): TestResume[] {
  return testResumes.filter((r) => r.category === category);
}
