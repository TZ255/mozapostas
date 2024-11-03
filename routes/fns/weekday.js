const WeekDayFn = (engDay) => {
    switch (engDay) {
        case 'Monday':
            return "Segunda-feira"

        case 'Tuesday':
            return "Terça-feira"

        case 'Wednesday':
            return "Quarta-feira"

        case 'Thursday':
            return "Quinta-feira"

        case 'Friday':
            return "Sexta-feira"

        case 'Saturday':
            return "Sábado"

        case 'Sunday':
            return "Domingo"

        default:
            return "Hoje"
    }
}

module.exports = {
    WeekDayFn
}