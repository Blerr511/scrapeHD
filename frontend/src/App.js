import React, { useCallback, useEffect, useRef, useState } from 'react';
import Loading from './components/Loading';
import Progress from './components/Progress';
import socket from './helpers/socket/createConnection';
import { CheckBox, Settings } from '@material-ui/icons';
import {
    Popover,
    Card,
    makeStyles,
    TextField,
    Checkbox,
    List,
    ListItem,
    Typography,
} from '@material-ui/core';
import MomentUtils from '@date-io/moment';
import { TimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import moment from 'moment';
import useDebounce from './hooks/useDebounce.hook';
import { KeyboardArrowDown } from '@material-ui/icons';
import './App.css';

const useStyles = makeStyles((theme) => ({
    settingsContainer: {
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing(3),
        rowGap: theme.spacing(1),

        '&>span': {
            display: 'flex',
            alignItems: 'center',
            columnGap: theme.spacing(1),
        },
    },
}));
const setOptions = ({
    endTime,
    fileLimit,
    interval,
    startTime,
    extended,
    reviews,
    reviewsCount,
}) => {
    fetch('/api/options', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fileLimit,
            startTime: startTime ? startTime.format('HH:mm') : startTime,
            endTime: endTime ? endTime.format('HH:mm') : endTime,
            interval,
            extended,
            reviews,
            reviewsCount,
        }),
    });
};

const setTimes = (startTime, endTime) => setOptions({ startTime, endTime });
const setOptionInterval = (interval) =>
    setOptions({ interval: Number(interval) * 3600 });
const setOptionsIsTime = (v) => {
    if (!v) setTimes(null, null);
};
const setOptionsFileLimit = (fileLimit) =>
    setOptions({ fileLimit: Number(fileLimit) });
const setOptionsExtended = (extended) => setOptions({ extended });

const setOptionsReviews = (reviews) => setOptions({ reviews });

const setOptionsReviewsCount = (reviewsCount) => setOptions({ reviewsCount });

