import React from 'react';
import './style.css';

const Progress = ({ current, total }) => {
    return (
        <div
            className="container"
            style={{ opacity: total > 0 && current !== total ? 1 : 0 }}>
            <span>{`${current} of ${total} models parsed`}</span>
            <div className="progress progress-striped">
                <div
                    className="progress-bar"
                    style={{
                        width: `${total === 0 ? 0 : (current / total) * 100}%`,
                    }}></div>
            </div>
        </div>
    );
};

export default Progress;
