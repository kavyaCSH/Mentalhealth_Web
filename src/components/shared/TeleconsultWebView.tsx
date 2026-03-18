import React from 'react';

interface TeleconsultWebViewProps {
    token: string;
    baseUrl: string;
    onLoad?: () => void;
    hideMenu?: boolean;
}

const TeleconsultWebView: React.FC<TeleconsultWebViewProps> = ({ token, baseUrl, onLoad, hideMenu }) => {
    const url = `${baseUrl}${token}${hideMenu ? '?hideMenu=true' : ''}`;
    
    return (
        <iframe
            src={url}
            className="w-full h-full border-none bg-slate-900"
            allow="camera; microphone; display-capture; autoplay; encrypted-media; fullscreen;"
            onLoad={onLoad}
            title="Teleconsultation"
        />
    );
};

export default TeleconsultWebView;
