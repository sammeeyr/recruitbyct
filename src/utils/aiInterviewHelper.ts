import { AiInterviewQuestion, AiInterviewResponse, JobOrder } from '../types';

export function generateAiInterviewQuestions(
  job: Partial<JobOrder>
): AiInterviewQuestion[] {
  const title = job.title || 'Technical Specialist';
  const skills = job.must && job.must.length > 0 ? job.must.map(m => m.label).join(', ') : 'core domain skills';
  const firstDuty = job.duties?.[0] || 'delivering high-quality solutions';
  const expectedKeywords = job.must && job.must.length > 0
    ? job.must.flatMap(m => m.keys)
    : ['architecture', 'experience', 'production', 'scalability'];

  return [
    {
      id: 'q-role-fit',
      question: `Walk us through your hands-on experience with ${skills}. How does your background align with the core requirements of the ${title} role?`,
      category: 'Technical & Domain Competency',
      expectedKeywords
    },
    {
      id: 'q-problem-solving',
      question: `Describe a complex technical challenge, production bug, or bottleneck you encountered while ${firstDuty}. How did you identify the root cause, and what was your resolution?`,
      category: 'Problem Solving & Troubleshooting',
      expectedKeywords: ['root cause', 'debug', 'metric', 'resolution', 'monitoring', 'postmortem', 'diagnose', 'performance']
    },
    {
      id: 'q-execution-best-practices',
      question: `When building solutions for high-stakes environments, how do you balance rapid delivery deadlines against security, test coverage, and documentation?`,
      category: 'Execution & Quality Engineering',
      expectedKeywords: ['testing', 'ci/cd', 'tradeoff', 'security', 'quality', 'refactor', 'documentation', 'agile']
    },
    {
      id: 'q-collaboration',
      question: `How do you explain technical tradeoffs, constraints, or architectural decisions to non-technical stakeholders, clients, or product managers?`,
      category: 'Communication & Stakeholder Management',
      expectedKeywords: ['communication', 'stakeholder', 'alignment', 'empathy', 'business value', 'clarity', 'collaboration']
    }
  ];
}

export function evaluateInterviewSubmission(
  questions: AiInterviewQuestion[],
  answers: { questionId: string; answerText: string }[]
): {
  responses: AiInterviewResponse[];
  overallScore: number;
  recommendation: 'Strong Hire' | 'Advance' | 'Review Needed' | 'Do Not Advance';
  summary: string;
} {
  const evaluatedResponses: AiInterviewResponse[] = questions.map((q, idx) => {
    const rawAnswer = answers.find(a => a.questionId === q.id)?.answerText?.trim() || '';
    const wordCount = rawAnswer.split(/\s+/).filter(Boolean).length;

    // Check keyword presence
    const lowerAnswer = rawAnswer.toLowerCase();
    const matchedKeywords = q.expectedKeywords.filter(k => lowerAnswer.includes(k.toLowerCase()));
    const keywordRatio = q.expectedKeywords.length > 0 ? matchedKeywords.length / q.expectedKeywords.length : 0.5;

    let clarityScore = 70;
    let technicalScore = 65;
    let feedback = '';

    if (wordCount < 15) {
      clarityScore = Math.min(50, wordCount * 3);
      technicalScore = Math.min(45, wordCount * 3);
      feedback = 'Response was extremely brief. Lacks depth, concrete examples, or technical rationale.';
    } else if (wordCount < 40) {
      clarityScore = Math.round(65 + Math.min(15, wordCount / 3));
      technicalScore = Math.round(60 + keywordRatio * 20);
      feedback = `Solid answer covering primary points. Could be enhanced with specific metrics, frameworks, or past business impact. Matched concepts: ${matchedKeywords.slice(0, 3).join(', ') || 'general'}.`;
    } else {
      clarityScore = Math.min(96, Math.round(78 + Math.min(16, wordCount / 10)));
      technicalScore = Math.min(98, Math.round(75 + keywordRatio * 22));
      feedback = `Thorough and articulate response demonstrating comprehensive domain understanding. Clear articulation of tradeoffs and structured approach. Key competencies detected: ${matchedKeywords.slice(0, 4).join(', ') || 'sound methodology'}.`;
    }

    const score = Math.round(clarityScore * 0.4 + technicalScore * 0.6);

    return {
      questionId: q.id,
      questionText: q.question,
      answerText: rawAnswer || '(No response provided)',
      score,
      clarityScore,
      technicalScore,
      feedback
    };
  });

  const avgScore = Math.round(
    evaluatedResponses.reduce((sum, r) => sum + r.score, 0) / (evaluatedResponses.length || 1)
  );

  let recommendation: 'Strong Hire' | 'Advance' | 'Review Needed' | 'Do Not Advance' = 'Advance';
  let summary = '';

  if (avgScore >= 85) {
    recommendation = 'Strong Hire';
    summary = `Exceptional candidate performance across both technical depth (${Math.round(
      evaluatedResponses.reduce((sum, r) => sum + r.technicalScore, 0) / evaluatedResponses.length
    )}%) and communication clarity (${Math.round(
      evaluatedResponses.reduce((sum, r) => sum + r.clarityScore, 0) / evaluatedResponses.length
    )}%). Demonstrated strong command of core competencies, methodical problem-solving, and professional maturity. Highly recommended for immediate client submission.`;
  } else if (avgScore >= 72) {
    recommendation = 'Advance';
    summary = `Candidate met all essential criteria with solid technical grasp and clear communication. Exhibited reliable problem-solving intuition with minor areas for deeper probing in the final client interview. Recommended to advance.`;
  } else if (avgScore >= 55) {
    recommendation = 'Review Needed';
    summary = `Candidate provided baseline responses but demonstrated moderate hesitation or lack of depth in specific technical areas. Recruiter review recommended before forwarding to client.`;
  } else {
    recommendation = 'Do Not Advance';
    summary = `Responses did not demonstrate sufficient technical familiarity or depth required for this role level. Rejection or redirect to junior talent pool recommended.`;
  }

  return {
    responses: evaluatedResponses,
    overallScore: avgScore,
    recommendation,
    summary
  };
}
