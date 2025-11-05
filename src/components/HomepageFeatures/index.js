import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '🎓 Beginner-Friendly',
    icon: '📚',
    description: (
      <>
        Start from zero knowledge and progress to production-ready DevOps engineer.
        11 foundation topics with hands-on examples and real scenarios.
      </>
    ),
  },
  {
    title: '💼 Interview Ready',
    icon: '🎯',
    description: (
      <>
        100+ technical questions, system design prep, salary negotiation guide ($75K-$450K+),
        and take-home assignment examples.
      </>
    ),
  },
  {
    title: '🚀 Production Skills',
    icon: '⚡',
    description: (
      <>
        Real-world CI/CD pipelines, GitLab & GitHub Actions, automated testing,
        multi-environment deployments, and 8 hands-on labs.
      </>
    ),
  },
  {
    title: '📊 Career Guidance',
    icon: '💰',
    description: (
      <>
        Complete career progression roadmap from Junior ($75K) to Principal ($450K+).
        Learn what skills and impact are needed at each level.
      </>
    ),
  },
  {
    title: '🛠️ Hands-On Labs',
    icon: '💻',
    description: (
      <>
        8 complete labs building a production-ready portfolio project with
        CI/CD, testing, monitoring, and multi-environment deployments.
      </>
    ),
  },
  {
    title: '📖 50K+ Words',
    icon: '📝',
    description: (
      <>
        Comprehensive guides covering Git workflows, branching strategies,
        DevOps Center, sandbox architecture, and real-world scenarios.
      </>
    ),
  },
];

function Feature({icon, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
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
        <div className={styles.featuresHeader}>
          <Heading as="h2">Why This Guide Stands Out</Heading>
          <p>Everything you need in one comprehensive, free resource</p>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
