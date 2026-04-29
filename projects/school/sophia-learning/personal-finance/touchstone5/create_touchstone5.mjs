import { Document, Paragraph, TextRun, AlignmentType, Packer } from 'docx';
import { writeFileSync } from 'fs';

const font = 'Times New Roman';
const sz = 24;

const p = (text, opts = {}) => new Paragraph({
  alignment: AlignmentType.LEFT,
  spacing: { line: 276 },
  children: [new TextRun({ text, font, size: sz, bold: opts.bold ?? false })]
});

const blank = () => p('');

const heading = (text) => new Paragraph({
  spacing: { line: 276, before: 200 },
  children: [new TextRun({ text, font, size: sz, bold: true, underline: {} })]
});

const subheading = (text) => new Paragraph({
  spacing: { line: 276 },
  children: [new TextRun({ text, font, size: sz, bold: true })]
});

const item = (text) => new Paragraph({
  spacing: { line: 276 },
  indent: { left: 360 },
  children: [new TextRun({ text: `• ${text}`, font, size: sz })]
});

const doc = new Document({
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    children: [

      p('Name: Jaylen Davis'),
      p('Date: April 24, 2026'),
      blank(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 276 },
        children: [new TextRun({ text: 'Your Financial Plan', font, size: sz, bold: true })]
      }),
      blank(),

      // ========== SECTION 1 ==========
      heading('Section 1: Financial Snapshot — Where Are You Now?'),
      blank(),
      p('Monthly income after taxes (all sources): $1,500'),
      p('Total monthly fixed expenses: $870'),
      p('Total monthly variable expenses: $480'),
      p('Total assets: $9,100'),
      p('Total liabilities: $10,650'),
      blank(),
      subheading('Summary of financial health:'),
      p('My current net worth is approximately -$1,550, which reflects the reality that the majority of my liabilities consist of student loan debt accumulated while pursuing my degree. Although I am not yet in a positive net worth position, my monthly budget produces a modest surplus of $100, which provides an opportunity to gradually build savings and pay down debt. My most immediate financial priorities are establishing a three-month emergency fund, eliminating my credit card balance, and increasing my income through the growth of my small business, RanchPad.'),
      blank(),

      // ========== SECTION 2 ==========
      heading('Section 2: Personal Monthly Budget — Setting the Foundation'),
      blank(),
      p('Monthly income after taxes: $1,500'),
      blank(),
      subheading('Fixed expenses:'),
      item('Rent: $600'),
      item('Cell phone plan: $55'),
      item('Auto insurance: $80'),
      item('Student loan minimum payment: $135'),
      p('Total fixed expenses: $870'),
      blank(),
      subheading('Variable expenses:'),
      item('Groceries: $220'),
      item('Gasoline: $80'),
      item('Dining out: $90'),
      item('Entertainment and streaming subscriptions: $50'),
      item('Clothing and personal care: $40'),
      p('Total variable expenses: $480'),
      blank(),
      subheading('Savings and investment contributions:'),
      item('Emergency fund savings: $50'),
      p('Total savings contributions: $50'),
      blank(),
      p('Net income (income – total expenses): $1,500 – $870 – $480 – $50 = $100'),
      blank(),
      subheading('Reflection:'),
      p('Looking at my variable expenses, I notice that dining out at $90 per month is my single largest discretionary cost. While I keep entertainment expenses relatively low, reducing my dining out budget by half — from $90 to $45 — would free up $45 per month, which I could redirect to my emergency fund. Overall, my budget is fairly lean for my income level, and the most effective path to improving my financial position is growing my income through RanchPad rather than cutting expenses that are already minimal.'),
      blank(),

      // ========== SECTION 3 ==========
      heading('Section 3: Budget Analysis — Identification and Improvement'),
      blank(),
      subheading('Discretionary Spending:'),
      p('My highest discretionary expense is dining out at $90 per month. If I reduced this to $45 per month by preparing meals at home more consistently, I would save $45 monthly. I would reallocate those funds directly to my emergency fund savings contribution, increasing it from $50 to $95 per month and reaching my $1,500 emergency fund goal approximately four months sooner than my current trajectory.'),
      blank(),
      subheading('Liquidity Ratio:'),
      p('My total liquid assets are $1,100 (checking account: $650 plus savings account: $450). My total monthly expenses are $1,400 ($870 fixed plus $480 variable plus $50 savings). Liquidity ratio = $1,100 divided by $1,400 = 0.79. A liquidity ratio of 0.79 means I have less than one full month of expenses covered by liquid cash, which falls below the recommended minimum of one to two months. This number reveals that my financial stability is fragile — a single unexpected expense or income interruption could quickly put me in a difficult position — and underscores why building my emergency fund is my top immediate priority.'),
      blank(),
      subheading('50/20/30 Budget Breakdown:'),
      p('Analyzing my budget against the 50/20/30 model: my needs (rent, phone, insurance, student loan, groceries, and gas) total $1,035, which represents approximately 69% of my income — well above the recommended 50%. My savings and debt payments total $185, which is about 12% of income, compared to the recommended 20%. My wants (dining out, entertainment, clothing) total $180, or 12% of income, which is below the recommended 30%. The area that most needs adjustment is my needs category, which is high relative to income primarily because of housing costs. Rather than cutting essential expenses further, the most effective improvement I can make is increasing my income so that fixed costs represent a smaller percentage of my monthly earnings.'),
      blank(),
      subheading('Debt-to-Income Ratio:'),
      p('My monthly debt payments include my student loan minimum of $135 and an estimated credit card minimum of $25, totaling $160. My debt-to-income ratio = $160 divided by $1,500 = 10.7%. A DTI of approximately 11% is well within the range that lenders consider healthy, as most prefer DTI below 36%. However, my total outstanding liabilities of $10,650 relative to my current income level represent a meaningful long-term burden, particularly the student loan balance of $9,200. As my income grows, I plan to make additional payments above the minimum to pay down principal more quickly and reduce total interest paid over time.'),
      blank(),

      // ========== SECTION 4 ==========
      heading('Section 4: Saving and Investing — Setting Goals and Investment Planning'),
      blank(),
      subheading('Financial goals:'),
      p('Short-term: Save $1,500 in a dedicated emergency fund within 18 months.'),
      p('Long-term: Save $25,000 for a home down payment within 10 years.'),
      blank(),
      subheading('Time value of money calculation:'),
      p('Goal selected: Long-term (home down payment)'),
      p('Current savings toward this goal: $450 (savings account balance)'),
      p('Time frame: 10 years'),
      p('Growth multiplier (10 years at 7%): 1.97'),
      p('Estimated future value of current savings: $450 x 1.97 = $886.50'),
      blank(),
      subheading('Reflection — impact of future value on saving behavior:'),
      p('Seeing that my current $450 in savings could nearly double to approximately $887 over 10 years through a 7% annual return helped me understand why starting early is so much more powerful than saving a large amount later. Even small, consistent contributions made now can compound into meaningful wealth over time, and every month I delay starting is a month of compounding I lose permanently. This calculation motivates me to begin investing rather than keeping savings in a low-interest checking account.'),
      blank(),
      subheading('Reflection — adjustments to savings and investment strategy:'),
      p('After working through this calculation, I realize I should open a Roth IRA as soon as possible and begin contributing even modest amounts each month, because my contributions will have decades to grow tax-free. I also want to increase my savings rate as my income from RanchPad grows, directing a meaningful percentage of any revenue increase directly into investment accounts rather than allowing lifestyle inflation to absorb it.'),
      blank(),
      subheading('Risk tolerance and investment portfolio:'),
      p('Personal risk tolerance: Moderate'),
      p('Ideal investment portfolio allocation:'),
      item('Stocks (broad market index funds, e.g., S&P 500): 65%'),
      item('Bonds (U.S. Treasury and corporate bonds): 20%'),
      item('Real estate investment trusts (REITs): 10%'),
      item('Cash and cash equivalents: 5%'),
      blank(),
      p('I chose a moderate allocation because I have a long investment horizon of 40-plus years but also have short-term financial vulnerabilities — limited emergency savings and student loan debt — that make an exclusively aggressive portfolio inappropriate at this stage. Broad market index funds provide long-term equity growth, bonds provide stability during market downturns, and REITs allow real estate exposure without requiring a large upfront capital commitment.'),
      blank(),
      subheading('Investment accounts:'),
      p('I would use two primary account types. First, a Roth IRA: since I contribute after-tax dollars now and my income is relatively low, the Roth structure allows all future growth to be withdrawn tax-free in retirement, making it ideal for a young investor. Roth IRA contributions (not earnings) can also be withdrawn without penalty in a financial emergency, which provides additional flexibility. Second, a taxable brokerage account: once I maximize my annual Roth IRA contribution limit, I would open a taxable brokerage account to save toward my 10-year home down payment goal, where funds are accessible before retirement age without penalty.'),
      blank(),

      // ========== SECTION 5 ==========
      heading('Section 5: Retirement and Estate Planning — Planning for the Long Term'),
      blank(),
      subheading('Retirement calculations:'),
      p('Current annual income after taxes: $1,500 x 12 = $18,000'),
      blank(),
      p('80% Rule — Annual retirement income needed:'),
      p('$18,000 x 0.80 = $14,400 per year'),
      blank(),
      p('4% Rule — Total retirement savings goal:'),
      p('$14,400 / 0.04 = $360,000'),
      blank(),
      subheading('Reflection — monthly savings needed to reach retirement goal:'),
      p('To accumulate $360,000 by age 67, assuming I am currently 20 years old and have 47 years to save, and assuming a 7% average annual investment return, I would need to save approximately $55 to $75 per month starting now. Currently I am directing $50 per month to my emergency fund and nothing toward retirement. Once my emergency fund reaches its $1,500 target in roughly 14 months, I plan to redirect at least $75 per month into a Roth IRA to begin working toward this goal.'),
      blank(),
      subheading('Reflection — whether I am on track:'),
      p('Based on my current savings rate, I am not on track to meet my retirement goal by age 67. My income is still limited as a full-time student building a business, and my primary focus right now is financial stabilization rather than long-term wealth accumulation. However, the two most important adjustments I can make now are opening a Roth IRA and making even minimal contributions so that compound growth begins as early as possible, and growing my income through RanchPad so that I have significantly more cash flow available for investment within the next two to three years.'),
      blank(),
      subheading('Reflection — what surprised you about your retirement number:'),
      p('I expected my retirement number to be much higher than $360,000 — most conversations about retirement planning reference figures of one million dollars or more. The relatively modest target surprised me, though I recognize it is based on my current low income. If my income grows substantially over my career, which I anticipate given my entrepreneurial path, my target would increase proportionally. This exercise helped me understand that retirement planning must be a living calculation, updated as income grows, not a single number set once during your early twenties and forgotten.'),
      blank(),
      subheading('Key elements in my will:'),
      item('Vehicle (2014 Honda Civic): to be transferred to my younger sibling'),
      item('Financial accounts (checking, savings, and investment accounts): to be divided equally among immediate family members'),
      item('Business assets (RanchPad — software, domain, customer relationships, and intellectual property): to be transferred to a trusted business partner or sold at market value, with proceeds distributed to family'),
      item('Personal electronics and tech equipment: to be distributed to family members as they see fit'),
      blank(),
      subheading('Reflection — how legacy planning changes your view of money:'),
      p('Thinking about what I would leave behind forced me to recognize that I have already begun building something of real value — RanchPad represents labor, creativity, and financial investment, and ensuring it would be handled responsibly in my absence matters. This reflection also made me think about money not just as something to spend or save, but as a tool for creating options — for myself, and for the people I care about. Planning for my legacy now, even with limited assets, builds the habit of thinking long-term about financial decisions, which will serve me well as my wealth eventually grows.'),
      blank(),

      // ========== SECTION 6 ==========
      heading('Section 6: Financial Planning Scenario — What If?'),
      blank(),
      subheading('Scenario 1: Unexpected job loss'),
      p('If I unexpectedly lost my job, my liquid savings of $1,100 would cover approximately three-quarters of one month of total expenses at my current spending rate of $1,400 per month, which is very little runway. My immediate response would be to eliminate all non-essential variable spending — stopping dining out entirely, canceling entertainment subscriptions, and pausing any discretionary purchases — reducing my monthly costs to approximately $870 in unavoidable fixed expenses plus roughly $300 in essential groceries and gasoline. I would simultaneously lean more aggressively on RanchPad subscription revenue and pursue additional freelance digital work, including web design, app consulting, or content creation, to replace lost income as quickly as possible. I would also file for unemployment benefits through Kansas to provide a temporary income floor while searching for a new position. This scenario makes the fragility of my current savings position deeply clear, and it reinforces that building a genuine three-month emergency fund — approximately $4,200 — is the single most important financial step I can take in the near term.'),
      blank(),
      subheading('Scenario 2: Unexpected $5,000 bonus'),
      p('If I received an unexpected $5,000 bonus, I would allocate it across four priorities based on a clear hierarchy. First, I would immediately pay off my credit card balance of $280, eliminating my highest-interest debt entirely and freeing up the minimum payment for other uses. Second, I would deposit $2,500 into my savings account to bring my total emergency fund to approximately $2,950, covering roughly two months of basic expenses and significantly improving my financial resilience. Third, I would open a Roth IRA and contribute $1,500, establishing my retirement investing foundation and beginning the compound growth process as early as possible. The remaining $720 I would use as discretionary spending — either for a personal experience or to reinvest into RanchPad marketing, which directly supports my long-term income growth goal. This allocation reflects a deliberate prioritization of debt elimination, emergency preparedness, and long-term investing before discretionary spending, which aligns with the financial planning principles I have developed throughout this course.'),

    ]
  }]
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('./projects/school/sophia-learning/personal-finance/touchstone5/pf_touchstone5.docx', buffer);
console.log('Done: pf_touchstone5.docx created');
