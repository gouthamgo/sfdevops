import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Beginner-Friendly Learning Path',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Start from zero knowledge and progress to production-ready DevOps engineer.
        7 foundation topics with hands-on examples, real scenarios, and practical exercises.
        No prerequisites required.
      </>
    ),
  },
  {
    title: 'Interview Prep & Git Mastery',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Master Git branching strategies, daily workflows, and 30+ technical interview questions.
        Build a portfolio with 5 projects. STAR method for behavioral interviews.
        Get ready for DevOps Lead roles.
      </>
    ),
  },
  {
    title: 'Real-World CI/CD Pipelines',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Learn GitLab CI/CD, automated testing, deployment strategies, and production troubleshooting.
        50,000+ words of content with code examples, diagrams, and complete workflows you can use immediately.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
