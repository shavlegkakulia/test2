import translateService from './translateService';

const timeUnits = {
    ms: { name: 'ms', key: 'ms', value: 1 },
    s: { name: 's', key: 'ss', value: 1000, unitKey: 'uSecond' },
    m: { name: 'm', key: 'mm', value: 60, unitKey: 'uMinute' },
    h: { name: 'h', key: 'HH', value: 60, unitKey: 'uHour' },
    d: { name: 'd', key: 'dd', value: 24, unitKey: 'uDay', uKey2: 'uWeek' },
    M: { name: 'M', key: 'MM', value: 30.416, unitKey: 'uMonth' },
    y: { name: 'y', key: 'yyyy', value: 12, unitKey: 'uYear' }
}

class DateHelperService {
    serverDateTimeFormat = `${timeUnits.y.key}-${timeUnits.M.key}-${timeUnits.d.key}T${timeUnits.h.key}:${timeUnits.m.key}:${timeUnits.s.key}`;
    serverDateFormat = `${timeUnits.y.key}-${timeUnits.M.key}-${timeUnits.d.key}`;
    dateFormat = `${timeUnits.d.key}-${timeUnits.M.key}-${timeUnits.y.key}`;
    dateTimeFormat = `${timeUnits.d.key}-${timeUnits.M.key}-${timeUnits.y.key} ${timeUnits.h.key}:${timeUnits.m.key}:${timeUnits.s.key}`;
    smallDateTimeFormat = `${timeUnits.d.key}-${timeUnits.M.key}-${timeUnits.y.key} ${timeUnits.h.key}:${timeUnits.m.key}`;
    smallTimeFormat = `${timeUnits.h.key}:${timeUnits.m.key}`;

    format(date, format = this.serverDateTimeFormat, toUtc = false, name = false) {
        if (!date) return "";
        if (!(date instanceof Date)) date = new Date(date);
        if (toUtc) date = this.add(date, new Date().getTimezoneOffset(), 'm');

        let year = date.getFullYear().toString();

        let month = (date.getMonth() + 1).toString();
        if (month.length == 1) month = `0${month}`;

        let day = date.getDate().toString();
        if (day.length == 1) day = `0${day}`;

        let hour = date.getHours().toString();
        if (hour.length == 1) hour = `0${hour}`;

        let minute = date.getMinutes().toString();
        if (minute.length == 1) minute = `0${minute}`;

        let second = date.getSeconds().toString();
        if (second.length == 1) second = `0${second}`;
       
        if(name) {
            month = this.getMonthName(Number(month), true)
        }

        return format
            .replace(timeUnits.y.key, year)
            .replace(timeUnits.M.key, month)
            .replace(timeUnits.d.key, day)
            .replace(timeUnits.h.key, hour)
            .replace(timeUnits.m.key, minute)
            .replace(timeUnits.s.key, second);
    }

    parse(date, format = this.serverDateTimeFormat, fromUtc = false) {
        if (!date) return null;

        let yearIndex = format.indexOf(timeUnits.y.key);
        let year = Number(date.substring(yearIndex, yearIndex + 4));

        let monthIndex = format.indexOf(timeUnits.M.key);
        let month = Number(date.substring(monthIndex, monthIndex + 2)) - 1;

        let dayIndex = format.indexOf(timeUnits.d.key);
        let day = Number(date.substring(dayIndex, dayIndex + 2));

        let hourIndex = format.indexOf(timeUnits.h.key);
        let hour = hourIndex == -1 ? 0 : Number(date.substring(hourIndex, hourIndex + 2));

        let minuteIndex = format.indexOf(timeUnits.m.key);
        let minute = minuteIndex == -1 ? 0 : Number(date.substring(minuteIndex, minuteIndex + 2));

        let secondIndex = format.indexOf(timeUnits.s.key);
        let second = secondIndex == -1 ? 0 : Number(date.substring(secondIndex, secondIndex + 2));

        let value = new Date(year, month, day, hour, minute, second);
        if (fromUtc) value = this.add(value, new Date().getTimezoneOffset() * -1, 'm');

        return value;
    }

