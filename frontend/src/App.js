import React, { useRef, useState } from 'react';
import './App.css';
const urlEncode = (data) => {
    let formBody = [];
    for (const property in data) {
        const encodedKey = encodeURIComponent(property);
        const encodedValue = encodeURIComponent(data[property]);
        formBody.push(encodedKey + '=' + encodedValue);
    }
    formBody = formBody.join('&');

    return formBody;
};
function App() {
    const $input = useRef(null);
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const handleUploadFile = (file) => {
        const fileType = file.name.split('.')[1];
        if (fileType !== 'csv') {
            setFile(null);
            setError(`Expected file type '.csv' but was '.${fileType}'`);
            return;
        } else if (error) setError(null);
        setFile(file);
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
            fetch('/api/updateData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: idList }),
            })
                .then((data) => data.json())
                .then(console.log);
        };
        reader.readAsText(file);
    };
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
                                    <i className="fas fa-times" />
                                </div>
                                <div className="progress">
                                    <div
                                        className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                                        style={{ width: '20%' }}
                                    />
                                </div>
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
                                <div className="progress">
                                    <div
                                        className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                                        style={{ width: '20%' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
