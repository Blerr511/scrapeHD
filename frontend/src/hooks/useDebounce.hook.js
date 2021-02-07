import {useCallback, useRef, useEffect} from 'react';
/**
 * Creates debounced function
 * @param  {function(): *} callback callback
 * @param  {number} timeout debounce timer in milliseconds
 * @param  {function(): *} [fallback] - this callback will ignore debounce and call it every time
 * @returns {function(): *} debounced function
 */
const useDebounce = (callback, timeout = 0, fallback) => {
	const timerRef = useRef();
	const tmpCb = useCallback(
		(...arg) => {
			clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => callback(...arg), timeout);
			fallback && fallback(...arg);
		},
		[callback, fallback, timeout]
	);
	return tmpCb;
};

export default useDebounce;

/**
 * Returns function which will trigger only once at given timeout
 * @param  {function(): *} callback callback
 * @param  {number} timeout repeat timer in milliseconds
 * @returns {function(): *} delayed function
 * ```js
 * const delayed = useDelayedRepeat((v)=>{
 * console.log(v);
 * },1000)
 * delayed(1)
 * delayed(2)
 * delayed(3)
 * setTimeout(() => delayed(4),1200)
 * // 1 4
 * ```
 */
export const useDelayedRepeat = (callback, timeout = 0) => {
	const timerRef = useRef();
	const enabled = useRef(true);
	const cb = useCallback(
		(...arg) => {
			if (enabled.current) {
				callback(...arg);
				enabled.current = false;
				timerRef.current = setTimeout(
					() => (enabled.current = true),
					timeout
				);
			}
		},
		[callback, timeout]
	);
	useEffect(() => {
		return () => clearTimeout(timerRef.current);
	}, []);
	return cb;
};
