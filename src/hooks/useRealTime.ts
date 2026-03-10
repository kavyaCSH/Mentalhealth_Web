import { useState, useEffect } from 'react';

export const useRealTimeClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    };

    return {
        raw: time,
        timeString: formatTime(time),
        dateString: formatDate(time),
    };
};

export const useSessionCountdown = (targetTime: string) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const target = new Date();
        const [hours, minutes] = targetTime.split(':');
        target.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const timer = setInterval(() => {
            const now = new Date();
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Starting Now');
                clearInterval(timer);
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${h}h ${m}m ${s}s`);
        }, 1000);

        return () => clearInterval(timer);
    }, [targetTime]);

    return timeLeft;
};