    dateDiff(dateFrom, dateTo, unit = 'd') {
        if (!dateFrom || !dateTo) return null;
        if (!(dateFrom instanceof Date)) dateFrom = new Date(dateFrom);
        if (!(dateTo instanceof Date)) dateTo = new Date(dateTo);

        if (unit == 'y') {
            let yearDiff = dateTo.getFullYear() - dateFrom.getFullYear();
            let tempDate;
            if (yearDiff < 0) {
                yearDiff *= -1;
                tempDate = dateFrom;
                dateFrom = dateTo;
                dateTo = tempDate;
            }

            while (yearDiff) {
                if (new Date(dateFrom.getFullYear() + yearDiff, dateFrom.getMonth(), dateFrom.getDate(),
                    dateFrom.getHours(), dateFrom.getMinutes(), dateFrom.getSeconds(), dateFrom.getMilliseconds()) <= dateTo)
                    return yearDiff * (tempDate ? -1 : 1);
                yearDiff--;
            }
            return 0;
        }

        let diff = dateTo.getTime() - dateFrom.getTime();
        let { ms, s, m, h, d, M, y } = timeUnits;

        for (let u of [ms, s, m, h, d, M]) {
            diff /= u.value;
            if (u.name == unit) break;
        }

        return Math.floor(diff);
    }

    getDate(date) {
        if (date === undefined) date = new Date();

        if (!date) return null;
        if (!(date instanceof Date)) date = new Date(date);

        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    }

    dateEquals(source, dest) {
        if (!source && !dest) return true;
        if (!source || !dest) return false;

        return source.getFullYear() == dest.getFullYear() &&
            source.getMonth() == dest.getMonth() &&
            source.getDate() == dest.getDate();
    }

    add(date, value, unit = 'd') {
        if (!date) return null;
        if (!(date instanceof Date)) date = new Date(date);

        return new Date(
            (unit == 'y' ? date.getFullYear() + value : date.getFullYear()),
            (unit == 'M' ? date.getMonth() + value : date.getMonth()),
            (unit == 'd' ? date.getDate() + value : date.getDate()),
            (unit == 'h' ? date.getHours() + value : date.getHours()),
            (unit == 'm' ? date.getMinutes() + value : date.getMinutes()),
            (unit == 's' ? date.getSeconds() + value : date.getSeconds()),
            (unit == 'ms' ? date.getMilliseconds() + value : date.getMilliseconds()),
        );
    }

    split(date) {
        if (!date) return {};
        if (!(date instanceof Date)) date = new Date(date);

        return {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
            millisecond: date.getMilliseconds(),
            week: date.getDay()
        }
    }

    get utcNow() {
        return this.add(new Date(), new Date().getTimezoneOffset(), 'm');
    }

    today(date) {
        if (!date) return false;

        let now = this.split(new Date());
        date = this.split(date);

        return now.year == date.year && now.month == date.month && now.day == date.day;
    }

    yesterday(date) {
        if (!date) return false;

        let yesterday = this.add(this.getDate(), -1, 'd');
        yesterday = this.split(yesterday);
        date = this.split(date);

        return yesterday.year == date.year && yesterday.month == date.month && yesterday.day == date.day;
    }

