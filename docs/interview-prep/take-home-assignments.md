# Take-Home Assignments with Solutions

**Purpose**: Practice realistic take-home coding assignments given by FAANG and top tech companies with complete solutions and explanations.

---

## What are Take-Home Assignments?

Take-home assignments are coding projects given during the interview process:

**Typical format:**
```markdown
Duration: 2-8 hours (you have 3-7 days to complete)
Submission: GitHub repository + README
Evaluation: Code quality, architecture, documentation, testing

What they test:
✅ Real-world coding ability
✅ System design choices
✅ Code organization and cleanliness
✅ Testing approach
✅ Documentation quality
✅ Git usage (meaningful commits)
```

**Tips for success:**
```markdown
✅ Read requirements carefully (twice)
✅ Ask clarifying questions if ambiguous
✅ Start with working MVP, then enhance
✅ Write tests (very important!)
✅ Document your decisions and trade-offs
✅ Clean up code before submission
✅ Make meaningful git commits
✅ Include README with setup instructions
❌ Don't over-engineer
❌ Don't skip testing
❌ Don't submit without running one more time
```

---

## Assignment 1: CI/CD Pipeline Builder

### The Problem

```markdown
Company: Mid-size tech company
Time: 4-6 hours
Level: Mid to Senior

Task:
Build a command-line tool that:
1. Reads a configuration file (YAML)
2. Executes a CI/CD pipeline based on the config
3. Supports stages: build, test, deploy
4. Handles failures and rollbacks
5. Outputs logs to console and file

Example config.yml:
```yaml
pipeline:
  name: "My App Pipeline"
  stages:
    - name: build
      commands:
        - npm install
        - npm run build
      artifacts:
        - dist/**

    - name: test
      commands:
        - npm test
      retry: 3

    - name: deploy
      commands:
        - ./deploy.sh production
      manual_approval: true
```

Requirements:
- Python or Node.js
- Unit tests (75%+ coverage)
- Error handling
- Logging
- README with examples

Deliverables:
- GitHub repository
- Working code with tests
- README with setup and usage
```

### Solution Architecture

```markdown
Project Structure:

pipeline-runner/
├── src/
│   ├── config_parser.py      # Parse YAML config
│   ├── stage_executor.py     # Execute individual stages
│   ├── pipeline_runner.py    # Main pipeline orchestrator
│   └── logger.py             # Logging utility
├── tests/
│   ├── test_config_parser.py
│   ├── test_stage_executor.py
│   └── test_pipeline_runner.py
├── examples/
│   └── sample-config.yml
├── requirements.txt
├── README.md
└── main.py

Design decisions:
✅ Separate concerns (parsing, execution, logging)
✅ Testable components (dependency injection)
✅ Extensible (easy to add new stage types)
✅ Clear error messages
```

### Implementation

**main.py**
```python
#!/usr/bin/env python3
"""
CI/CD Pipeline Runner
Executes stages defined in YAML configuration file
"""

import sys
import argparse
from src.config_parser import ConfigParser
from src.pipeline_runner import PipelineRunner
from src.logger import setup_logger

def main():
    parser = argparse.ArgumentParser(description='Run CI/CD pipeline')
    parser.add_argument('config', help='Path to pipeline configuration file')
    parser.add_argument('--log-file', default='pipeline.log', help='Log file path')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode')
    args = parser.parse_args()

    # Setup logging
    logger = setup_logger(args.log_file)

    try:
        # Parse configuration
        logger.info(f"Loading configuration from {args.config}")
        config = ConfigParser.parse(args.config)

        # Run pipeline
        logger.info(f"Starting pipeline: {config['name']}")
        runner = PipelineRunner(config, logger, dry_run=args.dry_run)

        success = runner.run()

        if success:
            logger.info("Pipeline completed successfully!")
            sys.exit(0)
        else:
            logger.error("Pipeline failed!")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
```

**src/config_parser.py**
```python
import yaml
from typing import Dict, Any

class ConfigParser:
    """Parse and validate pipeline configuration"""

    @staticmethod
    def parse(config_path: str) -> Dict[str, Any]:
        """
        Parse YAML configuration file

        Args:
            config_path: Path to config file

        Returns:
            Parsed configuration dictionary

        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If config is invalid
        """
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML: {str(e)}")

        # Validate configuration
        ConfigParser._validate(config)

        return config['pipeline']

    @staticmethod
    def _validate(config: Dict[str, Any]) -> None:
        """Validate configuration structure"""
        if 'pipeline' not in config:
            raise ValueError("Config must have 'pipeline' key")

        pipeline = config['pipeline']

        if 'name' not in pipeline:
            raise ValueError("Pipeline must have a 'name'")

        if 'stages' not in pipeline or not pipeline['stages']:
            raise ValueError("Pipeline must have at least one stage")

        for stage in pipeline['stages']:
            if 'name' not in stage:
                raise ValueError("Each stage must have a 'name'")
            if 'commands' not in stage or not stage['commands']:
                raise ValueError(f"Stage '{stage['name']}' must have commands")
```

**src/stage_executor.py**
```python
import subprocess
import logging
from typing import List, Dict, Any

class StageExecutor:
    """Execute individual pipeline stage"""

    def __init__(self, stage: Dict[str, Any], logger: logging.Logger, dry_run: bool = False):
        self.stage = stage
        self.logger = logger
        self.dry_run = dry_run

    def execute(self) -> bool:
        """
        Execute all commands in stage

        Returns:
            True if stage succeeded, False otherwise
        """
        stage_name = self.stage['name']
        self.logger.info(f"Starting stage: {stage_name}")

        # Check for manual approval
        if self.stage.get('manual_approval', False):
            if not self.dry_run:
                self._request_approval()

        # Execute commands
        commands = self.stage['commands']
        retry_count = self.stage.get('retry', 1)

        for attempt in range(retry_count):
            if attempt > 0:
                self.logger.info(f"Retry attempt {attempt + 1}/{retry_count}")

            if self._execute_commands(commands):
                self.logger.info(f"Stage '{stage_name}' completed successfully")
                return True

            if attempt < retry_count - 1:
                self.logger.warning(f"Stage '{stage_name}' failed, retrying...")

        self.logger.error(f"Stage '{stage_name}' failed after {retry_count} attempts")
        return False

    def _execute_commands(self, commands: List[str]) -> bool:
        """Execute list of commands"""
        for cmd in commands:
            self.logger.info(f"Executing: {cmd}")

            if self.dry_run:
                self.logger.info("[DRY RUN] Would execute command")
                continue

            try:
                result = subprocess.run(
                    cmd,
                    shell=True,
                    check=True,
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minute timeout
                )

                if result.stdout:
                    self.logger.debug(result.stdout)

            except subprocess.CalledProcessError as e:
                self.logger.error(f"Command failed: {cmd}")
                self.logger.error(f"Exit code: {e.returncode}")
                if e.stderr:
                    self.logger.error(f"Error output: {e.stderr}")
                return False

            except subprocess.TimeoutExpired:
                self.logger.error(f"Command timed out: {cmd}")
                return False

        return True

    def _request_approval(self) -> None:
        """Request manual approval before proceeding"""
        stage_name = self.stage['name']
        self.logger.info(f"Manual approval required for stage: {stage_name}")

        response = input(f"Approve stage '{stage_name}'? (yes/no): ")

        if response.lower() not in ['yes', 'y']:
            raise Exception(f"Stage '{stage_name}' was not approved")
```

**src/pipeline_runner.py**
```python
import logging
from typing import Dict, Any, List
from src.stage_executor import StageExecutor

class PipelineRunner:
    """Orchestrate pipeline execution"""

    def __init__(self, config: Dict[str, Any], logger: logging.Logger, dry_run: bool = False):
        self.config = config
        self.logger = logger
        self.dry_run = dry_run
        self.stages: List[Dict[str, Any]] = config['stages']

    def run(self) -> bool:
        """
        Execute all pipeline stages in order

        Returns:
            True if all stages succeeded, False otherwise
        """
        total_stages = len(self.stages)

        for i, stage in enumerate(self.stages, 1):
            self.logger.info(f"Stage {i}/{total_stages}")

            executor = StageExecutor(stage, self.logger, self.dry_run)

            try:
                success = executor.execute()

                if not success:
                    self.logger.error("Pipeline stopped due to stage failure")
                    return False

            except Exception as e:
                self.logger.error(f"Unexpected error in stage: {str(e)}")
                return False

        return True
```

**src/logger.py**
```python
import logging
import sys

def setup_logger(log_file: str) -> logging.Logger:
    """
    Setup logger with console and file handlers

    Args:
        log_file: Path to log file

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger('pipeline')
    logger.setLevel(logging.DEBUG)

    # Console handler (INFO and above)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)

    # File handler (DEBUG and above)
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger
```

**tests/test_config_parser.py**
```python
import pytest
import yaml
import tempfile
from src.config_parser import ConfigParser

def test_parse_valid_config():
    """Test parsing valid configuration"""
    config = """
pipeline:
  name: "Test Pipeline"
  stages:
    - name: build
      commands:
        - echo "Building"
"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
        f.write(config)
        f.flush()

        result = ConfigParser.parse(f.name)

        assert result['name'] == "Test Pipeline"
        assert len(result['stages']) == 1
        assert result['stages'][0]['name'] == 'build'

def test_parse_missing_pipeline_key():
    """Test error when 'pipeline' key is missing"""
    config = """
name: "Test Pipeline"
"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
        f.write(config)
        f.flush()

        with pytest.raises(ValueError, match="must have 'pipeline' key"):
            ConfigParser.parse(f.name)

def test_parse_missing_file():
    """Test error when config file doesn't exist"""
    with pytest.raises(FileNotFoundError):
        ConfigParser.parse('nonexistent.yml')

def test_parse_invalid_yaml():
    """Test error when YAML is malformed"""
    config = """
pipeline:
  name: "Test
  stages: [broken
"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
        f.write(config)
        f.flush()

        with pytest.raises(ValueError, match="Invalid YAML"):
            ConfigParser.parse(f.name)
```

**README.md**
```markdown
# CI/CD Pipeline Runner

A command-line tool for executing CI/CD pipelines defined in YAML configuration.

## Features

✅ Execute multi-stage pipelines
✅ Automatic retry on failure
✅ Manual approval gates
✅ Comprehensive logging (console + file)
✅ Dry-run mode
✅ Error handling with clear messages

## Installation

```bash
# Clone repository
git clone https://github.com/you/pipeline-runner.git
cd pipeline-runner

# Install dependencies
pip install -r requirements.txt
```

## Usage

```bash
# Run pipeline
python main.py config.yml

# Dry run (don't execute commands)
python main.py config.yml --dry-run

# Custom log file
python main.py config.yml --log-file my-pipeline.log
```

## Configuration Format

```yaml
pipeline:
  name: "My Application Pipeline"

  stages:
    - name: build
      commands:
        - npm install
        - npm run build

    - name: test
      commands:
        - npm test
      retry: 3  # Retry up to 3 times on failure

    - name: deploy
      commands:
        - ./deploy.sh production
      manual_approval: true  # Require manual approval
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Coverage should be 75%+
```

## Design Decisions

### Modular Architecture
Separated concerns into distinct modules:
- `config_parser`: Configuration parsing and validation
- `stage_executor`: Execute individual stages
- `pipeline_runner`: Orchestrate overall pipeline
- `logger`: Centralized logging

### Error Handling
- Validates configuration before execution
- Graceful failure with clear error messages
- Automatic retry for transient failures
- Timeout protection (5 minutes per command)

### Extensibility
Easy to add new features:
- New stage types (e.g., "build_docker", "deploy_k8s")
- Different configuration formats (JSON, TOML)
- Notifications (Slack, email)
- Parallel stage execution

### Trade-offs

**Chosen: Shell command execution**
- Pro: Flexible, works with any tool
- Con: Security risk (command injection)
- Mitigation: Validate commands, run in isolated environment

**Chosen: Sequential stage execution**
- Pro: Simple, predictable
- Con: Slower than parallel
- Future: Add parallel execution with dependencies

## Future Enhancements

- [ ] Parallel stage execution
- [ ] Conditional stages (if/else)
- [ ] Environment variables support
- [ ] Secrets management integration
- [ ] Docker container execution
- [ ] Web UI for monitoring
- [ ] Slack/email notifications

## Time Spent

- Configuration parsing: 1 hour
- Stage execution: 1.5 hours
- Testing: 1.5 hours
- Documentation: 1 hour
- **Total: 5 hours**

## Author

Your Name - [your.email@example.com](mailto:your.email@example.com)
```

### Why This Solution Works

```markdown
✅ Complete MVP with core functionality
✅ Clean, modular code (easy to understand and extend)
✅ Comprehensive error handling
✅ Good test coverage (75%+)
✅ Excellent documentation
✅ Shows engineering judgment (trade-offs documented)
✅ Professional git history (meaningful commits)

Example git commits:
1. "Initial project structure"
2. "Add configuration parser with validation"
3. "Implement stage executor with retry logic"
4. "Add pipeline orchestrator"
5. "Implement logging utility"
6. "Add comprehensive test suite"
7. "Add README with examples and design decisions"
8. "Final cleanup and polish"
```

---

## Assignment 2: Kubernetes Deployment Health Checker

### The Problem

```markdown
Company: Cloud-native startup
Time: 3-4 hours
Level: Senior

Task:
Build a tool that monitors Kubernetes deployments and reports health status.

Requirements:
1. Check all deployments in a namespace
2. Verify:
   - All desired replicas are running
   - All pods are healthy
   - No restarts in last 10 minutes
   - Resource usage under 80% (CPU, memory)
3. Output JSON report
4. Exit code 0 if all healthy, 1 if any unhealthy
5. Support --watch mode (continuous monitoring)

Language: Python or Go
Must include: Unit tests, README

Bonus:
- Send alerts to Slack
- Support multiple namespaces
- Pretty-printed table output
```

### Solution (Python)

**deployment_checker.py**
```python
#!/usr/bin/env python3
"""
Kubernetes Deployment Health Checker
Monitors deployment health and reports issues
"""

import sys
import argparse
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
from kubernetes import client, config
from kubernetes.client.rest import ApiException

class DeploymentHealthChecker:
    """Check health of Kubernetes deployments"""

    def __init__(self, namespace: str = 'default'):
        """Initialize Kubernetes client"""
        try:
            config.load_kube_config()
        except:
            config.load_incluster_config()

        self.apps_v1 = client.AppsV1Api()
        self.core_v1 = client.CoreV1Api()
        self.namespace = namespace

    def check_all_deployments(self) -> Dict[str, Any]:
        """
        Check health of all deployments in namespace

        Returns:
            Health report dictionary
        """
        try:
            deployments = self.apps_v1.list_namespaced_deployment(self.namespace)
        except ApiException as e:
            print(f"Error listing deployments: {e}", file=sys.stderr)
            return {'error': str(e), 'healthy': False}

        report = {
            'namespace': self.namespace,
            'timestamp': datetime.now().isoformat(),
            'deployments': [],
            'healthy': True
        }

        for deployment in deployments.items:
            deployment_report = self._check_deployment(deployment)
            report['deployments'].append(deployment_report)

            if not deployment_report['healthy']:
                report['healthy'] = False

        return report

    def _check_deployment(self, deployment) -> Dict[str, Any]:
        """Check health of single deployment"""
        name = deployment.metadata.name
        spec = deployment.spec
        status = deployment.status

        issues = []

        # Check replica count
        desired_replicas = spec.replicas or 0
        ready_replicas = status.ready_replicas or 0

        if ready_replicas < desired_replicas:
            issues.append(
                f"Only {ready_replicas}/{desired_replicas} replicas ready"
            )

        # Check pods
        pod_issues = self._check_pods(name)
        issues.extend(pod_issues)

        return {
            'name': name,
            'desired_replicas': desired_replicas,
            'ready_replicas': ready_replicas,
            'healthy': len(issues) == 0,
            'issues': issues
        }

    def _check_pods(self, deployment_name: str) -> List[str]:
        """Check health of pods for deployment"""
        issues = []

        try:
            pods = self.core_v1.list_namespaced_pod(
                self.namespace,
                label_selector=f"app={deployment_name}"
            )
        except ApiException as e:
            return [f"Error listing pods: {e}"]

        for pod in pods.items:
            # Check pod phase
            if pod.status.phase != 'Running':
                issues.append(
                    f"Pod {pod.metadata.name} is {pod.status.phase}"
                )
                continue

            # Check container restarts
            restart_threshold = datetime.now() - timedelta(minutes=10)

            for container_status in pod.status.container_statuses or []:
                restart_count = container_status.restart_count

                if restart_count > 0:
                    # Check if restart was recent
                    if container_status.last_state.terminated:
                        finished_at = container_status.last_state.terminated.finished_at
                        if finished_at and finished_at > restart_threshold:
                            issues.append(
                                f"Pod {pod.metadata.name} container {container_status.name} "
                                f"restarted recently ({restart_count} total restarts)"
                            )

            # Check resource usage
            resource_issues = self._check_resource_usage(pod)
            issues.extend(resource_issues)

        return issues

    def _check_resource_usage(self, pod) -> List[str]:
        """Check if resource usage is under 80%"""
        issues = []

        # This would require metrics-server
        # Simplified version for demo
        # In production, use metrics_client.get_pod_metrics()

        return issues

def main():
    parser = argparse.ArgumentParser(description='Check Kubernetes deployment health')
    parser.add_argument('--namespace', default='default', help='Namespace to check')
    parser.add_argument('--watch', action='store_true', help='Continuous monitoring')
    parser.add_argument('--interval', type=int, default=30, help='Watch interval in seconds')
    parser.add_argument('--format', choices=['json', 'table'], default='json', help='Output format')
    args = parser.parse_args()

    checker = DeploymentHealthChecker(args.namespace)

    def check_and_report():
        report = checker.check_all_deployments()

        if args.format == 'json':
            print(json.dumps(report, indent=2))
        else:
            print_table(report)

        return report['healthy']

    if args.watch:
        print(f"Watching deployments in namespace '{args.namespace}' every {args.interval}s...")
        print("Press Ctrl+C to stop")

        try:
            while True:
                check_and_report()
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nStopped watching")
            sys.exit(0)
    else:
        healthy = check_and_report()
        sys.exit(0 if healthy else 1)

def print_table(report: Dict[str, Any]):
    """Print report as table"""
    print(f"\nNamespace: {report['namespace']}")
    print(f"Timestamp: {report['timestamp']}")
    print(f"Overall Health: {'✅ HEALTHY' if report['healthy'] else '❌ UNHEALTHY'}\n")

    print(f"{'Deployment':<30} {'Replicas':<12} {'Status':<10} {'Issues'}")
    print("-" * 100)

    for deployment in report['deployments']:
        name = deployment['name']
        replicas = f"{deployment['ready_replicas']}/{deployment['desired_replicas']}"
        status = "✅" if deployment['healthy'] else "❌"
        issues = "; ".join(deployment['issues']) if deployment['issues'] else "-"

        print(f"{name:<30} {replicas:<12} {status:<10} {issues}")

if __name__ == '__main__':
    main()
```

**Example Output (JSON):**
```json
{
  "namespace": "production",
  "timestamp": "2024-01-15T10:30:00.123456",
  "healthy": false,
  "deployments": [
    {
      "name": "api-server",
      "desired_replicas": 3,
      "ready_replicas": 3,
      "healthy": true,
      "issues": []
    },
    {
      "name": "worker",
      "desired_replicas": 5,
      "ready_replicas": 3,
      "healthy": false,
      "issues": [
        "Only 3/5 replicas ready",
        "Pod worker-abc123 is Pending",
        "Pod worker-def456 container app restarted recently (2 total restarts)"
      ]
    }
  ]
}
```

---

## Assignment 3: Log Analysis Tool

### The Problem (Shorter Version)

```markdown
Task: Build a CLI tool that analyzes web server logs

Input: Apache/Nginx access logs
Output: Statistics (requests/sec, top IPs, error rate, etc.)

Time: 2-3 hours
```

### Solution Highlights

```python
# Key features:
- Parse log files (supports Apache, Nginx formats)
- Calculate metrics (requests/sec, p95 latency, error rate)
- Find top IPs, URLs, user agents
- Detect anomalies (sudden spikes, unusual patterns)
- Output JSON or text report

# Example usage:
python log_analyzer.py access.log --format nginx --top 10
```

---

## Common Evaluation Criteria

Companies evaluate your take-home on:

```markdown
**Code Quality (30%)**
✅ Clean, readable code
✅ Good variable/function names
✅ Proper error handling
✅ No code smells

**Architecture (25%)**
✅ Modular design
✅ Separation of concerns
✅ Extensible
✅ Appropriate design patterns

**Testing (20%)**
✅ Unit tests for core logic
✅ Good test coverage (75%+)
✅ Tests actually test something meaningful
✅ Edge cases covered

**Documentation (15%)**
✅ Clear README
✅ Setup instructions that work
✅ Examples provided
✅ Design decisions explained

**Git Usage (10%)**
✅ Meaningful commit messages
✅ Logical commit history
✅ No "final final v2 FINAL" commits
✅ .gitignore appropriate
```

---

## Time Management

**For a 4-hour assignment:**

```markdown
Hour 1: Understand & Plan
- Read requirements (15 min)
- Ask clarifying questions (15 min)
- Design architecture (30 min)

Hour 2-3: Core Implementation
- MVP functionality (90 min)
- Error handling (30 min)

Hour 3-4: Polish
- Tests (45 min)
- Documentation (30 min)
- Final testing (15 min)
```

**If running out of time:**
```markdown
Priority 1 (Must have):
✅ Core functionality works
✅ Basic tests
✅ README with setup instructions

Priority 2 (Should have):
✅ Good test coverage
✅ Error handling
✅ Examples

Priority 3 (Nice to have):
✅ Bonus features
✅ Performance optimization
✅ Pretty output
```

---

## Red Flags to Avoid

```markdown
❌ Code doesn't run
❌ No tests at all
❌ No README or setup instructions
❌ Over-engineered (using frameworks when simple code works)
❌ Security issues (hardcoded secrets, SQL injection)
❌ Bad git history (one giant commit)
❌ Copied code without attribution
❌ Doesn't meet requirements
```

---

## Final Tips

1. **Read requirements twice** - Don't miss anything
2. **Start simple** - MVP first, then enhance
3. **Test as you go** - Don't leave testing to the end
4. **Commit frequently** - Show your thought process
5. **Document decisions** - Explain trade-offs in README
6. **Triple-check before submitting** - Run everything one more time

**Remember:** Companies care more about how you think and communicate than perfect code. Show your engineering judgment!

**Good luck!** 🚀
