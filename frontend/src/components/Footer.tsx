import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="app-footer">
            Made with &lt;3 by Gymcord &middot; v0.1.1 &middot;{' '}
            <a href="https://gymcorddiscord.github.io/gymcord-home/terms.html" target="_blank" rel="noopener noreferrer">
                Terms &amp; Privacy
            </a>{' '}
            &middot; <Link to="/credits">Credits</Link>
        </footer>
    );
}
