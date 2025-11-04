# System Design Interview Prep for DevOps

**Purpose**: Master system design interviews with focus on infrastructure, scalability, and DevOps architecture.

---

## What is System Design Interview?

System design interviews evaluate your ability to:
- Design large-scale distributed systems
- Make architectural decisions with trade-offs
- Think about scalability, reliability, and performance
- Communicate technical ideas clearly
- Handle ambiguity

**Typical format:**
```markdown
Duration: 45-60 minutes

Structure:
1. Requirements gathering (5-10 min)
2. High-level design (10-15 min)
3. Deep dive (15-20 min)
4. Discussion and refinement (10-15 min)

Evaluation criteria:
✅ Problem understanding and clarification
✅ High-level architecture
✅ Component deep dives
✅ Scalability and reliability
✅ Trade-off analysis
✅ Communication skills
```

---

## The Framework: How to Approach Any System Design

### Step 1: Clarify Requirements (5-10 minutes)

**Functional Requirements:**
```markdown
Questions to ask:
❓ What features must the system support?
❓ What are the core use cases?
❓ Who are the users and how many?
❓ What's the expected behavior?
❓ Are there any specific constraints?

Example (CI/CD system):
Q: "What type of deployments? Kubernetes, VMs, Salesforce?"
Q: "Do we need to support multiple clouds?"
Q: "What's the target deployment frequency?"
Q: "Should we support rollbacks?"
```

**Non-Functional Requirements:**
```markdown
Scale:
❓ How many users?
❓ Requests per second?
❓ Data volume?
❓ Growth rate?

Performance:
❓ Latency requirements? (p50, p95, p99)
❓ Throughput requirements?

Availability:
❓ What's the uptime SLA? (99.9%? 99.99%?)
❓ Can we have downtime for maintenance?

Consistency:
❓ Strong consistency or eventual consistency?
❓ What happens if systems are out of sync?

Example numbers for CI/CD system:
- 500 teams
- 10,000 deployments per day
- Peak: 100 concurrent deployments
- 10 TB of build artifacts
- 99.9% uptime SLA
```

**Back-of-the-envelope Calculations:**
```markdown
CI/CD system example:

Deployments per day: 10,000
Deployments per second (peak): 10,000 / (24 * 3600) ≈ 0.12/sec average
With 10x peak factor: 1.2 deployments/sec peak

Storage:
- 10,000 deployments/day
- Average build artifacts: 100 MB
- Daily storage: 10,000 * 100 MB = 1 TB/day
- 30-day retention: 30 TB
- With redundancy (3x): 90 TB needed

Compute:
- Average deployment time: 10 minutes
- Concurrent deployments at peak: 100
- Each deployment needs: 2 vCPU, 4 GB RAM
- Total needed: 200 vCPU, 400 GB RAM
```

### Step 2: High-Level Design (10-15 minutes)

**Draw the boxes and arrows:**

```
┌─────────────┐
│   Clients   │ (Developers, CI triggers)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Load Balancer  │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│   API Gateway    │ (Authentication, rate limiting)
└──────┬───────────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────┐   ┌──────────────┐
│   API    │   │   Workers    │ (Execute builds/deployments)
│ Servers  │   │    Pool      │
└────┬─────┘   └───────┬──────┘
     │                 │
     │                 │
     ▼                 ▼
┌─────────────────────────┐
│      Database           │ (PostgreSQL for metadata)
│   (Jobs, Status, Logs)  │
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│   Object Storage (S3)   │ (Build artifacts, logs)
└─────────────────────────┘
```

**Describe data flow:**
```markdown
1. Developer pushes code to GitHub
2. Webhook triggers API Gateway
3. API Server creates job in database
4. Worker pool picks up job
5. Worker:
   - Pulls code from GitHub
   - Builds application
   - Runs tests
   - Uploads artifacts to S3
   - Deploys to target environment
   - Updates job status in database
6. Developer sees status in UI
```

### Step 3: Component Deep Dive (15-20 minutes)

**Pick 2-3 components to deep dive based on interviewer interest**

