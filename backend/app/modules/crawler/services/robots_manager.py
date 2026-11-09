"""BlogNexa AI - Robots.txt Rules Parser and Politeness Manager."""

import time
from typing import Dict, List, Optional, Tuple


class RobotsRules:
    def __init__(self, sitemaps: List[str], allow_rules: List[str], disallow_rules: List[str], crawl_delay: Optional[float] = None) -> None:
        self.sitemaps = sitemaps
        # Sort rules so longer prefixes match first
        self.allow_rules = sorted(allow_rules, key=len, reverse=True)
        self.disallow_rules = sorted(disallow_rules, key=len, reverse=True)
        self.crawl_delay = crawl_delay
        self.fetched_at = time.time()

    def is_allowed(self, path: str) -> bool:
        """Evaluate if the path is permitted according to robots.txt rules."""
        if not path.startswith("/"):
            path = "/" + path

        # If any allow rule matches and is longer or equal to disallow, it's allowed
        for allow in self.allow_rules:
            if path.startswith(allow):
                return True

        for disallow in self.disallow_rules:
            if disallow == "":
                continue  # Disallow: (empty) means everything allowed
            if path.startswith(disallow):
                return False

        return True


class RobotsManager:
    def __init__(self, cache_ttl_seconds: int = 3600) -> None:
        self._cache: Dict[str, Tuple[RobotsRules, float]] = {}
        self.cache_ttl = cache_ttl_seconds

    def parse_robots_txt(self, content: str, target_user_agent: str = "BlogNexaBot") -> RobotsRules:
        """Parse raw robots.txt content for target User-Agent or fallback to wildcard '*'."""
        sitemaps: List[str] = []
        user_agent_rules: Dict[str, Dict[str, List[str]]] = {}
        crawl_delays: Dict[str, float] = {}

        current_agents: List[str] = []
        last_directive: str = ""

        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            if ":" not in line:
                continue

            directive, value = line.split(":", 1)
            directive = directive.strip().lower()
            value = value.strip()

            if directive == "sitemap":
                if value and value not in sitemaps:
                    sitemaps.append(value)
                last_directive = "sitemap"
                continue

            if directive == "user-agent":
                agent = value.lower()
                # If preceding directive was not user-agent, this is a new block
                if last_directive != "user-agent":
                    current_agents = []
                current_agents.append(agent)
                if agent not in user_agent_rules:
                    user_agent_rules[agent] = {"allow": [], "disallow": []}
                last_directive = "user-agent"
                continue

            if directive == "crawl-delay":
                try:
                    delay = float(value)
                    for agent in current_agents:
                        crawl_delays[agent] = min(delay, 10.0)
                except ValueError:
                    pass
                last_directive = "crawl-delay"
                continue

            if directive in ("allow", "disallow"):
                for agent in current_agents:
                    if agent not in user_agent_rules:
                        user_agent_rules[agent] = {"allow": [], "disallow": []}
                    user_agent_rules[agent][directive].append(value)
                last_directive = directive

        # Select rules: exact agent match takes precedence, otherwise fallback to '*'
        selected_agent = None
        target_lower = target_user_agent.lower()
        if target_lower in user_agent_rules:
            selected_agent = target_lower
        elif "*" in user_agent_rules:
            selected_agent = "*"

        allow_rules: List[str] = []
        disallow_rules: List[str] = []
        crawl_delay: Optional[float] = None

        if selected_agent:
            allow_rules = user_agent_rules[selected_agent]["allow"]
            disallow_rules = user_agent_rules[selected_agent]["disallow"]
            crawl_delay = crawl_delays.get(selected_agent)

        return RobotsRules(
            sitemaps=sitemaps,
            allow_rules=allow_rules,
            disallow_rules=disallow_rules,
            crawl_delay=crawl_delay
        )

    def get_cached_rules(self, origin: str) -> Optional[RobotsRules]:
        if origin in self._cache:
            rules, expiry = self._cache[origin]
            if time.time() < expiry:
                return rules
        return None

    def cache_rules(self, origin: str, rules: RobotsRules) -> None:
        self._cache[origin] = (rules, time.time() + self.cache_ttl)

    def clear(self) -> None:
        self._cache.clear()


robots_manager = RobotsManager()