    formatTimePassed(from, to, minUnit = 'm', formatStr = '{value}{unit:s}') {
        let format = (unit, value) => {
            value = Math.floor(value);
            if (!value) value = 1;

            let unitKey = unit.unitKey;
            if (unit.value == 24 && value >= 7) {
                value = Math.floor(value / 7);
                unitKey = unit.unitKey2;
            }

            let unitName = translateService.t(`date.${unitKey}`);
            let unitNameParts = unitName.split('|');

            if (value > 1) unitName = unitNameParts[1];
            else unitName = unitNameParts[0];

            return formatStr.replace("{value}", value).replace("{unit}", unitName).replace('{unit:s}', unitNameParts.length > 2 ? unitNameParts[2] : '');
        }

        if (from instanceof Date) from = from.getTime();
        if (to && to instanceof Date) to = to.getTime();
        to = to || new Date().getTime();

        let diff = (from <= to) ? (to - from) : (from - to);
        let { s, m, h, d, M, y } = timeUnits;
        let units = [s, m, h, d, M, y];

        for (let i = 0; i < units.length; i++) {
            diff /= units[i].value;

            if ((i + 1) == units.length) return format(units[i], diff);
            if (units[i + 1].value >= diff) {
                if (minUnit) {
                    let minUnitIndex = units.findIndex(x => x.name == minUnit);
                    if (minUnitIndex !== -1 && minUnitIndex > i) return format(units[minUnitIndex], 1);
                }
                return format(units[i], diff);
            }
        }

        return "";
    }

    formatDate(from, type) {
        if (!(from instanceof Date)) from = new Date(from);

        let dateStr = "";
        let now = this.split(new Date());
        let date = this.split(from);

        if (type && new Date() < this.add(from, 1, 'd')) {
            if (type === true) dateStr = translateService.t('date.today');
            else if (type == 'time') dateStr = this.format(from, this.smallTimeFormat);
            else if (type == 'timepassed') dateStr = this.formatTimePassed(from, new Date());
        }
        else {
            dateStr = `${date.day} ${this.getMonthName(date.month + 1, true)}`;
            if (date.year != now.year || type === false) dateStr += ` ${date.year}`;
        }

        return dateStr;
    }

    getMonthName(month, short) {
       
        switch (month) {
            case 1: return translateService.t(`months.january${short ? "Short" : ""}`);
            case 2: return translateService.t(`months.february${short ? "Short" : ""}`);
            case 3: return translateService.t(`months.march${short ? "Short" : ""}`);
            case 4: return translateService.t(`months.april${short ? "Short" : ""}`);
            case 5: return translateService.t(`months.may${short ? "Short" : ""}`);
            case 6: return translateService.t(`months.june${short ? "Short" : ""}`);
            case 7: return translateService.t(`months.july${short ? "Short" : ""}`);
            case 8: return translateService.t(`months.august${short ? "Short" : ""}`);
            case 9: return translateService.t(`months.september${short ? "Short" : ""}`);
            case 10: return translateService.t(`months.october${short ? "Short" : ""}`);
            case 11: return translateService.t(`months.november${short ? "Short" : ""}`);
            case 12: return translateService.t(`months.december${short ? "Short" : ""}`);
            default: return "";
        }
    }

    getWeekName(week, short) {
        switch (week) {
            case 1: return translateService.t(`weeks.sunday${short ? "Short" : ""}`);
            case 2: return translateService.t(`weeks.monday${short ? "Short" : ""}`);
            case 3: return translateService.t(`weeks.tuesday${short ? "Short" : ""}`);
            case 4: return translateService.t(`weeks.wednesday${short ? "Short" : ""}`);
            case 5: return translateService.t(`weeks.thursday${short ? "Short" : ""}`);
            case 6: return translateService.t(`weeks.friday${short ? "Short" : ""}`);
            case 7: return translateService.t(`weeks.saturday${short ? "Short" : ""}`);
            default: return "";
        }
    }

    duration(duration, type) {
        duration = duration || 0;

        let format = arg => {
            arg = arg.toString();
            return arg.length < 2 ? ('0' + arg) : arg;
        }

        let seconds = Math.floor(duration % 60);
        let minutes = Math.floor(duration / 60);
        let houres = Math.floor(duration / 60 / 60)

        if (!type) {
            if (!houres) type = 's';
            else type = 'l';
        }

        if (type == 's') return `${format(minutes)}:${format(seconds)}`;
        if (type == 'l') return `${format(houres)}:${format(minutes)}:${format(seconds)}`;
    }
}

export default new DateHelperService();