**API Design:**
```javascript
// POST /api/v1/deployments
{
  "repository": "github.com/company/repo",
  "branch": "main",
  "commit": "abc123",
  "environment": "production",
  "config": {
    "tests": true,
    "rollback_on_failure": true
  }
}

// Response:
{
  "deployment_id": "dep_xyz789",
  "status": "queued",
  "estimated_time": "10m",
  "created_at": "2024-01-15T10:30:00Z"
}

// GET /api/v1/deployments/{deployment_id}
{
  "deployment_id": "dep_xyz789",
  "status": "running",
  "progress": 45,
  "logs_url": "https://logs.example.com/dep_xyz789",
  "started_at": "2024-01-15T10:31:00Z"
}
```

**Database Schema:**
```sql
-- Deployments table
CREATE TABLE deployments (
    id UUID PRIMARY KEY,
    repository VARCHAR(255) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    commit_sha VARCHAR(40) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- queued, running, success, failed
    created_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_repo_env (repository, environment)
);

-- Build logs table
CREATE TABLE build_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    deployment_id UUID NOT NULL,
    log_line TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    log_level VARCHAR(10),
    FOREIGN KEY (deployment_id) REFERENCES deployments(id),
    INDEX idx_deployment_timestamp (deployment_id, timestamp)
);

-- Workers table
CREATE TABLE workers (
    id UUID PRIMARY KEY,
    hostname VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL, -- idle, busy, offline
    last_heartbeat TIMESTAMP NOT NULL,
    current_deployment_id UUID,
    capabilities JSON, -- {languages: ["node", "python"], max_memory: "8GB"}
    INDEX idx_status_heartbeat (status, last_heartbeat)
);
```

**Worker Architecture:**
```markdown
Worker Pool Design:

┌──────────────────────────┐
│    Worker Manager        │
│  (Kubernetes Deployment) │
└──────────┬───────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐  ┌─────────┐
│ Worker  │  │ Worker  │  (Pods with Docker-in-Docker)
│  Pod 1  │  │  Pod 2  │
└─────────┘  └─────────┘

Each worker:
- Runs in Kubernetes pod
- Has Docker daemon (DinD)
- Polls for jobs from queue
- Isolated execution environment
- Auto-scales based on queue depth

Scaling:
- Min replicas: 10
- Max replicas: 100
- Target queue depth: 5 jobs/worker
- Scale up when: queue > 50
- Scale down when: queue < 10 for 5 minutes
```

### Step 4: Scale and Optimize (10-15 minutes)

**Discuss bottlenecks and solutions:**

**Bottleneck 1: Database**
```markdown
Problem: Database becomes bottleneck at 1,000 deployments/sec

Solutions:

Option A: Read Replicas
┌─────────┐
│ Primary │ (Writes only)
└────┬────┘
     │
     ├──────────┬──────────┐
     ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Replica 1│ │Replica 2│ │Replica 3│ (Reads)
└─────────┘ └─────────┘ └─────────┘

Pros: Simple, handles read-heavy workload
Cons: Writes still bottlenecked, eventual consistency

Option B: Sharding by Repository
Shard 1: Repos A-F
Shard 2: Repos G-M
Shard 3: Repos N-T
Shard 4: Repos U-Z

Pros: Scales writes, better isolation
Cons: Complex, cross-shard queries difficult

Option C: Move to NoSQL (DynamoDB, Cassandra)
Pros: Scales horizontally, high write throughput
Cons: Different consistency model, migration effort

Recommendation: Start with Option A (read replicas),
move to Option B (sharding) when needed.
```

**Bottleneck 2: Worker Pool**
```markdown
Problem: Workers can't keep up with demand during peak hours

Solutions:

1. Horizontal scaling (Kubernetes HPA)
   - Auto-scale based on queue depth
   - Scale from 10 to 100 workers in 5 minutes

2. Spot instances / Preemptible VMs
   - 70% cost savings
   - Acceptable for ephemeral workloads
   - Implement job checkpointing

3. Priority queues
   - Production deployments: High priority
   - Staging: Medium priority
   - Development: Low priority

4. Resource right-sizing
   - Small jobs: 1 vCPU, 2 GB RAM
   - Medium jobs: 2 vCPU, 4 GB RAM
   - Large jobs: 4 vCPU, 8 GB RAM
```

