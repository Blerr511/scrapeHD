import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import Loading from './components/Loading';
import Progress from './components/Progress';
import socket from './helpers/socket/createConnection';

const App = () => {
    const $input = useRef(null);
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [result, setResult] = useState(null);
    const [resultUpdatedAt, setResultUpdatedAt] = useState(null);
    const [uploading, setUploading] = useState(false);
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
    }, []);

    return (
        <div className="App">
            <input
                type="file"
                ref={$input}
                onChange={(e) =>
                    e.target.files.length && handleUploadFile(e.target.files[0])
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
                            Drag files here or{' '}
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
                        {result && (
                            <div className="downloadContainer">
                                <a href={result}>Download .xlsx</a>
                            </div>
                        )}
                        {resultUpdatedAt && (
                            <span className="lastUpdateWarning">{`Last update - ${new Date(
                                resultUpdatedAt
                            ).toLocaleString()}`}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
