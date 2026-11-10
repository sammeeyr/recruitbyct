import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AiInterviewQuestion } from '../../types';
import { generateAiInterviewQuestions } from '../../utils/aiInterviewHelper';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  Mic,
  MicOff,
  Send,
  ArrowRight,
  ArrowLeft,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  Award,
  Volume2,
  VolumeX,
  Bot
} from 'lucide-react';

export const AiInterviewRoomView: React.FC = () => {
  const { applications, jobs, candidates, submitAiInterviewResponses, navigate, showToast } = useApp();

  // Parse token from URL if available
  const [token, setToken] = useState<string>('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token') || '';
    setToken(t);
  }, []);

  // Find matching application or fallback to first shortlisted candidate
  const app = applications.find(a => a.aiInterview?.token === token)
    || applications.find(a => a.stage === 'shortlisted' && a.aiInterview)
    || applications.find(a => a.stage === 'shortlisted')
    || applications[0];

  const candidate = app ? candidates.find(c => c.id === app.candId) : null;
  const job = app ? jobs.find(j => j.id === app.jobId) : null;

  const defaultQuestions = job ? generateAiInterviewQuestions(job) : generateAiInterviewQuestions({});
  const questions: AiInterviewQuestion[] = app?.aiInterview?.questions && app.aiInterview.questions.length > 0
    ? app.aiInterview.questions
    : defaultQuestions;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStage, setSubmittingStage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [completedResult, setCompletedResult] = useState<any>(
    app?.aiInterview?.status === 'completed' ? app.aiInterview : null
  );

  // Stop speaking when switching questions
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentIdx]);

  // Audio timer simulator
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const currentQ = questions[currentIdx] || questions[0];
  const currentAnswer = answers[currentQ.id] || '';
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;

  const handleTextChange = (val: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
  };

  // Toggle voice dictation
  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording / dictation
      setIsRecording(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript + ' ';
            }
            if (transcript.trim()) {
              setAnswers(prev => ({
                ...prev,
                [currentQ.id]: (prev[currentQ.id] ? prev[currentQ.id] + ' ' : '') + transcript.trim()
              }));
            }
          };

          recognition.onerror = () => {
            setIsRecording(false);
          };

          recognition.onend = () => {
            setIsRecording(false);
          };

          (window as any).__ctc_rec = recognition;
          recognition.start();
        } catch {
          // If browser speech fails, simulate recording
        }
      }
    } else {
      // Stop recording
      setIsRecording(false);
      if ((window as any).__ctc_rec) {
        try {
          (window as any).__ctc_rec.stop();
        } catch {}
      }
    }
  };

  // Toggle Text-to-Speech narration of question
  const toggleNarrateQuestion = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQ.question);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Quick fill sample answer for demonstration / testing
  const handleAutoFillSample = () => {
    const samples: Record<string, string> = {
      'q-role-fit':
        'Over the past 6 years, I have architected and deployed high-performance mobile and web applications handling over 250,000 monthly active users. In my previous role at a leading fintech, I spearheaded our TypeScript and React Native state management refactoring, which reduced app crash rates by 42% and decreased cold launch times to under 1.2 seconds. My background in building responsive component libraries and integrating secure API gateways directly aligns with the mission of this position.',
      'q-problem-solving':
        'During a major quarterly payment reconciliation peak, our background sync worker encountered a memory leak causing intermittent timeouts on AWS compute. I immediately deployed OpenTelemetry distributed tracing and memory heap profiling to isolate the root cause: uncollected event listeners in our database stream consumer. Within 90 minutes, I deployed a hotfix with bounded concurrency and automated circuit breakers, restoring 99.98% uptime without any dropped transactions.',
      'q-execution-best-practices':
        'I maintain that velocity and quality are complementary when backed by disciplined automated testing and CI/CD pipelines. My workflow involves writing comprehensive Jest integration tests and Playwright end-to-end regression suites for critical user journeys. Before deploying to production, all code undergoes peer reviews, static analysis with ESLint/SonarQube, and branch previews in staging environments.',
      'q-collaboration':
        'When discussing technical decisions with non-technical stakeholders, I avoid engineering jargon and translate architectural choices into tangible business outcomes—such as user retention, load latency, and infrastructure cost. I routinely prepare visual flowcharts, 1-page design briefs, and risk-matrix summaries to ensure product managers and executive sponsors have full clarity before engineering commitments are finalized.'
    };

    const sample = samples[currentQ.id] ||
      `I bring comprehensive experience in ${job?.title || 'this domain'}, emphasizing maintainable clean architecture, rigorous testing, and proactive communication across cross-functional teams to deliver measurable business impact.`;

    handleTextChange(sample);
  };

  // Submit interview
  const handleSubmit = async () => {
    // Check if at least one question has an answer
    const answeredCount = questions.filter(q => (answers[q.id] || '').trim().length > 0).length;
    if (answeredCount === 0) {
      showToast('Please provide an answer to at least one question before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmittingStage('Analyzing vocabulary, domain architecture, and structure...');

    setTimeout(() => {
      setSubmittingStage('Evaluating technical depth, problem-solving reasoning, and clarity...');
    }, 1200);

    setTimeout(async () => {
      setSubmittingStage('Synthesizing executive recommendation scorecard...');

      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        answerText: answers[q.id] || ''
      }));

      const activeToken = token || app?.aiInterview?.token || `int_${Date.now()}`;
      const result = await submitAiInterviewResponses(activeToken, formattedAnswers);

      setIsSubmitting(false);
      setCompletedResult(result.session || result.evaluation);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast('AI interview evaluation completed successfully!');
    }, 2400);
  };

  // Render Completed Scorecard View
  if (completedResult) {
    const overallScore = completedResult.overallScore || 85;
    const rec = completedResult.recommendation || 'Advance';
    const recColor =
      rec === 'Strong Hire' ? 'var(--neon-green, #10b981)' : rec === 'Advance' ? 'var(--yellow, #f59e0b)' : 'var(--red, #ef4444)';

    return (
      <main className="main" style={{ maxWidth: '920px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              marginBottom: '16px'
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>AI Interview Screening Complete</h1>
          <p className="muted" style={{ maxWidth: '580px', margin: '0 auto' }}>
            Thank you, <b>{candidate?.name || 'Applicant'}</b>. Your AI-evaluated interview responses have been synthesized
            and securely delivered to the Cube Tech Consults recruitment team for <b>{job?.title || 'the role'}</b>.
          </p>
        </div>

        {/* Scorecard Overview Card */}
        <div
          className="kcard"
          style={{
            backgroundColor: 'var(--charcoal)',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '24px',
            border: '1px solid var(--border)'
          }}
        >
          <div className="row spread" style={{ flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  border: `4px solid ${recColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--panel)'
                }}
              >
                <span style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1 }}>{overallScore}</span>
                <span className="xs muted">/ 100</span>
              </div>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    backgroundColor: `${recColor}20`,
                    color: recColor,
                    marginBottom: '6px'
                  }}
                >
                  {rec.toUpperCase()}
                </span>
                <h3 style={{ margin: 0 }}>Candidate AI Evaluation Score</h3>
                <p className="xs muted" style={{ margin: 0 }}>
                  Evaluated across role competencies, technical precision, and communication clarity
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn primary"
                onClick={() => navigate('careers')}
              >
                Back to Careers
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => navigate('dashboard')}
              >
                Go to Recruiter Dashboard
              </button>
            </div>
          </div>

          {completedResult.summary && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                borderLeft: `4px solid ${recColor}`,
                fontSize: '14px',
                lineHeight: 1.6
              }}
            >
              <b>AI Evaluation Synthesis:</b> {completedResult.summary}
            </div>
          )}
        </div>

        {/* Responses Breakdown */}
        {completedResult.responses && completedResult.responses.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>Question-by-Question Evaluation Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {completedResult.responses.map((resp: any, i: number) => (
                <div
                  key={resp.questionId || i}
                  className="kcard"
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--panel)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div className="row spread" style={{ marginBottom: '10px' }}>
                    <span className="chip" style={{ fontWeight: 600 }}>Question {i + 1}</span>
                    <span className="score ok">{resp.score}% Score</span>
                  </div>
                  <h4 style={{ marginBottom: '10px', fontSize: '15px' }}>{resp.questionText}</h4>

                  <div
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      marginBottom: '12px',
                      fontStyle: 'italic',
                      color: 'var(--text-subtle)'
                    }}
                  >
                    "{resp.answerText}"
                  </div>

                  <div className="row spread xs" style={{ marginBottom: '8px', color: 'var(--muted)' }}>
                    <span>Technical Depth: <b>{resp.technicalScore}%</b></span>
                    <span>Communication Clarity: <b>{resp.clarityScore}%</b></span>
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      lineHeight: 1.5,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 204, 0, 0.08)',
                      color: 'var(--yellow-text, #fef08a)'
                    }}
                  >
                    <b>AI Feedback:</b> {resp.feedback}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    );
  }

  // Active Interview Room View
  return (
    <main className="main" style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Submitting Loading Overlay */}
      {isSubmitting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            padding: '24px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '4px solid var(--border)',
              borderTopColor: 'var(--yellow)',
              animation: 'spin 1s linear infinite',
              marginBottom: '24px'
            }}
          />
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Evaluating AI Interview</h2>
          <p className="muted" style={{ maxWidth: '440px' }}>
            {submittingStage}
          </p>
        </div>
      )}

      {/* Header bar */}
      <div
        className="kcard"
        style={{
          padding: '16px 20px',
          borderRadius: '14px',
          backgroundColor: 'var(--charcoal)',
          border: '1px solid var(--border)',
          marginBottom: '20px'
        }}
      >
        <div className="row spread" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 204, 0, 0.15)',
                color: 'var(--yellow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                <b style={{ fontSize: '16px' }}>Cube Tech Consults AI Candidate Interview</b>
                <span className="badge green xs">Live Screening</span>
              </div>
              <div className="xs muted">
                Screening for: <b>{job?.title || 'Open Position'}</b> · Candidate: <b>{candidate?.name || 'Applicant'}</b>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="xs muted">
              Question <b>{currentIdx + 1}</b> of <b>{questions.length}</b>
            </span>
            <div
              style={{
                width: '100px',
                height: '8px',
                backgroundColor: 'var(--border)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${((currentIdx + 1) / questions.length) * 100}%`,
                  height: '100%',
                  backgroundColor: 'var(--yellow)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 24/7 Intelligent Agent Interviewer Identity Banner */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: '10px',
          backgroundColor: 'rgba(255, 204, 0, 0.08)',
          border: '1px solid rgba(255, 204, 0, 0.25)',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--yellow)',
              color: '#1A1400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Bot size={20} />
          </div>
          <div>
            <b style={{ color: 'var(--yellow-text, #fef08a)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Recruitbyct Intelligent AI Interviewer
              <span className="badge green xs" style={{ fontSize: '10px', padding: '2px 6px' }}>24/7 Available</span>
            </b>
            <p className="xs muted" style={{ margin: 0, marginTop: '2px' }}>
              Standardized automated screening based on role requirements. Complete questions using voice dictation or text.
            </p>
          </div>
        </div>

        <div className="xs muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} /> Self-paced · Approx. 10-15 mins
        </div>
      </div>

      {/* Main Question Card */}
      <div
        className="kcard"
        style={{
          padding: '28px',
          borderRadius: '16px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--border)',
          marginBottom: '20px'
        }}
      >
        {/* Category & Badge */}
        <div className="row spread" style={{ marginBottom: '14px' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text)'
            }}
          >
            {currentQ.category}
          </span>
          <span className="xs muted">Prompt #{currentIdx + 1}</span>
        </div>

        {/* Question Text */}
        <h2 style={{ fontSize: '20px', lineHeight: 1.4, marginBottom: '20px' }}>
          {currentQ.question}
        </h2>

        {/* Response Mode Selector, Voice Narration & Dictation Bar */}
        <div className="row spread" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn sm ${isSpeaking ? 'primary' : 'ghost'}`}
              onClick={toggleNarrateQuestion}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Listen to the AI Interviewer narrate this question aloud"
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={14} /> Stop Narration
                </>
              ) : (
                <>
                  <Volume2 size={14} /> Listen to AI Interviewer
                </>
              )}
            </button>

            <button
              type="button"
              className={`btn sm ${isRecording ? 'red' : 'ghost'}`}
              onClick={toggleRecording}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isRecording ? (
                <>
                  <MicOff size={14} /> Stop Voice Recording ({recordSeconds}s)
                </>
              ) : (
                <>
                  <Mic size={14} /> Dictate with Voice
                </>
              )}
            </button>

            <button
              type="button"
              className="btn sm ghost"
              onClick={handleAutoFillSample}
              title="Pre-fill with high quality sample response for demonstration"
            >
              <Sparkles size={13} style={{ color: 'var(--yellow)' }} /> Demo Answer
            </button>
          </div>

          <div className="xs muted" style={{ alignSelf: 'center' }}>
            {wordCount} words {wordCount >= 40 ? '· (Thorough depth)' : wordCount >= 15 ? '· (Moderate depth)' : '· (Aim for 40+ words)'}
          </div>
        </div>

        {/* Voice recording animation if active */}
        {isRecording && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'red',
                display: 'inline-block',
                animation: 'pulse 1s infinite'
              }}
            />
            <span className="xs" style={{ color: 'var(--red-text, #fca5a5)' }}>
              Listening... Speak clearly into your microphone. Words are transcribed in real time.
            </span>
          </div>
        )}

        {/* Answer Textarea */}
        <textarea
          value={currentAnswer}
          onChange={e => handleTextChange(e.target.value)}
          placeholder="Type or dictate your response here. Provide specific technical examples, architecture rationale, or problem-solving methodology..."
          style={{
            width: '100%',
            minHeight: '180px',
            padding: '14px',
            fontSize: '14px',
            lineHeight: 1.6,
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />

        {/* Stepper Navigation Actions */}
        <div className="row spread" style={{ marginTop: '24px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn ghost"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            style={{ opacity: currentIdx === 0 ? 0.4 : 1 }}
          >
            <ArrowLeft size={16} /> Previous
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {questions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIdx(i)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: i === currentIdx ? '2px solid var(--yellow)' : '1px solid var(--border)',
                  backgroundColor: (answers[questions[i]?.id] || '').trim().length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'var(--panel)',
                  color: i === currentIdx ? 'var(--yellow)' : 'var(--text)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentIdx < questions.length - 1 ? (
            <button
              type="button"
              className="btn primary"
              onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
            >
              Next Question <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn primary"
              onClick={handleSubmit}
              style={{
                backgroundColor: 'var(--yellow)',
                color: '#000',
                fontWeight: 700
              }}
            >
              Submit AI Interview <Send size={15} style={{ marginLeft: '4px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Information footer */}
      <div className="row spread xs muted" style={{ padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} /> AI Evaluation Engine powered by Cube Tech Consults & Neon Serverless
        </div>
        <div>All responses are encrypted and reviewed by the recruitment team.</div>
      </div>
    </main>
  );
};
