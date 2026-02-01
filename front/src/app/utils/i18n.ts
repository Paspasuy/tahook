const translations = {
  // Common
  "Welcome back": "С возвращением",
  "Welcome to Tahook!": "Добро пожаловать в Tahook!",
  "Ready to create or play some quizzes?": "Готовы создавать или играть в квизы?",
  "Login or register to get started.": "Войдите или зарегистрируйтесь, чтобы начать.",
  "Username": "Имя пользователя",
  "Password": "Пароль",
  "Login": "Войти",
  "Register": "Регистрация",
  "Logout": "Выйти",
  "Enter Game PIN": "Введите PIN игры",
  "Join Game": "Присоединиться",
  "Create Quiz": "Создать квиз",
  "Loading...": "Загрузка...",
  "No hosted quizzes yet.": "У вас пока нет созданных квизов.",
  "No results yet.": "Результатов пока нет.",
  "Draft": "Черновик",
  "Published": "Опубликован",
  "questions": "вопросов",
  "players": "игроков",
  "pts": "очков",
  "Total Wins": "Всего побед",
  "Quizzes Played": "Сыграно квизов",
  "Quizzes Hosted": "Создано квизов",
  "Your Hosted Quizzes": "Ваши квизы",
  "Recently Played": "Недавно играли",

  // Create Quiz
  "Enter quiz title...": "Введите название квиза...",
  "Launch Quiz": "Запустить квиз",
  "Creating...": "Создание...",
  "Type your question here...": "Введите текст вопроса...",
  "Time Limit (seconds)": "Ограничение по времени (сек)",
  "Answer": "Ответ",
  "Correct Answer": "Правильный ответ",
  "Add Question": "Добавить вопрос",
  "Quiz title is required": "Название квиза обязательно",
  "At least one question is required": "Нужен хотя бы один вопрос",
  "All questions must have text": "Все вопросы должны содержать текст",
  "All answers must be filled": "Все варианты ответов должны быть заполнены",

  // Waiting Lobby
  "Waiting for players to join...": "Ожидание игроков...",
  "Game PIN": "PIN игры",
  "Players Joined": "Игроков присоединилось",
  "Start Game": "Начать игру",
  "Share the PIN code with participants so they can join at": "Поделитесь PIN-кодом с участниками, чтобы они могли присоединиться на",

  // Quiz Play
  "Question": "Вопрос",
  "of": "из",
  "Waiting...": "Ожидание...",
  "Waiting for the next question...": "Ожидание следующего вопроса...",
  "Submit Answer": "Отправить ответ",
  "Show Results": "Показать результаты",
  "Next Question": "Следующий вопрос",
  "End Quiz": "Завершить квиз",
  "Correct! 🎉": "Правильно! 🎉",
  "Incorrect 😔": "Неправильно 😔",

  // Winners
  "Game Results!": "Результаты игры!",
  "Amazing performance everyone!": "Отличная игра, ребята!",
  "Full Leaderboard": "Таблица лидеров",
  "Back to Home": "На главную",
  "Create New Quiz": "Создать новый квиз",
  "points": "очков",
  "Place": "Место",
};

export type TranslationKey = keyof typeof translations;

export function t(key: string): string {
  return translations[key as TranslationKey] || key;
}
