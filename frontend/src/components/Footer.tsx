import { Footer as DSFooter } from 'gymcord-design-system';

const VERSION = 'v0.2.0';

export function Footer() {
    return <DSFooter version={VERSION} links={[{ label: 'Credits', href: '#/credits', external: false }]} />;
}
