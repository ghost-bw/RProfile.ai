import React, { createContext, useState, useContext } from 'react';

const FileContext = createContext();

export const FileProvider = ({ children }) => {
    const [sharedFile, setSharedFile] = useState(null);

    return (
        <FileContext.Provider value={{ sharedFile, setSharedFile }}>
            {children}
        </FileContext.Provider>
    );
};

export const useFile = () => useContext(FileContext);
