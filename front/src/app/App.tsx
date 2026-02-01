import { useState } from 'react';
import { UserPage } from '@/app/components/user-page';
import { CreateQuiz } from '@/app/components/create-quiz';
import { WaitingLobby } from '@/app/components/waiting-lobby';
import { QuizPlay } from '@/app/components/quiz-play';
import { WinnersPage } from '@/app/components/winners-page';

type Page = 'home' | 'create' | 'waiting' | 'quiz' | 'winners';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [quizData, setQuizData] = useState<any>(null);

  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage(page as Page);
    if (data) {
      setQuizData(data);
    }
  };

  return (
    <div className="size-full">
      {currentPage === 'home' && (
        <UserPage onNavigate={handleNavigate} userName="Teacher" />
      )}
      {currentPage === 'create' && (
        <CreateQuiz onNavigate={handleNavigate} />
      )}
      {currentPage === 'waiting' && quizData && (
        <WaitingLobby onNavigate={handleNavigate} quizData={quizData} />
      )}
      {currentPage === 'quiz' && quizData && (
        <QuizPlay onNavigate={handleNavigate} quizData={quizData} />
      )}
      {currentPage === 'winners' && (
        <WinnersPage onNavigate={handleNavigate} />
      )}
    </div>
  );
}