**Bottleneck 3: Storage**
```markdown
Problem: 30 TB of build artifacts costing $700/month

Solutions:

1. Lifecycle policies
   - Move to Glacier after 30 days
   - Delete after 90 days
   - Keep production artifacts longer

2. Compression
   - Compress artifacts before upload
   - ~60% size reduction
   - Tradeoff: CPU time

3. Deduplication
   - Same dependencies across builds
   - Use content-addressed storage
   - 40% space savings

4. Caching
   - Cache dependencies (npm, maven, pip)
   - Reduce build time by 70%
   - Reduce storage for intermediate artifacts

Savings: $700/month → $150/month (78% reduction)
```

---

## Common System Design Questions for DevOps

### Question 1: Design a CI/CD Platform

**Functional Requirements:**
```markdown
✅ Support GitHub/GitLab webhooks
✅ Build and test code for multiple languages
✅ Deploy to Kubernetes, EC2, and Salesforce
✅ Support parallel deployments
✅ Provide real-time logs
✅ Support rollback
✅ Send notifications (Slack, email)
```

**Scale:**
```markdown
- 1,000 teams
- 20,000 deployments/day
- Peak: 200 concurrent deployments
- 99.9% uptime SLA
```

**Key Design Decisions:**

**1. Message Queue vs Database Polling**
```markdown
Option A: Database Polling
Workers query database every 5 seconds for new jobs

Pros: Simple, no new infrastructure
Cons: Inefficient, increased DB load, max 5-second delay

Option B: Message Queue (RabbitMQ, SQS)
Webhook → API → Enqueue → Workers consume

Pros: Real-time, decoupled, scales well
Cons: Additional infrastructure, complexity

✅ Recommendation: Option B (Message Queue)
```

**2. Build Isolation**
```markdown
How to prevent builds from interfering with each other?

Option A: Separate VMs per build
Pros: Complete isolation
Cons: Slow (30s+ startup), expensive

Option B: Docker containers
Pros: Fast (less than 1s startup), cheap, standardized
Cons: Less isolation than VMs

Option C: Kubernetes pods (Docker inside pod)
Pros: Orchestration, auto-scaling, resource management
Cons: Complexity

✅ Recommendation: Option C (Kubernetes pods)
```

**3. Log Storage**
```markdown
20,000 deployments/day × 10 MB logs = 200 GB/day

Option A: Database
Pros: Easy to query
Cons: Expensive at scale, slow for large logs

Option B: Object storage (S3) + search (Elasticsearch)
Pros: Cheap, fast full-text search
Cons: More complex

✅ Recommendation: Option B
- Store raw logs in S3
- Index in Elasticsearch for search
- Stream logs via WebSocket during build
```

**Architecture:**
```
┌──────────┐
│  GitHub  │ Webhook
└────┬─────┘
     │
     ▼
┌─────────────────┐
│   API Gateway   │
│  (Auth, Rate    │
│   Limiting)     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│   API Servers   │ (Create job, validate)
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Message Queue  │ (SQS, RabbitMQ)
└────┬────────────┘
     │
     ├──────────────┐
     │              │
     ▼              ▼
┌──────────┐   ┌──────────┐
│ Worker 1 │   │ Worker N │ (Kubernetes pods)
└────┬─────┘   └────┬─────┘
     │              │
     ├──────────────┤
     │              │
     ▼              ▼
┌─────────────────────────┐
│    Object Storage       │ (S3 - artifacts, logs)
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│    Elasticsearch        │ (Log search)
└─────────────────────────┘

Database: PostgreSQL (metadata)
Cache: Redis (job status)
Monitoring: Datadog, Prometheus
```

**Deep Dive: Deployment Strategy**
```markdown
How to deploy without downtime?

Blue-Green Deployment:
1. Deploy to "green" environment (v2)
2. Run smoke tests on green
3. Switch load balancer from blue (v1) to green (v2)
4. Keep blue around for 1 hour for rollback
5. If no issues, decommission blue

Rollback strategy:
- If green fails smoke tests → abort, stay on blue
- If green has issues in production → switch LB back to blue
- Max 30 seconds downtime during switch
```

