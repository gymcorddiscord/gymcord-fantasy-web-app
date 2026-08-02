import { Link } from 'react-router-dom';

type Credit = {
    name: string;
    role: string;
    license: string;
    href: string;
};

type CreditGroup = {
    title: string;
    items: Credit[];
};

const CREDIT_GROUPS: CreditGroup[] = [
    {
        title: 'Frontend',
        items: [
            { name: 'React & React DOM', role: 'UI library', license: 'MIT', href: 'https://react.dev' },
            { name: 'React Router', role: 'Client-side routing', license: 'MIT', href: 'https://reactrouter.com' },
            { name: 'Vite', role: 'Dev server & build tool', license: 'MIT', href: 'https://vitejs.dev' },
            { name: 'TypeScript', role: 'Static typing', license: 'Apache-2.0', href: 'https://www.typescriptlang.org' },
        ],
    },
    {
        title: 'Backend & data',
        items: [
            {
                name: 'Supabase',
                role: 'Postgres database, Discord auth, and auto-generated REST API',
                license: 'Apache-2.0',
                href: 'https://supabase.com',
            },
            {
                name: 'PostgreSQL',
                role: 'Relational database powering Supabase',
                license: 'PostgreSQL License',
                href: 'https://www.postgresql.org',
            },
        ],
    },
    {
        title: 'Typography & icons',
        items: [
            {
                name: 'M PLUS 1p',
                role: 'Primary typeface, served via Google Fonts',
                license: 'SIL Open Font License 1.1',
                href: 'https://fonts.google.com/specimen/M+PLUS+1p',
            },
            {
                name: 'Space Mono',
                role: 'Score & stat digit typeface, served via Google Fonts',
                license: 'SIL Open Font License 1.1',
                href: 'https://fonts.google.com/specimen/Space+Mono',
            },
            {
                name: 'Phosphor Icons',
                role: 'Icon set used throughout the Gymcord design system',
                license: 'MIT',
                href: 'https://phosphoricons.com',
            },
        ],
    },
    {
        title: 'Deployment',
        items: [
            {
                name: 'GitHub Actions',
                role: 'Builds and deploys this site on every push',
                license: 'MIT',
                href: 'https://github.com/actions',
            },
        ],
    },
];

export function Credits() {
    return (
        <main className="page">
            <h1 className="page-title">Credits</h1>
            <p className="page-subtitle">
                Gymcord Fantasy is built on the open source projects below. Thanks to everyone who
                builds and maintains them.
            </p>

            {CREDIT_GROUPS.map((group) => (
                <section key={group.title} className="credits-group">
                    <h2 className="section-title">{group.title}</h2>
                    <div className="credits-list">
                        {group.items.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="credits-item"
                            >
                                <div className="credits-item__main">
                                    <span className="credits-item__name">{item.name}</span>
                                    <span className="credits-item__role">{item.role}</span>
                                </div>
                                <span className="badge badge-muted">{item.license}</span>
                            </a>
                        ))}
                    </div>
                </section>
            ))}

            <p className="credits-footnote">
                <Link to="/">Back home</Link>
            </p>
        </main>
    );
}