const App = () => {
    const $input = useRef(null);
    const $downArrow = useRef(null);
    const [showFileListPopover, setShowFileListPopover] = useState(false);
    const classes = useStyles();
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const anchorEl = useRef(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [result, setResult] = useState(null);
    const [resultUpdatedAt, setResultUpdatedAt] = useState(null);
    const [readyFileList, setReadyFileList] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [startTime, _setStartTime] = useState(
        moment().set({ hour: 0, minute: 0 })
    );
    const [endTime, _setEndTime] = useState(
        moment().set({ hour: 23, minute: 59 })
    );
    const setStartTime = useCallback(
        (v) => {
            setTimes(v, endTime);
            _setStartTime(v);
        },
        [endTime]
    );
    const setEndTime = useCallback(
        (v) => {
            setTimes(startTime, v);
            _setEndTime(v);
        },
        [startTime]
    );
    const [interval, _setInterval] = useState(1);
    const setInterval = useDebounce(setOptionInterval, 1000, _setInterval);
    const [isTime, _setIsTime] = useState(false);
    const setIsTime = useDebounce(setOptionsIsTime, 1000, _setIsTime);
    const [fileLimit, _setFileLimit] = useState(10);
    const [extended, _setExtended] = useState(false);
    const [reviews, _setReviews] = useState(false);
    const [reviewsCount, _setReviewsCount] = useState(0);
    const setFileLimit = useDebounce(setOptionsFileLimit, 1000, _setFileLimit);
    const setExtended = useDebounce(setOptionsExtended, 1000, _setExtended);
    const setReviews = useDebounce(setOptionsReviews, 1000, _setReviews);
    const setReviewsCount = useDebounce(
        setOptionsReviewsCount,
        1000,
        _setReviewsCount
    );
    const handleUploadFile = (file) => {
        const fileType = file.name.split('.')[1];
        if (fileType !== 'csv') {
            setFile(null);
            setError(`Expected file type '.csv' but was '.${fileType}'`);
            return;
        } else if (error) setError(null);
        setFile(file);
        setUploading(true);
        const reader = new FileReader();
        reader.onload = function (event) {
            const res = event.target.result;
            const idList = res
                .split('\n')
                .map((el) => String(el).trim())
                .filter((el) => {
                    return (
                        String(el).length &&
                        String(el).toLowerCase() !== 'reference'
                    );
                });
            setResult(null);
            fetch('/api/updateData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: idList }),
            })
                .then((data) => data.json())
                .then(() => setUploading(false))
                .catch((error) => {
                    setUploading(false);
                    setError(String(error?.message || error));
                });
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        socket.on('updateProgress', setProgress);
        socket.on('result', (data) => {
            setResult(data.filePath);
            if (data.updatedAt) setResultUpdatedAt(data.updatedAt);
            else setResultUpdatedAt(null);
        });
        socket.on('filesReady', setReadyFileList);
    }, []);
    useEffect(() => {
        fetch('/api/options')
            .then((data) => data.json())
            .then((data) => {
                if (data.endTime && data.startTime) {
                    _setIsTime(true);
                    _setStartTime(
                        moment().set({
                            hour: data.startTime.split(':')[0],
                            minute: data.startTime.split(':')[1],
                        })
                    );
                    _setEndTime(
                        moment().set({
                            hour: data.endTime.split(':')[0],
                            minute: data.endTime.split(':')[1],
                        })
                    );
                }
                if (data.interval !== undefined) {
                    _setInterval(Math.floor(data.interval / 3600));
                }
                if (data.fileLimit !== undefined) _setFileLimit(data.fileLimit);
                if (data.extended !== undefined) _setExtended(data.extended);
                if (data.reviews !== undefined) _setReviews(data.reviews);
                if (data.reviewsCount !== undefined)
                    _setReviewsCount(data.reviewsCount);
            });
    }, []);

    return (
        <MuiPickersUtilsProvider utils={MomentUtils}>
            <div className="App">
                <input
                    type="file"
                    accept=".csv"
                    ref={$input}
                    onChange={(e) =>
                        e.target.files.length &&
                        handleUploadFile(e.target.files[0])
                    }
                    style={{ display: 'none' }}
                />
                <div id="FileUpload">
                    <div className="wrapper">
                        <div
                            className="upload"
                            onDragOver={(e) => {
                                e.preventDefault();
                            }}
                            onDrop={(e) => {
                                if (
                                    e.dataTransfer.files &&
                                    e.dataTransfer.files.length
                                ) {
                                    handleUploadFile(e.dataTransfer.files[0]);
                                    e.preventDefault();
                                }
                            }}>
                            <p>
                                Drag .csv here or{' '}
                                <span
                                    className="upload__button"
                                    onClick={() => $input.current?.click()}>
                                    Browse
                                </span>
                            </p>
                        </div>
                        {file && (
                            <div className="uploaded">
                                <div className="file">
                                    <div className="file__name">
                                        <p>{file.name}</p>
                                    </div>
                                    {uploading && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                            <Loading
                                                style={{
                                                    width: 30,
                                                    height: 30,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="error">
                                <div className="file">
                                    <div className="error__name">
                                        <p>{error}</p>
                                        <i className="fas fa-times" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <Progress
                            current={progress.current}
                            total={progress.total}
                        />
                        <div className="resultContainer">
                            <div className="downloadContainer">
                                {result && (
                                    <a href={result} download>
                                        Download .xlsx
                                    </a>
                                )}
                            </div>
                            {Boolean(readyFileList?.length) && (
                                <div className="showMoreContainer">
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            justifyContent: 'center',
                                        }}
                                        onClick={() =>
                                            setShowFileListPopover(true)
                                        }>
                                        <Typography>Show old files</Typography>
                                        <KeyboardArrowDown
                                            innerRef={$downArrow}
                                        />
                                    </span>
                                    <Popover
                                        anchorEl={$downArrow.current}
                                        open={showFileListPopover}
                                        onClose={setShowFileListPopover.bind(
                                            null,
                                            false
                                        )}>
                                        <List>
                                            {readyFileList.map((el) => {
                                                return (
                                                    <ListItem key={el}>
                                                        <a href={el} download>
                                                            {
                                                                el.split('/')[
                                                                    el.split(
                                                                        '/'
                                                                    ).length - 1
                                                                ]
                                                            }
                                                        </a>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </Popover>
                                </div>
                            )}
                            {resultUpdatedAt && (
                                <span className="lastUpdateWarning">{`Last update - ${new Date(
                                    resultUpdatedAt
                                ).toLocaleString()}`}</span>
                            )}
                        </div>
                    </div>
                    <Popover
                        open={isPopoverOpen}
                        onClose={setIsPopoverOpen.bind(null, false)}
                        anchorEl={anchorEl.current}>
                        <Card className={classes.settingsContainer}>
                            <table>
                                <tbody>
                                    <tr>
                                        <td width={120} height={50}>
                                            Active Time{' '}
                                            <Checkbox
                                                checked={isTime}
                                                onChange={(e) => {
                                                    setIsTime(e.target.checked);
                                                    if (!e.target.checked) {
                                                        setEndTime(null);
                                                        setStartTime(null);
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td width={80} height={50}>
                                            {isTime && (
                                                <TimePicker
                                                    fullWidth
                                                    label="Start Time"
                                                    value={startTime}
                                                    onChange={(v) => {
                                                        setStartTime(v);

                                                        if (
                                                            Math.abs(
                                                                endTime.unix() -
                                                                    v.unix()
                                                            ) <
                                                            interval * 3600
                                                        ) {
                                                            setInterval(
                                                                Math.floor(
                                                                    Math.abs(
                                                                        (endTime.unix() -
                                                                            v.unix()) /
                                                                            3600
                                                                    )
                                                                )
                                                            );
                                                        }
                                                    }}
                                                    ampm={false}
                                                />
                                            )}
                                        </td>
                                        <td width={80} height={50}>
                                            {isTime && (
                                                <TimePicker
                                                    fullWidth
                                                    label="End Time"
                                                    value={endTime}
                                                    onChange={(v) => {
                                                        setEndTime(v);

                                                        if (
                                                            Math.abs(
                                                                v.unix() -
                                                                    startTime.unix()
                                                            ) <
                                                            interval * 3600
                                                        ) {
                                                            setInterval(
                                                                Math.floor(
                                                                    Math.abs(
                                                                        (v.unix() -
                                                                            startTime.unix()) /
                                                                            3600
                                                                    )
                                                                )
                                                            );
                                                        }
                                                    }}
                                                    ampm={false}
                                                />
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Interval (hours): </td>
                                        <td height={60}>
                                            <TextField
                                                type="number"
                                                value={interval}
                                                onChange={(event) => {
                                                    const v =
                                                        event.target.value;
                                                    if (v > 0 && v < 24) {
                                                        if (
                                                            !isTime ||
                                                            Math.abs(
                                                                endTime.unix() -
                                                                    startTime.unix()
                                                            ) >=
                                                                v * 3600
                                                        ) {
                                                            setInterval(
                                                                event.target
                                                                    .value
                                                            );
                                                        }
                                                    }
                                                }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>File Limit</td>{' '}
                                        <td height={60}>
                                            <TextField
                                                type="number"
                                                value={fileLimit}
                                                onChange={(event) => {
                                                    const v =
                                                        event.target.value;
                                                    if (v <= 50) {
                                                        setFileLimit(v);
                                                    }
                                                }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Extended info</td>
                                        <td>
                                            <Checkbox
                                                checked={extended}
                                                onChange={(e) => {
                                                    setExtended(
                                                        e.target.checked
                                                    );
                                                }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Reviews</td>
                                        <td>
                                            <Checkbox
                                                checked={reviews}
                                                onChange={(e) => {
                                                    setReviews(
                                                        e.target.checked
                                                    );
                                                }}
                                            />
                                        </td>
                                    </tr>
                                    {reviews && (
                                        <tr>
                                            <td>Reviews max count</td>
                                            <td>
                                                <TextField
                                                    type="number"
                                                    value={reviewsCount}
                                                    onChange={(event) => {
                                                        const v =
                                                            event.target.value;
                                                        setReviewsCount(v);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </Popover>
                    <Settings
                        innerRef={anchorEl}
                        style={{
                            cursor: 'pointer',
                        }}
                        onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
                        Click me!
                    </Settings>
                </div>
            </div>
        </MuiPickersUtilsProvider>
    );
};

export default App;
