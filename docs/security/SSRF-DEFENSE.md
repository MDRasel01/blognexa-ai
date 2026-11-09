# BlogNexa AI — Anti-SSRF & Web Crawler Egress Architecture

**Document ID:** BNX-SEC-SSRF-004  
**Date:** 2026-11-09  
**Phase:** 04 — Security Foundation Hardening & Secure Backend Connection  
**Status:** Approved  

---

## 1. Threat Definition & Scope

BlogNexa AI contains features that ingest external web resources:
* **Website Intelligence:** Scans client websites to discover internal linking opportunities, sitemaps, and topical clusters.
* **SEO & Competitor Research:** Analyzes external SERP results, competitor articles, and reference links.
* **Knowledge Ingestion:** Imports web documentation and brand guidelines via user-submitted URLs.

Without rigorous Server-Side Request Forgery (SSRF) defenses, an adversary could supply malicious target URLs (e.g. `http://169.254.169.254/latest/meta-data/`) to extract cloud hosting credentials, access local database ports (`http://localhost:5432`), or probe internal network topologies.

---

## 2. Egress Defense-in-Depth Architecture

```
[ Ingest Request: Target URL ]
             |
             v
[ 1. Protocol & Scheme Validation ]
  * Must be 'http' or 'https' (no file://, gopher://, dict://, php://)
  * Port must be standard (80 or 443)
             |
             v
[ 2. Pre-Flight DNS Resolution ]
  * Resolve ALL A and AAAA records via gethostbyname / socket.getaddrinfo
             |
             v
[ 3. IP Blocklist Filtering ]
  * Reject Loopback (127.0.0.0/8, ::1)
  * Reject Link-Local Metadata (169.254.0.0/16, fe80::/10)
  * Reject RFC 1918 Private Ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  * Reject Unique Local IPv6 (fc00::/7)
  * Reject Multicast & Broadcast (224.0.0.0/4, 255.255.255.255)
             |
             v
[ 4. Socket Connection & IP Pinning ]
  * Connect directly to pre-verified IP address with explicit Host SNI header
             |
             v
[ 5. Redirect Traversal Guard ]
  * Follow maximum 2 redirects
  * Re-validate EVERY 'Location' header through Steps 1-3
             |
             v
[ 6. Response Size & MIME Limiting ]
  * Stream response with maximum 10 MB limit; terminate connection if exceeded
  * Safe HTML/XML parsing with entity expansion (XXE) disabled
```

---

## 3. Blocked IP Networks & Destinations

| Network Range | Description | Defense Justification |
| :--- | :--- | :--- |
| `127.0.0.0/8`, `::1/128` | IPv4 & IPv6 Loopback | Prevents access to local services (Redis, PostgreSQL, internal daemons) |
| `169.254.0.0/16`, `fe80::/10` | IPv4 & IPv6 Link-Local | Prevents access to AWS/GCP/Azure instance metadata endpoints |
| `10.0.0.0/8` | Class A Private Network | Prevents probing internal cluster or VPC network services |
| `172.16.0.0/12` | Class B Private Network | Prevents accessing internal Docker / Kubernetes bridge networks |
| `192.168.0.0/16` | Class C Private Network | Prevents local office/home subnet access |
| `0.0.0.0/8` | Current Network ("this" host) | Prevents routing ambiguities |
| `100.64.0.0/10` | Carrier-Grade NAT | Prevents ISP shared infrastructure probing |
| `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` | TEST-NET Documentation | Non-routable public test ranges |
| `224.0.0.0/4`, `ff00::/8` | Multicast | Forbids multicast network probing |

---

## 4. DNS Rebinding Mitigation (TOCTOU Defense)

DNS Rebinding occurs when an attacker's authoritative nameserver responds with a legitimate public IP during the pre-flight check (TTL=0), but returns a private IP (`127.0.0.1` or `169.254.169.254`) when the HTTP client establishes the actual TCP connection.

### Mitigation in BlogNexa AI:
1. **IP Pinning via Transport:** Rather than relying on OS-level double DNS lookups, the client resolves the domain, validates the resolved IP against the blocklist, and explicitly dials that validated IP while supplying the original hostname in HTTP `Host` and TLS SNI headers.
2. **Strict Redirect Re-Resolution:** When a 301/302 redirect response is returned:
   * The client DOES NOT blindly follow the redirect.
   * The redirect target is passed through full hostname resolution and IP blocklist checking.
   * Maximum redirect hops = 2.

---

## 5. Safe Content Parsing & Resource Caps

* **Response Size Cap:** Maximum **10 MB** (10,485,760 bytes). Streams exceeding this size trigger connection closure with `413 Payload Too Large`.
* **Execution Timeout:** Connect timeout = 5 seconds; Read timeout = 15 seconds.
* **Parser Safety:** Disable XML external entity resolution (`LIBXML_NONET` in PHP, `defusedxml` in Python) to eliminate XXE vulnerabilities.
