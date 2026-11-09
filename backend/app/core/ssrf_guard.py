"""BlogNexa AI - SSRF Guard and Outbound Egress Validator."""

import ipaddress
import socket
import urllib.parse
from typing import Tuple, Optional


BLOCKED_NETWORKS = [
    # IPv4 Loopback
    ipaddress.ip_network("127.0.0.0/8"),
    # IPv4 Cloud Metadata & Link-Local
    ipaddress.ip_network("169.254.0.0/16"),
    # RFC 1918 Private Ranges
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    # Carrier Grade NAT
    ipaddress.ip_network("100.64.0.0/10"),
    # Documentation & Test Ranges
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    # Multicast & Broadcast
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6 Loopback
    ipaddress.ip_network("::1/128"),
    # IPv6 Link-Local
    ipaddress.ip_network("fe80::/10"),
    # IPv6 Unique Local Address (Private)
    ipaddress.ip_network("fc00::/7"),
    # IPv6 Multicast
    ipaddress.ip_network("ff00::/8"),
]


def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Check if an IP address falls within any blocked network range."""
    for network in BLOCKED_NETWORKS:
        if ip in network:
            return True
    return False


def validate_target_url(url: str) -> Tuple[bool, Optional[str]]:
    """
    Validate target URL against SSRF threats.
    Returns: (is_safe: bool, error_message: Optional[str])
    """
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False, "Malformed destination URL"

    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        return False, f"Forbidden scheme: {scheme}. Only http and https are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "Missing destination hostname"

    if hostname.lower() in ("localhost", "ip6-localhost", "ip6-loopback"):
        return False, "Connecting to localhost is forbidden"

    # Resolve IP(s)
    try:
        # Check if hostname is already a raw IP
        raw_ip = ipaddress.ip_address(hostname)
        if is_ip_blocked(raw_ip):
            return False, f"Direct access to restricted IP address {hostname} is forbidden"
        return True, None
    except ValueError:
        # Hostname is a domain name, resolve DNS
        pass

    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False, f"Failed to resolve DNS for host {hostname}"

    resolved_ips = set()
    for item in addr_info:
        sockaddr = item[4]
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            resolved_ips.add(ip_obj)
        except ValueError:
            continue

    if not resolved_ips:
        return False, "No valid IP addresses resolved for host"

    for ip in resolved_ips:
        if is_ip_blocked(ip):
            return False, f"Host {hostname} resolves to restricted IP: {ip}"

    return True, None