**Monitoring:**
```markdown
Key metrics:
- Deployment success rate (target: 95%+)
- Average deployment time (target: less than 10 minutes)
- Queue depth (alert if more than 50)
- Worker utilization (target: 60-80%)
- Failed deployments per day (alert if more than 10%)

Alerts:
- Deployment failure rate more than 10% → page on-call
- Queue depth more than 100 → auto-scale workers
- API latency more than 1s → investigate
```

---

### Question 2: Design a Log Aggregation System

**Requirements:**
```markdown
Functional:
- Collect logs from 10,000 servers
- Full-text search
- Real-time streaming
- Retention: 30 days hot, 365 days cold

Scale:
- 10,000 servers × 1 GB/day = 10 TB/day
- 300 TB/month
- 100,000 queries per day
```

**Architecture:**

```
┌───────────┐  ┌───────────┐  ┌───────────┐
│  Server 1 │  │  Server 2 │  │ Server N  │
│  (Agent)  │  │  (Agent)  │  │  (Agent)  │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │
      └──────────────┴──────────────┘
                     │
                     ▼
      ┌──────────────────────────────┐
      │     Kafka / Kinesis          │ (Message buffer)
      │   (10 TB/day throughput)     │
      └──────────────┬───────────────┘
                     │
           ┌─────────┴──────────┐
           │                    │
           ▼                    ▼
    ┌─────────────┐      ┌─────────────┐
    │  Consumer   │      │  Consumer   │ (Process, parse, enrich)
    │   Group 1   │      │   Group 2   │
    └──────┬──────┘      └──────┬──────┘
           │                    │
           └─────────┬──────────┘
                     │
                     ▼
           ┌──────────────────┐
           │  Elasticsearch   │ (Hot storage - 30 days)
           │  (10 node cluster)│
           └────────┬─────────┘
                    │
                    ▼
           ┌──────────────────┐
           │     S3 / Glacier │ (Cold storage - 365 days)
           └──────────────────┘
```

**Key Design Decisions:**

**1. How to handle spikes?**
```markdown
Problem: During deployment, logs spike 10x

Solution: Kafka as buffer
- Kafka retains messages for 7 days
- Consumers process at their own pace
- If consumers fall behind, they catch up later
- Prevents data loss

Sizing:
- Normal: 10 TB/day = 417 GB/hour
- Spike: 4.17 TB/hour
- Kafka retention: 7 days × 10 TB = 70 TB
```

**2. How to search efficiently?**
```markdown
Option A: Search all 30 days of data
Problem: Slow (30+ seconds)

Option B: Time-based indices
- Create index per day: logs-2024-01-15
- Search last 7 days only (default)
- Shard by time range

Query optimization:
- Most queries: last 24 hours (1 index)
- Common queries: last 7 days (7 indices)
- Rare queries: last 30 days (30 indices)

Result: 95% of queries under 1 second
```

**3. Cost optimization?**
```markdown
Hot tier (Elasticsearch):
- 30 days × 10 TB/day = 300 TB
- Cost: ~$30K/month

Cold tier (S3 + Athena for querying):
- 365 days × 10 TB/day = 3.65 PB
- S3 Standard: $75K/month
- S3 Glacier: $4K/month

Strategy:
- Move to S3 Glacier after 30 days
- Use Athena for rare historical queries
- Total cost: $30K (hot) + $4K (cold) = $34K/month
- vs keeping all in ES: $360K/month (10x savings)
```

---

### Question 3: Design a Secrets Management System

**Requirements:**
```markdown
- Store API keys, passwords, certificates securely
- Support 10,000 applications
- Secrets rotation
- Audit log of all access
- 99.99% availability (less than 1 hour downtime/year)
```

**Architecture:**

```
┌──────────────┐
│ Application  │
└──────┬───────┘
       │ (TLS)
       ▼
┌──────────────────┐
│   API Gateway    │ (mTLS, authentication)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Secrets API     │ (Authorize, log access)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Encryption     │ (KMS - envelope encryption)
│   Service        │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Database       │ (Encrypted secrets)
│  (PostgreSQL)    │
└──────────────────┘

Separate:
┌──────────────────┐
│   Audit Log      │ (Who accessed what, when)
│  (Immutable)     │
└──────────────────┘
```

**Key Design Decisions:**

