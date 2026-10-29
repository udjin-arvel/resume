import styles from './Breadcrumbs.module.css';
import { Link } from "react-router";

type TPrettify<T> = {
    [K in keyof T]: T[K];
} & {}

interface BreadcrumbConfigItem {
    name: string;
    slug?: string;
}

interface BreadcrumbsProps {
    config: BreadcrumbConfigItem[] | undefined;
}

export const Breadcrumbs: React.FC<TPrettify<BreadcrumbsProps>> = ({ config }) => {
    return (
        <div className={styles.breadcrumbs}>
            {config && config.map((i, id) => {
                if (i.slug) {
                    return (
                        <Link
                            key={id}
                            className={`text_secondary ${styles.breadcrumbs__link}`}
                            to={i.slug}
                            title={i.name}
                            viewTransition
                        >
                            {i.name}
                            <span>/</span>
                        </Link>
                    );
                } else {
                    return (
                        <p
                            className={`text_secondary ${styles.breadcrumbs__endOfTheLine}`}
                            key={id}
                            title={i.name}
                        >
                            {i.name}
                        </p>
                    );
                }

            })}
        </div>
    );
};
