import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Packer } from 'docx';
import { writeFileSync } from 'fs';

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Times New Roman', size: 24 },
        paragraph: { spacing: { line: 480 } } // double-space = 480 twips
      }
    }
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
      }
    },
    children: [

      // ========== TITLE PAGE ==========
      new Paragraph({ children: [new TextRun({ text: '', break: 4 })] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Tech Titan HR Case Study: Strategies for Improving Employee Engagement, Productivity, and Retention', bold: true, font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ' ', font: 'Times New Roman', size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Jaylen Davis', font: 'Times New Roman', size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Southwestern College', font: 'Times New Roman', size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Human Resource Management', font: 'Times New Roman', size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'April 2026', font: 'Times New Roman', size: 24 })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // ========== MAIN PAPER ==========

      // Paper title (repeated on page 2)
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Tech Titan HR Case Study: Strategies for Improving Employee Engagement, Productivity, and Retention', bold: true, font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({ children: [new TextRun({ text: '', font: 'Times New Roman', size: 24 })] }),

      // INTRODUCTION
      new Paragraph({
        children: [new TextRun({ text: 'Introduction', bold: true, font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Tech Titan is a rapidly growing technology company experiencing significant human resource challenges that threaten its long-term success. Despite offering competitive salaries and a standard benefits package, the company faces rising employee turnover rates, particularly among its most experienced mid-level and senior staff. These departures have disrupted key projects, decreased overall productivity, and begun to damage the company\'s reputation in the marketplace. The root causes of these issues are embedded in several HR management areas, including organizational culture, talent management practices, performance appraisal systems, employee relations, and compensation structure.', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'This paper argues that Tech Titan can significantly improve employee retention and organizational performance by adopting a proactive HR strategy that addresses critical gaps in onboarding, performance management, compensation design, and organizational culture. By applying core principles of human resource management, Tech Titan\'s leadership can build a workforce that is engaged, motivated, and aligned with the company\'s strategic goals. Addressing these challenges requires a comprehensive and integrated approach that treats talent as a strategic asset rather than a replaceable resource.', font: 'Times New Roman', size: 24 })]
      }),

      // ANALYSIS
      new Paragraph({
        children: [new TextRun({ text: 'Analysis', bold: true, font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Tech Titan faces eight interconnected HR challenges that collectively contribute to its high turnover and declining employee morale.', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'First, the company operates with a reactive HR strategy rather than a proactive one. HR decisions are made in response to problems rather than in anticipation of them. Strategic HR planning involves aligning workforce strategies with broader organizational goals, ensuring that the company has the talent it needs both now and in the future. A reactive model leaves Tech Titan poorly equipped to handle talent shortages or shifting workforce demands, which compounds existing retention problems rather than preventing them (Sophia Learning, n.d.).', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Second, Tech Titan\'s organizational culture is highly competitive and focused on individual achievement. While this emphasis has contributed to measurable performance, it has also created a stressful and demanding work environment that undermines collaboration, psychological safety, and long-term employee well-being. Organizational culture plays a central role in shaping employee behavior, satisfaction, and retention. A culture that is perceived as high-pressure and unsupportive will drive away even the most skilled and committed employees over time, particularly as alternative employers increasingly emphasize work-life balance and team-oriented environments.', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Third, the company\'s onboarding process is deeply inadequate. New hires receive only a four-hour orientation meeting focused primarily on completing paperwork and reviewing the employee handbook. Effective onboarding should involve structured support across the employee\'s first 90 days, including role-specific technical training, mentoring relationships, and regular check-ins with managers. Without this foundation, new employees feel underprepared and disconnected from the organization, reducing their commitment and significantly increasing early turnover (Sophia Learning, n.d.).', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Fourth, performance appraisals at Tech Titan are conducted only once per year and rely heavily on subjective supervisor evaluations. There is no use of objective performance metrics or 360-degree feedback mechanisms that would allow employees to receive more comprehensive and developmentally meaningful assessments. Annual-only reviews mean employees spend long periods without recognition or constructive guidance, which weakens both motivation and trust in the fairness of the organization\'s evaluation processes (Sophia Learning, n.d.).', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Fifth, employees widely perceive the company\'s formal grievance procedure as unsafe to use. A cultural perception exists that raising workplace concerns increases the risk of retaliation, which discourages employees from communicating problems before they escalate. Healthy employee relations depend on psychological safety, accessible channels for feedback, and visible accountability. When employees do not believe they can safely raise concerns, small issues become significant ones before HR is ever involved.', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Sixth, the compensation structure is based solely on seniority and job level, with no performance-based pay or formal written compensation plan. This model fails to differentiate between high performers and average ones, removing a critical incentive for sustained excellence. Compensation strategies that tie pay to measurable performance are essential for attracting and retaining top talent, particularly in the competitive technology industry where employees have many employment options (Sophia Learning, n.d.).', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Seventh, the company\'s benefits package is traditional and inflexible. While it includes health insurance, retirement plans, and paid time off, employees have expressed a clear desire for more flexible options. Tech Titan has been slow to respond due to cost concerns. However, as workforce demographics shift and employee priorities evolve, rigid benefits packages increasingly become a driver of dissatisfaction and departure, especially among younger employees who may prioritize different benefits than the traditional package provides (Sophia Learning, n.d.).', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Eighth, the cumulative effect of all these issues is a high and growing turnover rate concentrated among mid-level and senior employees. These individuals represent significant institutional knowledge, leadership capacity, and project continuity. Their departure creates a cascading effect — disrupting ongoing projects, overburdening remaining employees, and damaging the company\'s ability to attract future talent who may learn of the internal culture through professional networks and employer review platforms.', font: 'Times New Roman', size: 24 })]
      }),

      // RECOMMENDATIONS
      new Paragraph({
        children: [new TextRun({ text: 'Recommendations', bold: true, font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'To address these challenges, Tech Titan\'s HR leadership should implement the following strategic recommendations, each of which directly targets an identified root cause.', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'The company should transition from a reactive to a proactive HR strategy by implementing regular workforce planning and succession planning processes. This means identifying critical roles, building internal talent pipelines, and anticipating future skill needs before vacancies arise. Aligning the HR function with the company\'s long-term business strategy ensures that talent development is treated as a priority rather than an afterthought (Sophia Learning, n.d.).', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Tech Titan should redesign its onboarding program into a structured 90-day experience that includes role-specific technical training, an assigned mentor from within the employee\'s department, regular check-ins at the 30-, 60-, and 90-day marks, and goal-setting conversations that establish clear expectations for the first quarter of employment. Employees who complete structured onboarding programs are significantly more productive in their first year and substantially more likely to remain with the organization beyond 12 months (Sophia Learning, n.d.).', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'The performance management system should be overhauled to include more frequent feedback cycles, objective performance metrics, and 360-degree evaluations that gather input from peers, direct reports, and managers. Transitioning from annual reviews to a continuous performance management model gives employees timely developmental feedback, creates a more equitable basis for compensation decisions, and reinforces that the company invests in the growth of its people (Sophia Learning, n.d.).', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Tech Titan should introduce a formal compensation structure that includes performance-based pay components such as merit increases, individual performance bonuses, and team-based incentives tied to project outcomes. A transparent compensation plan, clearly communicated to all employees, builds trust in the fairness of the organization and creates a direct connection between individual contribution and financial reward (Sophia Learning, n.d.).', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'To address inflexible benefits, Tech Titan should explore a flexible benefits model, often called a cafeteria plan, in which employees select from a menu of benefit options based on their individual needs and circumstances. This approach can be more cost-effective than a one-size-fits-all package while significantly improving employee satisfaction. Phasing in flexible benefits over a multi-year implementation plan can help manage the leadership team\'s cost concerns.', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Employee relations must be strengthened by creating multiple accessible channels for employees to raise concerns, including anonymous reporting mechanisms, and by visibly reinforcing a culture of non-retaliation. HR should conduct regular employee engagement surveys, share results transparently with the workforce, and communicate clear action plans in response to identified issues. When employees observe that their feedback leads to meaningful change, trust in the organization increases measurably.', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Finally, while maintaining a performance-oriented culture is appropriate for a technology company, Tech Titan should deliberately cultivate a more collaborative and supportive environment alongside its competitive one. This includes training managers on inclusive leadership practices, recognizing team accomplishments alongside individual achievements, and developing cross-functional project teams to build relationships and shared accountability across departments.', font: 'Times New Roman', size: 24 })]
      }),

      // CONCLUSION
      new Paragraph({
        children: [new TextRun({ text: 'Conclusion', bold: true, font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'Tech Titan\'s employee retention challenges are not the result of a single problem but rather a set of interconnected HR management failures that have compounded over time. The company\'s reactive HR strategy, inadequate onboarding, subjective annual-only performance evaluations, seniority-based compensation without incentives, rigid benefits, difficult employee relations environment, and high-pressure individual culture have collectively made it difficult for employees to feel valued, fairly assessed, and invested in the company\'s long-term future. By implementing proactive workforce planning, redesigning its onboarding and performance management systems, introducing performance-based compensation, offering flexible benefits, and fostering a more psychologically safe organizational culture, Tech Titan can significantly reduce turnover, improve engagement and productivity, and position itself as an employer of choice in the competitive technology sector.', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { firstLine: 720 },
        children: [new TextRun({ text: 'This paper has argued that applying established HR management principles — from strategic workforce planning to compensation reform to cultural development — can directly address the root causes of Tech Titan\'s talent challenges. These recommendations are practical, aligned with the company\'s strategic goals, and grounded in course concepts that have proven effective across a wide range of organizational contexts.', font: 'Times New Roman', size: 24 })]
      }),

      // PAGE BREAK BEFORE REFERENCES
      new Paragraph({ children: [new PageBreak()] }),

      // REFERENCES
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'References', bold: true, font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({ children: [new TextRun({ text: '', font: 'Times New Roman', size: 24 })] }),
      new Paragraph({
        indent: { hanging: 720 },
        children: [new TextRun({ text: 'Sophia Learning. (n.d.). Compensation plans. Human Resource Management. https://app.sophia.org/tutorials/compensation-plans', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { hanging: 720 },
        children: [new TextRun({ text: 'Sophia Learning. (n.d.). Performance management and appraisals. Human Resource Management. https://app.sophia.org/tutorials/performance-management-and-appraisals', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { hanging: 720 },
        children: [new TextRun({ text: 'Sophia Learning. (n.d.). Strategic human resource planning. Human Resource Management. https://app.sophia.org/tutorials/strategic-human-resource-planning', font: 'Times New Roman', size: 24 })]
      }),
      new Paragraph({
        indent: { hanging: 720 },
        children: [new TextRun({ text: 'Sophia Learning. (n.d.). Training, development, and onboarding. Human Resource Management. https://app.sophia.org/tutorials/training-development-and-onboarding', font: 'Times New Roman', size: 24 })]
      }),
    ]
  }]
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('./projects/school/sophia-learning/hrm/touchstone4_tech_titan.docx', buffer);
console.log('Done: touchstone4_tech_titan.docx created');