**1. Encryption Strategy**
```markdown
Envelope Encryption:

1. Master key stored in AWS KMS (Hardware Security Module)
2. For each secret:
   - Generate data encryption key (DEK) using KMS
   - Encrypt secret with DEK
   - Encrypt DEK with master key
   - Store encrypted secret + encrypted DEK

Rotation:
- Rotate data keys daily
- Rotate master key yearly
- Zero-downtime rotation
```

**2. High Availability**
```markdown
Multi-region setup:

Region 1 (Primary):        Region 2 (Backup):
┌─────────────┐           ┌─────────────┐
│  DB Primary │──Replica─→│ DB Replica  │
└─────────────┘           └─────────────┘

Auto-failover:
- If Region 1 down → failover to Region 2
- RTO: 2 minutes
- RPO: 0 (synchronous replication)

Availability calculation:
- Region availability: 99.99%
- Two regions: 1 - (0.0001)² = 99.9999% (5 nines)
```

**3. Access Control**
```markdown
RBAC Model:

Application "payment-service":
- Can read: payment-api-key, stripe-secret
- Cannot read: database-password, ssh-keys

Implementation:
1. App authenticates with mTLS certificate
2. Certificate contains app identity
3. Check policy: Does "payment-service" have read access to "stripe-secret"?
4. Log access (app, secret, timestamp, IP)
5. Return decrypted secret

Audit:
- Immutable audit log
- Who, what, when, from where
- Alert on suspicious access patterns
```

---

## Advanced Topics

### Scalability Patterns

**1. Horizontal Scaling**
```markdown
Add more servers instead of bigger servers

Stateless services:
┌────┐ ┌────┐ ┌────┐
│ S1 │ │ S2 │ │ S3 │ (Each server identical)
└────┘ └────┘ └────┘

Load balancer distributes requests
Auto-scale based on CPU/memory/requests

Best for: APIs, workers, web servers
```

**2. Caching**
```markdown
Reduce database load

Layers:
1. Browser cache (static assets)
2. CDN (images, CSS, JS)
3. Application cache (Redis, Memcached)
4. Database query cache

Example:
Request for user profile:
1. Check Redis cache
2. If miss, query database
3. Store in Redis for 5 minutes
4. Return to client

Result: 90% of requests served from cache
```

**3. Database Sharding**
```markdown
Split data across multiple databases

Horizontal sharding (split by key):
Users A-M → Shard 1
Users N-Z → Shard 2

Vertical sharding (split by table):
Users table → DB 1
Orders table → DB 2

Trade-offs:
✅ Scales writes
✅ Reduces single DB load
❌ Complex queries (joins across shards)
❌ Transactions across shards difficult
```

**4. Asynchronous Processing**
```markdown
Don't make users wait

Synchronous (bad):
User uploads file → Process (30s) → Response
User waits 30 seconds

Asynchronous (good):
User uploads file → Enqueue job → Response (1s)
Job processes in background
User gets notification when done

Implementation:
- Job queue (SQS, RabbitMQ)
- Worker pool
- WebSocket for real-time updates
```

### Reliability Patterns

**1. Circuit Breaker**
```markdown
Prevent cascading failures

States:
- Closed: Requests go through normally
- Open: Fast fail (don't even try)
- Half-Open: Try one request (test if recovered)

Example:
1. Payment API starts failing (timeout)
2. After 5 failures → Circuit opens
3. Return cached response or error immediately
4. After 30 seconds → Try one request
5. If success → Circuit closes
6. If failure → Circuit stays open

Prevents: System from overwhelming failed dependency
```

**2. Retry with Exponential Backoff**
```markdown
Retry failed requests with increasing delays

Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
Attempt 4: Wait 4 seconds
Attempt 5: Wait 8 seconds
Give up after 5 attempts

Add jitter (randomness) to prevent thundering herd

Implementation:
delay = min(max_delay, base_delay * 2^attempt + random(0, 1000ms))
```

**3. Health Checks**
```markdown
Detect and remove unhealthy instances

Types:
1. Liveness: Is the service running?
2. Readiness: Can the service handle requests?

Example:
GET /health
Response:
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "cache": "ok",
    "disk_space": "ok"
  }
}

Load balancer checks every 10 seconds
If 3 consecutive failures → Remove from rotation
```

