#!/bin/bash

# Проверка количества аргументов
if [ "$#" -ne 2 ]; then
    echo "Использование: $0 email attemptsLeft"
    exit 1
fi

EMAIL=$1
ATTEMPTS=$2

# Проверка существования пользователя
USER_EXISTS=$(docker exec -e PGPASSWORD=pass math-help-api-pg psql -U postgres -d math-help-db -tAc " SELECT \"User\".\"id\" AS \"User_id\", \"User\".\"email\" AS \"User_email\", \"User\".\"firstName\" AS \"User_firstName\", \"User\".\"lastName\" AS \"User_lastName\", \"User\".\"googleId\" AS \"User_googleId\", \"User\".\"attemptsLeft\" AS \"User_attemptsLeft\", \"User\".\"attemptsCount\" AS \"User_attemptsCount\" FROM \"user\" \"User\" WHERE ((\"User\".\"email\" = \"user@example.com\"))")

if [ "$USER_EXISTS" != "1" ]; then
    echo "Пользователь с email: $EMAIL не найден."
    exit 1
fi

# Обновление attemptsLeft для заданного email
docker exec -e PGPASSWORD=pass math-help-api-pg psql -U postgres -d math-help-db -c " SELECT \"User\".\"id\" AS \"User_id\", \"User\".\"email\" AS \"User_email\", \"User\".\"firstName\" AS \"User_firstName\", \"User\".\"lastName\" AS \"User_lastName\", \"User\".\"googleId\" AS \"User_googleId\", \"User\".\"attemptsLeft\" AS \"User_attemptsLeft\", \"User\".\"attemptsCount\" AS \"User_attemptsCount\" FROM \"user\" \"User\" WHERE ((\"User\".\"email\" = \"user@example.com\"))"

# Проверка успешности выполнения
if [ $? -eq 0 ]; then
    echo "Успешно обновлено attemptsLeft для пользователя с email: $EMAIL на значение: $ATTEMPTS"
else
    echo "Ошибка при обновлении attemptsLeft для пользователя с email: $EMAIL"
fi
