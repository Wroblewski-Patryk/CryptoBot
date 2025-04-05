import "../styles/public.css";

export default function Layout({ children }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="description" content="SparrowX - Crypto Trading Bot" />
                <meta name="keywords" content="crypto, trading, bot, SparrowX" />
                <title>SparrowX</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
                <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap');
                </style>
            </head>
            <body>
                {children}
            </body>
        </html>
    );
};
