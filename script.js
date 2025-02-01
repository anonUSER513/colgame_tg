document.addEventListener('DOMContentLoaded', () => {
    const calendar = document.getElementById('calendar');
    const confirmButton = document.getElementById('confirmButton');
    const message = document.getElementById('message');
    const friendsButton = document.getElementById('friendsButton');
    const referralMenu = document.getElementById('referralMenu');
    const closeModal = document.querySelector('.close');
    const referralLinkInput = document.getElementById('referralLink');
    const copyLinkButton = document.getElementById('copyLinkButton');
    const referralCount = document.getElementById('referralCount');
    let selectedDay = null;

    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand(); // Раскрываем приложение на весь экран

    // Получаем данные пользователя из Telegram
    const user = tg.initDataUnsafe.user;
    const userId = user?.id.toString() || 'default_user';
    const userName = user?.first_name || 'Пользователь';

    // Получаем текущую дату
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Ключи для LocalStorage
    const progressKey = `progress_${userId}_${currentYear}_${currentMonth}`;
    const referralKey = `referrals_${userId}`;

    // Загружаем прогресс из LocalStorage
    let progress = JSON.parse(localStorage.getItem(progressKey)) || {
        confirmedDays: [],
        lastConfirmedDay: null
    };

    // Загружаем реферальные данные из LocalStorage
    let referrals = JSON.parse(localStorage.getItem(referralKey)) || {
        count: 0,
        referralCode: generateReferralCode(userId)
    };

    // Генерация реферального кода
    function generateReferralCode(userId) {
        return `ref_${userId}`;
    }

    // Отображение реферальной ссылки
    function displayReferralLink() {
        const referralCode = referrals.referralCode;
        const referralUrl = `${window.location.origin}${window.location.pathname}?ref=${referralCode}`;
        referralLinkInput.value = referralUrl;
        referralCount.textContent = referrals.count;
    }

    // Копирование реферальной ссылки
    copyLinkButton.addEventListener('click', () => {
        referralLinkInput.select();
        document.execCommand('copy');
        tg.showAlert('Ссылка скопирована!');
    });

    // Открытие модального окна
    friendsButton.addEventListener('click', () => {
        referralMenu.style.display = 'flex';
    });

    // Закрытие модального окна
    closeModal.addEventListener('click', () => {
        referralMenu.style.display = 'none';
    });

    // Проверка реферального кода из URL
    function checkReferralCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');

        if (refCode && refCode !== referrals.referralCode) {
            // Находим пользователя, который пригласил
            const referrerUserId = refCode.split('_')[1];
            const referrerKey = `referrals_${referrerUserId}`;
            const referrerData = JSON.parse(localStorage.getItem(referrerKey)) || { count: 0 };

            // Обновляем счетчик приглашений
            referrerData.count += 1;
            localStorage.setItem(referrerKey, JSON.stringify(referrerData));

            // Показываем сообщение в Telegram
            tg.showAlert(`Вы были приглашены пользователем с ID: ${referrerUserId}`);
        }
    }

    // Генерация календаря
    function generateCalendar() {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        let calendarHTML = '';

        for (let day = 1; day <= daysInMonth; day++) {
            const isConfirmed = progress.confirmedDays.includes(day);
            calendarHTML += `
                <div class="day ${isConfirmed ? 'confirmed' : ''}" data-day="${day}">
                    ${day}
                    ${isConfirmed ? '✅' : ''}
                </div>`;
        }

        calendar.innerHTML = calendarHTML;

        // Добавляем обработчик событий для выбора дня
        const days = document.querySelectorAll('.day');
        days.forEach(day => {
            day.addEventListener('click', () => {
                if (selectedDay) {
                    selectedDay.classList.remove('selected');
                }
                selectedDay = day;
                day.classList.add('selected');
                confirmButton.disabled = false;
            });
        });
    }

    // Обработчик подтверждения дня
    confirmButton.addEventListener('click', () => {
        if (selectedDay) {
            const selectedDayNumber = parseInt(selectedDay.getAttribute('data-day'), 10);

            // Проверяем, что выбранный день — сегодня
            if (selectedDayNumber === currentDay) {
                // Проверяем, что день еще не подтвержден
                if (!progress.confirmedDays.includes(selectedDayNumber)) {
                    progress.confirmedDays.push(selectedDayNumber);
                    progress.lastConfirmedDay = selectedDayNumber;
                    localStorage.setItem(progressKey, JSON.stringify(progress));

                    tg.showAlert('День подтвержден!');

                    // Обновляем календарь
                    selectedDay.classList.add('confirmed');
                    selectedDay.innerHTML = `${selectedDayNumber} ✅`;
                } else {
                    tg.showAlert('Этот день уже подтвержден!');
                }
            } else {
                tg.showAlert('Вы выбрали неверный день!');
            }
        }
    });

    // Инициализация
    generateCalendar();
    displayReferralLink();
    checkReferralCode();
});