document.addEventListener('DOMContentLoaded', () => {
    const calendar = document.getElementById('calendar');
    const message = document.getElementById('message');
    const friendsButton = document.getElementById('friendsButton');
    const referralMenu = document.getElementById('referralMenu');
    const closeModal = document.querySelector('.close');
    const referralLinkInput = document.getElementById('referralLink');
    const copyLinkButton = document.getElementById('copyLinkButton');
    const referralCount = document.getElementById('referralCount');
    const referralCountModal = document.getElementById('referralCountModal');
    const coinsCount = document.getElementById('coinsCount');
    const confirmedDaysCount = document.getElementById('confirmedDaysCount');
    const achievementsList = document.getElementById('achievementsList');

    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand();

    // Получаем данные пользователя из Telegram
    const user = tg.initDataUnsafe.user;
    const userId = user?.id.toString() || 'default_user';

    // Получаем текущую дату
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Ключи для LocalStorage
    const progressKey = `progress_${userId}_${currentYear}_${currentMonth}`;
    const referralKey = `referrals_${userId}`;
    const coinsKey = `coins_${userId}`;
    const achievementsKey = `achievements_${userId}`;

    // Загружаем данные из LocalStorage
    let progress = JSON.parse(localStorage.getItem(progressKey)) || {
        confirmedDays: [],
        lastConfirmedDay: null
    };

    let referrals = JSON.parse(localStorage.getItem(referralKey)) || {
        count: 0,
        referralCode: generateReferralCode(userId)
    };

    let coins = parseInt(localStorage.getItem(coinsKey)) || 0;
    let achievements = JSON.parse(localStorage.getItem(achievementsKey)) || [];

    // Обновляем отображение монет
    function updateCoinsDisplay() {
        coinsCount.textContent = coins;
    }

    // Обновляем отображение статистики
    function updateStats() {
        confirmedDaysCount.textContent = progress.confirmedDays.length;
        referralCount.textContent = referrals.count;
        referralCountModal.textContent = referrals.count;
    }

    // Обновляем отображение достижений
    function updateAchievements() {
        achievementsList.innerHTML = achievements.map(achievement => `
            <li>${achievement}</li>
        `).join('');
    }

    // Генерация реферального кода
    function generateReferralCode(userId) {
        return `ref_${userId}`;
    }

    // Отображение реферальной ссылки
    function displayReferralLink() {
        const referralCode = referrals.referralCode;
        const referralUrl = `https://t.me/Kalendario_bot?start=${referralCode}`; // Ссылка на бота с реферальным кодом
        referralLinkInput.value = referralUrl;
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
            const referrerUserId = refCode.split('_')[1];
            const referrerKey = `referrals_${referrerUserId}`;
            const referrerData = JSON.parse(localStorage.getItem(referrerKey)) || { count: 0 };

            // Обновляем счетчик приглашений и монеты
            referrerData.count += 1;
            localStorage.setItem(referrerKey, JSON.stringify(referrerData));

            // Начисляем монеты
            const referrerCoinsKey = `coins_${referrerUserId}`;
            let referrerCoins = parseInt(localStorage.getItem(referrerCoinsKey)) || 0;
            referrerCoins += 1;
            localStorage.setItem(referrerCoinsKey, referrerCoins.toString());

            tg.showAlert(`Вы были приглашены пользователем с ID: ${referrerUserId}`);
        }
    }

    // Генерация календаря
    function generateCalendar() {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        let calendarHTML = '';

        for (let day = 1; day <= daysInMonth; day++) {
            const isConfirmed = progress.confirmedDays.includes(day);
            const isCurrentDay = day === currentDay; // Проверяем, является ли день текущим
            calendarHTML += `
                <div class="day ${isConfirmed ? 'confirmed' : ''} ${isCurrentDay ? 'current-day' : ''}" data-day="${day}">
                    ${day}
                    ${isConfirmed ? '✅' : ''}
                </div>`;
        }

        calendar.innerHTML = calendarHTML;

        // Обработчик нажатия на день
        const days = document.querySelectorAll('.day');
        days.forEach(day => {
            day.addEventListener('click', () => {
                const selectedDayNumber = parseInt(day.getAttribute('data-day'), 10);

                if (selectedDayNumber === currentDay) {
                    if (!progress.confirmedDays.includes(selectedDayNumber)) {
                        progress.confirmedDays.push(selectedDayNumber);
                        progress.lastConfirmedDay = selectedDayNumber;
                        localStorage.setItem(progressKey, JSON.stringify(progress));

                        // Награда за подтверждение
                        coins += 10;
                        localStorage.setItem(coinsKey, coins.toString());
                        updateCoinsDisplay();

                        // Проверка достижений
                        checkAchievements();

                        tg.showAlert('День подтвержден! Вы получили 10 монет.');

                        day.classList.add('confirmed');
                        day.innerHTML = `${selectedDayNumber} ✅`;
                    } else {
                        tg.showAlert('Этот день уже подтвержден!');
                    }
                } else {
                    tg.showAlert('Вы выбрали неверный день!');
                }
            });
        });
    }

    // Проверка достижений
    function checkAchievements() {
        const confirmedDays = progress.confirmedDays.length;

        if (confirmedDays >= 1 && !achievements.includes('Новичок')) {
            achievements.push('Новичок');
            tg.showAlert('Достижение разблокировано: Новичок!');
        }

        if (confirmedDays >= 7 && !achievements.includes('Стрикер')) {
            achievements.push('Стрикер');
            tg.showAlert('Достижение разблокировано: Стрикер!');
        }

        if (referrals.count >= 1 && !achievements.includes('Социальный магнат')) {
            achievements.push('Социальный магнат');
            tg.showAlert('Достижение разблокировано: Социальный магнат!');
        }

        localStorage.setItem(achievementsKey, JSON.stringify(achievements));
        updateAchievements();
    }

    // Инициализация
    generateCalendar();
    displayReferralLink();
    checkReferralCode();
    updateCoinsDisplay();
    updateStats();
    updateAchievements();
});
