
  # Kahoot-like Quiz Website Layout

  This is a code bundle for Kahoot-like Quiz Website Layout. The original project is available at https://www.figma.com/design/yEcvZ9FPi9VLy0HK34xHKn/Kahoot-like-Quiz-Website-Layout.

  ## Running the code

  Set API URL (optional, defaults to `http://localhost:3000`):

  ```
  VITE_API_URL=http://localhost:3000
  ```

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  


# Описание фронтенда

Идея проекта
Веб-приложение для проведения квизов.
Пользователь регистрируется, заходит в квиз или создает его, играется матч.

Структура компонентов
Экраны:
CreateQuiz — компонент создания квиза
QuizPlay — позволяет играть квиз
UserPage — страница пользователя
WaitingLobby —- лобби ожидания игры
WinnersPage — завершающая квиз страница
Также используются компоненты в директории ui/

Где и как используются:
useState
useEffect
props
useState и useEffect
App: текущая страница, 
user page: Списки квизов/результатов, форма логина, PIN для входа в комнату; useEffect подгружает данные при изменении auth.
create quiz: Черновик квиза (название, вопросы), флаги сохранения/ошибки.
waiting lobby: Игроки в лобби, копирование PIN; useEffect: подписка на socket-события.
quiz play: Текущий вопрос, таймер, ответы, таблица лидеров; несколько useEffect (сессия, таймер и т.д.).
props
для каждого компонента объявляется интерфейс <Component>Props, родитель (App) передаёт туда колбэки и данные.

Как реализована работа с API
В api/client стандартный враппер для fetch. Для каждого логического домана в api свой объект с функциями под каждый эндпоинт.
Для вебсокета — синглтон.


Как реализован routing
Храним текущую страницу просто как строку, рендерим по условию.

Основная логика приложения

Старт — читается tahook_token из localStorage, по нему вызывается authApi.me; при успехе выставляется auth.
Домашняя страница — логин/регистрация через authApi, списки мои квизы и мои результаты, вход игрока в комнату по PIN через socket.emit("join_room", ...) и переход на "quiz".
Ведущий — создание квиза через REST, лобби ожидания и дальнейший игровой поток через сокет; контекст сессии (mode, roomCode, quizTitle, quizId) хранится в quizData в App и передаётся в WaitingLobby / QuizPlay.
Финиш — экран победителей с данными лидерборда в winnersData, переход туда из игрового потока через handleNavigate("winners", data).
Выход — handleLogout очищает токен, отключает сокет, сбрасывает auth и страницу на "home".