**4. Rate Limiting**
```markdown
Prevent abuse and overload

Token bucket algorithm:
- Bucket starts with 100 tokens
- Each request consumes 1 token
- Bucket refills at 10 tokens/second
- If bucket empty → Rate limit (429 error)

Per-user limits:
- Free tier: 100 requests/minute
- Paid tier: 1,000 requests/minute
- Enterprise: 10,000 requests/minute

Prevents: DDoS, abuse, cascading failures
```

---

## Interview Tips

### Do's ✅

1. **Ask clarifying questions**
   - Don't assume anything
   - Understand scale and requirements
   - "How many users?" "What's the SLA?"

2. **Start simple, then scale**
   - Begin with basic design
   - Then: "Here's how we'd scale to 1M users..."

3. **Discuss trade-offs**
   - "We could use A or B. A is simpler but B scales better."
   - Show you understand pros and cons

4. **Use numbers**
   - Back-of-the-envelope calculations
   - "At 1,000 req/sec, we'd need X servers"

5. **Draw diagrams**
   - Use whiteboard effectively
   - Clear boxes and arrows
   - Label components

6. **Discuss reliability**
   - What happens if X fails?
   - How do we monitor?
   - How do we recover?

### Don'ts ❌

1. **Don't jump into implementation**
   - Start with requirements
   - High-level design first

2. **Don't over-engineer**
   - YAGNI (You Aren't Gonna Need It)
   - Start with MVP, then scale

3. **Don't be silent**
   - Think out loud
   - Explain your reasoning

4. **Don't ignore interviewer hints**
   - They're trying to guide you
   - If they ask about X, discuss X

5. **Don't say "I don't know" and stop**
   - Make educated guess
   - Explain your thinking

### Common Mistakes

```markdown
❌ Not asking about scale
Fix: Always ask "How many users/requests?"

❌ Single point of failure
Fix: Discuss redundancy, failover

❌ Ignoring costs
Fix: "This will cost ~$X/month, worth it for reliability"

❌ Not considering monitoring
Fix: Discuss metrics, alerts, dashboards

❌ Overusing buzzwords
Fix: Explain concepts clearly, use buzzwords when appropriate
```

---

## Practice Problems

### Easy (30 minutes each)

1. Design a URL shortener (bit.ly)
2. Design a metrics dashboard
3. Design a rate limiter
4. Design a simple key-value store

### Medium (45 minutes each)

1. Design a CI/CD platform (covered above)
2. Design a log aggregation system (covered above)
3. Design a secrets management system (covered above)
4. Design a distributed cron job scheduler
5. Design a file backup system

### Hard (60 minutes each)

1. Design a multi-region disaster recovery system
2. Design a global content delivery network (CDN)
3. Design a distributed database
4. Design a container orchestration platform (like Kubernetes)
5. Design a monitoring system for 100,000 servers

---

## Resources

**Books:**
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "System Design Interview" by Alex Xu (Vol 1 & 2)
- "Site Reliability Engineering" by Google

**Websites:**
- [System Design Primer](https://github.com/donnemartin/system-design-primer) (GitHub)
- [High Scalability](http://highscalability.com/) - Real-world architectures
- [AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/)

**Practice:**
- [Pramp](https://www.pramp.com/) - Free mock interviews
- [interviewing.io](https://interviewing.io/) - Mock interviews with engineers
- [Grokking the System Design Interview](https://www.educative.io/courses/grokking-the-system-design-interview)

**YouTube Channels:**
- Gaurav Sen - System Design
- Tech Dummies - System Design simplified
- ByteByteGo - System design in under 10 minutes

---

## Final Checklist

Before your system design interview:

```markdown
☐ Reviewed 10+ common system design questions
☐ Practiced whiteboarding diagrams
☐ Comfortable with back-of-the-envelope calculations
☐ Can discuss trade-offs for different approaches
☐ Understand CAP theorem, consistency models
☐ Know scalability patterns (caching, sharding, load balancing)
☐ Understand reliability patterns (circuit breaker, retry, health checks)
☐ Practiced thinking out loud
☐ Reviewed real-world architectures (Netflix, Uber, etc.)
☐ Did 3+ mock interviews

Good luck! 🚀
```

**Remember**: System design interviews are about communication and trade-offs, not perfect answers. Show your thought process and be ready to discuss alternatives!
