const setTimeoutInterval = (callback, timeout, ...argv) => {
    let tmr = null;
    const setTimer = () => {
        tmr = setTimeout(
            (...argv) => {
                callback(...argv);
                setTimer();
            },
            timeout,
            ...argv
        );
    };
    setTimer();
    return () => tmr;
};

module.exports.setTimeoutInterval = setTimeoutInterval;
