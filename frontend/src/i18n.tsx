import React, { createContext, useContext, useState } from 'react';

export type Language = 'ru' | 'en' | 'uk' | 'pl';

export const SUGGESTIONS = {
    ru: [
        'покупал вещь, которую надел всего один раз',
        'заваривал чайный пакетик второй или третий раз подряд',
        'смотрел целый сезон сериала за один день',
        'отправлял сообщение не тому человеку',
        'случайно надевал разные носки и замечал это только на улице',
        'засыпал на работе или важной лекции',
        'пользовался студенческим или льготным билетом после того, как закончил учебу',
        'купался в бассене или море прямо в одежде',
        'ел пиццу с ананасами и искренне радовался',
        'притворялся спящим в транспорте, чтобы не уступать место',
        'сбегал с неудачного свидания через 15 минут',
        'забывал поливать комнатное растение так долго, что оно засыхало',
        'разбивал экран нового телефона в первую неделю после покупки',
        'разговаривал с умной колонкой или голосовым помощником на эмоциях',
        'верил в привидений после просмотра фильма ужасов',
        'репетировал речь или важный разговор перед зеркалом',
        'готовил блюдо по рецепту, которое в итоге пришлось выбросить',
        'пытался открыть дверь квартиры чужими ключами',
        'подключался к чужому Wi-Fi без разрешения',
        'прятался в шкафу во время игры в прятки во взрослом возрасте'
    ],
    en: [
        'bought something and only wore it once',
        'reused a tea bag two or three times in a row',
        'watched an entire season of a show in one day',
        'sent a text to the wrong person',
        'accidentally wore mismatched socks outside',
        'fallen asleep at work or during a lecture',
        'swam in a pool or the sea fully clothed',
        'eaten pineapple pizza and actually liked it',
        'pretended to sleep on public transit to not give up a seat',
        'escaped a bad date after 15 minutes',
        'forgot to water a houseplant until it died',
        'cracked a new phone screen in the first week',
        'argued with a voice assistant out of anger',
        'believed in ghosts after a horror movie',
        'rehearsed a conversation in front of a mirror',
        'ruined a recipe so bad it had to be thrown out',
        'tried to open someone else\'s door with my keys',
        'connected to a neighbor\'s Wi-Fi without asking',
        'hidden in a closet during hide-and-seek as an adult'
    ],
    uk: [
        'купував річ, яку вдягнув лише один раз',
        'заварював чайний пакетик другий чи третій раз поспіль',
        'дивився цілий сезон серіалу за один день',
        'надсилав повідомлення не тій людині',
        'випадково вдягав різні шкарпетки й помічав це лише на вулиці',
        'засинав на роботі чи важливій лекції',
        'купався в басейні чи морі просто в одязі',
        'їв піцу з ананасами та щиро радів',
        'прикидався сплячим у транспорті, щоб не поступатися місцем',
        'тікав з невдалого побачення через 15 хвилин',
        'забував поливати кімнатну рослину так довго, що вона засихала',
        'розбивав екран нового телефону в перший тиждень після покупки',
        'розмовляв з розумною колонкою чи голосовим помічником на емоціях',
        'вірив у привидів після перегляду фільму жахів',
        'репетирував промову або важливу розмову перед дзеркалом',
        'готував страву за рецептом, яку в результаті довелося викинути',
        'намагався відкрити двері картири чужими ключами',
        'підключався до чужого Wi-Fi без дозволу',
        'ховався у шафі під час гри в хованки у дорослому віці'
    ],
    pl: [
        'kupiłem rzecz, którą założyłem tylko raz',
        'zaparzałem torebkę herbaty drugi lub trzeci raz z rzędu',
        'obejrzałem cały sezon serialu w jeden dzień',
        'wysłałem wiadomość do niewłaściwej osoby',
        'przypadkowo założyłem różne skarpetki i zauważyłem to dopiero na ulicy',
        'zasnąłem w pracy lub na ważnym wykładzie',
        'kąpałem się w basenie lub morzu w ubraniu',
        'jadłem pizzę z ananasem i naprawdę mi smakowała',
        'udawałem, że śpię w autobusie/tramwaju, żeby nie ustąpić miejsca',
        'uciekłem z nieudanej randki po 15 minutach',
        'zapomniałem podlać roślinę domową tak długo, aż uschła',
        'rozbiłem ekran nowego telefonu w pierwszym tygodniu',
        'kłóciłem się z asystentem głosowym pod wpływem emocji',
        'wierzyłem w duchy po obejrzeniu horroru',
        'ćwiczyłem przemówienie przed lustrem',
        'przygotowałem danie z przepisu, które ostatecznie musiałem wyrzucić',
        'próbowałem otworzyć drzwi wejściowe obcymi kluczami',
        'łączyłem się z cudzym Wi-Fi bez pytania',
        'chowałem się w szafie podczas gry w chowanego jako dorosły'
    ]
};

export const TRANSLATIONS = {
    ru: {
        title: "Я никогда не...",
        subtitle: "Чтобы начать играть ты можешь",
        create_btn: "Создать новую игру",
        or: "Либо",
        room_code_label: "ввести код комнаты и",
        join_btn: "Присоединиться",
        checking: "Проверка...",
        loading: "Загрузка...",
        error_no_code: "Пожалуйста, введите код комнаты.",
        error_wrong_length: "Код должен состоять из 6 цифр.",
        error_not_found: "Комната {code} не найдена.",
        error_validation: "Произошла ошибка при проверке комнаты.",
        error_create: "Не удалось создать комнату. Попробуйте еще раз.",
        
        // Room.tsx
        add_question_btn: "Добавить вопрос",
        become_host_btn: "Стать хостом",
        start_game_btn: "Начать игру",
        added_count: "Добавлено вопросов: {count}",
        error_empty_question: "Пожалуйста, напишите вопрос.",
        error_conflict: "Такой вопрос уже есть в этой комнате!",
        success_added: "Вопрос успешно добавлен!",
        qr_btn: "QR-код",
        placeholder_prefix: "...",
        
        lost_host_desc: "Если вы потеряли хоста, то можно",
        host_warning_title: "ВНИМАНИЕ",
        host_warning_desc: "В игре должен быть только один хост, чтобы точно показались все заданные вопросы, так что нажимайте только в случае если изначальный хост закрыл вкладку, потерял телефон или отключился",
        host_warning_confirm: "Стать хостом",
        host_warning_cancel: "Назад к игре",

        // Host.tsx
        room_number: "Комната номер",
        room_created_desc: "Комната создана! Остальные могут ввести код или сканировать QR-код, чтобы подключиться.",
        load_dataset_desc: "По желанию загрузи вопросы из набора.",
        dataset_common: "Стандартных",
        dataset_horny: "Пошлых",
        load_btn: "Загрузить",
        load_status_duplicate: "Все вопросы из этого набора уже загружены",
        load_status_success: "Успешно загружено {count} вопросов!",
        load_status_error: "Ошибка загрузки вопросов",
        upload_file_desc: "А можно загрузить свой файл с вопросами",
        upload_btn: "Импорт",
        upload_status_success: "Файл успешно загружен! Добавлено {count} вопросов.",
        upload_status_error: "Ошибка загрузки файла",
        to_questions_btn: "К вопросам!",

        // Game.tsx
        next_btn: "Следующий!",
        remaining_count: "Осталось вопросов: {count}",
        coffee_gate_title: "Купить кофе проекту?",
        coffee_gate_desc: "Вы сыграли уже 10 вопросов! Мы делаем эту игру с любовью и без рекламы. Если вам нравится, поддержите разработчика и купите кофе за $5 на всю компанию ☕️",
        coffee_gate_buy_btn: "Купить кофе ($5)",
        coffee_gate_free_btn: "Продолжить бесплатно",
        coffee_gate_confirm_title: "Вы уверены?",
        coffee_gate_confirm_desc: "Вы точно не можете поддержать проект? Нам очень нужны средства на оплату серверов и AI-функций 🥺",
        coffee_gate_promise_btn: "Обещаю поддержать позже",
        coffee_gate_back_btn: "Да, поддержать сейчас",
        finished_ai_title: "Хотите продолжить игру?",
        finished_ai_desc: "AI сгенерирует 20 уникальных вопросов на основе атмосферы вашей комнаты (внутриков, имен, шуток)!",
        finished_ai_btn: "Сгенерировать AI-вопросы ✨",
        finished_ai_loading: "AI думает и генерирует...",
        finished_ai_error_vibe: "Нужно хотя бы 3 кастомных вопроса от игроков, чтобы уловить атмосферу!",
        finished_ai_success: "Успешно добавлено {count} новых AI-вопросов!",
        ai_pay_title: "Разблокировать AI-генерацию",
        ai_pay_desc: "Генерация вопросов с помощью искусственного интеллекта Gemini расходует ресурсы сервера. Чтобы разблокировать эту функцию на всё время существования комнаты, поддержите разработчика на $5! Это поможет нам оплачивать API и развивать игру ☕️",
        ai_pay_btn: "Оплатить доступ ($5)",
        ai_pay_check_btn: "Я оплатил / Проверить доступ",
        ai_pay_cancel: "Назад",
        ai_pay_success_toast: "Доступ успешно разблокирован! Теперь вы можете генерировать вопросы.",
        game_settings_title: "Настройки игры",
        add_questions_label: "Добавить вопросы",
        finished_title: "Кончились вопросы!",
        finished_check_btn: "Точно?",
        finished_desc: "Поздравляю, это были все вопросы, заданные в этой комнате",
        finished_load_more_btn: "Загрузить ещё!",
        finished_download_desc: "Теперь их можно скачать на память!",
        finished_download_btn: "Скачать все вопросы",
        coffee_donate: "И если игра вам понравилась, на кофе кидать сюда",
        
        // Language Select
        lang_ru: "Русский",
        lang_en: "English",
        lang_uk: "Українська",
        lang_pl: "Polski"
    },
    en: {
        title: "Never Have I Ever...",
        subtitle: "To start playing you can",
        create_btn: "Create new game",
        or: "Or",
        room_code_label: "enter room code to",
        join_btn: "Join",
        checking: "Checking...",
        loading: "Loading...",
        error_no_code: "Please enter the room code.",
        error_wrong_length: "The code must consist of 6 digits.",
        error_not_found: "Room {code} not found.",
        error_validation: "An error occurred while checking the room.",
        error_create: "Failed to create a room. Please try again.",
        
        // Room.tsx
        add_question_btn: "Add question",
        become_host_btn: "Become Host",
        start_game_btn: "Start Game",
        added_count: "Questions added: {count}",
        error_empty_question: "Please write a question.",
        error_conflict: "This exact question already exists in this room!",
        success_added: "Question successfully added!",
        qr_btn: "QR Code",
        placeholder_prefix: "...",
        
        lost_host_desc: "If you lost the host, you can",
        host_warning_title: "WARNING",
        host_warning_desc: "There should only be one host in the game to ensure all questions are displayed properly. Only click this if the original host has closed their tab, lost their phone, or disconnected.",
        host_warning_confirm: "Become Host",
        host_warning_cancel: "Back to game",

        // Host.tsx
        room_number: "Room number",
        room_created_desc: "Room created! Others can enter the code or scan the QR code to connect.",
        load_dataset_desc: "Optionally, load questions from a dataset.",
        dataset_common: "Standard",
        dataset_horny: "R-Rated",
        load_btn: "Load",
        load_status_duplicate: "All questions from this dataset have already been loaded",
        load_status_success: "Successfully loaded {count} questions!",
        load_status_error: "Failed to load questions",
        upload_file_desc: "Or you can upload your own file with questions",
        upload_btn: "Import",
        upload_status_success: "File successfully uploaded! Added {count} questions.",
        upload_status_error: "Failed to upload file",
        to_questions_btn: "To questions!",

        // Game.tsx
        next_btn: "Next!",
        remaining_count: "Questions remaining: {count}",
        coffee_gate_title: "Buy Coffee for the Project?",
        coffee_gate_desc: "You have played 10 questions! We make this game with love and no ads. If you enjoy it, please support the developer and buy a coffee for $5 for the whole company ☕️",
        coffee_gate_buy_btn: "Buy Coffee ($5)",
        coffee_gate_free_btn: "Continue for free",
        coffee_gate_confirm_title: "Are you sure?",
        coffee_gate_confirm_desc: "Are you sure you cannot support the project? We really need funds to pay for servers and AI features 🥺",
        coffee_gate_promise_btn: "I promise to support later",
        coffee_gate_back_btn: "Yes, support now",
        finished_ai_title: "Want to continue the game?",
        finished_ai_desc: "AI will generate 20 unique questions based on your room's vibe (inside jokes, names, jokes)!",
        finished_ai_btn: "Generate AI Questions ✨",
        finished_ai_loading: "AI is thinking and generating...",
        finished_ai_error_vibe: "Need at least 3 custom questions from players to catch the vibe!",
        finished_ai_success: "Successfully added {count} new AI questions!",
        ai_pay_title: "Unlock AI Generation",
        ai_pay_desc: "Generating questions using Gemini AI consumes server resources. To unlock this feature for the entire lifetime of this room, please support the developer for $5! This helps us pay for the API and develop the game ☕️",
        ai_pay_btn: "Unlock Access ($5)",
        ai_pay_check_btn: "I paid / Check access",
        ai_pay_cancel: "Back",
        ai_pay_success_toast: "Access unlocked successfully! Now you can generate questions.",
        game_settings_title: "Game Settings",
        add_questions_label: "Add questions",
        finished_title: "Out of questions!",
        finished_check_btn: "Are you sure?",
        finished_desc: "Congratulations, those were all the questions asked in this room",
        finished_load_more_btn: "Load more!",
        finished_download_desc: "Now you can download them as a keepsake!",
        finished_download_btn: "Download all questions",
        coffee_donate: "And if you enjoyed the game, buy me a coffee here",
        
        // Language Select
        lang_ru: "Русский",
        lang_en: "English",
        lang_uk: "Українська",
        lang_pl: "Polski"
    },
    uk: {
        title: "Я ніколи не...",
        subtitle: "Щоб почати грати ти можеш",
        create_btn: "Створити нову гру",
        or: "Або",
        room_code_label: "ввести код кімнати та",
        join_btn: "Приєднатися",
        checking: "Перевірка...",
        loading: "Завантаження...",
        error_no_code: "Будь ласка, введіть код кімнати.",
        error_wrong_length: "Код має складатися з 6 цифр.",
        error_not_found: "Кімнату {code} не знайдено.",
        error_validation: "Виникла помилка під час перевірки кімнати.",
        error_create: "Не вдалося створити кімнату. Спробуйте ще раз.",
        
        // Room.tsx
        add_question_btn: "Додати питання",
        become_host_btn: "Стати хостом",
        start_game_btn: "Почати гру",
        added_count: "Додано питань: {count}",
        error_empty_question: "Будь ласка, напишіть питання.",
        error_conflict: "Таке питання вже є в цій кімнаті!",
        success_added: "Питання успішно додано!",
        qr_btn: "QR-код",
        placeholder_prefix: "...",
        
        lost_host_desc: "Якщо ви втратили хоста, то можна",
        host_warning_title: "УВАГА",
        host_warning_desc: "У грі має бути лише один хост, щоб точно показалися всі задані питання, тому натискайте лише у випадку, якщо початковий хост закрив вкладку, втратив телефон або відключився.",
        host_warning_confirm: "Стати хостом",
        host_warning_cancel: "Назад до гри",

        // Host.tsx
        room_number: "Кімната номер",
        room_created_desc: "Кімнату створено! Інші можуть ввести код або відсканувати QR-код, щоб приєднатися.",
        load_dataset_desc: "За бажанням завантажте питання з набору.",
        dataset_common: "Стандартних",
        dataset_horny: "Пікантних",
        load_btn: "Завантажити",
        load_status_duplicate: "Усі питання з цього набору вже завантажено",
        load_status_success: "Успішно завантажено {count} питань!",
        load_status_error: "Помилка завантаження питань",
        upload_file_desc: "Або можна завантажити власний файл із питаннями",
        upload_btn: "Імпорт",
        upload_status_success: "Файл успішно завантажено! Додано {count} питань.",
        upload_status_error: "Помилка завантаження файлу",
        to_questions_btn: "До питань!",

        // Game.tsx
        next_btn: "Наступний!",
        remaining_count: "Залишилося питань: {count}",
        coffee_gate_title: "Купити каву проекту?",
        coffee_gate_desc: "Ви зіграли вже 10 питань! Ми робимо цю гру з любов'ю та без реклами. Якщо вам подобається, підтримайте розробника та купіть каву за $5 на всю компанію ☕️",
        coffee_gate_buy_btn: "Купити каву ($5)",
        coffee_gate_free_btn: "Продовжити безкоштовно",
        coffee_gate_confirm_title: "Ви впевнені?",
        coffee_gate_confirm_desc: "Ви точно не можете підтримати проект? Нам дуже потрібні кошти на оплату серверів та AI-функцій 🥺",
        coffee_gate_promise_btn: "Обіцяю підтримати пізніше",
        coffee_gate_back_btn: "Так, підтримати зараз",
        finished_ai_title: "Хочете продовжити гру?",
        finished_ai_desc: "AI згенерує 20 унікальних питань на основі атмосфери вашої кімнати (внутриків, імен, жартів)!",
        finished_ai_btn: "Згенерувати AI-питання ✨",
        finished_ai_loading: "AI думає та генерує...",
        finished_ai_error_vibe: "Потрібно хоча б 3 кастомних питання від гравців, щоб уловити атмосферу!",
        finished_ai_success: "Успішно додано {count} нових AI-питань!",
        ai_pay_title: "Розблокувати AI-генерацію",
        ai_pay_desc: "Генерація питань за допомогою штучного інтелекту Gemini витрачає ресурси сервера. Щоб розблокувати цю функцію на весь час існування кімнати, підтримайте розробника на $5! Це допоможе нам оплачувати API та розвивати гру ☕️",
        ai_pay_btn: "Оплатити доступ ($5)",
        ai_pay_check_btn: "Я оплатив / Перевірити доступ",
        ai_pay_cancel: "Назад",
        ai_pay_success_toast: "Доступ успішно розблоковано! Тепер ви можете генерувати питання.",
        game_settings_title: "Налаштування гри",
        add_questions_label: "Додати питання",
        finished_title: "Питання закінчилися!",
        finished_check_btn: "Точно?",
        finished_desc: "Вітаємо, це були всі питання, задані в цій кімнаті",
        finished_load_more_btn: "Завантажити ще!",
        finished_download_desc: "Тепер їх можна завантажити на згадку!",
        finished_download_btn: "Завантажити всі питання",
        coffee_donate: "І якщо гра вам сподобалася, на каву кидати сюди",
        
        // Language Select
        lang_ru: "Русский",
        lang_en: "English",
        lang_uk: "Українська",
        lang_pl: "Polski"
    },
    pl: {
        title: "Nigdy nie...",
        subtitle: "Aby zacząć grę możesz",
        create_btn: "Stworzyć nową grę",
        or: "Albo",
        room_code_label: "wpisać kod pokoju i",
        join_btn: "Dołącz",
        checking: "Sprawdzanie...",
        loading: "Ładowanie...",
        error_no_code: "Proszę wpisać kod pokoju.",
        error_wrong_length: "Kod musi składać się z 6 cyfr.",
        error_not_found: "Pokój {code} nie został znaleziony.",
        error_validation: "Wystąpił błąd podczas sprawdzania pokoju.",
        error_create: "Nie udało się stworzyć pokoju. Spróbuj ponownie.",
        
        // Room.tsx
        add_question_btn: "Dodaj pytanie",
        become_host_btn: "Zostań hostem",
        start_game_btn: "Rozpocznij grę",
        added_count: "Dodane pytania: {count}",
        error_empty_question: "Proszę napisać pytanie.",
        error_conflict: "To pytanie już istnieje w tym pokoju!",
        success_added: "Pytanie zostało pomyślnie dodane!",
        qr_btn: "Kod QR",
        placeholder_prefix: "...",
        
        lost_host_desc: "Jeśli zgubiłeś hosta, możesz",
        host_warning_title: "UWAGA",
        host_warning_desc: "W grze powinien być tylko jeden host, aby mieć pewność, że wszystkie zadane pytania zostaną wyświetlone, więc klikaj tylko wtedy, gdy oryginalny host zamknął kartę, zgubił telefon lub rozłączył się.",
        host_warning_confirm: "Zostań hostem",
        host_warning_cancel: "Powrót do gry",

        // Host.tsx
        room_number: "Pokój numer",
        room_created_desc: "Pokój został stworzony! Inni mogą wpisać kod lub zeskanować kod QR, aby dołączyć.",
        load_dataset_desc: "Opcjonalnie załaduj pytania z zestawu.",
        dataset_common: "Standardowych",
        dataset_horny: "Niegrzecznych",
        load_btn: "Załaduj",
        load_status_duplicate: "Wszystkie pytania z tego zestawu zostały już załadowane",
        load_status_success: "Pomyślnie załadowano {count} pytań!",
        load_status_error: "Błąd ładowania pytań",
        upload_file_desc: "Możesz też załadować własny plik z pytaniami",
        upload_btn: "Importuj",
        upload_status_success: "Plik został pomyślnie załadowany! Dodano {count} pytań.",
        upload_status_error: "Błąd ładowania pliku",
        to_questions_btn: "Do pytań!",

        // Game.tsx
        next_btn: "Następny!",
        remaining_count: "Pozostało pytań: {count}",
        coffee_gate_title: "Kupić kawę dla projektu?",
        coffee_gate_desc: "Zagraliście już 10 pytań! Tworzymy tę grę z miłością i bez reklam. Jeśli wam się podoba, wesprzyjcie twórcę i kupcie kawę za 5$ dla całej grupy ☕️",
        coffee_gate_buy_btn: "Kup kawę ($5)",
        coffee_gate_free_btn: "Kontynuuj za darmo",
        coffee_gate_confirm_title: "Czy jesteś pewien?",
        coffee_gate_confirm_desc: "Czy na pewno nie możesz wesprzeć projektu? Naprawdę potrzebujemy funduszy na opłacenie serwerów i funkcji AI 🥺",
        coffee_gate_promise_btn: "Obiecuję wesprzeć później",
        coffee_gate_back_btn: "Tak, wesprzyj teraz",
        finished_ai_title: "Chcesz kontynuować grę?",
        finished_ai_desc: "AI wygeneruje 20 unikalnych pytań na podstawie atmosfery twojego pokoju (żartów, imion, żartów)!",
        finished_ai_btn: "Generuj pytania AI ✨",
        finished_ai_loading: "AI myśli i generuje...",
        finished_ai_error_vibe: "Potrzeba co najmniej 3 własnych pytań od graczy, aby poczuć klimat!",
        finished_ai_success: "Pomyślnie dodano {count} nowych pytań AI!",
        ai_pay_title: "Odblokuj generowanie AI",
        ai_pay_desc: "Generowanie pytań za pomocą sztucznej inteligencji Gemini zużywa zasoby serwera. Aby odblokować tę funkcję na cały czas istnienia pokoju, wesprzyj twórcę kwotą 5$! Pomaga nam to opłacać API i rozwijać grę ☕️",
        ai_pay_btn: "Odblokuj dostęp ($5)",
        ai_pay_check_btn: "Zapłaciłem / Sprawdź dostęp",
        ai_pay_cancel: "Wstecz",
        ai_pay_success_toast: "Dostęp odblokowany pomyślnie! Teraz możesz generować pytania.",
        game_settings_title: "Ustawienia gry",
        add_questions_label: "Dodaj pytania",
        finished_title: "Koniec pytań!",
        finished_check_btn: "Na pewno?",
        finished_desc: "Gratulacje, to były wszystkie pytania zadane w tym pokoju",
        finished_load_more_btn: "Załaduj więcej!",
        finished_download_desc: "Teraz możesz je pobrać na pamiątkę!",
        finished_download_btn: "Pobierz wszystkie pytania",
        coffee_donate: "A jeśli gra Ci się podobała, możesz postawić mi kawę tutaj",
        
        // Language Select
        lang_ru: "Русский",
        lang_en: "English",
        lang_uk: "Українська",
        lang_pl: "Polski"
    }
};

interface LanguageContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof TRANSLATIONS['ru'], params?: { [key: string]: any }) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLangState] = useState<Language>(() => {
        const saved = localStorage.getItem('game_language') as Language;
        if (saved && TRANSLATIONS[saved]) return saved;
        
        const locale = navigator.language.slice(0, 2);
        if (locale === 'uk' || locale === 'ua') return 'uk';
        if (locale === 'pl') return 'pl';
        if (locale === 'en') return 'en';
        return 'ru';
    });

    const setLanguage = (lang: Language) => {
        setLangState(lang);
        localStorage.setItem('game_language', lang);
    };

    const t = (key: keyof typeof TRANSLATIONS['ru'], params?: { [key: string]: any }) => {
        const dict = TRANSLATIONS[language] || TRANSLATIONS['ru'];
        let text = dict[key] || TRANSLATIONS['ru'][key] || String(key);
        if (params) {
            Object.keys(params).forEach(p => {
                text = text.replace(`{${p}}`, String(params[p]));
            });
        }
        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
